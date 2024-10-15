import { define } from "../utils.ts";
import { JsxIsland } from "../islands/JsxIsland.tsx";

export default define.page(function JsxIslandPropsPage() {
  return (
    <JsxIsland jsx={<p>foo</p>}>
      <p>bar</p>
    </JsxIsland>
  );
});
