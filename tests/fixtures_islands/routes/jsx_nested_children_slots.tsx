import { define } from "../utils.ts";
import { SelfCounter } from "../islands/SelfCounter.tsx";
import { PassThrough } from "../islands/PassThrough.tsx";

export default define.page(function JsxNestedChildrenSlotsPage() {
  return (
    <PassThrough>
      <PassThrough>
        <div>
          <SelfCounter id="a" />
        </div>
      </PassThrough>
      <PassThrough>
        <div>
          <SelfCounter id="b" />
        </div>
      </PassThrough>
    </PassThrough>
  );
});
