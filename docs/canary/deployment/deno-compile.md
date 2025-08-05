---
description: "Generate a self contained executable with deno compile."
---

You can create a self-contained executable out of your app with the
[`deno compile` command](https://docs.deno.com/runtime/reference/cli/compile/).
It will include all assets and dependencies. This executable can run on any
platform without requiring Deno to be installed.

```sh
# Build your app first
$ deno task build
# Generate self-contained executable
deno compile --include static --include _fresh --include deno.json -A _fresh/compiled-entry.js
```
