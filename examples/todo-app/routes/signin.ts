import { Handlers, setCookie } from "../server_deps.ts";
import { authorizationUrl } from "../utils/github.ts";

export const handler: Handlers = {
  GET() {
    const state = crypto.randomUUID();
    const redirectUrl = authorizationUrl(state);
    const headers = new Headers({ Location: redirectUrl });
    setCookie(headers, {
      name: "state",
      value: state,
      path: "/",
      sameSite: "Lax",
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60, // 1 hour
    });
    return new Response("Signin in...", { headers, status: 302 });
  },
};
