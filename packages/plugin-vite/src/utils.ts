import * as path from "@std/path";
import type { FsRouteFileNoMod, UniqueNamer } from "fresh/internal-dev";
import type { ImportCheck } from "./plugins/verify_imports.ts";
import type { Plugin } from "vite";
import type {
  CustomPluginOptions,
  PluginContext,
  ResolveIdResult,
} from "rollup";

export const JS_REG = /\.([tj]sx?|[mc]?[tj]s)(\?.*)?$/;
export const JSX_REG = /\.[tj]sx(\?.*)?$/;

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
  checkImports?: ImportCheck[];
}

export type ResolvedFreshViteConfig =
  & Required<
    Omit<FreshViteConfig, "islandSpecifiers">
  >
  & {
    islandSpecByName: Map<string, string>;
    islandNameBySpec: Map<string, string>;
    namer: UniqueNamer;
    isDev: boolean;
  };

export type Filter = {
  id: RegExp | RegExp[];
  env?: "ssr" | "client";
};

export interface PluginBuilder {
  resolve(
    filter: Filter,
    handler: (
      ctx: PluginContext,
      source: string,
      importer: string | undefined,
      options: {
        attributes: Record<string, string>;
        custom?: CustomPluginOptions;
        isEntry: boolean;
      },
    ) => Promise<ResolveIdResult | void> | ResolveIdResult,
  ): void;
  load(id: Filter, handler: Plugin["load"]): void;
  transform(id: Filter, handler: Plugin["transform"]): void;
}

export function newPlugin(
  name: string,
  fn: (builder: PluginBuilder) => void,
): Plugin {
  const state = {
    client: {
      resolve: {
        // filter:
      },
    },
  };

  const clientPlugin: Plugin = {
    name: `${name}:client`,
    sharedDuringBuild: true,
    applyToEnvironment(env) {
      return env.name === "client";
    },
  };
  const ssrPlugin: Plugin = {
    name: `${name}:ssr`,
    sharedDuringBuild: true,
    applyToEnvironment(env) {
      return env.name === "ssr";
    },
  };

  fn({
    resolve(filter, fn) {
      clientPlugin.resolveId = {
        filter: {
          id: filter.id,
        },
        handler: async function (id, importer, options) {
          if (filter.env && !(filter.env === "ssr" && options.ssr)) {
            return;
          }

          return await fn(this, id, importer, options);
        },
      };
    },
    load(filter, fn) {
      clientPlugin.load = {
        filter: {
          id: filter,
        },
        // deno-lint-ignore no-explicit-any
        handler: fn as any,
      };
    },
    transform(filter, fn) {
      clientPlugin.transform = {
        filter: {
          id: filter,
        },
        // deno-lint-ignore no-explicit-any
        handler: fn as any,
      };
    },
  });

  return clientPlugin;
}
