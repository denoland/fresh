import type { ModuleInstance } from "./shared.ts";

let MSG_ID = 0;
function getMessageId(): number {
  return MSG_ID++;
}

export type Dispose = () => void;

export type InstantiateListener = (
  id: string,
  code: string,
) => Promise<void> | void;

export type RequestModuleListener = (id: string) => Promise<void> | void;

export interface RunnerClient {
  requestModule(id: string): void;
  onInstantiate(fn: InstantiateListener): void;
}

export interface RunnerHost {
  instantiateModule(id: string, code: string): Promise<void>;
  loadModule(id: string): Promise<ModuleInstance>;
}

export class RunnerEventEmitter {
  // deno-lint-ignore no-explicit-any
  #byEvent = new Map<string, Set<(ev: any) => void>>();
  #acks = new Map<number, PromiseWithResolvers<RunnerEvent>>();

  async waitFor<RunnerEvent>(
    msgId: number,
    timeoutMs = 10_000,
  ): Promise<RunnerEvent> {
    const p = this.#acks.get(msgId);
    if (p === undefined) {
      throw new Error(`Unknown messageId: ${msgId}`);
    }

    return await (Promise.race([
      new Promise<RunnerEvent>((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out`)), timeoutMs)
      ),
      p.promise,
    ])) as Promise<RunnerEvent>;
  }

  dispatch(ev: RunnerEvent, ack?: boolean): number {
    let id = -1;

    const listeners = this.#byEvent.get(ev.type);
    if (listeners === undefined) return id;

    if (ack) {
      id = getMessageId();
      this.#acks.set(id, Promise.withResolvers<RunnerEvent>());
    }

    for (const fn of listeners.values()) {
      fn(ev);
    }

    return id;
  }

  on<T extends keyof RunnerEventMap>(
    event: T,
    fn: (ev: RunnerEventMap[T]) => void,
  ): Dispose {
    const l = this.#byEvent.get(event) ?? new Set();
    l.add(fn);
    this.#byEvent.set(event, l);

    return () => this.#byEvent.get(event)?.delete(fn);
  }
}

export interface RunnerEventMap {
  instantiate: InstantiateMsg;
  "request-module": RequestModuleMsg;
  ack: AckMsg;
  custom: CustomMsg;
}

export interface AckMsg {
  type: "ack";
  id: string;
}

export interface CustomMsg {
  type: "custom";
  data: unknown;
}

export interface InstantiateMsg {
  type: "instantiate";
  id: string;
  code: string;
}

export interface RequestModuleMsg {
  type: "request-module";
  id: string;
}

export type RunnerEvent = InstantiateMsg | RequestModuleMsg;
