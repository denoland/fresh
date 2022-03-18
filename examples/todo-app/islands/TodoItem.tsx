/** @jsx h */
import { h } from "../client_deps.ts";
import { Todo } from "../utils/types.ts";

interface TodoItemProps {
  id: number;
  todo: Todo;
}

export default function TodoItem(props: TodoItemProps) {
  const onclick = () => {
    alert(`Todo ${props.id} clicked`);
  };

  return <span onClick={onclick}>{props.todo.text}</span>;
}
