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
  const cssRulesFRSHTWIND = useSignal<undefined | CSSRuleList>(undefined);
  const cssRulesClaimed = useSignal<undefined | CSSRuleList>(undefined);

  // Init
  useEffect(() => {
    // get <style id="__FRSH_TWIND">
    cssRulesFRSHTWIND.value = getCssrules("#__FRSH_TWIND");

    // get <style data-twind="claimed">
    // see https://github.com/tw-in-js/twind/blob/main/packages/core/src/sheets.ts#L5-L16
    cssRulesClaimed.value = getCssrules(
      '[data-twind="claimed"]:not(#__FRSH_TWIND)',
    );
  });

  return (
    <div class="p-2">
      {/* At least one class is required in the islands for hydrate to work. */}
      <h2>Check duplicated cssrules</h2>

      {/* Status of duplicates */}
      {(() => {
        if (cssRulesFRSHTWIND.value != null && cssRulesClaimed.value != null) {
          return (
            <div>
              <p>Error :</p>
              <p id="numDuplicates">
                {`${
                  cmpCssRules(
                    cssRulesFRSHTWIND.value,
                    cssRulesClaimed.value,
                  )
                }`}
              </p>
              <p>cssrules are duplicated</p>
            </div>
          );
        } else if (
          cssRulesFRSHTWIND.value != null && cssRulesClaimed.value == null
        ) {
          return <p id="okNoDuplicates">Ok : No duplicates</p>;
        } else {
          return <p id="errorNoExistsRules">Error : Cssrules does not exist</p>;
        }
      })()}
    </div>
  );
}
