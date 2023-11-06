import { Partial } from "$fresh/runtime.ts";
import { LayoutProps } from "$fresh/server.ts";

export default function Layout(
  { Component }: LayoutProps<unknown, unknown>,
) {
  return (
    <div f-client-nav>
      <nav>
        <ul class="text-blue-500 underline m-8 flex gap-12">
          <li>
            <a href="/island_twind">red bg</a>
          </li>
          <li>
            <a href="/island_twind/blue">blue bg</a>
          </li>
          <li>
            <a href="/island_twind/no-route-here">404 page</a>
          </li>
        </ul>
      </nav>
      <div class="mx-auto max-w-screen-md">
        <Partial name="main-content">
          <Component />
        </Partial>
      </div>
    </div>
  );
}
