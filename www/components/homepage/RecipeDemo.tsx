import { Partial } from "fresh/runtime";

export const RecipeDemo = () => (
  <div
    f-client-nav
    class="w-full grid grid-cols-1 md:grid-cols-[auto_1fr] text-left gap-6 items-stretch min-h-64"
  >
    <aside class="flex flex-col gap-2 underline p-6 pl-0 border-b md:border-r md:border-b-0 border-current text-left items-start justify-center">
      <button type="button" f-partial="/recipes/lemonade">
        Lemonade
      </button>
      <button type="button" f-partial="/recipes/lemon-honey-tea">
        Lemon-honey tea
      </button>
      <button type="button" f-partial="/recipes/lemondrop">
        Lemondrop Martini
      </button>
    </aside>
    <main class="w-full flex flex-col justify-center">
      <Partial name="recipe">
        Click a recipe to stream HTML into this spot
      </Partial>
    </main>
  </div>
);
