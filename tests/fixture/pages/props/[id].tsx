/** @jsx h */

import { h, PageProps } from "../../deps.ts";

export default function Home(props: PageProps) {
  return <div>{JSON.stringify(props)}</div>;
}
