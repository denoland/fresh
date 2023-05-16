import { asset, Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Counter from "../islands/Counter.tsx";
import LemonDrop from "../islands/LemonDrop.tsx";
import Footer from "../components/Footer.tsx";
import VERSIONS from "../../versions.json" assert { type: "json" };
import * as FeatureIcons from "../components/FeatureIcons.tsx";
import CopyArea from "../islands/CopyArea.tsx";
import * as Icons from "../components/Icons.tsx";
import Projects from "../components/Projects.tsx";
import projects from "../data/showcase.json" assert { type: "json" };
import Header from "../components/Header.tsx";

export const handler: Handlers = {
  GET(req, ctx) {
    const accept = req.headers.get("accept");
    if (accept && !accept.includes("text/html")) {
      const path = `https://deno.land/x/fresh@${VERSIONS[0]}/init.ts`;
      return new Response(`Redirecting to ${path}`, {
        headers: { "Location": path },
        status: 307,
      });
    }
    return ctx.render();
  },
};

const TITLE = "fresh - The next-gen web framework.";
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
      </Head>

      <div class="flex flex-col min-h-screen">
        <div class="bg-green-300 flex flex-col">
          <HelloBar />
          <Header title="" active="/" />

          <Hero />
        </div>
        <div class="flex-1">
          <Intro />
          <GettingStarted origin={origin} />
          <Example />
          <Showcase />
        </div>
        <Footer />
      </div>
    </>
  );
}

function HelloBar() {
  return (
    <a
      class="bg-green-400 text-black border(b green-500) p-3 text-center group"
      href="https://deno.com/blog/fresh-1.1"
    >
      <b>Fresh v1.1</b> has been released with support for <b>automatic JSX</b>,
      {" "}
      <b>plugins</b>, <b>DevTools support</b>, and more!{"  "}
      <span class="group-hover:underline">→</span>
    </a>
  );
}

function Hero() {
  return (
    <>
      <section class="w-full flex justify-center items-center flex-col bg-green-300">
        <LemonDrop />
      </section>
    </>
  );
}

function Features() {
  const item = "flex md:flex-col items-center gap-5";
  const desc = "flex-1 md:text-center";

  return (
    <div class="grid md:grid-cols-3 gap-6 md:gap-14">
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
        <FeatureIcons.Gabage />
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

function Intro() {
  return (
    <section class="max-w-screen-md mx-auto my-16 px(4 sm:6 md:8) space-y-12">
      <div class="md:flex items-center">
        <div class="flex-1 text-center md:text-left">
          <h2 class="py-2 text(5xl sm:5xl lg:5xl gray-900) sm:tracking-tight sm:leading-[1.1]! font-extrabold">
            The <span class="text-green-600">next-gen</span> web framework.
          </h2>

          <p class="mt-4 text-gray-600">
            Built for speed, reliability, and simplicity.
          </p>
        </div>

        <picture class="block mt-4 md:mt-0">
          <img
            src="/illustration/lemon-squash.svg"
            class="w-80 mx-auto"
            width={800}
            height={678}
            alt="deno is drinking fresh lemon squash"
          />
        </picture>
      </div>

      <Features />

      <p class="text-gray-600">
        Fresh embraces the tried and true design of server side rendering and
        progressive enhancement on the client side.
      </p>
    </section>
  );
}

function GettingStarted(props: { origin: string }) {
  return (
    <section class="max-w-screen-md mx-auto my-16 px(4 sm:6 md:8) space-y-4">
      <h2 id="getting-started" class="text(3xl gray-600) font-bold">
        <a href="#getting-started" class="hover:underline">
          Getting Started
        </a>
      </h2>
      <div class="text-gray-600 flex gap-1 mb-4 bg-gray-100 p-2 rounded">
        <div class="text-gray-400">
          <Icons.Info />
        </div>
        <p>
          <a href="https://deno.land" class="text-blue-600 hover:underline">
            Deno CLI
          </a>{" "}
          version 1.25.0 or higher is required.{" "}
          <a
            href="https://deno.land/manual/getting_started/installation"
            class="text-blue-600 hover:underline"
          >
            Install
          </a>{" "}
          or{" "}
          <a
            href="https://deno.land/manual/getting_started/installation#updating"
            class="text-blue-600 hover:underline"
          >
            update
          </a>.
        </p>
      </div>
      <p class="text-gray-600">
        To bootstrap a new project:
      </p>

      <CopyArea>
        {`deno run -A -r ${props.origin} my-project`}
      </CopyArea>

      <p class="text-gray-600">
        Enter the newly created project directory and run the following command
        to start the development server:
      </p>

      <CopyArea>{`deno task start`}</CopyArea>

      <p class="text-gray-600">
        You can now open{" "}
        <a
          href="http://localhost:8000"
          class="text-blue-600 hover:underline"
        >
          http://localhost:8000
        </a>{" "}
        in your browser to view the page.
      </p>
      <p class="text-gray-600">
        A more in-depth{" "}
        <a
          href="/docs/getting-started"
          class="text-blue-600 hover:underline"
        >
          <i>Getting Started</i>
        </a>{" "}
        guide is available in{" "}
        <a href="/docs" class="text-blue-600 hover:underline">the docs</a>.
      </p>
    </section>
  );
}

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeStyle: "long",
  hour12: false,
});

function Example() {
  return (
    <section class="max-w-screen-md mx-auto my-16 px(4 sm:6 md:8) space-y-4">
      <h2 id="example" class="text(3xl gray-600) font-bold">
        <a href="#example" class="hover:underline">
          Example
        </a>
      </h2>
      <p class="text-gray-600">
        This text is being server side rendered on the fly. It was rendered at
        {" "}
        {timeFmt.format(new Date())}.
      </p>
      <p class="text-gray-600">
        The counter below was rendered on the server with a starting value of 3,
        and was then hydrated on the client to provide interactivity. Try out
        the buttons!
      </p>
      <Counter start={3} />
      <p class="text-gray-600">
        Only the JS required to render that counter is sent to the client.
      </p>
    </section>
  );
}

function Showcase() {
  return (
    <section class="max-w-screen-md mx-auto my-16 px(4 sm:6 md:8) space-y-4">
      <h2 id="showcase" class="text(3xl gray-600) font-bold">
        <a href="#showcase" class="hover:underline">
          Showcase
        </a>
      </h2>
      <p class="text-gray-600">
        Below is a selection of projects that have been built with Fresh.
      </p>
      <Projects items={projects.slice(0, 3)} class="gap-8" />
      <div class="flex gap-2 items-center justify-end text-blue-600">
        <Icons.ArrowRight />
        <a href="./showcase" class="hover:underline focus:underline">
          View more
        </a>
      </div>
    </section>
  );
}
