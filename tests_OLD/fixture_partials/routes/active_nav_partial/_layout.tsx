import type { PageProps } from "$fresh/server.ts";

export default function Layout({ Component }: PageProps) {
  return (
    <div f-client-nav>
      <Component />
    </div>
  );
}
