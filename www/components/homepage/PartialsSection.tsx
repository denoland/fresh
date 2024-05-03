import Counter from "$fresh/www/islands/Counter.tsx";
import { CodeBlock } from "$fresh/www/components/CodeBlock.tsx";
import { CodeWindow } from "$fresh/www/components/CodeWindow.tsx";
import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { SideBySide } from "$fresh/www/components/SideBySide.tsx";
import { SectionHeading } from "$fresh/www/components/homepage/SectionHeading.tsx";
import { DemoBox } from "$fresh/www/components/homepage/DemoBox.tsx";
import { ExampleArrow } from "$fresh/www/components/homepage/ExampleArrow.tsx";
import { RecipeDemo } from "$fresh/www/components/homepage/RecipeDemo.tsx";

const islandCode = `import { Partial } from "$fresh/runtime.ts";

export const Recipes = () => (
  <div f-client-nav>
    <aside>
      <button f-partial="/recipes/lemonade">
        Lemonade
      </button>
      <button f-partial="/recipes/lemon-honey-tea">
        Lemon-honey tea
      </button>
      <button f-partial="/recipes/lemondrop">
        Lemondrop Martini
      </button>
    </aside>
    <main>
      <Partial name="recipe">
        👈 Click a recipe to stream HTML into this spot
      </Partial>
    </main>
  </div>
);`;

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
            🍋
          </div>
          <SectionHeading>Stream HTML straight from the server</SectionHeading>
          <p class="text-gray-600">
            Fresh Partials let you update only elements that need to change,
            without reloading the entire page.
          </p>
          <p>Get SPA-like navigation the right way.</p>
        </div>
        <div class="flex flex-col gap-4">
          <CodeWindow name="Loading partials">
            <CodeBlock
              code={islandCode}
              lang="jsx"
            />
          </CodeWindow>
          <ExampleArrow class="[transform:rotateY(-180deg)]" />
          <DemoBox>
            <RecipeDemo />
          </DemoBox>
        </div>
      </SideBySide>
    </PageSection>
  );
}
