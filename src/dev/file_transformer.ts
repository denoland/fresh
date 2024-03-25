export type TransformMode = "development" | "production";

export interface OnTransformOptions {
  filter: RegExp;
}
export interface OnTransformResult {
  content?: string | Uint8Array;
}
export interface OnTransformArgs {
  path: string;
  content: Uint8Array;
  text: string;
  mode: TransformMode;
}
export type TransformFn = (
  args: OnTransformArgs,
) => void | OnTransformResult | Promise<void | OnTransformResult>;

export interface Transformer {
  options: OnTransformOptions;
  fn: TransformFn;
}

export interface FileTransformer {
  onTransform(
    options: OnTransformOptions,
    callback: TransformFn,
  ): void;
}

export class FreshFileTransformer implements FileTransformer {
  #transformers: Transformer[] = [];

  onTransform(options: OnTransformOptions, callback: TransformFn): void {
    this.#transformers.push({ options, fn: callback });
  }

  async process(
    filePath: string,
    mode: TransformMode,
  ): Promise<Uint8Array | null> {
    let content: Uint8Array | null = null;

    for (const { options, fn } of this.#transformers) {
      if (options.filter.test(filePath)) {
        if (content === null) {
          content = await Deno.readFile(filePath);
        }
        const result = await fn({
          path: filePath,
          mode,
          content,
          get text() {
            return new TextDecoder().decode(content!);
          },
        });

        if (result !== undefined && result.content !== undefined) {
          if (typeof result.content === "string") {
            // TODO: Remove decoding overhead?
            content = new TextEncoder().encode(result.content);
          } else {
            content = result.content;
          }
        }
      }
    }

    return content;
  }
}
