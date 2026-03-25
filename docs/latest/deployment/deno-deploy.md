---
description: "Deploy Fresh on Deno Deploy"
---

The recommended way to deploy Fresh is by using
[Deno Deploy](https://deno.com/deploy). It will automatically create branch
previews for pull requests, collect request and HTTP metrics, as well has
collect traces for you out of the box.

1. Log in to [Deno Deploy](https://deno.com/deploy)
1. Create a new app
1. Link your GitHub repository
1. Pick the "Fresh" preset if it's not already detected automatically

Every time you merge into the `main` branch a new production deployment will be
created.
