/**
 * Module containing a simple example Fresh App
 *
 * @module
 */

import { App } from "fresh";
import { Doc } from "./shared.tsx";

/** App that renders a sample HTML document */
export const app1: App<unknown> = new App()
  .get("/", (ctx) =>
    ctx.render(
      <Doc>
        <h1>App1</h1>
        <p>This app is loaded from JSR</p>
      </Doc>,
    ));
