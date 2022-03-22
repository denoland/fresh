import { assert, assertEquals, TextLineStream } from "./deps.ts";

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

    const stat = await Deno.stat([dirname, t.name].join("/"));
    assertEquals(t.type === "file", stat.isFile);

    if (t.type === "directory") {
      assert(stat.isDirectory);
      await assertFileExistence(t.contents, [dirname, t.name].join("/"));
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
      Deno.chdir(tmpDirName);
      const serverProcess = Deno.run({
        cmd: ["deno", "run", "-A", "--no-check", "main.ts"],
        stdout: "piped",
      });

      const lines = serverProcess.stdout.readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

      for await (const line of lines) {
        if (line.includes("Server listening on http://")) break;
      }
      await lines.cancel();

      // Access the root page
      const res = await fetch("http://localhost:8000");
      await res.body?.cancel();
      assertEquals(res.status, 200);

      serverProcess.kill("SIGTERM");
      serverProcess.close();
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
