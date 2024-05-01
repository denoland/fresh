import Counter from "$fresh/www/islands/Counter.tsx";
import { CodeBlock } from "$fresh/www/components/CodeBlock.tsx";
import { CodeWindow } from "$fresh/www/components/CodeWindow.tsx";
import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { SideBySide } from "$fresh/www/components/SideBySide.tsx";
import { SectionHeading } from "$fresh/www/components/homepage/SectionHeading.tsx";
import { DemoBox } from "$fresh/www/components/homepage/DemoBox.tsx";

const islandCode = `import { useSignal } from "@preact/signals";

export default function Counter(props) {
  const count = useSignal(props.start);

  return (
    <div>
      <h3>Interactive island 🏝️</h3>
      <p>The server supplied the initial value of {props.start}.</p>
      <div>
        <button onClick={() => count.value -= 1}>-</button>
        <div>{count}</div>
        <button onClick={() => count.value += 1}>+</button>
      </div>
    </div>
  );
}`;

const routeCode = `import Counter from "islands/Counter.tsx";

export default function() {
  return <Counter start={3} />;
}`;

export function IslandsSection() {
  return (
    <PageSection>
      <SideBySide mdColSplit="3/2" lgColSplit="3/2" reverseOnDesktop={true}>
        <div class="flex flex-col gap-4">
          <div
            role="img"
            alt="Desert island emoji"
            class="leading-none text-[4rem]"
          >
            &#127965;
          </div>
          <SectionHeading>Interactive Islands</SectionHeading>
          <p class="text-gray-600 mb-4">
            Fresh ships raw HTML to the client, and then hydrates with
            JavaScript only where needed. Simple and fast.
          </p>
        </div>
        <div class="flex flex-col gap-4">
          <CodeWindow name="Counter island component">
            <CodeBlock
              code={islandCode}
              lang="jsx"
            />
          </CodeWindow>
          <div class="flex items-center justify-center">⬇️</div>
          <DemoBox>
            <Counter start={3} />
          </DemoBox>
        </div>
      </SideBySide>
    </PageSection>
  );
}
