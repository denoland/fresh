import * as redis from "redis";

export default function Page() {
  // deno-lint-ignore no-console
  console.log(redis);
  return <h1>redis</h1>;
}
