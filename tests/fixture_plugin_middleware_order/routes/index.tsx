import { FreshContext } from "$fresh/server.ts";

export default function Page(ctx: FreshContext) {
  const order = ctx.state.order as string;
  return <h1>{order}</h1>;
}
