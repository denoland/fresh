import { defineRoute } from "$fresh/server.ts";
import { relative, SEPARATOR } from "$fresh/tests/deps.ts";

export default defineRoute((_req, ctx) => {
  const value = JSON.stringify(ctx, (key, value) => {
    if (key === "outDir" || key == "staticDir") {
      return relative(Deno.cwd(), value).split(SEPARATOR).join("/");
    }
    if (typeof value === "function") return value.constructor.name;
    if (value === undefined) return "<undefined>";
    return value;
  }, 2);

  return (
    <pre>
     {value}
    </pre>
  );
});
