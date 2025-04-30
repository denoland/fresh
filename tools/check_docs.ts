import { checkDocs } from "https://raw.githubusercontent.com/denoland/std/59d3d87463e33d60f03bc93b2856549d3b17c7cc/_tools/check_docs.ts";

await checkDocs([
  import.meta.resolve("../src/error.ts"),
]);
