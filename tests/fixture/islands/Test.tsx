/** @jsx h */

import { asset, h } from "../client_deps.ts";

export default function Test(props: { message: string }) {
  return (
    <div>
      <p>{props.message}</p>
      <img src={asset("/image.png")} />
    </div>
  );
}
