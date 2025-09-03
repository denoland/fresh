import * as ioredis from "ioredis";

export default function Index() {
  // deno-lint-ignore no-console
  console.log(ioredis);
  return <h1>ioredis</h1>;
}
