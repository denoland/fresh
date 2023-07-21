import DocsTitle from "./DocsTitle.tsx";
import NavigationBar from "./NavigationBar.tsx";
import SearchButton from "../islands/SearchButton.tsx";

export default function Header(props: { title: string; active: string }) {
  const isHome = props.active == "/";
  const isDocs = props.active.startsWith("/docs");
  return (
    <div>
      <header
        class={"mx-auto max-w-screen-xl flex gap-3 items-center " +
          (isHome ? "justify-end" : "justify-between")}
      >
        {!isHome && (
          <div class="p-4 flex items-center">
            <Logo />
            <DocsTitle title={props.title} />
          </div>
        )}
        {isDocs && <SearchButton class="grow mb-0 hidden lg:flex" />}
        <NavigationBar class="hidden md:flex" active={props.active} />
      </header>
      <NavigationBar class="md:hidden pb-3" active={props.active} />
    </div>
  );
}

function Logo() {
  return (
    <a href="/" class="flex mr-3 items-center" aria-label="Top Page">
      <img src="/logo.svg" alt="Fresh logo" width={40} height={40} />
    </a>
  );
}
