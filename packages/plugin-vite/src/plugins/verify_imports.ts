import type { Plugin } from "vite";
import * as cl from "@std/fmt/colors";
import type { PluginContext } from "rollup";
import path from "node:path";
import { config } from "node:process";
import { pathWithRoot } from "../utils.ts";

export interface ImportCheckDiagnostic {
  type: "warn" | "error";
  message: string;
  description?: string;
  hint?: string;
}

export type ImportCheck = (
  id: string,
  env: "ssr" | "client",
) => ImportCheckDiagnostic | void;

export interface CheckImportOptions {
  checks: ImportCheck[];
}

export function checkImports(pluginOptions: CheckImportOptions): Plugin {
  function check(
    options: CheckImportOptions,
    id: string,
    env: "ssr" | "client",
  ): ImportCheckDiagnostic | undefined {
    for (let i = 0; i < options.checks.length; i++) {
      const check = options.checks[i];

      const result = check(id, env);
      if (result) return result;
    }
  }

  let root = "";
  let isDev = false;

  const seen = new Set<string>();

  return {
    name: "fresh:check-imports",
    enforce: "pre",
    applyToEnvironment() {
      return true;
    },
    config(_, env) {
      isDev = env.command === "serve";
    },
    configResolved(config) {
      root = pathWithRoot(config.root);
    },
    async resolveId(id, importer, options) {
      if (
        id.startsWith("\0") || id.startsWith("/@fs/") ||
        id.startsWith("fresh-island::") || id.startsWith("fresh:") ||
        id.includes("node_modules") ||
        importer &&
          (importer.startsWith("\0") || importer.includes("node_modules") ||
            importer.includes("deno::"))
      ) {
        return;
      }
      const env = options.ssr ? "ssr" : "client";

      let result: ImportCheckDiagnostic | undefined;
      if (id.startsWith(".")) {
        const resolved = await this.resolve(id, importer, options);

        if (resolved !== null) {
          const key = `${env}::${resolved.id}::${importer}`;
          if (!seen.has(key)) {
            result = check(pluginOptions, resolved.id, env);
          }

          seen.add(key);
        }
      } else {
        const key = `${env}::${id}::${importer}`;
        if (!seen.has(key)) {
          result = check(pluginOptions, id, env);
        }
        seen.add(key);
      }

      if (result) {
        const label = result.type === "warn"
          ? cl.inverse(cl.yellow(` WARN `))
          : cl.inverse(cl.red(` ERROR `));

        // deno-lint-ignore no-console
        console.log();
        // deno-lint-ignore no-console
        console.log();
        // deno-lint-ignore no-console
        console.log(`${label} ${result.message}`);
        // deno-lint-ignore no-console
        console.log();

        if (importer !== undefined) {
          const ancestors = findAncestors(this, importer, isDev);

          if (ancestors && ancestors.length > 0) {
            // deno-lint-ignore no-console
            console.log(`The specifier ${cl.cyan(`"${id}"`)} was imported in:`);
            ancestors.forEach((spec) => {
              if (path.isAbsolute(spec)) {
                spec = path.relative(root, spec);
              }
              // deno-lint-ignore no-console
              console.log(` - ${cl.cyan(spec)}`);
            });

            // deno-lint-ignore no-console
            console.log();
          }
        }

        if (result.hint) {
          // deno-lint-ignore no-console
          console.log(cl.bold(` hint: `) + result.hint);
          // deno-lint-ignore no-console
          console.log();
        }

        if (result.type === "error") {
          this.error({
            message: result.message,
            id: importer,
          });
        } else {
          this.warn({
            message: result.message,
            id: importer,
          });
        }
      }
    },
  };
}

function findAncestors(
  ctx: PluginContext,
  id: string,
  isDev: boolean,
): string[] | null {
  const mod = ctx.getModuleInfo(id);

  if (mod === null) return null;

  if (isDev || mod.importers.length === 0) {
    return [id];
  }

  for (let i = 0; i < mod.importers.length; i++) {
    const importer = mod.importers[i];

    const result = findAncestors(ctx, importer, isDev);
    if (result !== null) {
      result.push(id);
      return result;
    }
  }

  return null;
}
