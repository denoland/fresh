import {
  Component,
  Options as PreactOptions,
  options as preactOptions,
  VNode,
} from "preact";
import { FreshScripts } from "../../runtime/server.tsx";

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

// deno-lint-ignore no-explicit-any
const options: InternalPreactOptions = preactOptions as any;

// const oldDiff = options.__b;
// options.__b = (vnode) => {
//   if (typeof vnode.type === "function") {
//     if (vnode.type === FreshScripts) {
//       console.log(vnode.__c, vnode.type);
//       console.log(vnode.__.__c, vnode.__.type);
//       console.log(vnode.__.__.__c, vnode.__.__.type);
//       console.log(vnode.__.__.__.__c, vnode.__.__.__.type);
//     }
//   }

//   oldDiff?.(vnode);
// };
