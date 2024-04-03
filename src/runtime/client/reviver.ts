import {
  type ComponentType,
  Fragment,
  h,
  hydrate,
  render,
  type VNode,
} from "preact";
import { parse } from "../../jsonify/parse.ts";
import { signal } from "@preact/signals";
import type { CustomParser } from "../../jsonify/parse.ts";

interface IslandReq {
  name: string;
  propsIdx: number;
  key: string | null;
  start: Comment;
  end: Comment | null;
}

interface ReviveContext {
  islands: IslandReq[];
  stack: IslandReq[];
  slots: { name: string; start: Comment; end: Comment | null }[];
  slotIdStack: number[];
}

interface SlotRef {
  kind: typeof SLOT_SYMBOL;
  name: string;
  id: number;
}
const SLOT_SYMBOL = Symbol.for("_FRESH_SLOT");
function isSlotRef(x: unknown): x is SlotRef {
  return x !== null && typeof x === "object" && "kind" in x &&
    x.kind === SLOT_SYMBOL;
}

export function revive(
  island: IslandReq,
  props: Record<string, unknown>,
  slots: ReviveContext["slots"],
) {
  const component = ISLAND_REGISTRY.get(island.name)!;

  const container = createRootFragment(
    // deno-lint-ignore no-explicit-any
    island.start.parentNode as any,
    island.start,
    island.end!,
  );

  const _render = () => {
    for (const propName in props) {
      const value = props[propName];
      if (isSlotRef(value)) {
        const markers = slots[value.id];
        props[propName] = domToVNode(markers.start, markers.end!);
      }
    }

    if (props !== null && props["f-client-only"]) {
      render(h(component, props), container as unknown as HTMLElement);
    } else {
      hydrate(h(component, props), container as unknown as HTMLElement);
    }
  };

  // deno-lint-ignore no-window
  "scheduler" in window
    // `scheduler.postTask` is async but that can easily
    // fire in the background. We don't want waiting for
    // the hydration of an island block us.
    // @ts-ignore scheduler API is not in types yet
    ? scheduler!.postTask(_render)
    : setTimeout(_render, 0);
}

const ISLAND_REGISTRY = new Map<string, ComponentType>();

const CUSTOM_PARSER: CustomParser = {
  Signal: (value: unknown) => signal(value),
  Slot: (value: { name: string; id: number }): SlotRef => {
    return { kind: SLOT_SYMBOL, name: value.name, id: value.id };
  },
};

export function boot(
  initialIslands: Record<string, ComponentType>,
  islandProps: string,
) {
  const ctx: ReviveContext = {
    islands: [],
    stack: [],
    slots: [],
    slotIdStack: [],
  };
  _walkInner(ctx, document.body);

  const keys = Object.keys(initialIslands);
  for (let i = 0; i < keys.length; i++) {
    const name = keys[i];
    ISLAND_REGISTRY.set(name, initialIslands[name]);
  }

  // deno-lint-ignore no-explicit-any
  const allProps = parse<{ props: Record<string, unknown>; slots: any[] }[]>(
    islandProps,
    CUSTOM_PARSER,
  );
  for (let i = 0; i < ctx.islands.length; i++) {
    const island = ctx.islands[i];

    const islandConfig = allProps[island.propsIdx];
    revive(island, islandConfig.props, ctx.slots);
  }
}

function _walkInner(ctx: ReviveContext, node: Node | Comment) {
  if (isElementNode(node)) {
    // No need to traverse into <script> or <style> tags.
    // No need to traverse deeper if we found a slotStart marker.
    // We'll parse slots later when the island is revived.
    if (
      node.nodeName === "SCRIPT" || node.nodeName === "STYLE" ||
      ctx.slotIdStack.length > 0
    ) {
      return;
    }

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      _walkInner(ctx, child);
    }
  } else if (isCommentNode(node)) {
    const comment = node.data;
    if (comment.startsWith("frsh:")) {
      const [_, kind, name, propsIdx, key] = comment.split(":");
      if (kind === "island") {
        const found: IslandReq = {
          name,
          propsIdx: Number(propsIdx),
          key: key === "" ? null : key,
          start: node,
          end: null,
        };
        ctx.islands.push(found);
        ctx.stack.push(found);
      } else if (kind === "slot") {
        // TODO: use more consistent ordering
        const id = +name;
        const slotName = propsIdx;
        ctx.slotIdStack.push(id);
        ctx.slots.push({
          name: slotName,
          start: node,
          end: null,
        });
      }
    } else if (comment === "/frsh:island") {
      const item = ctx.stack.pop();
      if (item !== undefined) {
        item.end = node;
      }
    } else if (comment === "/frsh:slot") {
      const item = ctx.slotIdStack.pop();
      if (item !== undefined) {
        ctx.slots[item].end = node;
      }
    }
  }
}

function domToVNode(start: Comment, end: Comment): VNode {
  const root = h(Fragment, null);
  let sib = start.nextSibling;
  while (sib !== null && sib !== end) {
    _innerDomToVNode(root, sib);
    sib = sib.nextSibling;
  }
  return root;
}

// deno-lint-ignore no-explicit-any
function _innerDomToVNode(parentVNode: VNode<any>, node: Node) {
  if (isElementNode(node)) {
    const vnode = h(node.localName, null);
    addVNodeChild(parentVNode, vnode);

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      _innerDomToVNode(vnode, child);
    }
  } else if (isCommentNode(node)) {
    // TODO
  } else if (isTextNode(node)) {
    addVNodeChild(parentVNode, node.data);
  }
}

// deno-lint-ignore no-explicit-any
function addVNodeChild(parent: VNode, child: VNode<any> | string) {
  if (!parent.props.children) {
    parent.props.children = [];
  }
  // deno-lint-ignore no-explicit-any
  (parent.props.children as Array<VNode<any> | string>).push(child);
}

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}
function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}
function isElementNode(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE && !("_frshRootFrag" in node);
}

function createRootFragment(
  parent: Element,
  startMarker: Text | Comment,
  // We need an end marker for islands because multiple
  // islands can share the same parent node. Since
  // islands are root-level render calls any calls to
  // `.appendChild` would lead to a wrong result.
  endMarker: Text | Comment,
) {
  // @ts-ignore this is fine
  return parent.__k = {
    _frshRootFrag: true,
    nodeType: 1,
    parentNode: parent,
    nextSibling: null,
    get firstChild() {
      const child = startMarker.nextSibling;
      if (child === endMarker) return null;
      return child;
    },
    get childNodes() {
      const children: ChildNode[] = [];

      let child = startMarker.nextSibling;
      while (child !== null && child !== endMarker) {
        children.push(child);
        child = child.nextSibling;
      }

      return children;
    },
    insertBefore(node: Node, child: Node | null) {
      parent.insertBefore(node, child ?? endMarker);
    },
    appendChild(child: Node) {
      // We cannot blindly call `.append()` as that would add
      // the new child to the very end of the parent node. This
      // leads to ordering issues when the multiple islands
      // share the same parent node.
      parent.insertBefore(child, endMarker);
    },
    removeChild(child: Node) {
      parent.removeChild(child);
    },
  };
}
