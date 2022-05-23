/** @jsx h */

import { h } from "../deps.client.ts";
import { HandlerContext } from "../../../server.ts";

export default function Page() {
  return <div>This is HTML</div>;
}

export const handler = {
  GET(req: Request, { render }: HandlerContext) {
    if (req.headers.get("accept")?.includes("text/html")) {
      return render();
    } else {
      return new Response("This is plain text");
    }
  },
  POST() {
    return new Response("POST response");
  },
};
