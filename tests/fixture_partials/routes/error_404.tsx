import { Partial } from "@fresh/runtime";

export default function ModeDemo() {
  return (
    <div f-client-nav>
      <Partial name="body">
        <p class="status">default content</p>
      </Partial>
      <p>
        <a
          class="update-link"
          href="/error_404/asdf"
        >
          update
        </a>
      </p>
    </div>
  );
}
