/** @jsx h */
import { h } from "preact";
import { tw } from "../utils/twind.ts";

export default function NavigationBar(props: { active: string }) {
  const items = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "Docs",
      href: "/docs",
    },
  ];

  return (
    <nav class={tw`bg-green-200 py-2`}>
      <ul class={tw`flex justify-center gap-8 mx-4`}>
        {items.map((item) => (
          <li>
            <a
              href={item.href}
              class={tw`text-gray-600 hover:underline ${
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
