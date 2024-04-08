import { FreshContext } from "$fresh/server.ts";

export default function Page() {
  return <div>This is HTML</div>;
}

export const handler = {
  GET(req: Request, { render }: FreshContext) {
    if (req.headers.get("accept")?.includes("text/html")) {
      return render();
    } else {
      return new Response("This is plain text");
    }
  },
  POST() {
    return new Response("POST response");
  },
};
