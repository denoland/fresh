import { PageProps } from "$fresh/server.ts";
import { relative, SEPARATOR } from "../../deps.ts";

export default function Page(props: PageProps) {
  const value = JSON.stringify(props, (key, value) => {
    if (key === "outDir" || key == "staticDir") {
      return relative(Deno.cwd(), value).split(SEPARATOR).join("/");
    }
    if (typeof value === "function") return value.constructor.name;
    if (value === undefined) return "<undefined>";
    return value;
  }, 2);

  return <pre>{value}</pre>;
}
