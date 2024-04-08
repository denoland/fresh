import { Partial } from "$fresh/runtime.ts";

export default function SlotDemo() {
  return (
    <div>
      <h1 id="foo">Same nav</h1>
      <a href="#foo">#foo</a>
      <Partial name="foo">
        <p class="partial-text">
          foo partial
        </p>
      </Partial>
    </div>
  );
}
