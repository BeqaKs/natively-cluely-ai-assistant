import assert from 'node:assert/strict';
import { test } from 'node:test';
import { imagePathsFromDropFiles } from '../overlayImageDrop.mjs';

test('imagePathsFromDropFiles keeps Electron File.path image files only', () => {
  const files = [
    { name: 'a.png', path: '/tmp/a.png' },
    { name: 'b.txt', path: '/tmp/b.txt' },
    { name: 'c.webp', path: '' },
    { name: 'd.jpeg', path: 'C:\\Users\\x\\d.jpeg' },
  ];
  assert.deepEqual(imagePathsFromDropFiles(files), ['/tmp/a.png', 'C:\\Users\\x\\d.jpeg']);
});

test('imagePathsFromDropFiles tolerates empty input', () => {
  assert.deepEqual(imagePathsFromDropFiles(null), []);
  assert.deepEqual(imagePathsFromDropFiles([]), []);
});
