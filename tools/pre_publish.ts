import * as path from "@std/path";
import type { DenoConfig } from "../src/dev/builder.ts";

const denoJsonPath = path.join(import.meta.dirname!, "..", "deno.json");
const denoJson = JSON.parse(
  await Deno.readTextFile(denoJsonPath),
) as DenoConfig;

const replaceLibs = ["preact", "preact-render-to-string", "@preact/signals"];

if (denoJson.imports) {
  for (const replace of replaceLibs) {
    const value = denoJson.imports[replace];
    if (value === undefined) continue;

    // Remove url expansion imports. They are not neede with
    // `npm:` or `jsr:` prefixes.
    delete denoJson.imports[replace + "/"];

    const match = value.match(
      /^https:\/\/esm\.sh\/((@\w+\/)?[^@\?]+)(@[^\?]+)?.*$/,
    );
    if (match !== null) {
      denoJson.imports[replace] = `npm:${match[1]}${match[3]}`;
    }
  }
}

await Deno.writeTextFile(denoJsonPath, JSON.stringify(denoJson, null, 2));
