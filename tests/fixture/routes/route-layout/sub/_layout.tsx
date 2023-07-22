import { Head } from "$fresh/runtime.ts";
import { LayoutProps } from "$fresh/server.ts";

export default function Layout({ Component, state }: LayoutProps) {
  //do something with state here
  return (
    <>
      <Head>
        <meta name="description" content="Hello world from sub route layout!" />
        <meta name="route-layout-sub" content="route-layout-sub" />
      </Head>

      <div class="layout">
        <h2>Title from Sub Layout</h2>

        <Component />
      </div>
    </>
  );
}
