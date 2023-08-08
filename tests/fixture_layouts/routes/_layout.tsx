import { LayoutProps } from "$fresh/server.ts";
import { LayoutState } from "./_middleware.ts";

export default function RootLayout(
  { Component, state }: LayoutProps<unknown, LayoutState>,
) {
  return (
    <div class="root-layout">
      {state.something === "it works" ? "it works\n" : "it doesn't work\n"}
      <Component />
    </div>
  );
}
