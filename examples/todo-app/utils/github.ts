import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "./config.ts";

export function authorizationUrl(state: string): string {
  const url = new URL(`https://github.com/login/oauth/authorize`);
  url.searchParams.set("client_id", GITHUB_CLIENT_ID);
  url.searchParams.set("state", state);
  return url.href;
}

export async function exchangeCode(code: string): Promise<string> {
  const url = new URL(`https://github.com/login/oauth/access_token`);
  url.searchParams.set("client_id", GITHUB_CLIENT_ID);
  url.searchParams.set("client_secret", GITHUB_CLIENT_SECRET);
  url.searchParams.set("code", code);
  const resp = await fetch(url.href, {
    method: "POST",
    headers: {
      "Accept": "application/json",
    },
  });
  if (!resp.ok) {
    throw new Error(`Failed to exchange code: ${resp.statusText}`);
  }
  const json = await resp.json();
  return json.access_token;
}

interface User {
  id: number;
  login: string;
  avatar_url: string;
}

export class UserAPI {
  #token;
  constructor(token: string) {
    this.#token = token;
  }

  async me(): Promise<User> {
    const resp = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `token ${this.#token}`,
      },
    });
    if (!resp.ok) {
      throw new Error(`Failed to fetch user: ${resp.statusText}`);
    }
    return await resp.json();
  }
}
