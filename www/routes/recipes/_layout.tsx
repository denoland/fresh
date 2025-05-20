import type { PageProps } from "@fresh/core";
import Header from "../../components/Header.tsx";

export default function Layout({ Component }: PageProps) {
  return (
    <>
      <Header active="" title="" />

      <div class="w-full max-w-screen-xl px-4">
        <Component />
        <p class="mt-16">
          This route is used only for demo purposes;{" "}
          <a href="/" class="underline">see the home page</a>.
        </p>
      </div>
    </>
  );
}
