import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers<unknown, unknown> = {
  GET(_, ctx) {
    const headers = [["x-foo", "Hello world!"]] as [string, string][];
    return ctx.render(undefined, { headers });
  },
};

export default function Home() {
  return (
    <div>
      Should have <code>X-Foo</code> header set.
    </div>
  );
}
