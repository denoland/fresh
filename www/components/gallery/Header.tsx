import LemonIcon from "https://deno.land/x/tabler_icons_tsx@0.0.1/tsx/lemon-2.tsx";

type Props = {
  active: string;
};

export default function Header({ active }: Props) {
  const menus = [
    { name: "Home", href: "/" },
    { name: "Components", href: "/components" },
    { name: "Docs", href: "/docs" },
  ];

  return (
    <div class="bg-white w-full max-w-screen-lg py-6 px-8 flex items-center justify-center">
      <LemonIcon />
      <div class="text-2xl flex-1 ml-1 font-bold">
        Fresh
      </div>
      <ul class="flex items-center gap-6">
        {menus.map((menu) => (
          <li>
            <a
              href={menu.href}
              class={"text-gray-500 hover:text-gray-700 py-1 border-gray-500" +
                (menu.href === active ? " font-bold border-b-2" : "")}
            >
              {menu.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
