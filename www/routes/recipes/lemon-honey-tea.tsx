import { Partial } from "@fresh/core/runtime";
import type { RouteConfig } from "@fresh/core";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export const LemonHoneyTea = () => (
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
);

export default LemonHoneyTea;
