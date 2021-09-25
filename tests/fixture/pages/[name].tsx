/** @jsx h */

import { h, PageConfig } from "../deps.ts";

interface Props {
  params: Record<string, string | string[]>;
}

export default function Greet(props: Props) {
  return <div>Hello {props.params.name}</div>;
}

export const config: PageConfig = { runtimeJS: true };
