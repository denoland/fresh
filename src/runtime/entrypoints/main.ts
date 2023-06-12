import { ComponentType, Fragment, h, options, render, VNode } from "preact";
import { assetHashingHook } from "../utils.ts";

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

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}
function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}
function isElementNode(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

const FRESH_MARKER_REG = /^\s*frsh-(.*)\s*$/;

// deno-lint-ignore no-explicit-any
export function revive(islands: Record<string, ComponentType>, props: any[]) {
  async function walk(node: Node) {
    const tag = isCommentNode(node) &&
      (node.data.match(/^\s*frsh-(.*)\s*$/) || [])[1];
    let endNode: Node | null = null;
    if (tag) {
      const [id, n] = tag.split(":");
      const islandProps = props[Number(n)];

      const startNode = node as Comment;
      const children: Node[] = [];
      const parent = node.parentNode;

      // For now we only support JSX nodes in children
      let hasJsxChildren = "children" in islandProps;

      // We use this to track opening comments
      let stack: Array<Node | Comment> = [startNode];

      // collect all children of the island

      // Revive JSX children
      // let search = startNode;
      // if (search !== null search.nodeType = )

      console.log("NODE", node, startNode);
      startNode.parentNode!.removeChild(startNode); // remove start tag node

      const _render = () => {
        console.log("ISLAND #2", { islandProps, id });
        if ("children" in islandProps && "__slot" in islandProps.children) {
          console.log("YEAH", islandProps.children, tag);
        }

        render(
          h(islands[id], islandProps),
          createRootFragment(
            parent! as HTMLElement,
            children,
            // deno-lint-ignore no-explicit-any
          ) as any as HTMLElement,
        );
      };
      "scheduler" in window
        ? await scheduler!.postTask(_render)
        : setTimeout(_render, 0);
    }

    const sib = node!.nextSibling;
    const fc = node!.firstChild;
    if (endNode) {
      endNode.parentNode?.removeChild(endNode); // remove end tag node
    }

    if (sib) walk(sib);
    if (fc) walk(fc);
  }
  // walk(document.body);

  _walkInner(
    islands,
    props,
    { markerStack: [], vnodeStack: [] },
    document.body,
  );
}

const enum MarkerKind {
  Island,
  Slot,
}

interface MarkerState {
  kind: MarkerKind;
  startNode: Comment;
  endNode: Comment | null;
  comment: string;
  data: Record<string, unknown> | string;
}

function _walkInner(
  islands: Record<string, ComponentType>,
  props: any[],
  context: {
    markerStack: MarkerState[];
    vnodeStack: VNode[];
  },
  node: Node | Comment,
) {
  console.log("walk", node, context.markerStack.slice());
  let islandId = "";
  let islandProps: any = null;
  let comment = "";
  const marker = context.markerStack.length > 0
    ? context.markerStack[context.markerStack.length - 1]
    : null;

  let parentVNode = context.vnodeStack.length > 0
    ? context.vnodeStack[context.vnodeStack.length - 1]
    : null;

  if (isCommentNode(node)) {
    if (marker) {
      const isClose = node.data.startsWith("/frsh") ||
        node.data ===
          marker.comment;

      if (isClose) {
        console.log(
          "> CLOSE",
          node.data,
          context.markerStack.slice(),
          context.vnodeStack.slice(),
        );
        if (marker.kind === MarkerKind.Slot) {
          console.log("   SLOT", context.vnodeStack.slice());
        }
        const vv = context.vnodeStack.pop();
        console.log({ vv });
        // if (node.data.startsWith("/frsh-slot") || node.data.s)
      }
    }

    const match = node.data.match(FRESH_MARKER_REG);
    if (match && match.length >= 1) {
      comment = match[1];

      // if(context.markerStack.length > 0&&comment.startsWith("/") || comment.)
      if (comment.startsWith("slot-")) {
        context.markerStack.push({
          startNode: node,
          endNode: null,
          data: comment.slice("slot-".length),
          kind: MarkerKind.Slot,
          comment: node.data,
        });

        // @ts-ignore TS is a little confused
        parentVNode = h(Fragment, { key: node.data, children: [] });
        context.vnodeStack.push(parentVNode);
      } else if (comment.includes(":")) {
        const [id, n] = comment.split(":");
        islandId = id;
        islandProps = props[Number(n)];
        context.markerStack.push({
          startNode: node,
          endNode: null,
          data: islandProps,
          comment: node.data,
          kind: MarkerKind.Island,
        });
      }

      console.log(match, comment);
    }
  } else {
    const prevParentVNode = parentVNode;

    if (marker !== null && marker.kind === MarkerKind.Slot) {
      console.log(">>> serialize slot", node);
      if (isTextNode(node)) {
        if (parentVNode !== null) {
          (parentVNode.props.children as any[])!.push(node.data);
        }
      } else if (isElementNode(node)) {
        const props: Record<string, unknown> = { children: [] };
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          props[attr.nodeName] = attr.nodeValue;
        }

        const vnode = h(node.localName, props);
        parentVNode?.props.children?.push(vnode);
        parentVNode = vnode;
        context.vnodeStack.push(vnode);
        console.log(node, vnode);
      }
    }

    if (node.firstChild && node.nodeName !== "SCRIPT") {
      _walkInner(islands, props, context, node.firstChild);
    }

    console.log("---", context.vnodeStack.slice(), node);

    parentVNode = prevParentVNode;
  }

  if (node.nextSibling) {
    _walkInner(islands, props, context, node.nextSibling);
  }
}

const originalHook = options.vnode;
options.vnode = (vnode) => {
  assetHashingHook(vnode);
  if (originalHook) originalHook(vnode);
};
