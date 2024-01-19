import { Partial } from "$fresh/runtime.ts";
import DangerousIsland from "../../islands/DangerousIsland.tsx";

export default function Res() {
  return (
    <Partial name="content">
      <DangerousIsland raw={`<h1 id="__FRSH_STATE">{.invalid.json}</h1>`} />
      <p class="done">partial</p>
    </Partial>
  );
}
