import { VNode } from "preact";
import { FreshContext } from "../../context.ts";

export class RenderState {
  nonce: string;
  islandDepth = 0;
  partialDepth = 0;
  partialCount = 0;
  error: Error | null = null;
  slots = new Map<string, any>(); // FIXME
  basePath = ""; // FIXME
  islandProps: any[] = [];
  encounteredIslands = new Set<any>();
  encounteredPartials = new Set<any>();
  owners = new Map<VNode, VNode>();
  ownerStack = [];

  constructor(public ctx: FreshContext<unknown>, public readonly id: string) {
    this.nonce = id.replace(/-/g, "");
  }

  clearTmpState() {
    this.ownerStack = [];
    this.islandProps = [];
    this.encounteredIslands.clear();
    this.encounteredPartials.clear();
    this.owners.clear();
  }
}
