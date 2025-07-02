import * as Icons from "./Icons.tsx";

export default function SocialIcons() {
  return (
    <ul class="flex items-center align-center">
      <li class="flex github">
        <a
          href="https://github.com/denoland/fresh"
          class="inline-block transition"
          aria-label="GitHub"
        >
          <Icons.GitHub />
        </a>
      </li>
      <li class="flex discord">
        <a
          href="https://discord.com/invite/deno"
          class="inline-block transition"
          aria-label="Discord"
        >
          <Icons.Discord />
        </a>
      </li>
    </ul>
  );
}
