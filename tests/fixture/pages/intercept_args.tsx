/** @jsx h */

import { h } from "../deps.ts";
import { HandlerContext } from "../../../server.ts";

interface MyRenderArgs extends Record<string, unknown> {
  hello: string;
}

export default function Page({
  renderArgs,
}: {
  renderArgs: MyRenderArgs;
}) {
  return <div>{renderArgs.hello}</div>;
}

export const handler = {
  GET({ req, render }: HandlerContext) {
    if (req.headers.get("accept")?.includes("text/html")) {
      return render!({
        hello: "world",
      } as MyRenderArgs);
    } else {
      return new Response("This is plain text");
    }
  },
  POST() {
    return new Response("POST response");
  },
};
