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

  test('preload exposes attachClipboardImage and attachLocalImage', () => {
    assert.match(preload, /attachClipboardImage:\s*\(\)\s*=>\s*ipcRenderer\.invoke\('attach-clipboard-image'\)/);
    assert.match(
      preload,
      /attachLocalImage:\s*\(filePath:\s*string\)\s*=>\s*ipcRenderer\.invoke\('attach-local-image',\s*filePath\)/,
    );
  });

  test('overlay input pastes images, drops files, and stealth Ctrl+V prefers images', () => {
    assert.match(ui, /imagePathsFromDropFiles/);
    assert.match(ui, /attachClipboardImage/);
    assert.match(ui, /attachLocalImage/);
    assert.match(ui, /onPaste=\{/);
    assert.match(ui, /onDrop=\{/);
    assert.match(ui, /onDragOver=\{/);
    // Stealth V tries the image IPC before stealthReadClipboard text paste.
    const stealthV = ui.slice(ui.indexOf("editLetter === 'v'"), ui.indexOf("editLetter === 'v'") + 900);
    assert.match(stealthV, /attachClipboardImage/);
    assert.ok(
      stealthV.indexOf('attachClipboardImage') < stealthV.indexOf('stealthReadClipboard'),
      'clipboard image must be tried before text paste in stealth Ctrl+V',
    );
  });
});
