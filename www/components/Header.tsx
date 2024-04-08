import DocsTitle from "./DocsTitle.tsx";
import NavigationBar from "./NavigationBar.tsx";

export default function Header(props: { title: string; active: string }) {
  const isHome = props.active == "/";
  const isDocs = props.active == "/docs";

  return (
    <>
      {isDocs
        ? (
          <header
            class={"  top-0 w-full bg-white mx-auto max-w-screen-xl flex gap-3 items-center " +
              "justify-between md:justify-end"}
            f-client-nav={false}
          >
            <div class="p-4 flex items-center md:hidden">
              <Logo />
              <DocsTitle />
            </div>

            <NavigationBar class="hidden md:flex" active={props.active} />
          </header>
        )
        : (
          <header
            class={"mx-auto max-w-screen-xl flex gap-3 items-center " +
              (isHome ? "justify-end" : "justify-between")}
            f-client-nav={false}
          >
            {!isHome && (
              <div class="p-4 flex items-center">
                <Logo />
                <DocsTitle />
              </div>
            )}
            <NavigationBar class="hidden md:flex" active={props.active} />
          </header>
        )}

      <NavigationBar class="md:hidden pb-3" active={props.active} />
    </>
  );
}

export function Logo() {
  return (
    <a href="/" class="flex mr-3 items-center" aria-label="Top Page">
      <img src="/logo.svg" alt="Fresh logo" width={40} height={40} />
    </a>
  );
}
