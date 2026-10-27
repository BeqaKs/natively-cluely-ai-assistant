export declare function imageFilesFromDrop<F extends { name?: unknown }>(
  files: ArrayLike<F> | null | undefined,
  isImageName?: (name: string) => boolean,
): F[];
