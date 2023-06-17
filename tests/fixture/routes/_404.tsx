import { UnknownPageProps } from "$fresh/server.ts";

export default function NotFoundPage({ data, url }: UnknownPageProps) {
  return (
    <>
      <p>404 not found: {url.pathname}</p>
      {data?.hello && <p>Hello {data.hello}</p>}
    </>
  );
}
