import { basename, bgRed, dim, red } from "./deps.ts";

interface iOptional {
  errId?: string;
  note?: string;
  hardRejection?: boolean;
}

/**
 * Fout: a rust-like error handler.
 * @param errMsg error message to display
 * @param extras optional params
 *
 * @example
 * ```
 * Fout("A fatal unknown error!", {
 *   errId: "Fout-69",
 *   note: "There's a way to fix this... But it may hurt ;D",
 *   hardRejection: true
 * });
 * ```
 */
export function Fout(errMsg: string, extras?: iOptional): void {
  const options = {
    hardRejection: true,
    ...extras,
  };

  const errorIdNumber = options.errId ? `[${options.errId}]\n` : "\n";

  let errLog = bgRed("Error" + errorIdNumber);
  errLog += dim("--> stackTrace: " + basename(import.meta.url));
  errLog += `\n |\n | ${red(errMsg)}\n |\n`;

  options.note !== undefined
    ? errLog += ` = Note: ${options.note}\n\n`
    : errLog += " = ";

  options.hardRejection === true
    ? errLog += red("log: aborting due to previous error...")
    : errLog += red("log: ignoring said error...");

  console.error(errLog);

  options.hardRejection && Deno.exit(1);
}
