import { Partial } from "$fresh/runtime.ts";
import { useSignal } from "@preact/signals";
import Spinner from "../../islands/Spinner.tsx";
import PartialTrigger from "../../islands/PartialTrigger.tsx";

export default function SlotDemo() {
  const sig = useSignal(false);
  return (
    <div>
      <div class="output">
        <Partial name="slot-1">
          <p class="status">Default content</p>
          <Spinner id="inner" show={sig} />
        </Partial>
      </div>
      <Spinner id="outer" show={sig} />
      <a
        class="update-link"
        href="/loading/injected"
        f-partial="/loading/update"
        f-loading={sig}
      >
        update
      </a>
      <br />
      <PartialTrigger
        class="trigger"
        href="/loading/injected"
        partial="/loading/update"
        loading={sig}
      >
        partial trigger
      </PartialTrigger>
    </div>
  );
}
