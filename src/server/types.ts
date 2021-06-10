import { ComponentType } from "../runtime/deps.ts";
import { router } from "./deps.ts";
import { PageProps } from "../runtime/types.ts";

export interface PageModule {
  default: ComponentType<PageProps>;
}

export interface Page {
  route: string;
  url: string;
  name: string;
  component: ComponentType<PageProps>;
}

export interface ApiRouteModule {
  default: router.MatchHandler;
}

export interface ApiRoute {
  route: string;
  url: string;
  name: string;
  handler: router.MatchHandler;
}
