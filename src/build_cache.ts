export const BUILD_CACHE_VERSION_1 = 1;

export interface BuildCacheSnapshot {
  version: number;
  staticFiles: Record<string, string | null>;
}

export interface BuildCache {
  getStaticFileInfo(pathname: string): string | null;
}

export class FreshBuildCache implements BuildCache {
  #hashes = new Map<string, string | null>();

  constructor(snapshot: BuildCacheSnapshot | null) {
    if (snapshot !== null) {
      const files = Object.keys(snapshot.staticFiles);
      for (let i = 0; i < files.length; i++) {
        const pathname = files[i];
        this.#hashes.set(pathname, snapshot.staticFiles[pathname]);
      }
    }
  }

  getStaticFileInfo(pathname: string): string | null {
    const info = this.#hashes.get(pathname);
    return info === undefined ? null : info;
  }
}
