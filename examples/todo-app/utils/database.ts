import { upstash } from "../server_deps.ts";
import { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } from "./config.ts";
import { Todo } from "./types.ts";

upstash.auth(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN);

const SESSION_LIFETIME = 60 * 60 * 24; // 24 hours

export interface Session {
  id: number;
  username: string;
  avatarUrl: string;
  accessToken: string;
}

export async function getSession(id: string): Promise<Session | null> {
  const { data, error } = await upstash.get(`session:${id}`);
  if (error) throw new Error(error);
  if (data === null) return null;
  return JSON.parse(data);
}

export async function createSession(session: Session): Promise<string> {
  const id = crypto.randomUUID();
  const { error } = await upstash.setex(
    `session:${id}`,
    SESSION_LIFETIME,
    JSON.stringify(session),
  );
  if (error) throw new Error(error);
  return id;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await upstash.del(`session:${id}`);
  if (error) throw new Error(error);
}

export async function getTodos(userId: number): Promise<Todo[]> {
  const { data, error } = await upstash.lrange(`todos:${userId}`, 0, -1);
  if (error) throw new Error(error);
  return data.map((todo: string) => JSON.parse(todo));
}

export async function createTodo(userId: number, todo: Todo): Promise<number> {
  const json = JSON.stringify(todo);
  const { data, error } = await upstash.rpush(`todos:${userId}`, json);
  if (error) throw new Error(error);
  return data;
}
