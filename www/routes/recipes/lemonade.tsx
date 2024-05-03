import { Head, Partial } from "$fresh/runtime.ts";

export const Lemonade = () => (
  <Partial name="recipe">
    <h2 class="mb-2 font-extrabold">Lemonade</h2>
    <ul>
      <li>1 ¾ cups white sugar</li>
      <li>1 cup water</li>
      <li>9 medium lemons, or more as needed</li>
      <li>7 cups ice-cold water</li>
      <li>ice as needed</li>
    </ul>
  </Partial>
);

export default Lemonade;
