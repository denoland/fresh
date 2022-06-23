/** @jsx h */
import { h } from "preact";
import { PageProps, RouteConfig } from "$fresh/server.ts";

export default function WildcardPage({ params }: PageProps) {
  if (typeof params.path === "string") {
    return <p>{params.path}</p>;
  } else {
    return <p>Not a string.</p>;
  }
}

export const config: RouteConfig = {
  routeOverride: "/foo/:path*",
};
