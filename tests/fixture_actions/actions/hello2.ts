import { action } from "preact-actions";

export default action(function hello2(el: HTMLElement, params: string) {
  el.textContent = params;

  document.body.classList.add("action-hello2");

  return {
    destroy() {
      document.body.classList.remove("action-hello2");
    },
  };
});
