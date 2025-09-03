// deno-lint-ignore-file no-process-global
import supportsColor from "../supports-color/index.ts";
import create from "./common.ts";
import humanize from "ms";

import tty from "node:tty";
import util from "node:util";

/**
 * This is the Node.js implementation of `debug()`.
 */

export const destroy = util.deprecate(
  () => {},
  "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
);

export const colors = supportsColor.stderr.level >= 2
  ? [
    20,
    21,
    26,
    27,
    32,
    33,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    56,
    57,
    62,
    63,
    68,
    69,
    74,
    75,
    76,
    77,
    78,
    79,
    80,
    81,
    92,
    93,
    98,
    99,
    112,
    113,
    128,
    129,
    134,
    135,
    148,
    149,
    160,
    161,
    162,
    163,
    164,
    165,
    166,
    167,
    168,
    169,
    170,
    171,
    172,
    173,
    178,
    179,
    184,
    185,
    196,
    197,
    198,
    199,
    200,
    201,
    202,
    203,
    204,
    205,
    206,
    207,
    208,
    209,
    214,
    215,
    220,
    221,
  ]
  : [6, 2, 3, 4, 5, 1];

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

export const inspectOpts = Object.keys(process.env).filter((key) => {
  return /^debug_/i.test(key);
  // deno-lint-ignore no-explicit-any
}).reduce((obj: any, key) => {
  // Camel-case
  const prop = key
    .substring(6)
    .toLowerCase()
    .replace(/_([a-z])/g, (_, k) => {
      return k.toUpperCase();
    });

  // Coerce string value into JS value
  const val: string | undefined = process.env[key];
  if (val !== undefined) {
    if (/^(yes|on|true|enabled)$/i.test(val)) {
      obj[prop] = true;
    } else if (/^(no|off|false|disabled)$/i.test(val)) {
      obj[prop] = false;
    } else if (val === "null") {
      obj[prop] = null;
    } else {
      obj[prop] = Number(val);
    }

    obj[prop] = val;
  }

  return obj;
}, {});

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

export function useColors() {
  return "colors" in inspectOpts
    ? Boolean(inspectOpts.colors)
    : tty.isatty(process.stderr.fd);
}

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

// @ts-ignore old code
export function formatArgs(args) {
  // @ts-ignore old code
  const { namespace: name, useColors } = this;

  if (useColors) {
    // @ts-ignore old code
    const c = this.color;
    const colorCode = "\u001B[3" + (c < 8 ? c : "8;5;" + c);
    const prefix = `  ${colorCode};1m${name} \u001B[0m`;

    args[0] = prefix + args[0].split("\n").join("\n" + prefix);
    args.push(
      // @ts-ignore old code
      colorCode + "m+" + humanize(this.diff) + "\u001B[0m",
    );
  } else {
    args[0] = getDate() + name + " " + args[0];
  }
}

function getDate() {
  if (inspectOpts.hideDate) {
    return "";
  }
  return new Date().toISOString() + " ";
}

/**
 * Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
 */

// deno-lint-ignore no-explicit-any
export function log(...args: any[]) {
  return process.stderr.write(
    util.formatWithOptions(inspectOpts, ...args) + "\n",
  );
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
export function save(namespaces: string) {
  if (namespaces) {
    process.env.DEBUG = namespaces;
  } else {
    // If you set a process.env field to null or undefined, it gets cast to the
    // string 'null' or 'undefined'. Just delete instead.
    delete process.env.DEBUG;
  }
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

export function load() {
  return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

// @ts-ignore old code
export function init(debug) {
  debug.inspectOpts = {};

  const keys = Object.keys(inspectOpts);
  for (let i = 0; i < keys.length; i++) {
    debug.inspectOpts[keys[i]] = inspectOpts[keys[i]];
  }
}

const instance = create({
  destroy,
  colors,
  inspectOpts,
  useColors,
  formatArgs,
  log,
  save,
  load,
  init,
});
export default Object.assign(create, instance);

const { formatters } = instance;

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

// @ts-ignore old code
formatters.o = function (v) {
  // @ts-ignore old code
  this.inspectOpts.colors = this.useColors;
  // @ts-ignore old code
  return util.inspect(v, this.inspectOpts)
    .split("\n")
    .map((str) => str.trim())
    .join(" ");
};

/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */

// @ts-ignore old code
formatters.O = function (v) {
  // @ts-ignore old code
  this.inspectOpts.colors = this.useColors;
  // @ts-ignore old code
  return util.inspect(v, this.inspectOpts);
};
