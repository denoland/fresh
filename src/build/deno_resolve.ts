import { colors } from "../server/deps.ts";
import { esbuildTypes, posix } from "./deps.ts";

export function denoResolve(): esbuildTypes.Plugin {
  const NODE_BUILTINS =
    /^(?:_http_agent|_http_client|_http_common|_http_incoming|_http_outgoing|_http_server|_stream_duplex|_stream_passthrough|_stream_readable|_stream_transform|_stream_wrap|_stream_writable|_tls_common|_tls_wrap|assert|assert[/]strict|async_hooks|buffer|child_process|cluster|console|constants|crypto|dgram|diagnostics_channel|dns|dns[/]promises|domain|events|fs|fs[/]promises|http|http2|https|inspector|module|net|os|path|path[/]posix|path[/]win32|perf_hooks|process|punycode|querystring|readline|readline[/]promises|repl|stream|stream[/]consumers|stream[/]promises|stream[/]web|string_decoder|sys|timers|timers[/]promises|tls|trace_events|tty|url|util|util[/]types|v8|vm|worker_threads|zlib)$/;

  return {
    name: "fresh-deno-resolve",
    setup(build) {
      const moduleGraph = new Map<
        string,
        { id: string; importedBy: string[]; dependsOn: string[] }
      >();

      build.onResolve({ filter: /.*/ }, (args) => {
        const file = args.path.startsWith(".")
          ? posix.join(posix.dirname(args.importer), args.path)
          : args.path;

        if (!moduleGraph.has(file)) {
          moduleGraph.set(file, {
            id: file,
            dependsOn: [],
            importedBy: [],
          });
        }
        if (args.importer !== "") {
          moduleGraph.get(file)!.importedBy.push(args.importer);
        }

        return undefined;
      });

      // Ignore node builtins for now
      build.onResolve({ filter: NODE_BUILTINS }, (args) => {
        console.log(
          "FAIL",
          args.importer,
          Array.from(moduleGraph.keys()).filter((x) => x.includes("svgo")),
        );
        throw new Error(
          `Node builtin modules cannot be bundled for the browser. This happens when you import code intended for the server in your islands somewhere. Maybe that happens via a deps.ts file?`,
        );
        console.warn(
          colors.yellow(
            `Attempted to include node builtin module "${args.path}" in the browser bundler. `,
          ),
        );
        return {
          path: `node:${args.path}`,
          external: true,
        };
      });
    },
  };
}
