import { FreshContext } from "$fresh/server.ts";

export default function Page() {
  return <div>This is HTML</div>;
}

export const handler = {
  GET(req: Request, { render }: FreshContext) {
    return render(undefined, {
      status: 401,
      headers: { "x-some-header": "foo" },
    });
  },
};
