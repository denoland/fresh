/** @jsx h */

import { h, PageProps } from "../../deps.client.ts";

export default function Home(props: PageProps) {
  return <div>{JSON.stringify(props)}</div>;
}
