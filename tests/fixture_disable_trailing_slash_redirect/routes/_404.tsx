import { PageProps } from "$fresh/server.ts";

export default function CustomNotFoundPage(props: PageProps) {
  const hasTrailingSlash = props.state.hasTrailingSlash;
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Has trailing slash: {hasTrailingSlash ? "Yes" : "No"}</p>
    </div>
  );
}
