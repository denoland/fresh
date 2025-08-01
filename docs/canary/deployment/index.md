---
description: "Create a production build of your app"
---

When shipping an app to production, we can run a build step that optimizes
assets for consumption in the browser. This step can be invoked by running:

```sh Terminal
deno task build
# or
deno run -A dev.ts build
```

Once completed, it will have created a `_fresh` folder in the project directory
which contains the optimized assets.

> [info]: The `_fresh` folder should not be committed to git. Exclude it via
> `.gitignore`.
>
> ```gitignore .gitignore
> # Ignore fresh build directory
> _fresh/
> ```

## Running a production build

To run Fresh in production mode, run the `start` task:

```sh Terminal
deno task start
# or
deno serve -A _fresh/server.js
```

Fresh will automatically pick up the optimized assets in the `_fresh` directory.
