import PageFooter from "../components/Footer.tsx";
import Header from "../components/Header.tsx";
import ComponentGallery from "../islands/ComponentGallery.tsx";

import { asset, Head } from "@fresh/core/runtime";
import { helpers } from "../utils.ts";

function getSource(path: string) {
  return Deno.readTextFile(new URL(path, import.meta.url));
}

export const handler = helpers.defineHandlers({
  async GET() {
    const props = {
      sources: {
        "Button": await getSource("../components/gallery/Button.tsx"),
        "LinkButton": await getSource("../components/gallery/LinkButton.tsx"),
        "ColoredButton": await getSource(
          "../components/gallery/ColoredButton.tsx",
        ),
        "Input": await getSource("../components/gallery/Input.tsx"),
        "Header": await getSource("../components/gallery/Header.tsx"),
        "Footer": await getSource("../components/gallery/Footer.tsx"),
        "Hero": await getSource("../components/gallery/Hero.tsx"),
        "Features": await getSource("../components/gallery/Features.tsx"),
        "Carousel": await getSource("../components/gallery/Carousel.tsx"),
      },
    };
    return { data: props };
  },
});

const TITLE = "Components | Fresh";
const DESCRIPTION = "A collection of components made for Fresh.";

export default helpers.definePage<typeof handler>(function Home(props) {
  const ogImageUrl = new URL(asset("/home-og.png"), props.url).href;
  return (
    <div class="bg-white h-full">
      <Head>
        <title>{TITLE}</title>
        <link
          rel="stylesheet"
          href="https://esm.sh/prismjs@1.29.0/themes/prism-dark.min.css"
        />
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={props.url.href} />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="view-transition" content="same-origin" />
      </Head>
      <Header title="components" active="/components" />

      <section class="my-16 px-4 sm:px-6 md:px-8 mx-auto max-w-screen-lg space-y-4">
        <h2 class="text-3xl text-gray-600 font-bold">
          Fresh Components
        </h2>
        <p class="text-gray-600">
          A collection of components made for Fresh.
        </p>
      </section>
      <div class="p-4 mx-auto max-w-screen-lg space-y-24 mb-16">
        <ComponentGallery sources={props.data.sources} />

        <a class="block" href="https://tabler-icons-tsx.deno.dev/">
          <div
            style="background-image: url(/gallery/banner-tabler-icons.png)"
            class="h-48 bg-cover bg-no-repeat bg-white hover:opacity-50 hover:underline rounded"
          >
            <h2 class="text-4xl font-bold p-4">Icons</h2>
          </div>
        </a>

        <a class="block" href="https://github.com/denoland/fresh_charts">
          <div
            style="background-image: url(/gallery/banner-chart.png)"
            class="h-48 bg-cover bg-no-repeat bg-white hover:opacity-50 hover:underline rounded"
          >
            <h2 class="text-4xl font-bold p-4">Charts</h2>
          </div>
        </a>
      </div>
      <PageFooter />
    </div>
  );
});
