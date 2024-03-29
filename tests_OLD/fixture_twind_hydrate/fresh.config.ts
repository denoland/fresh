import type { FreshConfig } from "$fresh/server.ts";
import twindPlugin from "../../src/__OLD/plugins/twindv1.ts";
import twindConfig from "./twind.config.ts";

export default { plugins: [twindPlugin(twindConfig)] } as FreshConfig;
