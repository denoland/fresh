import { expect } from "@std/expect";
import { MemoryBuildCache } from "./dev_build_cache.ts";
import { FileTransformer } from "./file_transformer.ts";
import { createFakeFs, withTmpDir } from "../test_utils.ts";
import type { ResolvedBuildConfig } from "./builder.ts";

Deno.test({
  name: "MemoryBuildCache - should error if reading outside of staticDir",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;
    const config: ResolvedBuildConfig = {
      serverEntry: "main.ts",
      root: tmp,
      mode: "development",
      buildId: "",
      ignore: [],
      islandDir: "",
      outDir: "",
      routeDir: "",
      staticDir: "",
      target: "latest",
    };
    const fileTransformer = new FileTransformer(createFakeFs({}), tmp);
    const buildCache = new MemoryBuildCache(
      config,
      { dir: "", files: [], id: "" },
      fileTransformer,
    );

    const thrown = buildCache.readFile("../SECRETS.txt");
    const thrown2 = buildCache.readFile("./../../SECRETS.txt");
    const noThrown = buildCache.readFile("styles.css");
    const noThrown2 = buildCache.readFile(".well-known/foo.txt");
    const noThrown3 = buildCache.readFile("./styles.css");
    const noThrown4 = buildCache.readFile("./.well-known/foo.txt");
    await buildCache.flush();

    const err = "Processed file resolved outside of static dir";
    await expect(thrown).rejects.toThrow(err);
    await expect(thrown2).rejects.toThrow(err);
    await expect(noThrown).resolves.toBe(null);
    await expect(noThrown2).resolves.toBe(null);
    await expect(noThrown3).resolves.toBe(null);
    await expect(noThrown4).resolves.toBe(null);
  },
});
