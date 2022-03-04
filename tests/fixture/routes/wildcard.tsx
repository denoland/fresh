/** @jsx h */

import { h, PageConfig, PageProps } from "../client_deps.ts";

export default function WildcardPage({ params }: PageProps) {
  if (typeof params.path === "string") {
    return <p>{params.path}</p>;
  } else {
    return <p>Not a string.</p>;
  }
}

export const config: PageConfig = {
  routeOverride: "/foo/:path*",
};
