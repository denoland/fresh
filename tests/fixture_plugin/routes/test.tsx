import { Handlers, PageProps } from "../../../server.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const resp = await ctx.render();
    return resp;
  },
};

export default function Home(props: PageProps) {
  const value = props.state.test as string;
  return (
    <div>
      <h1>{value}</h1>
    </div>
  );
}
