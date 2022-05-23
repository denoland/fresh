/** @jsx h */

import { h, PageProps, RouteConfig } from "../../deps.client.ts";

export default function Page(props: PageProps) {
  return <div>Book {props.params.id}</div>;
}

export const config: RouteConfig = {
  routeOverride: "/books/:id(\\d+)",
};
