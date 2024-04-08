import { assertEquals } from "$std/testing/asserts.ts";
import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Background from "$fresh/www/components/gallery/Background.tsx";

describe("components/gallery/Background.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display background image", () => {
    const { getByTitle } = render(<Background title="background" />);
    const bg = getByTitle("background");
    const style = bg.getAttribute("style");
    assertEquals(style, "background-image: url(/gallery/grid.svg);");
  });
});
