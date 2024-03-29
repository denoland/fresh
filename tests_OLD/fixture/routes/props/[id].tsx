import type { PageProps } from "$fresh/server.ts";

export default function Home(props: PageProps) {
  return <div>{JSON.stringify(props)}</div>;
}
