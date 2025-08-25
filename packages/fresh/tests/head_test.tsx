import { App, staticFiles } from "fresh";
import { Head } from "fresh/runtime";
import {
  buildProd,
  parseHtml,
  waitFor,
  withBrowserApp,
} from "./test_utils.tsx";
import { expect } from "@std/expect";
import { FakeServer } from "../src/test_utils.ts";
import * as path from "@std/path";

Deno.test("Head - ssr - updates title", async () => {
  const handler = new App()
    .appWrapper(({ Component }) => {
      return (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>not ok</title>
          </head>
          <body>
            <Component />
          </body>
        </html>
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <>
          <h1>heading</h1>
          <Head>
            <title>ok</title>
          </Head>
        </>,
      );
    }).handler();

  const server = new FakeServer(handler);
  const res = await server.get("/");

  const doc = parseHtml(await res.text());

  expect(doc.querySelector("title")?.textContent).toEqual("ok");
  expect(doc.querySelector("h1")?.textContent).toEqual("heading");
});

Deno.test("Head - ssr - updates meta", async () => {
  const handler = new App()
    .appWrapper(({ Component }) => {
      return (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>ok</title>
            <meta name="foo" content="not ok" />
          </head>
          <body>
            <Component />
          </body>
        </html>
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <>
          <h1>heading</h1>
          <Head>
            <meta name="foo" content="ok" />
          </Head>
        </>,
      );
    }).handler();

  const server = new FakeServer(handler);
  const res = await server.get("/");
  const doc = parseHtml(await res.text());

  const meta = doc.querySelector("meta[name='foo']") as HTMLMetaElement;
  expect(meta.content).toEqual("ok");
});

Deno.test("Head - ssr - updates style", async () => {
  const handler = new App()
    .appWrapper(({ Component }) => {
      return (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>ok</title>
            <meta name="foo" content="not ok" />
          </head>
          <body>
            <Component />
          </body>
        </html>
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <>
          <h1>heading</h1>
          <Head>
            <style>ok</style>
          </Head>
        </>,
      );
    }).handler();

  const server = new FakeServer(handler);
  const res = await server.get("/");
  const doc = parseHtml(await res.text());

  const meta = doc.querySelector("style") as HTMLStyleElement;
  expect(meta.textContent).toEqual("ok");
});

Deno.test("Head - ssr - merge keyed", async () => {
  const handler = new App()
    .appWrapper(({ Component }) => {
      return (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>ok</title>
            <style>not ok</style>
            <style key="a">not ok</style>
          </head>
          <body>
            <Component />
          </body>
        </html>
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <>
          <h1>heading</h1>
          <Head>
            <style key="a">ok</style>
          </Head>
        </>,
      );
    }).handler();

  const server = new FakeServer(handler);
  const res = await server.get("/");
  const doc = parseHtml(await res.text());

  const last = doc.head.lastChild;
  expect(last?.textContent).toEqual("ok");
});

Deno.test({
  name: "Head - client - set title",
  fn: async () => {
    const applyCache = await buildProd({
      root: path.join(import.meta.dirname!, "fixture_head"),
    });

    const app = new App({})
      .use(staticFiles())
      .fsRoutes();

    applyCache(app);

    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/title`);

      await page.locator(".ready").wait();
      await page.locator("button").click();

      await waitFor(async () => {
        const title = await page.evaluate(() => document.title);
        return title === "Count: 1";
      });
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Head - client - match meta",
  fn: async () => {
    const applyCache = await buildProd({
      root: path.join(import.meta.dirname!, "fixture_head"),
    });

    const app = new App({})
      .use(staticFiles())
      .fsRoutes();

    applyCache(app);

    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/meta`);
      await page.locator(".ready").wait();

      await waitFor(async () => {
        const metas = await page.evaluate(() => {
          const metas = Array.from(
            document.querySelectorAll("meta[name]"),
          ) as HTMLMetaElement[];

          return metas.map((
            el: HTMLMetaElement,
          ) => ({ name: el.name, content: el.content }));
        });

        try {
          expect(metas).toEqual([
            { name: "foo", content: "ok" },
            { name: "bar", content: "not ok" },
          ]);
          return true;
        } catch {
          return false;
        }
      });
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Head - client - match style by id",
  fn: async () => {
    const applyCache = await buildProd({
      root: path.join(import.meta.dirname!, "fixture_head"),
    });

    const app = new App({})
      .use(staticFiles())
      .fsRoutes();

    applyCache(app);

    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/id`);
      await page.locator(".ready").wait();

      await waitFor(async () => {
        const styles = await page.evaluate(() => {
          const els = Array.from(
            document.querySelectorAll("head style"),
          ) as HTMLStyleElement[];

          return els.map((
            el: HTMLStyleElement,
          ) => ({ id: el.id, text: el.textContent }));
        });

        try {
          expect(styles).toEqual([
            { id: "", text: "not ok" },
            { id: "style-id", text: "ok" },
          ]);
          return true;
        } catch {
          return false;
        }
      });
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Head - client - match key",
  fn: async () => {
    const applyCache = await buildProd({
      root: path.join(import.meta.dirname!, "fixture_head"),
    });

    const app = new App({})
      .use(staticFiles())
      .fsRoutes();

    applyCache(app);

    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/key`);
      await page.locator(".ready").wait();

      await waitFor(async () => {
        const tpls = await page.evaluate(() => {
          const els = Array.from(
            document.querySelectorAll("head template"),
          ) as HTMLTemplateElement[];

          return els.map((
            el: HTMLTemplateElement,
          ) => ({
            key: el.getAttribute("data-key"),
            text: el.content.textContent,
          }));
        });

        try {
          expect(tpls).toEqual([
            { key: "a", text: "ok" },
            { key: "b", text: "not ok" },
            { key: null, text: "not ok" },
          ]);
          return true;
        } catch {
          return false;
        }
      });
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
