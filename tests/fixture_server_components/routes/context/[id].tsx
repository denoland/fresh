import { RouteContext } from "../../../../server.ts";
import { delay, relative, SEPARATOR } from "../../../deps.ts";

export default async function Foo(_req: Request, context: RouteContext) {
  await delay(1);
  const value = JSON.stringify(context, (key, value) => {
    if (key === "outDir" || key == "staticDir") {
      return relative(Deno.cwd(), value).split(SEPARATOR).join("/");
    } else if (key === "entrypoints") {
      return {};
    }
    if (typeof value === "function") return value.constructor.name;
    if (value === undefined) return "<undefined>";
    return value;
  }, 2);

  return new Response(value, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
