import type { FunctionComponent } from "preact";
import type { FreshContext } from "../../context.ts";

/**
 * The mode Fresh can run in.
 */
export type Mode = "development" | "build" | "production";
export let MODE: Mode = "production";

export function setMode(mode: Mode) {
  MODE = mode;
}

export type PageProps<Data = unknown, T = unknown> =
  & Omit<FreshContext<Data, T>, "next" | "redirect" | "next">
  & { Component: FunctionComponent };
