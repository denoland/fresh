import { App } from "@fresh/core";

export const app = new App().get("/ok", () => new Response("ok")).fsRoutes();
