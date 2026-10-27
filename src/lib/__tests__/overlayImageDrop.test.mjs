import assert from 'node:assert/strict';
import { test } from 'node:test';
import { imageFilesFromDrop } from '../overlayImageDrop.mjs';

test('imageFilesFromDrop keeps PNG, JPEG and WebP files, in order', () => {
  const a = { name: 'a.png' };
  const b = { name: 'b.txt' };
  const c = { name: 'C.WEBP' };
  const d = { name: 'd.jpeg' };
  const e = { name: 'notes.pdf' };
  assert.deepEqual(imageFilesFromDrop([a, b, c, d, e]), [a, c, d]);
});

test('imageFilesFromDrop tolerates empty input and nameless entries', () => {
  assert.deepEqual(imageFilesFromDrop(null), []);
  assert.deepEqual(imageFilesFromDrop([]), []);
  assert.deepEqual(imageFilesFromDrop([{}, { name: 42 }]), []);
});
