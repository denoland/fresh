import { expect } from "@std/expect";
import { App } from "./app.ts";
import { FakeServer } from "./test_utils.ts";

Deno.test("ctx.upgrade() - throws 400 on non-WebSocket request", async () => {
  const app = new App()
    .get("/ws", (ctx) => ctx.upgrade({ message() {} }));

  const server = new FakeServer(app.handler());
  const res = await server.get("/ws");
  expect(res.status).toEqual(400);
});

Deno.test("app.ws() - throws 400 on non-WebSocket request", async () => {
  const app = new App()
    .ws("/ws", { message() {} });

  const server = new FakeServer(app.handler());
  const res = await server.get("/ws");
  expect(res.status).toEqual(400);
});

Deno.test("ctx.upgrade() - bare mode with options", async () => {
  const app = new App()
    .get("/ws", (ctx) => {
      // Options-only call must return { socket, response } (bare mode),
      // NOT a plain Response (managed mode).
      const { socket, response } = ctx.upgrade({ protocol: "graphql-ws" });
      socket.onmessage = (e) => socket.send(`bare-opts: ${e.data}`);
      return response;
    });

  const ac = new AbortController();
  const server = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
    signal: ac.signal,
    onListen: () => {},
  }, app.handler());

  const port = server.addr.port;

  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, "graphql-ws");
  const received = new Promise<string>((resolve, reject) => {
    ws.onmessage = (e) => resolve(e.data);
    ws.onerror = (e) => reject(e);
  });
  ws.onopen = () => ws.send("hello");

  const msg = await received;
  expect(msg).toEqual("bare-opts: hello");
  expect(ws.protocol).toEqual("graphql-ws");

  ws.close();
  ac.abort();
  await server.finished;
});

Deno.test("ctx.upgrade() - managed echo", async () => {
  const app = new App()
    .get("/ws", (ctx) =>
      ctx.upgrade({
        message(socket, event) {
          socket.send(`echo: ${event.data}`);
        },
      }));

  const ac = new AbortController();
  const server = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
    signal: ac.signal,
    onListen: () => {},
  }, app.handler());

  const port = server.addr.port;

  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const received = new Promise<string>((resolve, reject) => {
    ws.onmessage = (e) => resolve(e.data);
    ws.onerror = (e) => reject(e);
  });
  ws.onopen = () => ws.send("hello");

  const msg = await received;
  expect(msg).toEqual("echo: hello");

  ws.close();
  ac.abort();
  await server.finished;
});

Deno.test("ctx.upgrade() - bare overload", async () => {
  const app = new App()
    .get("/ws", (ctx) => {
      const { socket, response } = ctx.upgrade();
      socket.onmessage = (e) => socket.send(`bare: ${e.data}`);
      return response;
    });

  const ac = new AbortController();
  const server = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
    signal: ac.signal,
    onListen: () => {},
  }, app.handler());

  const port = server.addr.port;

  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const received = new Promise<string>((resolve, reject) => {
    ws.onmessage = (e) => resolve(e.data);
    ws.onerror = (e) => reject(e);
  });
  ws.onopen = () => ws.send("hello");

  const msg = await received;
  expect(msg).toEqual("bare: hello");

  ws.close();
  ac.abort();
  await server.finished;
});

Deno.test("app.ws() - echo shorthand", async () => {
  const app = new App()
    .ws("/ws", {
      message(socket, event) {
        socket.send(`ws: ${event.data}`);
      },
    });

  const ac = new AbortController();
  const server = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
    signal: ac.signal,
    onListen: () => {},
  }, app.handler());

  const port = server.addr.port;

  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const received = new Promise<string>((resolve, reject) => {
    ws.onmessage = (e) => resolve(e.data);
    ws.onerror = (e) => reject(e);
  });
  ws.onopen = () => ws.send("hello");

  const msg = await received;
  expect(msg).toEqual("ws: hello");

  ws.close();
  ac.abort();
  await server.finished;
});

Deno.test("ctx.upgrade() - open and close handlers fire", async () => {
  const events: string[] = [];
  const closed = Promise.withResolvers<void>();

  const app = new App()
    .get("/ws", (ctx) =>
      ctx.upgrade({
        open() {
          events.push("open");
        },
        close() {
          events.push("close");
          closed.resolve();
        },
      }));

  const ac = new AbortController();
  const server = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
    signal: ac.signal,
    onListen: () => {},
  }, app.handler());

  const port = server.addr.port;

  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });
  ws.close();

  await closed.promise;
  expect(events).toEqual(["open", "close"]);

  ac.abort();
  await server.finished;
});
