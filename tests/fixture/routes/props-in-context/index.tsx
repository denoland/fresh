import { Handlers, PageProps } from "$fresh/server.ts";
import Child from "../../components/Child.tsx";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const complexValue = "computing this is really hard";
    const resp = await ctx.render(complexValue);
    return resp;
  },
};

export default function Page(props: PageProps<string>) {
  return <Child />;
}
