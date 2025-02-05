import * as Icons from "./Icons.tsx";

export default function SocialIcons() {
  return (
    <ul class="flex items-center align-center space-x-5 md:mx-8">
      <li class="flex">
        <a
          href="https://github.com/denoland/fresh"
          class="hover:text-green-600 inline-block transition"
          aria-label="GitHub"
        >
          <Icons.GitHub />
        </a>
      </li>
      <li class="flex">
        <a
          href="https://discord.com/invite/deno"
          class="hover:text-green-600 inline-block transition"
          aria-label="Discord"
        >
          <Icons.Discord />
        </a>
      </li>
    </ul>
  );
}
