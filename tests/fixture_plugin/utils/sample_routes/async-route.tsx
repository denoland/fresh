import { defineRoute } from "$fresh/src/server/defines.ts";

export default defineRoute((_req, _ctx) => {
  return (
    <div>
      this is an async route!
    </div>
  );
});
