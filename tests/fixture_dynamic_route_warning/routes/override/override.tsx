import { RouteConfig } from "$fresh/server.ts";

export default function Home() {
  return <div>Home</div>;
}

export const config: RouteConfig = {
  routeOverride: "/override/:path*",
};
