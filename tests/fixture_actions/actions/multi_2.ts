import { action } from "preact-actions";

export default action(
  function multi2(element: HTMLElement, params: string) {
    element.textContent += params;

    document.body.classList.add("multi_2");

    return {
      destroy() {
        document.body.classList.remove("multi_2");
      },
    };
  },
);
