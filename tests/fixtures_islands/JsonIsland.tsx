import data from "./data.json" with { type: "json" };

export function JsonIsland() {
  return <pre>{JSON.stringify(data)}</pre>;
}
