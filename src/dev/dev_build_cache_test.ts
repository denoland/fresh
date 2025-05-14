import { expect } from "@std/expect";
import * as path from "@std/path";
import { MemoryBuildCache } from "./dev_build_cache.ts";
import { FreshFileTransformer } from "./file_transformer.ts";
import { createFakeFs } from "../test_utils.ts";
import type { ResolvedFreshConfig } from "../mod.ts";

Deno.test({
  name: "MemoryBuildCache - should error if reading outside of staticDir",
  fn: async () => {
    const tmp = await Deno.makeTempDir();
    const config: ResolvedFreshConfig = {
      root: tmp,
      mode: "development",
      basePath: "/",
      staticDir: path.join(tmp, "static"),
      build: {
        outDir: path.join(tmp, "dist"),
      },
    };
    const fileTransformer = new FreshFileTransformer(createFakeFs({}));
    const buildCache = new MemoryBuildCache(
      config,
      "testing",
      fileTransformer,
      "latest",
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
