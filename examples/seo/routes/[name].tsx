/** @jsx h */
import { h } from "preact";
import { tw } from "@twind"
import { Handlers, PageProps } from "$fresh/server.ts";
import Layout, { Meta } from "../components/Layout.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    return await ctx.render({ url: req.url });
  },
};

export default function Greet({ data, params }: PageProps) {
  const greetSEO: Meta = {
    title: `${params.name.replaceAll('-', ' ').replaceAll('%20', ' ').toLocaleUpperCase()}`,
    type: 'website',
    description: `This page greets ${params.name.replaceAll('-', ' ').replaceAll('%20', ' ')}`,
    url: data.url,
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Deno.svg'
  }
  return (
    <Layout meta={greetSEO}>
      <a href={'/'} class={tw`my-6`}>back</a>
      <h1 class={tw`my-6 text-2xl`}>{params.name.replaceAll('-', ' ').replaceAll('%20', ' ')}</h1>
      <p class={tw`my-6`}>page content</p>
    </Layout>
  );
}
