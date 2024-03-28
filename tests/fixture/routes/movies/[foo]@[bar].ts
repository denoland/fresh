import type { Handler } from "$fresh/server.ts";

export const handler: Handler = () => new Response("it works");
