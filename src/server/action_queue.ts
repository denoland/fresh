interface ActionQueueItem<TAction extends (...args: unknown[]) => unknown> {
  action: TAction;
  args?: Parameters<TAction>;
  resolve: (payload: ReturnType<TAction>) => void;
  // deno-lint-ignore no-explicit-any
  reject: (reason?: any) => void;
}

// deno-lint-ignore no-explicit-any
class ActionQueue<TAction extends (...args: any[]) => any> {
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

const q = new ActionQueue();
const start = Date.now();

async function original(...args: any) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return args[0];
}

function sync(...args: any) {
  return args[0];
}
const ns = [0, 1, 2, 3, 4];

function originalMap() {
  return Promise.all(ns.map((v) => {
    return original(v);
  }));
}
function wrappedMap() {
  return Promise.all(ns.map((v) => {
    return q.enqueue(original, [v]);
  }));
}
function syncMap() {
  return Promise.all(ns.map((v) => {
    return q.enqueue(sync, [v]);
  }));
}

// console.log(await originalMap());
// console.log(await wrappedMap());
console.log(await syncMap());
// console.log(await original(1, "a"));

console.log(Date.now() - start);

// this.#renderQueue = new ActionQueue<RenderAsyncFunction>();

// // Create a render queue, and wrap all the render functions
// this.#renderAsyncFn = async (...args) => {
//   try {
//     const result = await this.#renderQueue?.enqueue(
//       renderfn as RenderAsyncFunction,
//       args,
//     );
//     return result;
//   } catch (error) {
//     throw error;
//   }
// };
