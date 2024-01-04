---
description: |
  JSX in Preact/React is merely a description of *what* to render
---

## JSX

JSX in Preact/React is merely a description of _what_ to render. For example,
this JSX syntax:

```jsx
const ui = <h1>hello world</h1>;
```

will be turned into this set of objects (simplified)

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

## Preact

Those objects are then handed over to the Preact framework and then the
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
