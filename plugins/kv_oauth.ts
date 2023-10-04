import {
  createAuth0OAuthConfig,
  createDiscordOAuthConfig,
  createDropboxOAuthConfig,
  createFacebookOAuthConfig,
  createGitHubOAuthConfig,
  createGitLabOAuthConfig,
  createGoogleOAuthConfig,
  createNotionOAuthConfig,
  createOktaOAuthConfig,
  createPatreonOAuthConfig,
  createSlackOAuthConfig,
  createSpotifyOAuthConfig,
  createTwitterOAuthConfig,
  getRequiredEnv,
  handleCallback,
  type OAuth2ClientConfig,
  signIn,
  signOut,
} from "https://deno.land/x/deno_kv_oauth@v0.9.1/mod.ts";
import type { Handler } from "$fresh/server.ts";

export {
  createAuth0OAuthConfig,
  createDiscordOAuthConfig,
  createDropboxOAuthConfig,
  createFacebookOAuthConfig,
  createGitHubOAuthConfig,
  createGitLabOAuthConfig,
  createGoogleOAuthConfig,
  createNotionOAuthConfig,
  createOktaOAuthConfig,
  createPatreonOAuthConfig,
  createSlackOAuthConfig,
  createSpotifyOAuthConfig,
  createTwitterOAuthConfig,
  getRequiredEnv,
  type OAuth2ClientConfig,
};

/** @see {@link https://fresh.deno.dev/docs/examples/using-deno-kv-oauth} */
export function createRoutes<T extends string = "/oauth">(
  oauthConfig: OAuth2ClientConfig,
  /** Parent path for sign-in, callback and sign-out pages. */
  oauthPath = "/oauth" as T,
): [
  { path: `${T}/signin`; handler: Handler },
  { path: `${T}/callback`; handler: Handler },
  { path: `${T}/signout`; handler: Handler },
] {
  return [
    {
      path: `${oauthPath}/signin`,
      handler: async (req) => await signIn(req, oauthConfig),
    },
    {
      path: `${oauthPath}/callback`,
      handler: async (req) => {
        // Return object also includes `accessToken` and `sessionId` properties.
        const { response } = await handleCallback(
          req,
          oauthConfig,
        );
        return response;
      },
    },
    {
      path: `${oauthPath}/signout`,
      handler: signOut,
    },
  ];
}
