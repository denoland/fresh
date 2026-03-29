import { App, staticFiles } from "@fresh/core";

export const app = new App({ basePath: "/ui" })
  .use(staticFiles())
  .get("/", () =>
    new Response("<h1>ok</h1>", {
      headers: { "Content-Type": "text/html" },
    }));
