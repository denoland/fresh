/** @jsx h */

import { asset, h } from "../deps.client.ts";

export default function Test(props: { message: string }) {
  return (
    <div>
      <p>{props.message}</p>
      <img src={asset("/image.png")} />
    </div>
  );
}
