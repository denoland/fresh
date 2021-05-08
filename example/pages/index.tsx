import { h } from "../deps.ts";

export default function Home(props: {}) {
  return <div>Hello World!</div>;
}

export function self() {
  return import.meta.url;
}
