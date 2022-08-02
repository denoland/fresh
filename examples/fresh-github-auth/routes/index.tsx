/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Handlers, PageProps } from "$fresh/server.ts";
import { clientId } from "../utils/config.ts";
export const handler: Handlers = {
  GET(req, ctx) {
    return ctx.render({ clientId });
  },
};

export default function Home({ data }: PageProps) {

  // github client id from environment variable 
  const clientId = data?.clientId;
  
  return (
    <div class={tw`min-h-screen grid place-items-center`}>
      <a
        href={`https://github.com/login/oauth/authorize?client_id=${clientId}`}
        class={tw
          `bg-black text-white font-bold text-xl px-6 py-3 rounded-full shadow-md border-4 border-blue-400 outline-green-400`}
      >
        <span class="fa fa-github"></span> Github Login
      </a>
    </div>
  );
}
