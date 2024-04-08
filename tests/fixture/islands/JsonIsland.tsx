import json from "./data.json" with { type: "json" };

export default function JsonIsland() {
  return <pre>{JSON.stringify(json,null, 2)}</pre>;
}
