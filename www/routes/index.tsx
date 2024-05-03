import { asset, Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Footer from "$fresh/www/components/Footer.tsx";
import VERSIONS from "$fresh/versions.json" with { type: "json" };
import * as FeatureIcons from "$fresh/www/components/FeatureIcons.tsx";
import * as Icons from "$fresh/www/components/Icons.tsx";
import Projects from "$fresh/www/components/Projects.tsx";
import projects from "$fresh/www/data/showcase.json" with { type: "json" };
import Header from "$fresh/www/components/Header.tsx";
import { Hero } from "$fresh/www/components/homepage/Hero.tsx";
import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { IntroSection } from "$fresh/www/components/homepage/Intro.tsx";
import { RenderingSection } from "$fresh/www/components/homepage/RenderingSection.tsx";
import { IslandsSection } from "$fresh/www/components/homepage/IslandsSection.tsx";
import { RoutingSection } from "$fresh/www/components/homepage/RoutingSection.tsx";
import { PartialsSection } from "$fresh/www/components/homepage/PartialsSection.tsx";
import { SideBySide } from "$fresh/www/components/SideBySide.tsx";
import { SectionHeading } from "$fresh/www/components/homepage/SectionHeading.tsx";

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
        <div class="bg-transparent flex flex-col ">
          <HelloBar />
          <Header title="" active="/" />

          <Hero />
        </div>
        <div class="flex flex-col">
          <IntroSection origin={origin} />
          <Simple />
          <RenderingSection />
          <IslandsSection />
          <RoutingSection />
          <PartialsSection />
          <ProdReady />
          <Showcase />
          <StartJourney />
        </div>
        <Footer />
      </div>
    </>
  );
}

function Simple() {
  return (
    <div>
      <PageSection>
        <div class="text-center max-w-max mx-auto flex flex-col gap-4">
          <h2 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl sm:tracking-tight sm:leading-[1.1]! font-extrabold text-balance">
            The framework so simple, you know it already.
          </h2>
          <p class="text-xl text-balance max-w-prose mx-auto">
            Fresh is designed to be approachable and easy to use, by building on
            the best well-known tools and conventions.
          </p>
        </div>
      </PageSection>
    </div>
  );
}

function ProdReady() {
  return (
    <div>
      <PageSection>
        <div class="text-center max-w-max mx-auto flex flex-col gap-4">
          <h2 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl sm:tracking-tight sm:leading-[1.1]! font-extrabold text-balance">
            Powering production applications at the edge
          </h2>
          <p class="text-xl text-balance max-w-prose mx-auto">
            Fresh is the secret sauce behind production-grade, enterprise-ready
            software like{" "}
            <a href="https://deco.cx" class="underline">Deco.cx</a>, Brazil's
            top eCommerce platform
          </p>
        </div>
        <img
          src="/showcase/deco.webp"
          alt="Deco CX"
          class="mx-auto mt-8"
          loading="lazy"
        />
        <SideBySide mdColSplit="3/2" lgColSplit="3/2">
          <a href="https://deno.com/blog/deco-cx-subhosting-serve-their-clients-storefronts-fast">
            {/* TODO: fill in more on Deco here */}
          </a>
        </SideBySide>
      </PageSection>
    </div>
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

function Showcase() {
  return (
    <PageSection>
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
    </PageSection>
  );
}

function StartJourney() {
  return (
    <PageSection>
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
    </PageSection>
  );
}
