import { createApp } from "./mod.ts";
import "./dev.ts";
import { renderHtml } from "./render/render_html.ts";

const app = await createApp({
  dir: Deno.cwd(),
  load: (path: string) => import("./routes/" + path),
});
app.use(async (ctx) => {
  console.log("gogo");
  const html = await renderHtml(ctx, <h1>hello</h1>);
  return new Response(html, {});
});
await app.listen();
