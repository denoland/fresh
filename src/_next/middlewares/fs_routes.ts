export interface FsRoutesOptions {
  loader: (path: string) => Promise<any>;
}

export function fsRoutes(options: FsRoutesOptions) {
}
