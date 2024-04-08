import { Head, Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";

export default function SlotDemo() {
  return (
    <div>
      <Head>
        <title>Head merge</title>
        <meta name="foo" content="bar" />
        <meta property="og:foo" content="og value foo" />
        <style id="style-foo"></style>
      </Head>
      <Partial name="slot-1">
        <Fader>
          <p class="status-initial">Initial content</p>
        </Fader>
      </Partial>
      <p>
        <a
          class="update-link"
          href="/head_merge/injected"
          f-partial="/head_merge/update"
        >
          update
        </a>
      </p>
      <p>
        <a
          class="duplicate-link"
          href="/head_merge/injected"
          f-partial="/head_merge/duplicate"
        >
          duplicate
        </a>
      </p>
      <p>
        <a
          class="without-title"
          href="/head_merge/injected"
          f-partial="/head_merge/without_title"
        >
          without title
        </a>
      </p>
    </div>
  );
}
