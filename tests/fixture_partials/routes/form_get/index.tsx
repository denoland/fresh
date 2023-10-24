import { Partial } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import { Logger } from "../../islands/Logger.tsx";

export default function SlotDemo(props: PageProps) {
  let value = props.url.searchParams.get("name") ?? "";

  value += value ? "_foo" : "";

  return (
    <div>
      <form action="/form_get">
        <Partial name="slot-1">
          <p class="status">Default content</p>
          <p>
            <input type="text" value={value} name="name" />
          </p>
          <Logger name="Form" />
          <p class="url">{props.url.toString()}</p>
        </Partial>
        <button type="submit" class="submit">
          submit
        </button>
      </form>
      <pre id="logs" />
    </div>
  );
}
