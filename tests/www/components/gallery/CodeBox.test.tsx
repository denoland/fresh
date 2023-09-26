import { assert } from "$std/testing/asserts.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import CodeBox from "$fresh/www/components/gallery/CodeBox.tsx";

describe("components/gallery/LinkButton.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show Copy button", async () => {
    const code = "console.log('Hello World')";
    const screen = render(<CodeBox code={code} />);
    // summary
    assert(screen.getByText("Code"));
    // button text
    assert(screen.getByText("Copy"));
    const button = screen.getByRole("button");
    // click button, button text should change to "Copied!"
    fireEvent.click(button);
    const copied = await screen.findByText("Copied!");
    assert(copied);
  });

  it("should show source code", () => {
    const code = "console.log('Hello World')";
    const screen = render(<CodeBox code={code} />);
    // find code
    const codeElement = screen.getByRole("code");
    const content = codeElement.textContent;
    assert(screen.getByText((content) => content.includes("Hello World")));
  });
});
