export const handler = {
  GET() {
    return new Response(Deno.env.get("FRESH_DEV_COMMAND_MODE"));
  },
};
