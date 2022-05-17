> TODO(lucacasonato): this page still needs to be completed

Static assets should be located under the `./static` directory. To reference a
static file in your code, use the path relative to the static folder, prefixed
by a `/`. For example, for a file called `user.png` located inside the static
folder, the jsx is:

```jsx
<img src="/user.png" />;
```

For the `src` and `srcset` attributes of the `img` and `source` elements, Fresh
will automatically add a query parameter with the deployment id and served with
cache control of 1 year.

If you want to disable this for an element, add the data attribute
`data-no-auto-hashing` to the element.

All other static files are served without caching.

If you want to explicitly serve a static file with caching, use the `asset`
function exported from `runtime.ts`.
