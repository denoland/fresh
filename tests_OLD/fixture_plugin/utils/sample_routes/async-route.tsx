import { defineRoute } from "../../../../src/__OLD/server/defines.ts";

export default defineRoute((_req, _ctx) => {
  return (
    <div>
      this is an async route!
    </div>
  );
});
