import { assert, assertEquals } from "$std/testing/asserts.ts";
import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Features from "$fresh/www/components/gallery/Features.tsx";

describe("components/gallery/Features.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should only display 2 links", () => {
    const screen = render(<Features />);
    const links = screen.getAllByRole("link");
    assertEquals(links.length, 2);
  });

  it("should display all feature descriptions", () => {
    const screen = render(<Features />);
    const desc1 = screen.getByText(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc ut aliquam aliquam",
    );
    assert(desc1);
    const desc2 = screen.getByText(
      "Nunc nisl aliquet nisl, eget aliquam nisl nisl sit amet lorem. Sed euismod, nunc ut aliquam aliquam, nunc nisl aliquet nisl,",
    );
    assert(desc2);
    const desc3 = screen.getByText(
      "Eget aliquam nisl nisl sit amet lorem.",
    );
    assert(desc3);
  });
});
