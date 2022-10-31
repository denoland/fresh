import CodeBox from "../islands/CodeBox.tsx";
import Background from "../components/gallery/Background.tsx";
import Button from "../components/gallery/Button.tsx";
import ColoredButton from "../components/gallery/ColoredButton.tsx";
import Input from "../components/gallery/Input.tsx";
import Header from "../components/gallery/Header.tsx";
import Footer from "../components/gallery/Footer.tsx";
import PageFooter from "../components/Footer.tsx";
import HappyIcon from "https://deno.land/x/tabler_icons_tsx@0.0.1/tsx/mood-crazy-happy.tsx";
import DocsHeader from "../components/DocsHeader.tsx";
import NavigationBar from "../components/NavigationBar.tsx";

import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { ComponentChildren } from "preact";

export const handler: Handlers<HomeProps> = {
  async GET(req, ctx) {
    const props: HomeProps = {
      sources: {
        "Button": await Deno.readTextFile("./components/gallery/Button.tsx"),
        "ColoredButton": await Deno.readTextFile(
          "./components/gallery/ColoredButton.tsx",
        ),
        "Input": await Deno.readTextFile("./components/gallery/Input.tsx"),
        "Header": await Deno.readTextFile("./components/gallery/Header.tsx"),
        "Footer": await Deno.readTextFile("./components/gallery/Footer.tsx"),
      },
    };
    return ctx.render(props);
  },
};

interface HomeProps {
  sources: Record<string, string>;
}

interface SectionProps {
  title: string;
  children: ComponentChildren;
  source: string;
}

function Section(props: SectionProps) {
  return (
    <div>
      <h2 class="text-2xl font-bold">{props.title}</h2>

      <Background>
        {props.children}
      </Background>

      <CodeBox code={props.source} />
    </div>
  );
}

export default function Home(props: PageProps<HomeProps>) {
  return (
    <div class="bg-white h-full">
      <Head>
        <title>Components | fresh</title>
      </Head>
      <DocsHeader title="components" />
      <NavigationBar active="/components" />

      <section class="my-16 px(4 sm:6 md:8) mx-auto max-w-screen-lg space-y-5">
        <h2 class="text(3xl gray-600) font-bold">
          Fresh Components
        </h2>
        <p class="text-gray-600">
          A collection of components made for Fresh.
        </p>
      </section>
      <div class="p-4 mx-auto max-w-screen-lg space-y-24 mb-16">
        <Section title="Button" source={props.data.sources.Button}>
          <Button>
            Click me
          </Button>
          <Button class="flex gap-1 ml-2">
            <HappyIcon class="w-6 h-6 inline-block text-gray-500" />
            <div>
              With an Icon
            </div>
          </Button>
        </Section>
        <Section
          title="ColoredButton"
          source={props.data.sources.ColoredButton}
        >
          <ColoredButton>
            Click me
          </ColoredButton>
        </Section>

        <Section
          title="Input"
          source={props.data.sources.Input}
        >
          <Input placeholder="Placeholder" />
        </Section>

        <Section title="Header" source={props.data.sources.Header}>
          <Header active="/" />
        </Section>

        <Section title="Footer" source={props.data.sources.Footer}>
          <Footer>
          </Footer>
        </Section>

        <a class="block" href="https://tabler-icons-tsx.deno.dev/">
          <div
            style="background-image: url(/gallery/banner-tabler-icons.png)"
            class="h-48 bg(cover no-repeat white) hover:opacity-50 hover:underline rounded"
          >
            <h2 class="text-4xl font-bold p-4">Icons</h2>
          </div>
        </a>

        <a class="block" href="https://github.com/denoland/fresh_charts">
          <div
            style="background-image: url(/gallery/banner-chart.png)"
            class="h-48 bg(cover no-repeat white) hover:opacity-50 hover:underline rounded"
          >
            <h2 class="text-4xl font-bold p-4">Charts</h2>
          </div>
        </a>
      </div>
      <PageFooter />
    </div>
  );
}
