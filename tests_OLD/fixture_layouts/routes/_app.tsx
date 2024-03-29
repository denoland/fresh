import type { PageProps } from "$fresh/server.ts";

export default function App({ Component, state }: PageProps) {
  return (
    <div class="app">
      <Component />
    </div>
  );
}
