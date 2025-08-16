import { expect, fn } from "@std/expect";
import * as path from "@std/path";
import { Builder, specToName } from "./builder.ts";
import { App } from "../app.ts";
import { DEV_ERROR_OVERLAY_URL } from "../constants.ts";
import { BUILD_ID } from "@fresh/build-id";
import { withTmpDir, writeFiles } from "../test_utils.ts";
import {
  getStdOutput,
  withChildProcessServer,
} from "../../tests/test_utils.tsx";
import { staticFiles } from "../middlewares/static_files.ts";

Deno.test("Builder SSG - render plain text", async () => {
  await using _tmp = await withTmpDir();
  const tmp = _tmp.dir;

  const app = new App()
    .get("/", () => new Response("ok"));

  const builder = new Builder({ outDir: tmp });

  await builder.generateStaticSite({
    entryUrls: ["/"],
    getApp: () => Promise.resolve(app),
  });

  expect(await Deno.readTextFile(path.join(tmp, "index.html"))).toEqual("ok");
});

Deno.test("Builder SSG - follows entryUrls", async () => {
  await using _tmp = await withTmpDir();
  const tmp = _tmp.dir;

  const app = new App()
    .get("/", (ctx) => ctx.render(<a href="/bar">bar</a>))
    .get("/bar", (ctx) => ctx.render(<a href="/baz">baz</a>))
    .get("/baz", (ctx) => ctx.render(<h1>bar</h1>));

  const builder = new Builder({ outDir: tmp });

  await builder.generateStaticSite({
    entryUrls: ["/"],
    getApp: () => Promise.resolve(app),
  });

  expect(await Deno.readTextFile(path.join(tmp, "index.html")))
    .toContain(
      `<a href="/bar">bar</a>`,
    );
  expect(await Deno.readTextFile(path.join(tmp, "bar", "index.html")))
    .toContain(`<a href="/baz">baz</a>`);
  expect(await Deno.readTextFile(path.join(tmp, "baz", "index.html")))
    .toContain(`<h1>bar</h1>`);
});
