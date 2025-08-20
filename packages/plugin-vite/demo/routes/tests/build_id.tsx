import { BUILD_ID } from "@fresh/build-id";

export default function BuildIdPage() {
  return (
    <div>
      <div class="ready">Ready</div>
      <div id="build-id">{BUILD_ID}</div>
    </div>
  );
}
