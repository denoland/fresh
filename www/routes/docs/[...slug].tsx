import { Handlers, PageProps } from "$fresh/server.ts";
import { asset, Head } from "$fresh/runtime.ts";
import DocsSidebar from "../../components/DocsSidebar.tsx";
import DocsTitle from "../../components/DocsTitle.tsx";
import Footer from "../../components/Footer.tsx";
import Header from "../../components/Header.tsx";
import {
  getFirstPageUrl,
  LATEST_VERSION,
  TABLE_OF_CONTENTS,
  TableOfContentsEntry,
} from "../../data/docs.ts";
import { frontMatter, renderMarkdown } from "../../utils/markdown.ts";
import toc from "../../../docs/toc.ts";

interface Data {
  page: Page;
}

interface NavEntry {
  title: string;
  category?: string;
  href: string;
}

export interface VersionLink {
  label: string;
  href: string;
  value: string;
}

interface Page extends TableOfContentsEntry {
  markdown: string;
  data: Record<string, unknown>;
  versionLinks: VersionLink[];
  version: string;
  prevNav?: NavEntry;
  nextNav?: NavEntry;
}

const pattern = new URLPattern({ pathname: "/:version/:page*" });

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const slug = ctx.params.slug;

    // Check if the slug is the index page of a version tag
    if (TABLE_OF_CONTENTS[slug]) {
      const href = getFirstPageUrl(slug);
      return new Response("", {
        status: 307,
        headers: { location: href },
      });
    }

    const match = pattern.exec("https://localhost/" + slug);
    if (!match) {
      return ctx.renderNotFound();
    }

    let { version, page = "" } = match.pathname.groups;
    if (!version) {
      return ctx.renderNotFound();
    }

    // Latest version doesn't show up in the url
    if (!TABLE_OF_CONTENTS[version]) {
      page = version + (page ? "/" + page : "");
      version = LATEST_VERSION;
    }

    // Check if the page exists
    const currentToc = TABLE_OF_CONTENTS[version];
    const entry = currentToc[page];
    if (!entry) {
      return ctx.renderNotFound();
    }

    // Build up the link map for the version selector.
    const versionLinks: VersionLink[] = [];
    for (const version in TABLE_OF_CONTENTS) {
      const label = toc[version].label;
      const maybeEntry = TABLE_OF_CONTENTS[version][page];

      // Check if the same page is available for this version and
      // link to that. Pick the index page for that version if an
      // exact match doesn't exist.
      versionLinks.push({
        label,
        value: version,
        href: maybeEntry ? maybeEntry.href : getFirstPageUrl(version),
      });
    }

    // Add previous and next page entry if available

    const entryKeys = Object.keys(currentToc);
    const idx = entryKeys.findIndex((name) => name === entry.slug);

    let nextNav: NavEntry | undefined;
    let prevNav: NavEntry | undefined;
    const prevEntry = currentToc[entryKeys[idx - 1]];
    const nextEntry = currentToc[entryKeys[idx + 1]];

    if (prevEntry) {
      let category = prevEntry.category;
      category = category ? currentToc[category].title : "";
      prevNav = { title: prevEntry.title, category, href: prevEntry.href };
    }

    if (nextEntry) {
      let category = nextEntry.category;
      category = category ? currentToc[category].title : "";
      nextNav = { title: nextEntry.title, category, href: nextEntry.href };
    }

    // Parse markdown front matter
    const url = new URL(`../../../${entry.file}`, import.meta.url);
    const fileContent = await Deno.readTextFile(url);
    const { body, attrs } = frontMatter<Record<string, unknown>>(fileContent);

    return ctx.render({
      page: {
        ...entry,
        markdown: body,
        data: attrs ?? {},
        versionLinks,
        version,
        prevNav,
        nextNav,
      },
    });
  },
};

