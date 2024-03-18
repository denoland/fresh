import { Partial } from "@fresh/runtime";

export default function SlotDemo() {
  return (
    <div>
      <div class="output">
        <Partial name="slot-1">
          <p class="status-default">Default content</p>
        </Partial>
      </div>
      <a
        class="update-link"
        href="/redirected/injected"
        f-partial="/redirected/redirect"
      >
        update
      </a>
    </div>
  );
}
