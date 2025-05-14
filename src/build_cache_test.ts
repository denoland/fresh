import { expect } from "@std/expect";
import * as path from "@std/path";
import { ProdBuildCache, type StaticFile } from "./build_cache.ts";
import type { ResolvedFreshConfig } from "./mod.ts";

async function getContent(readResult: Promise<StaticFile | null>) {
  const res = await readResult;
  if (res === null) return null;
  if (res.readable instanceof Uint8Array) throw new Error("not implemented");
  return new Response(res.readable).text();
}

Deno.test({
  name: "ProdBuildCache - should error if reading outside of staticDir",
  fn: async () => {
    const tmp = await Deno.makeTempDir();
    const config: ResolvedFreshConfig = {
      root: tmp,
      mode: "production",
      basePath: "/",
      staticDir: path.join(tmp, "static"),
      buildOutDir: path.join(tmp, "dist"),
    };
    await Deno.mkdir(path.join(tmp, "static", ".well-known"), {
      recursive: true,
    });
    await Deno.mkdir(path.join(tmp, "dist", "static"), {
      recursive: true,
    });
    await Promise.all([
      Deno.writeTextFile(
        path.join(tmp, "dist", "secret-styles.css"),
        "SECRET!",
      ),
      Deno.writeTextFile(path.join(tmp, "SECRETS.txt"), "SECRET!"),
      Deno.writeTextFile(path.join(tmp, "dist", "static", "styles.css"), "OK"),
      Deno.writeTextFile(
        path.join(tmp, "static", ".well-known", "foo.txt"),
        "OK",
      ),
    ]);
    const buildCache = new ProdBuildCache(
      config,
      new Map(),
      new Map([
        ["../secret-styles.css", { generated: true, hash: "SECRET!" }],
        ["../SECRETS.txt", { generated: false, hash: "SECRET!" }],
        ["./../secret-styles.css", { generated: true, hash: "SECRET!" }],
        ["./../SECRETS.txt", { generated: false, hash: "SECRET!" }],
        ["styles.css", { generated: true, hash: "OK" }],
        [".well-known/foo.txt", { generated: false, hash: "OK" }],
        ["./styles.css", { generated: true, hash: "OK" }],
        ["./.well-known/foo.txt", { generated: false, hash: "OK" }],
      ]),
      true,
    );

    const secret1 = getContent(buildCache.readFile("../styles.css"));
    const secret2 = getContent(buildCache.readFile("../SECRETS.txt"));
    const secret3 = getContent(buildCache.readFile("./../styles.css"));
    const secret4 = getContent(buildCache.readFile("./../SECRETS.txt"));
    const public1 = getContent(buildCache.readFile("styles.css"));
    const public2 = getContent(buildCache.readFile(".well-known/foo.txt"));
    const public3 = getContent(buildCache.readFile("./styles.css"));
    const public4 = getContent(buildCache.readFile("./.well-known/foo.txt"));

    await expect(secret1).resolves.toBe(null);
    await expect(secret2).resolves.toBe(null);
    await expect(secret3).resolves.toBe(null);
    await expect(secret4).resolves.toBe(null);
    await expect(public1).resolves.toBe("OK");
    await expect(public2).resolves.toBe("OK");
    await expect(public3).resolves.toBe("OK");
    await expect(public4).resolves.toBe("OK");
  },
});
