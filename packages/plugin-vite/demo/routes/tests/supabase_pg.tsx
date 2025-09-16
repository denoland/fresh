import * as supabase from "@supabase/postgrest-js";

export default function Page() {
  // deno-lint-ignore no-console
  console.log(supabase);
  return <h1>supabase</h1>;
}
