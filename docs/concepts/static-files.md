> TODO(lucacasonato): this page still needs to be completed

Static assets should be located under the `./static` directory. To reference a
static file in your code, use the path relative to the static folder. For
example, for a file called `user.png` located inside the static folder, the jsx
is:

```jsx
<img src="/user.png" />;
```

The static files are served by the server under 2 paths:

- The standard path: `https://mydomain/my-file.png`. For that path, no caching
  headers are added to the response.
- The "hashed" path: `https://mydomain/_frsh/static/<BUILDID>/my-file.png`. As
  you can see the `BUILDID` is injected into the path. This allow to burst the
  client cache whenever a new deployment is done. The response is served with a
  cache expiry of 1 year.

By default the `img` and `source` elements used in fresh will automatically use
the "hashed" path for the `src` and `srcset` attributes.

If you want to disable this for an element, add the data attribute
`data-no-auto-hashing` to the element.

If you want to explicitly build the `hashed` path, use the `asset` function
exported from `runtime.ts`.
