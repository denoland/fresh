import { Partial } from "$fresh/runtime.ts";
import { LayoutProps } from "$fresh/server.ts";
export default function RootLayout({ Component }: LayoutProps) {
  return (
    <>
      <header class="px-4 py-8 mx-auto bg-[#86efac]">
        <p>
          <a
            class="update-link"
            href="/placeholder/update"
            f-partial="/placeholder?swap=true"
          >
            update
          </a>
        </p>
      </header>
      <main>
        <Partial name="main">
          <Component />
        </Partial>
      </main>
    </>
  );
}
