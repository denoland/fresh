import { defineRoute } from "$fresh/src/server/defines.ts";

export default defineRoute(() => {
  return new Response("", {
    status: 302,
    headers: {
      Location: "/client_nav_opt_out",
    },
  });
});
