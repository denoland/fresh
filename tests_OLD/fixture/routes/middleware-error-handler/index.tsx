import type { Handlers, PageProps } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req, ctx) {
    return ctx.render(ctx.state.flag);
  },
};

export default function Home(props: PageProps<boolean>) {
  if (props.data) {
    throw Error("i'm erroring on purpose");
  }
  return <div>this won't get shown</div>;
}
