import path from "node:path";
import process from "node:process";
import type { UniqueNamer } from "../../src/utils.ts";
import type { FsRouteFileNoMod } from "../../src/dev/dev_build_cache.ts";

export function pathWithRoot(fileOrDir: string, root?: string): string {
  if (path.isAbsolute(fileOrDir)) return fileOrDir;

  if (root === undefined) {
    return path.join(process.cwd(), fileOrDir);
  }

  if (path.isAbsolute(root)) return path.join(root, fileOrDir);

  return path.join(process.cwd(), root, fileOrDir);
}

export interface FreshState {
  namer: UniqueNamer;
  root: string;
  serverEntry: string;
  islandDir: string;
  routeDir: string;
  dev: boolean;
  islands: Map<string, { name: string; chunk: string | null }>;
  // deno-lint-ignore no-explicit-any
  routes: FsRouteFileNoMod<any>[];
  clientOutDir: string;
  serverOutDir: string;
}

export interface ClientSnapshot {
  entry: string;
}

export interface FreshViteConfig {
  serverEntry?: string;
  islandsDir?: string;
  routeDir?: string;
  ignore?: RegExp[];
}

export type ResolvedFreshViteConfig = Required<FreshViteConfig>;
