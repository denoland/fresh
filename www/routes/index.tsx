import { asset, Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import VERSIONS from "$fresh/versions.json" with { type: "json" };
import Footer from "$fresh/www/components/Footer.tsx";
import Header from "$fresh/www/components/Header.tsx";
import { CTA } from "$fresh/www/components/homepage/CTA.tsx";
import { Hero } from "$fresh/www/components/homepage/Hero.tsx";
import { IslandsSection } from "$fresh/www/components/homepage/IslandsSection.tsx";
import { PartialsSection } from "$fresh/www/components/homepage/PartialsSection.tsx";
import { RenderingSection } from "$fresh/www/components/homepage/RenderingSection.tsx";
import { FormsSection } from "../components/homepage/FormsSection.tsx";
import { Simple } from "$fresh/www/components/homepage/Simple.tsx";
import { SocialProof } from "$fresh/www/components/homepage/SocialProof.tsx";
import { DenoSection } from "$fresh/www/components/homepage/DenoSection.tsx";

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

const TITLE = "Fresh - The simple, approachable, productive web framework.";
const DESCRIPTION =
  "Fresh features just-in-time edge rendering, island based interactivity, and zero-configuration TypeScript support. Fast to write; fast to run.";

export default function MainPage(props: PageProps) {
  const ogImageUrl = new URL(asset("/og-image.webp"), props.url).href;
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
        <link rel="stylesheet" href="/prism.css" />
      </Head>

      <div class="flex flex-col min-h-screen">
        <div class="bg-transparent flex flex-col relative z-10">
          <HelloBar />
          <Header title="" active="/" />
        </div>
        <div class="flex flex-col overflow-hidden -mt-20 relative">
          <Hero origin={origin} />
          <Simple />
          <RenderingSection />
          <IslandsSection />
          <FormsSection />
          <PartialsSection />
          <SocialProof />
          <DenoSection />
          <CTA />
        </div>
        <Footer class="!mt-0" />
      </div>
    </>
  );
}

function HelloBar() {
  return (
    <a
      class="bg-gradient-to-r from-blue-200 to-yellow-200 via-green-300 text-black border-b border-green-400 p-4 text-center group"
      href="https://deno.com/blog/fresh-1.6"
    >
      <b>Fresh v1.6</b> has been released with <b>Tailwind CSS</b>,{" "}
      <b>better Plugin API</b> and more{" "}
      <span class="group-hover:underline">→</span>
    </a>
  );
}
