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
import type { Signal } from "@preact/signals";
import type { Stringifiers } from "../../jsonify/stringify.ts";
import type { PageProps } from "../../context.ts";
import { asset, Partial, type PartialProps } from "../shared.ts";
import { stringify } from "../../jsonify/stringify.ts";
import type { ServerIslandRegistry } from "../../context.ts";
import type { Island } from "../../context.ts";
import {
  assetHashingHook,
  CLIENT_NAV_ATTR,
  DATA_FRESH_KEY,
  PartialMode,
  setActiveUrl,
} from "../shared_internal.tsx";
import type { BuildCache } from "../../build_cache.ts";
import { BUILD_ID } from "../build_id.ts";
import { DEV_ERROR_OVERLAY_URL } from "../../constants.ts";
import {
  getCodeFrame,
} from "../../dev/middlewares/error_overlay/code_frame.tsx";
import * as colors from "@std/fmt/colors";
import { escape as escapeHtml } from "@std/html";
import { HttpError } from "../../error.ts";

const enum OptionsType {
  ATTR = "attr",
  VNODE = "vnode",
  HOOK = "__h",
  DIFF = "__b",
  RENDER = "__r",
  DIFFED = "diffed",
  ERROR = "__e",
}

interface InternalPreactOptions extends PreactOptions {
  [OptionsType.ATTR](name: string, value: unknown): string | void;
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
  partialDepth = 0;
  partialCount = 0;
  error: Error | null = null;
  // deno-lint-ignore no-explicit-any
  slots: Array<{ id: number; name: string; vnode: VNode<any> } | null> = [];
  basePath = ""; // FIXME
  // deno-lint-ignore no-explicit-any
  islandProps: any[] = [];
  islands = new Set<Island>();
  // deno-lint-ignore no-explicit-any
  encounteredPartials = new Set<any>();
  owners = new Map<VNode, VNode>();
  ownerStack: InternalVNode[] = [];

  // TODO: merge into bitmask field
  renderedHtmlTag = false;
  renderedHtmlBody = false;
  renderedHtmlHead = false;
  hasRuntimeScript = false;

  constructor(
    public ctx: PageProps<unknown, unknown>,
    public islandRegistry: ServerIslandRegistry,
    public buildCache: BuildCache,
    public partialId: string,
  ) {
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
    if (vnode.type === "a") {
      setActiveUrl(vnode, RENDER_STATE.ctx.url.pathname);
    }
  }
  assetHashingHook(vnode, BUILD_ID);

  if (typeof vnode.type === "function") {
    if (vnode.type === Partial) {
      const props = vnode.props as PartialProps;
      const key = normalizeKey(vnode.key ?? "");
      const mode = !props.mode || props.mode === "replace"
        ? PartialMode.Replace
        : props.mode === "append"
        ? PartialMode.Append
        : PartialMode.Prepend;
      props.children = wrapWithMarker(
        props.children,
        "partial",
        `${props.name}:${mode}:${key}`,
      );
    }
  } else if (typeof vnode.type === "string") {
    if (vnode.type === "body") {
      const scripts = h(FreshScripts, null);
      if (vnode.props.children == null) {
        vnode.props.children = scripts;
      } else if (Array.isArray(vnode.props.children)) {
        vnode.props.children.push(scripts);
      } else {
        vnode.props.children = [vnode.props.children, scripts];
      }
    }
    if (CLIENT_NAV_ATTR in vnode.props) {
      vnode.props[CLIENT_NAV_ATTR] = String(vnode.props[CLIENT_NAV_ATTR]);
    }
  }

  oldVNodeHook?.(vnode);
};

const oldAttrHook = options[OptionsType.ATTR];
options[OptionsType.ATTR] = (name, value) => {
  if (name === CLIENT_NAV_ATTR) {
    return `${CLIENT_NAV_ATTR}="${String(Boolean(value))}"`;
  } else if (name === "key") {
    return `${DATA_FRESH_KEY}="${escapeHtml(String(value))}"`;
  }

  return oldAttrHook?.(name, value);
};

const PATCHED = new WeakSet<VNode>();

function normalizeKey(str: string) {
  return str.replaceAll(":", "_");
}

const oldDiff = options[OptionsType.DIFF];
options[OptionsType.DIFF] = (vnode) => {
  if (RENDER_STATE !== null) {
    patcher: if (
      typeof vnode.type === "function" && vnode.type !== Fragment
    ) {
      if (vnode.type === Partial) {
        RENDER_STATE.partialDepth++;

        const name = (vnode.props as PartialProps).name;
        if (typeof name === "string") {
          if (RENDER_STATE.encounteredPartials.has(name)) {
            throw new Error(
              `Rendered response contains duplicate partial name: "${name}"`,
            );
          }

          RENDER_STATE.encounteredPartials.add(name);
        }

        if (hasIslandOwner(RENDER_STATE, vnode)) {
          throw new Error(
            `<Partial> components cannot be used inside islands.`,
          );
        }
      } else if (
        !PATCHED.has(vnode) && !hasIslandOwner(RENDER_STATE, vnode)
      ) {
        const island = RENDER_STATE.islandRegistry.get(vnode.type);
        if (island === undefined) {
          // Not an island, but we might need to preserve keys
          if (vnode.key !== undefined) {
            const key = normalizeKey(vnode.key ?? "");
            const originalType = vnode.type;
            vnode.type = (props) => {
              const child = h(originalType, props);
              PATCHED.add(child);
              return wrapWithMarker(child, "key", key);
            };
          }

          break patcher;
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

          const key = normalizeKey(vnode.key ?? "");
          return wrapWithMarker(
            child,
            "island",
            `${island!.name}:${propsIdx}:${key}`,
          );
        };
      }
    } else if (typeof vnode.type === "string") {
      switch (vnode.type) {
        case "html":
          RENDER_STATE!.renderedHtmlTag = true;
          break;
        case "head":
          RENDER_STATE!.renderedHtmlHead = true;
          break;
        case "body":
          RENDER_STATE!.renderedHtmlBody = true;
          break;
      }

      if (
        vnode.key !== undefined &&
        (RENDER_STATE!.partialDepth > 0 || hasIslandOwner(RENDER_STATE!, vnode))
      ) {
        (vnode.props as Record<string, unknown>)[DATA_FRESH_KEY] = String(
          vnode.key,
        );
      }
    }
  }

  oldDiff?.(vnode);
};

