# fresh project

### Usage

Install deployctl:

```
deno install --allow-read --allow-write --allow-env --allow-net --allow-run --no-check -r -f https://deno.land/x/deploy/deployctl.ts
```

Start the project:

```
deployctl run --no-check --watch main.ts
```

After adding, removing, or moving a page in the `pages` directory, run:

```
fresh routes
```
