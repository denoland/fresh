(() => {
  /** Replace a suspense component with it's final variant. */
  window.$SR = (id) => {
    const targetStart = document.getElementById("S:" + id);
    const targetEnd = document.getElementById("E:" + id);
    const replacement = document.getElementById("R:" + id);
    replacement.parentNode.removeChild(replacement);
    while (targetStart.nextSibling !== targetEnd) {
      targetStart.parentNode.removeChild(targetStart.nextSibling);
    }
    while (replacement.firstChild) {
      targetStart.parentNode.insertBefore(replacement.firstChild, targetEnd);
    }
    targetStart.parentNode.removeChild(targetStart);
    targetEnd.parentNode.removeChild(targetEnd);
  };

  /** @type {HTMLStyleElement} */
  const sheetElement = document.getElementById("__FRSH_STYLE");
  const rules = sheetElement.childNodes[0]?.textContent.split("\n");
  if (rules !== undefined) {
    sheetElement.removeChild(sheetElement.firstChild);
    for (const rule of rules) {
      sheetElement.append(document.createTextNode(rule));
    }
  }
  /** Insert new style rules. */
  window.$ST = (inserts) => {
    for (const [rule, index] of inserts) {
      sheetElement.insertBefore(
        document.createTextNode(rule),
        sheetElement.childNodes[index],
      );
    }
  };
})();
