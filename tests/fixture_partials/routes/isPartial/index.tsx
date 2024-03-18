import { Partial } from "@fresh/runtime";

export default function SlotDemo() {
  return (
    <div>
      <div class="output">
        <Partial name="slot-1">
          <p>Default content</p>
        </Partial>
      </div>
      <a
        class="handler-update-link"
        href="/isPartial/injected"
        f-partial="/isPartial/handler"
      >
        handler update
      </a>
      <br />
      <a
        class="async-update-link"
        href="/isPartial/injected"
        f-partial="/isPartial/async"
      >
        async update
      </a>
    </div>
  );
}
