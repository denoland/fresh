import { defineRoute } from "../../../../src/__OLD/server/defines.ts";

export default defineRoute(() => {
  return new Response("", {
    status: 302,
    headers: {
      Location: "/island_props",
    },
  });
});
