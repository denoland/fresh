/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "preact";
import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { frontMatter, gfm } from "../../utils/markdown.ts";

import DocsSidebar from "../../components/DocsSidebar.tsx";
import Footer from "../../components/Footer.tsx";
import NavigationBar from "../../components/NavigationBar.tsx";
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
  data: Record<string, unknown>;
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
    const fileContent = await Deno.readTextFile(url);
    const { content, data } = frontMatter(fileContent) as {
      data: Record<string, string>;
      content: string;
    };
    const page = { ...entry, markdown: content, data: data ?? {} };
    const resp = ctx.render({ page });
    return resp;
  },
};

export default function DocsPage(props: PageProps<Data>) {
  let description;

  if (props.data.page.data.description) {
    description = String(props.data.page.data.description);
  }

  return (
    <>
      <Head>
        <title>{props.data.page?.title ?? "Not Found"} | fresh docs</title>
        <link rel="stylesheet" href={`/gfm.css?build=${__FRSH_BUILD_ID}`} />
        {description && <meta name="description" content={description} />}
      </Head>
      <div class="flex flex-col min-h-screen">
        <Header />
        <NavigationBar active="/docs" />
        <Main path={props.url.pathname} page={props.data.page} />
        <Footer />
      </div>
    </>
  );
}

function Logo() {
  return (
    <a href="/" class="flex mr-3 items-center">
      <img
        src="/logo.svg"
        alt="Fresh logo"
        width={40}
        height={40}
      />
    </a>
  );
}

function Header() {
  return (
    <div class="bg-green-300">
      <header class="mx-auto max-w-screen-lg flex gap-3 justify-between">
        <div class="p-4 flex">
          <Logo />
          <div>
            <Title />
          </div>
        </div>
        <label
          for="docs_sidebar"
          class="px-4 py-4 md:hidden border(l-2 green-200) flex items-center hover:bg-green-100"
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
        </label>
      </header>
    </div>
  );
}

function Title() {
  return (
    <>
      <a
        href="/"
        class="text(2xl gray-900) tracking-tight font-extrabold flex items-center gap-1"
      >
        <svg
          preserveAspectRatio="xMinYMin"
          viewBox="0 0 250 75"
          fill="none"
          alt="Fresh logo"
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 inline-block py-[1px]"
        >
          <path
            d="M14.0805 0.761269V70.0893H0V0.761269H14.0805ZM35.6322 30.2257V41.7803H10.3448V30.2257H35.6322ZM38.5057 0.761269V12.3159H10.3448V0.761269H38.5057ZM46.5517 0.761269H68.9655C73.5632 0.761269 77.5862 1.62785 80.7471 3.36105C83.908 4.80538 86.4943 7.11632 88.2184 10.2939C90.1641 13.8269 91.1548 17.8107 91.092 21.8485C91.092 25.6038 90.5172 28.7813 89.3678 31.3811C88.5057 34.2698 87.069 36.2919 85.0575 38.0251C83.046 39.7583 81.0345 40.9137 78.4483 42.3581L74.1379 44.669H56.0345V33.1143H68.3908C70.0971 33.2247 71.7975 32.8225 73.2759 31.9589C74.4253 31.0923 75.2874 29.9368 76.1494 28.4925C76.8253 26.6458 77.1186 24.6798 77.0115 22.7151C77.0115 20.6931 76.7241 18.9599 76.1494 17.2267C75.5747 15.7823 74.7126 14.338 73.2759 13.7603C72.4138 12.8937 70.6897 12.3159 68.9655 12.3159H60.3448V70.0893H46.5517V0.761269V0.761269ZM78.1609 70.0893L65.5172 39.1805H79.8851L93.1035 69.5115V70.0893H78.1609ZM140.517 58.5346V70.0893H110.345V58.5346H140.517ZM114.655 0.761269V70.0893H100.575V0.761269H114.943H114.655ZM136.494 29.0702V40.0471H110.345V29.0702H136.207H136.494ZM140.517 0.761269V12.3159H110.345V0.761269H140.517ZM178.161 51.8907C178.161 50.7352 178.161 49.5797 177.586 48.7131C177.586 47.5577 177.012 46.6911 176.149 45.8245L173.276 42.9358L167.816 40.6249L160.345 37.1585L154.023 32.8255C152.021 31.2537 150.359 29.2878 149.138 27.0481C148.066 24.5949 147.574 21.9252 147.701 19.2487C147.701 16.3601 147.989 13.4714 149.138 11.4493C150.166 9.00506 151.739 6.83084 153.736 5.09427C155.747 3.64994 158.046 2.20559 160.632 1.33899C167.362 -0.855543 174.677 -0.337717 181.034 2.78333C184.483 4.51653 186.782 7.11632 188.793 10.2939C190.517 13.1825 191.667 17.2267 191.667 21.2708H177.299C177.424 19.5169 177.229 17.7548 176.724 16.0712C176.149 14.6269 175.287 13.1825 173.851 12.6048C172.701 11.7382 170.977 11.1605 169.253 11.1605C167.529 11.1605 166.092 11.7382 164.943 12.3159C163.793 12.8937 162.931 14.0491 162.069 15.2046L161.494 19.2487C161.494 20.4042 161.782 21.5597 162.356 22.4263L164.655 24.7372C167.235 26.2818 169.924 27.6335 172.701 28.7813L181.034 32.8255C183.199 34.2594 185.136 36.0121 186.782 38.0251C188.793 39.7583 189.655 41.7803 190.805 43.8024C192.605 48.9619 192.503 54.5998 190.517 59.6901C189.368 62.001 187.931 64.0231 186.207 65.7563C184.115 67.5878 181.669 68.9647 179.023 69.8004C173.276 71.2447 176.149 75 170.402 75C164.655 75 166.667 70.667 161.207 69.8004C158.333 68.9338 155.46 67.4895 153.448 65.7563C151.19 63.7856 149.419 61.313 148.276 58.5346C147.126 55.6459 146.552 52.1795 146.552 48.4243H160.632C160.632 50.4463 160.632 52.1795 161.207 53.6239C161.494 55.0682 162.069 56.5125 162.931 57.3791C163.793 57.9569 164.943 58.8235 166.092 59.1123C167.529 59.6901 168.966 59.6901 170.402 59.6901C172.414 59.6901 173.851 59.6901 175 58.8235C176.149 57.9569 176.724 57.0903 177.299 55.9348C177.874 54.7793 178.161 53.335 178.161 51.8907V51.8907ZM239.943 28.7813V40.336H211.207V28.7813H239.943ZM215.23 0.761269V70.0893H201.437V0.761269H215.23ZM250 0.761269V70.0893H236.207V0.761269H250Z"
            fill="#0A140C"
          />
        </svg>
        <span class="font-light block pb-[1px]">docs</span>
      </a>
      <p class="text(sm gray-700)">The next-gen web framework.</p>
    </>
  );
}

