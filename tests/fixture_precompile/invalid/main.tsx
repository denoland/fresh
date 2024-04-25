import { FreshApp } from "../../../src/app.ts";

export const app = new FreshApp().get(
  "/",
  () => new Response("hello"),
);
