import { Partial } from "$fresh/runtime.ts";

export default function Page() {
  return (
    <div>
      <Partial name="content">
        <h1>/active_nav_partial/foo/bar</h1>
      </Partial>
      <p>
        <a href="/active_nav_partial/foo/bar">/active_nav_partial/foo/bar</a>
      </p>
      <p>
        <a href="/active_nav_partial/foo">/active_nav_partial/foo</a>
      </p>
      <p>
        <a href="/active_nav_partial">/active_nav_partial</a>
      </p>
      <p>
        <a href="/">/</a>
      </p>
    </div>
  );
}
