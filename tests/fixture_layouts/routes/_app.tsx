import { AppProps } from "$fresh/server.ts";

export default function App({ Component, state }: AppProps) {
  return (
    <div class="app">
      <Component />
    </div>
  );
}
