import { Fragment, jsx } from "preact/jsx-runtime";
export { Fragment, jsx, jsxDEV, jsxs } from "preact/jsx-runtime";

// DOM properties that should NOT have "px" added when numeric
const ENCODED_ENTITIES = /["&<]/;

export function encodeEntities(str: string) {
  // Skip all work for strings with no entities needing encoding:
  if (str.length === 0 || ENCODED_ENTITIES.test(str) === false) return str;

  let last = 0,
    i = 0,
    out = "",
    ch = "";

  // Seek forward in str until the next entity char:
  for (; i < str.length; i++) {
    switch (str.charCodeAt(i)) {
      case 34:
        ch = "&quot;";
        break;
      case 38:
        ch = "&amp;";
        break;
      case 60:
        ch = "&lt;";
        break;
      default:
        continue;
    }
    // Append skipped/buffered characters and the encoded entity:
    if (i !== last) out += str.slice(last, i);
    out += ch;
    // Start the next seek/buffer after the entity's offset:
    last = i + 1;
  }
  if (i !== last) out += str.slice(last, i);
  return out;
}

// deno-lint-ignore no-explicit-any
export function jsxssr(tpl: string[], ...exprs: any[]) {
  const vnode = jsx(Fragment as any, { tpl, exprs });
  // Bypass Preact top level Fragment optimization
  vnode.key = vnode.__v;
  return vnode;
}

// deno-lint-ignore no-explicit-any
export function jsxattr(name: string, value: any) {
  if (
    value === null || value === undefined || typeof value === "function" ||
    value === false
  ) {
    return "";
  }
  if (value === true) return name;

  return `${name}="${encodeEntities(value)}"`;
}
