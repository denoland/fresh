export type Mode = "dev" | "build" | "prod";

export let MODE: Mode = "prod";

export function setMode(mode: Mode) {
  MODE = mode;
}

export interface FreshPlugin {
  name: string;
}

export interface FreshOptions {
  basePath?: string;
  dir: string;
  load: (path: string) => Promise<unknown>;
  plugins?: Array<FreshPlugin | FreshPlugin[]>; // FIXME: REMOVE
}

export interface InternalFreshOptions {
  basePath: string;
  mode: Mode;
  plugins: FreshPlugin[];
}

export function normalizeOptions(options: FreshOptions): InternalFreshOptions {
  return {
    basePath: options.basePath ?? "",
    mode: MODE,
    plugins: options.plugins?.flat() ?? [],
  };
}
