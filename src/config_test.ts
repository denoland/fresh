import { expect } from "@std/expect";
import { normalizeConfig, parseRootPath } from "./config.ts";
import type { FreshConfig } from "./mod.ts";

Deno.test("parseRootPath", () => {
  const cwd = Deno.cwd().replaceAll("\\", "/");

  // File paths
  expect(parseRootPath("file:///foo/bar", cwd)).toEqual("/foo/bar");
  expect(parseRootPath("file:///foo/bar.ts", cwd)).toEqual("/foo");
  if (Deno.build.os === "windows") {
    expect(parseRootPath("file:///C:/foo/bar", cwd)).toEqual("C:/foo/bar");
    expect(parseRootPath("file:///C:/foo/bar.ts", cwd)).toEqual("C:/foo");
  }

  // Relative paths
  expect(parseRootPath("./foo/bar", cwd)).toEqual(`${cwd}/foo/bar`);
  expect(parseRootPath("./foo/bar.ts", cwd)).toEqual(`${cwd}/foo`);

  // Absolute paths
  expect(parseRootPath("/foo/bar", cwd)).toEqual("/foo/bar");
  expect(parseRootPath("/foo/bar.ts", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.tsx", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.js", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.jsx", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.mjs", cwd)).toEqual("/foo");
  if (Deno.build.os === "windows") {
    expect(parseRootPath("C:/foo/bar", cwd)).toEqual("C:/foo/bar");
    expect(parseRootPath("C:/foo/bar.ts", cwd)).toEqual("C:/foo");
  }
});

Deno.test("normalizeConfig - root", () => {
  const cwd = Deno.cwd().replaceAll("\\", "/");
  const configRoot = (root?: string) => normalizeConfig({ root }).root;

  expect(configRoot()).toEqual(cwd);
  expect(configRoot("/foo/bar")).toEqual("/foo/bar");
  expect(configRoot("/foo/bar.ts")).toEqual("/foo");
  expect(configRoot("file:///foo/bar")).toEqual("/foo/bar");
  expect(configRoot("./foo/bar")).toEqual(`${cwd}/foo/bar`);
  expect(configRoot("./foo/bar.ts")).toEqual(`${cwd}/foo`);

  if (Deno.build.os === "windows") {
    expect(configRoot("C:/foo/bar.ts")).toEqual("C:/foo");
    expect(configRoot("file:///C:/foo/bar")).toEqual("C:/foo/bar");
  }
});

Deno.test("normalizeConfig - build.outDir", () => {
  const cwd = Deno.cwd().replaceAll("\\", "/");
  const outDir = (options: FreshConfig) => normalizeConfig(options).buildOutDir;

  // Default outDir
  expect(outDir({ root: "./src" })).toEqual(`${cwd}/src/_fresh`);
  expect(outDir({ root: "/src" })).toEqual("/src/_fresh");
  expect(outDir({ root: "file:///src" })).toEqual("/src/_fresh");

  // Relative outDir
  expect(outDir({ root: "/src", buildOutDir: "dist" })).toEqual(
    "/src/dist",
  );
  expect(outDir({ root: "/src", buildOutDir: "./dist" })).toEqual(
    "/src/dist",
  );

  // Absolute outDir
  expect(outDir({ root: "/src", buildOutDir: "/dist" })).toEqual(
    "/dist",
  );
  expect(outDir({ root: "/src", buildOutDir: "/dist/fresh" })).toEqual(
    "/dist/fresh",
  );
  expect(outDir({ root: "/src", buildOutDir: "file:///dist" })).toEqual(
    "/dist",
  );
});

Deno.test("normalizeConfig - staticDir", () => {
  const cwd = Deno.cwd().replaceAll("\\", "/");
  const staticDir = (options: FreshConfig) =>
    normalizeConfig(options).staticDir;

  // Default staticDir
  expect(staticDir({ root: "./src" })).toEqual(`${cwd}/src/static`);
  expect(staticDir({ root: "/src" })).toEqual("/src/static");
  expect(staticDir({ root: "file:///src" })).toEqual("/src/static");

  // Relative staticDir
  expect(staticDir({ root: "/src", staticDir: "public" })).toEqual(
    "/src/public",
  );
  expect(staticDir({ root: "/src", staticDir: "./public" })).toEqual(
    "/src/public",
  );

  // Absolute staticDir
  expect(staticDir({ root: "/src", staticDir: "/public" })).toEqual(
    "/public",
  );
  expect(staticDir({ root: "/src", staticDir: "/public/assets" })).toEqual(
    "/public/assets",
  );
  expect(staticDir({ root: "/src", staticDir: "file:///public" })).toEqual(
    "/public",
  );
});
