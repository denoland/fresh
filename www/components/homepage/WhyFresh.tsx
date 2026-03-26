import { PageSection } from "../PageSection.tsx";
import { SectionHeading } from "./SectionHeading.tsx";
import type { ComponentChildren } from "preact";

const cards: { icon: ComponentChildren; title: string; description: string }[] =
  [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="text-green-700"
          width="2.5rem"
          height="2.5rem"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
        </svg>
      ),
      title: "Zero JS by default",
      description:
        "Pages are server-rendered with Preact. No JavaScript is sent to the browser unless you explicitly opt in with islands.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="text-green-700"
          width="2.5rem"
          height="2.5rem"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M17.553 16.75a7.5 7.5 0 0 0 -10.606 0" />
          <path d="M18 3.804a6 6 0 0 0 -8.196 2.196l10.392 6a6 6 0 0 0 -2.196 -8.196z" />
          <path d="M16.732 10c1.658 -2.87 2.225 -5.644 1.268 -6.196c-.957 -.552 -3.075 1.326 -4.732 4.196" />
          <path d="M15 9l-3 5.196" />
          <path d="M3 19.25a2.4 2.4 0 0 1 1 -.25a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 1 .25" />
        </svg>
      ),
      title: "Island architecture",
      description:
        "Ship plain HTML, then hydrate only the interactive parts. The rest stays static — fast and lightweight.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="text-green-700"
          width="2.5rem"
          height="2.5rem"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
          <path d="M3.6 9h16.8" />
          <path d="M3.6 15h16.8" />
          <path d="M11.5 3a17 17 0 0 0 0 18" />
          <path d="M12.5 3a17 17 0 0 1 0 18" />
        </svg>
      ),
      title: "Deploy in seconds",
      description:
        "Built on Deno with zero-config TypeScript. Deploy instantly to Deno Deploy, or anywhere that runs JavaScript.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="text-green-700"
          width="2.5rem"
          height="2.5rem"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M19.5 7a9 9 0 0 0 -7.5 -4a8.991 8.991 0 0 0 -7.484 4" />
          <path d="M11.5 3a16.989 16.989 0 0 0 -1.826 4" />
          <path d="M12.5 3a16.989 16.989 0 0 1 1.828 4" />
          <path d="M19.5 17a9 9 0 0 1 -7.5 4a8.991 8.991 0 0 1 -7.484 -4" />
          <path d="M11.5 21a16.989 16.989 0 0 1 -1.826 -4" />
          <path d="M12.5 21a16.989 16.989 0 0 0 1.828 -4" />
          <path d="M2 10l1 4l1.5 -4l1.5 4l1 -4" />
          <path d="M17 10l1 4l1.5 -4l1.5 4l1 -4" />
          <path d="M9.5 10l1 4l1.5 -4l1.5 4l1 -4" />
        </svg>
      ),
      title: "Built on web standards",
      description:
        "Use fetch, Request, Response, and FormData. No proprietary abstractions — just the web platform you already know.",
    },
  ];

export function WhyFresh() {
  return (
    <PageSection class="!mt-16 !mb-8">
      <div class="text-center flex flex-col gap-4 mb-8">
        <SectionHeading>
          The framework so simple, you already know it
        </SectionHeading>
        <p class="text-xl text-balance max-w-prose mx-auto text-gray-600">
          Fresh builds on well-known tools, conventions, and web standards — so
          you spend your time shipping, not learning a framework.
        </p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {cards.map((card) => (
          <div
            key={card.title}
            class="bg-gray-50 rounded-xl p-8 flex flex-col gap-4"
          >
            {card.icon}
            <h3 class="text-xl font-bold text-gray-800">{card.title}</h3>
            <p class="text-gray-600">{card.description}</p>
          </div>
        ))}
      </div>
    </PageSection>
  );
}