function Main(props: { path: string; page: Page }) {
  return (
    <div class="flex-1">
      <MobileSidebar path={props.path} />
      <div class="mx-auto max-w-screen-lg px-4 flex gap-6">
        <DesktopSidebar path={props.path} />
        <Content page={props.page} />
      </div>
    </div>
  );
}

function MobileSidebar(props: { path: string }) {
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
            <Title />
          </div>
          <nav class="pt-2 pb-16 px-4 overflow-x-auto">
            <DocsSidebar path={props.path} />
          </nav>
        </div>
      </div>
    </>
  );
}

function DesktopSidebar(props: { path: string }) {
  return (
    <nav class="w-[16rem] flex-shrink-0 hidden md:block py-8 pr-4 border(r-2 gray-100)">
      <DocsSidebar path={props.path} />
    </nav>
  );
}

function Content(props: { page: Page }) {
  const html = gfm.render(props.page.markdown);
  return (
    <main class="py-8 overflow-hidden">
      <h1 class="text(4xl gray-900) tracking-tight font-extrabold mt-6">
        {props.page.title}
      </h1>
      <div
        class="mt-6 markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <ForwardBackButtons slug={props.page.slug} />
    </main>
  );
}

const button = "p-2 bg-gray-100 w-full border(1 gray-200) grid";

function ForwardBackButtons(props: { slug: string }) {
  const currentIndex = SLUGS.findIndex((slug) => slug === props.slug);
  const previousSlug = SLUGS[currentIndex - 1];
  const nextSlug = SLUGS[currentIndex + 1];
  const previous = TABLE_OF_CONTENTS[previousSlug];
  const next = TABLE_OF_CONTENTS[nextSlug];

  const upper = "text(sm gray-600)";
  const category = "font-normal";
  const lower = "text-gray-900 font-medium";

  return (
    <div class="mt-8 flex flex(col md:row) gap-4">
      {previous && (
        <a href={previous.href} class={`${button} text-left`}>
          <span class={upper}>{"←"} Previous</span>
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
        <a href={next.href} class={`${button} text-right`}>
          <span class={upper}>Next {"→"}</span>
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
