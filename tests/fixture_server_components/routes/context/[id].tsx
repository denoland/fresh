import { RouteContext } from "../../../../server.ts";
import { delay } from "../../../deps.ts";

export default async function Foo(_req: Request, context: RouteContext) {
  await delay(1);
  const value = JSON.stringify(context, (_key, value) => {
    if (typeof value === "function") return value.constructor.name;
    return value;
  }, 2);

  return new Response(value, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
