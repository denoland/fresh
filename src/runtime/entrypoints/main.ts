import {
  ComponentChildren,
  ComponentType,
  Fragment,
  h,
  options,
  render,
  VNode,
} from "preact";
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
  _walkInner(
    islands,
    props,
    { markerStack: [], vnodeStack: [] },
    document.body,
  );
}

function ServerComponent(props: { children: ComponentChildren }): any {
  return props.children;
}
ServerComponent.displayName = "ServerComponent";

const enum MarkerKind {
  Island,
  Slot,
}

interface IslandMarker {
  kind: MarkerKind.Island;
  startNode: Comment;
  endNode: Comment | null;
  comment: string;
  data: string;
}

interface SlotMarker {
  kind: MarkerKind.Slot;
  startNode: Comment;
  endNode: Comment | null;
  comment: string;
  data: string;
}

type MarkerState = IslandMarker | SlotMarker;

let slotI = 0;

function _walkInner(
  islands: Record<string, ComponentType>,
  props: any[],
  context: {
    markerStack: MarkerState[];
    vnodeStack: VNode[];
  },
  node: Node | Comment,
) {
  const { markerStack, vnodeStack } = context;

  let sib: Node | null = node;
  while (sib !== null) {
    console.log("walk", sib, context.markerStack.slice());

    const marker = markerStack.length > 0
      ? markerStack[markerStack.length - 1]
      : null;
    const parentVNode = vnodeStack.length > 0
      ? vnodeStack[vnodeStack.length - 1]
      : null;

    // We use comment nodes to mark fresh islands and slots
    if (isCommentNode(sib)) {
      if (sib.data.startsWith("frsh-slot")) {
        slotI++;
        // TODO: Are nested slots possible?
        markerStack.push({
          startNode: sib,
          endNode: null,
          data: sib.data.slice("slot-".length),
          kind: MarkerKind.Slot,
          comment: sib.data,
        });
        // @ts-ignore TS gets confused
        vnodeStack.push(h(ServerComponent, { key: sib.data }));
        console.log(
          "   SLOT " + slotI,
          markerStack.slice(),
          vnodeStack.slice(),
        );
      } else if (
        marker !== null && (sib.data.startsWith("/frsh") ||
          marker.comment === sib.data)
      ) {
        // We're closing either a slot or an island
        marker.endNode = sib;

        markerStack.pop();
        const parent = markerStack.length > 0
          ? markerStack[markerStack.length - 1]
          : null;

        if (marker.kind === MarkerKind.Slot) {
          if (parent?.kind === MarkerKind.Island) {
            console.log(
              "%c revive slot in island ",
              "background: violet; color: black",
            );
            console.log("   ", parentVNode);
            const vnode = vnodeStack.pop();
            const wrapper = h(ServerComponent, { children: vnode });

            const islandParent = vnodeStack.length > 0
              ? vnodeStack[vnodeStack.length - 1]
              : null;

            islandParent!.props.children = wrapper;
            console.log(
              "   %c CHILD pop ",
              "background: yellow; color: black",
            );
            console.log(
              "   ",
              parentVNode?.type,
              markerStack.slice(),
              vnodeStack.slice(),
              islandParent,
            );
          } else {
            console.error("huh");
          }

          // marker.startNode.remove();
          // sib = marker.endNode.nextSibling;
          // marker.endNode.remove();
          // continue;
        } else if (marker.kind === MarkerKind.Island) {
          // We're ready to revive this island if it has
          // no roots of its own. Otherwise we'll treat it
          // as a standard component
          if (markerStack.length === 0) {
            const children: Node[] = [];

            let child: Node | null = marker.startNode;
            while (
              (child = child.nextSibling) !== null && child !== marker.endNode
            ) {
              children.push(child);
            }

            console.log(
              "%c revive root island ",
              "background: violet; color: black",
            );
            console.log("   ", parentVNode);
            console.log("   ", vnodeStack.slice());
            const vnode = vnodeStack.pop();

            render(
              vnode,
              createRootFragment(
                sib.parentNode! as HTMLElement,
                children,
                // deno-lint-ignore no-explicit-any
              ) as any as HTMLElement,
            );
            console.error("===========");

            // marker.startNode.remove();
            // sib = marker.endNode.nextSibling;
            // marker.endNode.remove();
            // continue;
          } else if (parent?.kind === MarkerKind.Slot) {
            console.log(
              "%c revive island in slot ",
              "background: violet; color: black",
            );
            console.log("   ", parentVNode);
            console.log(
              "   >>> close island",
              markerStack.slice(),
              vnodeStack.slice(),
            );
            // Treat the island as a standard component when it
            // has an island parent or a slot parent
            const vnode = vnodeStack.pop();
            const parent = vnodeStack.length > 0
              ? vnodeStack[vnodeStack.length - 1]
              : null;

            // FIXME
            console.log("%c WRONG ", "background: red; color: white");
            console.log("    ", parent?.props.children);
            if (parent!.props.children === null) {
              parent!.props.children = vnode;
            } else {
              if (!Array.isArray(parent!.props.children)) {
                parent!.props.children = [parent!.props.children, vnode];
              } else {
                parent!.props.children.push(vnode);
              }
            }
          } else {
            console.error("HUH???");
          }
        }
      } else if (sib.data.startsWith("frsh")) {
        // We're opening a new island
        const match = sib.data.match(FRESH_MARKER_REG);
        if (match && match.length > 0) {
          const [id, n] = match[1].split(":");
          const islandProps = props[Number(n)];

          markerStack.push({
            startNode: sib,
            endNode: null,
            data: "",
            kind: MarkerKind.Island,
            comment: sib.data,
          });
          const vnode = h(islands[id], islandProps);
          vnodeStack.push(vnode);
        }
      }
    } else if (isTextNode(sib)) {
      if (marker !== null && marker.kind === MarkerKind.Slot) {
        if (parentVNode !== null) {
          if (parentVNode.props.children === null) {
            parentVNode.props.children = sib.data;
          } else {
            console.log(">>", parentVNode, parentVNode.props, sib.data, marker);
            // parentVNode.props.children.push(sib.data);
          }
        } else {
          console.error("huh??");
        }
      }
    } else {
      if (
        parentVNode !== null && marker !== null &&
        marker.kind === MarkerKind.Slot && isElementNode(sib)
      ) {
        const childLen = sib.childNodes.length;
        const props: Record<string, unknown> = {
          children: childLen <= 1 ? null : [],
        };
        for (let i = 0; i < sib.attributes.length; i++) {
          const attr = sib.attributes[i];
          props[attr.nodeName] = attr.nodeValue;
        }
        const vnode = h(sib.localName, props);
        // TODO: Multiple children
        parentVNode.props.children = vnode;
        vnodeStack.push(vnode);
      }
      if (
        sib.firstChild && (sib.nodeName !== "SCRIPT")
      ) {
        _walkInner(islands, props, context, sib.firstChild);
      }

      if (marker !== null && marker.kind === MarkerKind.Slot) {
        console.log("%c pop ", "background: yellow; color: black");
        console.log(
          "   ",
          vnodeStack[vnodeStack.length - 1]?.type,
          vnodeStack.slice(),
        );
        vnodeStack.pop();
      }
    }

    sib = sib.nextSibling;
  }
}

const originalHook = options.vnode;
options.vnode = (vnode) => {
  assetHashingHook(vnode);
  if (originalHook) originalHook(vnode);
};
const originalUnmount = options.unmount;
options.unmount = (vnode) => {
  console.error("UNMOUNTING", vnode);
  if (originalUnmount) originalUnmount(vnode);
};
