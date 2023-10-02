import { Handlers } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { delay } from "../../deps.ts";
import { useSignal } from "@preact/signals";
import SubmitButton from "../islands/SubmitButton.tsx";

export const handler: Handlers = {
  async POST(req, ctx) {
    if (req.body) {
      await delay(1000);

      const form = await req.formData();
      const value = form.get("value")?.toString() ?? "";
      return <PostForm value={value} showError={value !== "test"} />;
    }

    return <h1>POST: it works</h1>;
  },
};

export default function Page() {
  return <PostForm value="" />;
}

function PostForm(props: { value: string; showError?: boolean }) {
  const loading = useSignal(false);
  return (
    <Partial name="post">
      <h2>POST</h2>
      <form method="POST" fh-partial="/render_jsx" fh-loading={loading}>
        <input
          type="text"
          name="value"
          value={props.value}
        />
        <SubmitButton loading={loading} />
        {props.showError && (
          <p style="color: red">Value must be "test" to be valid</p>
        )}
      </form>
    </Partial>
  );
}
