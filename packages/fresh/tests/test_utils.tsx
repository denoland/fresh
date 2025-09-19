import type { App } from "../src/app.ts";
import * as path from "@std/path";
import type { ComponentChildren } from "preact";
import { Builder, type BuildOptions } from "../src/dev/builder.ts";

// Generic helpers like withBrowserApp, withBrowser, parseHtml, waitFor, waitForText
// have been moved to @fresh/internal/test-utils. This file now only contains
// project-specific helpers used by the Fresh package tests.

export const charset = <meta charset="utf-8" />;

export const favicon = (
  <link
    href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII="
    rel="icon"
    type="image/x-icon"
  />
);

export function Doc(props: { children?: ComponentChildren; title?: string }) {
  return (
    <html>
      <head>
        {charset}
        <title>{props.title ?? "Test"}</title>
        {favicon}
      </head>
      <body>
        {props.children}
      </body>
    </html>
  );
}

export const ALL_ISLAND_DIR = path.join(
  import.meta.dirname!,
  "fixtures_islands",
);
export const ISLAND_GROUP_DIR = path.join(
  import.meta.dirname!,
  "fixture_island_groups",
);

export async function buildProd(
  options: Omit<BuildOptions, "outDir">,
): Promise<<T>(app: App<T>) => void> {
  const outDir = await Deno.makeTempDir();
  const builder = new Builder({ outDir, ...options });
  return await builder.build({ mode: "production", snapshot: "memory" });
}

// ---------------- Project-specific helpers below ----------------

const ISLAND_FIXTURE_DIR = path.join(import.meta.dirname!, "fixtures_islands");
const allIslandBuilder = new Builder({});
for await (const entry of Deno.readDirSync(ISLAND_FIXTURE_DIR)) {
  if (entry.name.endsWith(".json")) continue;

  const spec = path.join(ISLAND_FIXTURE_DIR, entry.name);
  allIslandBuilder.registerIsland(spec);
}
