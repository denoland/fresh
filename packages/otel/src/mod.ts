import { AsyncLocalStorage } from "node:async_hooks";

const ENABLED = Deno.env.get("OTEL_DENO") === "true";

const storage = new AsyncLocalStorage<Span>();

export class Span {
  status = null;
  attributes: Record<string, any> = {};
  endTime: number = 0;
  startTime: number = 0;
  exception: unknown = null;

  constructor(public name: string, public parent?: Span) {
    this.startTime = Date.now();
  }

  recordException(err: unknown) {
    this.exception = err;
  }

  setStatus(obj: any) {}

  updateName(name: string) {
    this.name = name;
  }

  setAttribute(name: string, value: unknown): void {
    this.attributes[name] = value;
  }

  end() {
    if (this.endTime === 0) {
      this.endTime = Date.now();
    }
  }
}

export interface SpanOptions {
  attributes?: Record<string, unknown>;
  startTime?: number;
}

export const enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export function recordSpanError(span: Span, err: unknown) {
  if (err instanceof Error) {
    span.recordException(err);
  } else {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: String(err),
    });
  }
}

export interface TracerCtx {
  name: string;
  version?: string;
  getActiveSpan(): Span | undefined;
}

class Tracer {
  constructor(public name: string, version?: string) {}

  getActiveSpan(): Span | undefined {
    return storage.getStore();
  }

  getTracer(name: string, version?: string): Tracer {
    return new Tracer(name, version);
  }

  startActiveSpan<T>(name: string, callback: (span: Span) => T): T;
  startActiveSpan<T>(
    name: string,
    meta: SpanOptions,
    callback: (span: Span) => T,
  ): T;
  startActiveSpan<T>(
    name: string,
    metaOrCallback: ((span: Span) => T) | SpanOptions,
    callback?: (span: Span) => T,
  ): T {
    let fn: (span: Span) => T;
    let spanOptions;
    if (typeof metaOrCallback === "function") {
      fn = metaOrCallback;
    } else {
      spanOptions = metaOrCallback;

      if (callback === undefined) {
        throw new Error("fail");
      }
      fn = callback;
    }

    const current = storage.getStore();
    const span = new Span(name, current);
    if (spanOptions !== undefined) {
      mergeSpanProps(span, spanOptions);
    }

    try {
      return storage.run(span, () => fn(span));
    } finally {
      span.end();
    }
  }

  startSpan(name: string, options: SpanOptions): Span {
    const current = storage.getStore();
    const span = new Span(name, current);

    mergeSpanProps(span, options);

    return span;
  }
}

class StubTracer {
}

export const trace = new Tracer("root");

function mergeSpanProps(span: Span, options: SpanOptions) {
  if (options.attributes !== undefined) {
    Object.assign(span.attributes, options.attributes);
  }
  if (options.startTime !== undefined) {
    span.startTime = options.startTime;
  }
}
