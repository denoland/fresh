export type Method = "HEAD" | "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface Route<T> {
  path: string | URLPattern;
  method: Method | "ALL";
  handlers: T[];
}

export interface RouteResult<T> {
  params: Record<string, string>;
  handlers: T[][];
  methodMatch: boolean;
  patternMatch: boolean;
}

export interface Router<T> {
  _routes: Route<T>[];
  add(
    method: Method | "ALL",
    pathname: string | URLPattern,
    handlers: T[],
  ): void;
  match(method: Method, url: URL): RouteResult<T>;
}

export const IS_PATTERN = /[*:{}+?()]/;

export function mergePaths(a: string, b: string) {
  if (a === "" || a === "/" || a === "*") return b;
  if (b === "/") return a;
  if (a.endsWith("/")) {
    return a.slice(0, -1) + b;
  } else if (!b.startsWith("/")) {
    return a + "/" + b;
  }
  return a + b;
}

export class UrlPatternRouter<T> implements Router<T> {
  readonly _routes: Route<T>[] = [];

  add(method: Method | "ALL", pathname: string | URLPattern, handlers: T[]) {
    if (
      typeof pathname === "string" && pathname !== "*" &&
      IS_PATTERN.test(pathname)
    ) {
      this._routes.push({
        path: new URLPattern({ pathname }),
        handlers,
        method,
      });
    } else {
      this._routes.push({ handlers, method, path: pathname });
    }
  }

  match(method: Method, url: URL): RouteResult<T> {
    const result: RouteResult<T> = {
      params: {},
      handlers: [],
      methodMatch: false,
      patternMatch: false,
    };

    for (let i = 0; i < this._routes.length; i++) {
      const route = this._routes[i];

      // Fast path for string based routes which are expected
      // to be either wildcard `*` match or an exact pathname match.
      if (
        typeof route.path === "string" &&
        (route.path === "*" || route.path === url.pathname)
      ) {
        result.patternMatch = true;

        if (route.method === "ALL" || route.method === method) {
          result.handlers.push(route.handlers);
          result.methodMatch = true;

          if (route.path === "*" && route.method === "ALL") {
            continue;
          }

          return result;
        }
      } else if (route.path instanceof URLPattern) {
        const match = route.path.exec(url);
        if (match !== null) {
          result.patternMatch = true;

          if (route.method === "ALL" || route.method === method) {
            result.handlers.push(route.handlers);

            // Decode matched params
            for (const [key, value] of Object.entries(match.pathname.groups)) {
              if (value !== undefined) {
                result.params[key] = decodeURI(value);
              }
            }

            result.methodMatch = true;
            return result;
          }
        }
      }
    }

    return result;
  }
}

/**
 * Transform a filesystem URL path to a `path-to-regex` style matcher.
 */
export function pathToPattern(path: string): string {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    if (parts.length === 1) {
      return "/";
    }
    parts.pop();
  }

  let route = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Case: /[...foo].tsx
    if (part.startsWith("[...") && part.endsWith("]")) {
      route += `/:${part.slice(4, part.length - 1)}*`;
      continue;
    }

    // Route groups like /foo/(bar) should not be included in URL
    // matching. They are transparent and need to be removed here.
    // Case: /foo/(bar) -> /foo
    // Case: /foo/(bar)/bob -> /foo/bob
    // Case: /(foo)/bar -> /bar
    if (part.startsWith("(") && part.endsWith(")")) {
      continue;
    }

    // Disallow neighbouring params like `/[id][bar].tsx` because
    // it's ambiguous where the `id` param ends and `bar` begins.
    if (part.includes("][")) {
      throw new SyntaxError(
        `Invalid route pattern: "${path}". A parameter cannot be followed by another parameter without any characters in between.`,
      );
    }

    // Case: /[[id]].tsx
    // Case: /[id].tsx
    // Case: /[id]@[bar].tsx
    // Case: /[id]-asdf.tsx
    // Case: /[id]-asdf[bar].tsx
    // Case: /asdf[bar].tsx
    let pattern = "";
    let groupOpen = 0;
    let optional = false;
    for (let j = 0; j < part.length; j++) {
      const char = part[j];
      if (char === "[") {
        if (part[j + 1] === "[") {
          // Disallow optional dynamic params like `foo-[[bar]]`
          if (part[j - 1] !== "/" && !!part[j - 1]) {
            throw new SyntaxError(
              `Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`,
            );
          }
          groupOpen++;
          optional = true;
          pattern += "{/";
          j++;
        }
        pattern += ":";
        groupOpen++;
      } else if (char === "]") {
        if (part[j + 1] === "]") {
          // Disallow optional dynamic params like `[[foo]]-bar`
          if (part[j + 2] !== "/" && !!part[j + 2]) {
            throw new SyntaxError(
              `Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`,
            );
          }
          groupOpen--;
          pattern += "}?";
          j++;
        }
        if (--groupOpen < 0) {
          throw new SyntaxError(`Invalid route pattern: "${path}"`);
        }
      } else {
        pattern += char;
      }
    }

    route += (optional ? "" : "/") + pattern;
  }

  // Case: /(group)/index.tsx
  if (route === "") {
    route = "/";
  }

  return route;
}
