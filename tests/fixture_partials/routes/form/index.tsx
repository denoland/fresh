import { Partial } from "$fresh/runtime.ts";

export default function SlotDemo() {
  return (
    <div>
      <form f-partial="/form/update">
        <Partial name="slot-1">
          <p class="status">Default content</p>
          <p>
            <input type="text" value="foo" />
          </p>
        </Partial>
        <button type="submit" class="submit">
          submit
        </button>
      </form>
    </div>
  );
}
