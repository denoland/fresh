import { checkDocs } from "https://github.com/denoland/std/raw/refs/heads/main/_tools/check_docs.ts";

await checkDocs([
  import.meta.resolve("../packages/fresh/src/error.ts"),
]);
