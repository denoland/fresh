export type Method =
  | "HEAD"
  | "GET"
  | "POST"
  | "PATCH"
  | "PUT"
  | "DELETE"
  | "OPTIONS";

export type RouteByMethod<T> = {
  [m in Method]: T | null;
};

export interface StaticRouteDef<T> {
  pattern: string | URLPattern;
  byMethod: RouteByMethod<T>;
}

export interface DynamicRouteDef<T> {
  pattern: URLPattern;
  byMethod: RouteByMethod<T>;
}

function newRouteDef<T>(pattern: string): StaticRouteDef<T>;
function newRouteDef<T>(pattern: URLPattern): DynamicRouteDef<T>;
function newRouteDef<T>(
  pattern: string | URLPattern,
): StaticRouteDef<T> | DynamicRouteDef<T> {
  return {
    pattern,
    byMethod: {
      DELETE: null,
      GET: null,
      HEAD: null,
      OPTIONS: null,
      PATCH: null,
      POST: null,
      PUT: null,
    },
  };
}

export interface RouteResult<T> {
  params: Record<string, string>;
  item: T | null;
  methodMatch: boolean;
  pattern: string | null;
}

export interface Router<T> {
  add(method: Method, pathname: string, item: T): void;
  match(method: Method, url: URL): RouteResult<T>;
  getAllowedMethods(pattern: string): string[];
}

export const IS_PATTERN = /[*:{}+?()]/;

const EMPTY: string[] = [];

export class UrlPatternRouter<T> implements Router<T> {
  #statics = new Map<string, StaticRouteDef<T>>();
  #dynamics = new Map<string, DynamicRouteDef<T>>();
  #dynamicArr: DynamicRouteDef<T>[] = [];
  #allowed = new Map<string, Set<string>>();

  getAllowedMethods(pattern: string): string[] {
    const allowed = this.#allowed.get(pattern);
    if (allowed === undefined) return EMPTY;
    return Array.from(allowed);
  }

  add(
    method: Method,
    pathname: string,
    item: T,
  ) {
    let allowed = this.#allowed.get(pathname);
    if (allowed === undefined) {
      allowed = new Set();
      this.#allowed.set(pathname, allowed);
    }
    allowed.add(method);

    let byMethod: RouteByMethod<T>;
    if (IS_PATTERN.test(pathname)) {
      let def = this.#dynamics.get(pathname);
      if (def === undefined) {
        def = newRouteDef(new URLPattern({ pathname }));
        this.#dynamics.set(pathname, def);
        this.#dynamicArr.push(def);
      }

      byMethod = def.byMethod;
    } else {
      let def = this.#statics.get(pathname);
      if (def === undefined) {
        def = newRouteDef(pathname);
        this.#statics.set(pathname, def);
      }

      byMethod = def.byMethod;
    }

    byMethod[method] = item;
  }

  match(method: Method, url: URL): RouteResult<T> {
    const result: RouteResult<T> = {
      params: Object.create(null),
      item: null,
      methodMatch: false,
      pattern: null,
    };

    const staticMatch = this.#statics.get(url.pathname);
    if (staticMatch !== undefined) {
      result.pattern = url.pathname;

      const item = staticMatch.byMethod[method];
      if (item !== null) {
        result.methodMatch = true;
        result.item = item;
      }

      return result;
    }

    for (let i = 0; i < this.#dynamicArr.length; i++) {
      const route = this.#dynamicArr[i];

      const match = route.pattern.exec(url);
      if (match === null) continue;

      result.pattern = route.pattern.pathname;

      const item = route.byMethod[method];
      if (item !== null) {
        result.methodMatch = true;
        result.item = item;

        // Decode matched params
        for (const [key, value] of Object.entries(match.pathname.groups)) {
          result.params[key] = value === undefined ? "" : decodeURI(value);
        }
      }

      break;
    }

    return result;
  }
}

/**
 * Transform a filesystem URL path to a `path-to-regex` style matcher.
 */
export function pathToPattern(
  path: string,
  options?: { keepGroups: boolean },
): string {
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
    if (!options?.keepGroups && part.startsWith("(") && part.endsWith(")")) {
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

export function patternToSegments(
  path: string,
  root: string,
  includeLast: boolean = false,
): string[] {
  const out: string[] = [root];

  if (path === "/" || path === "*" || path === "/*") return out;

  let start = -1;
  for (let i = 0; i < path.length; i++) {
    const ch = path[i];

    if (ch === "/") {
      if (i > 0) {
        const raw = path.slice(start + 1, i);
        out.push(raw);
      }
      start = i;
    }
  }

  if (includeLast && start < path.length - 1) {
    out.push(path.slice(start + 1));
  }

  return out;
}

export function mergePath(basePath: string, path: string): string {
  if (basePath.endsWith("*")) basePath = basePath.slice(0, -1);
  if (basePath === "/") basePath = "";

  if (path === "*" || path === "/*") path = "/*";

  const s = (basePath !== "" && path === "/") ? "" : path;
  return basePath + s;
}
