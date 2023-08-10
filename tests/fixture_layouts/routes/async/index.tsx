import { RouteContext } from "$fresh/server.ts";

export default async function AsyncPage(req: Request, ctx: RouteContext) {
  await new Promise((r) => setTimeout(r, 10));
  return (
    <div class="async-page">
      <p>Async page</p>
    </div>
  );
}
