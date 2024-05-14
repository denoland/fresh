import { assertEquals, fail } from "$std/testing/asserts.ts";
import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Header from "$fresh/www/components/gallery/Header.tsx";

describe("components/gallery/Header.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show 2 links", () => {
    const screen = render(<Header active="" />);
    const links = screen.getAllByRole("link");
    assertEquals(links.length, 2);
  });

  it("should show '/docs' as active", () => {
    const screen = render(<Header active="/docs" />);
    const links = screen.getAllByRole("link");
    let docsActive = false;
    for (const link of links) {
      if (link.getAttribute("href") === "/docs") {
        if (link.classList.contains("border-b-2")) {
          docsActive = true;
        }
      }
    }
    if (!docsActive) {
      fail("The '/docs' link should be active!!");
    }
  });

  it("should show '/docs' as not active", () => {
    const screen = render(<Header active="/" />);
    const links = screen.getAllByRole("link");
    let docsActive = false;
    for (const link of links) {
      if (link.getAttribute("href") === "/docs") {
        if (link.classList.contains("border-b-2")) {
          docsActive = true;
        }
      }
    }
    if (docsActive) {
      fail("The '/docs' link should NOT be active!!");
    }
  });
});
