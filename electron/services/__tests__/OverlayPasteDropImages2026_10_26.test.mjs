// Issue #351: paste / drag-drop images into the overlay attachment tray.
// Source-shape coverage — the live Electron clipboard and Finder drop paths
// are exercised manually; this pins the IPC + renderer wiring so the feature
// cannot silently regress to screenshots-only.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('overlay paste/drop image attach (issue #351)', () => {
  const ipc = read('electron/ipcHandlers.ts');
  const preload = read('electron/preload.ts');
  const main = read('electron/main.ts');
  const ui = read('src/components/NativelyInterface.tsx');

  test('main exposes clipboard and local-file attach helpers', () => {
    assert.match(main, /attachClipboardImage\s*\(/);
    assert.match(main, /attachLocalImageFile\s*\(/);
    assert.match(main, /OVERLAY_PASTE_IMAGE_PREFIX/);
    assert.match(main, /OVERLAY_DROP_IMAGE_PREFIX/);
  });

  test('ipcHandlers registers both attach channels next to screenshot capture', () => {
    assert.match(ipc, /safeHandle\('attach-clipboard-image'/);
    assert.match(ipc, /safeHandle\('attach-local-image'/);
    assert.match(ipc, /attachClipboardImage\(/);
    assert.match(ipc, /attachLocalImageFile\(/);
  });

  test('preload resolves the dropped File to its path with webUtils (File.path is gone since Electron 32)', () => {
    assert.match(preload, /import \{[^}]*\bwebUtils\b[^}]*\} from 'electron'/);
    assert.match(preload, /attachClipboardImage:\s*\(\)\s*=>\s*ipcRenderer\.invoke\('attach-clipboard-image'\)/);
    assert.match(
      preload,
      /attachLocalImage:\s*\(file:\s*File\)\s*=>\s*ipcRenderer\.invoke\('attach-local-image',\s*webUtils\.getPathForFile\(file\)\)/,
    );
    assert.doesNotMatch(ui, /\.path\b[^\n]*dataTransfer|file\.path/);
  });

  test('main checks a dropped file is a file under the size cap before reading it', () => {
    const body = main.slice(main.indexOf('public async attachLocalImageFile('), main.indexOf('public async attachLocalImageFile(') + 900);
    assert.match(body, /stat\.isFile\(\)/);
    assert.match(body, /OVERLAY_ATTACH_IMAGE_MAX_BYTES/);
    assert.ok(body.indexOf('stat.size') < body.indexOf('readFile'), 'size is checked before the file is read');
  });

  test('overlay input pastes images, drops files, and text wins over an image', () => {
    assert.match(ui, /imageFilesFromDrop/);
    assert.match(ui, /attachClipboardImage/);
    assert.match(ui, /attachLocalImage/);
    assert.match(ui, /onPaste=\{/);
    assert.match(ui, /onDrop=\{/);
    assert.match(ui, /onDragOver=\{/);
    // Office apps copy a picture beside the text: the text must be pasted.
    const onPaste = ui.slice(ui.indexOf('onPaste={'), ui.indexOf('onPaste={') + 900);
    assert.ok(
      onPaste.indexOf("getData('text/plain')") < onPaste.indexOf('electronAPI.attachClipboardImage'),
      'clipboard text must be checked before an image is attached',
    );
    const stealthV = ui.slice(ui.indexOf("editLetter === 'v'"), ui.indexOf("editLetter === 'v'") + 1400);
    assert.ok(
      stealthV.indexOf('electronAPI.stealthReadClipboard') < stealthV.indexOf('electronAPI.attachClipboardImage'),
      'stealth Ctrl+V must paste clipboard text before trying an image',
    );
  });
});
