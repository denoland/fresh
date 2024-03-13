import { FreshContext } from "../context.ts";

export {
  renderToString,
  renderToStringAsync,
} from "https://esm.sh/*preact-render-to-string@6.4.0?external=preact";

export async function renderHtml(ctx: FreshContext) {
  const id = crypto.randomUUID();

  //
  //
}
