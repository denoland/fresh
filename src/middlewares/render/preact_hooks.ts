import {
  Component,
  Options as PreactOptions,
  options as preactOptions,
  VNode,
} from "preact";
import { GLOBAL_ISLANDS } from "../../app.ts";
import { FreshRenderContext } from "../../runtime/server.tsx";

interface InternalPreactOptions extends PreactOptions {
  /** options._hook */
  __h(component: Component, index: number, type: number): void;
  /** options._diff */
  __b(vnode: VNode): void;
  /** options._render */
  __r(vnode: VNode): void;
  /** options._render */
  __e(error: unknown, vnode: VNode, oldVNode: VNode): void;
}

interface InternalVNode extends VNode {
  __c: Component | null;
  __: InternalVNode | null;
}

// deno-lint-ignore no-explicit-any
const options: InternalPreactOptions = preactOptions as any;

const oldDiff = options.__b;
options.__b = (vnode) => {
  if (typeof vnode.type === "function") {
    const island = GLOBAL_ISLANDS.get(vnode.type);
    if (island) {
      const ctx = getFreshContext(vnode as InternalVNode);
      if (ctx === null) return;
      ctx.__fresh.islands.add(island);
    }
  }

  oldDiff?.(vnode);
};

function getFreshContext(vnode: InternalVNode): FreshRenderContext | null {
  if (vnode.__c === null) {
    if (vnode.__ === null) return null;
    return getFreshContext(vnode.__);
  }

  return vnode.__c.context;
}
