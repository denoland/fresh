/** @jsx h */
import type { h } from "preact";
import { IS_BROWSER } from "../../../src/runtime/utils.ts";

export default function Island() {
  const id = IS_BROWSER ? "csr" : "ssr";
  return (
    <div>
      <p id={id}>{id}</p>
    </div>
  );
}
