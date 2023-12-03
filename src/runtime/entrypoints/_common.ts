import "../polyfills.ts";
import {
  Component,
  ComponentChildren,
  ComponentType,
  Fragment,
  h, VNode
} from "preact";
import {
  DATA_KEY_ATTR,
  LOADING_ATTR
} from "../../constants.ts";

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
export function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}
export function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}
export function isElementNode(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE && !("_frshRootFrag" in node);
}

export type IslandRegistry = Record<string, ComponentType>;

function addPropsChild(parent: VNode, vnode: ComponentChildren) {
  const props = parent.props;
  if (props.children == null) {
    props.children = vnode;
  } else {
    if (!Array.isArray(props.children)) {
      props.children = [props.children, vnode];
    } else {
      props.children.push(vnode);
    }
  }
}

class PartialComp extends Component<
  { children?: ComponentChildren; mode: number; name: string }
> {
  componentDidMount() {
    partials.set(this.props.name, this);
  }

  render() {
    return this.props.children;
  }
}

const enum MarkerKind {
  Island,
  Slot,
  Partial,
}

interface Marker {
  kind: MarkerKind;
  text: string;
  startNode: Text | Comment | null;
  endNode: Text | Comment | null;
}

export interface RenderRequest {
  vnode: VNode;
  marker: Marker;
  rootFragment: HTMLElement;
}

// Useful for debugging
const SHOW_MARKERS = false;

export const partials = new Map<string, PartialComp>();

/**
 * Replace comment markers with empty text nodes to hide them
 * in DevTools. This is done to avoid user confusion.
 */
function hideMarker(marker: Marker) {
  const { startNode, endNode } = marker;
  const parent = endNode!.parentNode!;

  if (
    !SHOW_MARKERS && startNode !== null &&
    startNode.nodeType === Node.COMMENT_NODE
  ) {
    const text = new Text("");
    marker.startNode = text;
    parent.insertBefore(text, startNode);
    startNode.remove();
  }

  if (
    !SHOW_MARKERS && endNode !== null && endNode.nodeType === Node.COMMENT_NODE
  ) {
    const text = new Text("");
    marker.endNode = text;
    parent.insertBefore(text, endNode);
    endNode.remove();
  }
}

/**
 * If an islands children are `null` then it might be a conditionally
 * rendered one which was initially not visible. In these cases we
 * send a `<template>` tag with the "would be rendered" children to
 * the client. This function checks for that
 */
function addChildrenFromTemplate(
  islands: IslandRegistry,
  // deno-lint-ignore no-explicit-any
  props: any[],
  markerStack: Marker[],
  vnodeStack: VNode[],
  comment: string,
  result: RenderRequest[],
) {
  const [id, n] = comment.slice("/frsh-".length).split(
    ":",
  );

  const sel = `#frsh-slot-${id}-${n}-children`;
  const template = document.querySelector(sel) as
    | HTMLTemplateElement
    | null;

  if (template !== null) {
    markerStack.push({
      kind: MarkerKind.Slot,
      endNode: null,
      startNode: null,
      text: comment.slice(1),
    });

    const node = template.content.cloneNode(true);
    _walkInner(
      islands,
      props,
      markerStack,
      vnodeStack,
      node,
      result,
    );

    markerStack.pop();
  }
}

/**
 * Revive islands and stich together any server rendered content.
 *
 * Conceptually we're doing an inorder depth first search over the DOM
 * to find all our comment nodes `<!--frsh-something-->` which act as
 * a marker for islands or server rendered JSX (=slots in islands).
 * Every island or server JSX has a start and an end marker, which
 * means there is no _single_ root nodes for these elements.
 * The hierarchy we need to construct for the virtual-dom tree might
 * be rendered in a flattened manner in the DOM.
 *
 * Example:
 *   <div>
 *     <!--frsh-island:0-->
 *     <!--frsh-slot:children-->
 *     <p>server content</p>
 *     <!--/frsh-slot:children-->
 *     <!--/frsh-island:0-->
 *   </div>
 *
 * Here we have a flat DOM structure, but from the virtual-dom
 * perspective we should render:
 *   <div> -> <Island> -> ServerComponent -> <p>server content</p>
 *
 * To solve this we're keeping track of the virtual-dom hierarchy
 * in a stack-like manner, but do the actual iteration in a list-based
 * fashion over an HTMLElement's children list.
 */
