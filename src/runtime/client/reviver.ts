import { type ComponentType, h, hydrate, render } from "preact";
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
}

export function revive(island: IslandReq, props: Record<string, unknown>) {
  const component = ISLAND_REGISTRY.get(island.name)!;

  const container = createRootFragment(
    // deno-lint-ignore no-explicit-any
    island.start.parentNode as any,
    island.start,
    island.end!,
  );

  const _render = () => {
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

const customParser: CustomParser = {
  Signal: (value: unknown) => signal(value),
  // FIXME: VNode
  // @ts-ignore asd
  VNode: (value: unknown) => h("h1", null, value),
};

export function boot(
  initialIslands: Record<string, ComponentType>,
  islandProps: string,
) {
  const ctx: ReviveContext = {
    islands: [],
    stack: [],
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
    customParser,
  );
  for (let i = 0; i < ctx.islands.length; i++) {
    const island = ctx.islands[i];

    const islandConfig = allProps[island.propsIdx];
    revive(island, islandConfig.props);
  }
}

function _walkInner(ctx: ReviveContext, node: Node | Comment) {
  if (isElementNode(node)) {
    if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") return;

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
      }
    } else if (comment === "/frsh:island") {
      const item = ctx.stack.pop();
      if (item !== undefined) {
        item.end = node;
      }
    }
  }
}

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}
// deno-lint-ignore no-unused-vars
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
