import { ClassParser, HTMLParser } from "windicss/utils/parser";
import { Processor } from "windicss/lib";
import { Config } from "windicss";
import _ from "https://esm.sh/lodash";

/* Style element id to render windicss inside */
export const STYLE_ELEMENT_ID = "__FRSH_WINDICSS";

/**
 * @see https://github.com/windicss/windicss/blob/main/src/utils/parser/html.ts
 *
 * Extracts classes from html string
 *
 * @function getClassesFromHtml
 *
 * @param html {string}
 * @returns {string[]}
 */
export function getClassesFromHtml(html: string): string[] {
  return _.flatten(
    new HTMLParser(html).parseClasses().map((i) => i.result.split(" ")),
  );
}

/**
 * @see https://github.com/windicss/windicss/blob/main/src/utils/parser/class.ts
 *
 * Extracts classes from html Preact component props
 *
 * @function getClassesFromProps
 *
 * @param props {object}
 * @returns {string[]}
 */
export function getClassesFromProps(props: { className?: string }): string[] {
  if (props.className) {
    return new ClassParser(props.className).parse().map((i) => i.content);
  }

  return [];
}

/**
 * @see https://windicss.org/integrations/javascript.html
 *
 * @function generateWindicss
 *
 * @param config {@link Config}
 * @param classes {string[]}
 * @param [html] {string}
 * @returns {string}
 */
export function generateWindicss(
  config: Config,
  classes: string[],
  html?: string,
): string {
  // Get windi processor
  const processor = new Processor(config);
  // Process the HTML classes to an interpreted style sheet
  const interpretedSheet = processor.interpret(classes.join(" ")).styleSheet;

  // Build styles
  const APPEND = false;
  const MINIFY = false;

  if (html) {
    // Generate preflight based on the HTML we input
    const preflightSheet = processor.preflight(html);
    interpretedSheet.extend(preflightSheet, APPEND);
  }

  return interpretedSheet.build(MINIFY);
}
