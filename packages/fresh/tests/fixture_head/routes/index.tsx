const items = await Array.fromAsync(await Deno.readDir(import.meta.dirname!));

export default function Page() {
  return (
    <div>
      {items
        .filter((item) =>
          item.name !== "index.tsx" && !item.name.startsWith("_")
        ).map((item) => {
          return (
            <li key={item.name}>
              <a href={`/${item.name}`}>{item.name}</a>
            </li>
          );
        })}
    </div>
  );
}
