import { defineHandlers } from "@fresh/core";

const REDIRECTS: Record<string, string> = {
  "/docs/getting-started/fetching-data":
    "/docs/getting-started/custom-handlers",
};

export const handler = defineHandlers((
  ctx,
) => {
  // Redirect from old doc URLs to new ones
  const redirect = REDIRECTS[ctx.url.pathname];
  if (redirect) {
    return ctx.redirect(redirect, 307);
  }

  return ctx.next();
});
