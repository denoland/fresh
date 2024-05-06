import { MODE } from "./runtime/server/mod.tsx";

export class HttpError {
  #error: Error | null = null;
  name = "HttpError";

  constructor(
    public status: number,
    public options?: ErrorOptions,
  ) {
    if (MODE !== "production") {
      this.#error = new Error();
    }
  }

  get stack(): string | undefined {
    return this.#error?.stack;
  }
}
