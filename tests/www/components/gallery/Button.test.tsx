import { assertEquals, assertExists } from "$std/testing/asserts.ts";
import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Button from "../../../../www/components/gallery/Button.tsx";

describe("components/gallery/LinkButton.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show button", () => {
    const { getByRole } = render(
      <Button value="Click Me!" />,
    );
    const button = getByRole("button");
    assertExists(button);
    assertEquals((button as HTMLButtonElement).value, "Click Me!");
  });
});
