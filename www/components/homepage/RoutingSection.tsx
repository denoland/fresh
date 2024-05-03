import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { SideBySide } from "$fresh/www/components/SideBySide.tsx";
import { CodeWindow } from "$fresh/www/components/CodeWindow.tsx";
import { CodeBlock } from "$fresh/www/components/CodeBlock.tsx";
import { SectionHeading } from "$fresh/www/components/homepage/SectionHeading.tsx";
import { DemoBox } from "$fresh/www/components/homepage/DemoBox.tsx";
import { ExampleArrow } from "$fresh/www/components/homepage/ExampleArrow.tsx";

const serverCode = `export default function() {
  const time = new Date().toLocaleString();
  return (
    <p>Freshly server-rendered at {time}!</p>
  );
}`;

export function RoutingSection() {
  return (
    <PageSection>
      <SideBySide mdColSplit="2/3" lgColSplit="2/3">
        <div class="flex flex-col gap-4">
          <div
            role="img"
            alt="Arrows routing and crossing each other emoji"
            class="leading-none text-[4rem]"
          >
            🔀
          </div>
          <SectionHeading>
            Easy routing with full control
          </SectionHeading>
          <p>
            Use file-based routing, or get as granular as you like with built-in
            middleware and route handlers.
          </p>
          <p>
            Easily build everything from websites to APIs, and anything in
            between.
          </p>
        </div>
        <div class="flex flex-col gap-4">
          <CodeWindow name="routes/index.tsx">
            <CodeBlock
              code={`// TODO: we need some kind of code example here`}
              lang="jsx"
            />
          </CodeWindow>
          <ExampleArrow />
          <DemoBox>
            <p>
              TODO: something goes here.
            </p>
          </DemoBox>
        </div>
      </SideBySide>
    </PageSection>
  );
}
