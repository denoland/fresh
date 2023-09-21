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
  handleCallback,
  signIn,
  signOut,
} from "https://deno.land/x/deno_kv_oauth@v0.7.0/mod.ts";
import type { OAuth2ClientConfig } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";
import { PluginRoute } from "$fresh/src/server/types.ts";

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
};

/**
 * Creates the following routes, based on Deno KV OAuth's request handlers:
 * - `GET <oauthPath>/signin` for the sign-in page
 * - `GET <oauthPath>/callback` for the callback page
 * - `GET <oauthPath>/signout` for the sign-out page
 *
 * @example Single provider
 * ```ts
 * // main.ts
 * import { start } from "$fresh/server.ts";
 * import { createRoutes, createGitHubOAuthConfig } from "$fresh/plugins/kv_oauth.ts";
 * import manifest from "./fresh.gen.ts";
 *
 * await start(manifest, {
 *   plugins: [{
 *     name: "kv-oauth",
 *     routes: createRoutes(createGitHubOAuthConfig())
 *   }]
 * });
 * ```
 *
 * @example Multiple providers
 * ```ts
 * // main.ts
 * import { start } from "$fresh/server.ts";
 * import {
 *   createRoutes,
 *   createGitHubOAuthConfig,
 *   createGoogleOAuthConfig,
 * } from "$fresh/plugins/kv_oauth.ts";
 * import manifest from "./fresh.gen.ts";
 *
 * await start(manifest, {
 *   plugins: [{
 *     name: "kv-oauth-github",
 *     routes: createRoutes(createGitHubOAuthConfig(), "/oauth/github"),
 *   }, {
 *     name: "kv-oauth-google",
 *     routes: createRoutes(createGoogleOAuthConfig(), "/oauth/google"),
 *   }]
 * });
 * ```
 */
export function createRoutes(
  oauthConfig: OAuth2ClientConfig,
  /** Parent path for sign-in, callback and sign-out pages. */
  oauthPath = "/oauth",
): PluginRoute[] {
  return [
    {
      path: oauthPath + "/signin",
      handler: async (req) => await signIn(req, oauthConfig),
    },
    {
      path: oauthPath + "/callback",
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
      path: oauthPath + "/signout",
      handler: signOut,
    },
  ];
}
