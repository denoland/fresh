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
  basePath: string;
}

export class RenderState {
  readonly renderUuid: string;
  // deno-lint-ignore no-explicit-any
  componentStack: any[];
  encounteredIslands = new Set<Island>();
  islandProps: unknown[] = [];
  slots = new Map<string, ComponentChildren>();
  // Route options
  routeOptions: RenderStateRouteOptions;
  csp: ContentSecurityPolicy | undefined;
  // Preact state
  ownerStack: VNode[] = [];
  owners = new Map<VNode, VNode>();
  #nonce = "";
  error: Error | null = null;
  isPartial: boolean;
  encounteredPartials = new Set<string>();
  partialCount = 0;
  partialDepth = 0;
  islandDepth = 0;
  url: URL;
  basePath: string;

  constructor(
    renderUuid: string,
    routeOptions: RenderStateRouteOptions,
    // deno-lint-ignore no-explicit-any
    componentStack: any[],
    csp?: ContentSecurityPolicy,
    error?: unknown,
  ) {
    this.renderUuid = renderUuid;
    this.routeOptions = routeOptions;
    this.csp = csp;
    this.componentStack = componentStack;
    this.url = routeOptions.url;
    this.isPartial = routeOptions.url.searchParams.has(PARTIAL_SEARCH_PARAM);
    this.basePath = routeOptions.basePath;

    if (error) this.routeOptions.error = error;
  }

  getNonce(): string {
    if (this.#nonce === "") {
      this.#nonce = crypto.randomUUID().replace(/-/g, "");
    }
    return this.#nonce;
  }

  clearTmpState() {
    this.ownerStack = [];
    this.owners.clear();
    this.encounteredPartials.clear();
  }
}
