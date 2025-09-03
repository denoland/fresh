import humanize from "ms";

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

// deno-lint-ignore no-explicit-any
export default function setup(env: any) {
  createDebug.debug = createDebug;
  createDebug.default = createDebug;
  createDebug.coerce = coerce;
  createDebug.disable = disable;
  createDebug.enable = enable;
  createDebug.enabled = enabled;
  createDebug.humanize = humanize;
  createDebug.destroy = destroy;

  Object.keys(env).forEach((key) => {
    // @ts-ignore old code
    createDebug[key] = env[key];
  });

  /**
   * The currently active debug mode names, and names to skip.
   */

  // @ts-ignore old code
  createDebug.names = [];
  // @ts-ignore old code
  createDebug.skips = [];

  /**
   * Map of special "%n" handling functions, for the debug "format" argument.
   *
   * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
   */
  createDebug.formatters = {};

  /**
   * Selects a color for a debug namespace
   * @param {String} namespace The namespace string for the debug instance to be colored
   * @return {Number|String} An ANSI color code for the given namespace
   * @api private
   */
  function selectColor(namespace: string): number | string {
    let hash = 0;

    for (let i = 0; i < namespace.length; i++) {
      hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    // @ts-ignore old code
    return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
  }
  createDebug.selectColor = selectColor;

  /**
   * Create a debugger with the given `namespace`.
   *
   * @param {String} namespace
   * @return {Function}
   * @api public
   */
  function createDebug(namespace: string) {
    // @ts-ignore old code
    let prevTime;
    // @ts-ignore old code
    let enableOverride = null;
    // @ts-ignore old code
    let namespacesCache;
    // @ts-ignore old code
    let enabledCache;

    // deno-lint-ignore no-explicit-any
    function debug(...args: any[]) {
      // Disabled?
      // @ts-ignore old code
      if (!debug.enabled) {
        return;
      }

      const self = debug;

      // Set `diff` timestamp
      const curr = Number(new Date());
      // @ts-ignore old code
      const ms = curr - (prevTime || curr);
      // @ts-ignore old code
      self.diff = ms;
      // @ts-ignore old code
      self.prev = prevTime;
      // @ts-ignore old code
      self.curr = curr;
      prevTime = curr;

      args[0] = createDebug.coerce(args[0]);

      if (typeof args[0] !== "string") {
        // Anything else let's inspect with %O
        args.unshift("%O");
      }

      // Apply any `formatters` transformations
      let index = 0;
      // @ts-ignore old code
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
        // If we encounter an escaped % then don't increase the array index
        if (match === "%%") {
          return "%";
        }
        index++;
        // @ts-ignore old code
        const formatter = createDebug.formatters[format];
        if (typeof formatter === "function") {
          const val = args[index];
          match = formatter.call(self, val);

          // Now we need to remove `args[index]` since it's inlined in the `format`
          args.splice(index, 1);
          index--;
        }
        return match;
      });

      // Apply env-specific formatting (colors, etc.)
      // @ts-ignore old code
      createDebug.formatArgs.call(self, args);

      // @ts-ignore old code
      const logFn = self.log || createDebug.log;
      logFn.apply(self, args);
    }

    debug.namespace = namespace;
    // @ts-ignore old code
    debug.useColors = createDebug.useColors();
    debug.color = createDebug.selectColor(namespace);
    debug.extend = extend;
    debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    Object.defineProperty(debug, "enabled", {
      enumerable: true,
      configurable: false,
      get: () => {
        // @ts-ignore old code
        if (enableOverride !== null) {
          // @ts-ignore old code
          return enableOverride;
        }
        // @ts-ignore old code
        if (namespacesCache !== createDebug.namespaces) {
          // @ts-ignore old code
          namespacesCache = createDebug.namespaces;
          enabledCache = createDebug.enabled(namespace);
        }

        // @ts-ignore old code
        return enabledCache;
      },
      set: (v) => {
        enableOverride = v;
      },
    });

    // Env-specific initialization logic for debug instances
    // @ts-ignore old code
    if (typeof createDebug.init === "function") {
      // @ts-ignore old code
      createDebug.init(debug);
    }

    return debug;
  }

  function extend(namespace: string, delimiter?: string | undefined) {
    const newDebug = createDebug(
      // @ts-ignore old code
      this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) +
        namespace,
    );
    // @ts-ignore old code
    newDebug.log = this.log;
    return newDebug;
  }

  /**
   * Enables a debug mode by namespaces. This can include modes
   * separated by a colon and wildcards.
   *
   * @param {String} namespaces
   * @api public
   */
  function enable(namespaces: string) {
    // @ts-ignore old code
    createDebug.save(namespaces);
    // @ts-ignore old code
    createDebug.namespaces = namespaces;

    createDebug.names = [];
    createDebug.skips = [];

    const split = (typeof namespaces === "string" ? namespaces : "")
      .trim()
      .replace(/\s+/g, ",")
      .split(",")
      .filter(Boolean);

    for (const ns of split) {
      if (ns[0] === "-") {
        createDebug.skips.push(ns.slice(1));
      } else {
        createDebug.names.push(ns);
      }
    }
  }

  /**
   * Checks if the given string matches a namespace template, honoring
   * asterisks as wildcards.
   *
   * @param {String} search
   * @param {String} template
   * @return {Boolean}
   */
  function matchesTemplate(search: string, template: string) {
    let searchIndex = 0;
    let templateIndex = 0;
    let starIndex = -1;
    let matchIndex = 0;

    while (searchIndex < search.length) {
      if (
        templateIndex < template.length &&
        (template[templateIndex] === search[searchIndex] ||
          template[templateIndex] === "*")
      ) {
        // Match character or proceed with wildcard
        if (template[templateIndex] === "*") {
          starIndex = templateIndex;
          matchIndex = searchIndex;
          templateIndex++; // Skip the '*'
        } else {
          searchIndex++;
          templateIndex++;
        }
      } else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
        // Backtrack to the last '*' and try to match more characters
        templateIndex = starIndex + 1;
        matchIndex++;
        searchIndex = matchIndex;
      } else {
        return false; // No match
      }
    }

    // Handle trailing '*' in template
    while (templateIndex < template.length && template[templateIndex] === "*") {
      templateIndex++;
    }

    return templateIndex === template.length;
  }

  /**
   * Disable debug output.
   *
   * @return {String} namespaces
   * @api public
   */
  function disable() {
    const namespaces = [
      ...createDebug.names,
      ...createDebug.skips.map((namespace) => "-" + namespace),
    ].join(",");
    createDebug.enable("");
    return namespaces;
  }

  /**
   * Returns true if the given mode name is enabled, false otherwise.
   *
   * @param {String} name
   * @return {Boolean}
   * @api public
   */
  function enabled(name: string): boolean {
    for (const skip of createDebug.skips) {
      if (matchesTemplate(name, skip)) {
        return false;
      }
    }

    for (const ns of createDebug.names) {
      if (matchesTemplate(name, ns)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Coerce `val`.
   *
   * @param {Mixed} val
   * @return {Mixed}
   * @api private
   */
  // deno-lint-ignore no-explicit-any
  function coerce(val: any) {
    if (val instanceof Error) {
      return val.stack || val.message;
    }
    return val;
  }

  /**
   * XXX DO NOT USE. This is a temporary stub function.
   * XXX It WILL be removed in the next major release.
   */
  function destroy() {
    // deno-lint-ignore no-console
    console.warn(
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
    );
  }

  createDebug.enable(env.load());

  return createDebug;
}
