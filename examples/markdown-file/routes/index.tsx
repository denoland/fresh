/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";
import { frontMatter, gfm } from "../utils/markdown.ts";
import { tw } from "@twind";
import { asset, Head } from "$fresh/runtime.ts";

interface Page {
  markdown: string;
  data: Record<string, unknown>;
}

export const handler: Handlers<Page | null> = {
  async GET(_, ctx) {
    const resp = await fetch(
      `https://raw.githubusercontent.com/denoland/fresh/main/README.md`,
    );

    if (resp.status !== 200) {
      return ctx.render(null);
    }

    const markdown = await resp.text();
    const { content, data } = frontMatter(markdown) as {
      data: Record<string, string>;
      content: string;
    };
    const page: Page = { markdown: content, data: data ?? {} };

    return ctx.render(page);
  },
};

export default function MarkdownPage({ data }: PageProps<Page | null>) {
  if (!data) {
    return <h1>File not found.</h1>;
  }

  const main = tw`py-8 overflow-hidden`;
  const title = tw`text(4xl gray-900) tracking-tight font-extrabold mt-6`;
  const body = tw`mt-6`;
  const html = gfm.render(data?.markdown ?? "");

  return (
    <>
      <Head>
        <title>Markdown</title>
        <link rel="stylesheet" href={asset("/gfm.css")} />
      </Head>
      <div class={tw`flex flex-col min-h-screen place-items-center`}>
        <main class={main}>
          <h1 class={title}>Markdown</h1>
          <div
            class={`${body} markdown-body`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </main>
      </div>
    </>
  );
}
