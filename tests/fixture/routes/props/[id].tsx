/** @jsx h */

import { h, PageProps } from "../../client_deps.ts";

export default function Home(props: PageProps) {
  return <div>{JSON.stringify(props)}</div>;
}
