/**
 * Helpers for paste / drag-drop image attach into the overlay tray (issue #351).
 * Images join the same screenshot queue a capture would, via addExternalImage.
 */

import path from 'node:path';

export const OVERLAY_PASTE_IMAGE_PREFIX = 'paste-';
export const OVERLAY_DROP_IMAGE_PREFIX = 'drop-';
/** Largest dropped file the overlay reads (the phone upload cap is 12 MB). */
export const OVERLAY_ATTACH_IMAGE_MAX_BYTES = 25 * 1024 * 1024;

const EXT_BY_MIME: Record<string, 'png' | 'jpg' | 'webp'> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
};

const EXT_BY_SUFFIX: Record<string, 'png' | 'jpg' | 'webp'> = {
  '.png': 'png',
  '.jpg': 'jpg',
  '.jpeg': 'jpg',
  '.webp': 'webp',
};

/** Map a MIME type from a paste/drop item to a supported image extension. */
export function imageExtFromMime(mime: string | undefined | null): 'png' | 'jpg' | 'webp' | null {
  if (!mime) return null;
  return EXT_BY_MIME[mime.toLowerCase()] ?? null;
}

/** Map a file path suffix to a supported image extension. */
export function imageExtFromPath(filePath: string | undefined | null): 'png' | 'jpg' | 'webp' | null {
  if (!filePath) return null;
  const ext = path.extname(filePath).toLowerCase();
  return EXT_BY_SUFFIX[ext] ?? null;
}

/** True when the path looks like a supported still image for overlay attach. */
export function isOverlayAttachableImagePath(filePath: string): boolean {
  return imageExtFromPath(filePath) !== null;
}
