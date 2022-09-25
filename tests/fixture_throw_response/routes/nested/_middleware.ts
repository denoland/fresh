import { MiddlewareHandler } from "../../../../server.ts";

export const handler: MiddlewareHandler = () => {
  throw new Response("<html><body>Intercepted</body></html>", {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  });
};
