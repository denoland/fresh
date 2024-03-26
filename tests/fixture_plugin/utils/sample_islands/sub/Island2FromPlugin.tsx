import { IS_BROWSER } from "../../../../../src/runtime/utils.ts";

export default function Island2FromPlugin() {
  const id = IS_BROWSER ? "csr_alt_folder2" : "ssr_alt_folder2";
  return (
    <div>
      <p id={id}>{id}</p>
    </div>
  );
}
