import { action } from "preact-actions";

export default action(
  function helloAction(element: HTMLElement, params: string) {
    element.textContent = params;
  },
);
