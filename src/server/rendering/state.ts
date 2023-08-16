import { type ComponentChildren, type VNode } from "preact";
import { Island } from "../types.ts";
import { ContentSecurityPolicy } from "../../runtime/csp.ts";

export interface RenderStateRouteOptions {
  url: URL;
  route: string;
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
  // Preact state
  ownerStack: VNode[] = [];
  owners = new Map<VNode, VNode>();

  constructor(
    routeOptions: RenderStateRouteOptions,
    // deno-lint-ignore no-explicit-any
    componentStack: any[],
    csp?: ContentSecurityPolicy,
    error?: unknown,
  ) {
    this.routeOptions = routeOptions;
    this.csp = csp;
    this.componentStack = componentStack;

    if (error) this.routeOptions.error = error;
  }

  clearTmpState() {
    this.renderingUserTemplate = false;
    this.ownerStack = [];
    this.owners.clear();
  }
}
