import { useSignal } from "@preact/signals";
import Counter from "./Counter.tsx";
import { FormSubmitDemo } from "./FormSubmitDemo.tsx";
import { RecipeDemo } from "../components/homepage/RecipeDemo.tsx";
import { CodeWindow } from "../components/CodeWindow.tsx";
import { CodeBlock } from "../components/CodeBlock.tsx";
import { DemoBox } from "../components/homepage/DemoBox.tsx";
import { ExampleArrow } from "../components/homepage/ExampleArrow.tsx";
import { FancyLink } from "../components/FancyLink.tsx";

const tabs = [
  {
    id: "rendering",
    label: "Server Rendering",
    file: "routes/index.tsx",
    heading: "Build fast apps fast",
    description:
      "Fresh routes are dynamically server-rendered Preact components — zero JavaScript shipped to the browser by default.",
    link: "/docs/getting-started",
    linkText: "Get started",
    code: `export default function HomePage() {
  const time = new Date().toLocaleString();
  return (
    <p>Freshly server-rendered {time}</p>
  );
}`,
  },
  {
    id: "islands",
    label: "Islands",
    file: "islands/Counter.tsx",
    heading: "Island-based architecture",
    description:
      "Fresh ships plain HTML to the client, then hydrates with JavaScript only where needed. Because it's Preact, you get Signals for free.",
    link: "/docs/concepts/islands",
    linkText: "Learn more about islands",
    code: `import { useSignal } from "@preact/signals";

export default function Counter(props) {
  const count = useSignal(props.start);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => count.value -= 1}>-</button>
      <button onClick={() => count.value += 1}>+</button>
    </div>
  );
}`,
  },
  {
    id: "forms",
    label: "Forms",
    file: "routes/index.tsx",
    heading: "Forms, the right way",
    description:
      "Don't fight the browser. Handle form submissions server-side from any route, using web standard FormData.",
    link: "/docs/advanced/forms",
    linkText: "Forms in Fresh",
    code: `import { define } from "../utils.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();

    // Do something with the form data here,
    // then redirect user to thank you page

    return new Response(null, {
      status: 303,
      headers: { location: "/thanks" },
    });
  },
});`,
  },
  {
    id: "streaming",
    label: "Streaming",
    file: "components/Recipes.tsx",
    heading: "Stream HTML from the server",
    description:
      "Fresh Partials let you fetch HTML and slot it directly into the page without a full reload — perfect for dynamic apps.",
    link: "/docs/advanced/partials",
    linkText: "Learn more about Partials",
    code: `import { Partial } from "fresh/runtime";

export const Recipes = () => (
  <div f-client-nav>
    <button f-partial="/recipes/lemonade">
      Lemonade
    </button>
    <button f-partial="/recipes/lemon-honey-tea">
      Lemon-honey tea
    </button>
    <Partial name="recipe">
      Click a recipe to load it
    </Partial>
  </div>
);`,
  },
] as const;

export default function CodeTour() {
  const active = useSignal(0);
  const tab = tabs[active.value];

  return (
    <div class="flex flex-col gap-8">
      <div class="flex flex-wrap gap-2 justify-center">
        {tabs.map((t, i) => (
          <button
            type="button"
            key={t.id}
            onClick={() => active.value = i}
            class={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              active.value === i
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div class="lg:col-span-2 flex flex-col gap-4">
          <h3 class="text-2xl lg:text-3xl font-bold text-gray-800">
            {tab.heading}
          </h3>
          <p class="text-gray-600 text-lg">{tab.description}</p>
          <FancyLink href={tab.link} class="mt-2">
            {tab.linkText}
          </FancyLink>
        </div>

        <div class="lg:col-span-3 flex flex-col gap-4">
          <CodeWindow name={tab.file}>
            <CodeBlock code={tab.code} lang="jsx" />
          </CodeWindow>
          <ExampleArrow />
          <DemoBox>
            {active.value === 0 && (
              <p>
                Freshly server-rendered {new Date().toLocaleString("default", {
                  dateStyle: "medium",
                  timeStyle: "medium",
                })} UTC
              </p>
            )}
            {active.value === 1 && <Counter start={3} />}
            {active.value === 2 && <FormSubmitDemo />}
            {active.value === 3 && <RecipeDemo />}
          </DemoBox>
        </div>
      </div>
    </div>
  );
}
