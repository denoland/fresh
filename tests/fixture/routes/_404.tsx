/** @jsx h */

import { h, UnknownPageProps } from "$fresh/runtime.ts";

export default function NotFoundPage({ url }: UnknownPageProps) {
  return <p>404 not found: {url.pathname}</p>;
}
