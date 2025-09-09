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
deno compile --include static --include _fresh --include deno.json -A my-app _fresh/compiled-entry.js
```

The compiled entry supports two environment variables out of the box:

- `PORT` to set the port number (`PORT=4000 my-app`)
- `HOSTNAME` to set the host name number (`HOSTNAME=0.0.0.0 my-app`)
