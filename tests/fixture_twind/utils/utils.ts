/**
 * Returns the number of csstext duplicates that compare two cssrulelist.
 *
 */
export function cmpCssRules(a: CSSRuleList, b: CSSRuleList) {
  const aCssTextArray = Array.from(a).map((elem: CSSRule) => {
    return elem.cssText;
  });
  const bCssTextArray = Array.from(b).map((elem: CSSRule) => {
    return elem.cssText;
  });
  const bCssTextSet = new Set(bCssTextArray);

  const duplicateRules = aCssTextArray.filter((value) => {
    return bCssTextSet.has(value);
  });

  console.group("Duplicated cssRules");
  console.log(duplicateRules);
  console.groupEnd();

  return duplicateRules.length;
}
