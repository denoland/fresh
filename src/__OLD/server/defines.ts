import { ComponentChildren } from "preact";
import { AsyncLayout, AsyncRoute, FreshConfig, RouteContext } from "./types.ts";
import { checkAsyncComponent } from "./render.ts";

export function defineConfig(config: FreshConfig): FreshConfig {
  return config;
}

// Route creation helpers
export function defineRoute<
  T,
>(
  fn: (
    req: Request,
    ctx: RouteContext<void, T>,
  ) => ComponentChildren | Response | Promise<ComponentChildren | Response>,
): AsyncRoute<void, T> {
  // deno-lint-ignore no-explicit-any
  if (checkAsyncComponent(fn)) return fn as any;
  // deno-lint-ignore require-await
  return async (req, ctx) => fn(req, ctx);
}

// Layout creation helper
export function defineLayout<T>(
  fn: (
    req: Request,
    ctx: RouteContext<void, T>,
  ) => ComponentChildren | Response | Promise<ComponentChildren | Response>,
): AsyncLayout<void, T> {
  // deno-lint-ignore no-explicit-any
  if (checkAsyncComponent(fn)) return fn as any;
  // deno-lint-ignore require-await
  return async (req, ctx) => fn(req, ctx);
}

// App creation helper
export function defineApp<T>(
  fn: (
    req: Request,
    ctx: RouteContext<void, T>,
  ) => ComponentChildren | Response | Promise<ComponentChildren | Response>,
): AsyncLayout<void, T> {
  // deno-lint-ignore no-explicit-any
  if (checkAsyncComponent(fn)) return fn as any;
  // deno-lint-ignore require-await
  return async (req, ctx) => fn(req, ctx);
}
