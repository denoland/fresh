---
description: |
  Change the source directory to effectively manage your project.
---

When you initialize a project with `deno run -A -r https://fresh.deno.dev`,
you'll end up with a project like the following:

```
.
├── README.md
├── components
│   └── Button.tsx
├── deno.json
├── dev.ts
├── fresh.gen.ts
├── islands
│   └── Counter.tsx
├── main.ts
├── routes
│   ├── [name].tsx
│   ├── api
│   │   └── joke.ts
│   └── index.tsx
└── static
    ├── favicon.ico
    └── logo.svg
```

## Using a `src` directory

If you'd like your code to live in a `src` directory (or any other place of your
choosing), then you'll need to do the following things:

1. Move most of the code to your chosen directory. For this example I'll stick
   with `src`.
2. Modify your `deno.json` file to point to the new directory.

I initialized a new project, ran `git init` and all the steps to get an
`initial commit` for my fresh Fresh project. Then I made the above changes.
Here's what my `git status` shows:

```
modified:   deno.json
renamed:    components/Button.tsx -> src/components/Button.tsx
renamed:    dev.ts -> src/dev.ts
renamed:    fresh.gen.ts -> src/fresh.gen.ts
renamed:    islands/Counter.tsx -> src/islands/Counter.tsx
renamed:    main.ts -> src/main.ts
renamed:    routes/[name].tsx -> src/routes/[name].tsx
renamed:    routes/api/joke.ts -> src/routes/api/joke.ts
renamed:    routes/index.tsx -> src/routes/index.tsx
renamed:    static/favicon.ico -> src/static/favicon.ico
renamed:    static/logo.svg -> src/static/logo.svg
```

Here's what the diff of `deno.json` looks like:

```
--- a/deno.json
+++ b/deno.json
@@ -1,7 +1,7 @@
 {
   "lock": false,
   "tasks": {
-    "start": "deno run -A --watch=static/,routes/ dev.ts"
+    "start": "deno run -A --watch=src/static/,src/routes/ src/dev.ts"
   },
   "imports": {
     "$fresh/": "file:///Users/reed/code/fresh/",
```

(An astute observer would note that I actually generated this test project from
my local build of Fresh, via `deno run -A -r ~/code/fresh/init.ts`).

The final result of running `tree` looks like this:

```
.
├── README.md
├── deno.json
└── src
    ├── components
    │   └── Button.tsx
    ├── dev.ts
    ├── fresh.gen.ts
    ├── islands
    │   └── Counter.tsx
    ├── main.ts
    ├── routes
    │   ├── [name].tsx
    │   ├── api
    │   │   └── joke.ts
    │   └── index.tsx
    └── static
        ├── favicon.ico
        └── logo.svg
```

Success! Your code now lives elsewhere.
