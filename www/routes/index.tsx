import { asset, Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Counter from "../islands/Counter.tsx";
import LemonDrop from "../islands/LemonDrop.tsx";
import Footer from "../components/Footer.tsx";
import VERSIONS from "../../versions.json" with { type: "json" };
import * as FeatureIcons from "../components/FeatureIcons.tsx";
import CopyArea from "../islands/CopyArea.tsx";
import * as Icons from "../components/Icons.tsx";
import Projects from "../components/Projects.tsx";
import projects from "../data/showcase.json" with { type: "json" };
import Header from "../components/Header.tsx";

function isOpenGraphUA(header: string | null): boolean {
  if (!header) {
    return false;
  }
  return header.startsWith("Twitterbot") || header.startsWith("Slackbot");
}

export const handler: Handlers = {
  GET(req, ctx) {
    const accept = req.headers.get("accept");
    const userAgent = req.headers.get("user-agent");
    if (!accept?.includes("text/html") && !isOpenGraphUA(userAgent)) {
      const path = `https://deno.land/x/fresh@${VERSIONS[0]}/init.ts`;
      return new Response(`Redirecting to ${path}`, {
        headers: { "Location": path },
        status: 307,
      });
    }
    return ctx.render();
  },
};

const TITLE = "Fresh - The next-gen web framework.";
const DESCRIPTION =
  "Just in time edge rendering, island based interactivity, and no configuration TypeScript support using Deno.";

export default function MainPage(props: PageProps) {
  const ogImageUrl = new URL(asset("/home-og.png"), props.url).href;
  const origin = `${props.url.protocol}//${props.url.host}`;

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={props.url.href} />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="view-transition" content="same-origin" />
      </Head>

      <div class="flex flex-col min-h-screen">
        <div class="bg-green-300 flex flex-col">
          <HelloBar />
          <Header title="" active="/" />

          <Hero />
        </div>
        <div class="flex-1">
          <Intro origin={origin} />
          <Example />
          <Showcase />
          <StartJourney />
        </div>
        <Footer />
      </div>
    </>
  );
}

function HelloBar() {
  return (
    <a
      class="bg-green-400 text-black border-b border-green-500 p-3 text-center group"
      href="https://deno.com/blog/fresh-1.6"
    >
      <b>Fresh v1.6</b> has been released with <b>Tailwind CSS</b>,{" "}
      <b>better Plugin API</b> and more{" "}
      <span class="group-hover:underline">→</span>
    </a>
  );
}

function Hero() {
  return (
    <div
      class="w-full flex justify-center items-center flex-col bg-green-300"
      aria-hidden="true"
    >
      <LemonDrop />
    </div>
  );
}

function Features() {
  const item = "flex items-center gap-5";
  const desc = "flex-1";

  return (
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-14">
      <div class={item}>
        <FeatureIcons.Globe />
        <div class={desc}>
          <b>Just-in-time rendering</b> on the edge.
        </div>
      </div>

      <div class={item}>
        <FeatureIcons.Island />
        <div class={desc}>
          <b>Island based client hydration</b> for maximum interactivity.
        </div>
      </div>

      <div class={item}>
        <FeatureIcons.LightWeight />
        <div class={desc}>
          <b>Zero runtime overhead</b>: no JS is shipped to the client by
          default.
        </div>
      </div>

      <div class={item}>
        <FeatureIcons.NoBuild />
        <div class={desc}>
          <b>No build step</b>.
        </div>
      </div>

      <div class={item}>
        <FeatureIcons.Garbage />
        <div class={desc}>
          <b>No configuration</b> necessary.
        </div>
      </div>

      <div class={item}>
        <FeatureIcons.TypeScript />
        <div class={desc}>
          <b>TypeScript support</b> out of the box.
        </div>
      </div>
    </div>
  );
}

function Intro(props: { origin: string }) {
  return (
    <section class="max-w-screen-xl mx-auto my-8 sm:my-16 px-4 sm:px-6 md:px-8 space-y-8 sm:space-y-16 lg:mb-32">
      <div class="max-w-screen-xl mx-auto sm:my-8 md:my-16 sm:space-y-12 w-full">
        <div class="md:flex items-center">
          <div class="flex-1 text-center md:text-left">
            <h2 class="py-2 text-5xl sm:text-5xl lg:text-6xl text-gray-900 sm:tracking-tight sm:leading-[1.1]! font-extrabold lg:max-w-lg mx-auto sm:mx-0">
              The <span class="text-green-600">next-gen</span> web framework.
            </h2>

            <p class="mt-2 text-gray-600 text-xl">
              Built for speed, reliability, and simplicity.
            </p>
            <div class="mt-8 flex flex-col justify-center md:justify-start sm:flex-row gap-4">
              <div>
                <a
                  href="/docs/getting-started"
                  class="inline-flex w-auto shrink-0 px-3 py-2 bg-white rounded border-gray-500 border-2 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Get started
                </a>
              </div>
              <div class="flex justify-center">
                <CopyArea code={`deno run -A -r ${props.origin}`} />
              </div>
            </div>
          </div>

          <picture class="block mt-8 md:mt-0 mx-auto w-60 md:w-96 md:mr-16 xl:mr-32">
            <img
              src="/illustration/lemon-squash.svg"
              width={800}
              height={678}
              alt="Deno is drinking Fresh lemon squash"
            />
          </picture>
        </div>
      </div>
      <p class="text-gray-600 text-xl">
        Fresh embraces the tried and true design of server side rendering and
        progressive enhancement on the client side.
      </p>
      <Features />
    </section>
  );
}

function Example() {
  return (
    <section class="max-w-screen-xl mx-auto my-8 sm:my-16 md:my-24 px-4 sm:px-6 md:px-8 space-y-16">
      <div class="flex gap-4 md:gap-16 flex-col md:flex-row justify-between items-center">
        <div class="md:basis-1/2">
          <h2 id="example" class="text-4xl text-gray-600 font-bold mb-4">
            <a href="#example" class="hover:underline">
              Interactive islands
            </a>
          </h2>
          <p class="text-gray-600 mb-4">
            Fresh optimizes the page by only shipping JavaScript for areas that
            need it. The rest is completely static HTML rendered by the server.
            This means the browser needs to load less code and can display pages
            more quickly.
          </p>
        </div>
        <div class="md:basis-1/2">
          <Counter start={3} />
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section class="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 space-y-4">
      <h2 id="showcase" class="text-4xl text-gray-600 font-bold mb-4">
        <a href="#showcase" class="hover:underline">
          Showcase
        </a>
      </h2>
      <p class="text-gray-600">
        Below is a selection of projects that have been built with Fresh.
      </p>
      <Projects items={projects.slice(0, 3)} class="gap-8" />
      <div class="flex gap-2 items-center justify-center sm:justify-end text-blue-600">
        <Icons.ArrowRight />
        <a href="./showcase" class="hover:underline focus:underline">
          View more
        </a>
      </div>
    </section>
  );
}

function StartJourney() {
  return (
    <section class="max-w-screen-xl mx-auto py-16 px-4 sm:px-6 md:px-8 space-y-4 md:mb-16">
      <h2 class="text-4xl text-gray-600 md:text-5xl font mb-4 mt-0">
        Start your Fresh journey
      </h2>
      <div class="flex flex-col md:flex-row justify-start items-center gap-4">
        <p class="text-xl text-gray-600">
          Jump right in and build your website with Fresh. Learn everything you
          need to know in seconds.
        </p>
        <a
          href="/docs/getting-started"
          class="inline-block px-3 py-2 bg-white rounded border-gray-500 border-2 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Get started
        </a>
      </div>
    </section>
  );
}
