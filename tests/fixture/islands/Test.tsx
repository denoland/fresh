/** @jsx h */

import { h } from "../client_deps.ts";

export default function Test(props: { message: string }) {
  return (
    <div>
      <p>{props.message}</p>
      <img id="img-in-island" src="/image.png" height={130} />
    </div>
  );
}
