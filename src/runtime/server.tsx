import { Island } from "../app.ts";
import { FreshContext } from "../context.ts";
import { stringify } from "../jsonify/stringify.ts";

export type Mode = "dev" | "build" | "prod";
export let MODE: Mode = "prod";

export function setMode(mode: Mode) {
  MODE = mode;
}

// FIXME: Clean up type
export interface FreshRenderContext {
  __fresh: {
    islands: Set<Island>;
    islandProps: any[];
    ctx: FreshContext<any>;
  };
}

export function FreshScripts(_props: unknown, context: FreshRenderContext) {
  const { islands, islandProps, ctx } = context.__fresh;
  const basePath = ctx.config.basePath;
  // FIXME: Don't make optional
  const buildCache = ctx.buildCache!;

  const islandArr = Array.from(islands);

  const islandImports = islandArr.map((island) => {
    const chunk = buildCache.islandToChunk(island.name);
    const named = island.exportName === "default"
      ? island.name
      : `{ ${island.exportName} }`;
    return `import ${named} from "${chunk}";`;
  }).join("\n");

  const islandObj = "{" + islandArr.map((island) => {
    return `${island.name}: ${island.name}`;
  }).join(",\n") + "}";

  const serializedProps = islandProps.map((props) => stringify(props));
  console.log(islandProps, serializedProps);

  // FIXME: integrity
  return (
    <script
      type="module"
      nonce={ctx.requestId}
      dangerouslySetInnerHTML={{
        __html: `import { boot } from "${basePath}/fresh-runtime.js";
${islandImports}
  boot(${islandObj}, [${serializedProps.join(", ")}])`,
      }}
    >
    </script>
  );
}
