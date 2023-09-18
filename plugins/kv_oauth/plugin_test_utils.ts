// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { OAuth2Client } from "./plugin_deps.ts";
import type { OAuthSession, Tokens } from "./plugin_test_deps.ts";

// Dummy OAuth 2.0 client for testing only.
export const oauth2Client = new OAuth2Client({
  clientId: crypto.randomUUID(),
  clientSecret: crypto.randomUUID(),
  authorizationEndpointUri: "https://example.com/authorize",
  tokenUri: "https://example.com/token",
});

export function genOAuthSession(): OAuthSession {
  return {
    state: crypto.randomUUID(),
    codeVerifier: crypto.randomUUID(),
  };
}

export function genTokens(): Tokens {
  return {
    accessToken: crypto.randomUUID(),
    tokenType: crypto.randomUUID(),
  };
}
