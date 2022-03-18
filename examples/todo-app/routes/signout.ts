import { deleteCookie, getCookies, Handlers } from "../server_deps.ts";
import { deleteSession } from "../utils/database.ts";

export const handler: Handlers = {
  async GET(req) {
    const cookies = getCookies(req.headers);
    if (cookies.sessionId) {
      await deleteSession(cookies.sessionId);
    }
    const headers = new Headers({ Location: "/" });
    deleteCookie(headers, "sessionId", { path: "/" });
    return new Response("Signed out! Redirecting...", { headers, status: 302 });
  },
};
