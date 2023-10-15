import {
  Component,
  type ComponentChildren,
  ComponentType,
  Fragment,
  h,
  isValidElement,
  type Options as PreactOptions,
  options as preactOptions,
  type VNode,
} from "preact";
import { assetHashingHook } from "../../runtime/utils.ts";
import { Partial, PartialProps } from "../../runtime/Partial.tsx";
import { renderToString } from "preact-render-to-string";
import { RenderState } from "./state.ts";
import { Island } from "../types.ts";
import {
  CLIENT_NAV_ATTR,
  DATA_KEY_ATTR,
  LOADING_ATTR,
  PartialMode,
} from "../../constants.ts";
import { setActiveUrl } from "../../runtime/active_url.ts";

// See: https://github.com/preactjs/preact/blob/7748dcb83cedd02e37b3713634e35b97b26028fd/src/internal.d.ts#L3C1-L16
enum HookType {
  useState = 1,
  useReducer = 2,
  useEffect = 3,
  useLayoutEffect = 4,
  useRef = 5,
  useImperativeHandle = 6,
  useMemo = 7,
  useCallback = 8,
  useContext = 9,
  useErrorBoundary = 10,
  // Not a real hook, but the devtools treat is as such
  useDebugvalue = 11,
}

// These hooks are long stable, but when we originally added them we
// weren't sure if they should be public.
interface AdvancedPreactOptions extends PreactOptions {
  /** Attach a hook that is invoked after a tree was mounted or was updated. */
  __c?(vnode: VNode, commitQueue: Component[]): void;
  /** Attach a hook that is invoked before a vnode has rendered. */
  __r?(vnode: VNode): void;
  errorBoundaries?: boolean;
  /** before diff hook */
  __b?(vnode: VNode): void;
  /** Attach a hook that is invoked before a hook's state is queried. */
  __h?(component: Component, index: number, type: HookType): void;
}
const options = preactOptions as AdvancedPreactOptions;

// Enable error boundaries in Preact.
options.errorBoundaries = true;

// Set up a preact option hook to track when vnode with custom functions are
// created.
let current: RenderState | null = null;
// Keep track of which component rendered which vnode. This allows us
// to detect when an island is rendered within another instead of being
// passed as children.
let ownerStack: VNode[] = [];
// Keep track of all available islands
const islandByComponent = new Map<ComponentType, Island>();
export function setAllIslands(islands: Island[]) {
  for (let i = 0; i < islands.length; i++) {
    const island = islands[i];
    islandByComponent.set(island.component, island);
  }
}

export function setRenderState(state: RenderState | null): void {
  if (current) current.clearTmpState();
  current = state;
  ownerStack = state?.ownerStack ?? [];
}

// Check if an older version of `preact-render-to-string` is used
const supportsUnstableComments = renderToString(h(Fragment, {
  // @ts-ignore unstable features not supported in types
  UNSTABLE_comment: "foo",
}) as VNode) !== "";

if (!supportsUnstableComments) {
  console.warn(
    "⚠️  Found old version of 'preact-render-to-string'. Please upgrade it to >=6.1.0",
  );
}

/**
 *  Wrap a node with comment markers in the HTML
 */
function wrapWithMarker(vnode: ComponentChildren, markerText: string) {
  // Newer versions of preact-render-to-string allow you to render comments
  if (supportsUnstableComments) {
    return h(
      Fragment,
      null,
      h(Fragment, {
        // @ts-ignore unstable property is not typed
        UNSTABLE_comment: markerText,
      }),
      vnode,
      h(Fragment, {
        // @ts-ignore unstable property is not typed
        UNSTABLE_comment: "/" + markerText,
      }),
    );
  } else {
    return h(
      `!--${markerText}--`,
      null,
      vnode,
    );
  }
}

/**
 * Whenever a slot (=jsx children) is rendered, remove this from the slot
 * tracking Set. After everything was rendered we'll know which slots
 * weren't and can send them down to the client
 */
function SlotTracker(
  props: { id: string; children?: ComponentChildren },
): VNode {
  current?.slots.delete(props.id);
  // deno-lint-ignore no-explicit-any
  return props.children as any;
}

/**
 * Copy props but exclude children
 */
function excludeChildren(props: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k in props) {
    if (k !== "children") out[k] = props[k];
  }
  return out;
}

/**
 * Check if the current component was rendered in an island
 */
function hasIslandOwner(current: RenderState, vnode: VNode): boolean {
  let tmpVNode = vnode;
  let owner;
  while ((owner = current.owners.get(tmpVNode)) !== undefined) {
    if (islandByComponent.has(owner.type as ComponentType)) {
      return true;
    }
    tmpVNode = owner;
  }

  return false;
}

