import { type ComponentChildren, type VNode } from "preact";
import { ErrorPage, Island, Route, UnknownPage } from "../types.ts";
import { ContentSecurityPolicy } from "../../runtime/csp.ts";

export interface RenderStateRouteOptions {
  url: URL;
  // deno-lint-ignore no-explicit-any
  route: UnknownPage | ErrorPage | Route<any>;
  // deno-lint-ignore no-explicit-any
  data?: any;
  // deno-lint-ignore no-explicit-any
  state?: any;
  error?: unknown;
  params: Record<string, string | string[]>;
}

export class RenderState {
  // deno-lint-ignore no-explicit-any
  componentStack: any[];
  renderingUserTemplate = false;
  islands: Island[];
  encounteredIslands = new Set<Island>();
  islandProps: unknown[] = [];
  slots = new Map<string, ComponentChildren>();
  headChildren = false;
  renderedHtmlTag = false;
  // deno-lint-ignore no-explicit-any
  docTitle: VNode<any> | null = null;
  docHtml: Record<string, unknown> | null = null;
  docHead: Record<string, unknown> | null = null;
  docBody: Record<string, unknown> | null = null;
  docHeadNodes: { type: string; props: Record<string, unknown> }[] = [];
  headVNodes: ComponentChildren[] = [];
  // Route options
  routeOptions: RenderStateRouteOptions;
  csp: ContentSecurityPolicy | undefined;

  constructor(
    routeOptions: RenderStateRouteOptions,
    // deno-lint-ignore no-explicit-any
    componentStack: any[],
    islands: Island[],
    csp?: ContentSecurityPolicy,
    error?: unknown,
  ) {
    this.routeOptions = routeOptions;
    this.csp = csp;
    this.islands = islands;
    this.componentStack = componentStack;

    if (error) this.routeOptions.error = error;
  }
}
