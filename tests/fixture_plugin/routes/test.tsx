import type { FreshContext, Handlers, PageProps } from "../../../server.ts";

export const handler: Handlers<unknown, { test: string }> = {
  async GET(_req, ctx: FreshContext<{ test: string }, unknown>) {
    const resp = await ctx.render();
    return resp;
  },
};

export default function Home(props: PageProps<unknown, { test: string }>) {
  const value = props.state.test;
  return (
    <div>
      <h1>{value}</h1>
    </div>
  );
}