function encodePartialMode(mode: PartialProps["mode"]): PartialMode {
  if (mode === "replace") return PartialMode.REPLACE;
  else if (mode === "append") return PartialMode.APPEND;
  else if (mode === "prepend") return PartialMode.PREPEND;
  throw new Error(`Unknown partial mode "${mode}"`);
}

const patched = new WeakSet<VNode>();

const oldVNodeHook = options.vnode;
const oldDiff = options.__b;
const oldDiffed = options.diffed;
const oldRender = options.__r;
const oldHook = options.__h;

options.vnode = (vnode) => {
  assetHashingHook(vnode);

  // Work around `preact/debug` string event handler error which
  // errors when an event handler gets a string. This makes sense
  // on the client where this is a common vector for XSS. On the
  // server when the string was not created through concatenation
  // it is fine. Internally, `preact/debug` only checks for the
  // lowercase variant.
  if (typeof vnode.type === "string") {
    const props = vnode.props as Record<string, unknown>;
    for (const key in props) {
      const value = props[key];
      if (key.startsWith("on") && typeof value === "string") {
        delete props[key];
        props["ON" + key.slice(2)] = value;
      }
    }
    // Don't do key preservation for nodes in <head>.
    if (
      vnode.key && vnode.type !== "meta" && vnode.type !== "title" &&
      vnode.type !== "style" && vnode.type !== "script" && vnode.type !== "link"
    ) {
      props[DATA_KEY_ATTR] = vnode.key;
    }

    if (props[LOADING_ATTR]) {
      // Avoid automatic signals unwrapping
      props[LOADING_ATTR] = { value: props[LOADING_ATTR] };
    }

    if (typeof props[CLIENT_NAV_ATTR] === "boolean") {
      props[CLIENT_NAV_ATTR] = props[CLIENT_NAV_ATTR] ? "true" : "false";
    }
  } else if (
    current && typeof vnode.type === "function" && vnode.type !== Fragment &&
    ownerStack.length > 0
  ) {
    current.owners.set(vnode, ownerStack[ownerStack.length - 1]);
  }

  if (oldVNodeHook) oldVNodeHook(vnode);
};

