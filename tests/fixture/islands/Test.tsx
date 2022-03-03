/** @jsx h */

import { h } from "../client_deps.ts";

export default function Test(props: { message: string }) {
  return <p>{props.message}</p>;
}
