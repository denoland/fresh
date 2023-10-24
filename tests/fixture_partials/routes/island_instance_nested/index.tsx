import { Partial } from "$fresh/runtime.ts";
import CounterA from "../../islands/CounterA.tsx";
import CounterB from "../../islands/CounterB.tsx";
import PassThrough from "../../islands/PassThrough.tsx";

export default function SlotDemo() {
  return (
    <div>
      <Partial name="slot-1">
        <PassThrough>
          <div class="inner">
            <p>server content</p>
            <CounterA />
          </div>
          <hr />
          <PassThrough>
            <p>another pass through</p>
            <CounterB />
          </PassThrough>
        </PassThrough>
      </Partial>
      <hr />
      <p>
        <a
          class="update-link"
          href="/island_instance_nested/injected"
          f-partial="/island_instance_nested/partial"
        >
          update
        </a>
      </p>
      <p>
        <a
          class="replace-link"
          href="/island_instance_nested/injected"
          f-partial="/island_instance_nested/replace"
        >
          replace
        </a>
      </p>
      <pre id="logs" />
    </div>
  );
}
