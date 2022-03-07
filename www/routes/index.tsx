/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, Head, tw } from "../client_deps.ts";
import Counter from "../islands/Counter.tsx";

export default function MainPage() {
  return (
    <>
      <Head>
        <title>fresh - The next-gen web framework.</title>
        <meta
          name="description"
          content="The next-gen web framework. Just in time edge rendering, island based interactivity, and no configuration TypeScript support."
        />
      </Head>
      <Hero />
      <NavigationBar active="/" />
      <Intro />
      <GettingStarted />
      <Example />
    </>
  );
}

function Hero() {
  const container = tw`w-full h-64 flex justify-center items-center flex-col`;
  const title = tw
    `text(4xl sm:5xl lg:6xl gray-900 center) sm:tracking-tight font-extrabold`;
  const subtitle = tw`mt-4 text(2xl gray-600)`;

  return (
    <section class={container}>
      <h1 class={title}>
        fresh
      </h1>
      <p class={subtitle}>
        The next-gen web framework.
      </p>
    </section>
  );
}

function NavigationBar(props: { active: string }) {
  const items = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "Docs",
      href: "/docs",
    },
  ];

  return (
    <nav class={tw`bg(gray-50) py-2 border(t-2 b-2 gray-100)`}>
      <ul class={tw`flex justify-center gap-8 mx-4`}>
        {items.map((item) => (
          <li>
            <a
              href={item.href}
              class={tw`text-gray-600 hover:underline ${
                props.active == item.href ? "font-bold" : ""
              }`}
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Intro() {
  return (
    <section class={tw`max-w-screen-sm mx-auto my-16 px(4 sm:6 md:8)`}>
      <p class={tw`my-4 text-gray-600`}>
        Fresh is a next generation web framework, built for speed, reliability,
        and simplicity. Some stand out features:
      </p>
      <ul class={tw`my-4 text-gray-600 list-disc list-inside pl-4`}>
        <li>
          <b>Just-in-time rendering</b> on the edge.
        </li>
        <li>
          <b>Island based client hydration</b> for maximum interactivity.
        </li>
        <li>
          <b>Zero runtime overhead</b>: no JS is shipped to the client by
          default.
        </li>
        <li>
          <b>No build step</b>.
        </li>
        <li>
          <b>No configuration</b> necessary.
        </li>
        <li>
          <b>TypeScript support</b> out of the box.
        </li>
      </ul>
      <p class={tw`my-4 text-gray-600`}>
        Fresh embraces the tried and true design of server side rendering and
        processing.
      </p>
    </section>
  );
}

function GettingStarted() {
  return (
    <section class={tw`max-w-screen-sm mx-auto my-16 px(4 sm:6 md:8)`}>
      <h2 id="getting-started" class={tw`text(xl gray-600) font-bold`}>
        <a href="#getting-started" class={tw`hover:underline`}>
          Getting started
        </a>
      </h2>
      <p class={tw`my-4 text-gray-600`}>
        To get started, make sure you have the{" "}
        <a href="https://deno.land" class={tw`text-blue-600 hover:underline`}>
          Deno CLI
        </a>{" "}
        installed.
      </p>
      <p class={tw`my-4 text-gray-600`}>
        Then, run the following command to install the `fresh` CLI:
      </p>
      <pre class={tw`overflow-x-auto py-2 px-4 bg(gray-100)`}>
        deno install -A -f --no-check -n fresh
        https://raw.githubusercontent.com/lucacasonato/fresh/main/cli.ts
      </pre>
      <p class={tw`my-4 text-gray-600`}>
        Once installed, you can use the `fresh` command to bootstrap a new
        project:
      </p>
      <pre class={tw`overflow-x-auto py-2 px-4 bg(gray-100)`}>
        fresh init my-app
      </pre>
      <p class={tw`my-4 text-gray-600`}>
        Enter the newly created project directory and run the following command
        to start the development server:
      </p>
      <pre class={tw`overflow-x-auto py-2 px-4 bg(gray-100)`}>
        deno run -A --watch main.ts
      </pre>
      <p class={tw`my-4 text-gray-600`}>
        You can now open{" "}
        <a
          href="http://localhost:8000"
          class={tw`text-blue-600 hover:underline`}
        >
          http://localhost:8000
        </a>{" "}
        in your browser to view the page.
      </p>
      <p class={tw`my-4 text-gray-600`}>
        A more in-depth getting started guide is available in{" "}
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
      class={tw`max-w-screen-sm mx-auto my-16 px(4 sm:6 md:8)`}
    >
      <h2 id="example" class={tw`text(xl gray-600) font-bold`}>
        <a href="#example" class={tw`hover:underline`}>
          Example
        </a>
      </h2>
      <p class={tw`my-4 text-gray-600`}>
        This text is being server side rendered on the fly. It was rendered at
        {" "}
        {timeFmt.format(new Date())}.
      </p>
      <p class={tw`my-4 text-gray-600`}>
        The counter below was rendered on the server with a starting value of 3,
        and was then hydrated on the client to provide interactivity. Try out
        the buttons!
      </p>
      <Counter start={3} />
      <p class={tw`my-4 text-gray-600`}>
        Only the JS required to render that counter is sent to the client.
      </p>
    </section>
  );
}
