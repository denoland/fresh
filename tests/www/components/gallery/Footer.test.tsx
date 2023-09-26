import { assertEquals, assertExists } from "$std/testing/asserts.ts";
import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Footer from "../../../../www/components/gallery/Footer.tsx";

describe("Footer.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display text", () => {
    //@ts-ignore asdfase
    const screen = render(<Footer></Footer>);
    const fresh = screen.getByText("Fresh");
    assertEquals(fresh.textContent, "Fresh");
    const frameworkText = screen.getAllByText("Full Stack Framework");
    assertExists(frameworkText);
  });

  it("should display menu", () => {
    //@ts-ignore asdfase
    const screen = render(<Footer></Footer>);
    const menu1 = screen.getByText("Getting Started");
    assertExists(menu1);
    const menu2 = screen.getByText("Community");
    assertExists(menu2);
    const menu3 = screen.getByText("Discord");
    assertExists(menu3);
  });

  // it("should display child elements", () => {
  //   function GetChild() {
  //     return (<div>child element</div>)
  //   }
  //   const screen = render(<Footer><GetChild/></Footer>);
  //   const child = screen.getByText("child element");
  //   assertExists(child);
  // });
});
