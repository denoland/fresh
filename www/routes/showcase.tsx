import { Head } from "$fresh/runtime.ts";
import Projects, { Project } from "../components/Projects.tsx";
import DocsHeader from "../components/DocsHeader.tsx";
import Footer from "../components/Footer.tsx";
import NavigationBar from "../components/NavigationBar.tsx";
import projects from "../data/showcase.json" assert { type: "json" };

export default function ShowcasePage() {
  return (
    <>
      <Head>
        <title>Showcase | fresh</title>
      </Head>
      <DocsHeader />
      <NavigationBar active="/showcase" />

      <div class="flex flex-col min-h-screen">
        <div class="flex-1">
          <Showcase items={projects} />

          <img
            src="/illustration/deno-plush.svg"
            alt="a deno plush is holding a lemon"
            class="mx-auto w-48 mt-32"
          />
        </div>

        <Footer />
      </div>
    </>
  );
}

function Showcase({ items }: { items: Project[] }) {
  return (
    <section class="max-w-screen-lg mx-auto my-16 px(4 sm:6 md:8) space-y-4">
      <h2 id="showcase" class="text(3xl gray-600) font-bold">
        Showcase
      </h2>
      <p class="text-gray-600">
        Below is a selection of projects that have been built with Fresh.{" "}
        <a
          href="https://github.com/denoland/fresh/blob/main/www/data/showcase.json"
          class="text-blue-600 hover:underline"
        >
          Add yours!
        </a>
      </p>
      <Projects items={items} class="gap-16" />
    </section>
  );
}
