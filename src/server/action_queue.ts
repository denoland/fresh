export interface ActionQueueItem<
  TAction extends (...args: unknown[]) => unknown,
> {
  action: TAction;
  args?: Parameters<TAction>;
  resolve: (payload: ReturnType<TAction>) => void;
  // deno-lint-ignore no-explicit-any
  reject: (reason?: any) => void;
}

// deno-lint-ignore no-explicit-any
export class ActionQueue<TAction extends (...args: any[]) => any> {
  #pendingPromise: boolean;
  #items: ActionQueueItem<TAction>[];

  constructor() {
    this.#items = [];
    this.#pendingPromise = false;
  }

  enqueue(action: TAction, args?: Parameters<TAction>) {
    return new Promise<ReturnType<TAction>>((resolve, reject) => {
      this.#items.push({ action, args, resolve, reject });
      this.dequeue();
    });
  }

  async dequeue() {
    if (this.#pendingPromise) return false;

    const item = this.#items.shift();
    if (!item) return false;

    try {
      this.#pendingPromise = true;
      const payload = await item.action(...(item.args ?? []));
      this.#pendingPromise = false;
      item.resolve(payload);
    } catch (e) {
      this.#pendingPromise = false;
      item.reject(e);
    } finally {
      this.dequeue();
    }

    return true;
  }
}
