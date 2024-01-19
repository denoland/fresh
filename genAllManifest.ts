import { walk } from "./src/dev/deps.ts";
import { manifest } from "./src/dev/mod.ts";
import type { FreshConfig } from "./src/server/mod.ts";

const skippedFixtures: string[] = [
  "fixture_invalid_handlers",
  "fixture_update_check",
];

async function runGenerateInFixtures() {
  for await (const entry of walk(Deno.cwd(), { maxDepth: 10 })) {
    if (entry.isDirectory && entry.name.startsWith("fixture")) {
      if (skippedFixtures.includes(entry.name)) {
        console.log(`Skipping ${entry.path}\n`);
        continue;
      }
      console.log(`Processing ${entry.path}`);

      try {
        const configPath = `${entry.path}/fresh.config.ts`;

        let config: FreshConfig;
        try {
          config = (await import(configPath)).default;
        } catch {
          console.warn(
            `No fresh.config.ts found or error in reading it at ${configPath}, using empty config.`,
          );
          config = {};
        }

        await manifest(entry.path, config.router?.ignoreFilePattern);
        console.log(`Manifest generated successfully in ${entry.path}\n`);
      } catch (error) {
        console.error(`Failed to process ${entry.path}:`, error);
        console.log();
      }
    }
  }
}

runGenerateInFixtures();
