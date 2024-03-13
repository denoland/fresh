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
  plugins?: Array<FreshPlugin | FreshPlugin[]>;
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
