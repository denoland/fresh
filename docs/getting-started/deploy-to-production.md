---
description: |
  Deploy a fresh application to Deno Deploy in seconds, making it available on
  the edge globally - resulting in fantastic user latency worldwide.
---

As a final step in the getting started guide, we'll deploy the demo site to the
public internet using [Deno Deploy][deno-deploy]. Deno Deploy is a globally
distributed edge runtime built by the Deno company that allows developers to
quickly and painlessly deploy web applications to the internet. Deno Deploy has
edge nodes all over the world that serve traffic. Because of this, users
worldwide have fantastic latency because their traffic is served from a server
that is physically close to them.

To deploy to Deno Deploy, we'll make use of the GitHub integration. To use this
the code needs to be pushed to a repository on GitHub. Once this has been done,
one must go to the [Deno Deploy dashboard][deno-deploy-dashboard] and create a
new project.

After creating the project, head to the "Git" tab in the project settings,
select the repository, the production branch (`main`) and the entrypoint file
(`main.ts`). This will link the project to the repository and automatically
deploy it to the internet. The project will now be available at
https://$PROJECT_NAME.deno.dev.

Every time the code in the GitHub repository is updated, it will be deployed
either as a preview or production deployment. Production deployments are only
created for changes to the default/production branch (often `main`).

[deno-deploy]: https://deno.com/deploy
[deno-deploy-dashboard]: https://dash.deno.com/projects
