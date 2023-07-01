import { action } from "preact-actions";

export default action(
  function multi1(element: HTMLElement, params: string) {
    element.textContent += params;
    document.body.classList.add("multi_1");

    return {
      destroy() {
        document.body.classList.remove("multi_1");
      },
    };
  },
);
