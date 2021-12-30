/** @jsx h */

import { h } from "../deps.ts";
import { HandlerContext } from "../../../server.ts";

interface MyRenderArgs extends Record<string, unknown> {
  info: string;
}

export default function Page({
  renderArgs,
}: {
  renderArgs: MyRenderArgs;
}) {
  return <div>{renderArgs.info}</div>;
}

export const handler = {
  GET({ req, render }: HandlerContext) {
    if (req.headers.get("accept")?.includes("text/html")) {
      return render!({
        info: "intercepted",
      } as MyRenderArgs);
    } else {
      return new Response("This is plain text");
    }
  },
  POST() {
    return new Response("POST response");
  },
};
