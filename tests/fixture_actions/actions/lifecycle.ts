import { action } from "preact-actions";

export default action(function lifecycle(el: HTMLElement, params: string) {
  el.textContent = "it works";
  const out = document.querySelector("#out")!;
  out.textContent += "mount:" + params;
  return {
    update(newParams: string) {
      out.textContent += " update:" + newParams;
    },
    destroy() {
      out.textContent += " destroy: done";
    },
  };
});
