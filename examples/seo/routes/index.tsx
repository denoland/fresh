/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import Layout, { Meta } from "../components/Layout.tsx";

export default function Home() {
  const homeSEO: Meta = {
    title: "Fresh SEO Demo",
    type: "website",
    description: "This is the home page of a demonstration on how to affect the meta tags with Fresh and Deno.",
    url: "seo-example.deno.dev",
    image: "/logo.png"
  }

  return (
    <Layout meta={homeSEO}>
      <img
        src="/logo.svg"
        height="100px"
        alt="the fresh logo: a sliced lemon dripping with juice"
      />
      <h1 class={tw`my-6 text-2xl`}>Home</h1>
      <p class={tw`my-6`}>
        Welcome to `fresh`. Try adding "/hello-world" to the url, and then checking the meta tags in the page source.
      </p>
    </Layout>
  );
}
