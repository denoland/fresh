import ThemeToggle from "../islands/ThemeToggle.tsx";
import * as Icons from "./Icons.tsx";

export default function NavigationBar(props: { active: string; class?: string }) {
  const items = [
    {
      name: "Docs",
      href: "/docs",
    },
    {
      name: "Blog",
      href: "/blog",
    },
  ];
  const isHome = props.active == "/";
  const isDocs = props.active == "/docs" || props.active == "/blog";
  return (
    <nav class={"flex " + (props.class ?? "")} f-client-nav={false}>
      <ul class="flex items-center gap-x-2 sm:gap-4 mx-4 my-2 sm:my-6 flex-wrap lg:mx-8 2xl:mr-1">
        {items.map((item) => (
          <li key={item.name}>
            <a
              href={item.href}
              aria-current={props.active == item.href ? "page" : undefined}
              class={`p-1 sm:p-2 ${
                isHome ? "text-green-900" : isDocs ? "text-foreground-secondary" : "text-gray-600"
              } hover:underline aria-[current]:font-bold`}
            >
              {item.name}
            </a>
          </li>
        ))}

        <li class="flex items-center">
          <a
            href="https://github.com/freshframework/fresh"
            class="hover:text-green-600 inline-block transition"
            aria-label="GitHub"
          >
            <Icons.GitHub />
          </a>
        </li>
        <li class="flex items-center">
          <a
            href="https://discord.com/invite/deno"
            class="hover:text-green-600 inline-block transition"
            aria-label="Discord"
          >
            <Icons.Discord />
          </a>
        </li>
        {isDocs && (
          <li class="flex items-center">
            <ThemeToggle />
          </li>
        )}
      </ul>
    </nav>
  );
}
