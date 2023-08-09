// https://github.com/denoland/fresh/pull/1050
import { useEffect } from "preact/hooks";
import { cmpCssRules } from "../utils/utils.ts";
import { useSignal } from "@preact/signals";

/**
 * Returns a cssrulelist of styleElement matching the selector.
 */
function getCssrules(selector: string) {
  const elem = document.querySelector(selector) as HTMLStyleElement;
  return elem?.sheet?.cssRules;
}

export default function CheckDuplication() {
  const cssRulesFRSHUNOCSS = useSignal<undefined | CSSRuleList>(undefined);
  const cssRulesClaimed = useSignal<undefined | CSSRuleList>(undefined);

  // Init
  useEffect(() => {
    // get <style>
    cssRulesFRSHUNOCSS.value = getCssrules("style");

    // get <style>
    cssRulesClaimed.value = getCssrules(":not(style)");
  });

  return (
    <div class="p-2">
      {/* At least one class is required in the islands for hydrate to work. */}
      <h2>Check duplicated cssrules</h2>

      {/* Status of duplicates */}
      {(() => {
        if (cssRulesFRSHUNOCSS.value != null && cssRulesClaimed.value != null) {
          return (
            <div>
              <p>Error :</p>
              <p id="numDuplicates">
                {`${
                  cmpCssRules(
                    cssRulesFRSHUNOCSS.value,
                    cssRulesClaimed.value,
                  )
                }`}
              </p>
              <p>cssrules are duplicated</p>
            </div>
          );
        } else if (
          cssRulesFRSHUNOCSS.value != null && cssRulesClaimed.value == null
        ) {
          return <p id="okNoDuplicates">Ok : No duplicates</p>;
        } else {
          return <p id="errorNoExistsRules">Error : Cssrules does not exist</p>;
        }
      })()}
    </div>
  );
}
