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
      name: "Blog",
      href: "https://deno.com/blog?tag=fresh",
    },
  ];
  const isHome = props.active == "/";
  const isDocs = props.active == "/docs";
  return (
    <nav class={"flex " + (props.class ?? "")} f-client-nav={false}>
      <ul class="flex items-center gap-x-2 sm:gap-4 m-2 sm:my-6 flex-wrap sm:mx-8">
        {items.map((item) => (
          <li key={item.name} class="mt-[2px]">
            <a
              href={item.href}
              class={`p-1 sm:p-2 ${
                isHome
                  ? "text-green-900"
                  : isDocs
                  ? "text-foreground-secondary"
                  : "text-gray-600"
              } hover:underline aria-[current]:font-bold`}
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
