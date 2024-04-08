import { FreshContext, Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(_req: Request, ctx: FreshContext) {
    const headers = new Headers();
    headers.append("Set-Cookie", "foo=bar");
    headers.append("Set-Cookie", "baz=1234");
    return await ctx.render({}, { headers });
  },
};

export default function Home() {
  return (
    <div>
      hello
    </div>
  );
}
