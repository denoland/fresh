import { compileMiddlewares } from "./mod.ts";
import { expect } from "@std/expect";
import { serveMiddleware } from "../test_utils.ts";
import type { Middleware } from "./mod.ts";
import type { Lazy, MaybeLazy } from "../types.ts";

Deno.test("compileMiddlewares", async () => {
  const middlewares: Middleware<{ text: string }>[] = [
    (ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    },
    (ctx) => {
      ctx.state.text += "B";
      return ctx.next();
    },
    async (ctx) => {
      const res = await ctx.next();
      ctx.state.text += "C"; // This should not show up
      return res;
    },
    (ctx) => {
      return new Response(ctx.state.text);
    },
  ];

  const server = serveMiddleware<{ text: string }>(
    compileMiddlewares(middlewares),
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("AB");
});

Deno.test("compileMiddlewares - middlewares should only be called once", async () => {
  const A: Middleware<{ count: number }> = (ctx) => {
    if (ctx.state.count === undefined) {
      ctx.state.count = 0;
    } else {
      ctx.state.count++;
    }
    return ctx.next();
  };

  const final: Middleware<{ count: number }> = (ctx) =>
    new Response(String(ctx.state.count));

  const server = serveMiddleware<{ count: number }>(
    compileMiddlewares([A, final]),
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("0");
});

Deno.test("compileMiddlewares - runs multiple stacks", async () => {
  type State = { text: string };
  const A: Middleware<State> = (ctx) => {
    ctx.state.text = "A";
    return ctx.next();
  };
  const B: Middleware<State> = (ctx) => {
    ctx.state.text += "B";
    return ctx.next();
  };
  const C: Middleware<State> = (ctx) => {
    ctx.state.text += "C";
    return ctx.next();
  };
  const D: Middleware<State> = (ctx) => {
    ctx.state.text += "D";
    return ctx.next();
  };

  const final: Middleware<State> = (ctx) =>
    new Response(String(ctx.state.text));

  const server = serveMiddleware<State>(
    compileMiddlewares([A, B, C, D, final]),
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("ABCD");
});

Deno.test("compileMiddlewares - throws errors", async () => {
  let thrownA: unknown = null;
  let thrownB: unknown = null;
  let thrownC: unknown = null;

  const middlewares: Middleware<{ text: string }>[] = [
    async (ctx) => {
      try {
        return await ctx.next();
      } catch (err) {
        thrownA = err;
        throw err;
      }
    },
    async (ctx) => {
      try {
        return await ctx.next();
      } catch (err) {
        thrownB = err;
        throw err;
      }
    },
    async (ctx) => {
      try {
        return await ctx.next();
      } catch (err) {
        thrownC = err;
        throw err;
      }
    },
    () => {
      throw new Error("fail");
    },
  ];

  const server = serveMiddleware<{ text: string }>(
    compileMiddlewares(middlewares),
  );

  try {
    await server.get("/");
  } catch {
    // ignore
  }
  expect(thrownA).toBeInstanceOf(Error);
  expect(thrownB).toBeInstanceOf(Error);
  expect(thrownC).toBeInstanceOf(Error);
});

Deno.test("compileMiddlewares - lazy middlewares", async () => {
  type State = { text: string };

  let called = 0;
  // deno-lint-ignore require-await
  const lazy: Lazy<Middleware<State>> = async () => {
    called++;
    return (ctx) => {
      ctx.state.text += "_lazy";
      return ctx.next();
    };
  };

  const middlewares: MaybeLazy<Middleware<State>>[] = [
    async (ctx) => {
      ctx.state.text = "A";
      return await ctx.next();
    },
    lazy,
    (ctx) => {
      ctx.state.text += "_B";
      return new Response(ctx.state.text);
    },
  ];

  const compiled = compileMiddlewares(middlewares);
  const server = serveMiddleware<{ text: string }>(compiled);

  let res = await server.get("/");
  expect(await res.text()).toEqual("A_lazy_B");
  expect(called).toEqual(1);

  // Lazy middlewares should only be initialized ones
  res = await server.get("/");
  expect(await res.text()).toEqual("A_lazy_B");
  expect(called).toEqual(1);
});

Deno.test("compileMiddlewares - single middleware", async () => {
  const server = serveMiddleware<{ text: string }>(
    compileMiddlewares([() => new Response("single")]),
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("single");
});

Deno.test("compileMiddlewares - post-processing after next()", async () => {
  type State = { text: string };

  const middlewares: Middleware<State>[] = [
    async (ctx) => {
      const res = await ctx.next();
      const text = await res.text();
      return new Response(`wrapped(${text})`);
    },
    () => new Response("inner"),
  ];

  const server = serveMiddleware<State>(
    compileMiddlewares(middlewares),
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("wrapped(inner)");
});

Deno.test("compileMiddlewares - concurrent requests share compiled chain", async () => {
  type State = { text: string };
  let concurrency = 0;
  let maxConcurrency = 0;

  const middlewares: Middleware<State>[] = [
    async (ctx) => {
      concurrency++;
      if (concurrency > maxConcurrency) maxConcurrency = concurrency;
      // Yield to let other requests enter the middleware
      await new Promise((r) => setTimeout(r, 10));
      const res = await ctx.next();
      concurrency--;
      return res;
    },
    (ctx) => new Response(ctx.url.pathname),
  ];

  const compiled = compileMiddlewares(middlewares);
  const server = serveMiddleware<State>(compiled);

  // Fire concurrent requests
  const results = await Promise.all([
    server.get("/a").then((r) => r.text()),
    server.get("/b").then((r) => r.text()),
    server.get("/c").then((r) => r.text()),
  ]);

  expect(results).toEqual(["/a", "/b", "/c"]);
  expect(maxConcurrency).toBeGreaterThan(1);
});

Deno.test("compileMiddlewares - onError callback", async () => {
  const errors: unknown[] = [];
  const middlewares: Middleware<{ text: string }>[] = [
    () => {
      throw new Error("test error");
    },
  ];

  const server = serveMiddleware<{ text: string }>(
    compileMiddlewares(middlewares, (err) => errors.push(err)),
  );

  try {
    await server.get("/");
  } catch {
    // ignore
  }

  expect(errors.length).toEqual(1);
  expect(errors[0]).toBeInstanceOf(Error);
});

Deno.test("compileMiddlewares - empty array falls through to next", async () => {
  const server = serveMiddleware<{ text: string }>(
    compileMiddlewares([]),
    { next: () => Promise.resolve(new Response("fallthrough")) },
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("fallthrough");
});

Deno.test("compileMiddlewares - calls last next", async () => {
  const middlewares: Middleware<{ text: string }>[] = [
    (ctx) => ctx.next(),
  ];

  const next = () => Promise.resolve(new Response("next"));

  const server = serveMiddleware<{ text: string }>(
    compileMiddlewares(middlewares),
    { next },
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("next");
});
