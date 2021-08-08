/** @jsx h */

import { h, PageConfig } from "../deps.ts";

export default function StaticPage() {
  return <p>This is a static page.</p>;
}

export const config: PageConfig = { runtimeJS: false };
