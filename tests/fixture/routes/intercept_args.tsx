/** @jsx h */

import { h, PageProps } from "$fresh/runtime.ts";
import { HandlerContext, Handlers } from "../../../server.ts";

interface Data extends Record<string, unknown> {
  info: string;
}

export default function Page({ data }: PageProps<Data>) {
  return <div>{data.info}</div>;
}

export const handler: Handlers<Data> = {
  GET(req, { render }) {
    if (req.headers.get("accept")?.includes("text/html")) {
      return render({
        info: "intercepted",
      });
    } else {
      return new Response("This is plain text");
    }
  },
  POST() {
    return new Response("POST response");
  },
};
