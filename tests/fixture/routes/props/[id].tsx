/** @jsx h */

import { h, PageProps } from "$fresh/runtime.ts";

export default function Home(props: PageProps) {
  return <div>{JSON.stringify(props)}</div>;
}
