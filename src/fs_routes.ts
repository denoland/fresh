import type { AnyComponent } from "preact";
import type { MaybeLazy, Route, RouteConfig } from "./types.ts";
import type { HandlerByMethod, RouteHandler } from "./handlers.ts";
import type { MiddlewareFn } from "./middlewares/mod.ts";
import type { AsyncAnyComponent } from "./render.ts";
import { type HandlerFn, isHandlerByMethod } from "./handlers.ts";
import type { PageProps } from "./render.ts";
import {
  type Command,
  CommandType,
  newAppCmd,
  newErrorCmd,
  newLayoutCmd,
  newMiddlewareCmd,
  newNotFoundCmd,
  newRouteCmd,
} from "./commands.ts";
import { isLazy } from "./utils.ts";

export interface FreshFsMod<State> {
  config?: RouteConfig;
  handler?: RouteHandler<unknown, State> | HandlerFn<unknown, State>[];
  handlers?: RouteHandler<unknown, State>;
  default?:
    | AnyComponent<PageProps<unknown, State>>
    | AsyncAnyComponent<PageProps<unknown, State>>;
}

export interface FsRouteFile<State> {
  id: string;
  filePath: string;
  mod: MaybeLazy<FreshFsMod<State>>;
  pattern: string;
  type: CommandType;
  routePattern: string;
  overrideConfig: RouteConfig | undefined;
}

// deno-lint-ignore no-explicit-any
function isFreshFile<State>(mod: any): mod is FreshFsMod<State> {
  if (mod === null || typeof mod !== "object") return false;

  return typeof mod.default === "function" ||
    typeof mod.config === "object" || typeof mod.handlers === "object" ||
    typeof mod.handlers === "function" || typeof mod.handler === "object" ||
    typeof mod.handler === "function";
}

export interface FsRoutesOptions {
  /**
   * Parent directory for the `/routes` and `/islands` folders.
   *
   * By default, the `root` config option of the provided app is used.
   * @default app.config.root
   */
  dir?: string;
  ignoreFilePattern?: RegExp[];
  loadRoute: (path: string) => Promise<unknown>;
}

export function fsItemsToCommands<State>(
  items: FsRouteFile<State>[],
): Command<State>[] {
  const commands: Command<State>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { filePath, type, mod: rawMod, pattern, routePattern } = item;

    switch (type) {
      case CommandType.Middleware: {
        if (isLazy(rawMod)) continue;
        const { handlers, mod } = validateFsMod(filePath, rawMod);

        let middlewares = (handlers ?? mod.default) as unknown as
          | MiddlewareFn<State>
          | MiddlewareFn<State>[]
          | HandlerByMethod<unknown, State> ??
          null;
        if (middlewares === null) continue;

        if (isHandlerByMethod(middlewares)) {
          warnInvalidRoute(
            `Middleware does not support object handlers with GET, POST, etc. in ${filePath}`,
          );
          continue;
        }

        if (!Array.isArray(middlewares)) {
          middlewares = [middlewares];
        }

        commands.push(newMiddlewareCmd(pattern, middlewares, true));
        continue;
      }
      case CommandType.Layout: {
        const { handlers, mod } = validateFsMod<State>(filePath, rawMod);
        if (handlers !== null) {
          warnInvalidRoute("Layout does not support handlers");
        }
        if (!mod.default) continue;

        commands.push(newLayoutCmd(pattern, mod.default, mod.config, true));
        continue;
      }
      case CommandType.Error: {
        const { handlers, mod } = validateFsMod<State>(filePath, rawMod);
        commands.push(newErrorCmd(
          pattern,
          {
            component: mod.default ?? undefined,
            config: mod.config ?? undefined,
            // deno-lint-ignore no-explicit-any
            handler: (handlers as any) ?? undefined,
          },
          true,
        ));
        continue;
      }
      case CommandType.NotFound: {
        const { handlers, mod } = validateFsMod<State>(filePath, rawMod);
        commands.push(newNotFoundCmd({
          config: mod.config,
          component: mod.default,
          // deno-lint-ignore no-explicit-any
          handler: handlers as any ?? undefined,
        }));
        continue;
      }
      case CommandType.App: {
        const { mod } = validateFsMod<State>(filePath, rawMod);
        if (mod.default === undefined) continue;

        commands.push(newAppCmd(mod.default));
        continue;
      }
      case CommandType.Route: {
        let normalized;
        if (isLazy(rawMod)) {
          normalized = async () => {
            const result = await rawMod();
            return normalizeRoute(filePath, result, routePattern);
          };
        } else {
          normalized = normalizeRoute(filePath, rawMod, routePattern);
        }

        commands.push(
          newRouteCmd(pattern, normalized, item.overrideConfig, false),
        );
        continue;
      }
      case CommandType.Handler:
        throw new Error(`Not supported`);
      case CommandType.FsRoute:
        throw new Error(`Nested FsRoutes are not supported`);
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }

  return commands;
}

