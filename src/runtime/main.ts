import { ComponentType, h, options, render } from "preact";
import { assetHashingHook } from "./utils.ts";

function createRootFragment(
  parent: Element,
  replaceNode: Node | Node[],
) {
  replaceNode = ([] as Node[]).concat(replaceNode);
  const s = replaceNode[replaceNode.length - 1].nextSibling;
  function insert(c: Node, r: Node) {
    parent.insertBefore(c, r || s);
  }
  // @ts-ignore this is fine
  return parent.__k = {
    nodeType: 1,
    parentNode: parent,
    firstChild: replaceNode[0],
    childNodes: replaceNode,
    insertBefore: insert,
    appendChild: insert,
    removeChild: function (c: Node) {
      parent.removeChild(c);
    },
  };
}

const ISLAND_PROPS_COMPONENT = document.getElementById("__FRSH_ISLAND_PROPS");
// deno-lint-ignore no-explicit-any
const ISLAND_PROPS: any[] = JSON.parse(
  ISLAND_PROPS_COMPONENT?.textContent ?? "[]",
);

export function revive(islands: Record<string, ComponentType>) {
  function walk(node: Node | null) {
    const tag = node!.nodeType === 8 &&
      ((node as Comment).data.match(/^\s*frsh-(.*)\s*$/) || [])[1];
    let endNode: Node | null = null;
    if (tag) {
      const startNode = node!;
      const children = [];
      const parent = node!.parentNode;
      // collect all children of the island
      while ((node = node!.nextSibling) && node.nodeType !== 8) {
        children.push(node);
      }
      startNode.parentNode!.removeChild(startNode); // remove start tag node

      const [id, n] = tag.split(":");
      render(
        h(islands[id], ISLAND_PROPS[Number(n)]),
        createRootFragment(
          parent! as HTMLElement,
          children,
          // deno-lint-ignore no-explicit-any
        ) as any as HTMLElement,
      );
      endNode = node;
    }

    const sib = node!.nextSibling;
    const fc = node!.firstChild;
    if (endNode) {
      endNode.parentNode?.removeChild(endNode); // remove end tag node
    }

    if (sib) walk(sib);
    if (fc) walk(fc);
  }
  walk(document.body);
}

const originalHook = options.vnode;
options.vnode = (vnode) => {
  assetHashingHook(vnode);
  if (originalHook) originalHook(vnode);
};
