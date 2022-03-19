

import { Handlers } from "../../../../../server.ts";

interface State {
  root: string;
  layer1: string;
  layer2: string;
}

export const handler: Handlers<any, State> = {
  GET(_req: Request, { state }) {
    return new Response(JSON.stringify(state));
  },
};
