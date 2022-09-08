import { useState } from "preact/hooks";
import { Tasks } from "../components/Tasks.tsx";

interface TodoProps {
  start: number;
}

export default function Todo() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");
  function removeTask(s) {
    setTasks((p) => p.filter((e) => e != s));
  }
  return (
    <div class="flex flex-col w-full">
      <form
        class="flex gap-2 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          setTasks((p) => [...p, task]);
          setTask("");
        }}
      >
        <input
          class="w-5/6 border-1 border-gray-500 h-16 rounded p-2"
          placeholder="Write your task here..."
          type="text"
          value={task}
          onInput={(e) => setTask(e.target.value)}
        />
        <input
          type="submit"
          value="Add"
          class="w-1/6 bg-blue-600 text-gray-50 rounded"
        >
        </input>
      </form>
      <Tasks tasks={tasks} removeTask={removeTask} />
    </div>
  );
}
