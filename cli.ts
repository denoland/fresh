import { join, toFileUrl } from "https://deno.land/std@0.95.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.95.0/fs/walk.ts";

const files = [];
const pagesDir = join(Deno.cwd(), "./pages");
const pagesUrl = new URL(pagesDir, "file:///");
for await (
  const entry of walk(pagesDir, {
    includeDirs: false,
    includeFiles: true,
    exts: ["tsx", "jsx"],
  })
) {
  if (entry.isFile) {
    const file = toFileUrl(entry.path).href.substring(pagesUrl.href.length);
    files.push(file);
  }
}

const output = `import { setup } from "../server.ts";

${files.map((file, i) => `import * as $${i} from "./pages${file}";`).join("\n")}

setup([${
  files.map((file, i) => `[$${i}, "./pages${file}"]`)
    .join(", ")
}], import.meta.url);
`;

Deno.writeTextFile("./server.ts", output);
