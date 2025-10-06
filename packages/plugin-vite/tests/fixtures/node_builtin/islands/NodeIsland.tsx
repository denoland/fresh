import process from "node:process";

export function NodeIsland() {
  return <h1>{process.version}</h1>;
}
