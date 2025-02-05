import type { JSX } from "preact";
import * as Icons from "./Icons.tsx";

const LINKS = [
  {
    title: "Source",
    href: "https://github.com/denoland/fresh",
  },
  {
    title: "License",
    href: "https://github.com/denoland/fresh/blob/main/LICENSE",
  },
  {
    title: "Code of Conduct",
    href: "https://github.com/denoland/fresh/blob/main/CODE_OF_CONDUCT.md",
  },
];

export default function Footer(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <footer
      class={`border-t-2 border-foreground-secondary/20 md:h-16 flex mt-16 justify-center md:mx-16 ${props.class}`}
    >
      <div class="flex flex-col sm:flex-row gap-4 justify-between items-center max-w-screen-xl mx-auto w-full sm:px-6 md:px-8 p-4">
        <div class="text-foreground-secondary text-center">
          <span>© {new Date().getFullYear()} the Fresh authors</span>
        </div>

        <ul class="flex items-center gap-x-2 sm:gap-4 m-2 sm:my-6 flex-wrap lg:mx-8 2xl:mr-0">
          <li class="sm:hidden items-center">
            <a
              href="https://github.com/denoland/fresh"
              class="hover:text-green-600 inline-block transition"
              aria-label="GitHub"
            >
              <Icons.GitHub />
            </a>
          </li>
          <li class="sm:hidden items-center">
            <a
              href="https://discord.com/invite/deno"
              class="hover:text-green-600 inline-block transition"
              aria-label="Discord"
            >
              <Icons.Discord />
            </a>
          </li>
        </ul>

        <div class="flex items-center gap-8">
          {LINKS.map((link) => (
            <a
              href={link.href}
              class="text-foreground-secondary hover:underline"
            >
              {link.title}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
