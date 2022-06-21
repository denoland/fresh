/** @jsx h */
import { h } from "preact";
import { PageProps } from "$fresh/server.ts";

export default function Home(props: PageProps) {
  return <div>{JSON.stringify(props)}</div>;
}
