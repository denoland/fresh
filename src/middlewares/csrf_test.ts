import { App } from "../app.ts";
import type { FreshContext } from "../context.ts";
import { csrf } from "./csrf.ts";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";

const rawSimplePostHandler = async (ctx: FreshContext) => {
  if (ctx.req.headers.get("content-type") === "application/json") {
    return new Response((await ctx.req.json())["name"]);
  } else {
    return new Response((await ctx.req.formData()).get("name"));
  }
};

describe("CSRF by Middleware", () => {
  let simplePostHandler = spy(rawSimplePostHandler);

  beforeEach(() => {
    simplePostHandler = spy(rawSimplePostHandler);
  });

  describe("simple usage", () => {
    const app = new App();

    app.all("*", csrf());
    app.get("/form", () => new Response("<form></form>"));
    app.post("/form", simplePostHandler);
    app.put("/form", () => new Response("OK"));
    app.delete("/form", () => new Response("OK"));
    app.patch("/form", () => new Response("OK"));
    app.head("/form", () => new Response("OK"));

    const handler = app.handler();

    describe("GET /form", () => {
      it("should be 200 for any request", async () => {
        const res = await handler(new Request("http://localhost/form"));

        expect(res.status).toBe(200);
        expect(await res.text()).toBe("<form></form>");
      });
    });

    describe("HEAD /form", () => {
      it("should be 200 for any request", async () => {
        const res = await handler(
          new Request("http://localhost/form", {
            method: "HEAD",
          }),
        );

        expect(res.status).toBe(200);
      });
    });

    describe("POST /form", () => {
      it("should be 200 for local request", async () => {
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

      it('should be 403 for "application/x-www-form-urlencoded" cross origin', async () => {
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
      });
      it('should be 403 for "multipart/form-data" cross origin', async () => {
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
      });

      it('should be 403 for "text/plain" cross origin', async () => {
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

      it("should be 403 if request has no origin header", async () => {
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
      });

      it("should be 200 for application/json", async () => {
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

      it('should be 403 for "Application/x-www-form-urlencoded" cross origin', async () => {
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
      });

      it("should be 403 if the content-type is not set", async () => {
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
  });

  describe("with origin option", () => {
    describe("string", () => {
      const app = new App();

      app.all(
        "*",
        csrf({
          origin: "https://example.com",
        }),
      );
      app.post("/form", simplePostHandler);

      const handler = app.handler();

      it("should be 200 for allowed origin", async () => {
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

      it("should be 403 for not allowed origin", async () => {
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

    describe("string[]", () => {
      const app = new App();

      app.all(
        "*",
        csrf({
          origin: ["https://example.com", "https://fresh.example.com"],
        }),
      );
      app.post("/form", simplePostHandler);

      const handler = app.handler();

      it("should be 200 for allowed origin", async () => {
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

      it("should be 403 for not allowed origin", async () => {
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

    describe("IsAllowedOriginHandler", () => {
      const app = new App();

      app.all(
        "*",
        csrf({
          origin: (origin) => /https:\/\/(\w+\.)?example\.com$/.test(origin),
        }),
      );
      app.post("/form", simplePostHandler);

      const handler = app.handler();
      it("should be 200 for allowed origin", async () => {
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

      it("should be 403 for not allowed origin", async () => {
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
