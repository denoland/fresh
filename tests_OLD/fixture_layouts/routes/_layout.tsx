import type { PageProps } from "$fresh/server.ts";
import type { LayoutState } from "./_middleware.ts";

export default function RootLayout(
  { Component, state }: PageProps<unknown, LayoutState>,
) {
  return (
    <div class="root-layout">
      {state.something === "it works" ? "it works\n" : "it doesn't work\n"}
      <Component />
    </div>
  );
}
