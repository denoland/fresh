import { Fader } from "$fresh/tests/fixture_partials/islands/Fader.tsx";
import { Logger } from "./Logger.tsx";
import { ComponentChildren } from "preact";

export default function PassThrough(props: { children?: ComponentChildren }) {
  return (
    <Fader>
      <Logger name="PassThrough">
        <div class="island">
          {props.children}
        </div>
      </Logger>
    </Fader>
  );
}
