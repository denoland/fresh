/** @jsx h */

import { h } from "$fresh/runtime.ts";

interface Props {
  params: Record<string, string | string[]>;
}

export default function Greet(props: Props) {
  return <div>Hello {props.params.name}</div>;
}
