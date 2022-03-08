The next step after scaffolding out a new project, is to actually start it. To
do this you can just `deno run` the `main.ts` file with the appropriate flags.
You will need to provide permission flags for:

- **`--allow-net`**: This is required to start the HTTP server.
- **`--allow-read`**: This is required to read (static) files from disk.
- **`--allow-env`**: This is required to read environment variables that can be
  used to configure your project.
- **`--allow-run`**: This is required to shell out to `deno` and `esbuild` under
  the hood during development to do type stripping. In production this is done
  using a WebAssembly binary.

For development, you also want to run with the `--watch` flag, so the fresh
server will automatically reload whenever you make a change to your code. By
default `--watch` only watches over files in your module graph. Some project
files like static files are not part of the module graph, but you probably want
to restart/reload whenever you make a change to them too. This can be done by
passing the extra folder as an argument: `--watch=static/`.

Finally you might want to add a `--no-check` flag to disable the type checking
during development. Typically many people already get type checking from their
editor through the use of the Deno language server, so this is a good way to
speed up the inner loop iteration time. During CI you probably want to run with
`--no-check=remote` disable type checking of remote dependencies (because these
are out of your control).

Combining all of this we get the following `deno run` command:

```
$ deno run --allow-net --allow-read --allow-env --allow-run --watch=static/ --no-check main.ts
Watcher Process started.
Server listening on http://localhost:8000
```

If you now visit http://localhost:8000, you can see the running project. Try
change some of the text in `routes/index.tsx` and see how the page updates
automatically when you save the file.
