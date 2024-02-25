import {
  assert,
  assertEquals,
  assertExists,
  assertFalse,
  assertStringIncludes,
} from "$std/testing/asserts.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import LinkButton from "../../../../www/components/gallery/LinkButton.tsx";
import IconHeart from "https://deno.land/x/tabler_icons_tsx@0.0.6/tsx/heart.tsx";

describe("components/gallery/LinkButton.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show link button title", () => {
    const screen = render(
      <LinkButton title="Link Button" href="https://google.com" />,
    );
    const anchor = screen.getByRole("link");
    const attr = anchor.getAttribute("title");
    assertEquals(attr, "Link Button");
  });

  it("should show link button classes", () => {
    const screen = render(
      <LinkButton title="Link Button" href="https://google.com" />,
    );
    const anchor = screen.getByRole("link");
    const classes = anchor.classList;
    // can only test for twind classes
    assert(classes.contains("rounded"));
    assert(classes.contains("bg-white"));
  });

  it("should show link button text", () => {
    const screen = render(
      <LinkButton title="Link Button" href="https://google.com">
        Click Me!
      </LinkButton>,
    );
    const anchor = screen.getByRole("link");
    const text = screen.getByText("Click Me!");
    assertExists(text);
  });

  it("should render IconHeart component", () => {
    const screen = render(
      <LinkButton href="https://google.com">
        <IconHeart
          class="w-5 h-5 mr-1 inline-block text-gray-400"
          aria-hidden="true"
          title="icon-heart"
        />
        Like me
      </LinkButton>,
    );
    const icon = screen.getByTitle("icon-heart");
    const hidden = icon.getAttribute("aria-hidden");
    assert(hidden);
  });
});
