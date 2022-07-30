export function printError(message: string) {
  console.error(`%cerror%c: ${message}`, "color: red; font-weight: bold", "");
}

export function error(message: string): never {
  printError(message);
  Deno.exit(1);
}
