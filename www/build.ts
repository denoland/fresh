import { ServerContext } from "$fresh/src/server/mod.ts";

import twindPlugin from "$fresh/plugins/twind.ts";

import manifest from "./fresh.gen.ts";
import twindConfig from "./twind.config.ts";

const ctx = await ServerContext.fromManifest(manifest, { plugins: [twindPlugin(twindConfig)] });

const bundle = await ctx.bundler.cache()

try {
  await Deno.remove("./_frsh", {recursive: true})
}
catch(err) {
  if(!(err instanceof Deno.errors.NotFound)) {
    throw err
  }
}

await Deno.mkdir("./_frsh", {
  recursive: true
})

for(const [filename, contents] of bundle) {
  await Deno.writeFile("./_frsh"+filename, contents);
}