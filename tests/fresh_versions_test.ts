import { assertEquals } from "jsr:@std/assert";
import config from "../deno.json" with { type: "json" };

Deno.test("Fresh version consistency", async () => {
  // get the expected version from the deno.json file
  const expectedVersion = config.version;

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
