import { assert } from "$std/testing/asserts.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import CodeBox from "$fresh/www/components/gallery/CodeBox.tsx";

describe("components/gallery/LinkButton.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show Copy button", async () => {
    const code = "console.log('Hello World')";
    const { getByText, getByRole, findByText } = render(
      <CodeBox code={code} />,
    );
    // summary
    assert(getByText("Code"));
    // button text
    assert(getByText("Copy"));
    const button = getByRole("button");
    // click button, button text should change to "Copied!"
    fireEvent.click(button);
    const copied = await findByText("Copied!");
    assert(copied);
  });

  it("should show source code", () => {
    const code = "console.log('Hello World')";
    const { getByText, getByRole } = render(<CodeBox code={code} />);
    // find code
    const codeElement = getByRole("code");
    const content = codeElement.textContent;
    // Prism library breaks up code for styling purposes
    assert(
      getByText((content) => content.includes("console")),
    );
    assert(
      getByText((content) => content.includes("log")),
    );
    assert(
      getByText((content) => content.includes("Hello World")),
    );
  });
});
