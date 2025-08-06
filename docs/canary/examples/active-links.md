---
description: |
  Style active links with ease in Fresh
---

Fresh automatically enhances the accessibility of `<a>` elements by adding the
aria-current attribute when rendering links that match the current URL. This
attribute is recognized by assistive technologies and clearly indicates the
current page within a set of pages.

- `aria-current="page"` - Added to links with an exact path match, enhancing
  accessibility by indicating the current page to assistive technologies.

As we aim to improve accessibility, we encourage the use of aria-current for
styling current links where applicable.

## Styling with CSS

The aria-current attribute is easily styled with CSS using attribute selectors,
providing a native way to visually differentiate the active link.

```css static/styles.css
/* Give links pointing to the current page a green color */
a[aria-current="page"] {
  color: green;
}

/* Color all ancestor links of the current page */
a[aria-current="true"] {
  color: peachpuff;
}
```

## Tailwindcss

In Tailwindcss or similar CSS frameworks, you can apply styles to elements with
the `aria-current` attribute using bracket notation in your class definitions.
For Tailwindcss, use the syntax:

```tsx components/Menu.tsx
function Menu() {
  return (
    <a href="/foo" class="aria-[current]:text-green-600">
      Link to some page
    </a>
  );
}
```
