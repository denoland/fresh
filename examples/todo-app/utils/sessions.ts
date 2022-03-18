import { getCookies } from "../server_deps.ts";
import { getSession as dbGetSession, Session } from "./database.ts";

export async function getSession(headers: Headers): Promise<Session | null> {
  const { sessionId } = getCookies(headers);
  let session: Session | null = null;
  if (sessionId) {
    session = await dbGetSession(sessionId);
  }
  return session;
}
