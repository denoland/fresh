import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "$fresh/www/components/Header.tsx";

export default function Layout({ Component, state }: PageProps) {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
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