const oldRender = options[OptionsType.RENDER];
options[OptionsType.RENDER] = (vnode) => {
  if (
    typeof vnode.type === "function" && vnode.type !== Fragment &&
    RENDER_STATE !== null
  ) {
    RENDER_STATE.ownerStack.push(vnode);
  }
  oldRender?.(vnode);
};

const oldDiffed = options[OptionsType.DIFFED];
options[OptionsType.DIFFED] = (vnode) => {
  if (
    typeof vnode.type === "function" && vnode.type !== Fragment &&
    RENDER_STATE !== null
  ) {
    RENDER_STATE.ownerStack.pop();

    if (vnode.type === Partial) {
      RENDER_STATE.partialDepth--;
    }
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
    if (current.islandRegistry.has(owner.type as ComponentType)) {
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

export function FreshScripts() {
  if (RENDER_STATE === null) return null;
  if (RENDER_STATE.hasRuntimeScript) {
    return null;
  }
  RENDER_STATE.hasRuntimeScript = true;
  const { slots } = RENDER_STATE;

  // Remaining slots must be rendered before creating the Fresh runtime
  // script, so that we have the full list of islands rendered
  return (
    <>
      {slots.map((slot) => {
        if (slot === null) return null;
        return (
          <template
            key={slot.id}
            id={`frsh-${slot.id}-${slot.name}`}
          >
            {slot.vnode}
          </template>
        );
      })}
      <FreshRuntimeScript />
    </>
  );
}

export interface PartialStateJson {
  islands: {
    name: string;
    chunk: string;
    exportName: string;
  }[];
  props: string;
}

function FreshRuntimeScript() {
  const { islands, nonce, ctx, islandProps, partialId, buildCache } =
    RENDER_STATE!;
  const basePath = ctx.config.basePath;

  const islandArr = Array.from(islands);

  if (ctx.url.searchParams.has("fresh-partial")) {
    const islands = islandArr.map((island) => {
      const chunk = buildCache.getIslandChunkName(island.name);
      if (chunk === null) {
        throw new Error(
          `Could not find chunk for ${island.name} ${island.file}#${island.exportName}`,
        );
      }
      return {
        exportName: island.exportName,
        chunk: asset(chunk),
        name: island.name,
      };
    });

    const serializedProps = stringify(islandProps, stringifiers);
    const json: PartialStateJson = {
      islands,
      props: serializedProps,
    };

    return (
      <script
        id={`__FRSH_STATE_${partialId}`}
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
      />
    );
  } else {
    const islandImports = islandArr.map((island) => {
      const chunk = buildCache.getIslandChunkName(island.name);
      if (chunk === null) {
        throw new Error(
          `Could not find chunk for ${island.name} ${island.file}#${island.exportName}`,
        );
      }
      const named = island.exportName === "default"
        ? island.name
        : `{ ${island.exportName} }`;
      return `import ${named} from "${asset(chunk)}";`;
    }).join("");

    const islandObj = "{" + islandArr.map((island) => island.name)
      .join(",") +
      "}";

    const serializedProps = JSON.stringify(
      stringify(islandProps, stringifiers),
    );

    const runtimeUrl = asset(`${basePath}/fresh-runtime.js`);
    const scriptContent =
      `import { boot } from "${runtimeUrl}";${islandImports}boot(${islandObj},${serializedProps});`;

    return (
      <>
        <script
          type="module"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: scriptContent,
          }}
        />
        {ctx.config.mode === "development" ? <ShowErrorOverlay /> : null}
      </>
    );
  }
}

export function ShowErrorOverlay() {
  if (RENDER_STATE === null) return null;

  const { ctx } = RENDER_STATE;
  const error = ctx.error;

  if (error === null || error === undefined) return null;

  // Ignore HTTP errors <500
  if (error instanceof HttpError && error.status < 500) {
    return null;
  }

  const basePath = ctx.config.basePath;

  const searchParams = new URLSearchParams();

  if (typeof error === "object") {
    if ("message" in error) {
      searchParams.append("message", String(error.message));
    }

    if ("stack" in error && typeof error.stack === "string") {
      searchParams.append("stack", error.stack);
      const codeFrame = getCodeFrame(error.stack, ctx.config.root);
      if (codeFrame !== undefined) {
        searchParams.append("code-frame", colors.stripAnsiCode(codeFrame));
      }
    }
  } else {
    searchParams.append("message", String(error));
  }

  return (
    <iframe
      id="fresh-error-overlay"
      src={`${basePath}${DEV_ERROR_OVERLAY_URL}?${searchParams.toString()}`}
      style="unset: all; position: fixed; top: 0; left: 0; z-index: 99999; width: 100%; height: 100%; border: none;"
    />
  );
}
