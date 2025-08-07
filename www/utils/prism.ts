import Prism from "prismjs";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-tsx.js";
import "prismjs/components/prism-diff.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-yaml.js";
import "prismjs/components/prism-ignore.js";

/** Extends `sh` with `deno` as a function token in Shell/Bash languages */
Prism.languages.sh.deno = {
  pattern: /(^|[\s;|&]|[<>]\()(?:deno)(?=$|[)\s;|&])/,
  lookbehind: true,
  alias: "function",
};
Prism.languages.bash.deno = Prism.languages.sh.deno;

/**
 * Adds `txt-files` language for file-structure code blocks.
 *
 * - Comments: Makes `#` and everything after a comment
 * - Operator: Matches the file structure symbols like `├──`, `└──`, and `│ `
 * - Root: Matches `<root>` or `<project root>` to indicate the root of the file structure
 * - Remaining text is rendered as plain text
 *
 * @example
 * ```txt-files
 * <project root>
 * ├── routes/             # File system based routes
 * │   ├── _app.tsx        # Renders the outer <html> content structure
 * │   └── index.tsx       # Renders /
 * ├── dev.ts     # Run this during development
 * └── main.ts    # Run this for production
 * ```
 */
Prism.languages["txt-files"] = {
  comment: {
    pattern: /#.*|$/,
    greedy: true,
  },
  operator: /├──|└──|│\s+ /,
  root: {
    pattern: /<root>|<project root>/,
    alias: "function",
  },
};

export { Prism };
