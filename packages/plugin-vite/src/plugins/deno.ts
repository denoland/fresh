import type { Plugin } from "vite";
import {
  type Loader,
  RequestedModuleType,
  ResolutionMode,
  Workspace,
} from "@deno/loader";
import * as path from "@std/path";

interface DenoState {
  type: RequestedModuleType;
}

export function deno(): Plugin {
  let loader: Loader;

  return {
    name: "deno",
    async configResolved() {
      // TODO: Pass conditions
      loader = await new Workspace({}).createLoader();
    },
    applyToEnvironment() {
      return true;
    },
    async resolveId(id, importer, options) {
      // Workaround until upstream PR is merged and released,
      // see: https://github.com/vitejs/vite/pull/20558
      if (id.startsWith("deno-npm:")) {
        id = id.slice("deno-".length);
      }

      importer = isDenoSpecifier(importer)
        ? parseDenoSpecifier(importer).specifier
        : importer;

      try {
        // Ensure we're passing a valid importer that Deno understands
        const denoImporter = importer && !importer.startsWith("\0")
          ? importer
          : undefined;

        let resolved = await loader.resolve(
          id,
          denoImporter,
          ResolutionMode.Import,
        );

        if (id === resolved) {
          return id;
        }

        const type = getDenoType(options.attributes.type ?? "default");
        if (
          type !== RequestedModuleType.Default ||
          /^(https?|jsr|npm):/.test(resolved) ||
          // Vite does weird things to windows file paths
          Deno.build.os === "windows"
        ) {
          return toDenoSpecifier(resolved, type);
        }

        if (resolved.startsWith("file://")) {
          resolved = path.fromFileUrl(resolved);
        }

        return {
          id: resolved,
          meta: {
            deno: {
              type,
            },
          },
        };
      } catch {
        // ignore
      }
    },
    async load(id) {
      if (isDenoSpecifier(id)) {
        const { type, specifier } = parseDenoSpecifier(id);

        const result = await loader.load(specifier, type);
        if (result.kind === "external") {
          return null;
        }

        return {
          code: new TextDecoder().decode(result.code),
        };
      }

      if (id.startsWith("\0")) {
        id = id.slice(1);
      }

      const meta = this.getModuleInfo(id)?.meta.deno as
        | DenoState
        | undefined
        | null;

      if (meta === null || meta === undefined) return;

      const url = path.toFileUrl(id);

      const result = await loader.load(url.href, meta.type);
      if (result.kind === "external") {
        return null;
      }

      return {
        code: new TextDecoder().decode(result.code),
      };
    },
    async transform(_, id, options) {
      // This transform is a hack to be able to re-use Deno's precompile
      // jsx transform.
      if (!options?.ssr || !id.endsWith(".tsx") || id.endsWith(".jsx")) {
        return;
      }

      let actualId = id;
      if (isDenoSpecifier(id)) {
        const { specifier } = parseDenoSpecifier(id);
        actualId = specifier;
      }
      if (path.isAbsolute(actualId)) {
        actualId = path.toFileUrl(actualId).href;
      }

      const resolved = await loader.resolve(
        actualId,
        undefined,
        ResolutionMode.Import,
      );
      const result = await loader.load(resolved, RequestedModuleType.Default);
      if (result.kind === "external") {
        return;
      }

      const code = new TextDecoder().decode(result.code);

      return {
        code,
      };
    },
  };
}

export type DenoSpecifier = string & { __deno: string };

function isDenoSpecifier(str: unknown): str is DenoSpecifier {
  return typeof str === "string" && str.startsWith("\0deno::");
}

function toDenoSpecifier(spec: string, type: RequestedModuleType) {
  return `\0deno::${type}::${spec}`;
}

function parseDenoSpecifier(
  spec: DenoSpecifier,
): { type: RequestedModuleType; specifier: string } {
  const match = spec.match(/^\0deno::([^:]+)::(.*)$/)!;

  let specifier = match[2];

  const specMatch = specifier.match(/^(\w+):\/([^/].*)$/);
  if (specMatch !== null) {
    const protocol = specMatch[1];

    let rest = specMatch[2];
    if (protocol === "file") {
      rest = "/" + rest;
    }

    specifier = `${protocol}://${rest}`;
  }

  return { type: +match[1], specifier };
}

function getDenoType(type: string): RequestedModuleType {
  switch (type) {
    case "json":
      return RequestedModuleType.Json;
    case "bytes":
      return RequestedModuleType.Bytes;
    case "text":
      return RequestedModuleType.Text;
    default:
      return RequestedModuleType.Default;
  }
}
