import { TextLineStream } from "./deps.ts";

export async function startFreshServer(options: Deno.CommandOptions) {
  const serverProcess = new Deno.Command(Deno.execPath(), {
    ...options,
    stdin: "null",
    stdout: "piped",
    stderr: "inherit",
  }).spawn();

  const decoder = new TextDecoderStream();
  const lines: ReadableStream<string> = serverProcess.stdout
    .pipeThrough(decoder)
    .pipeThrough(new TextLineStream());

  let started = false;
  for await (const line of lines) {
    if (line.includes("Listening on http://")) {
      started = true;
      break;
    }
  }
  if (!started) {
    throw new Error("Server didn't start up");
  }

  return { serverProcess, lines };
}
