// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $async_layout from "./routes/async/_layout.tsx";
import * as $async_index from "./routes/async/index.tsx";
import * as $async_redirect_layout from "./routes/async/redirect/_layout.tsx";
import * as $async_redirect_index from "./routes/async/redirect/index.tsx";
import * as $async_sub_layout from "./routes/async/sub/_layout.tsx";
import * as $async_sub_index from "./routes/async/sub/index.tsx";
import * as $dynamic_tenant_index from "./routes/dynamic/[tenant]/index.tsx";
import * as $files_js_layout from "./routes/files/js/_layout.js";
import * as $files_js_index from "./routes/files/js/index.js";
import * as $files_jsx_layout from "./routes/files/jsx/_layout.jsx";
import * as $files_jsx_index from "./routes/files/jsx/index.jsx";
import * as $files_ts_layout from "./routes/files/ts/_layout.ts";
import * as $files_ts_index from "./routes/files/ts/index.ts";
import * as $files_tsx_layout from "./routes/files/tsx/_layout.tsx";
import * as $files_tsx_index from "./routes/files/tsx/index.tsx";
import * as $foo_layout from "./routes/foo/_layout.tsx";
import * as $foo_bar from "./routes/foo/bar.tsx";
import * as $foo_index from "./routes/foo/index.tsx";
import * as $index from "./routes/index.tsx";
import * as $other from "./routes/other.tsx";
import * as $override_layout from "./routes/override/_layout.tsx";
import * as $override_index from "./routes/override/index.tsx";
import * as $override_layout_no_app_layout from "./routes/override/layout_no_app/_layout.tsx";
import * as $override_layout_no_app_index from "./routes/override/layout_no_app/index.tsx";
import * as $override_no_app from "./routes/override/no_app.tsx";
import * as $override_no_layout from "./routes/override/no_layout.tsx";
import * as $override_no_layout_no_app from "./routes/override/no_layout_no_app.tsx";
import * as $skip_sub_layout from "./routes/skip/sub/_layout.tsx";
import * as $skip_sub_index from "./routes/skip/sub/index.tsx";
import * as $dynamic_tenant_islands_Counter from "./routes/dynamic/[tenant]/(_islands)/Counter.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/_middleware.ts": $_middleware,
    "./routes/async/_layout.tsx": $async_layout,
    "./routes/async/index.tsx": $async_index,
    "./routes/async/redirect/_layout.tsx": $async_redirect_layout,
    "./routes/async/redirect/index.tsx": $async_redirect_index,
    "./routes/async/sub/_layout.tsx": $async_sub_layout,
    "./routes/async/sub/index.tsx": $async_sub_index,
    "./routes/dynamic/[tenant]/index.tsx": $dynamic_tenant_index,
    "./routes/files/js/_layout.js": $files_js_layout,
    "./routes/files/js/index.js": $files_js_index,
    "./routes/files/jsx/_layout.jsx": $files_jsx_layout,
    "./routes/files/jsx/index.jsx": $files_jsx_index,
    "./routes/files/ts/_layout.ts": $files_ts_layout,
    "./routes/files/ts/index.ts": $files_ts_index,
    "./routes/files/tsx/_layout.tsx": $files_tsx_layout,
    "./routes/files/tsx/index.tsx": $files_tsx_index,
    "./routes/foo/_layout.tsx": $foo_layout,
    "./routes/foo/bar.tsx": $foo_bar,
    "./routes/foo/index.tsx": $foo_index,
    "./routes/index.tsx": $index,
    "./routes/other.tsx": $other,
    "./routes/override/_layout.tsx": $override_layout,
    "./routes/override/index.tsx": $override_index,
    "./routes/override/layout_no_app/_layout.tsx":
      $override_layout_no_app_layout,
    "./routes/override/layout_no_app/index.tsx": $override_layout_no_app_index,
    "./routes/override/no_app.tsx": $override_no_app,
    "./routes/override/no_layout.tsx": $override_no_layout,
    "./routes/override/no_layout_no_app.tsx": $override_no_layout_no_app,
    "./routes/skip/sub/_layout.tsx": $skip_sub_layout,
    "./routes/skip/sub/index.tsx": $skip_sub_index,
  },
  islands: {
    "./routes/dynamic/[tenant]/(_islands)/Counter.tsx":
      $dynamic_tenant_islands_Counter,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
