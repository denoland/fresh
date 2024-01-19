import { Partial } from "$fresh/runtime.ts";

export default function SlotDemo() {
  return (
    <div>
      <div class="output">
        <Partial name="slot-1">
          <p>Default content</p>
        </Partial>
      </div>
      <a
        class="update-link"
        href="/no_islands/injected"
        f-partial="/no_islands/update"
      >
        update
      </a>
    </div>
  );
}
