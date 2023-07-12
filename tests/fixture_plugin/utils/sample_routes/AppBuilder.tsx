import { AppProps } from "$fresh/server.ts";
import { Head } from "../../../../runtime.ts";
import { Options } from "../route-plugin.ts";

export function AppBuilder(options: Options) {
  return ({ Component }: AppProps) => {
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
