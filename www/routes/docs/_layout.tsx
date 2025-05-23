import type { PageProps } from "../../../src/context.ts";

export default function Layout({ Component }: PageProps) {
  return (
    <div class="layout">
      <div class="bg-background-primary text-foreground-primary">
        <Component />
      </div>
    </div>
  );
}
