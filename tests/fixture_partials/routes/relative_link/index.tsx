import { Partial } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
import { Fader } from "../../islands/Fader.tsx";

export default defineRoute((req) => {
  const url = new URL(req.url);

  return (
    <div f-client-nav>
      <Partial name="body">
        <Fader>
          <p
            class={url.searchParams.has("refresh")
              ? "status-refreshed"
              : "status-initial"}
          >
            {url.searchParams.has("refresh")
              ? "Refreshed content"
              : "Initial content"}
          </p>
        </Fader>
      </Partial>
      <p>
        <button f-partial="?refresh">
          refresh
        </button>
      </p>
    </div>
  );
});
