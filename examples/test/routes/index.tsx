import { HandlerContext, Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req: Request, ctx: HandlerContext) {
    const form = await req.formData();

    // Processing something

    return new Response("", {
      status: 303,
      headers: { Location: "/" },
    });
  },
};

export default function Index() {
  return (
    <div>
      Hello Deno!
    </div>
  );
}
