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

          <section class="max-w-screen-lg mx-auto my-16 px(4 sm:6 md:8) space-y-4">
            <h2 class="text(3xl gray-600) font-bold">
              Badge
            </h2>

            <p class="text-gray-600">
              You can add these stylish badges to your project's README to show
              that it was built with Fresh.
            </p>

            <img
              width="197"
              height="37"
              src="https://fresh.deno.dev/fresh-badge.svg"
              alt="Made with Fresh"
            />

            <img
              width="197"
              height="37"
              src="https://fresh.deno.dev/fresh-badge-dark.svg"
              alt="Made with Fresh"
            />

            <p>
              <a
                href="https://github.com/denoland/fresh#badges"
                class="text-blue-600 hover:underline focus:underline"
              >
                Usage instructions
              </a>
            </p>
          </section>

          <img
            src="/illustration/deno-plush.svg"
            alt="a deno plush is holding a lemon"
            class="mx-auto w-48 mt-16"
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
      <h2 class="text(3xl gray-600) font-bold">
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
