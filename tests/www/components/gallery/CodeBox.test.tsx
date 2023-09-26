import {
  assert,
  assertEquals,
  assertExists,
  assertFalse,
  assertStringIncludes,
} from "$std/testing/asserts.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import CodeBox from "$fresh/www/components/gallery/CodeBox.tsx";

describe("components/gallery/LinkButton.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show code", async () => {
    const code = "console.log('Hello World')";
    const screen = render(<CodeBox code={code} />);
    assert(screen.getByText("Code"));
    const button = screen.getByRole("button");
    fireEvent.click(button);
    const copy = await screen.findByText("Copied!");
    console.log("copy", copy);
    // fireEvent.click(button);
    // assertEquals((button as HTMLButtonElement).value, "Copy");
    // console.log("CODE", (button as HTMLButtonElement).value);
    // screen.debug();
  });
});
