/** @jsx h */
/** @jsxFrag Fragment */
import { ComponentChildren, Fragment, h } from "preact";
import { asset, Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { tw } from "@twind";
import Counter from "../islands/Counter.tsx";
import LemonDrop from "../islands/LemonDrop.tsx";
import Footer from "../components/Footer.tsx";
import VERSIONS from "../../versions.json" assert { type: "json" };
import * as FeatureIcons from "../components/FeatureIcons.tsx";
import CopyArea from "../islands/CopyArea.tsx";
import * as Icons from "../components/Icons.tsx";
import projects from "../data/showcase.json" assert { type: "json" };

interface Project {
  image: string;
  title: string;
  link: string;
  github?: string;
}

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
      <div class={tw`flex flex-col min-h-screen`}>
        <Hero />
        <div class={tw`flex-1`}>
          <Intro />
          <GettingStarted origin={origin} />
          <Example />
          <Showcase items={projects} />
        </div>
        <Footer />
      </div>
    </>
  );
}

function Hero() {
  const container =
    tw`w-full flex justify-center items-center flex-col bg-green-300`;
  const nav = tw`flex justify-end items-center bg-green-300`;
  const a =
    tw`border(1 black) inline-flex items-center h-10 px-4 m-4 text-black bg-transparent rounded hover:bg-white`;

  return (
    <Fragment>
      <div class={nav}>
        <a href="/docs" class={a}>
          Documentation
        </a>
      </div>
      <section class={container}>
        <LemonDrop />
      </section>
    </Fragment>
  );
}

function Features() {
  const wrapper = tw`flex md:flex-row flex-col md:gap-20 gap-5 md:pt-10`;
  const item = tw`md:w-56 flex md:flex-col items-center gap-5`;
  const desc = tw`flex-1 md:text-center`;

  return (
    <>
      <div class={wrapper}>
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
      </div>

      <div class={wrapper}>
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
    </>
  );
}

function Intro() {
  const title =
    tw`py-2 text(5xl sm:5xl lg:5xl gray-900) sm:tracking-tight font-extrabold`;

  return (
    <section
      class={tw`max-w-screen-md mx-auto my-16 px(4 sm:6 md:8) space-y-4`}
    >
      <div class={tw`md:flex items-center`}>
        <div class={tw`flex-1 text-center md:text-left`}>
          <h2 class={title}>
            The <span class={tw`text-green-500`}>next-gen</span> web framework.
          </h2>

          <p class={tw`text-gray-600`}>
            Built for speed, reliability, and simplicity.
          </p>
        </div>

        <picture>
          <img
            src="/illustration/lemon-squash.svg"
            class={tw`w-80 mx-auto`}
            width={800}
            height={678}
            alt="deno is drinking fresh lemon squash"
          />
        </picture>
      </div>

      <Features />

      <p class={tw`text-gray-600`}>
        Fresh embraces the tried and true design of server side rendering and
        progressive enhancement on the client side.
      </p>
    </section>
  );
}

function GettingStarted(props: { origin: string }) {
  return (
    <section
      class={tw`max-w-screen-md mx-auto my-16 px(4 sm:6 md:8) space-y-4`}
    >
      <h2 id="getting-started" class={tw`text(3xl gray-600) font-bold`}>
        <a href="#getting-started" class={tw`hover:underline`}>
          Getting Started
        </a>
      </h2>
      <div class={tw`text-gray-600 flex gap-1 mb-4 bg-gray-100 p-2 rounded`}>
        <div class={tw`text-gray-400`}>
          <Icons.Info />
        </div>
        <p>
          <a href="https://deno.land" class={tw`text-blue-600 hover:underline`}>
            Deno CLI
          </a>{" "}
          version 1.23.0 or higher is required. Please{" "}
          <a
            href="https://deno.land/manual/getting_started/installation"
            class={tw`text-blue-600 hover:underline`}
          >
            Install
          </a>{" "}
          or{" "}
          <a
            href="https://deno.land/manual/getting_started/installation#updating"
            class={tw`text-blue-600 hover:underline`}
          >
            update
          </a>.
        </p>
      </div>
      <p class={tw`text-gray-600`}>
        To bootstrap a new project:
      </p>

      <CopyArea>{`deno run -A -r ${props.origin} my-project`}</CopyArea>

      <p class={tw`text-gray-600`}>
        Enter the newly created project directory and run the following command
        to start the development server:
      </p>

      <CopyArea>{`deno task start`}</CopyArea>

      <p class={tw`text-gray-600`}>
        You can now open{" "}
        <a
          href="http://localhost:8000"
          class={tw`text-blue-600 hover:underline`}
        >
          http://localhost:8000
        </a>{" "}
        in your browser to view the page.
      </p>
      <p class={tw`text-gray-600`}>
        A more in-depth{" "}
        <a
          href="/docs/getting-started"
          class={tw`text-blue-600 hover:underline`}
        >
          Getting Started Guide
        </a>{" "}
        is available in{" "}
        <a href="/docs" class={tw`text-blue-600 hover:underline`}>the docs</a>.
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
    <section
      class={tw`max-w-screen-md mx-auto my-16 px(4 sm:6 md:8) space-y-4`}
    >
      <h2 id="example" class={tw`text(3xl gray-600) font-bold`}>
        <a href="#example" class={tw`hover:underline`}>
          Example
        </a>
      </h2>
      <p class={tw`text-gray-600`}>
        This text is being server side rendered on the fly. It was rendered at
        {" "}
        {timeFmt.format(new Date())}.
      </p>
      <p class={tw`text-gray-600`}>
        The counter below was rendered on the server with a starting value of 3,
        and was then hydrated on the client to provide interactivity. Try out
        the buttons!
      </p>
      <Counter start={3} />
      <p class={tw`text-gray-600`}>
        Only the JS required to render that counter is sent to the client.
      </p>
    </section>
  );
}

function Showcase({ items }: { items: Project[] }) {
  return (
    <section
      class={tw`max-w-screen-md mx-auto my-16 px(4 sm:6 md:8) space-y-4`}
    >
      <h2 id="showcase" class={tw`text(3xl gray-600) font-bold`}>
        <a href="#showcase" class={tw`hover:underline`}>
          Showcase
        </a>
      </h2>
      <div
        class={tw`pt-8 gap-20 md:gap-0 flex-col md:flex-row flex justify-between items-center`}
      >
        {items.map((project) => (
          <div class={tw`w-56 group`}>
            <a href={project.link} tabIndex={-1}>
              <img
                loading="lazy"
                src={project.image}
                alt={project.title}
                class={tw`object-contain shadow-lg group-hover:shadow-xl rounded-lg w-56`}
              />
            </a>
            <div class={tw`mt-4 flex items-center`}>
              <div class={tw`text-lg flex-1 group-hover:text-underline`}>
                <a href={project.link}>{project.title}</a>
              </div>
              {project.github && (
                <a
                  href={`https://github.com/${project.github}`}
                  class={tw`ml-2 text-gray-500 hover:text-gray-700`}
                >
                  <span class={tw`sr-only`}>GitHub</span>
                  <Icons.GitHub class="inline float-right" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
