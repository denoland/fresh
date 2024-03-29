import { assertEquals, assertExists } from "$std/testing/asserts.ts";
import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Footer from "../../../../www/components/gallery/Footer.tsx";

describe("Footer.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display text", () => {
    //@ts-ignore Ignore missing 'children' prop
    const { getByText, getAllByText } = render(<Footer></Footer>);
    const fresh = getByText("Fresh");
    assertEquals(fresh.textContent, "Fresh");
    const frameworkText = getAllByText("Full Stack Framework");
    assertExists(frameworkText);
  });

  it("should display menu", () => {
    //@ts-ignore Ignore missing 'children' prop
    const { getByText } = render(<Footer></Footer>);
    const menu1 = getByText("Getting Started");
    assertExists(menu1);
    const menu2 = getByText("Community");
    assertExists(menu2);
    const menu3 = getByText("Discord");
    assertExists(menu3);
  });
});
