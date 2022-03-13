/** @jsx h */

import { h, asset } from "../client_deps.ts";

export default function StaticPage() {
  return <div>
    <p>This is a static page.</p>
    <img src={asset("/image.png")} />
  </div>;
}
