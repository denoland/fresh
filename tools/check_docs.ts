import { checkDocs } from "./check_docs_lib.ts";

await checkDocs([
  import.meta.resolve("../packages/fresh/src/error.ts"),
]);
