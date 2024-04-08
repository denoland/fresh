import { Partial } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";

export default function SlotDemo(props: PageProps) {
  const update = props.url.searchParams.has("swap");

  return (
    <div>
      <Partial name="slot-1">
        <h2>foo</h2>
        <p>some text</p>
      </Partial>
      {update && (
        <Partial name="slot-1">
          <p>foo</p>
        </Partial>
      )}
      <p>
        <a
          class="swap-link"
          href="/duplicate_name"
          f-partial="/duplicate_name?swap=foo"
        >
          swap
        </a>
      </p>
    </div>
  );
}
