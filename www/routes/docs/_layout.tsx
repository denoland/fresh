import type { PageProps } from "@fresh/core";

export default function Layout({ Component }: PageProps) {
  return (
    <div class="layout">
      <div class="bg-background-primary text-foreground-primary">
        <Component />
      </div>
    </div>
  );
}
