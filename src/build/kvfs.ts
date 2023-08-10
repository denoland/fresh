import { BUILD_ID } from "../server/build_id.ts";

const CHUNKSIZE = 65536;
const NAMESPACE = ["_frsh", "js", BUILD_ID];

// @ts-ignore as `Deno.openKv` is still unstable.
const kv = await Deno.openKv?.().catch((e) => {
  console.error(e);

  return null;
});

export const isSupported = () => kv != null;

export const getFile = async (file: string) => {
  if (!isSupported()) return null;

  const filepath = [...NAMESPACE, file];
  const metadata = await kv!.get(filepath).catch(() => null);

  if (metadata?.versionstamp == null) {
    return null;
  }

  console.log(` 🚣 Streaming from Deno.KV ${file}`);

  return new ReadableStream<Uint8Array>({
    start: async (sink) => {
      for await (const chunk of kv!.list({ prefix: filepath })) {
        sink.enqueue(chunk.value as Uint8Array);
      }
      sink.close();
    },
  });
};

export const saveFile = async (file: string, content: Uint8Array) => {
  if (!isSupported()) return null;

  const filepath = [...NAMESPACE, file];
  const metadata = await kv!.get(filepath);

  // Current limitation: As of May 2023, KV Transactions only support a maximum of 10 operations.
  let transaction = kv!.atomic();
  let chunks = 0;
  for (; chunks * CHUNKSIZE < content.length; chunks++) {
    transaction = transaction.set(
      [...filepath, chunks],
      content.slice(chunks * CHUNKSIZE, (chunks + 1) * CHUNKSIZE),
    );
  }
  const result = await transaction
    .set(filepath, chunks)
    .check(metadata)
    .commit();

  return result.ok;
};

export const housekeep = async () => {
  if (!isSupported()) return null;

  for await (
    const item of kv!.list({ prefix: ["_frsh", "js"] })
  ) {
    if (item.key.includes(BUILD_ID)) continue;

    await kv!.delete(item.key);
  }
};
