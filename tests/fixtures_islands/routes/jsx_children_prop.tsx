import { define } from "../utils.ts";
import { JsxChildrenIsland } from "../islands/JsxChildrenIsland.tsx";

export default define.page(function JsxChildrenPropsPage() {
  return (
    <JsxChildrenIsland>
      foobar
    </JsxChildrenIsland>
  );
});
