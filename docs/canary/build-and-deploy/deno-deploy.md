---
description: |
  Deploy Fresh to Deno Deploy which is an optimized edge platform.
---

[Deno Deploy](https://deno.com/deploy) is a hassle-free deployment platform for
serverless TypeScript/JavaScript applications created by us. Fresh works best
with that.

## Creating a new Deploy project

Head over to your [Deno Deploy Dashboard](https://dash.deno.com/projects) and
click on the "New Project" button. Select the GitHub repository of your project
and the branch you want to deploy from. The default branch is typically `main`
for production deployments. Follow the rest of the wizard and finish deployment
by clicking the "Deploy Project" button at the bottom. Each time new code lands
in the `main` branch, a new deployment will be made to update your website
automatically.

> [info]: Deno deploy will automatically integrate with GitHub to create preview
> deployments for every PR.
