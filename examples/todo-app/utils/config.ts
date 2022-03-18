import { dotenv } from "../server_deps.ts";

function env(key: string): string {
  const val = Deno.env.get(key);
  if (val === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return val;
}

dotenv({ export: true });

export const GITHUB_CLIENT_ID = env("GITHUB_CLIENT_ID");
export const GITHUB_CLIENT_SECRET = env("GITHUB_CLIENT_SECRET");
export const UPSTASH_REDIS_REST_URL = env("UPSTASH_REDIS_REST_URL");
export const UPSTASH_REDIS_REST_TOKEN = env("UPSTASH_REDIS_REST_TOKEN");
