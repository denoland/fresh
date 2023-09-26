import { Signal, signal } from "@preact/signals";
import {
  assert,
  assertEquals,
  assertExists,
  assertFalse,
} from "$std/testing/asserts.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import Input from "../../../../www/components/gallery/Input.tsx";

describe("Input.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should be disabled", () => {
    const screen = render(<Input placeholder="text input" disabled />);
    const input = screen.getByPlaceholderText("text input");
    assert((input as HTMLInputElement).disabled);
  });
});
