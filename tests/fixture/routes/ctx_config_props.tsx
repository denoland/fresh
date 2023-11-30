import { PageProps } from "$fresh/server.ts";
import { relative } from "../../deps.ts";

export default function Page(props: PageProps) {
  const value = JSON.stringify(props, (key, value) => {
    if (key === "outDir" || key == "staticDir") {
      return relative(Deno.cwd(), value);
    }
    if (typeof value === "function") return value.constructor.name;
    if (value === undefined) return "<undefined>";
    return value;
  }, 2);

  return <pre>{value}</pre>;
}
