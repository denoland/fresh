import type { Plugin } from "vite";
import { STYLE_REG } from "../utils.ts";
import { UniqueNamer } from "@fresh/core/internal-dev";
import * as path from "@std/path";

export function cssPlugin(): Plugin {
  const namer = new UniqueNamer();

  const byFile = new Map<string, string>();
  const byId = new Map<string, string>();

  function getIdBySpec(spec: string): string {
    let id = byFile.get(spec);
    if (id === undefined) {
      id = namer.getUniqueName(path.basename(spec));
      byId.set(id, spec);
      byFile.set(spec, id);
    }

    return id;
  }

  return {
    name: "fresh:css",
    applyToEnvironment() {
      return true;
    },
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url!, "http://localhost");
        console.log(url.pathname);

        return next();
      });
    },
    resolveId: {
      filter: {
        id: /fresh-dep-asset::/,
      },
      handler(id) {
        console.log({ id });
        const name = id.slice("fresh-dep-asset::".length);

        const file = byId.get(name);
        // console.log("check", id, file, byId);
        if (file !== undefined) {
          return file;
        }
      },
    },

    transform: {
      filter: {
        id: STYLE_REG,
      },
      handler(code, id) {
        const replaced = code
          .replaceAll(/url\((\/@fs[^)]+?)\)/g, (m, spec) => {
            const id = getIdBySpec(spec);

            console.log({ spec });
            return `url("fresh-dep-asset::${id}")`;
          });

        let s = "";
        let start = 0;
        for (const match of replaced.matchAll(/@import\s+["']([^'"]+)["']/g)) {
          if (match[1] === "tailwindcss") continue;

          s += replaced.slice(start, match.index);
          start = match.index + match[0].length;

          const id = getIdBySpec(match[1]);

          s += `@import "/@id/fresh-dep-asset::${id}"`;
          console.log(match);
          // .replaceAll(/@import\s+["']([^'"]+)["']/g, (m, spec) => {
          //   this.
          //   console.log("f", { spec });
          //   return m;
          // });
        }

        s += replaced.slice(start);

        console.log("transform", id, s);
        return s;
      },
    },
  };
}
