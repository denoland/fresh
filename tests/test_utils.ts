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
    .pipeThrough(new TextLineStream(), {
      preventCancel: true,
    });

  let address = "";
  for await (const line of lines) {
    const match = line.match(
      /https?:\/\/localhost:\d+[\/\w_-]*/g,
    );
    if (match) {
      address = match[0];
      break;
    }
  }
  if (!address) {
    throw new Error("Server didn't start up");
  }

  return { serverProcess, lines, address };
}
