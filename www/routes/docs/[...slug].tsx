/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, Head, PageProps, tw } from "../../client_deps.ts";
import { gfm, Handlers } from "../../server_deps.ts";
import DocsSidebar from "../../components/DocsSidebar.tsx";
import Footer from "../../components/Footer.tsx";
import NavigationBar from "../../components/NavigationBar.tsx";
import WarningBanner from "../../components/WarningBanner.tsx";
import { TOC } from "../../data/docs.ts";

interface Data {
  page: Page | null;
}

interface Page {
  title: string;
  markdown: string;
}

export const handler: Handlers<Data> = {
  async GET(ctx) {
    let path = ctx.match.slug;
    if (path === "") {
      return new Response("", {
        status: 307,
        headers: { location: "/docs/introduction" },
      });
    }
    if (!path.includes("/")) {
      path = `${path}/index`;
    }
    const url = new URL(`../../../docs/${path}.md`, import.meta.url);
    let page: Page | null = null;
    try {
      const markdown = await Deno.readTextFile(url);
      let title: string | null = null;
      const parts = ctx.match.slug.split("/");
      if (parts.length === 1) {
        title = TOC[parts[0]].title;
      } else {
        title = TOC[parts[0]].pages!.find(([id]) => id === parts[1])![1];
      }
      page = { title, markdown };
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }
    const resp = ctx.render({ page });
    if (page === null) {
      return new Response(resp.body, { ...resp, status: 404 });
    }
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
          <a href="/">
            fresh
          </a>{" "}
          <span class={pageName}>docs</span>
        </p>
        <p class={subtitle}>The next-gen web framework.</p>
      </div>
    </header>
  );
}

function Main(props: { path: string; page: Page | null }) {
  const main = tw`mx-auto max-w-screen-lg px-4 grid grid-cols-8 gap-6`;
  return (
    <div class={main}>
      <DocsSidebar path={props.path} />
      <Content path={props.path} page={props.page} />
    </div>
  );
}

function Content(props: { path: string; page: Page | null }) {
  const main = tw`col-span-6 py-8`;
  const title = tw`text(4xl gray-900) tracking-tight font-extrabold`;
  const body = tw`mt-6`;
  props.page ??= {
    title: "Not Found",
    markdown: "The article you were looking for was not found.",
  };
  const html = gfm.render(props.page.markdown);
  return (
    <main class={main}>
      <WarningBanner />
      <h1 class={title}>{props.page.title}</h1>
      <div
        class={`${body} markdown-body`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
