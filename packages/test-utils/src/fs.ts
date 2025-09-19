import * as path from "@std/path";

export async function writeFiles(dir: string, files: Record<string, string>) {
  const entries = Object.entries(files);
  await Promise.all(entries.map(async (entry) => {
    const [pathname, content] = entry;
    const fullPath = path.join(dir, pathname);
    try {
      await Deno.mkdir(path.dirname(fullPath), { recursive: true });
      await Deno.writeTextFile(fullPath, content);
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) {
        throw err;
      }
    }
  }));
}

export const delay = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

export async function withTmpDir(
  options?: Deno.MakeTempOptions,
): Promise<{ dir: string } & AsyncDisposable> {
  const dir = await Deno.makeTempDir(options);
  return {
    dir,
    async [Symbol.asyncDispose]() {
      if (Deno.env.get("CI") === "true") return;
      try {
        await Deno.remove(dir, { recursive: true });
      } catch {
        // deno-lint-ignore no-console
        console.warn(`Failed to clean up temp dir: "${dir}"`);
      }
    },
  };
}
