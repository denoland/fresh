/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";

export default function WarningBanner() {
  const warning = tw`bg-yellow-100 border(1 yellow-200) p-4 mb-4`;
  return (
    <div class={warning}>
      ⚠️ Do not use Fresh for production usecases yet, unless you are very
      actively tracking the Fresh repository for updates. The framework is still
      undergoing very frequent core functionality changes. You can expect a
      mostly stable release very soon.
    </div>
  );
}
