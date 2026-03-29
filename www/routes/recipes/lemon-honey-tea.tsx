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
    <h2 class="mb-2 font-extrabold">Lemon-honey tea</h2>
    <ul>
      <li>1 cup boiling water</li>
      <li>¼ tsp black tea</li>
      <li>2 tsp honey</li>
      <li>1 tsp lemon juice</li>
      <li>Lemon peel</li>
    </ul>
  </Partial>
));
