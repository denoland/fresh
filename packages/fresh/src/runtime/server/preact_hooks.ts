import {
  type Component,
  type ComponentChildren,
  type ComponentType,
  createContext,
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
} from "../shared_internal.ts";
import type { BuildCache } from "../../build_cache.ts";
import { BUILD_ID } from "@fresh/build-id";
import {
  DEV_ERROR_OVERLAY_URL,
  PARTIAL_SEARCH_PARAM,
} from "../../constants.ts";
import { escape as escapeHtml } from "@std/html";
import { HttpError } from "../../error.ts";
import { getCodeFrame } from "../../dev/middlewares/error_overlay/code_frame.ts";
import { escapeScript } from "../../utils.ts";
import { HeadContext } from "../head.ts";
import { useContext } from "preact/hooks";
import { AsyncLocalStorage } from "node:async_hooks";

export const asyncRenderStorage = new AsyncLocalStorage<RenderState>({
  name: "render",
});

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

const HeadRenderCtx = createContext(false);

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
  islandAssets = new Set<string>();
  // deno-lint-ignore no-explicit-any
  encounteredPartials = new Set<any>();
  owners = new Map<VNode, VNode>();
  ownerStack: InternalVNode[] = [];

  headComponents = new Map<string, VNode>();
  headPromise = Promise.withResolvers<void>();
  headPromiseResolved = false;
  headPatched = false;

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

