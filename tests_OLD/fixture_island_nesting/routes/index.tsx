import { basename, dirname, extname, fromFileUrl } from "../../deps.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

const links: string[] = [];
for (const file of Deno.readDirSync(__dirname)) {
  if (file.name.startsWith("index")) continue;
  const name = basename(file.name, extname(file.name));
  links.push(name);
}

export default function Home() {
  return (
    <div>
      <h1>Tests</h1>
      <ul>
        {links.map((link) => {
          return (
            <li key={link}>
              <a href={`/${link}`}>{link}</a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
