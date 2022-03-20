// Copyright 2022 denosaurs. All rights reserved. MIT license.

import type { ConnInfo } from "https://deno.land/std@0.128.0/http/server.ts";

export type Handler = (
  req: Request,
  connInfo: ConnInfo,
  state: Record<string, unknown>,
) => Response | Promise<Response>;

/**
 * A handler type for anytime the `MatchHandler` or `other` parameter handler
 * fails
 */
export type ErrorHandler = (
  req: Request,
  connInfo: ConnInfo,
  state: Record<string, unknown>,
  err: unknown,
) => Response | Promise<Response>;

/**
 * A handler type for anytime a method is received that is not defined
 */
export type UnknownMethodHandler = (
  req: Request,
  connInfo: ConnInfo,
  state: Record<string, unknown>,
  knownMethods: string[],
) => Response | Promise<Response>;

/**
 * A handler type for a router path match which gets passed the matched values
 */
export type MatchHandler = (
  req: Request,
  connInfo: ConnInfo,
  state: Record<string, unknown>,
  match: Record<string, string>,
) => Response | Promise<Response>;

/**
 * A record of route paths and `MatchHandler`s which are called when a match is
 * found along with it's values.
 *
 * The route paths follow the path-to-regexp format with the addition of being able
 * to prefix a route with a method name and the `@` sign. For example a route only
 * accepting `GET` requests would look like: `GET@/`.
 */
export type Routes = Record<string, MatchHandler>;

//
export interface MiddlewareHandlerContext<T = Record<string, unknown>>
  extends ConnInfo {
  handle: (state?: Record<string, unknown>) => Promise<Response>;
  state: T;
}

//
export interface Middleware<T = Record<string, unknown>> {
  handler(
    req: Request,
    ctx: MiddlewareHandlerContext<T>,
  ): Response | Promise<Response>;
}

/**
 * A record of middleware paths and `MatchHandler`s which are called when a route
 * path is composed by the path of the middleware.
 */
export type Middlewares = Record<string, Middleware>;

/**
 * The default other handler for the router
 */
export function defaultOtherHandler(_req: Request): Response {
  return new Response(null, {
    status: 404,
  });
}

/**
 * The default error handler for the router
 */
export function defaultErrorHandler(
  _req: Request,
  _connInfo: ConnInfo,
  _state: Record<string, unknown>,
  err: unknown,
): Response {
  console.error(err);

  return new Response(null, {
    status: 500,
  });
}

/**
 * The default unknown method handler for the router
 */
export function defaultUnknownMethodHandler(
  _req: Request,
  _connInfo: ConnInfo,
  _state: Record<string, unknown>,
  knownMethods: string[],
): Response {
  return new Response(null, {
    status: 405,
    headers: {
      Accept: knownMethods.join(", "),
    },
  });
}

export const METHODS = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH",
] as const;

const methodRegex = new RegExp(`(?<=^(?:${METHODS.join("|")}))@`);

/**
 * A simple and tiny router for deno
 *
 * ```
 * import { serve } from "https://deno.land/std/http/server.ts";
 * import { router } from "https://crux.land/router@0.0.6";
 *
 * await serve(
 *   router({
 *     "/": (_req) => new Response("Hello world!", { status: 200 }),
 *   }),
 * );
 * ```
 *
 * @param routes A record of all routes and their corresponding handler functions
 * @param other An optional parameter which contains a handler for anything that
 * doesn't match the `routes` parameter
 * @param error An optional parameter which contains a handler for any time it
 * fails to run the default request handling code
 * @param unknownMethod An optional parameter which contains a handler for any time a method
 * that is not defined is used
 * @returns A deno std compatible request handler
 */
export function router(
  routes: Routes,
  other: Handler = defaultOtherHandler,
  error: ErrorHandler = defaultErrorHandler,
  unknownMethod: UnknownMethodHandler = defaultUnknownMethodHandler,
): Handler {
  return async (req, connInfo, state) => {
    try {
      // route > method > handler
      const internalRoutes: Record<string, Record<string, MatchHandler>> = {};

      // group the method for each route path
      for (const [route, handler] of Object.entries(routes)) {
        const [methodOrPath, path] = route.split(methodRegex);

        if (path) {
          internalRoutes[path] ??= {};
          internalRoutes[path][methodOrPath] = handler;
        } else {
          internalRoutes[methodOrPath] ??= {};
          internalRoutes[methodOrPath]["any"] = handler;
        }
      }

      // identify the route for the given request
      for (const [path, methods] of Object.entries(internalRoutes)) {
        const pattern = new URLPattern({
          pathname: path,
        });
        const res = pattern.exec(req.url);

        if (res !== null) {
          // The route matching the path has been found
          // trying to find the method
          for (const [method, handler] of Object.entries(methods)) {
            if (req.method === method) {
              return await handler(
                req,
                connInfo,
                state,
                res.pathname.groups,
              );
            }
          }
          if (methods["any"]) {
            return await methods["any"](
              req,
              connInfo,
              state,
              res.pathname.groups,
            );
          } else {
            return await unknownMethod(
              req,
              connInfo,
              state,
              Object.keys(methods),
            );
          }
        }
      }

      return await other(req, connInfo, state);
    } catch (err) {
      return error(req, connInfo, state, err);
    }
  };
}
