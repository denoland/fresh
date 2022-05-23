/** @jsx h */

import { asset, h } from "../deps.client.ts";

export default function StaticPage() {
  return (
    <div>
      <p>This is a static page.</p>
      <img src={asset("/image.png")} />
    </div>
  );
}
