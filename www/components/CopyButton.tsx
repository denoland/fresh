import * as Icons from "./Icons.tsx";

export function CopyButton(props: { code: string }) {
  return (
    <div class="relative my-2 mr-4 sm:mr-6">
      <button
        type="button"
        data-code={props.code}
        aria-label="Copy to Clipboard"
        class="rounded-sm p-1.5 border border-foreground-secondary/30 hover:bg-foreground-secondary/70 data-copied:text-green-500 relative group cursor-pointer"
      >
        <span class="group-copied">
          <Icons.Check />
        </span>
        <span class="group-not-copied">
          <Icons.Copy />
        </span>
      </button>
    </div>
  );
}
