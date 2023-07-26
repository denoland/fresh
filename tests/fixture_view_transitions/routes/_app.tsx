import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: AppProps) {
  return (
    <div class="app">
      <Head>
        <link rel="stylesheet" href="/transition.css" />
      </Head>
      <Component />
    </div>
  );
}
