import { FreshContext, PageProps } from "$fresh/server.ts";

export const handler = (_req: Request, ctx: FreshContext) => {
  ctx.state.handler3 = "it works";
  return ctx.render();
};

export default function Page(props: PageProps) {
  return <pre>{JSON.stringify(props.state,null,2)}</pre>;
}
