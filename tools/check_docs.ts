import { checkDocs } from "https://raw.githubusercontent.com/denoland/std/74deffe2048df8e17a356b9bc756431544e73382/_tools/check_docs.ts";

await checkDocs([
  import.meta.resolve("../src/error.ts"),
]);
