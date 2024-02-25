---
description: |
  For cases where the latest release doesn't fit your needs.
---

Pretend you have a use case where you need to modify your project to use a
canary version of Fresh. Or you want to use a slightly different initialization
script. This page has you covered.

## Canary Fresh in `deno.json`

### Specific commit

Let's say you like living life in the fast lane, and want a particular commit.
How can you modify your project to no longer use the current release, but
instead this one particular commit? Just make the following changes to your
`deno.json`:

```diff deno.json
     "update": "deno run -A -r https://fresh.deno.dev/update ."
   },
   "imports": {
-    "$fresh/": "https://deno.land/x/fresh@1.2.0/",
+    "$fresh/": "https://raw.githubusercontent.com/denoland/fresh/the-particular-commit-hash-here/",
     "preact": "https://esm.sh/preact@10.19.6",
     "preact/": "https://esm.sh/preact@10.19.6/",
```

### Forked Fresh

Or what if you have a PR created but it's not getting merged into `main`. Don't
worry, you can use the same approach to reference any branch in a fork as well.
Here's an example of referencing a feature in a forked repository that hasn't
been merged yet (at the time of writing this):

```diff deno.json
     "update": "deno run -A -r https://fresh.deno.dev/update ."
   },
   "imports": {
-    "$fresh/": "https://deno.land/x/fresh@1.2.0/",
+    "$fresh/": "https://raw.githubusercontent.com/deer/fresh/state_in_props/",
     "preact": "https://esm.sh/preact@10.19.6",
     "preact/": "https://esm.sh/preact@10.19.6/",
```

## Creating a new project

What if you're getting into open source development, and you've of course
decided to contribute to the best, freshest project around. Maybe you want to
create a test project based on your local changes.

### Creating a project from source

Instead of doing it like this:

```sh Terminal
deno run -A -r https://fresh.deno.dev/
```

do it like this:

```sh Terminal
deno run -A -r path/to/fresh/init.ts
```

(or wherever your local code lives)

### Creating a project from the latest commit

Of course there's no reason why you have to check out the Fresh source. You can
create a project from the latest commit by combining the techniques on this page
like this:

```sh Terminal
deno run -A -r https://raw.githubusercontent.com/denoland/fresh/main/init.ts
```
