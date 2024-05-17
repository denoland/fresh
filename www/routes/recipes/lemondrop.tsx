import { Partial } from "$fresh/runtime.ts";
import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export const LemonDrop = () => (
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
);

export default LemonDrop;
