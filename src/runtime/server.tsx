export type Mode = "dev" | "build" | "prod";
export let MODE: Mode = "prod";

export function setMode(mode: Mode) {
  MODE = mode;
}

export function FreshScripts() {
  // FIXME: integrity
  return <script type="module" src="/fresh-runtime.js"></script>;
}
