import { HttpError, page } from "@fresh/core";
import { asset, Partial } from "@fresh/core/runtime";
import { SidebarCategory } from "../../components/DocsSidebar.tsx";
import Footer from "../../components/Footer.tsx";
import Header from "../../components/Header.tsx";
import {
  CATEGORIES,
  getFirstPageUrl,
  LATEST_VERSION,
  TABLE_OF_CONTENTS,
  type TableOfContentsEntry,
} from "../../data/docs.ts";
import { frontMatter, renderMarkdown } from "../../utils/markdown.ts";
import toc from "../../../docs/toc.ts";
import { TableOfContents } from "../../islands/TableOfContents.tsx";
import SearchButton from "../../islands/SearchButton.tsx";
import VersionSelect from "../../islands/VersionSelect.tsx";
import { define } from "../../utils/state.ts";

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

export const handler = define.handlers<Data>({
  async GET(ctx) {
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
      throw new HttpError(404);
    }

    let { version, page = "" } = match.pathname.groups;
    if (!version) {
      throw new HttpError(404);
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
      throw new HttpError(404);
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

    ctx.state.title = `${entry.title ?? "Not Found"} | Fresh docs`;
    ctx.state.description = attrs?.description
      ? String(attrs.description)
      : "Fresh Document";
    ctx.state.ogImage = new URL(asset("/og-image.webp"), ctx.url).href;

    return page({
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
});

export default define.page<typeof handler>(function DocsPage(props) {
  const { page } = props.data;
  const { html, headings } = renderMarkdown(page.markdown);

  return (
    <div class="flex flex-col min-h-screen mx-auto max-w-screen-2xl">
      <Header title="docs" active="/docs" />
      <div f-client-nav={true}>
        <MobileSidebar page={page} />
        <div class="flex mx-auto max-w-screen-2xl px-0 md:px-4 md:py-0 justify-start bg-gray-100">
          <label
            for="docs_sidebar"
            class="px-4 py-3 lg:hidden flex items-center hover:bg-gray-100 rounded gap-2 cursor-pointer"
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
            <div>Table of Contents</div>
          </label>
        </div>
        <nav class="flex-shrink-0 hidden lg:block lg:px-4 bg-white">
          <div class="fixed top-24 w-[17rem] flex overflow-hidden">
            <div class="flex-1 h-[calc(100vh_-_6rem)] overflow-y-auto pb-8">
              <SearchButton class="mr-4 sm:mr-0" />
              <div class="mb-4">
                <VersionSelect
                  selectedVersion={page.version}
                  versions={page.versionLinks}
                />
              </div>
              <ul class="list-inside font-semibold nested ml-2.5">
                {CATEGORIES[page.version].map((category) => (
                  <SidebarCategory key={category.href} category={category} />
                ))}
              </ul>
            </div>
          </div>
        </nav>
        <Partial name="docs-main">
          <div class="w-full min-w-0">
            <main class="lg:ml-[18rem] mt-4 min-w-0 mx-auto">
              <div class="flex gap-6 md:gap-8 xl:gap-[8%] flex-col xl:flex-row md:mx-8 lg:mx-16 2xl:mx-0 lg:justify-end">
                <TableOfContents headings={headings} />

                <div class="lg:order-1 min-w-0 max-w-3xl w-full">
                  <h1 class="text-4xl text-gray-900 tracking-tight font-bold md:mt-0 px-4 md:px-0 mb-4">
                    {page.title}
                  </h1>
                  <div
                    class="markdown-body mb-8"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />

                  <div class="mb-8">
                    <ForwardBackButtons
                      slug={page.slug}
                      version={page.version}
                      prev={page.prevNav}
                      next={page.nextNav}
                    />
                  </div>
                  <hr />
                  <div class="px-4 md:px-0 flex justify-between my-6">
                    <a
                      href={`https://github.com/denoland/fresh/edit/main/${page.file}`}
                      class="text-green-600 underline flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg class="w-4 h-4 inline-block mr-1">
                        <use href="/icons.svg#external" />
                      </svg>
                      Edit this page on GitHub
                    </a>
                  </div>
                </div>
              </div>
              <div class="xl:ml-[3.75rem]">
                <Footer />
              </div>
            </main>
          </div>
        </Partial>
      </div>
    </div>
  );
});

function MobileSidebar({ page }: { page: Page }) {
  return (
    <div class="lg:hidden">
      <input
        type="checkbox"
        class="hidden toggle"
        id="docs_sidebar"
        autocomplete="off"
      />
      <div class="fixed inset-0 flex z-50 hidden toggled">
        <label
          class="absolute inset-0 bg-gray-600 opacity-75"
          for="docs_sidebar"
        />
        <div class="relative flex-1 flex flex-col w-[18rem] h-full bg-white border-r-2 border-gray-100">
          <nav class="pt-0 pb-16 overflow-x-auto">
            <div class="flex-1 h-screen overflow-y-auto pt-4 px-4">
              <SearchButton class="mr-4 sm:mr-0" />
              <div class="mb-4">
                <VersionSelect
                  selectedVersion={page.version}
                  versions={page.versionLinks}
                />
              </div>
              <ul class="list-inside font-semibold nested ml-2.5">
                {CATEGORIES[page.version].map((category) => (
                  <SidebarCategory key={category.href} category={category} />
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

function ForwardBackButtons(props: {
  slug: string;
  version: string;
  prev?: NavEntry;
  next?: NavEntry;
}) {
  const { prev, next } = props;

  return (
    <div class="px-4 md:px-0 mt-8 flex flex-col sm:flex-row gap-4 justify-between">
      {prev
        ? (
          <a
            href={prev.href}
            class="px-4 py-2 text-left rounded border border-gray-200 grid border-solid w-full hover:border-green-600 transition-colors"
          >
            <span class="text-sm text-gray-600">
              Previous page
            </span>
            <span class="text-green-600 font-medium">
              {prev.title}
            </span>
          </a>
        )
        : <div class="w-full" />}
      {next
        ? (
          <a
            href={next.href}
            class="px-4 py-2 text-right rounded border border-gray-200 border-solid grid w-full hover:border-green-600 transition-colors"
          >
            <span class="text-sm text-gray-600">
              Next page
            </span>
            <span class="text-green-600 font-medium">
              {next.title}
            </span>
          </a>
        )
        : <div class="w-full" />}
    </div>
  );
}
