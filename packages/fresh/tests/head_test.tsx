import { App } from "fresh";
import { Head } from "fresh/runtime";
import { parseHtml } from "./test_utils.tsx";
import { expect } from "@std/expect";
import { FakeServer } from "../src/test_utils.ts";

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
