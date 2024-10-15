import { define } from "../utils.ts";
import { SelfCounter } from "../islands/SelfCounter.tsx";
import { CounterWithSlots } from "../islands/CounterWithSlots.tsx";

export default define.page(function JsxChildrenIslandSlotsPage() {
  return (
    <CounterWithSlots
      jsx={
        <div>
          <SelfCounter />
        </div>
      }
    >
      <div>
        <SelfCounter />
      </div>
    </CounterWithSlots>
  );
});
