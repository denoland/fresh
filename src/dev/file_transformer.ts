import type { FsAdapter } from "../fs.ts";

export type TransformMode = "development" | "production";

export interface OnTransformOptions {
  filter: RegExp;
}
export type LazyProcessor = () => Promise<
  { content: string | Uint8Array; map?: string | Uint8Array }
>;
export interface OnTransformResultFile {
  content: string | Uint8Array;
  path?: string;
  map?: string | Uint8Array;
}
export interface OnTransformResultLazy {
  path?: string;
  content: LazyProcessor;
}
// deno-lint-ignore no-explicit-any
export function isLazyResult(x: any): x is OnTransformResultLazy {
  return x !== null && typeof x === "object" && "content" in x &&
    typeof x.content === "function";
}
export type OnTransformResult = OnTransformResultFile | OnTransformResultLazy;
export interface OnTransformArgs {
  path: string;
  target: string | string[];
  text: string;
  content: Uint8Array;
  mode: TransformMode;
}
export type TransformFn = (
  args: OnTransformArgs,
) =>
  | void
  | OnTransformResult
  | OnTransformResult[]
  | Promise<void | OnTransformResult | OnTransformResult[]>;

export interface Transformer {
  options: OnTransformOptions;
  fn: TransformFn;
}

export interface ProcessedFile {
  path: string;
  content: Uint8Array;
  map: Uint8Array | null;
}
export interface LazyProcessedFile {
  path: string;
  content: LazyProcessor;
}

export type ProcessFileResult = ProcessedFile | LazyProcessedFile;

export class FreshFileTransformer {
  #transformers: Transformer[] = [];
  #fs: FsAdapter;

  constructor(fs: FsAdapter) {
    this.#fs = fs;
  }

  onTransform(options: OnTransformOptions, callback: TransformFn): void {
    this.#transformers.push({ options, fn: callback });
  }

  async process(
    filePath: string,
    mode: TransformMode,
    target: string | string[],
  ): Promise<ProcessFileResult[] | null> {
    let content: Uint8Array | null = null;

    for (const { options, fn } of this.#transformers) {
      if (options.filter.test(filePath)) {
        if (content === null) {
          content = await this.#fs.readFile(filePath);
        }
        const result = await fn({
          path: filePath,
          mode,
          target,
          content,
          get text() {
            return new TextDecoder().decode(content!);
          },
        });

        if (result !== undefined) {
          if (Array.isArray(result)) {
            const out: ProcessFileResult[] = [];
            for (let i = 0; i < result.length; i++) {
              const item = result[i];
              if (typeof item.content === "function") {
                out.push({
                  content: item.content,
                  path: item.path ?? filePath,
                });
              }
            }
            return out;
          } else if (isLazyResult(result)) {
            return [{
              content: result.content,
              path: result.path ?? filePath,
            }];
          } else {
            const outContent = typeof result.content === "string"
              ? new TextEncoder().encode(result.content)
              : result.content;
            const outMap = result.map !== undefined
              ? typeof result.map === "string"
                ? new TextEncoder().encode(result.map)
                : result.map
              : null;

            return [{
              content: outContent,
              map: outMap,
              path: filePath,
            }];
          }
        }
      }
    }

    return null;
  }
}
