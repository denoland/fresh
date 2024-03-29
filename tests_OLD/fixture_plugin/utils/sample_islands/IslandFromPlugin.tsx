import { IS_BROWSER } from "../../../../src/runtime/utils.ts";

export default function IslandFromPlugin() {
  const id = IS_BROWSER ? "csr_alt_folder" : "ssr_alt_folder";
  return (
    <div>
      <p id={id}>{id}</p>
    </div>
  );
}
