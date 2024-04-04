import {
  type Component,
  type ComponentChildren,
  type ComponentType,
  Fragment,
  h,
  isValidElement,
  type Options as PreactOptions,
  options as preactOptions,
  type VNode,
} from "preact";
import { GLOBAL_ISLANDS } from "../../app.ts";
import type { Signal } from "@preact/signals";
import type { Stringifiers } from "../../jsonify/stringify.ts";
import type { FreshContext } from "../../context.ts";
import { Partial, type PartialProps } from "../shared.ts";
import { stringify } from "../../jsonify/stringify.ts";

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
  [OptionsType.DIFFED](vnode: InternalVNode): void;
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

export class RenderState {
  nonce: string;
  islandDepth = 0;
  partialDepth = 0;
  partialCount = 0;
  error: Error | null = null;
  // deno-lint-ignore no-explicit-any
  slots: Array<{ id: number; name: string; vnode: VNode<any> } | null> = [];
  basePath = ""; // FIXME
  // deno-lint-ignore no-explicit-any
  islandProps: any[] = [];
  // deno-lint-ignore no-explicit-any
  islands = new Set<any>();
  // deno-lint-ignore no-explicit-any
  encounteredPartials = new Set<any>();
  owners = new Map<VNode, VNode>();
  ownerStack: InternalVNode[] = [];

  constructor(public ctx: FreshContext) {
    this.nonce = crypto.randomUUID().replace(/-/g, "");
  }

  clear() {
    this.islands.clear();
    this.encounteredPartials.clear();
    this.owners.clear();
    this.slots = [];
    this.islandProps = [];
    this.ownerStack = [];
  }
}

let RENDER_STATE: RenderState | null = null;
export function setRenderState(state: RenderState | null) {
  RENDER_STATE = state;
}

const oldVNodeHook = options[OptionsType.VNODE];
options[OptionsType.VNODE] = (vnode) => {
  if (RENDER_STATE !== null) {
    RENDER_STATE.owners.set(vnode, RENDER_STATE!.ownerStack.at(-1)!);
  }

  if (typeof vnode.type === "function" && vnode.type === Partial) {
    const props = vnode.props as PartialProps;
    console.log("Partial", vnode);
    props.children = wrapWithMarker(
      props.children,
      "partial",
      `${props.name}:${vnode.key ?? ""}`,
    );
  }

  oldVNodeHook?.(vnode);
};

const PATCHED = new WeakSet<VNode>();

