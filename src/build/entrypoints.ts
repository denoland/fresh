import { Island, Plugin } from "../server/types.ts";

export function collectEntrypoints(
  dev: boolean,
  islands: Island[],
  plugins: Plugin[],
): Record<string, string> {
  const entrypointBase = "../runtime/entrypoints";
  const entryPoints: Record<string, string> = {
    main: dev
      ? import.meta.resolve(`${entrypointBase}/main_dev.ts`)
      : import.meta.resolve(`${entrypointBase}/main.ts`),
    deserializer: import.meta.resolve(`${entrypointBase}/deserializer.ts`),
    client: import.meta.resolve(`${entrypointBase}/client.ts`),
  };

  try {
    import.meta.resolve("@preact/signals");
    entryPoints.signals = import.meta.resolve(`${entrypointBase}/signals.ts`);
  } catch {
    // @preact/signals is not in the import map
  }

  for (const island of islands) {
    entryPoints[`island-${island.id}`] = island.url;
  }

  for (const plugin of plugins) {
    for (const [name, url] of Object.entries(plugin.entrypoints ?? {})) {
      entryPoints[`plugin-${plugin.name}-${name}`] = url;
    }
  }

  return entryPoints;
}
