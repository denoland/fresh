import { Partial } from "@fresh/core/runtime";

export function PartialInIsland() {
  return (
    <Partial name="invalid">
      <p class="invalid">invalid</p>
    </Partial>
  );
}