const oldDiff = options[OptionsType.DIFF];
options[OptionsType.DIFF] = (vnode) => {
  patchIslands: if (
    typeof vnode.type === "function" && vnode.type !== Fragment &&
    !PATCHED.has(vnode) && RENDER_STATE !== null &&
    !hasIslandOwner(RENDER_STATE, vnode)
  ) {
    const island = GLOBAL_ISLANDS.get(vnode.type);
    if (island === undefined) {
      break patchIslands;
    }

    const { islands, islandProps } = RENDER_STATE;
    islands.add(island);

    const originalType = vnode.type;
    vnode.type = (props) => {
      for (const name in props) {
        // deno-lint-ignore no-explicit-any
        const value = (props as any)[name];
        if (
          name === "children" || (isValidElement(value) && !isSignal(value))
        ) {
          const slotId = RENDER_STATE!.slots.length;
          RENDER_STATE!.slots.push({ id: slotId, name, vnode: value });
          // deno-lint-ignore no-explicit-any
          (props as any)[name] = h(Slot, {
            name,
            id: slotId,
          }, value);
        }
      }
      const propsIdx = islandProps.push({ slots: [], props }) - 1;

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

const oldRender = options[OptionsType.RENDER];
options[OptionsType.RENDER] = (vnode) => {
  if (typeof vnode.type === "function" && vnode.type !== Fragment) {
    RENDER_STATE!.ownerStack.push(vnode);
  }
  oldRender?.(vnode);
};

const oldDiffed = options[OptionsType.DIFFED];
options[OptionsType.DIFFED] = (vnode) => {
  if (typeof vnode.type === "function" && vnode.type !== Fragment) {
    RENDER_STATE!.ownerStack.pop();
  }
  oldDiffed?.(vnode);
};

interface SlotProps {
  name: string;
  id: number;
  children?: ComponentChildren;
}
function Slot(props: SlotProps) {
  if (RENDER_STATE !== null) {
    RENDER_STATE.slots[props.id] = null;
  }
  return wrapWithMarker(props.children, "slot", `${props.id}:${props.name}`);
}

/**
 * Check if the current component was rendered in an island
 */
function hasIslandOwner(current: RenderState, vnode: VNode): boolean {
  let tmpVNode = vnode;
  let owner;
  while ((owner = current.owners.get(tmpVNode)) !== undefined) {
    if (GLOBAL_ISLANDS.has(owner.type as ComponentType)) {
      return true;
    }
    tmpVNode = owner;
  }

  return false;
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

// deno-lint-ignore no-explicit-any
function isSignal(x: any): x is Signal {
  return (
    x !== null &&
    typeof x === "object" &&
    typeof x.peek === "function" &&
    "value" in x
  );
}

// deno-lint-ignore no-explicit-any
function isVNode(x: any): x is VNode {
  return x !== null && typeof x === "object" && "type" in x && "ref" in x &&
    "__k" in x &&
    isValidElement(x);
}

const stringifiers: Stringifiers = {
  Signal: (value: unknown) => {
    return isSignal(value) ? value.peek() : undefined;
  },
  Slot: (value: unknown) => {
    if (isVNode(value) && value.type === Slot) {
      const props = value.props as SlotProps;
      return {
        name: props.name,
        id: props.id,
      };
    }
  },
};

/**
 * Insert scripts passed to Fresh as well as the fresh runtime code into
 * the HTML. This is typically placed just before the closing body tag.
 * ```tsx
 * <body>
 *   <FreshScripts />
 * </body>
 * ```
 */
export const FreshScripts: () => VNode = ((
  _props: unknown,
): VNode => {
  const { slots } = RENDER_STATE!;

  // Remaining slots must be rendered before creating the Fresh runtime
  // script, so that we have the full list of islands rendered
  return (
    <>
      {slots.map((slot) => {
        if (slot === null) return null;
        // FIXME: Wait for https://github.com/preactjs/preact/pull/4334 to be
        // released
        return h(
          "template",
          { key: slot.id, id: `frsh-${slot.id}-${slot.name}` },
          slot.vnode,
          // deno-lint-ignore no-explicit-any
        ) as VNode<any>;
      })}
      <FreshRuntimeScript />
    </>
  );
}) as () => VNode;

function FreshRuntimeScript() {
  const { islands, nonce, ctx, islandProps } = RENDER_STATE!;
  const basePath = ctx.config.basePath;

  const islandArr = Array.from(islands);

  const islandImports = islandArr.map((island) => {
    const chunk = ctx.buildCache.getIslandChunkName(island.name);
    if (chunk === null) {
      throw new Error(
        `Could not find chunk for ${island.name} ${island.exportName}#${island.file}`,
      );
    }
    const named = island.exportName === "default"
      ? island.name
      : `{ ${island.exportName} }`;
    return `import ${named} from "${chunk}";`;
  }).join("");

  const islandObj = "{" + islandArr.map((island) => island.name)
    .join(",") +
    "}";

  const serializedProps = stringify(islandProps, stringifiers);

  // TODO: integrity?
  const scriptContent =
    `import { boot } from "${basePath}/fresh-runtime.js";${islandImports}boot(${islandObj},\`${serializedProps}\`);`;

  return (
    <script
      type="module"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: scriptContent,
      }}
    />
  );
}
