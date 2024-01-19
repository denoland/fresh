import * as Icons from "./Icons.tsx";

export default function NavigationBar(
  props: { active: string; class?: string },
) {
  const items = [
    {
      name: "Docs",
      href: "/docs",
    },
    {
      name: "Showcase",
      href: "/showcase",
    },
    {
      name: "Components",
      href: "/components",
    },
    {
      name: "Blog",
      href: "https://deno.com/blog?tag=fresh",
    },
  ];
  const isHome = props.active == "/";
  return (
    <nav class={"flex " + props.class ?? ""} f-client-nav={false}>
      <ul class="flex justify-center items-center gap-2 sm:gap-4 mx-4 my-2 sm:my-6 flex-wrap lg:mx-8 2xl:mr-0">
        {items.map((item) => (
          <li>
            <a
              href={item.href}
              class={`p-1 sm:p-2 ${
                isHome ? "text-green-900" : "text-gray-600"
              } hover:underline aria-[current]:font-bold`}
            >
              {item.name}
            </a>
          </li>
        ))}

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
    </nav>
  );
}
