import {
  assert,
  assertEquals,
  assertExists,
  assertFalse,
  assertStringIncludes,
} from "$std/testing/asserts.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Button from "../../../../www/components/gallery/Button.tsx";

describe("components/gallery/LinkButton.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show button", () => {
    const screen = render(
      <Button value="Click Me!" />,
    );
    const button = screen.getByRole("button");
    assertExists(button);
    assertEquals((button as HTMLButtonElement).value, "Click Me!");
  });
});
