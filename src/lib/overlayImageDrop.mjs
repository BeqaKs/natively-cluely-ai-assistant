/**
 * The dropped files the overlay can attach (issue #351): PNG, JPEG and WebP,
 * by name. Electron 32 removed `File.path`; preload's attachLocalImage turns
 * each File into its path with webUtils.getPathForFile.
 *
 * @template {{ name?: unknown }} F
 * @param {ArrayLike<F> | null | undefined} files
 * @param {(name: string) => boolean} [isImageName]
 * @returns {F[]}
 */
export function imageFilesFromDrop(files, isImageName = defaultIsImageName) {
  if (!files || files.length === 0) return [];
  return Array.from(files).filter((file) => isImageName(typeof file?.name === 'string' ? file.name : ''));
}

function defaultIsImageName(name) {
  return /\.(png|jpe?g|webp)$/i.test(name);
}
