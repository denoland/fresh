import * as path from "@std/path";
import type { FsRouteFileNoMod, UniqueNamer } from "fresh/internal-dev";
import type { ImportCheck } from "./plugins/verify_imports.ts";

export const JS_REG = /\.([tj]sx?|[mc]?[tj]s)(\?.*)?$/;
export const JSX_REG = /\.[tj]sx?(\?.*)?$/;

export function pathWithRoot(fileOrDir: string, root?: string): string {
  if (path.isAbsolute(fileOrDir)) return fileOrDir;

  if (root === undefined) {
    return path.join(Deno.cwd(), fileOrDir);
  }

  if (path.isAbsolute(root)) return path.join(root, fileOrDir);

  return path.join(Deno.cwd(), root, fileOrDir);
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
  /** Path to main server entry file. Default: main.ts */
  serverEntry?: string;
  /** Path to main client entry file. Default: client.ts */
  clientEntry?: string;
  /** Path to islands directory. Default: ./islands */
  islandsDir?: string;
  /** Path to routes directory. Default: ./routes */
  routeDir?: string;
  /**
   * Ignore file paths matching any of the provided regexes when
   * crawling the islands and routes directories.
   */
  ignore?: RegExp[];
  /**
   * Treat these specifiers as island files. This is used to declare
   * islands from remote packages.
   */
  islandSpecifiers?: string[];
  /**
   * Controls whether all dependencies of the server should be bundled
   * or if they should be kept as external. Setting this to `true` will
   * bundle all dependencies. The default is `false` for maximum
   * compatibility. Lots of dependencies typically used on the server
   * are written in commonjs and can't be bundled correctly.
   */
  noSsrExternals?: boolean;
  checkImports?: ImportCheck[];
}

export type ResolvedFreshViteConfig =
  & Required<
    Omit<FreshViteConfig, "islandSpecifiers">
  >
  & { islandSpecifiers: Map<string, string>; namer: UniqueNamer };
