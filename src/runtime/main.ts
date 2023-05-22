import { ComponentType, h, options, render } from "preact";
import { assetHashingHook } from "./utils.ts";

function createRootFragment(
  parent: Element,
  replaceNode: Node | Node[],
) {
  replaceNode = ([] as Node[]).concat(replaceNode);

  // @ts-ignore this is fine
  return parent.__k = {
    nodeType: 1,
    parentNode: parent,
    firstChild: replaceNode[0],
    childNodes: replaceNode,
    insertBefore(node: Node, child: Node) {
      parent.insertBefore(node, child);
    },
    appendChild(child: Node) {
      parent.appendChild(child);
    },
    removeChild(child: Node) {
      parent.removeChild(child);
    },
  };
}

// deno-lint-ignore no-explicit-any
export function revive(islands: Record<string, ComponentType>, props: any[]) {
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
        h(islands[id], props[Number(n)]),
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
