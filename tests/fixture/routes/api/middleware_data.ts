import { Handlers } from "../../../../server.ts";

interface State {
  data: string
}

export const handler: Handlers<any, State> = {
  GET(_req: Request, { state }) {
    console.log('ssssssssss', state)
    return new Response(state.data);
  },
};
