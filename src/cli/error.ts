import { bold, red } from "./deps.ts";

export function printError(message: string) {
  console.error(red(`${bold("error")}: ${message}`));
}

export function error(message: string): never {
  printError(message);
  Deno.exit(1);
}
