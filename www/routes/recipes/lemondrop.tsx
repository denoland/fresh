import { Partial } from "$fresh/runtime.ts";

export const LemonDrop = () => (
  <Partial name="recipe">
    <h2 class="mb-2 font-extrabold">Lemondrop Martini</h2>
    <ul>
      <li>2 ounces vodka</li>
      <li>3/4 ounce triple sec</li>
      <li>
        1 ounce fresh squeezed lemon juice
      </li>
      <li>3/4 ounce simple syrup</li>
    </ul>
  </Partial>
);

export default LemonDrop;
