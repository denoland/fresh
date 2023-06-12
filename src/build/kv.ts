import { getFile, housekeep, isSupported, saveFile } from "./kvfs.ts";

const IS_CHUNK = /\/chunk-[a-zA-Z0-9]*.js/;
const DEPENDENCIES_SNAP = "dependencies.snap.json";

export const getDependencies = async () => {
  const deps = await getFile(DEPENDENCIES_SNAP);

  if (!deps) {
    return null;
  }

  const json = await new Response(deps).json();
  return new Map<string, string[]>(json);
};

export const saveDependencies = (deps: Map<string, string[]>) =>
  saveFile(
    DEPENDENCIES_SNAP,
    new TextEncoder().encode(
      JSON.stringify([...deps.entries()]),
    ),
  );

export const saveSnapshot = async (
  filesystem: Map<string, Uint8Array>,
  dependencies: Map<string, string[]>,
) => {
  if (!isSupported()) return;

  // We need to save chunks first, islands/plugins last so we address esm.sh build instabilities
  const chunksFirst = [...filesystem.keys()].sort((a, b) => {
    const aIsChunk = IS_CHUNK.test(a);
    const bIsChunk = IS_CHUNK.test(b);
    const cmp = a > b ? 1 : a < b ? -1 : 0;
    return aIsChunk && bIsChunk ? cmp : aIsChunk ? -10 : bIsChunk ? 10 : cmp;
  });

  let start = performance.now();
  for (const path of chunksFirst) {
    const content = filesystem.get(path);

    if (content instanceof ReadableStream) {
      console.info("streams are not yet supported on KVFS");
      return;
    }

    if (content) await saveFile(path, content);
  }

  const deps = new Map<string, string[]>();
  for (const dep of chunksFirst) {
    deps.set(dep, dependencies.get(dep)!);
  }
  await saveDependencies(deps);

  let dur = (performance.now() - start) / 1e3;
  console.log(` 💾 Save bundle to Deno.KV: ${dur.toFixed(2)}s`);

  start = performance.now();
  await housekeep();
  dur = (performance.now() - start) / 1e3;
  console.log(` 🧹 Housekeep Deno.KV: ${dur.toFixed(2)}s`);
};
