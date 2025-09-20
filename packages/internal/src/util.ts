export async function waitFor(
  fn: () => Promise<unknown> | unknown,
): Promise<void> {
  let now = Date.now();
  const limit = now + 2000;

  while (now < limit) {
    try {
      if (await fn()) return;
    } catch (err) {
      if (now > limit) {
        throw err;
      }
    } finally {
      await new Promise((r) => setTimeout(r, 250));
      now = Date.now();
    }
  }

  throw new Error(`Timed out`);
}

export function usingEnv(name: string, value: string): Disposable {
  const prev = Deno.env.get(name);
  Deno.env.set(name, value);
  return {
    [Symbol.dispose]: () => {
      if (prev === undefined) {
        Deno.env.delete(name);
      } else {
        Deno.env.set(name, prev);
      }
    },
  };
}
