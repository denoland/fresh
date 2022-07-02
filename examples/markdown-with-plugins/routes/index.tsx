/** @jsx h */
import { type PageProps } from "$fresh/server.ts";
import { h } from "preact";
import { tw } from "@twind";
import { Handlers } from "$fresh/server.ts";

type Page = { posts: Array<string> };

const postsPath = "../data/posts";

export const handler: Handlers<Page> = {
  async GET(_, context) {
    const { pathname } = new URL(postsPath, import.meta.url);
    const posts = [];
    for await (const { name } of Deno.readDir(pathname)) {
      posts.push(name.slice(0, name.lastIndexOf(".")));
    }
    return context.render({ posts });
  },
};

export default function Home(props: PageProps<Page>) {
  const { posts } = props.data;
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md text-xl`}>
      <img
        src="/logo.svg"
        height="100px"
        alt="the fresh logo: a sliced lemon dripping with juice"
      />
      <p class={tw`my-6`}>
        Welcome to `fresh`.
      </p>
      <p class={tw`my-6`}>Blog posts:</p>
      <ul class={tw`my-6`}>
        {posts.map((post, index) => (
          <li key={index} class={tw`text-lg`}>
            <a href={post} class={tw`hover:text-blue-500 hover:font-bold`}>
              🔗 {post}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
