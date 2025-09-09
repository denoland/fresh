import { DOMParser } from "linkedom";
import * as path from "@std/path";

import { launchProd } from "../packages/plugin-vite/tests/test_utils.ts";
import { createBuilder } from "vite";

const www = path.join(import.meta.dirname!, "..", "www");
const builder = await createBuilder({
  root: www,
});

await builder.buildApp();

interface CheckLink {
  url: URL;
  referrer: URL | null;
}

await launchProd({ cwd: www }, async (address) => {
  const first = new URL(address);

  const stack: CheckLink[] = [{ referrer: null, url: first }];

  const seen = new Set<string>();

  let current: CheckLink | undefined;
  while ((current = stack.pop()) !== undefined) {
    seen.add(current.url.pathname);

    // deno-lint-ignore no-console
    console.log("Checking...", current.url.href);

    const headers = new Headers();
    headers.set(
      "accept",
      "text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, */*;q=0.8",
    );
    const res = await fetch(current.url, { headers });
    const text = await res.text();

    if (res.status === 404) {
      throw new Error(
        `Failed url ${current.url.href}, referrer: ${current.referrer?.href}`,
      );
    }

    if (!res.headers.get("Content-type")?.includes("text/html")) {
      continue;
    }

    const doc = new DOMParser().parseFromString(text, "text/html");

    for (const link of doc.querySelectorAll("a")) {
      const next = new URL(link.href, first.origin);
      if (next.origin !== first.origin) continue;
      if (seen.has(next.pathname)) continue;

      stack.push({ url: next, referrer: current.url });
    }
  }
});
