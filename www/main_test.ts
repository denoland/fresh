import { assertEquals } from "$std/testing/asserts.ts";
import { TextLineStream } from "$std/streams/text_line_stream.ts";

Deno.test("CORS should not set on GET /fresh-badge.svg", {
  sanitizeResources: false,
}, async () => {
  const serverProcess = Deno.run({
    cmd: ["deno", "run", "-A", "./main.ts"],
    stdin: "null",
    stdout: "piped",
    stderr: "inherit",
  });
  const decoder = new TextDecoderStream();
  const lines = serverProcess.stdout.readable
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

  const res = await fetch("http://localhost:8000/fresh-badge.svg");
  await res.body?.cancel();

  assertEquals(res.headers.get("cross-origin-resource-policy"), null);

  await lines.cancel();
  serverProcess.kill("SIGTERM");
  serverProcess.close();
});
