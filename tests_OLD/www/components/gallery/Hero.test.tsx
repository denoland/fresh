import { assertEquals } from "$std/testing/asserts.ts";
import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Hero from "$fresh/www/components/gallery/Hero.tsx";

describe("components/gallery/Hero.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show 2 links", () => {
    const { getAllByRole } = render(<Hero />);
    // Two anchor links in component
    const links = getAllByRole("link");
    assertEquals(links.length, 2);
  });
});
