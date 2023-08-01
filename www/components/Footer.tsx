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

export default function Footer() {
  return (
    <footer class="border-t-2 border-gray-200 bg-gray-100 md:h-16 flex gap-4 justify-center">
      <div class="flex flex-col sm:flex-row gap-4 justify-between items-center max-w-screen-xl mx-auto w-full px(4 sm:6 md:8) p-4">
        <div class="text(gray-600 center)">
          <span>© {new Date().getFullYear()} the Fresh authors</span>
        </div>

        <div class="flex items-center gap-8">
          {LINKS.map((link) => (
            <a href={link.href} class="text-gray-600 hover:underline">
              {link.title}
            </a>
          ))}
        </div>

        <ul class="flex justify-center items-center gap-4 md:ml-4 mt-2 mb-4 sm:mt-0 sm:mb-0 flex-wrap">
          <li class="flex items-center">
            <a
              href="https://github.com/denoland/fresh"
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
        </ul>
      </div>
    </footer>
  );
}
