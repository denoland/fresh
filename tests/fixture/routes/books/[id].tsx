/** @jsx h */

import { h, PageProps, RouteConfig } from "$fresh/runtime.ts";

export default function Page(props: PageProps) {
  return <div>Book {props.params.id}</div>;
}

export const config: RouteConfig = {
  routeOverride: "/books/:id(\\d+)",
};
