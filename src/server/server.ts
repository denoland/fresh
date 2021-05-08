import { oak } from "./deps.ts";
import { bundle } from "./bundle.ts";
import { render } from "./render.ts";
import { Page } from "./routes.ts";

export function createServer(pages: Page[]): oak.Application {
  const router = new oak.Router();

  for (const page of pages) {
    router.get<Record<string, string>>(page.route, (ctx) => {
      ctx.response.status = 200;
      ctx.response.type = "html";
      ctx.response.body = render(page, ctx.params);
    });

    router.get(`/_frsh/s/p/${page.name}.module.js`, async (ctx) => {
      const js = await bundle(page);
      ctx.response.status = 200;
      ctx.response.type = "js";
      ctx.response.body = js;
    });
  }

  const app = new oak.Application();

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
