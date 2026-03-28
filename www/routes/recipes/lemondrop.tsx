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
    <h2 class="mb-2 font-extrabold">Lemondrop Martini</h2>
    <ul>
      <li>2 oz vodka</li>
      <li>3/4 oz triple sec</li>
      <li>
        1 oz fresh lemon juice
      </li>
      <li>3/4 oz simple syrup</li>
    </ul>
  </Partial>
));
