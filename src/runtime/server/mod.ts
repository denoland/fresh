/**
 * The mode Fresh can run in.
 */
export type Mode = "development" | "build" | "production";
export let MODE: Mode = "production";

export function setMode(mode: Mode) {
  MODE = mode;
}
