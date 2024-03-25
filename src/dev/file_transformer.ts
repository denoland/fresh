export interface OnTransformOptions {
  filter: RegExp;
}
export interface OnTransformResult {
  content?: string | Uint8Array;
  map?: string | Uint8Array;
}
export interface OnTransformArgs {
  path: string;
  content: string | Uint8Array;
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

  async process(filePath: string): Promise<void> {
    for (const { options, fn } of this.#transformers) {
      if (options.filter.test(filePath)) {
        const result = await fn({ path: filePath });
        console.log({ result });
      }
    }
  }
}
