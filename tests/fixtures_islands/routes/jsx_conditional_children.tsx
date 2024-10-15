import { define } from "../utils.ts";
import { SelfCounter } from "../islands/SelfCounter.tsx";
import { JsxConditional } from "../islands/JsxConditional.tsx";

export default define.page(function JsxNestedChildrenSlotsPage() {
  return (
    <JsxConditional
      jsx={
        <div>
          <SelfCounter />
        </div>
      }
    >
      <div>
        <SelfCounter />
      </div>
    </JsxConditional>
  );
});
