import { ServerContext, Status } from "../server.ts";
import { assertEquals, assertStringIncludes } from "./deps.ts";
import manifest from "./fixture_cdn_url/fresh.gen.ts";
import { BUILD_ID } from "../src/server/build_id.ts";
import { parseHtml } from "./test_utils.ts";
import { ASSET_PATH_PREFIX } from "../src/runtime/asset_path.ts";

const APP_URL = "https://fresh.deno.dev";
const CDN_URL = "https://cdn.deno.dev";

const ctx = await ServerContext.fromManifest(manifest, {
  cdnUrl: CDN_URL,
});
const handler = ctx.handler();
const request = (url: string) => handler(new Request(url));

Deno.test(
  "check ASSET_PATH_PREFIX value matches the cdn url",
  () => {
    assertEquals(ASSET_PATH_PREFIX, `${CDN_URL}/${BUILD_ID}`);
  },
);

Deno.test(
  "check static and internal links are rendered with cdn url",
  async () => {
    const resp = await request(APP_URL);
    assertEquals(resp.status, Status.OK);
    const respBody = await resp.text();
    const doc = parseHtml(respBody);

    // static image
    assertEquals(
      doc.querySelector("#static-img")?.getAttribute("src"),
      `${CDN_URL}/${BUILD_ID}/image.png`,
    );

    // static image with srcset
    const staticImgWithSrcset = doc.querySelector("#static-img-with-srcset");
    assertEquals(
      staticImgWithSrcset?.getAttribute("src"),
      `${CDN_URL}/${BUILD_ID}/image.png`,
    );
    assertEquals(
      staticImgWithSrcset?.getAttribute("srcset"),
      `${CDN_URL}/${BUILD_ID}/image.png 1x`,
    );

    // static image in an island
    const imgInIsland = doc.querySelector("#img-in-island");
    assertEquals(
      imgInIsland?.getAttribute("src"),
      `${CDN_URL}/${BUILD_ID}/image.png`,
    );
    assertEquals(
      imgInIsland?.getAttribute("srcset"),
      `${CDN_URL}/${BUILD_ID}/image.png 1x`,
    );

    // static image in an island with srcset
    assertEquals(
      doc.querySelector("#static-file-with-helper")?.getAttribute("href"),
      `${CDN_URL}/${BUILD_ID}/brochure.pdf`,
    );

    // external files - should not be prefixed
    assertEquals(
      doc.querySelector("#external-img")?.getAttribute("src"),
      `https://fresh.deno.dev/favicon.ico`,
    );

    // internal assets and islands - should be prefixed
    assertStringIncludes(respBody, `${CDN_URL}/${BUILD_ID}/_frsh/js/main.js`);
    assertStringIncludes(
      respBody,
      `${CDN_URL}/${BUILD_ID}/_frsh/js/island-test_default.js`,
    );
  },
);

Deno.test(
  "check static files routes are not registered in the server",
  async () => {
    const resp2 = await request(`${APP_URL}/image.png`);
    assertEquals(resp2.status, Status.NotFound);

    const resp3 = await request(`${APP_URL}/style.css`);
    assertEquals(resp3.status, Status.NotFound);
  },
);

Deno.test(
  "Check internal files and islands routes are not registered  in the server",
  async () => {
    const resp4 = await request(
      `${APP_URL}/_frsh/js/${BUILD_ID}/main.js`,
    );
    assertEquals(resp4.status, Status.NotFound);

    const resp5 = await request(
      `${APP_URL}/${BUILD_ID}/_frsh/js/main.js`,
    );
    assertEquals(resp5.status, Status.NotFound);

    const resp6 = await request(
      `${APP_URL}/_frsh/js/${BUILD_ID}/island-test_default.js`,
    );
    assertEquals(resp6.status, Status.NotFound);
    const resp7 = await request(
      `${APP_URL}/${BUILD_ID}/_frsh/js/island-test_default.js`,
    );
    assertEquals(resp7.status, Status.NotFound);
  },
);