export function _walkInner(
  islands: IslandRegistry,
  // deno-lint-ignore no-explicit-any
  props: any[],
  markerStack: Marker[],
  vnodeStack: VNode[],
  node: Node | Comment,
  result: RenderRequest[],
) {
  let sib: Node | null = node;
  while (sib !== null) {
    const marker = markerStack.length > 0
      ? markerStack[markerStack.length - 1]
      : null;

    // We use comment nodes to mark Fresh islands and slots
    if (isCommentNode(sib)) {
      let comment = sib.data;
      if (comment.startsWith("!--")) {
        comment = comment.slice(3, -2);
      }

      if (comment.startsWith("frsh-slot")) {
        // Note: Nested slots are not possible as they're flattened
        // already on the server.
        markerStack.push({
          startNode: sib,
          text: comment,
          endNode: null,
          kind: MarkerKind.Slot,
        });
        // @ts-ignore TS gets confused
        vnodeStack.push(h(ServerComponent, { id: comment }));
      } else if (comment.startsWith("frsh-partial")) {
        // TODO: Partial key
        const [_, name, mode, key] = comment.split(":");
        markerStack.push({
          startNode: sib,
          text: name,
          endNode: null,
          kind: MarkerKind.Partial,
        });

        vnodeStack.push(
          h(PartialComp, { name, key, mode: +mode }) as VNode,
        );
      } else if (comment.startsWith("frsh-key:")) {
        const key = comment.slice("frsh-key:".length);
        vnodeStack.push(h(Fragment, { key }) as VNode);
      } else if (comment.startsWith("/frsh-key:")) {
        const vnode = vnodeStack.pop();
        const parent = vnodeStack[vnodeStack.length - 1]!;
        addPropsChild(parent, vnode);

        sib = sib.nextSibling;
        continue;
      } else if (
        marker !== null && (
          comment.startsWith("/frsh") ||
          // Check for old Preact RTS
          marker.text === comment
        )
      ) {
        // We're closing either a slot or an island
        marker.endNode = sib;

        markerStack.pop();

        if (marker.kind === MarkerKind.Slot) {
          // If we're closing a slot than it's assumed that we're
          // inside an island
          const vnode = vnodeStack.pop();

          // For now only `props.children` is supported.
          const islandParent = vnodeStack[vnodeStack.length - 1]!;
          // Overwrite serialized `{__slot: "children"}` with the
          // actual vnode child.
          islandParent.props.children = vnode;

          hideMarker(marker);
          sib = marker.endNode.nextSibling;
          continue;
        } else if (
          marker !== null && (
            marker.kind === MarkerKind.Island ||
            marker.kind === MarkerKind.Partial
          )
        ) {
          // We're ready to revive this island or partial if it has
          // no roots of its own. Otherwise we'll treat it
          // as a standard component
          if (markerStack.length === 0) {
            const vnode = vnodeStack[vnodeStack.length - 1];

            if (vnode.props.children == null) {
              addChildrenFromTemplate(
                islands,
                props,
                markerStack,
                vnodeStack,
                comment,
                result,
              );
            }
            vnodeStack.pop();

            const parentNode = sib.parentNode! as HTMLElement;

            hideMarker(marker);

            const rootFragment = createRootFragment(
              parentNode,
              marker.startNode!,
              marker.endNode,
              // deno-lint-ignore no-explicit-any
            ) as any as HTMLElement;

            result.push({
              vnode,
              marker,
              rootFragment,
            });

            sib = marker.endNode.nextSibling;
            continue;
          } else {
            // Treat as a standard component
            const vnode = vnodeStack[vnodeStack.length - 1];
            if (vnode && vnode.props.children == null) {
              addChildrenFromTemplate(
                islands,
                props,
                markerStack,
                vnodeStack,
                comment,
                result,
              );

              // Didn't find any template tag, proceed as usual
              if (vnode.props.children == null) {
                vnodeStack.pop();
              }
            } else {
              vnodeStack.pop();
            }

            marker.endNode = sib;
            hideMarker(marker);

            const parent = vnodeStack[vnodeStack.length - 1]!;
            addPropsChild(parent, vnode);

            sib = marker.endNode.nextSibling;
            continue;
          }
        }
      } else if (comment.startsWith("frsh")) {
        // We're opening a new island
        const [id, n, key] = comment.slice(5).split(":");
        const islandProps = props[Number(n)];

        markerStack.push({
          startNode: sib,
          endNode: null,
          text: comment,
          kind: MarkerKind.Island,
        });

        const vnode = h(islands[id], islandProps) as VNode;
        if (key) vnode.key = key;
        vnodeStack.push(vnode);
      }
    } else if (isTextNode(sib)) {
      const parentVNode = vnodeStack[vnodeStack.length - 1]!;
      if (
        marker !== null &&
        (marker.kind === MarkerKind.Slot ||
          marker.kind === MarkerKind.Partial)
      ) {
        addPropsChild(parentVNode, sib.data);
      }
    } else {
      const parentVNode = vnodeStack[vnodeStack.length - 1];

      if (isElementNode(sib)) {
        if (
          marker !== null &&
          (marker.kind === MarkerKind.Slot ||
            marker.kind === MarkerKind.Partial)
        ) {
          // Parse the server rendered DOM into vnodes that we can
          // attach to the virtual-dom tree. In the future, once
          // Preact supports a way to skip over subtrees, this
          // can be dropped.
          const childLen = sib.childNodes.length;
          const newProps: Record<string, unknown> = {
            children: childLen <= 1 ? null : [],
          };
          let hasKey = false;
          for (let i = 0; i < sib.attributes.length; i++) {
            const attr = sib.attributes[i];

            if (attr.nodeName === DATA_KEY_ATTR) {
              hasKey = true;
              newProps.key = attr.nodeValue;
              continue;
            } else if (attr.nodeName === LOADING_ATTR) {
              const idx = attr.nodeValue;
              const sig = props[Number(idx)][LOADING_ATTR].value;
              // deno-lint-ignore no-explicit-any
              (sib as any)._freshIndicator = sig;
            }

            // Boolean attributes are always `true` when present.
            // See: https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML
            newProps[attr.nodeName] =
              // deno-lint-ignore no-explicit-any
              typeof (sib as any)[attr.nodeName] === "boolean"
                ? true
                : attr.nodeValue;
          }

          // Remove internal fresh key
          if (hasKey) sib.removeAttribute(DATA_KEY_ATTR);

          const vnode = h(sib.localName, newProps) as VNode;
          addPropsChild(parentVNode, vnode);
          vnodeStack.push(vnode);
        } else {
          // Outside of any partial or island
          const idx = sib.getAttribute(LOADING_ATTR);
          if (idx !== null) {
            const sig = props[Number(idx)][LOADING_ATTR].value;
            // deno-lint-ignore no-explicit-any
            (sib as any)._freshIndicator = sig;
          }
        }
      }

      // TODO: What about script tags?
      if (
        sib.firstChild && (sib.nodeName !== "SCRIPT")
      ) {
        _walkInner(
          islands,
          props,
          markerStack,
          vnodeStack,
          sib.firstChild,
          result,
        );
      }

      // Pop vnode if current marker is not the a top rendering
      // component
      if (
        marker !== null &&
        marker.kind !== MarkerKind.Island
      ) {
        vnodeStack.pop();
      }
    }

    if (sib !== null) {
      sib = sib.nextSibling;
    }
  }
}

export class NoPartialsError extends Error {}