export default function DocsPage(props: PageProps<Data>) {
  const ogImageUrl = new URL(asset("/home-og.png"), props.url).href;
  const title = `${props.data.page?.title ?? "Not Found"} | Fresh docs`;
  let description = "Fresh Document";

  if (props.data.page.data.description) {
    description = String(props.data.page.data.description);
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
        <Header title="docs" active="/docs" />
        <Main path={props.url.pathname} page={props.data.page} />
        <Footer />
      </div>
    </>
  );
}

function Main(props: { path: string; page: Page }) {
  return (
    <div class="flex-1">
      <MobileSidebar path={props.path} page={props.page} />
      <div class="flex mx-auto max-w-screen-xl px-4 md:px-0 py-5 md:py-0 justify-end">
        <label
          for="docs_sidebar"
          class="px-4 py-3 md:hidden flex items-center hover:bg-gray-100 rounded gap-2"
        >
          <svg
            class="h-6 w-6"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h7"
            >
            </path>
          </svg>
          <div>Menu</div>
        </label>
      </div>
      <div class="mx-auto max-w-screen-xl px-4 flex gap-6 md:gap-8">
        <DesktopSidebar path={props.path} page={props.page} />
        <Content page={props.page} />
      </div>
    </div>
  );
}

function MobileSidebar(props: { path: string; page: Page }) {
  return (
    <>
      <input
        type="checkbox"
        class="hidden toggle"
        id="docs_sidebar"
        autocomplete="off"
      >
      </input>
      <div class="fixed inset-0 flex z-40 hidden toggled">
        <label
          class="absolute inset-0 bg-gray-600 opacity-75"
          for="docs_sidebar"
        />
        <div class="relative flex-1 flex flex-col w-[16rem] h-full bg-white border(r-2 gray-100)">
          <div class="p-4 border(b-2 gray-100) bg-green-300">
            <DocsTitle title="docs" />
          </div>
          <nav class="pt-6 pb-16 px-4 overflow-x-auto">
            <DocsSidebar
              mobile
              path={props.path}
              versionLinks={props.page.versionLinks}
              selectedVersion={props.page.version}
            />
          </nav>
        </div>
      </div>
    </>
  );
}

function DesktopSidebar(props: { path: string; page: Page }) {
  return (
    <nav class="w-[18rem] flex-shrink-0 hidden md:block py-7 pr-8">
      <DocsSidebar
        path={props.path}
        versionLinks={props.page.versionLinks}
        selectedVersion={props.page.version}
      />
    </nav>
  );
}

function Content(props: { page: Page }) {
  const html = renderMarkdown(props.page.markdown);
  return (
    <main class="py-6 overflow-hidden md:mr-4 lg:mr-32">
      <h1 class="text(4xl gray-900) tracking-tight font-extrabold mt-6 md:mt-0">
        {props.page.title}
      </h1>
      <div
        class="mt-6 markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <ForwardBackButtons
        slug={props.page.slug}
        version={props.page.version}
        prev={props.page.prevNav}
        next={props.page.nextNav}
      />
    </main>
  );
}

const button = "p-2 bg-gray-100 w-full border(1 gray-200) grid";

function ForwardBackButtons(props: {
  slug: string;
  version: string;
  prev?: NavEntry;
  next?: NavEntry;
}) {
  const { prev, next } = props;
  const upper = "text(sm gray-600)";
  const category = "font-normal";
  const lower = "text-gray-900 font-medium";

  return (
    <div class="mt-8 flex flex(col md:row) gap-4">
      {prev && (
        <a href={prev.href} class={`${button} text-left`}>
          <span class={upper}>{"←"} Previous</span>
          <span class={lower}>
            <span class={category}>
              {prev.category ? `${prev.category}: ` : ""}
            </span>
            {prev.title}
          </span>
        </a>
      )}
      {next && (
        <a href={next.href} class={`${button} text-right`}>
          <span class={upper}>Next {"→"}</span>
          <span class={lower}>
            <span class={category}>
              {next.category ? `${next.category}: ` : ""}
            </span>
            {next.title}
          </span>
        </a>
      )}
    </div>
  );
}
