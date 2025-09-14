import type {
  InstantiateListener,
  RequestModuleMsg,
  RunnerClient,
  RunnerEvent,
} from "../connection.ts";

export class WsClient implements RunnerClient {
  socket: WebSocket;

  #instantiate = new Set<InstantiateListener>();

  #pendingModRequest = new Map<string, PromiseWithResolvers<string>[]>();

  constructor(public address: string) {
    this.socket = new WebSocket(address);
    this.socket.addEventListener("close", () => {
      const listeners = Array.from(this.#pendingModRequest.values()).flat();

      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        listener.reject(new Error(`Connection closed`));
      }
    });

    this.socket.addEventListener("message", async (ev) => {
      const msg = JSON.parse(ev.data) as RunnerEvent;
      switch (msg.type) {
        case "instantiate": {
          for (const fn of this.#instantiate.values()) {
            await fn(msg.id, msg.code);
          }
          const pending = this.#pendingModRequest.get(msg.id);
          if (pending !== undefined) {
            await Promise.all(pending.map((x) => x.resolve(msg.code)));
          }

          break;
        }
        case "request-module":
          break;
      }
    });
  }

  async requestModule(id: string): Promise<void> {
    const arr = this.#pendingModRequest.get(id) ?? [];
    const p = Promise.withResolvers<string>();

    arr.push(p);
    this.#pendingModRequest.set(id, arr);

    const ev: RequestModuleMsg = {
      type: "request-module",
      id,
    };
    this.socket.send(JSON.stringify(ev));
    await p.promise;
  }

  onInstantiate(
    fn: (id: string, code: string) => Promise<void> | void,
  ): () => void {
    this.#instantiate.add(fn);
    return () => this.#instantiate.delete(fn);
  }
}
