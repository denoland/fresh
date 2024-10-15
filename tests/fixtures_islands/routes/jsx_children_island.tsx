import { define } from "../utils.ts";
import { PassThrough } from "../islands/PassThrough.tsx";
import { SelfCounter } from "../islands/SelfCounter.tsx";

export default define.page(function JsxChildrenIslandPage() {
  return (
    <PassThrough>
      <div>
        <SelfCounter />
      </div>
    </PassThrough>
  );
});
