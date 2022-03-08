/** @jsx h */

import { h, tw } from "../client_deps.ts";

export default function WarningBanner() {
  const warning = tw`bg-yellow-100 border(1 yellow-200) p-4 mb-4`;
  return (
    <div class={warning}>
      ⚠️ Do not use `fresh` for production usecases yet, unless you are very
      actively tracking the `fresh` repository for updates. The framework is
      still undergoing very frequent core functionality changes. You can expect
      a mostly stable release around the end of March 2022.
    </div>
  );
}
