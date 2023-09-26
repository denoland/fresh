import { assertExists, assertFalse } from "$std/testing/asserts.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Counter from "../../../www/islands/Counter.tsx";

describe("islands/Counter.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display count and increment/decrement it correctly", async () => {
    const count = 9;
    const screen = render(<Counter start={count} />);
    const plusOne = screen.getByTitle("Add 1");
    const minusOne = screen.getByTitle("Subtract 1");
    assertExists(screen.queryByText("9"));

    await fireEvent.click(plusOne);
    assertFalse(screen.queryByText("9"));
    assertExists(screen.queryByText("10"));

    await fireEvent.click(minusOne);
    assertExists(screen.queryByText("9"));
    assertFalse(screen.queryByText("10"));
  });
});
