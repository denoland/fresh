import { page } from "fresh";
import { Partial } from "fresh/runtime";
import { define } from "../../utils/state.ts";

export const handler = define.handlers({
  GET(ctx) {
    if (!ctx.isPartial) {
      return new Response(null, {
        status: 302,
        headers: { location: "/#partials" },
      });
    }
    return page();
  },
});

export const config = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default define.page(() => (
  <Partial name="recipe">
    <h2 class="mb-2 font-extrabold">Lemonade</h2>
    <ul>
      <li>1 ¾ cups white sugar</li>
      <li>1 cup water</li>
      <li>9 lemons</li>
      <li>7 cups ice water</li>
      <li>Ice</li>
    </ul>
  </Partial>
));
