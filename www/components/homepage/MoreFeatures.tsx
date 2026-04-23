import { CodeBlock } from "../../components/CodeBlock.tsx";
import { CodeWindow } from "../../components/CodeWindow.tsx";
import { PageSection } from "../../components/PageSection.tsx";
import { SectionHeading } from "../../components/homepage/SectionHeading.tsx";

const features = [
  {
    title: "View Transitions",
    description:
      "Native-feeling page transitions with a single config flag. Customize per-element with plain CSS.",
    href: "/docs/advanced/view-transitions",
    icon: (
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        class="text-fresh"
        width="1.5rem"
        height="1.5rem"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 3a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12z" />
        <path d="M9 12h6" />
        <path d="M13 8l4 4l-4 4" />
      </svg>
    ),
    code: `const app = new App({
  viewTransition: true,
});`,
    lang: "js" as const,
  },
  {
    title: "Route Handlers",
    description:
      "Define GET, POST, DELETE — any HTTP method as a named handler on your route, with full type safety.",
    href: "/docs/concepts/routing",
    icon: (
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        class="text-fresh"
        width="1.5rem"
        height="1.5rem"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 13h5" />
        <path d="M12 16v-8h3a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-3" />
        <path d="M20 8v8" />
        <path d="M9 16v-5.5a2.5 2.5 0 0 0 -5 0v5.5" />
      </svg>
    ),
    code: `export const handlers = define.handlers({
  GET(ctx) { /* ... */ },
  POST(ctx) { /* ... */ },
  DELETE(ctx) { /* ... */ },
});`,
    lang: "js" as const,
  },
  {
    title: "WebSockets",
    description:
      "Add real-time endpoints with app.ws() — define open, message, and close handlers in a single object.",
    href: "/docs/advanced/websockets",
    icon: (
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        class="text-fresh"
        width="1.5rem"
        height="1.5rem"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M7 10h14l-4 -4" />
        <path d="M17 14h-14l4 4" />
      </svg>
    ),
    code: `app.ws("/chat", {
  open(socket) { /* ... */ },
  message(socket, event) {
    socket.send(event.data);
  },
});`,
    lang: "js" as const,
  },
  {
    title: "<Head> Component",
    description:
      "Set titles, meta tags, stylesheets, and scripts from any page or island — no hoisting hacks needed.",
    href: "/docs/advanced/head",
    icon: (
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        class="text-fresh"
        width="1.5rem"
        height="1.5rem"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
        <path d="M10 13l-1 2l1 2" />
        <path d="M14 13l1 2l-1 2" />
      </svg>
    ),
    code: `<Head>
  <title>My Page</title>
  <meta name="description"
    content="..." />
</Head>`,
    lang: "jsx" as const,
  },
  {
    title: "OpenTelemetry",
    description:
      "Auto-injects a traceparent meta tag into every page, connecting browser traces to server spans.",
    href: "/docs/advanced/opentelemetry",
    icon: (
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        class="text-fresh"
        width="1.5rem"
        height="1.5rem"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M6 21l6 -5l6 5" />
        <path d="M12 13v8" />
        <path d="M3.294 13.678l.166 .281c.52 .88 1.624 1.265 2.605 .91l14.242 -5.165a1.023 1.023 0 0 0 .565 -1.456l-2.62 -4.705a1.024 1.024 0 0 0 -1.462 -.394l-13.397 7.719c-1.038 .598 -1.272 1.783 -.594 2.692" />
        <path d="M8 11.5l5.5 -3.2" />
        <path d="M12.602 8.3l-2.552 4.6" />
      </svg>
    ),
    code: `const app = new App({
  otel: true,
});`,
    lang: "js" as const,
  },
];

export function MoreFeatures() {
  return (
    <PageSection>
      <div class="text-center flex flex-col gap-2">
        <SectionHeading>And there's more</SectionHeading>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <a
            href={f.href}
            class="flex flex-col gap-3 p-5 rounded-lg border border-gray-200 hover:border-fresh transition-colors"
          >
            <div class="flex items-center gap-2">
              {f.icon}
              <h3 class="font-bold text-base">{f.title}</h3>
            </div>
            <p class="text-gray-600 text-sm">{f.description}</p>
            <div class="text-xs [&>pre]:!m-0 [&>pre]:!p-3 flex-1">
              <CodeWindow>
                <CodeBlock code={f.code} lang={f.lang} />
              </CodeWindow>
            </div>
          </a>
        ))}
      </div>
    </PageSection>
  );
}
