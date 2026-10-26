import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  imageExtFromMime,
  imageExtFromPath,
  isOverlayAttachableImagePath,
  OVERLAY_DROP_IMAGE_PREFIX,
  OVERLAY_PASTE_IMAGE_PREFIX,
} from '../overlayImageAttach.ts';

describe('overlayImageAttach (issue #351)', () => {
  test('MIME types map to png/jpg/webp', () => {
    assert.equal(imageExtFromMime('image/png'), 'png');
    assert.equal(imageExtFromMime('image/jpeg'), 'jpg');
    assert.equal(imageExtFromMime('image/webp'), 'webp');
    assert.equal(imageExtFromMime('text/plain'), null);
    assert.equal(imageExtFromMime(''), null);
  });

  test('file suffixes map to png/jpg/webp', () => {
    assert.equal(imageExtFromPath('/tmp/a.PNG'), 'png');
    assert.equal(imageExtFromPath('C:\\Users\\x\\shot.jpeg'), 'jpg');
    assert.equal(imageExtFromPath('diagram.webp'), 'webp');
    assert.equal(imageExtFromPath('notes.pdf'), null);
  });

  test('isOverlayAttachableImagePath gates drop candidates', () => {
    assert.equal(isOverlayAttachableImagePath('/x/y.png'), true);
    assert.equal(isOverlayAttachableImagePath('/x/y.txt'), false);
  });

  test('name prefixes are safe for addExternalImage', () => {
    assert.match(OVERLAY_PASTE_IMAGE_PREFIX, /^[a-z0-9-]+$/i);
    assert.match(OVERLAY_DROP_IMAGE_PREFIX, /^[a-z0-9-]+$/i);
  });
});
