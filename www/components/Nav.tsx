import DocsTitle from "./DocsTitle.tsx";

export default function DocsHeader(props: { title: string }) {
  return (
    <div class="bg-green-300">
      <header class="mx-auto max-w-screen-lg flex gap-3 justify-between">
        <div class="p-4 flex">
          <Logo />
          <div>
            <DocsTitle title={props.title} />
          </div>
        </div>
      </header>
    </div>
  );
}

function Logo() {
  return (
    <a href="/" class="flex mr-3 items-center">
      <img
        src="/logo.svg"
        alt="Fresh logo"
        width={40}
        height={40}
      />
    </a>
  );
}
