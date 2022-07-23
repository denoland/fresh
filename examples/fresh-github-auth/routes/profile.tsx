/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Handlers, PageProps } from "$fresh/server.ts";
import { clientId, clientSecret } from "../utils/config.ts";
export const handler: Handlers = {
  async GET(req, ctx) {
    // get `code` query string value from url provided by github 
    const url = new URL(req.url);
    const token = url.searchParams.get("code");


    // get access_token from github 
    const tokenResponse = await fetch(
      `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${token}`,
      {
        method: "post",

        headers: {
          accept: "application/json",
        },
      },
    );

    const jsonResponse = await tokenResponse.json();

    // create token using access_token and tokeb_type i.e. "bearer Token"
    const accessToken =
      `${jsonResponse.token_type} ${jsonResponse.access_token}`;

      // fetch user details using access_token 
    const userResponse = await fetch("https://api.github.com/user", {
      method: "get",

      headers: {
        Authorization: accessToken,
      },
    });

    const user = await userResponse.json();

    return ctx.render({ user });
  },
};

export default function Profile({ data }: PageProps) {
  const user = data?.user;

  return (
    <div class={tw`min-h-screen grid place-items-center container mx-auto`}>
      <div className={tw`bg-gray-100 shadow-md rounded-lg p-4`}>
        <pre>
          {JSON.stringify(user, null, 4)}
        </pre>
      </div>
    </div>
  );
}
