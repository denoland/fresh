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
import type { ReadonlySignal, Signal } from "@preact/signals";
import type { Stringifiers } from "../../jsonify/stringify.ts";
import type { PageProps } from "../../render.ts";
import { asset, Partial, type PartialProps } from "../shared.ts";
import { stringify } from "../../jsonify/stringify.ts";
import type { Island } from "../../context.ts";
import {
  assetHashingHook,
  CLIENT_NAV_ATTR,
  DATA_FRESH_KEY,
  OptionsType,
  PartialMode,
  setActiveUrl,
} from "../shared_internal.tsx";
import type { BuildCache } from "../../build_cache.ts";
import { BUILD_ID } from "@fresh/build-id";
import {
  DEV_ERROR_OVERLAY_URL,
  PARTIAL_SEARCH_PARAM,
} from "../../constants.ts";
import { escape as escapeHtml } from "@std/html";
import { HttpError } from "../../error.ts";
import { getCodeFrame } from "../../dev/middlewares/error_overlay/code_frame.tsx";
import { escapeScript } from "../../utils.ts";
import { HeadContext } from "../head.tsx";
import { useContext } from "preact/hooks";

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
  // deno-lint-ignore no-explicit-any
  islandProps: any[] = [];
  islands = new Set<Island>();
  // deno-lint-ignore no-explicit-any
  encounteredPartials = new Set<any>();
  owners = new Map<VNode, VNode>();
  ownerStack: InternalVNode[] = [];

  headComponents = new Map<string, VNode>();

  // TODO: merge into bitmask field
  renderedHtmlTag = false;
  renderedHtmlBody = false;
  renderedHtmlHead = false;
  hasRuntimeScript = false;

  constructor(
    // deno-lint-ignore no-explicit-any
    public ctx: PageProps<any, any>,
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
      const key = normalizeKey(vnode.key);
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

function normalizeKey(key: unknown): string {
  const value = key ?? "";
  const s = (typeof value !== "string") ? String(value) : value;
  return s.replaceAll(":", "_");
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
        const island = RENDER_STATE.buildCache.islandRegistry.get(vnode.type);
        if (island === undefined) {
          // Not an island, but we might need to preserve keys
          if (vnode.key !== undefined) {
            const key = normalizeKey(vnode.key);
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

          const key = normalizeKey(vnode.key);
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
        case "head": {
          RENDER_STATE!.renderedHtmlHead = true;

          const entryAssets = RENDER_STATE.buildCache.getEntryAssets();
          if (entryAssets.length > 0) {
            const items: VNode[] = [];
            for (let i = 0; i < entryAssets.length; i++) {
              const id = entryAssets[i];

              if (id.endsWith(".css")) {
                items.push(
                  // deno-lint-ignore no-explicit-any
                  h("link", { rel: "stylesheet", href: asset(id) } as any),
                );
              }
            }

            if (Array.isArray(vnode.props.children)) {
              vnode.props.children.push(...items);
            } else if (
              vnode.props.children !== null &&
              typeof vnode.props.children === "object"
            ) {
              // deno-lint-ignore no-explicit-any
              items.push(vnode.props.children as any);
              vnode.props.children = items;
            } else {
              vnode.props.children = items;
            }
          }

          // Append component to render remaining head nodes
          const remaining = h(RemainingHead, null);
          if (Array.isArray(vnode.props.children)) {
            vnode.props.children.push(remaining);
          } else if (
            vnode.props.children !== null &&
            typeof vnode.props.children === "object"
          ) {
            vnode.props.children = [vnode.props.children, remaining];
          } else {
            vnode.props.children = remaining;
          }

          break;
        }
        case "body":
          RENDER_STATE!.renderedHtmlBody = true;
          break;
        case "title":
        case "meta":
        case "link":
        case "script":
        case "style":
        case "base":
        case "noscript":
        case "template":
          {
            if (PATCHED.has(vnode)) {
              break;
            }

            const originalType = vnode.type;

            let cacheKey: string | null = vnode.key ??
              (originalType === "title" ? "title" : null);

            if (cacheKey === null) {
              // deno-lint-ignore no-explicit-any
              const props = vnode.props as any;

              const keys = Object.keys(vnode.props);
              keys.sort();
              cacheKey = `${originalType}`;
              for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key === "children" || key === "nonce" || key === "ref") {
                  continue;
                } else if (key === "dangerouslySetInnerHTML") {
                  cacheKey += String(props[key].__html);
                  continue;
                } else if (originalType === "meta" && key === "content") {
                  continue;
                }

                cacheKey += `::${props[key]}`;
              }
            }

            const originalKey = vnode.key;

            // deno-lint-ignore no-explicit-any
            (vnode as any).type = (props: any) => {
              const value = useContext(HeadContext);

              if (originalKey) {
                props["data-key"] = originalKey;
              }

              const vnode = h(originalType, props);
              PATCHED.add(vnode);

              if (RENDER_STATE !== null) {
                if (value) {
                  RENDER_STATE.headComponents.set(cacheKey, vnode);
                  return null;
                } else if (value !== undefined) {
                  const cached = RENDER_STATE.headComponents.get(cacheKey);
                  if (cached !== undefined) {
                    RENDER_STATE.headComponents.delete(cacheKey);
                    return cached;
                  }
                }
              }

              return vnode;
            };
          }
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

function RemainingHead() {
  if (RENDER_STATE !== null && RENDER_STATE.headComponents.size > 0) {
    return h(Fragment, null, ...RENDER_STATE.headComponents.values());
  }
  return null;
}

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
    if (current.buildCache.islandRegistry.has(owner.type as ComponentType)) {
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
function isComputedSignal(x: any): x is ReadonlySignal {
  return isSignal(x) &&
    (("x" in x && typeof x.x === "function") ||
      "_fn" in x && typeof x._fn === "function");
}

// deno-lint-ignore no-explicit-any
function isVNode(x: any): x is VNode {
  return x !== null && typeof x === "object" && "type" in x && "ref" in x &&
    "__k" in x &&
    isValidElement(x);
}

const stringifiers: Stringifiers = {
  Computed: (value: unknown) => {
    return isComputedSignal(value) ? { value: value.peek() } : undefined;
  },
  Signal: (value: unknown) => {
    return isSignal(value) ? { value: value.peek() } : undefined;
  },
  Slot: (value: unknown) => {
    if (isVNode(value) && value.type === Slot) {
      const props = value.props as SlotProps;
      return {
        value: {
          name: props.name,
          id: props.id,
        },
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

  if (ctx.url.searchParams.has(PARTIAL_SEARCH_PARAM)) {
    const islands = islandArr.map((island) => {
      return {
        exportName: island.exportName,
        chunk: island.file,
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
        // deno-lint-ignore react-no-danger
        dangerouslySetInnerHTML={{
          __html: escapeScript(JSON.stringify(json), { json: true }),
        }}
      />
    );
  } else {
    const islandImports = islandArr.map((island) => {
      const named = island.exportName === "default"
        ? island.name
        : island.exportName === island.name
        ? `{ ${island.exportName} }`
        : `{ ${island.exportName} as ${island.name} }`;

      const islandSpec = island.file.startsWith(".")
        ? island.file.slice(1)
        : island.file;
      return `import ${named} from "${basePath}${islandSpec}";`;
    }).join("");

    const islandObj = "{" + islandArr.map((island) => island.name)
      .join(",") +
      "}";

    const serializedProps = escapeScript(
      JSON.stringify(stringify(islandProps, stringifiers)),
      { json: true },
    );

    const runtimeUrl = buildCache.clientEntry.startsWith(".")
      ? buildCache.clientEntry.slice(1)
      : buildCache.clientEntry;
    const scriptContent =
      `import { boot } from "${basePath}${runtimeUrl}";${islandImports}boot(${islandObj},${serializedProps});`;

    return (
      <>
        <script
          type="module"
          nonce={nonce}
          // deno-lint-ignore react-no-danger
          dangerouslySetInnerHTML={{
            __html: scriptContent,
          }}
        />
        {buildCache.features.errorOverlay ? <ShowErrorOverlay /> : null}
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
        searchParams.append("code-frame", codeFrame);
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
