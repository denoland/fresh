import { assertEquals } from "./deps.ts";
import { specifierToIdentifier } from "./manifest.ts";

const run = specifierToIdentifier;

Deno.test("specifierToIdentifier", () => {
  const used = new Set<string>();
  assertEquals(run("foo/bar.ts", used), "foo_bar");
  assertEquals(run("foo/bar.json.ts", used), "foo_bar_json");
  assertEquals(run("foo/[id]/bar", used), "foo_id_bar");
  assertEquals(run("foo/[...all]/bar", used), "foo_all_bar");
  assertEquals(run("foo/[[optional]]/bar", used), "foo_optional_bar");
  assertEquals(run("foo/as-df/bar", used), "foo_as_df_bar");
  assertEquals(run("foo/as@df", used), "foo_as_df");
  assertEquals(run("foo/foo.bar.baz.tsx", used), "foo_foo_bar_baz");
  assertEquals(run("404", used), "_404");
  assertEquals(run("foo/_middleware", used), "foo_middleware");
});

Deno.test("specifierToIdentifier deals with duplicates", () => {
  const used = new Set<string>();
  assertEquals(run("foo/bar", used), "foo_bar");
  assertEquals(run("foo/bar", used), "foo_bar_1");
});
