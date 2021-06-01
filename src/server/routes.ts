import { extname, oak } from "./deps.ts";
import * as rt from "../runtime/deps.ts";
import { PageProps } from "../runtime/types.ts";
import { Routes } from "./mod.ts";

export interface PageModule {
  default: rt.ComponentType<PageProps>;
}

export interface Page {
  route: string;
  url: string;
  name: string;
  component: rt.ComponentType<PageProps>;
}

export interface ApiRouteModule {
  default: oak.RouterMiddleware<Record<string, string>>;
}

export interface ApiRoute {
  route: string;
  url: string;
  name: string;
  handler: oak.RouterMiddleware<Record<string, string>>;
}

/**
 * Process the routes into individual pages.
 */
export function processRoutes(routes: Routes): [Page[], ApiRoute[]] {
  // Get the routes' base URL.
  const baseUrl = new URL("./", routes.baseUrl).href;

  // Extract all pages, and prepare them into this `Page` structure.
  const pages: Page[] = [];
  const apiRoutes: ApiRoute[] = [];
  for (const [self, module] of Object.entries(routes.pages)) {
    const url = new URL(self, baseUrl).href;
    if (!url.startsWith(baseUrl)) {
      throw new TypeError("Page is not a child of the basepath.");
    }
    const path = url.substring(baseUrl.length).substring("pages".length);
    const baseRoute = path.substring(1, path.length - extname(path).length);
    const route = pathToRoute(baseRoute);
    const name = baseRoute.replace("/", "-");
    if (path.startsWith("/api")) {
      const apiRoute: ApiRoute = {
        route,
        url,
        name,
        handler: module.default as oak.RouterMiddleware<Record<string, string>>,
      };
      apiRoutes.push(apiRoute);
    } else {
      const page: Page = {
        route,
        url,
        name,
        component: module.default as rt.ComponentType<PageProps>,
      };
      pages.push(page);
    }
  }

  sortRoutes(pages);
  sortRoutes(apiRoutes);

  return [pages, apiRoutes];
}

/**
 * Sort pages by their relative routing priority, based on the parts in the
 * route matcher
 */
function sortRoutes<T extends { route: string }>(routes: T[]) {
  routes.sort((a, b) => {
    const partsA = a.route.split("/");
    const partsB = b.route.split("/");
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i];
      const partB = partsB[i];
      if (partA === undefined) return -1;
      if (partB === undefined) return 1;
      if (partA === partB) continue;
      const priorityA = partA.startsWith(":") ? partA.endsWith("*") ? 0 : 1 : 2;
      const priorityB = partB.startsWith(":") ? partB.endsWith("*") ? 0 : 1 : 2;
      return Math.max(Math.min(priorityB - priorityA, 1), -1);
    }
    return 0;
  });
}

/** Transform a filesystem URL path to a `path-to-regex` style matcher. */
function pathToRoute(path: string): string {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    parts.pop();
  }
  const route = "/" + parts
    .map((part) => {
      if (part.startsWith("[...") && part.endsWith("]")) {
        return `:${part.slice(4, part.length - 1)}*`;
      }
      if (part.startsWith("[") && part.endsWith("]")) {
        return `:${part.slice(1, part.length - 1)}`;
      }
      return part;
    })
    .join("/");
  return route;
}
