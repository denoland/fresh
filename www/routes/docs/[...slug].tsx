/** @jsx h */
/** @jsxFrag Fragment */

import { apply, Fragment, h, Head, PageProps, tw } from "../../client_deps.ts";
import { gfm, Handlers } from "../../server_deps.ts";
import DocsSidebar from "../../components/DocsSidebar.tsx";
import Footer from "../../components/Footer.tsx";
import NavigationBar from "../../components/NavigationBar.tsx";
import WarningBanner from "../../components/WarningBanner.tsx";
import {
  SLUGS,
  TABLE_OF_CONTENTS,
  TableOfContentsEntry,
} from "../../data/docs.ts";

interface Data {
  page: Page;
}

interface Page extends TableOfContentsEntry {
  markdown: string;
}

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const slug = ctx.params.slug;
    if (slug === "") {
      return new Response("", {
        status: 307,
        headers: { location: "/docs/introduction" },
      });
    }
    const entry = TABLE_OF_CONTENTS[slug];
    if (!entry) {
      return new Response("404 Page not found", {
        status: 404,
      });
    }
    const url = new URL(`../../../${entry.file}`, import.meta.url);
    const markdown = await Deno.readTextFile(url);
    const page = { ...entry, markdown };
    const resp = ctx.render({ page });
    return resp;
  },
};

export default function DocsPage(props: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>{props.data.page?.title ?? "Not Found"} | fresh docs</title>
        <link rel="stylesheet" href="/gfm.css" />
      </Head>
      <Header />
      <NavigationBar active="/docs" />
      <Main path={props.url.pathname} page={props.data.page} />
      <Footer />
    </>
  );
}

function Header() {
  const title = tw`text(2xl gray-900) tracking-tight font-extrabold`;
  const pageName = tw`font-light`;
  const subtitle = tw`text(sm gray-600)`;
  return (
    <header
      class={tw`mx-auto max-w-screen-lg flex p-4 gap-3 items-baseline`}
    >
      <div>
        <p class={title}>
          <a href="/">fresh</a> <span class={pageName}>docs</span>
        </p>
        <p class={subtitle}>The next-gen web framework.</p>
      </div>
    </header>
  );
}

function Main(props: { path: string; page: Page }) {
  const main = tw`mx-auto max-w-screen-lg px-4 grid grid-cols-8 gap-6`;
  return (
    <div class={main}>
      <DocsSidebar path={props.path} />
      <Content page={props.page} />
    </div>
  );
}

function Content(props: { page: Page }) {
  const main = tw`col-span-6 py-8`;
  const title = tw`text(4xl gray-900) tracking-tight font-extrabold`;
  const body = tw`mt-6`;
  const html = gfm.render(props.page.markdown);
  return (
    <main class={main}>
      <WarningBanner />
      <h1 class={title}>{props.page.title}</h1>
      <div
        class={`${body} markdown-body`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <ForwardBackButtons slug={props.page.slug} />
    </main>
  );
}

const button = apply`p-2 bg-gray-100 w-full border(1 gray-200) grid`;

function ForwardBackButtons(props: { slug: string }) {
  const currentIndex = SLUGS.findIndex((slug) => slug === props.slug);
  const previousSlug = SLUGS[currentIndex - 1];
  const nextSlug = SLUGS[currentIndex + 1];
  const previous = TABLE_OF_CONTENTS[previousSlug];
  const next = TABLE_OF_CONTENTS[nextSlug];

  const upper = tw`text(sm gray-600)`;
  const category = tw`font-normal`;
  const lower = tw`text-gray-900 font-medium`;

  return (
    <div class={tw`mt-8 flex gap-4`}>
      {previous && (
        <a href={previous.href} class={tw`${button} text-left`}>
          <span class={upper}>{"<-"} Previous</span>
          <span class={lower}>
            <span class={category}>
              {previous.category
                ? `${TABLE_OF_CONTENTS[previous.category].title}: `
                : ""}
            </span>
            {previous.title}
          </span>
        </a>
      )}
      {next && (
        <a href={next.href} class={tw`${button} text-right`}>
          <span class={upper}>Next {"->"}</span>
          <span class={lower}>
            <span class={category}>
              {next.category
                ? `${TABLE_OF_CONTENTS[next.category].title}: `
                : ""}
            </span>
            {next.title}
          </span>
        </a>
      )}
    </div>
  );
}
