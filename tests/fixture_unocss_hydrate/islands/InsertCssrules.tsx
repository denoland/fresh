// https://github.com/denoland/fresh/pull/1050
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

/**
 * Returns a number of cssrules set by unocss.
 */
function getNumCssrules(): number | undefined {
  const elem = document.querySelector("style") as HTMLStyleElement;
  return elem.sheet?.cssRules.length;
}

export default function InsertCssrules() {
  const numDefCssRules = useSignal<number | undefined>(undefined);
  const numCssRules = useSignal<number | undefined>(undefined);
  const insertedStyles = useSignal("");

  // Init numDefCssRules
  useEffect(() => {
    numDefCssRules.value = getNumCssrules();
  }, []);

  // Init and Update numCssRules
  useEffect(() => {
    numCssRules.value = getNumCssrules();
  }, [insertedStyles.value]);

  return (
    <div>
      <h2>Insert cssrule in islands</h2>

      <div>
        <p>Default Number of __FRSH_UNOCSS CssRules :</p>
        <p id="defaultNumCssRules" class={`text-xl`}>
          {numDefCssRules.value
            ? numDefCssRules.value
            : "Error : Cannot get cssrules"}
        </p>
      </div>

      <div>
        <p>Current Number of __FRSH_UNOCSS CssRules :</p>
        <p id="currentNumCssRules" class={`text-xl ${insertedStyles.value}`}>
          {numCssRules.value
            ? numCssRules.value
            : "Error : Cannot get cssrules"}
        </p>
      </div>

      {/* Status of insert css rules */}
      {(() => {
        if (insertedStyles.value === "") {
          return <p id="waitClickButton">Please click button</p>;
        } else if (numDefCssRules.value === numCssRules.value) {
          return (
            <p id="errorInsertCssrules">
              {"Error: A cssrule has been inserted into a style sheet other than the first <style> tag (that of UnoCSS)."}
            </p>
          );
        } else {
          return <p id="okInsertCssRuleSuccess">Success</p>;
        }
      })()}

      <button
        id="insertCssRuleButton"
        onClick={() => {
          insertedStyles.value = "text-green-600";
        }}
        disabled={insertedStyles.value === "" ? false : true}
      >
        Add class to Current Number Class
      </button>
    </div>
  );
}
