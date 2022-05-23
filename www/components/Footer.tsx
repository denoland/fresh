/** @jsx h */

import { h, tw } from "../deps.client.ts";

const LINKS = [
  {
    title: "Source",
    href: "https://github.com/lucacasonato/fresh",
  },
  {
    title: "License",
    href: "https://github.com/lucacasonato/fresh/blob/main/LICENSE",
  },
  {
    title: "Code of Conduct",
    href: "https://github.com/lucacasonato/fresh/blob/main/CODE_OF_CONDUCT.md",
  },
];

export default function Footer() {
  const footer = tw
    `border(t-2 gray-200) bg-gray-100 h-32 flex flex-col gap-4 justify-center`;
  const inner = tw
    `mx-auto max-w-screen-lg flex items-center justify-center gap-8`;
  const linkStyle = tw`text-gray-600 hover:underline`;
  const copyright = tw`text(gray-600 center)`;
  return (
    <footer class={footer}>
      <div class={inner}>
        {LINKS.map((link) => (
          <a href={link.href} class={linkStyle}>
            {link.title}
          </a>
        ))}
      </div>
      <div class={copyright}>
        <span>© {new Date().getFullYear()} the fresh authors</span>
      </div>
    </footer>
  );
}
