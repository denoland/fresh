import { Partial } from "$fresh/runtime.ts";
import { defineRoute, Handlers } from "$fresh/server.ts";
import { Logger } from "../../islands/Logger.tsx";

export const handler: Handlers = {
  POST(req, ctx) {
    return ctx.render();
  },
};

export default defineRoute(async (req, ctx) => {
  let value = "";
  let submitterValue = "";

  if (req.body !== null) {
    const data = await req.formData();
    value += data.has("name") ? data.get("name") + "_foo" : "";
    submitterValue += data.get("submitter_name");
  }

  return (
    <div>
      <form id="foo">
        <Partial name="slot-1">
          <p class="status">Default content</p>
          <p>
            <input type="text" value={value} name="name" />
          </p>
          <p id="submitter">{submitterValue}</p>
          <Logger name="Form" />
          <p class="url">{ctx.url.toString()}</p>
        </Partial>
      </form>
      <button
        type="submit"
        class="submit"
        form="foo"
        formaction="/form_submitter"
        formmethod="POST"
        name="submitter_name"
        value="submitter_value"
      >
        submit
      </button>
      <pre id="logs" />
    </div>
  );
});
