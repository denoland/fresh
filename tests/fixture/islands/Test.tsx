/** @jsx h */

import { h } from "../client_deps.ts";

export default function Test(props: { message: string }) {
  return (
    <div>
      <p>{props.message}</p>
      <img
        id="img-in-island"
        src="/image.png"
        srcset="/image.png 1x"
        height={130}
      />
    </div>
  );
}
