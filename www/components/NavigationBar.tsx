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
  ];

  return (
    <nav class={"flex " + props.class ?? ""}>
      <ul class="flex justify-center items-center gap-4 mx-4">
        {items.map((item) => (
          <li>
            <a
              href={item.href}
              class={`p-2 text-gray-600 hover:underline ${
                props.active == item.href ? "font-bold" : ""
              }`}
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
