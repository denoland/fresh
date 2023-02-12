import { Handlers } from "../../../../../../server.ts";

export const handler: Handlers<undefined> = {
  GET(_req: Request) {
    return new Response(JSON.stringify({}));
  },
};
