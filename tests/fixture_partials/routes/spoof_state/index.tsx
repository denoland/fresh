import { Partial } from "$fresh/runtime.ts";

export default function SerializePrototype() {
  return (
    <div>
      <Partial name="content">
        <p>initial</p>
      </Partial>
      <a href="/spoof_state/partial">Update</a>
    </div>
  );
}
