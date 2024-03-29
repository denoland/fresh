import { defineApp, type PageProps } from "$fresh/server.ts";
import { Head } from "../../../../runtime.ts";
import type { Options } from "../route-plugin.ts";

export function AppBuilder(options: Options) {
  return options.async
    ? defineApp((_req, ctx) => {
      return (
        <>
          <Head>
            <title>{options.title}</title>
          </Head>
          <main class="max-w-screen-md px-4 pt-16 mx-auto">
            foo
            <ctx.Component />
          </main>
        </>
      );
    })
    : ({ Component }: PageProps) => {
      return (
        <>
          <Head>
            <title>{options.title}</title>
          </Head>
          <main class="max-w-screen-md px-4 pt-16 mx-auto">
            <Component />
          </main>
        </>
      );
    };
}
