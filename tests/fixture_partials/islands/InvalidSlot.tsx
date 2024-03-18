import { Partial } from "@fresh/runtime";

export default function InvalidSlot() {
  return (
    <div class="island">
      <Partial name="invalid">
        <h1>it doesn't work</h1>
      </Partial>
    </div>
  );
}
