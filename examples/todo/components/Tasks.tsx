import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { Task } from "./Task.tsx"

export function Tasks({tasks,removeTask}) {
  return (
    <div class="flex flex-col gap-2 pt-2 w-full">{tasks.map((task) => <Task task={task} removeTask={removeTask} />)}</div>
  );
}
