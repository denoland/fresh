import { Partial } from "@fresh/core/runtime";
import { CounterHooks } from "../../islands/tests/CounterHooks.tsx";

export default function Page() {
  return (
    <Partial name="partial-test">
      <CounterHooks />
    </Partial>
  );
}
