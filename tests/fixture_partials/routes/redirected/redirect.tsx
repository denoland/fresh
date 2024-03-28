import type { Handler } from "$fresh/server.ts";

export const handler: Handler = (req) => {
  return new Response(null, {
    headers: {
      ...req.headers,
      Location: "/redirected/handler",
    },
    status: 307,
  });
};
