import { assertEquals } from "$std/testing/asserts.ts";
import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Carousel from "../../../../www/components/gallery/Carousel.tsx";

describe("Carousel.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display navigation buttons", () => {
    const { getAllByRole } = render(
      <Carousel showNavigation={true} automatic={true} interval={1000} />,
    );
    const buttons = getAllByRole("button");
    assertEquals(buttons.length, 6);
  });
});