function warnInvalidRoute(message: string) {
  // deno-lint-ignore no-console
  console.warn(
    `🍋 %c[WARNING] Unsupported route config: ${message}`,
    "color:rgb(251, 184, 0)",
  );
}

const APP_REG = /_app(?!\.[tj]sx?)?$/;

/**
 * Sort route paths where special Fresh files like `_app`,
 * `_layout` and `_middleware` are sorted in front.
 */
export function sortRoutePaths(a: string, b: string) {
  // The `_app` route should always be the first
  if (APP_REG.test(a)) return -1;
  else if (APP_REG.test(b)) return 1;

  const aLen = a.length;
  const bLen = b.length;

  let segment = false;
  let aIdx = 0;
  let bIdx = 0;
  for (; aIdx < aLen && bIdx < bLen; aIdx++, bIdx++) {
    const charA = a.charAt(aIdx);
    const charB = b.charAt(bIdx);

    // When comparing a grouped route with a non-grouped one, we
    // need to skip over the group name to effectively compare the
    // actual route.
    if (charA === "(" && charB !== "(") {
      if (charB == "[") return -1;
      return 1;
    } else if (charB === "(" && charA !== "(") {
      if (charA == "[") return 1;
      return -1;
    }

    if (charA === "/" || charB === "/") {
      segment = true;

      // If the other path doesn't close the segment
      // then we don't need to continue
      if (charA !== "/") return 1;
      if (charB !== "/") return -1;

      continue;
    }

    if (segment) {
      segment = false;

      const scoreA = getRoutePathScore(charA, a, aIdx);
      const scoreB = getRoutePathScore(charB, b, bIdx);
      if (scoreA === scoreB) {
        if (charA !== charB) {
          // TODO: Do we need localeSort here or is this good enough?
          return charA < charB ? 0 : 1;
        }
        continue;
      }

      return scoreA > scoreB ? -1 : 1;
    }

    if (charA !== charB) {
      // TODO: Do we need localeSort here or is this good enough?
      return charA < charB ? 0 : 1;
    }

    // If we're at the end of A or B, then we assume that the longer
    // path is more specific
    if (aIdx === aLen - 1 && bIdx < bLen - 1) {
      return 1;
    } else if (bIdx === bLen - 1 && aIdx < aLen - 1) {
      return -1;
    }
  }

  return 0;
}

/**
 * Assign a score based on the first two characters of a path segment.
 * The goal is to sort `_middleware` and `_layout` in front of everything
 * and `[` or `[...` last respectively.
 */
function getRoutePathScore(char: string, s: string, i: number): number {
  if (char === "_") {
    if (i + 1 < s.length) {
      if (s[i + 1] === "e") return 4;
      if (s[i + 1] === "m") return 6;
    }
    return 5;
  } else if (char === "[") {
    if (i + 1 < s.length && s[i + 1] === ".") {
      return 0;
    }
    return 1;
  }

  if (
    i + 4 === s.length - 1 && char === "i" && s[i + 1] === "n" &&
    s[i + 2] === "d" && s[i + 3] === "e" && s[i + 4] === "x"
  ) {
    return 3;
  }

  return 2;
}

export function validateFsMod<State>(
  filePath: string,
  mod: unknown,
): {
  handlers: RouteHandler<unknown, State> | HandlerFn<unknown, State>[] | null;
  mod: FreshFsMod<State>;
} {
  if (!isFreshFile<State>(mod)) {
    throw new Error(
      `Expected a route, middleware, layout or error template, but couldn't find relevant exports in: ${filePath}`,
    );
  }

  const handlers = mod.handlers ?? mod.handler ?? null;
  if (typeof handlers === "function" && handlers.length > 1) {
    throw new Error(
      `Handlers must only have one argument but found more than one. Check the function signature in: ${filePath}`,
    );
  }

  return { handlers, mod };
}

function normalizeRoute<State>(
  filePath: string,
  rawMod: FreshFsMod<State>,
  routePattern: string,
): Route<State> {
  const { handlers, mod } = validateFsMod<State>(filePath, rawMod);

  return {
    config: {
      ...mod.config,
      routeOverride: mod.config?.routeOverride ?? routePattern,
    },
    // deno-lint-ignore no-explicit-any
    handler: (handlers as any) ?? undefined,
    component: mod.default,
  };
}
