import { RouteConfig } from "$fresh/server.ts";
import { Fader } from "../../islands/Fader.tsx";
import CounterB from "../../islands/CounterB.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
};

export default function PageB() {
  return (
    <Fader>
      <i>something before</i>
      <div>
        <h1>Page B</h1>
      </div>
      <CounterB />
      <p>asdfasdf asdf asdf</p>
    </Fader>
  );
}
