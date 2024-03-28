import type { PageProps, RouteConfig } from "$fresh/server.ts";

export default function Page(props: PageProps) {
  return <pre>{JSON.stringify(props.params, null, 2)}</pre>;
}

export const config: RouteConfig = {
  routeOverride: "/std{@:version}?/:path*",
};
