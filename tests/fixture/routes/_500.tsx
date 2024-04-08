import { PageProps } from "$fresh/server.ts";

export default function Error500Page({ error }: PageProps) {
  return <p>500 internal error: {(error as Error).message}</p>;
}
