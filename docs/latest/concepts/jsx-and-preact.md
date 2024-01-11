---
description: |
  Deep dive into JSX and Preact
---

## JSX

JSX (JavaScript XML) is a syntax extension for JavaScript that allows developers
to write HTML-like code inside a JavaScript file. For example:

```jsx
const ui = <h1>hello world</h1>;
```

This syntax will be converted into this set of objects (simplified):

```js
const ui = {
  type: "h1",
  props: {
    type: "#text",
    props: {
      children: "hello world",
    },
  },
};
```

## How web frameworks work

These UI objects are then handed over to the web framework and then the
framework figures out how to create HTML out of that. The real value comes when
you do that in the browser and in Fresh with islands. When you update something
in your app, let's say a simple counter app and you increment the counter, then
you expect the UI to update.

Blowing away the whole DOM in the page whenever the UI updates and recreating it
from scratch would be way to expensive and feel very sluggish for the user. So
frameworks try to minimize touching the DOM as much as possible.

With the JSX object representation from the snippet above, frameworks can
compare the currently rendered UI with the new one and detect the differences.
When a difference is detected it will update the DOM accordingly. This in effect
means only the stuff that changed will be updated and all the rest of the DOM is
left untouched.

Notice, how we never had to care about how those updates are done. We never had
to call `document.createElement("h1")` ourselves, nor did we have to figure out
what to do when the element already exists and only the text changes. That's all
done by the framework. We just hand it over a set of objects what we want the UI
to look like and it figures out how to do that

## Why did Fresh pick Preact instead of any other frameworks?

Lots of frameworks support TypeScript or could be used as underpinnings for the
island architecture (see Astro). Fresh mainly picked Preact because it makes it
easy to integrate with because it's pretty much the only framework that has a
pluggable API to hook into the rendering mechanism at the time. For all other
Frameworks you'd need to enhance the framework itself to support islands, but
with Preact you can add it without having to change Preact itself. The fact that
it's small and has a familiar API for many web developers helps too.

What Fresh gives you compared to using Preact alone is:

- routing automatic
- bundling of islands and the machinery to make them interactive on page load
  (remember Preact is just a JS lib not a build tool)
- a serialization layer that supports preact signals to transfer island props to
  the browser
- an API layer
- dev stuff like reloading the page when a component changes
- a server in general

All in all Fresh is a somewhat minimal wrapper around Preact. It's a similar
relationship as Next.js has with React.
