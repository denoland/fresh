import { PageSection } from "../../components/PageSection.tsx";

const ONE_FILE_EXAMPLE = `import { App } from "fresh";

const app = new App()
  .get("/", () => new Response("Hello, World!"));

app.listen();`;

const ADD_JSX_EXAMPLE = `import { App } from "fresh";

const app = new App()
  .get("/", (ctx) => ctx.render(<h1>Hello!</h1>));

app.listen();`;

const ADD_ISLAND_EXAMPLE = `// islands/Counter.tsx
import { useSignal } from "@preact/signals";

export function Counter() {
  const count = useSignal(0);
  return (
    <button onClick={() => count.value++}>
      Count: {count}
    </button>
  );
}`;

export function Simple() {
  return (
    <PageSection class="!mb-12 !mt-20">
      <div class="text-center max-w-max mx-auto flex flex-col gap-4">
        <p class="italic text-gray-500 text-lg">Introducing Fresh:</p>
        <h2 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl sm:tracking-tight font-extrabold text-balance text-gray-600">
          The framework so simple, you already know it.
        </h2>
        <p class="text-xl text-balance max-w-prose mx-auto">
          Fresh is designed to be easy to use by building on the best well-known
          tools, conventions, and web standards.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6 mt-8">
        <StepCard
          step="1"
          title="One file. That's it."
          description="No config files, no build step, no node_modules. Just one file and you have a server."
          code={ONE_FILE_EXAMPLE}
        />
        <StepCard
          step="2"
          title="Add JSX"
          description="Render HTML with JSX. Server-side by default, fast by design."
          code={ADD_JSX_EXAMPLE}
        />
        <StepCard
          step="3"
          title="Sprinkle interactivity"
          description="Add islands for client-side JS only where you need it. Zero JS shipped by default."
          code={ADD_ISLAND_EXAMPLE}
        />
      </div>
    </PageSection>
  );
}

function StepCard(
  props: { step: string; title: string; description: string; code: string },
) {
  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <span class="bg-green-200 text-green-800 text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
          {props.step}
        </span>
        <h3 class="font-bold text-lg">{props.title}</h3>
      </div>
      <p class="text-gray-600 text-sm">{props.description}</p>
      <pre class="bg-slate-800 text-green-100 rounded-md p-4 text-sm overflow-x-auto flex-1">
        <code>{props.code}</code>
      </pre>
    </div>
  );
}
