import {
  Component,
  ComponentChildren,
  Fragment,
  h,
  Options as PreactOptions,
  options as preactOptions,
  VNode,
} from "preact";
import { GLOBAL_ISLANDS } from "../../app.ts";
import { FreshRenderContext } from "../../runtime/server.tsx";

const enum OptionsType {
  VNODE = "vnode",
  HOOK = "__h",
  DIFF = "__b",
  RENDER = "__r",
  DIFFED = "diffed",
  ERROR = "__e",
}

interface InternalPreactOptions extends PreactOptions {
  [OptionsType.VNODE](vnode: InternalVNode): void;
  [OptionsType.HOOK](component: Component, index: number, type: number): void;
  [OptionsType.DIFF](vnode: InternalVNode): void;
  [OptionsType.RENDER](vnode: InternalVNode): void;
  [OptionsType.ERROR](
    error: unknown,
    vnode: InternalVNode,
    oldVNode: InternalVNode,
  ): void;
}

interface InternalVNode extends VNode {
  __c: Component | null;
  __: InternalVNode | null;
}

// deno-lint-ignore no-explicit-any
const options: InternalPreactOptions = preactOptions as any;

const PATCHED = new WeakSet<VNode>();

const oldDiff = options[OptionsType.DIFF];
options[OptionsType.DIFF] = (vnode) => {
  patchIslands: if (
    typeof vnode.type === "function" && vnode.type !== Fragment &&
    !PATCHED.has(vnode)
  ) {
    const island = GLOBAL_ISLANDS.get(vnode.type);
    if (island === undefined) break patchIslands;

    const ctx = getFreshContext(vnode as InternalVNode);
    if (ctx === null) return;

    const { islands, islandProps } = ctx.__fresh;
    console.log(island);
    islands.add(island);

    // FIXME
    const propsIdx = 0;

    const originalType = vnode.type;
    vnode.type = (props) => {
      console.log("props", props);
      for (const k in props) {
        console.log(k, props[k]);
      }

      const propsIdx = islandProps.push({}) - 1;

      const child = h(originalType, props);
      PATCHED.add(child);

      return wrapWithMarker(
        child,
        "island",
        `${island!.name}:${propsIdx}:${vnode.key ?? ""}`,
      );
    };
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

function wrapWithMarker(
  vnode: ComponentChildren,
  kind: string,
  markerText: string,
) {
  return h(
    Fragment,
    null,
    h(Fragment, {
      // @ts-ignore unstable property is not typed
      UNSTABLE_comment: `frsh:${kind}:${markerText}`,
    }),
    vnode,
    h(Fragment, {
      // @ts-ignore unstable property is not typed
      UNSTABLE_comment: "/frsh:" + kind,
    }),
  );
}
