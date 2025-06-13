import { resolve } from "jsr:@std/path";
import { assertEquals } from "jsr:@std/assert";

Deno.test("Fresh version consistency", async () => {
  const config = JSON.parse(await Deno.readTextFile(resolve("deno.json")));
  // get the expected version from the deno.json file
  const expectedVersion = config.version;
  if (!expectedVersion) {
    throw new Error("No version field found in deno.json");
  }

  // get the version from the fresh import
  const freshImport = config.imports?.fresh;
  if (!freshImport) {
    throw new Error("No fresh import found in deno.json");
  }

  const match = freshImport.match(/@fresh\/core@\^?([^/]+)/);
  const actualVersion = match?.[1];

  assertEquals(
    actualVersion,
    expectedVersion,
    `deno.json version mismatch: version field="${expectedVersion}", fresh import="${actualVersion}"`,
  );
});
