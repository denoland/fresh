import { walk } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { generate } from "./src/dev/manifest.ts";
import { collect } from "./src/dev/mod.ts";
import type { FreshConfig } from "./src/server/mod.ts";

async function runGenerateInFixtures() {
  for await (const entry of walk(Deno.cwd(), { maxDepth: 10 })) {
    if (entry.isDirectory && entry.name.startsWith("fixture")) {
      console.log(`Processing ${entry.path}`);

      try {
        //TODO properly read config
        const config: FreshConfig = {};

        // Collect new manifest
        const newManifest = await collect(
          entry.path,
          config.router?.ignoreFilePattern,
        );

        await generate(entry.path, newManifest);
        console.log(`Manifest generated successfully in ${entry.path}`);
      } catch (error) {
        console.error(`Failed to process ${entry.path}:`, error);
      }
    }
  }
}

runGenerateInFixtures();
