import * as path from "@std/path";

export default function IndexPage() {
  const urls = Array.from(Deno.readDirSync(import.meta.dirname!)).filter(
    (entry) => {
      return !entry.name.startsWith("_") && entry.name !== "index";
    },
  ).map((entry) => {
    return path.basename(entry.name, path.extname(entry.name));
  }).sort();

  return (
    <ul>
      {urls.map((url) => {
        return (
          <li key={url}>
            <a href={`/${url}`}>{url}</a>
          </li>
        );
      })}
    </ul>
  );
}
