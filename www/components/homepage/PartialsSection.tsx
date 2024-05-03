import Counter from "$fresh/www/islands/Counter.tsx";
import { CodeBlock } from "$fresh/www/components/CodeBlock.tsx";
import { CodeWindow } from "$fresh/www/components/CodeWindow.tsx";
import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { SideBySide } from "$fresh/www/components/SideBySide.tsx";
import { SectionHeading } from "$fresh/www/components/homepage/SectionHeading.tsx";
import { DemoBox } from "$fresh/www/components/homepage/DemoBox.tsx";
import { ExampleArrow } from "$fresh/www/components/homepage/ExampleArrow.tsx";

const islandCode = `+ import { Partial } from "$fresh/runtime.ts";

export default function TabList() {
  return (
    <div f-client-nav>
      <aside class="flex flex-col gap-4 underline">
        <a href="tab/a">A</a>
        <a href="tab/b">B</a>
        <a href="tab/c">C</a>
      </aside>
      <main>
        Streamed straight from the server:
        <Partial name="main" />
      </main>
    </div>
  );
}`;

export function PartialsSection() {
  return (
    <PageSection>
      <SideBySide mdColSplit="3/2" lgColSplit="3/2" reverseOnDesktop={true}>
        <div class="flex flex-col gap-4">
          <div
            role="img"
            alt="Desert island emoji"
            class="leading-none text-[4rem] font-mono"
          >
            &lt;/&gt;
          </div>
          <SectionHeading>Stream HTML straight from the server</SectionHeading>
          <p class="text-gray-600">
            Fresh Partials can replace only what needs to be updated on the
            client, for app-like interactivity with zero JavaScript.
          </p>
        </div>
        <div class="flex flex-col gap-4">
          <CodeWindow name="Counter island component">
            <CodeBlock
              code={islandCode}
              lang="jsx"
            />
          </CodeWindow>
          <ExampleArrow class="[transform:rotateY(-180deg)]" />
          <DemoBox>
            <Counter start={3} />
          </DemoBox>
        </div>
      </SideBySide>
    </PageSection>
  );
}
