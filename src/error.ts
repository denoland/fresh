import { STATUS_TEXT } from "@std/http/status";

export class HttpError extends Error {
  status: number;

  constructor(
    status: keyof typeof STATUS_TEXT,
    message: string = STATUS_TEXT[status],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.status = status;
  }
}
