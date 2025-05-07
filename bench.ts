import { app } from "./www/main.ts";

const handler = await app.handler();

Deno.bench(
  "handler",
  async () => {
    await handler(
      new Request(
        "http://localhost:8000/docs/examples/using-fresh-canary-version",
      ),
    );
  },
);
