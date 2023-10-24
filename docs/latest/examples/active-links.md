---
description: |
  Style active links with ease in Fresh
---

When Fresh renders an `<a>`-element, it will automatically add a
[data attribute](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)
to the link which can be used for styling purposes. Fresh will add one of the
two following attributes:

- `data-current` - Added to links with an exact path match
- `data-ancestor` - Added to links which partially match the current URL

## Styling with CSS

`data-*` attributes can be natively styled in CSS via attribute selectors.

```css
/* Give links pointing to the current page a green color */
a[data-current] {
  color: green;
}

/* Color all ancestor links of the current page */
a[data-ancestor] {
  color: peachpuff;
}
```

## Tailwind / Twind

In tailwind or tailwind like styling solutions you can style `data-*`-attributes
by prepending the classes with `[data-current]:`

```tsx
function Menu() {
  return (
    <a href="/foo" class="[data-current]:text-green-600">
      link to some page
    </a>
  );
}
```
