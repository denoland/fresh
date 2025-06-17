import { assertEquals } from "jsr:@std/assert";
import config from "../deno.json" with { type: "json" };

Deno.test("Fresh version consistency",() => {
  // get the expected version from the deno.json file
  const expectedVersion = config.version;

  // get the version from the fresh import
  const freshImport = config.imports.fresh;

  const [_, actualVersion] = freshImport.split("@^");

  assertEquals(
    actualVersion,
    expectedVersion,
    `deno.json version mismatch: version field="${expectedVersion}", fresh import="${actualVersion}"`,
  );
});
