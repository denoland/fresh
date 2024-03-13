import { createApp, trailingSlashes } from "./mod.ts";

const app = createApp().use(trailingSlashes("always"));
await app.listen();
