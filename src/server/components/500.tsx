/** @jsx h */

import { h } from "../../runtime/deps.ts";
import { DEBUG } from "../constants.ts";
import type { ErrorPageProps } from "../../runtime/types.ts";

export default function DefaultErrorHandler(props: ErrorPageProps) {
  const containerStyles = `display: flex;`;

  return (
    <section style={containerStyles}>
      <p>There was an error rendering the page</p>
      {DEBUG &&
        (
          <pre>
            {props.error instanceof Error
              ? props.error.stack
              : String(props.error)}
          </pre>
        )}
    </section>
  );
}
