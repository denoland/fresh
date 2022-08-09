/** @jsx h */
import { h } from "preact";

export function IconMinus() {
  return (
    <svg
      class="h-6 w-6"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M20 12H4"
      />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg
      class="h-6 w-6"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
  );
}

export function Leaf() {
  return (
    <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#fff" d="M0 0h24v24H0z" />
      <path
        d="M2 10.276c.862-2.673 2.155-5.259 5.603-5.69"
        stroke="#6BA377"
        stroke-width="1.724"
      />
      <path
        d="M19.091 5.146c-4.44-5.697-10.945-2.374-13.643 0 2.081-1.662 3.006 4.747 4.163 9.733.925 3.987 8.71 6.409 12.486 7.121.848-3.244 1.434-11.157-3.006-16.854Z"
        fill="#25D24B"
      />
    </svg>
  );
}
