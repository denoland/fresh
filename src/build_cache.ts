export const BUILD_CACHE_VERSION_1 = 1;

export interface StaticFileInfo {
  generated: boolean;
  hash: string | null;
}

export interface BuildCacheSnapshot {
  version: number;
  staticFiles: Record<string, StaticFileInfo>;
}

export interface BuildCache {
  addFile(pathname: string, hash: string | null): void;
  getFileInfo(pathname: string): StaticFileInfo | null;
}

export class FreshBuildCache implements BuildCache {
  #files = new Map<string, StaticFileInfo | null>();

  constructor(snapshot: BuildCacheSnapshot | null) {
    if (snapshot !== null) {
      const files = Object.keys(snapshot.staticFiles);
      for (let i = 0; i < files.length; i++) {
        const pathname = files[i];
        this.#files.set(pathname, snapshot.staticFiles[pathname]);
      }
    }
  }

  addFile(pathname: string, hash: string | null): void {
    const info: StaticFileInfo = { generated: true, hash };
    this.#files.set(pathname, info);
  }

  getFileInfo(pathname: string): StaticFileInfo | null {
    const info = this.#files.get(pathname);
    return info === undefined ? null : info;
  }
}
