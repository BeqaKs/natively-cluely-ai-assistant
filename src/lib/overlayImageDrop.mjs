/**
 * Extract absolute image paths from a drag-drop event for overlay attach
 * (issue #351). Electron exposes `File.path`; browsers do not.
 *
 * @param {FileList | File[] | null | undefined} files
 * @param {(name: string) => boolean} [isImageName]
 * @returns {string[]}
 */
export function imagePathsFromDropFiles(files, isImageName = defaultIsImageName) {
  if (!files || files.length === 0) return [];
  const list = Array.from(files);
  const paths = [];
  for (const file of list) {
    const name = typeof file?.name === 'string' ? file.name : '';
    if (!isImageName(name)) continue;
    const filePath = typeof file?.path === 'string' ? file.path : '';
    if (filePath) paths.push(filePath);
  }
  return paths;
}

function defaultIsImageName(name) {
  return /\.(png|jpe?g|webp)$/i.test(name);
}
