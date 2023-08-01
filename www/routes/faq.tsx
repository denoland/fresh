import { Handlers, PageProps } from "$fresh/server.ts";
import { frontMatter, gfm } from "../utils/markdown.ts";
import { asset, Head } from "$fresh/runtime.ts";

import Footer from "../components/Footer.tsx";
import Header from "../components/Header.tsx";

interface Data {
  page: {
    markdown: string;
    data: Record<string, unknown>;
  };
}

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const url = new URL(`../../docs/faq.md`, import.meta.url);
    const fileContent = await Deno.readTextFile(url);
    const { body, attrs } = frontMatter<Record<string, unknown>>(fileContent);

    const data = {
      page: {
        markdown: body,
        data: attrs ?? {},
      },
    } satisfies Data;

    return ctx.render(data);
  },
};

export default function FAQ(props: PageProps<Data>) {
  const ogImageUrl = new URL(asset("/home-og.png"), props.url).href;
  let description = "Fresh Document";

  if (props.data.page.data.description) {
    description = String(props.data.page.data.description);
  }

  let title = "FAQ";

  if (props.data.page.data.title) {
    title = String(props.data.page.data.title);
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="stylesheet" href={asset("/gfm.css")} />
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={props.url.href} />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="view-transition" content="same-origin" />
      </Head>
      <div class="flex flex-col min-h-screen">
        <Header title="docs" active="/faq" />
        <Content markdown={props.data.page.markdown} title={title} />
        <Footer />
      </div>
    </>
  );
}

function Content(props: { markdown: string; title: string }) {
  let html = gfm.render(props.markdown);

  html += `
    
        <style>

            .markdown-body h4 strong {
                color : #c35b62 ;
            }

        </style>
    `;

  return (
    <div class="flex justify-center">
      <main class="py-6 max-w-[700px] min-w-[min(60%,700px)]">
        <h1 class="text(4xl gray-900) tracking-tight font-extrabold mt-6 md:mt-0">
          {props.title}
        </h1>
        <div
          class="mt-6 markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </div>
  );
}
