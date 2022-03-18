import { getCookies, Handlers, setCookie } from "../../server_deps.ts";
import { createSession, Session } from "../../utils/database.ts";
import { exchangeCode, UserAPI } from "../../utils/github.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const cookies = getCookies(req.headers);
    if (cookies.state !== state) {
      return new Response("Invalid state", { status: 400 });
    }

    if (code === null) {
      return new Response("Missing code", { status: 400 });
    }

    const token = await exchangeCode(code);

    const api = new UserAPI(token);
    const user = await api.me();

    const session: Session = {
      id: user.id,
      username: user.login,
      avatarUrl: user.avatar_url,
      accessToken: token,
    };

    const sessionId = await createSession(session);

    const headers = new Headers({ Location: "/" });
    setCookie(headers, {
      name: "sessionId",
      value: sessionId,
      path: "/",
      sameSite: "Lax",
      httpOnly: true,
      secure: true,
      maxAge: (60 * 60 * 23) + (59 * 60), // 23 hours and 59 minutes
    });
    return new Response("Signed in! Redirecting...", { headers, status: 302 });
  },
};
