export type Method = "HEAD" | "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface Route<T> {
  path: string | URLPattern;
  method: Method | "ALL";
  handler: T;
}

export interface RouteResult<T> {
  params: Record<string, string>;
  handlers: T[];
  methodMatch: boolean;
}

export interface Router<T> {
  add(route: Route<T>): void;
  match(method: Method, url: URL): RouteResult<T>;
}

export const IS_PATTERN = /[*:{}+?()]/;

export class UrlPatternRouter<T> implements Router<T> {
  #routes: Route<T>[] = [];

  add(route: Route<T>) {
    if (
      typeof route.path === "string" && route.path !== "*" &&
      IS_PATTERN.test(route.path)
    ) {
      this.#routes.push({
        path: new URLPattern({ pathname: route.path }),
        handler: route.handler,
        method: route.method,
      });
    }
    this.#routes.push(route);
  }

  match(method: Method, url: URL): RouteResult<T> {
    const result: RouteResult<T> = {
      params: {},
      handlers: [],
      methodMatch: false,
    };

    for (let i = 0; i < this.#routes.length; i++) {
      const route = this.#routes[i];

      if (route.method !== "ALL" && route.method !== method) {
        continue;
      }

      // Fast path for string based routes which are expected
      // to be either wildcard `*` match or an exact pathname match.
      if (
        typeof route.path === "string" &&
        (route.path === "*" || route.path === url.pathname)
      ) {
        result.handlers.push(route.handler);
        result.methodMatch = true;
      } else if (route.path instanceof URLPattern) {
        const match = route.path.exec(url);
        if (match !== null) {
          // Decode matched params
          for (const [key, value] of Object.entries(match.pathname.groups)) {
            if (value !== undefined) {
              result.params[key] = decodeURI(value);
            }
          }

          result.handlers.push(route.handler);
          result.methodMatch = true;
        }
      }
    }

    return result;
  }
}
