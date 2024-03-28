import { assert, type assertExists, type assertFalse } from "$std/testing/asserts.ts";
import {
  cleanup,
  type fireEvent,
  render,
  setup,
} from "$fresh-testing-library/components.ts";
import { fn } from "$fresh-testing-library/expect.ts";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import SearchButton from "../../../www/islands/SearchButton.tsx";
import docsearch from "https://esm.sh/@docsearch/js@3?target=es2020";

describe("islands/SearchButton.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should contain class applied in props", () => {
    // create mock implementation of docsearch
    // @ts-ignore mock impl
    const dsearch = fn(docsearch).mockImplementation((
      applId: string,
      apiKey: string,
      indexName: string,
      container: HTMLElement | string,
    ) => {});
    const { getByTitle } = render(
      <SearchButton class="font-bold" docsearch={dsearch} />,
    );
    const search = getByTitle("Search Button");
    assert(search.classList.contains("font-bold"));
  });
});
