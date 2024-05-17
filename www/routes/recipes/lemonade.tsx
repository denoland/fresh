import { Head, Partial } from "$fresh/runtime.ts";

export const Lemonade = () => (
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
);

export default Lemonade;
