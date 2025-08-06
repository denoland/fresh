import { App } from "fresh";
import { Doc } from "./shared.tsx";

export const app1: App<unknown> = new App()
  .get("/", (ctx) =>
    ctx.render(
      <Doc>
        <h1>App1</h1>
        <p>This app is loaded from JSR</p>
      </Doc>,
    ));
