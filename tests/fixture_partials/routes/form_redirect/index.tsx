import { Partial } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  POST() {
    return new Response("", {
      status: 307,
      headers: { Location: "/form_redirect/response" },
    });
  },
};

export default function SlotDemo() {
  return (
    <div>
      <form action="/form_redirect" method="POST">
        <Partial name="slot-1">
          <p class="status">Default content</p>
        </Partial>
        <button type="submit" class="submit">
          submit
        </button>
      </form>
    </div>
  );
}
