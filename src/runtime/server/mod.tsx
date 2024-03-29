import type { Signal } from "@preact/signals";
import type { Island } from "../../app.ts";
import type { FreshContext } from "../../context.ts";
import { type Stringifiers, stringify } from "../../jsonify/stringify.ts";
import { isValidElement, type VNode } from "preact";

/**
 * The mode Fresh can run in.
 */
export type Mode = "development" | "build" | "production";
export let MODE: Mode = "production";

export function setMode(mode: Mode) {
  MODE = mode;
}

// FIXME: Clean up type
export interface FreshRenderContext {
  __fresh: {
    islands: Set<Island>;
    islandProps: { slots: string[]; props: unknown }[];
    // deno-lint-ignore no-explicit-any
    ctx: FreshContext<any>;
  };
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
  VNode: (value: unknown) => {
    return isVNode(value) ? "<VNODE>" : undefined;
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
  context: FreshRenderContext,
): VNode => {
  const { islands, islandProps, ctx } = context.__fresh;
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

  const scriptContent =
    `import { boot } from "${basePath}/fresh-runtime.js";${islandImports}boot(${islandObj},\`${serializedProps}\`);`;

  // FIXME: integrity
  // FIXME: nonce
  return (
    <script
      type="module"
      dangerouslySetInnerHTML={{
        __html: scriptContent,
      }}
    >
    </script>
  );
}) as () => VNode;
