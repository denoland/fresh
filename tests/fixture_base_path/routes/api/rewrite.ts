import { Handlers } from "$fresh/server.ts";

export const handler: Handlers<unknown, { data: string }> = {
  GET(req) {
    const url = new URL(req.url);
    return new Response(null, {
      status: 302,
      headers: {
        "Location": url.origin,
      },
    });
  },
};
