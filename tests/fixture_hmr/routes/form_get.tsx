import { PageProps } from "$fresh/server.ts";

export default function SlotDemo(props: PageProps) {
  let value = props.url.searchParams.get("name") ?? "";

  value += value ? "_foo" : "";

  return (
    <div>
      <h1>Form</h1>
      <form action="/form_get">
        <p class="status">Default content</p>
        <p>
          <input type="text" value={value} name="name" />
        </p>
        <p class="url">{props.url.toString()}</p>
        <button type="submit" class="submit">
          submit
        </button>
      </form>
    </div>
  );
}
