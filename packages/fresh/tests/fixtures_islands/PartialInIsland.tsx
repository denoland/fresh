import { Partial } from "fresh/runtime";

export function PartialInIsland() {
  return (
    <Partial name="invalid">
      <p class="invalid">invalid</p>
    </Partial>
  );
}
