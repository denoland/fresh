import { type ComponentChildren, type VNode } from "preact";
import { Island } from "../types.ts";
import { ContentSecurityPolicy } from "../../runtime/csp.ts";
import { PARTIAL_SEARCH_PARAM } from "../../constants.ts";

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
  #nonce = "";
  error: Error | null = null;
  isPartial: boolean;
  partialCount = 0;
  partialDepth = 0;
  islandDepth = 0;
  url: URL;

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
    this.url = routeOptions.url;
    this.isPartial = routeOptions.url.searchParams.has(PARTIAL_SEARCH_PARAM);

    if (error) this.routeOptions.error = error;
  }

  getNonce(): string {
    if (this.#nonce === "") {
      this.#nonce = crypto.randomUUID().replace(/-/g, "");
    }
    return this.#nonce;
  }

  clearTmpState() {
    this.renderingUserTemplate = false;
    this.ownerStack = [];
    this.owners.clear();
  }
}
