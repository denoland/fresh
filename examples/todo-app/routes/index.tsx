/** @jsx h */
import { h, PageProps } from "../client_deps.ts";
import TodoItem from "../islands/TodoItem.tsx";
import { Handlers } from "../server_deps.ts";
import { createTodo, getTodos, Session } from "../utils/database.ts";
import { getSession } from "../utils/sessions.ts";
import { Todo } from "../utils/types.ts";

interface Data {
  session: Session | null;
  todos: Todo[];
  error?: string;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const session = await getSession(req.headers);
    let todos: Todo[] = [];
    if (session) {
      todos = await getTodos(session.id);
    }

    return ctx.render({ session, todos });
  },
  async POST(req, ctx) {
    const session = await getSession(req.headers);
    if (!session) {
      return new Response("Unauthorized", {
        status: 303,
        headers: { Location: "/signin" },
      });
    }
    const form = await req.formData();
    const text = form.get("text");
    if (typeof text !== "string" || text.length === 0) {
      return ctx.render({
        session,
        todos: [],
        error: "Invalid todo",
      });
    }
    const todo: Todo = {
      text,
      completed: false,
    };
    await createTodo(session.id, todo);
    return new Response("Todo added!", {
      status: 303,
      headers: { Location: "/" },
    });
  },
};

export default function Home(props: PageProps<Data>) {
  const { session, todos } = props.data;

  if (!session) {
    return (
      <div>
        You are not logged in. <a href="/signin">Sign in</a>
      </div>
    );
  }

  return (
    <div>
      <p>
        Signed in as @{session.username}. <a href="/signout">Sign out</a>
      </p>
      <form method="POST">
        <input name="text" />
        <button type="submit">Add Todo</button>
      </form>
      <ul>
        {todos.map((todo, id) => (
          <li key={id}>
            <TodoItem id={id} todo={todo} />
          </li>
        ))}
      </ul>
    </div>
  );
}
