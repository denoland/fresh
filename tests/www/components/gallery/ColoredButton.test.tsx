import { assert } from "$std/testing/asserts.ts";
import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import ColoredButton from "$fresh/www/components/gallery/ColoredButton.tsx";

describe("components/gallery/ColoredButton.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should have disabled set to false", () => {
    const { getByTitle } = render(<ColoredButton title="colored button" />);
    const bg = getByTitle("colored button");
    const disabled = bg.getAttribute("disabled");
    assert(!disabled);
  });
});
