import { App } from "../app.ts";
import type { FreshContext } from "../context.ts";
import { csrf } from "./csrf.ts";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";

const rawSimplePostHandler = async (ctx: FreshContext) => {
  return ctx.req.headers.get("content-type") === "application/json"
    ? new Response((await ctx.req.json())["name"])
    : new Response((await ctx.req.formData()).get("name"));
};

Deno.test("CSRF by Middleware", async (t) => {
  let simplePostHandler = spy(rawSimplePostHandler);

  await t.step("simple usage", async (t) => {
    const app = new App();

    app.all("*", csrf());
    app.get("/form", () => new Response("<form></form>"));
    app.post("/form", simplePostHandler);
    app.put("/form", () => new Response("OK"));
    app.delete("/form", () => new Response("OK"));
    app.patch("/form", () => new Response("OK"));
    app.head("/form", () => new Response("OK"));

    const handler = app.handler();

    await t.step("GET /form - should be 200 for any request", async () => {
      simplePostHandler = spy(rawSimplePostHandler);
      const res = await handler(new Request("http://localhost/form"));

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("<form></form>");
    });

    await t.step("HEAD /form - should be 200 for any request", async () => {
      simplePostHandler = spy(rawSimplePostHandler);
      const res = await handler(
        new Request("http://localhost/form", {
          method: "HEAD",
        }),
      );

      expect(res.status).toBe(200);
    });

    await t.step("POST /form - should be 200 for local request", async () => {
      simplePostHandler = spy(rawSimplePostHandler);

      const res = await handler(
        new Request("http://localhost/form", {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": "http://localhost",
          },
          body: "name=fresh",
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("fresh");
    });

    await t.step(
      'should be 403 for "application/x-www-form-urlencoded" cross origin',
      async () => {
        simplePostHandler = spy(rawSimplePostHandler);
        const res = await handler(
          new Request("http://localhost/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "http://example.com",
            },
            body: "name=fresh",
          }),
        );

        expect(res.status).toBe(403);
        expect(simplePostHandler.calls.length).toBe(0);
      },
    );
    await t.step(
      'should be 403 for "multipart/form-data" cross origin',
      async () => {
        simplePostHandler = spy(rawSimplePostHandler);
        const res = await handler(
          new Request("http://localhost/form", {
            method: "POST",
            headers: {
              "content-type": "multipart/form-data",
              "origin": "http://example.com",
            },
            body: "name=fresh",
          }),
        );

        expect(res.status).toBe(403);
        expect(simplePostHandler.calls.length).toBe(0);
      },
    );

    await t.step('should be 403 for "text/plain" cross origin', async () => {
      simplePostHandler = spy(rawSimplePostHandler);
      const res = await handler(
        new Request("http://localhost/form", {
          method: "POST",
          headers: {
            "content-type": "text/plain",
            "origin": "http://example.com",
          },
          body: "name=fresh",
        }),
      );

      expect(res.status).toBe(403);
      expect(simplePostHandler.calls.length).toBe(0);
    });

    await t.step(
      "should be 403 if request has no origin header",
      async () => {
        simplePostHandler = spy(rawSimplePostHandler);
        const res = await handler(
          new Request("http://localhost/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
            },
            body: "name=fresh",
          }),
        );

        expect(res.status).toBe(403);
        expect(simplePostHandler.calls.length).toBe(0);
      },
    );

    await t.step("should be 200 for application/json", async () => {
      const res = await handler(
        new Request("http://localhost/form", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://example.com",
          },
          body: JSON.stringify({ name: "fresh" }),
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("fresh");
    });

    await t.step(
      'should be 403 for "Application/x-www-form-urlencoded" cross origin',
      async () => {
        simplePostHandler = spy(rawSimplePostHandler);
        const res = await handler(
          new Request("http://localhost/form", {
            method: "POST",
            headers: {
              "content-type": "Application/x-www-form-urlencoded",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(403);
        expect(simplePostHandler.calls.length).toBe(0);
      },
    );

    await t.step("should be 403 if the content-type is not set", async () => {
      simplePostHandler = spy(rawSimplePostHandler);
      const res = await handler(
        new Request("http://localhost/form", {
          method: "POST",
          body: new Blob(["test"], {}),
        }),
      );
      expect(res.status).toBe(403);
      expect(simplePostHandler.calls.length).toBe(0);
    });
  });

  await t.step("with origin option", async (t) => {
    await t.step("string", async (t) => {
      const app = new App();

      app.all(
        "*",
        csrf({
          origin: "https://example.com",
        }),
      );
      app.post("/form", simplePostHandler);

      const handler = app.handler();

      await t.step("should be 200 for allowed origin", async () => {
        const res = await handler(
          new Request("https://example.com/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "https://example.com",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(200);
      });

      await t.step("should be 403 for not allowed origin", async () => {
        simplePostHandler = spy(rawSimplePostHandler);
        const res = await handler(
          new Request("https://example.jp/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "https://example.jp",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(403);
        expect(simplePostHandler.calls.length).toBe(0);
      });
    });

    await t.step("string[]", async (t) => {
      const app = new App();

      app.all(
        "*",
        csrf({
          origin: ["https://example.com", "https://fresh.example.com"],
        }),
      );
      app.post("/form", simplePostHandler);

      const handler = app.handler();

      await t.step("should be 200 for allowed origin", async () => {
        let res = await handler(
          new Request("https://fresh.example.com/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "https://fresh.example.com",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(200);

        res = await handler(
          new Request("https://example.com/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "https://example.com",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(200);
      });

      await t.step("should be 403 for not allowed origin", async () => {
        simplePostHandler = spy(rawSimplePostHandler);
        const res = await handler(
          new Request("http://example.jp/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "http://example.jp",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(403);
        expect(simplePostHandler.calls.length).toBe(0);
      });
    });

    await t.step("IsAllowedOriginHandler", async (t) => {
      const app = new App();

      app.all(
        "*",
        csrf({
          origin: (origin) => /https:\/\/(\w+\.)?example\.com$/.test(origin),
        }),
      );
      app.post("/form", simplePostHandler);

      const handler = app.handler();
      await t.step("should be 200 for allowed origin", async () => {
        let res = await handler(
          new Request("https://fresh.example.com/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "https://fresh.example.com",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(200);
        res = await handler(
          new Request("https://example.com/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "https://example.com",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(200);
      });

      await t.step("should be 403 for not allowed origin", async () => {
        simplePostHandler = spy(rawSimplePostHandler);
        let res = await handler(
          new Request("http://deno.fresh.example.jp/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "http://deno.fresh.example.jp",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(403);
        expect(simplePostHandler.calls.length).toBe(0);

        res = await handler(
          new Request("http://example.jp/form", {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "origin": "http://example.jp",
            },
            body: "name=fresh",
          }),
        );
        expect(res.status).toBe(403);
        expect(simplePostHandler.calls.length).toBe(0);
      });
    });
  });
});