options.__b = (vnode: VNode<Record<string, unknown>>) => {
  // Add CSP nonce to inline script tags
  if (typeof vnode.type === "string" && vnode.type === "script") {
    if (!vnode.props.nonce) {
      vnode.props.nonce = current!.getNonce();
    }
  }

  if (
    current && current.renderingUserTemplate
  ) {
    // Internally rendering happens in two phases. This is done so
    // that the `<Head>` component works. When we do the first render
    // we cache all attributes on `<html>`, `<head>` + its children, and
    // `<body>`. When doing so, we'll replace the tags with a Fragment node
    // so that they don't end up in the rendered HTML. Effectively this
    // means we'll only serialize the contents of `<body>`.
    //
    // After that render is finished we know all additional
    // meta tags that were inserted via `<Head>` and all islands that
    // we can add as preloads. Then we do a second render of the outer
    // HTML tags with the updated value and merge in the HTML generate by
    // the first render into `<body>` directly.
    if (
      typeof vnode.type === "string"
    ) {
      if (vnode.type === "html") {
        current.renderedHtmlTag = true;
        current.docHtml = excludeChildren(vnode.props);
        vnode.type = Fragment;
      } else if (vnode.type === "head") {
        current.docHead = excludeChildren(vnode.props);
        current.headChildren = true;
        vnode.type = Fragment;
        vnode.props = {
          __freshHead: true,
          children: vnode.props.children,
        };
      } else if (vnode.type === "body") {
        current.docBody = excludeChildren(vnode.props);
        vnode.type = Fragment;
      } else if (current.headChildren) {
        if (vnode.type === "title") {
          current.docTitle = h("title", vnode.props);
          vnode.props = { children: null };
        } else {
          current.docHeadNodes.push({
            type: vnode.type,
            props: vnode.props,
          });
        }
        vnode.type = Fragment;
      } else if (LOADING_ATTR in vnode.props) {
        current.islandProps.push({
          [LOADING_ATTR]: vnode.props[LOADING_ATTR],
        });
        vnode.props[LOADING_ATTR] = current.islandProps.length - 1;
      } else if (vnode.type === "a") {
        setActiveUrl(vnode, current.url.pathname);
      }
    } else if (typeof vnode.type === "function") {
      // Detect island vnodes and wrap them with a marker
      const island = islandByComponent.get(vnode.type);
      patchIsland:
      if (
        vnode.type !== Fragment &&
        island &&
        !patched.has(vnode)
      ) {
        current.islandDepth++;

        // Check if an island is rendered inside another island, not just
        // passed as a child.In that case we treat it like a normal
        // Component. Example:
        //   function Island() {
        //     return <OtherIsland />
        //   }
        if (hasIslandOwner(current, vnode)) {
          break patchIsland;
        }

        // At this point we know that we need to patch the island. Mark the
        // island in that we have already patched it.
        const originalType = vnode.type;
        patched.add(vnode);

        vnode.type = (props) => {
          if (!current) return null;

          const { encounteredIslands, islandProps, slots } = current;
          encounteredIslands.add(island);

          // Only passing children JSX to islands is supported for now
          const id = islandProps.length;
          if ("children" in props) {
            let children = props.children;

            // Guard against passing objects as children to JSX
            if (
              typeof children === "function" || (
                children !== null && typeof children === "object" &&
                !Array.isArray(children) &&
                !isValidElement(children)
              )
            ) {
              const name = originalType.displayName || originalType.name ||
                "Anonymous";

              throw new Error(
                `Invalid JSX child passed to island <${name} />. To resolve this error, pass the data as a standard prop instead.`,
              );
            }

            const markerText =
              `frsh-slot-${island.id}:${island.exportName}:${id}:children`;
            // @ts-ignore nonono
            props.children = wrapWithMarker(
              children,
              markerText,
            );
            slots.set(markerText, children);
            children = props.children;
            // deno-lint-ignore no-explicit-any
            (props as any).children = h(
              SlotTracker,
              { id: markerText },
              children,
            );
          }

          const child = h(originalType, props) as VNode;
          patched.add(child);
          islandProps.push(props);

          return wrapWithMarker(
            child,
            `frsh-${island.id}:${island.exportName}:${islandProps.length - 1}:${
              vnode.key ?? ""
            }`,
          );
        };
        // deno-lint-ignore no-explicit-any
      } else if (vnode.type === (Partial as any)) {
        current.partialCount++;
        current.partialDepth++;
        if (hasIslandOwner(current, vnode)) {
          throw new Error(
            `<Partial> components cannot be used inside islands.`,
          );
        }

        const mode = encodePartialMode(
          // deno-lint-ignore no-explicit-any
          (vnode.props as any).mode ?? "replace",
        );
        vnode.props.children = wrapWithMarker(
          vnode.props.children,
          `frsh-partial:${vnode.props.name}:${mode}:${vnode.key ?? ""}`,
        );
      } else if (
        vnode.key && (current.islandDepth > 0 || current.partialDepth > 0)
      ) {
        const child = h(vnode.type, vnode.props);
        vnode.type = Fragment;
        vnode.props = {
          children: wrapWithMarker(child, `frsh-key:${vnode.key}`),
        };
      }
    }
  }
  oldDiff?.(vnode);
};
options.__r = (vnode) => {
  if (
    typeof vnode.type === "function" &&
    vnode.type !== Fragment
  ) {
    ownerStack.push(vnode);
  }
  oldRender?.(vnode);
};
options.diffed = (vnode: VNode<Record<string, unknown>>) => {
  if (typeof vnode.type === "function") {
    if (vnode.type !== Fragment) {
      if (current) {
        if (islandByComponent.has(vnode.type)) {
          current.islandDepth--;
        } else if (vnode.type === Partial as ComponentType) {
          current.partialDepth--;
        }
      }

      ownerStack.pop();
    } else if (vnode.props.__freshHead) {
      if (current) {
        current.headChildren = false;
      }
    }
  }
  oldDiffed?.(vnode);
};

options.__h = (component, idx, type) => {
  // deno-lint-ignore no-explicit-any
  const vnode = (component as any).__v;
  // Warn when using stateful hooks outside of islands
  if (
    // Only error for stateful hooks for now.
    (type === HookType.useState || type === HookType.useReducer) && current &&
    !islandByComponent.has(vnode.type) && !hasIslandOwner(current, vnode) &&
    !current.error
  ) {
    const name = HookType[type];
    const message =
      `Hook "${name}" cannot be used outside of an island component.`;
    const hint = type === HookType.useState
      ? `\n\nInstead, use the "useSignal" hook to share state across islands.`
      : "";

    // Don't throw here because that messes up internal Preact state
    current.error = new Error(message + hint);
  }
  oldHook?.(component, idx, type);
};
