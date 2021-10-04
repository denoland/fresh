/** @jsx h */
import { h, HandlerContext, Suspense, useData } from "../deps.ts";
import { getDatabase, Todo } from "../utils/database.ts";

export default function TodoListPage() {
  return (
    <div>
      <h1>Your TODOs</h1>
      <AddTodoForm />
      <Suspense fallback={<p>Loading...</p>}>
        <TodoList />
      </Suspense>
    </div>
  );
}

function AddTodoForm() {
  return (
    <form method="POST">
      <input type="text" name="text" />
      <button type="submit" style="margin-left: 4px">Add</button>
    </form>
  );
}

function TodoList() {
  const todos = useData<Todo[]>("todos", async () => {
    const db = await getDatabase();
    const todos = await db.listTodos();
    return todos;
  });
  return (
    <ul>
      {todos.map((todo) => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  );
}

export const handler = {
  async POST(ctx: HandlerContext): Promise<Response> {
    const form = await ctx.req.formData();
    const text = form.get("text");
    if (typeof text !== "string") {
      return new Response("misformed form", { status: 400 });
    }
    const db = await getDatabase();
    await db.addTodo(text);
    return Response.redirect(ctx.req.url, 303);
  },
};
