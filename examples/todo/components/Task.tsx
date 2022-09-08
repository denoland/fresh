import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export function Task(props) {
  return (
    <div class="w-full bg-gray-50 h-16 text-black rounded shadow flex justify-between items-center content-between">
      <p class="p-2 w-5/6">
        {props.task}
      </p>
      <button
        onClick={() => props.removeTask(props.task)}
        class="w-1/6 bg-red-100 h-full"
      >
        Done
      </button>
    </div>
  );
}
