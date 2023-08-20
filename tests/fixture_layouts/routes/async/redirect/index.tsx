import { RouteContext } from "$fresh/server.ts";

export default async function AsyncRedirectPage(
  req: Request,
  ctx: RouteContext,
) {
  await new Promise((r) => setTimeout(r, 10));
  return (
    <div class="async-sub-page">
      <p>Async Redirect page</p>
    </div>
  );
}
