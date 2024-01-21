import { assert, delay, dirname, join, toFileUrl } from "./deps.ts";
import { FromManifestConfig, start } from "../src/server/mod.ts";
import { startFreshServer } from "$fresh/tests/test_utils.ts";

Deno.test("StartServer returns Deno.HttpServer object", async () => {
  const name = "./tests/fixture_lifecycle/dev.ts";
  const fixture = join(Deno.cwd(), name);
  const manifestPath = toFileUrl(join(dirname(fixture), "fresh.gen.ts")).href;
  const manifestMod = await import(manifestPath);

  const configPath = join(dirname(fixture), "fresh.config.ts");
  const m = await import(toFileUrl(configPath).href);
  const config: FromManifestConfig = m.default;

  const controller = new AbortController();
  const server = await start(manifestMod.default, {
    ...config,
    server: { signal: controller.signal },
  });

  if (server !== undefined) {
    assert(typeof server.ref === "function");
    assert(typeof server.unref === "function");
    controller.abort();
    await server.finished;
  }
});

Deno.test("StartServer handles lifecycle events correctly", async () => {
  const name = "./tests/fixture_lifecycle/dev.ts";
  const { lines } = await startFreshServer({
    args: ["run", "-A", name],
  });

  const output: string[] = [];
  let loadEventFired = false;
  let beforeUnloadEventFired = false;
  let unloadEventFired = false;
  await delay(3000);

  for await (const line of lines) {
    console.log(line);
    output.push(line);

    if (line === "load") loadEventFired = true;
    if (line === "beforeunload") beforeUnloadEventFired = true;
    if (line === "unload") unloadEventFired = true;

    if (loadEventFired && beforeUnloadEventFired && unloadEventFired) break;
  }

  assert(loadEventFired, "Load event not triggered");
  assert(beforeUnloadEventFired, "Beforeunload event not triggered");
  assert(unloadEventFired, "Unload event not triggered");
});
