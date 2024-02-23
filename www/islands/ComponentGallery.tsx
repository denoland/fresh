import Button from "../components/gallery/Button.tsx";
import LinkButton from "../components/gallery/LinkButton.tsx";
import ColoredButton from "../components/gallery/ColoredButton.tsx";
import Input from "../components/gallery/Input.tsx";
import Header from "../components/gallery/Header.tsx";
import Footer from "../components/gallery/Footer.tsx";
import Hero from "../components/gallery/Hero.tsx";
import Features from "../components/gallery/Features.tsx";
import Carousel from "../components/gallery/Carousel.tsx";
import { ComponentChildren } from "preact";
import IconHappy from "https://deno.land/x/tabler_icons_tsx@0.0.6/tsx/mood-crazy-happy.tsx";
import IconHeart from "https://deno.land/x/tabler_icons_tsx@0.0.6/tsx/heart.tsx";
import Background from "../components/gallery/Background.tsx";
import CodeBox from "../components/gallery/CodeBox.tsx";

interface SectionProps {
  title: string;
  children: ComponentChildren;
  source: string;
  island?: boolean;
}

function Section(props: SectionProps) {
  return (
    <div>
      <h2 class="text-2xl font-bold py-2" id={props.title}>
        {props.title}
        {props.island && (
          <span class="text-sm font-normal inline-block bg-green-200 rounded px-2 mx-2">
            island
          </span>
        )}
      </h2>

      <Background>
        {props.children}
      </Background>

      <CodeBox code={props.source} />
    </div>
  );
}

interface ComponentGalleryProps {
  sources: Record<string, string>;
}

export default function ComponentGallery(props: ComponentGalleryProps) {
  return (
    <>
      <Section
        title="Button"
        island={true}
        source={props.sources.Button}
      >
        <Button>
          Click me
        </Button>
        <Button class="flex gap-1">
          <IconHappy
            class="w-6 h-6 inline-block text-gray-500"
            aria-hidden="true"
          />
          <div>
            With an Icon
          </div>
        </Button>
        <Button disabled>
          Disabled
        </Button>
      </Section>
      <Section
        title="ColoredButton"
        island={true}
        source={props.sources.ColoredButton}
      >
        <ColoredButton>
          Click me
        </ColoredButton>
      </Section>

      <Section
        title="LinkButton"
        source={props.sources.LinkButton}
      >
        <LinkButton>
          <IconHeart
            class="w-5 h-5 mr-1 inline-block text-gray-400"
            aria-hidden="true"
          />
          Like me
        </LinkButton>
      </Section>

      <Section
        title="Input"
        island={true}
        source={props.sources.Input}
      >
        <Input placeholder="Placeholder" />
        <Input placeholder="Disabled" disabled />
      </Section>

      <Section title="Header" source={props.sources.Header}>
        <Header active="/" />
      </Section>

      <Section title="Footer" source={props.sources.Footer}>
        <Footer />
      </Section>

      <Section title="Hero" source={props.sources.Hero}>
        <Hero />
      </Section>

      <Section title="Features" source={props.sources.Features}>
        <Features />
      </Section>

      <Section title="Carousel" island={true} source={props.sources.Carousel}>
        <Carousel />
      </Section>
    </>
  );
}
