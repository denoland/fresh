import { Island } from "../app.ts";
import { FreshContext } from "../context.ts";

export type Mode = "dev" | "build" | "prod";
export let MODE: Mode = "prod";

export function setMode(mode: Mode) {
  MODE = mode;
}

// FIXME: Clean up type
export interface FreshRenderContext {
  __fresh: {
    islands: Set<Island>;
    ctx: FreshContext<any>;
  };
}

export function FreshScripts(_props: unknown, context: FreshRenderContext) {
  const { islands } = context.__fresh;
  const basePath = context.__fresh.ctx.config.basePath;
  // FIXME: Don't make optional
  const buildCache = context.__fresh.ctx.buildCache!;

  // FIXME: integrity
  return (
    <>
      {Array.from(islands).map((island) => {
        const chunk = buildCache.islandToChunk(island.name);
        return <script type="module" src={basePath + chunk}></script>;
      })}
      <script type="module" src={basePath + "/fresh-runtime.js"}></script>
    </>
  );
}
