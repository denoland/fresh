import { RouteConfig } from "$fresh/server.ts";
import { Fader } from "../../islands/Fader.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
};

export default function PageB() {
  return (
    <Fader>
      <h1>Page C</h1>
      <span class="page-c-text">
        <p>asdfasdf asdf asdf</p>
      </span>
    </Fader>
  );
}
