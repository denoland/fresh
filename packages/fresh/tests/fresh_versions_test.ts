import { expect } from "@std/expect";
import { satisfies, tryParseRange } from "@std/semver";
import { parse } from "@std/semver/parse";
import rootConfig from "../../../deno.json" with { type: "json" };
import freshConfig from "../deno.json" with { type: "json" };

Deno.test("Fresh version consistency", () => {
  const freshImport: string = rootConfig.imports.fresh;
  const rangeStr = freshImport.split("@").pop()!;
  const importRange = tryParseRange(rangeStr);

  if (importRange === undefined) {
    throw new Error(`Could not parse semver range from: ${freshImport}`);
  }

  const packageVersion = parse(freshConfig.version);

  expect(satisfies(packageVersion, importRange)).toBe(true);
});