const oldVNodeHook = options[OptionsType.VNODE];
options[OptionsType.VNODE] = (vnode) => {
  const state = asyncRenderStorage.getStore();
  if (state !== undefined) {
    state.owners.set(vnode, state.ownerStack.at(-1)!);
    if (vnode.type === "a") {
      setActiveUrl(vnode, state.ctx.url.pathname);
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
    } else if (vnode.type === "head") {
      console.log("create head");
      if (state !== undefined && !state.headPatched) {
        console.log("patch head");
        vnode.type = HeadRenderer;
        state.headPatched = true;
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
  console.log("--> diff", vnode.type);
  const state = asyncRenderStorage.getStore();
  if (state !== undefined) {
    patcher: if (
      typeof vnode.type === "function" && vnode.type !== Fragment
    ) {
      if (vnode.type === Partial) {
        state.partialDepth++;

        const name = (vnode.props as PartialProps).name;
        if (typeof name === "string") {
          if (state.encounteredPartials.has(name)) {
            throw new Error(
              `Rendered response contains duplicate partial name: "${name}"`,
            );
          }

          state.encounteredPartials.add(name);
        }

        if (hasIslandOwner(state, vnode)) {
          throw new Error(
            `<Partial> components cannot be used inside islands.`,
          );
        }
      } else if (
        !PATCHED.has(vnode)
      ) {
        const island = state.buildCache.islandRegistry.get(vnode.type);
        const insideIsland = hasIslandOwner(state, vnode);
        if (island === undefined) {
          if (insideIsland) break patcher;

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

        const { islands, islandProps, islandAssets } = state;

        if (insideIsland) {
          for (let i = 0; i < island.css.length; i++) {
            const css = island.css[i];
            islandAssets.add(css);
          }
          break patcher;
        }

        islands.add(island);

        const originalType = vnode.type;
        vnode.type = (props) => {
          for (const name in props) {
            // deno-lint-ignore no-explicit-any
            const value = (props as any)[name];
            if (
              name === "children" || (isValidElement(value) && !isSignal(value))
            ) {
              const slotId = state.slots.length;
              state.slots.push({ id: slotId, name, vnode: value });
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
          state.renderedHtmlTag = true;
          break;
        case "head": {
          state.renderedHtmlHead = true;
          console.log("--> render head");
          break;
        }
        case "body":
          state.renderedHtmlBody = true;
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
            if (vnode.type === "title") {
              console.log(vnode.props, "patched", PATCHED.has(vnode));
            }
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
              const rendering = useContext(HeadRenderCtx);

              if (originalKey) {
                props["data-key"] = originalKey;
              }
              console.log({ rendering, value, cacheKey });

              const vnode = h(originalType, props);
              PATCHED.add(vnode);

              if (state !== undefined) {
                if (value) {
                  state.headComponents.set(cacheKey, vnode);
                  return null;
                } else if (value !== undefined) {
                  const cached = state.headComponents.get(cacheKey);
                  if (cached !== undefined) {
                    state.headComponents.delete(cacheKey);
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
        (state.partialDepth > 0 || hasIslandOwner(state, vnode))
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
  const state = asyncRenderStorage.getStore();
  if (
    typeof vnode.type === "function" && vnode.type !== Fragment &&
    state !== undefined
  ) {
    state.ownerStack.push(vnode);
  }
  oldRender?.(vnode);
};

const oldDiffed = options[OptionsType.DIFFED];
options[OptionsType.DIFFED] = (vnode) => {
  console.log("<-- diffed", vnode.type);
  const state = asyncRenderStorage.getStore();
  if (
    typeof vnode.type === "function" && vnode.type !== Fragment &&
    state !== undefined
  ) {
    state.ownerStack.pop();

    if (vnode.type === Partial) {
      state.partialDepth--;
    }
  }
  oldDiffed?.(vnode);
};

function RemainingHead() {
  const state = asyncRenderStorage.getStore();
  if (state !== undefined) {
    // deno-lint-ignore no-explicit-any
    const items: VNode<any>[] = [];
    if (state.headComponents.size > 0) {
      items.push(...state.headComponents.values());
    }

    state.islands.forEach((island) => {
      if (island.css.length > 0) {
        for (let i = 0; i < island.css.length; i++) {
          const css = island.css[i];
          items.push(h("link", { rel: "stylesheet", href: css }));
        }
      }
    });

    state.islandAssets.forEach((css) => {
      items.push(h("link", { rel: "stylesheet", href: css }));
    });

    if (items.length > 0) {
      return h(Fragment, null, items);
    }
  }
  return null;
}

interface SlotProps {
  name: string;
  id: number;
  children?: ComponentChildren;
}
function Slot(props: SlotProps) {
  const state = asyncRenderStorage.getStore();
  if (state !== undefined) {
    state.slots[props.id] = null;
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

export async function HeadRenderer(props: { children?: ComponentChildren }) {
  const children = (!Array.isArray(props.children))
    ? [props.children]
    : props.children;

  const state = asyncRenderStorage.getStore();

  console.log("--> async");

  if (state !== undefined) {
    await state.headPromise.promise;

    const entryAssets = state.buildCache.getEntryAssets();
    if (entryAssets.length > 0) {
      for (let i = 0; i < entryAssets.length; i++) {
        const id = entryAssets[i];

        if (id.endsWith(".css")) {
          children.push(
            // deno-lint-ignore no-explicit-any
            h("link", { rel: "stylesheet", href: asset(id) } as any),
          );
        }
      }
    }

    // deno-lint-ignore no-explicit-any
    children.push(h(RemainingHead, null) as VNode<any>);
  }

  console.log("resolved async --> ", state?.headComponents.keys());

  return h(
    HeadRenderCtx.Provider,
    { value: true },
    h("head", null, children),
  );
}

export function FreshScripts() {
  const state = asyncRenderStorage.getStore();

  if (state === undefined) return null;
  state.headPromise.resolve();
  state.headPromiseResolved = true;

  if (state.hasRuntimeScript) {
    return null;
  }
  state.hasRuntimeScript = true;
  const { slots } = state;

  // Remaining slots must be rendered before creating the Fresh runtime
  // script, so that we have the full list of islands rendered
  return (
    h(
      Fragment,
      null,
      slots.map((slot) => {
        if (slot === null) return null;
        return (
          h("template", {
            key: slot.id,
            id: `frsh-${slot.id}-${slot.name}`,
          }, slot.vnode)
        );
      }),
      h(FreshRuntimeScript, null),
    )
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
  const state = asyncRenderStorage.getStore();
  const { islands, nonce, ctx, islandProps, partialId, buildCache } = state!;
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
      h("script", {
        id: `__FRSH_STATE_${partialId}`,
        type: "application/json",
        dangerouslySetInnerHTML: {
          __html: escapeScript(JSON.stringify(json), { json: true }),
        },
      })
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
      h(
        Fragment,
        null,
        h("script", {
          type: "module",
          nonce,
          dangerouslySetInnerHTML: { __html: scriptContent },
        }),
        buildCache.features.errorOverlay ? h(ShowErrorOverlay, null) : null,
      )
    );
  }
}

export function ShowErrorOverlay() {
  const state = asyncRenderStorage.getStore();
  if (state === undefined) return null;

  const { ctx } = state;
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
    h("iframe", {
      id: "fresh-error-overlay",
      src: `${basePath}${DEV_ERROR_OVERLAY_URL}?${searchParams.toString()}`,
      style:
        "unset: all; position: fixed; top: 0; left: 0; z-index: 99999; width: 100%; height: 100%; border: none;",
    })
  );
}
