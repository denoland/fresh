import { assert, assertEquals, delay, TextLineStream } from "./deps.ts";

type FileTree = {
  type: "file";
  name: string;
} | {
  type: "directory";
  name: string;
  contents: FileTree[];
} | {
  type: "report";
  directories: number;
  files: number;
};

const assertFileExistence = async (tree: FileTree[], dirname?: string) => {
  for (const t of tree) {
    if (t.type === "report") continue;

    const stat = await Deno.stat(
      dirname ? [dirname, t.name].join("/") : t.name,
    );
    assertEquals(t.type === "file", stat.isFile);

    if (t.type === "directory") {
      assert(stat.isDirectory);
      await assertFileExistence(
        t.contents,
        dirname ? [dirname, t.name].join("/") : t.name,
      );
    }
  }
};

Deno.test({
  name: "fresh init",
  async fn(t) {
    // Preparation
    const tmpDirName = await Deno.makeTempDir();

    await t.step("execute init command", async () => {
      const cliProcess = Deno.run({
        cmd: ["deno", "run", "-A", "--no-check", "cli.ts", "init", tmpDirName],
        stdout: "null",
      });
      const { code } = await cliProcess.status();
      cliProcess.close();
      assertEquals(code, 0);
    });

    // NOTE: generated by `tree -J <dir>`
    const targetFileTree: FileTree[] = [
      {
        "type": "directory",
        "name": tmpDirName,
        "contents": [
          { "type": "file", "name": "README.md" },
          { "type": "file", "name": "client_deps.ts" },
          { "type": "file", "name": "fresh.gen.ts" },
          {
            "type": "directory",
            "name": "islands",
            "contents": [
              { "type": "file", "name": "Counter.tsx" },
            ],
          },
          { "type": "file", "name": "main.ts" },
          {
            "type": "directory",
            "name": "routes",
            "contents": [
              { "type": "file", "name": "[name].tsx" },
              {
                "type": "directory",
                "name": "api",
                "contents": [
                  { "type": "file", "name": "joke.ts" },
                ],
              },
              { "type": "file", "name": "index.tsx" },
            ],
          },
          { "type": "file", "name": "server_deps.ts" },
        ],
      },
      { "type": "report", "directories": 3, "files": 9 },
    ];
    await t.step("check generated files", async () => {
      await assertFileExistence(targetFileTree);
    });

    await t.step("start up the server and access the root page", async () => {
      const serverProcess = Deno.run({
        cmd: ["deno", "run", "-A", "--no-check", "main.ts"],
        stdout: "piped",
        stderr: "inherit",
        cwd: tmpDirName,
      });

      const lines = serverProcess.stdout.readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

      let started = false;
      for await (const line of lines) {
        console.log(line);
        if (line.includes("Server listening on http://")) {
          started = true;
          break;
        }
      }
      if (!started) {
        throw new Error("Server didn't start up");
      }

      await delay(500);

      // Access the root page
      const res = await fetch("http://localhost:8000");
      await res.body?.cancel();
      assertEquals(res.status, 200);

      await lines.cancel();
      serverProcess.kill("SIGTERM");
      serverProcess.close();
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
