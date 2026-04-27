import { asset } from "fresh/runtime";
import { page } from "fresh";
import VERSIONS from "../../versions.json" with { type: "json" };
import Footer from "../components/Footer.tsx";
import Header from "../components/Header.tsx";
import { CTA } from "../components/homepage/CTA.tsx";
import { Hero } from "../components/homepage/Hero.tsx";
import { IslandsSection } from "../components/homepage/IslandsSection.tsx";
import { PartialsSection } from "../components/homepage/PartialsSection.tsx";
import { RenderingSection } from "../components/homepage/RenderingSection.tsx";
import { FormsSection } from "../components/homepage/FormsSection.tsx";
import { SocialProof } from "../components/homepage/SocialProof.tsx";
import { MoreFeatures } from "../components/homepage/MoreFeatures.tsx";
import { DenoSection } from "../components/homepage/DenoSection.tsx";
import { define } from "../utils/state.ts";

export const handler = define.handlers({
  GET(ctx) {
    const { req } = ctx;
    const accept = req.headers.get("accept");
    const userAgent = req.headers.get("user-agent");
    if (userAgent?.includes("Deno/") && !accept?.includes("text/html")) {
      const path = `https://deno.land/x/fresh@${VERSIONS[0]}/init.ts`;
      return new Response(`Redirecting to ${path}`, {
        headers: { "Location": path },
        status: 307,
      });
    }

    ctx.state.title =
      "Fresh - The simple, approachable, productive web framework.";
    ctx.state.description =
      "Fresh features just-in-time edge rendering, island based interactivity, and zero-configuration TypeScript support. Fast to write; fast to run.";
    ctx.state.ogImage = new URL(asset("/og-image.webp"), ctx.url).href;

    return page();
  },
  async POST(ctx) {
    const headers = new Headers();
    const form = await ctx.req.formData();
    const treat = form.get("treat");
    headers.set("location", `/thanks?vote=${treat}`);
    return new Response(null, {
      status: 303,
      headers,
    });
  },
});

export default define.page<typeof handler>(function MainPage() {
  return (
    <div class="flex flex-col min-h-screen bg-white">
      <div class="bg-transparent flex flex-col relative z-10">
        <HelloBar />
        <Header title="" active="/" />
      </div>
      <div class="flex flex-col -mt-20 relative">
        <Hero />
        <h2 class="text-3xl sm:text-4xl md:text-5xl text-gray-600 font-extrabold text-center mt-8 md:mt-12 lg:mt-16 px-4 italic">
          Take a tour of Fresh
        </h2>
        <RenderingSection />
        <IslandsSection />
        <FormsSection />
        <PartialsSection />
        <MoreFeatures />
        <SocialProof />
        <DenoSection />
        <CTA />
      </div>
      <Footer class="!mt-0" />
    </div>
  );
});

function HelloBar() {
  return (
    <a
      class="bg-gradient-to-r from-blue-200 to-yellow-200 via-green-300 text-black border-b border-green-400 px-4 py-3 text-center group flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3"
      href="https://deno.com/blog/fresh-2.3"
    >
      <span class="font-bold">Fresh 2.3 is here!</span>
      <span class="hidden sm:inline">—</span>
      <span class="text-sm sm:text-base">
        WebSockets, View Transitions, Temporal API, and more{" "}
        <span class="group-hover:underline">→</span>
      </span>
    </a>
  );
}
