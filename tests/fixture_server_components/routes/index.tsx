import * as path from "https://deno.land/std@0.192.0/path/mod.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const links: string[] = [];
for (const file of Deno.readDirSync(__dirname)) {
  if (file.name.startsWith("index")) continue;
  const name = path.basename(file.name, path.extname(file.name));
  links.push(name);
}

export default function Home() {
  return (
    <div class="mx-auto max-w-md">
      <h1 class="text-3xl font-bold my-8">Tests</h1>
      <ul class="pl-4">
        {links.map((link) => {
          return (
            <li key={link} class="list-disc">
              <a href={`/${link}`} class="underline">{link}</a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
