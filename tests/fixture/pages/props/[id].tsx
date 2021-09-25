/** @jsx h */

import { h, PageConfig, PageProps } from "../../deps.ts";

export default function Home(props: PageProps) {
  return <div>{JSON.stringify(props)}</div>;
}

export const config: PageConfig = { runtimeJS: true };
