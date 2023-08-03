import { dirname } from "./deps.ts";

export async function build(base: string, options: StartOptions) {
  const dir = dirname(fromFileUrl(base));
  const newManifest = await collect(dir);
  if (manifestChanged) await generate(dir, newManifest);
  const context = ServerContext;
}
