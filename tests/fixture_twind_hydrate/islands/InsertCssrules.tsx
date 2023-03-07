// https://github.com/denoland/fresh/pull/1050
import { useEffect, useState } from "preact/hooks";

/**
 * Returns a number of cssrules set by twind.
 */
function getNumCssrules(): number | undefined {
  const elem = document.getElementById("__FRSH_TWIND") as HTMLStyleElement;
  return elem.sheet?.cssRules.length;
}

export default function InsertCssrules() {
  const [numDefCssRules, setNumDefCssRules] = useState<number | undefined>(
    undefined,
  );
  const [numCssRules, setNumCssRules] = useState<number | undefined>(undefined);
  const [insertedStyles, setInsertedStyles] = useState("");

  // Init numDefCssRules
  useEffect(() => {
    setNumDefCssRules(getNumCssrules());
  }, []);

  // Init and Update numCssRules
  useEffect(() => {
    setNumCssRules(getNumCssrules());
  }, [insertedStyles]);

  return (
    <div>
      <h2>Insert cssrule in islands</h2>

      <div>
        <p>Default Number of __FRSH_TWIND CssRules :</p>
        <p id="defaultNumCssRules" class={`text-xl`}>
          {numDefCssRules ? numDefCssRules : "Error : Cannot get cssrules"}
        </p>
      </div>

      <div>
        <p>Current Number of __FRSH_TWIND CssRules :</p>
        <p id="currentNumCssRules" class={`text-xl ${insertedStyles}`}>
          {numCssRules ? numCssRules : "Error : Cannot get cssrules"}
        </p>
      </div>

      {/* Status of insert css rules */}
      {(() => {
        if (insertedStyles === "") {
          return <p id="waitClickButton">Plese click button</p>;
        } else if (numDefCssRules === numCssRules) {
          return (
            <p id="errorInsertCssrules">
              {'Error: A cssrule has been inserted into a style sheet other than <style id="__FRSH_TWIND">'}
            </p>
          );
        } else {
          return <p id="okInsertCssRuleSuccess">Success</p>;
        }
      })()}

      <button
        id="insertCssRuleButton"
        onClick={() => {
          setInsertedStyles("text-green-600");
        }}
        disabled={insertedStyles === "" ? false : true}
      >
        Add `text-green-600` to Cureent Number Class
      </button>
    </div>
  );
}
