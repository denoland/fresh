import { Handlers, PageProps } from "../../../../server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    return ctx.render(ctx.forwardedForAddr?.hostname);
  },
};

export default function Greet(props: PageProps<string>) {
  return <div>middleware: {props.state.forwarded}handler: {props.data}</div>;
}
