/**
 * Returns the number of string duplicates that compare two string[].
 */
export function cmpStringArray(a: string[], b: string[]) {
  const bSet = new Set(b);

  const duplicateString = a.filter((value) => {
    return bSet.has(value);
  });

  return duplicateString.length;
}

/**
 * Returns the number of csstext duplicates that compare two cssrulelist.
 */
export function cmpCssRules(a: CSSRuleList, b: CSSRuleList) {
  const aCssTextArray = Array.from(a).map((elem: CSSRule) => {
    return elem.cssText;
  });
  const bCssTextArray = Array.from(b).map((elem: CSSRule) => {
    return elem.cssText;
  });

  return cmpStringArray(aCssTextArray, bCssTextArray);
}
