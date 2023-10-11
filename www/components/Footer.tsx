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
    <footer class="border-t-2 border-gray-200 md:h-16 flex  my-8 justify-center">
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
      </div>
    </footer>
  );
}
