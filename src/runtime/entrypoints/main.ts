import {
  ComponentChildren,
  ComponentType,
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
    [],
    [],
    document.body,
  );
}

function ServerComponent(
  props: { children: ComponentChildren },
): ComponentChildren {
  return props.children;
}
ServerComponent.displayName = "PreactServerComponent";

function addPropsChild(parent: VNode, vnode: ComponentChildren) {
  const props = parent.props;
  if (props.children === null) {
    props.children = vnode;
  } else {
    if (!Array.isArray(props.children)) {
      props.children = [props.children, vnode];
    } else {
      props.children.push(vnode);
    }
  }
}

const enum MarkerKind {
  Island,
  Slot,
}

interface Marker {
  kind: MarkerKind;
  startNode: Comment;
  endNode: Comment | null;
  comment: string;
}

function _walkInner(
  islands: Record<string, ComponentType>,
  // deno-lint-ignore no-explicit-any
  props: any[],
  markerStack: Marker[],
  vnodeStack: VNode[],
  node: Node | Comment,
) {
  let sib: Node | null = node;
  while (sib !== null) {
    const marker = markerStack.length > 0
      ? markerStack[markerStack.length - 1]
      : null;
    const parentVNode = vnodeStack.length > 0
      ? vnodeStack[vnodeStack.length - 1]
      : null;

    // We use comment nodes to mark fresh islands and slots
    if (isCommentNode(sib)) {
      if (sib.data.startsWith("frsh-slot")) {
        // Note: Nested slots are not possible as they're flattened
        // already on the server.
        markerStack.push({
          startNode: sib,
          endNode: null,
          kind: MarkerKind.Slot,
          comment: sib.data,
        });
        // @ts-ignore TS gets confused
        vnodeStack.push(h(ServerComponent, { key: sib.data }));
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
            const vnode = vnodeStack.pop();
            // @ts-ignore TS is a little confused
            const wrapper = h(ServerComponent, { children: vnode });

            const islandParent = vnodeStack.length > 0
              ? vnodeStack[vnodeStack.length - 1]
              : null;

            // For now only `props.children` is supported.
            islandParent!.props.children = wrapper;
          }

          marker.startNode.remove();
          sib = sib.nextSibling;
          marker.endNode.remove();
          continue;
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

            const vnode = vnodeStack.pop();

            render(
              vnode,
              createRootFragment(
                sib.parentNode! as HTMLElement,
                children,
                // deno-lint-ignore no-explicit-any
              ) as any as HTMLElement,
            );

            marker.startNode.remove();
            sib = sib.nextSibling;
            marker.endNode.remove();
            continue;
          } else if (parent?.kind === MarkerKind.Slot) {
            // Treat the island as a standard component when it
            // has an island parent or a slot parent
            const vnode = vnodeStack.pop();
            const parent = vnodeStack.length > 0
              ? vnodeStack[vnodeStack.length - 1]
              : null;

            addPropsChild(parent!, vnode);
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
            kind: MarkerKind.Island,
            comment: sib.data,
          });
          const vnode = h(islands[id], islandProps);
          vnodeStack.push(vnode);
        }
      }
    } else if (isTextNode(sib)) {
      if (
        marker !== null && marker.kind === MarkerKind.Slot &&
        parentVNode !== null
      ) {
        addPropsChild(parentVNode, sib.data);
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
        parentVNode.props.children = vnode;
        vnodeStack.push(vnode);
      }

      // TODO: What about script tags?
      if (
        sib.firstChild && (sib.nodeName !== "SCRIPT")
      ) {
        _walkInner(islands, props, markerStack, vnodeStack, sib.firstChild);
      }

      if (marker !== null && marker.kind === MarkerKind.Slot) {
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
