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
    <p>Freshly server-rendered {time}</p>
  );
}`;

export function RenderingSection() {
  return (
    <PageSection>
      <SideBySide mdColSplit="2/3" lgColSplit="2/3">
        <div class="flex flex-col gap-4">
          <img
            src="/logos/preact.svg"
            alt="Preact logo"
            class="w-full h-auto max-w-14"
          />
          <SectionHeading>
            Build fast apps fast
          </SectionHeading>
          <p>
            Fresh routes are dynamically server-rendered Preact components, so
            there's zero JavaScript shipped to the client.
          </p>
          <p>Fast to write, and fast to run.</p>
        </div>
        <div class="flex flex-col gap-4">
          <CodeWindow name="routes/index.tsx">
            <CodeBlock code={serverCode} lang="jsx" />
          </CodeWindow>
          <ExampleArrow class="ml-[55%]" />{" "}
          <DemoBox>
            <p>
              Freshly server-rendered {new Date().toLocaleString("default", {
                dateStyle: "medium",
                timeStyle: "medium",
              })}
            </p>
          </DemoBox>
        </div>
      </SideBySide>
    </PageSection>
  );
}
