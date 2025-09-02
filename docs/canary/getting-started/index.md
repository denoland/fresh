---
description: |
  In this chapter of the Fresh documentation, you'll be introduced to the
  framework. Create a new project, run it locally, edit and create pages, fetch
  data, handle user interactions, and deploy it.
---

Let's set up your first Fresh project. To create a new project, run this
command:

```sh Terminal
deno run -Ar jsr:@fresh/init
```

This will span a short wizard that guides you through the setup, like the
project name, if you want to use tailwindcss and if you're using vscode. Your
project folder should look like this:

```txt-files Project structure
<project root>
├── components/         # Store other components here. Can be named differently
│   └── Button.tsx
├── islands/            # Components that need JS to run client-side
│   └── Counter.tsx
├── routes/             # File system based routes
│   ├── api/
│   │   └── [name].tsx  # API route for /api/:name
│   ├── _app.tsx        # Renders the outer <html> content structure
│   └── index.tsx       # Renders /
├── static/             # Contains static assets like css, logos, etc
│   └── ...       
│
├── client.ts       # Client entry file that's loaded on every page.
├── main.ts         # The server entry file of your app
├── deno.json       # Contains dependencies, tasks, etc
└── vite.config.ts  # Vite configuration file
```

Run the `dev` task to launch your app in development mode:

```sh Terminal
deno task dev
```

Go to the URL printed in the terminal to view your app.

TODO IMAGE

## Creating our first route

Let's create a new about page at `/about`. We can do that by adding a new file
at `routes/about.tsx`.

```tsx routes/about.tsx
import { define } from "../utils.ts";

export default define.page(() => {
  return (
    <main>
      <h1>About</h1>
      <p>This is the about page.</p>
    </main>
  );
});
```

If we navigate to `/about` in the browser we'll see our newly created page.

TODO: IMAGE

## Create an island

We're going to create a countdown component that requires JavaScript to function
in the browser.

Create a new file at `islands/Countdown.tsx`

```tsx islands/Countdown.tsx
export function Countdown(props: { target: string }) {
  const count = useSignal(10);

  useEffect(() => {
    const timer = setInterval(() => {
      if (count.value <= 0) {
        clearInterval(timer);
      }

      count.value -= 1;
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (count.value <= 0) {
    return <p>Countdown: 🎉</p>;
  }

  return <p>Countdown: {count}</p>;
}
```

Let's add the countdown to our about page:

```tsx routes/about.tsx
import { define } from "../utils.ts";
import { Countdown } from "../islands/Countdown.tsx";

export default define.page(() => {
  return (
    <main>
      <h1>About</h1>
      <p>This is the about page.</p>
      <Countdown />
    </main>
  );
});
```

Now, we can see our countdown in action:

TODO: IMAGE

## Next steps

TODO
