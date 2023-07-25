---
description: |
  Data fetching in Fresh happens inside of route handler functions. These can pass route data to the page via page props.
---

Server side data fetching in Fresh is accomplished through asynchronous handler
functions. These handler functions can call a `ctx.render()` function with the
data to be rendered as an argument. This data can then be retrieved by the page
component through the `data` property on the `props`.

Here is an example:

```tsx
interface Project {
  name: string;
  stars: number;
}

export const handler: Handlers<Project> = {
  async GET(_req, ctx) {
    const project = await db.projects.findOne({ id: ctx.params.id });
    if (!project) {
      return new Response("Project not found", { status: 404 });
    }
    return ctx.render(project);
  },
};

export default function ProjectPage(props: PageProps<Project>) {
  return (
    <div>
      <h1>{props.data.name}</h1>
      <p>{props.data.stars} stars</p>
    </div>
  );
}
```

The type parameter on the `PageProps`, `Handlers`, `Handler`, and
`HandlerContext` can be used to enforce a TypeScript type to use for the render
data. Fresh enforces during type checking that the types in all of these fields
are compatible within a single page.
