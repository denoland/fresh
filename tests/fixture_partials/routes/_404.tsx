import { Partial } from "@fresh/runtime";

export default function Page() {
  return (
    <Partial name="body">
      <p class="status-404">Not found - Error 404</p>
    </Partial>
  );
}
