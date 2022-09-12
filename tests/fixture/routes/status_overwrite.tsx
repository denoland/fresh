import { HandlerContext } from "$fresh/server.ts";

export default function Page() {
  return <div>This is HTML</div>;
}

export const handler = {
  GET(req: Request, { render }: HandlerContext) {
    return render(undefined, { status: 401 });
  },
};
