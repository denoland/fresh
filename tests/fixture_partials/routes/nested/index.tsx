import { Partial } from "$fresh/runtime.ts";
import { ComponentChildren } from "preact";
import { Fader } from "../../islands/Fader.tsx";
import { Logger } from "../../islands/Logger.tsx";

export function Inner() {
  return (
    <Partial name="inner">
      <Logger name="inner">
        <Fader>
          <p class="status-inner">inner</p>
        </Fader>
      </Logger>
    </Partial>
  );
}

function Outer({ children }: { children: ComponentChildren }) {
  return (
    <Partial name="outer">
      <Logger name="outer">
        <Fader>
          <p class="status-outer">outer</p>

          {children}
        </Fader>
      </Logger>
    </Partial>
  );
}

export default function SlotDemo() {
  return (
    <div>
      <Outer>
        <Inner />
      </Outer>
      <p>
        <button
          class="update-outer"
          f-partial="/nested/outer"
        >
          update outer component
        </button>
        <button
          class="update-inner"
          f-partial="/nested/inner"
        >
          update inner component
        </button>
      </p>
      <pre id="logs" />
    </div>
  );
}
