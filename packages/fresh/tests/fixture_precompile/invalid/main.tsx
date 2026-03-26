import { App } from "../../../src/app.ts";

export const app = new App().get(
  "/",
  () => new Response("hello"),
);
