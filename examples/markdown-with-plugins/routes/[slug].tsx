/** @jsx h */
import { type PageProps } from "$fresh/server.ts";
import { h } from "preact";
import { tw } from "@twind";
import { Handlers } from "$fresh/server.ts";
import { compileMarkdown, type ParsedContent } from "../utils/markdown.ts";

type Page = ParsedContent;

export const handler: Handlers<Page> = {
  async GET(_, context) {
    const { slug } = context.params;
    if (!slug) {
      return new Response("", { status: 307, headers: { location: "/" } });
    }
    const { html, frontmatter } = await compileMarkdown(slug);

    return context.render({ html, frontmatter });
  },
};

export default function Blog(props: PageProps<Page>) {
  const { html, frontmatter } = props.data;
  const { title, publishedOn, image } = frontmatter;

  const Title = title ? <h1 class={tw`text-3xl font-bold`}>{title}</h1> : null;
  const PublishedOn = publishedOn ? <p>{publishedOn}</p> : null;
  const Image = image ? <img src={image} alt={title} class={tw`w-64`} /> : null;

  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-one-light.min.css"
          type="text/css"
          rel="stylesheet"
        >
        </link>
        <title>{title || "Blog post"}</title>
      </head>
      <body class={tw`flex justify-center`}>
        <main class={tw`w-3/4 pt-12`}>
          {Title}
          {PublishedOn}
          {Image}
          <article dangerouslySetInnerHTML={{ __html: html }}></article>
        </main>
      </body>
    </html>
  );
}
