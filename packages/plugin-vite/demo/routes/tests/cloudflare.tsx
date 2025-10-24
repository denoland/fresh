import * as cloudflare from "cloudflare";

export default function Page() {
  // deno-lint-ignore no-console
  console.log(cloudflare);
  return <h1>cloudflare</h1>;
}
