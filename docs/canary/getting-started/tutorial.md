---
description: |
  To start a Fresh project, just run `deno task start`. This will start the
  project with default permission flags, in watch mode.
---

In this tutorial we're going to build a simple blog with an about page. The next
step after scaffolding out a new project, is to actually start it. To do this
you can run `deno task dev`.

```sh Terminal
$ deno task dev
Watcher Process started.
 🍋 Fresh ready
     Local: http://localhost:8000
```

This will start Fresh in development mode. Visit http://localhost:8000 to view
your running project. Try changing some of the text in `routes/index.tsx` and
see how the page updates automatically when you save the file.

## Your first route

Routes encapsulate the logic for handling requests to a particular path in your
project. They can be used to handle API requests or render HTML pages. For now
we are going to do the latter.

Routes are defined as files in the `routes/` directory. The file name of the
module is important: it is used to determine the path that the route will
handle.

```sh
routes
├── blog
|   ├── [id].tsx    # /blog/example-post, /blog/post2, etc
|   └── search.tsx  # /blog/search
|   └── index.tsx   # /blog
├── about.tsx       # /about
└── index.tsx       # /
```

_We'll learn more about all available ways to configure routes in the
[Routing chapter](../concepts/routing)._

Let's create an `/about` route by creating a `routes/about.tsx` file. In this
file, we can declare a component that should be rendered every time a user
visits the page. This is done with JSX, an extension to JavaScript that allows
you to embed HTML-like tags in your TypeScript/JavaScript code.

```tsx routes/about.tsx
export default function AboutPage() {
  return (
    <main>
      <h1>About</h1>
      <p>This is the about page.</p>
    </main>
  );
}
```

If you now visit http://localhost:8000/about you'll see our new route in your
browser.

> [info]: To learn more about JSX and Preact, you can follow
> [this tutorial](https://preactjs.com/tutorial) from the Preact documentation.

### Adding a dynamic route

Our page should also have a very basic blog. We want to have an index page where
we have an overview of all our blog posts and a detail page where we can view a
single blog post. But first, let's create a file that holds the actual content
of our blog posts. We'll create a file at the root of your project called
`blog-posts.ts`:

```ts blog-posts.ts
export interface BlogPost { 
  /** The blog post title */
  title: string,
  /** The blog post url segment */
  slug: string
  /** The publish date */
  date: Date
  /** The blog post content */
  content: string
}

export const posts: BlogPost[] = [
  {
    title: "My first post",
    slug: "my-first-post",
    date: new Date("2024-01-01")
    content: "This is the content of my first post"
  },
  {
    title: "This is my second post",
    slug: "my-second-post",
    date: new Date("2024-03-24")
    content: "This is the content of my second post"
  }
]
```

With our post data in place we can start building the routes for our blog. Let's
start with the blog index page by creating a new route at
`routes/blog/index.tsx`

```tsx routes/blog/index.tsx
import { posts } from "../../blog-posts.ts";

export default function BlogIndex() {
  // Sort posts in reverse order
  const sortedPosts = posts.sort((a, b) => a.getTime() - b.getTime());

  return (
    <main>
      <h1>Blog</h1>
      <ul>
        {sortedPosts.map((post) => {
          return (
            <li key={post.title}>
              <a href={`/blog/${post.slug}`}>{post.title}</a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
```

If we visit http://localhost:8000/blog we'll see a list of our blog posts. But
when we click on a link we'll get a page not found error. Let's fix that by
creating a route for viewing a single post. To do so, create a
`routes/blog/[id].tsx` file.

```tsx routes/blog/[id].tsx
import { HttpError, page } from "fresh";
import { define } from "../utils/state.ts";
import { type BlogPost, posts } from "../../blog-posts.ts";

// This is a handler that runs before rendering the page. It
// is typically used to prepare data, set HTTP headers, fetch
// additional data from other APIs and things like that.
export const handler = define.handler({
  GET(ctx) {
    // Since this file is named "[id].tsx" there will
    // be a parameter named id in `ctx.params` which contains
    // that part of the url.
    const slug = ctx.params.id;
    const post = posts.find((post) => post.slug === slug);

    // If we didn't find a post, throw a 404 not found error
    if (post === undefined) {
      throw new HttpError(404);
    }

    // We found a post, let's pass it to our component
    return page({ post });
  },
});

// Preact component that renders the blog post
export default define.page<typeof handler>(function Post(props) {
  const post = props.post;

  return (
    <main>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </main>
  );
});
```

### Adding a search page

asd

## Your first island

Every page in Fresh is server-rendered only by default. But not every page of a
website is completely static. Often you'll want some form of interactivity on
the page. Fresh does this via the so called
["Island architecture"](https://jasonformat.com/islands-architecture/).

<img src="/docs/island-visualize.png" alt="An island is an area on the page that should be interactive and run some client-side JavaScript code" style="height: 500px; display: block; margin: 0 auto;" />

In our case we're going to add an interactive counter to our about page. To do
so, we're going to create a new file at `islands/Counter.tsx`. It is important
that the file is inside the `islands/` directory as Fresh uses that to know
which files need to also run in the browser.

In this file we're going to export a Preact component that shows a counter and
has two buttons to either increment or decrement the counter value.

```tsx islands/Counter.tsx
import { useSignal } from "@preact/signals";

export function Counter() {
  const count = useSignal(0);

  return (
    <div class="counter">
      <p>Counter value: {count}</p>
      <button onClick={() => count.value++}>increment</button>
      <button onClick={() => count.value--}>decrement</button>
    </div>
  );
}
```

> [info]: A signal is a value that when updated will ensure that the UI is
> automatically updated in the most optimal way. Read more about signals here:
> https://preactjs.com/blog/introducing-signals

### Using our Counter island

Let's integrate our counter into our about page. This can be done by importing
the `Counter` component and adding it to the JSX `<Counter />`.

```tsx routes/about.tsx
import { Counter } from "../islands/Counter.tsx";

export default function AboutPage() {
  return (
    <main>
      <h1>About</h1>
      <p>This is the about page.</p>
      <h2>Here is a counter</h2>
      <Counter />
    </main>
  );
}
```

If you now visit http://localhost:8000/about you'll see our newly created
counter on the page. Click the "increment" and "decrement" button and see the
number update in the UI.
