import { MongoClient } from "mongodb";

export default function Page() {
  const client = new MongoClient("mongodb://127.0.0.1:27017");
  // deno-lint-ignore no-console
  console.log(client);
  return <h1>ok</h1>;
}
