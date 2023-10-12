import { assertEquals, assertRejects } from "$std/testing/asserts.ts";
import { compose, ComposeCtx, ComposeHandler } from "./compose.ts";

// deno-lint-ignore no-explicit-any
function createContext<S = any>(req: Request, res?: Response): ComposeCtx<S> {
  return {
    next: () => Promise.resolve(res ?? new Response("test done")),
    params: {},
    // deno-lint-ignore no-explicit-any
    remoteAddr: null as any,
    // deno-lint-ignore no-explicit-any
    state: {} as any,
    url: new URL(req.url),
    route: {
      matched: "",
      remaining: "",
    },
  };
}

Deno.test("compose calls handlers in correct order", async () => {
  const logs: string[] = [];
  const fn1: ComposeHandler = (_req, ctx) => {
    logs.push("fn1");
    return ctx.next();
  };
  const fn2: ComposeHandler = (_req, ctx) => {
    logs.push("fn2");
    return ctx.next();
  };
  const fn3: ComposeHandler = (_req, ctx) => {
    logs.push("fn3");
    return ctx.next();
  };

  const handler = compose([fn1, fn2, fn3]);

  const req = new Request("https://localhost/foo");
  const res = new Response("done");
  const ctx = createContext(req, res);
  const final = await handler(req, ctx);

  assertEquals(await final.text(), "done");
  assertEquals(logs, ["fn1", "fn2", "fn3"]);
});

Deno.test("compose shares state", async () => {
  interface State {
    logs: string[];
  }

  const fn1: ComposeHandler<State> = (_req, ctx) => {
    ctx.state.logs.push("fn1");
    return ctx.next();
  };
  const fn2: ComposeHandler<State> = (_req, ctx) => {
    ctx.state.logs.push("fn2");
    return ctx.next();
  };
  const fn3: ComposeHandler<State> = (_req, ctx) => {
    ctx.state.logs.push("fn3");
    return ctx.next();
  };

  const handler = compose([fn1, fn2, fn3]);

  const req = new Request("https://localhost/foo");
  const ctx = createContext<State>(req);
  const logs: string[] = [];
  ctx.state.logs = logs;

  await handler(req, ctx);

  assertEquals(logs, ["fn1", "fn2", "fn3"]);
});

Deno.test("compose passes Request", async () => {
  const logs: boolean[] = [];
  const fn1: ComposeHandler = (req, ctx) => {
    logs.push(req instanceof Request);
    return ctx.next();
  };
  const fn2: ComposeHandler = (req, ctx) => {
    logs.push(req instanceof Request);
    return ctx.next();
  };
  const fn3: ComposeHandler = (req, ctx) => {
    logs.push(req instanceof Request);
    return ctx.next();
  };

  const handler = compose([fn1, fn2, fn3]);

  const req = new Request("https://localhost/foo");
  const ctx = createContext(req);

  await handler(req, ctx);
  assertEquals(logs, [true, true, true]);
});

Deno.test("compose errors can be caught", () => {
  const thrower: ComposeHandler = () => {
    throw new Error("fail");
  };
  const mid: ComposeHandler = (_req, ctx) => {
    return ctx.next();
  };

  const handler = compose([mid, thrower]);

  const req = new Request("https://localhost/foo");
  const ctx = createContext(req);

  assertRejects(() => handler(req, ctx), "fail");
});
