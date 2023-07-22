import { Head } from "$fresh/runtime.ts";
import { LayoutProps } from "$fresh/server.ts";

export default function Layout({ Component, state }: LayoutProps) {
  //do something with state here
  return (
    <>
      <Head>
        <meta name="description" content="Hello world!" />
      </Head>

      <div class="layout">
        <h1>Title from Layout</h1>

        <Component />
      </div>
    </>
  );
}
