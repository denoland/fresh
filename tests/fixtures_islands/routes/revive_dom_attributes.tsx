import { JsxConditional } from "../islands/JsxConditional.tsx";
import { SelfCounter } from "../islands/SelfCounter.tsx";
import { define } from "../utils.ts";

export default define.page(function RevievDomAttrsPage() {
  return (
    <JsxConditional>
      <div class="foo">
        <form>
          <label for="check">
            checked
          </label>
          <input name="check" type="checkbox" checked />
          <label for="text">
            is required
          </label>
          <input name="text" type="text" required />
          <label for="foo-1">
            not selected
          </label>
          <input id="foo-1" type="radio" name="foo" value="1" />
          <label for="foo-2">
            selected
          </label>
          <input id="foo-2" type="radio" name="foo" value="2" checked />
          <label for="select">
            select value should be "bar"
          </label>
          <select name="select">
            <option value="foo">foo</option>
            <option value="bar" selected>bar</option>
          </select>
        </form>
        <SelfCounter />
      </div>
    </JsxConditional>
  );
});
