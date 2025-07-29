var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// ../../node_modules/.deno/wrangler@4.26.1/node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "../../node_modules/.deno/wrangler@4.26.1/node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/browser/globalThis.js
var require_globalThis = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/browser/globalThis.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports._globalThis = void 0;
    exports._globalThis = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/browser/index.js
var require_browser = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/browser/index.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o6, m4, k4, k22) {
      if (k22 === void 0) k22 = k4;
      Object.defineProperty(o6, k22, { enumerable: true, get: /* @__PURE__ */ __name(function() {
        return m4[k4];
      }, "get") });
    } : function(o6, m4, k4, k22) {
      if (k22 === void 0) k22 = k4;
      o6[k22] = m4[k4];
    });
    var __exportStar = exports && exports.__exportStar || function(m4, exports2) {
      for (var p6 in m4) if (p6 !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p6)) __createBinding(exports2, m4, p6);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_globalThis(), exports);
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/version.js
var require_version = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/version.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VERSION = void 0;
    exports.VERSION = "1.9.0";
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/semver.js
var require_semver = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/semver.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isCompatible = exports._makeCompatibilityCheck = void 0;
    var version_1 = require_version();
    var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
    function _makeCompatibilityCheck(ownVersion) {
      const acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
      const rejectedVersions = /* @__PURE__ */ new Set();
      const myVersionMatch = ownVersion.match(re);
      if (!myVersionMatch) {
        return () => false;
      }
      const ownVersionParsed = {
        major: +myVersionMatch[1],
        minor: +myVersionMatch[2],
        patch: +myVersionMatch[3],
        prerelease: myVersionMatch[4]
      };
      if (ownVersionParsed.prerelease != null) {
        return /* @__PURE__ */ __name(function isExactmatch(globalVersion) {
          return globalVersion === ownVersion;
        }, "isExactmatch");
      }
      function _reject(v5) {
        rejectedVersions.add(v5);
        return false;
      }
      __name(_reject, "_reject");
      function _accept(v5) {
        acceptedVersions.add(v5);
        return true;
      }
      __name(_accept, "_accept");
      return /* @__PURE__ */ __name(function isCompatible(globalVersion) {
        if (acceptedVersions.has(globalVersion)) {
          return true;
        }
        if (rejectedVersions.has(globalVersion)) {
          return false;
        }
        const globalVersionMatch = globalVersion.match(re);
        if (!globalVersionMatch) {
          return _reject(globalVersion);
        }
        const globalVersionParsed = {
          major: +globalVersionMatch[1],
          minor: +globalVersionMatch[2],
          patch: +globalVersionMatch[3],
          prerelease: globalVersionMatch[4]
        };
        if (globalVersionParsed.prerelease != null) {
          return _reject(globalVersion);
        }
        if (ownVersionParsed.major !== globalVersionParsed.major) {
          return _reject(globalVersion);
        }
        if (ownVersionParsed.major === 0) {
          if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
            return _accept(globalVersion);
          }
          return _reject(globalVersion);
        }
        if (ownVersionParsed.minor <= globalVersionParsed.minor) {
          return _accept(globalVersion);
        }
        return _reject(globalVersion);
      }, "isCompatible");
    }
    __name(_makeCompatibilityCheck, "_makeCompatibilityCheck");
    exports._makeCompatibilityCheck = _makeCompatibilityCheck;
    exports.isCompatible = _makeCompatibilityCheck(version_1.VERSION);
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/global-utils.js
var require_global_utils = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/global-utils.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.unregisterGlobal = exports.getGlobal = exports.registerGlobal = void 0;
    var platform_1 = require_browser();
    var version_1 = require_version();
    var semver_1 = require_semver();
    var major = version_1.VERSION.split(".")[0];
    var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
    var _global = platform_1._globalThis;
    function registerGlobal(type, instance, diag, allowOverride = false) {
      var _a;
      const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : {
        version: version_1.VERSION
      };
      if (!allowOverride && api[type]) {
        const err = new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
        diag.error(err.stack || err.message);
        return false;
      }
      if (api.version !== version_1.VERSION) {
        const err = new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${version_1.VERSION}`);
        diag.error(err.stack || err.message);
        return false;
      }
      api[type] = instance;
      diag.debug(`@opentelemetry/api: Registered a global for ${type} v${version_1.VERSION}.`);
      return true;
    }
    __name(registerGlobal, "registerGlobal");
    exports.registerGlobal = registerGlobal;
    function getGlobal(type) {
      var _a, _b;
      const globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
      if (!globalVersion || !(0, semver_1.isCompatible)(globalVersion)) {
        return;
      }
      return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
    }
    __name(getGlobal, "getGlobal");
    exports.getGlobal = getGlobal;
    function unregisterGlobal(type, diag) {
      diag.debug(`@opentelemetry/api: Unregistering a global for ${type} v${version_1.VERSION}.`);
      const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
      if (api) {
        delete api[type];
      }
    }
    __name(unregisterGlobal, "unregisterGlobal");
    exports.unregisterGlobal = unregisterGlobal;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/ComponentLogger.js
var require_ComponentLogger = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/ComponentLogger.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagComponentLogger = void 0;
    var global_utils_1 = require_global_utils();
    var DiagComponentLogger = class {
      static {
        __name(this, "DiagComponentLogger");
      }
      constructor(props) {
        this._namespace = props.namespace || "DiagComponentLogger";
      }
      debug(...args) {
        return logProxy("debug", this._namespace, args);
      }
      error(...args) {
        return logProxy("error", this._namespace, args);
      }
      info(...args) {
        return logProxy("info", this._namespace, args);
      }
      warn(...args) {
        return logProxy("warn", this._namespace, args);
      }
      verbose(...args) {
        return logProxy("verbose", this._namespace, args);
      }
    };
    exports.DiagComponentLogger = DiagComponentLogger;
    function logProxy(funcName, namespace, args) {
      const logger = (0, global_utils_1.getGlobal)("diag");
      if (!logger) {
        return;
      }
      args.unshift(namespace);
      return logger[funcName](...args);
    }
    __name(logProxy, "logProxy");
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/types.js
var require_types = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/types.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagLogLevel = void 0;
    var DiagLogLevel;
    (function(DiagLogLevel2) {
      DiagLogLevel2[DiagLogLevel2["NONE"] = 0] = "NONE";
      DiagLogLevel2[DiagLogLevel2["ERROR"] = 30] = "ERROR";
      DiagLogLevel2[DiagLogLevel2["WARN"] = 50] = "WARN";
      DiagLogLevel2[DiagLogLevel2["INFO"] = 60] = "INFO";
      DiagLogLevel2[DiagLogLevel2["DEBUG"] = 70] = "DEBUG";
      DiagLogLevel2[DiagLogLevel2["VERBOSE"] = 80] = "VERBOSE";
      DiagLogLevel2[DiagLogLevel2["ALL"] = 9999] = "ALL";
    })(DiagLogLevel = exports.DiagLogLevel || (exports.DiagLogLevel = {}));
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/internal/logLevelLogger.js
var require_logLevelLogger = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/internal/logLevelLogger.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createLogLevelDiagLogger = void 0;
    var types_1 = require_types();
    function createLogLevelDiagLogger(maxLevel, logger) {
      if (maxLevel < types_1.DiagLogLevel.NONE) {
        maxLevel = types_1.DiagLogLevel.NONE;
      } else if (maxLevel > types_1.DiagLogLevel.ALL) {
        maxLevel = types_1.DiagLogLevel.ALL;
      }
      logger = logger || {};
      function _filterFunc(funcName, theLevel) {
        const theFunc = logger[funcName];
        if (typeof theFunc === "function" && maxLevel >= theLevel) {
          return theFunc.bind(logger);
        }
        return function() {
        };
      }
      __name(_filterFunc, "_filterFunc");
      return {
        error: _filterFunc("error", types_1.DiagLogLevel.ERROR),
        warn: _filterFunc("warn", types_1.DiagLogLevel.WARN),
        info: _filterFunc("info", types_1.DiagLogLevel.INFO),
        debug: _filterFunc("debug", types_1.DiagLogLevel.DEBUG),
        verbose: _filterFunc("verbose", types_1.DiagLogLevel.VERBOSE)
      };
    }
    __name(createLogLevelDiagLogger, "createLogLevelDiagLogger");
    exports.createLogLevelDiagLogger = createLogLevelDiagLogger;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/diag.js
var require_diag = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/diag.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagAPI = void 0;
    var ComponentLogger_1 = require_ComponentLogger();
    var logLevelLogger_1 = require_logLevelLogger();
    var types_1 = require_types();
    var global_utils_1 = require_global_utils();
    var API_NAME = "diag";
    var DiagAPI = class _DiagAPI {
      static {
        __name(this, "DiagAPI");
      }
      /**
       * Private internal constructor
       * @private
       */
      constructor() {
        function _logProxy(funcName) {
          return function(...args) {
            const logger = (0, global_utils_1.getGlobal)("diag");
            if (!logger)
              return;
            return logger[funcName](...args);
          };
        }
        __name(_logProxy, "_logProxy");
        const self2 = this;
        const setLogger = /* @__PURE__ */ __name((logger, optionsOrLogLevel = { logLevel: types_1.DiagLogLevel.INFO }) => {
          var _a, _b, _c;
          if (logger === self2) {
            const err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
            self2.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
            return false;
          }
          if (typeof optionsOrLogLevel === "number") {
            optionsOrLogLevel = {
              logLevel: optionsOrLogLevel
            };
          }
          const oldLogger = (0, global_utils_1.getGlobal)("diag");
          const newLogger = (0, logLevelLogger_1.createLogLevelDiagLogger)((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : types_1.DiagLogLevel.INFO, logger);
          if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
            const stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
            oldLogger.warn(`Current logger will be overwritten from ${stack}`);
            newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
          }
          return (0, global_utils_1.registerGlobal)("diag", newLogger, self2, true);
        }, "setLogger");
        self2.setLogger = setLogger;
        self2.disable = () => {
          (0, global_utils_1.unregisterGlobal)(API_NAME, self2);
        };
        self2.createComponentLogger = (options2) => {
          return new ComponentLogger_1.DiagComponentLogger(options2);
        };
        self2.verbose = _logProxy("verbose");
        self2.debug = _logProxy("debug");
        self2.info = _logProxy("info");
        self2.warn = _logProxy("warn");
        self2.error = _logProxy("error");
      }
      /** Get the singleton instance of the DiagAPI API */
      static instance() {
        if (!this._instance) {
          this._instance = new _DiagAPI();
        }
        return this._instance;
      }
    };
    exports.DiagAPI = DiagAPI;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/baggage-impl.js
var require_baggage_impl = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/baggage-impl.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaggageImpl = void 0;
    var BaggageImpl = class _BaggageImpl {
      static {
        __name(this, "BaggageImpl");
      }
      constructor(entries) {
        this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
      }
      getEntry(key) {
        const entry = this._entries.get(key);
        if (!entry) {
          return void 0;
        }
        return Object.assign({}, entry);
      }
      getAllEntries() {
        return Array.from(this._entries.entries()).map(([k4, v5]) => [k4, v5]);
      }
      setEntry(key, entry) {
        const newBaggage = new _BaggageImpl(this._entries);
        newBaggage._entries.set(key, entry);
        return newBaggage;
      }
      removeEntry(key) {
        const newBaggage = new _BaggageImpl(this._entries);
        newBaggage._entries.delete(key);
        return newBaggage;
      }
      removeEntries(...keys) {
        const newBaggage = new _BaggageImpl(this._entries);
        for (const key of keys) {
          newBaggage._entries.delete(key);
        }
        return newBaggage;
      }
      clear() {
        return new _BaggageImpl();
      }
    };
    exports.BaggageImpl = BaggageImpl;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/symbol.js
var require_symbol = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/symbol.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.baggageEntryMetadataSymbol = void 0;
    exports.baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/utils.js
var require_utils = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/utils.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.baggageEntryMetadataFromString = exports.createBaggage = void 0;
    var diag_1 = require_diag();
    var baggage_impl_1 = require_baggage_impl();
    var symbol_1 = require_symbol();
    var diag = diag_1.DiagAPI.instance();
    function createBaggage(entries = {}) {
      return new baggage_impl_1.BaggageImpl(new Map(Object.entries(entries)));
    }
    __name(createBaggage, "createBaggage");
    exports.createBaggage = createBaggage;
    function baggageEntryMetadataFromString(str) {
      if (typeof str !== "string") {
        diag.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
        str = "";
      }
      return {
        __TYPE__: symbol_1.baggageEntryMetadataSymbol,
        toString() {
          return str;
        }
      };
    }
    __name(baggageEntryMetadataFromString, "baggageEntryMetadataFromString");
    exports.baggageEntryMetadataFromString = baggageEntryMetadataFromString;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/context.js
var require_context = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/context.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ROOT_CONTEXT = exports.createContextKey = void 0;
    function createContextKey(description) {
      return Symbol.for(description);
    }
    __name(createContextKey, "createContextKey");
    exports.createContextKey = createContextKey;
    var BaseContext = class _BaseContext {
      static {
        __name(this, "BaseContext");
      }
      /**
       * Construct a new context which inherits values from an optional parent context.
       *
       * @param parentContext a context from which to inherit values
       */
      constructor(parentContext) {
        const self2 = this;
        self2._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
        self2.getValue = (key) => self2._currentContext.get(key);
        self2.setValue = (key, value) => {
          const context = new _BaseContext(self2._currentContext);
          context._currentContext.set(key, value);
          return context;
        };
        self2.deleteValue = (key) => {
          const context = new _BaseContext(self2._currentContext);
          context._currentContext.delete(key);
          return context;
        };
      }
    };
    exports.ROOT_CONTEXT = new BaseContext();
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/consoleLogger.js
var require_consoleLogger = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/consoleLogger.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagConsoleLogger = void 0;
    var consoleMap = [
      { n: "error", c: "error" },
      { n: "warn", c: "warn" },
      { n: "info", c: "info" },
      { n: "debug", c: "debug" },
      { n: "verbose", c: "trace" }
    ];
    var DiagConsoleLogger = class {
      static {
        __name(this, "DiagConsoleLogger");
      }
      constructor() {
        function _consoleFunc(funcName) {
          return function(...args) {
            if (console) {
              let theFunc = console[funcName];
              if (typeof theFunc !== "function") {
                theFunc = console.log;
              }
              if (typeof theFunc === "function") {
                return theFunc.apply(console, args);
              }
            }
          };
        }
        __name(_consoleFunc, "_consoleFunc");
        for (let i6 = 0; i6 < consoleMap.length; i6++) {
          this[consoleMap[i6].n] = _consoleFunc(consoleMap[i6].c);
        }
      }
    };
    exports.DiagConsoleLogger = DiagConsoleLogger;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeter.js
var require_NoopMeter = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeter.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createNoopMeter = exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = exports.NOOP_OBSERVABLE_GAUGE_METRIC = exports.NOOP_OBSERVABLE_COUNTER_METRIC = exports.NOOP_UP_DOWN_COUNTER_METRIC = exports.NOOP_HISTOGRAM_METRIC = exports.NOOP_GAUGE_METRIC = exports.NOOP_COUNTER_METRIC = exports.NOOP_METER = exports.NoopObservableUpDownCounterMetric = exports.NoopObservableGaugeMetric = exports.NoopObservableCounterMetric = exports.NoopObservableMetric = exports.NoopHistogramMetric = exports.NoopGaugeMetric = exports.NoopUpDownCounterMetric = exports.NoopCounterMetric = exports.NoopMetric = exports.NoopMeter = void 0;
    var NoopMeter = class {
      static {
        __name(this, "NoopMeter");
      }
      constructor() {
      }
      /**
       * @see {@link Meter.createGauge}
       */
      createGauge(_name, _options) {
        return exports.NOOP_GAUGE_METRIC;
      }
      /**
       * @see {@link Meter.createHistogram}
       */
      createHistogram(_name, _options) {
        return exports.NOOP_HISTOGRAM_METRIC;
      }
      /**
       * @see {@link Meter.createCounter}
       */
      createCounter(_name, _options) {
        return exports.NOOP_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.createUpDownCounter}
       */
      createUpDownCounter(_name, _options) {
        return exports.NOOP_UP_DOWN_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.createObservableGauge}
       */
      createObservableGauge(_name, _options) {
        return exports.NOOP_OBSERVABLE_GAUGE_METRIC;
      }
      /**
       * @see {@link Meter.createObservableCounter}
       */
      createObservableCounter(_name, _options) {
        return exports.NOOP_OBSERVABLE_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.createObservableUpDownCounter}
       */
      createObservableUpDownCounter(_name, _options) {
        return exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
      }
      /**
       * @see {@link Meter.addBatchObservableCallback}
       */
      addBatchObservableCallback(_callback, _observables) {
      }
      /**
       * @see {@link Meter.removeBatchObservableCallback}
       */
      removeBatchObservableCallback(_callback) {
      }
    };
    exports.NoopMeter = NoopMeter;
    var NoopMetric = class {
      static {
        __name(this, "NoopMetric");
      }
    };
    exports.NoopMetric = NoopMetric;
    var NoopCounterMetric = class extends NoopMetric {
      static {
        __name(this, "NoopCounterMetric");
      }
      add(_value, _attributes) {
      }
    };
    exports.NoopCounterMetric = NoopCounterMetric;
    var NoopUpDownCounterMetric = class extends NoopMetric {
      static {
        __name(this, "NoopUpDownCounterMetric");
      }
      add(_value, _attributes) {
      }
    };
    exports.NoopUpDownCounterMetric = NoopUpDownCounterMetric;
    var NoopGaugeMetric = class extends NoopMetric {
      static {
        __name(this, "NoopGaugeMetric");
      }
      record(_value, _attributes) {
      }
    };
    exports.NoopGaugeMetric = NoopGaugeMetric;
    var NoopHistogramMetric = class extends NoopMetric {
      static {
        __name(this, "NoopHistogramMetric");
      }
      record(_value, _attributes) {
      }
    };
    exports.NoopHistogramMetric = NoopHistogramMetric;
    var NoopObservableMetric = class {
      static {
        __name(this, "NoopObservableMetric");
      }
      addCallback(_callback) {
      }
      removeCallback(_callback) {
      }
    };
    exports.NoopObservableMetric = NoopObservableMetric;
    var NoopObservableCounterMetric = class extends NoopObservableMetric {
      static {
        __name(this, "NoopObservableCounterMetric");
      }
    };
    exports.NoopObservableCounterMetric = NoopObservableCounterMetric;
    var NoopObservableGaugeMetric = class extends NoopObservableMetric {
      static {
        __name(this, "NoopObservableGaugeMetric");
      }
    };
    exports.NoopObservableGaugeMetric = NoopObservableGaugeMetric;
    var NoopObservableUpDownCounterMetric = class extends NoopObservableMetric {
      static {
        __name(this, "NoopObservableUpDownCounterMetric");
      }
    };
    exports.NoopObservableUpDownCounterMetric = NoopObservableUpDownCounterMetric;
    exports.NOOP_METER = new NoopMeter();
    exports.NOOP_COUNTER_METRIC = new NoopCounterMetric();
    exports.NOOP_GAUGE_METRIC = new NoopGaugeMetric();
    exports.NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
    exports.NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
    exports.NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
    exports.NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
    exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
    function createNoopMeter() {
      return exports.NOOP_METER;
    }
    __name(createNoopMeter, "createNoopMeter");
    exports.createNoopMeter = createNoopMeter;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/Metric.js
var require_Metric = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/Metric.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValueType = void 0;
    var ValueType;
    (function(ValueType2) {
      ValueType2[ValueType2["INT"] = 0] = "INT";
      ValueType2[ValueType2["DOUBLE"] = 1] = "DOUBLE";
    })(ValueType = exports.ValueType || (exports.ValueType = {}));
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/TextMapPropagator.js
var require_TextMapPropagator = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/TextMapPropagator.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultTextMapSetter = exports.defaultTextMapGetter = void 0;
    exports.defaultTextMapGetter = {
      get(carrier, key) {
        if (carrier == null) {
          return void 0;
        }
        return carrier[key];
      },
      keys(carrier) {
        if (carrier == null) {
          return [];
        }
        return Object.keys(carrier);
      }
    };
    exports.defaultTextMapSetter = {
      set(carrier, key, value) {
        if (carrier == null) {
          return;
        }
        carrier[key] = value;
      }
    };
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/NoopContextManager.js
var require_NoopContextManager = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/NoopContextManager.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoopContextManager = void 0;
    var context_1 = require_context();
    var NoopContextManager = class {
      static {
        __name(this, "NoopContextManager");
      }
      active() {
        return context_1.ROOT_CONTEXT;
      }
      with(_context, fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      bind(_context, target) {
        return target;
      }
      enable() {
        return this;
      }
      disable() {
        return this;
      }
    };
    exports.NoopContextManager = NoopContextManager;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/context.js
var require_context2 = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/context.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextAPI = void 0;
    var NoopContextManager_1 = require_NoopContextManager();
    var global_utils_1 = require_global_utils();
    var diag_1 = require_diag();
    var API_NAME = "context";
    var NOOP_CONTEXT_MANAGER = new NoopContextManager_1.NoopContextManager();
    var ContextAPI = class _ContextAPI {
      static {
        __name(this, "ContextAPI");
      }
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
      }
      /** Get the singleton instance of the Context API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new _ContextAPI();
        }
        return this._instance;
      }
      /**
       * Set the current context manager.
       *
       * @returns true if the context manager was successfully registered, else false
       */
      setGlobalContextManager(contextManager) {
        return (0, global_utils_1.registerGlobal)(API_NAME, contextManager, diag_1.DiagAPI.instance());
      }
      /**
       * Get the currently active context
       */
      active() {
        return this._getContextManager().active();
      }
      /**
       * Execute a function with an active context
       *
       * @param context context to be active during function execution
       * @param fn function to execute in a context
       * @param thisArg optional receiver to be used for calling fn
       * @param args optional arguments forwarded to fn
       */
      with(context, fn, thisArg, ...args) {
        return this._getContextManager().with(context, fn, thisArg, ...args);
      }
      /**
       * Bind a context to a target function or event emitter
       *
       * @param context context to bind to the event emitter or function. Defaults to the currently active context
       * @param target function or event emitter to bind
       */
      bind(context, target) {
        return this._getContextManager().bind(context, target);
      }
      _getContextManager() {
        return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_CONTEXT_MANAGER;
      }
      /** Disable and remove the global context manager */
      disable() {
        this._getContextManager().disable();
        (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
      }
    };
    exports.ContextAPI = ContextAPI;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/trace_flags.js
var require_trace_flags = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/trace_flags.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TraceFlags = void 0;
    var TraceFlags;
    (function(TraceFlags2) {
      TraceFlags2[TraceFlags2["NONE"] = 0] = "NONE";
      TraceFlags2[TraceFlags2["SAMPLED"] = 1] = "SAMPLED";
    })(TraceFlags = exports.TraceFlags || (exports.TraceFlags = {}));
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/invalid-span-constants.js
var require_invalid_span_constants = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/invalid-span-constants.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = void 0;
    var trace_flags_1 = require_trace_flags();
    exports.INVALID_SPANID = "0000000000000000";
    exports.INVALID_TRACEID = "00000000000000000000000000000000";
    exports.INVALID_SPAN_CONTEXT = {
      traceId: exports.INVALID_TRACEID,
      spanId: exports.INVALID_SPANID,
      traceFlags: trace_flags_1.TraceFlags.NONE
    };
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NonRecordingSpan.js
var require_NonRecordingSpan = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NonRecordingSpan.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NonRecordingSpan = void 0;
    var invalid_span_constants_1 = require_invalid_span_constants();
    var NonRecordingSpan = class {
      static {
        __name(this, "NonRecordingSpan");
      }
      constructor(_spanContext = invalid_span_constants_1.INVALID_SPAN_CONTEXT) {
        this._spanContext = _spanContext;
      }
      // Returns a SpanContext.
      spanContext() {
        return this._spanContext;
      }
      // By default does nothing
      setAttribute(_key, _value) {
        return this;
      }
      // By default does nothing
      setAttributes(_attributes) {
        return this;
      }
      // By default does nothing
      addEvent(_name, _attributes) {
        return this;
      }
      addLink(_link) {
        return this;
      }
      addLinks(_links) {
        return this;
      }
      // By default does nothing
      setStatus(_status) {
        return this;
      }
      // By default does nothing
      updateName(_name) {
        return this;
      }
      // By default does nothing
      end(_endTime) {
      }
      // isRecording always returns false for NonRecordingSpan.
      isRecording() {
        return false;
      }
      // By default does nothing
      recordException(_exception, _time) {
      }
    };
    exports.NonRecordingSpan = NonRecordingSpan;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/context-utils.js
var require_context_utils = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/context-utils.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSpanContext = exports.setSpanContext = exports.deleteSpan = exports.setSpan = exports.getActiveSpan = exports.getSpan = void 0;
    var context_1 = require_context();
    var NonRecordingSpan_1 = require_NonRecordingSpan();
    var context_2 = require_context2();
    var SPAN_KEY = (0, context_1.createContextKey)("OpenTelemetry Context Key SPAN");
    function getSpan(context) {
      return context.getValue(SPAN_KEY) || void 0;
    }
    __name(getSpan, "getSpan");
    exports.getSpan = getSpan;
    function getActiveSpan() {
      return getSpan(context_2.ContextAPI.getInstance().active());
    }
    __name(getActiveSpan, "getActiveSpan");
    exports.getActiveSpan = getActiveSpan;
    function setSpan(context, span) {
      return context.setValue(SPAN_KEY, span);
    }
    __name(setSpan, "setSpan");
    exports.setSpan = setSpan;
    function deleteSpan(context) {
      return context.deleteValue(SPAN_KEY);
    }
    __name(deleteSpan, "deleteSpan");
    exports.deleteSpan = deleteSpan;
    function setSpanContext(context, spanContext) {
      return setSpan(context, new NonRecordingSpan_1.NonRecordingSpan(spanContext));
    }
    __name(setSpanContext, "setSpanContext");
    exports.setSpanContext = setSpanContext;
    function getSpanContext(context) {
      var _a;
      return (_a = getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
    }
    __name(getSpanContext, "getSpanContext");
    exports.getSpanContext = getSpanContext;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/spancontext-utils.js
var require_spancontext_utils = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/spancontext-utils.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wrapSpanContext = exports.isSpanContextValid = exports.isValidSpanId = exports.isValidTraceId = void 0;
    var invalid_span_constants_1 = require_invalid_span_constants();
    var NonRecordingSpan_1 = require_NonRecordingSpan();
    var VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
    var VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
    function isValidTraceId(traceId) {
      return VALID_TRACEID_REGEX.test(traceId) && traceId !== invalid_span_constants_1.INVALID_TRACEID;
    }
    __name(isValidTraceId, "isValidTraceId");
    exports.isValidTraceId = isValidTraceId;
    function isValidSpanId(spanId) {
      return VALID_SPANID_REGEX.test(spanId) && spanId !== invalid_span_constants_1.INVALID_SPANID;
    }
    __name(isValidSpanId, "isValidSpanId");
    exports.isValidSpanId = isValidSpanId;
    function isSpanContextValid(spanContext) {
      return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
    }
    __name(isSpanContextValid, "isSpanContextValid");
    exports.isSpanContextValid = isSpanContextValid;
    function wrapSpanContext(spanContext) {
      return new NonRecordingSpan_1.NonRecordingSpan(spanContext);
    }
    __name(wrapSpanContext, "wrapSpanContext");
    exports.wrapSpanContext = wrapSpanContext;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracer.js
var require_NoopTracer = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracer.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoopTracer = void 0;
    var context_1 = require_context2();
    var context_utils_1 = require_context_utils();
    var NonRecordingSpan_1 = require_NonRecordingSpan();
    var spancontext_utils_1 = require_spancontext_utils();
    var contextApi = context_1.ContextAPI.getInstance();
    var NoopTracer = class {
      static {
        __name(this, "NoopTracer");
      }
      // startSpan starts a noop span.
      startSpan(name, options2, context = contextApi.active()) {
        const root2 = Boolean(options2 === null || options2 === void 0 ? void 0 : options2.root);
        if (root2) {
          return new NonRecordingSpan_1.NonRecordingSpan();
        }
        const parentFromContext = context && (0, context_utils_1.getSpanContext)(context);
        if (isSpanContext(parentFromContext) && (0, spancontext_utils_1.isSpanContextValid)(parentFromContext)) {
          return new NonRecordingSpan_1.NonRecordingSpan(parentFromContext);
        } else {
          return new NonRecordingSpan_1.NonRecordingSpan();
        }
      }
      startActiveSpan(name, arg2, arg3, arg4) {
        let opts;
        let ctx;
        let fn;
        if (arguments.length < 2) {
          return;
        } else if (arguments.length === 2) {
          fn = arg2;
        } else if (arguments.length === 3) {
          opts = arg2;
          fn = arg3;
        } else {
          opts = arg2;
          ctx = arg3;
          fn = arg4;
        }
        const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
        const span = this.startSpan(name, opts, parentContext);
        const contextWithSpanSet = (0, context_utils_1.setSpan)(parentContext, span);
        return contextApi.with(contextWithSpanSet, fn, void 0, span);
      }
    };
    exports.NoopTracer = NoopTracer;
    function isSpanContext(spanContext) {
      return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
    }
    __name(isSpanContext, "isSpanContext");
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracer.js
var require_ProxyTracer = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracer.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProxyTracer = void 0;
    var NoopTracer_1 = require_NoopTracer();
    var NOOP_TRACER = new NoopTracer_1.NoopTracer();
    var ProxyTracer = class {
      static {
        __name(this, "ProxyTracer");
      }
      constructor(_provider, name, version2, options2) {
        this._provider = _provider;
        this.name = name;
        this.version = version2;
        this.options = options2;
      }
      startSpan(name, options2, context) {
        return this._getTracer().startSpan(name, options2, context);
      }
      startActiveSpan(_name, _options, _context, _fn) {
        const tracer2 = this._getTracer();
        return Reflect.apply(tracer2.startActiveSpan, tracer2, arguments);
      }
      /**
       * Try to get a tracer from the proxy tracer provider.
       * If the proxy tracer provider has no delegate, return a noop tracer.
       */
      _getTracer() {
        if (this._delegate) {
          return this._delegate;
        }
        const tracer2 = this._provider.getDelegateTracer(this.name, this.version, this.options);
        if (!tracer2) {
          return NOOP_TRACER;
        }
        this._delegate = tracer2;
        return this._delegate;
      }
    };
    exports.ProxyTracer = ProxyTracer;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracerProvider.js
var require_NoopTracerProvider = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracerProvider.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoopTracerProvider = void 0;
    var NoopTracer_1 = require_NoopTracer();
    var NoopTracerProvider = class {
      static {
        __name(this, "NoopTracerProvider");
      }
      getTracer(_name, _version, _options) {
        return new NoopTracer_1.NoopTracer();
      }
    };
    exports.NoopTracerProvider = NoopTracerProvider;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracerProvider.js
var require_ProxyTracerProvider = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracerProvider.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProxyTracerProvider = void 0;
    var ProxyTracer_1 = require_ProxyTracer();
    var NoopTracerProvider_1 = require_NoopTracerProvider();
    var NOOP_TRACER_PROVIDER = new NoopTracerProvider_1.NoopTracerProvider();
    var ProxyTracerProvider = class {
      static {
        __name(this, "ProxyTracerProvider");
      }
      /**
       * Get a {@link ProxyTracer}
       */
      getTracer(name, version2, options2) {
        var _a;
        return (_a = this.getDelegateTracer(name, version2, options2)) !== null && _a !== void 0 ? _a : new ProxyTracer_1.ProxyTracer(this, name, version2, options2);
      }
      getDelegate() {
        var _a;
        return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
      }
      /**
       * Set the delegate tracer provider
       */
      setDelegate(delegate) {
        this._delegate = delegate;
      }
      getDelegateTracer(name, version2, options2) {
        var _a;
        return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version2, options2);
      }
    };
    exports.ProxyTracerProvider = ProxyTracerProvider;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/SamplingResult.js
var require_SamplingResult = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/SamplingResult.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SamplingDecision = void 0;
    var SamplingDecision;
    (function(SamplingDecision2) {
      SamplingDecision2[SamplingDecision2["NOT_RECORD"] = 0] = "NOT_RECORD";
      SamplingDecision2[SamplingDecision2["RECORD"] = 1] = "RECORD";
      SamplingDecision2[SamplingDecision2["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
    })(SamplingDecision = exports.SamplingDecision || (exports.SamplingDecision = {}));
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/span_kind.js
var require_span_kind = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/span_kind.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpanKind = void 0;
    var SpanKind;
    (function(SpanKind2) {
      SpanKind2[SpanKind2["INTERNAL"] = 0] = "INTERNAL";
      SpanKind2[SpanKind2["SERVER"] = 1] = "SERVER";
      SpanKind2[SpanKind2["CLIENT"] = 2] = "CLIENT";
      SpanKind2[SpanKind2["PRODUCER"] = 3] = "PRODUCER";
      SpanKind2[SpanKind2["CONSUMER"] = 4] = "CONSUMER";
    })(SpanKind = exports.SpanKind || (exports.SpanKind = {}));
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/status.js
var require_status = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/status.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpanStatusCode = void 0;
    var SpanStatusCode2;
    (function(SpanStatusCode3) {
      SpanStatusCode3[SpanStatusCode3["UNSET"] = 0] = "UNSET";
      SpanStatusCode3[SpanStatusCode3["OK"] = 1] = "OK";
      SpanStatusCode3[SpanStatusCode3["ERROR"] = 2] = "ERROR";
    })(SpanStatusCode2 = exports.SpanStatusCode || (exports.SpanStatusCode = {}));
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-validators.js
var require_tracestate_validators = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-validators.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateValue = exports.validateKey = void 0;
    var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
    var VALID_KEY = `[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`;
    var VALID_VENDOR_KEY = `[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`;
    var VALID_KEY_REGEX = new RegExp(`^(?:${VALID_KEY}|${VALID_VENDOR_KEY})$`);
    var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
    var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
    function validateKey(key) {
      return VALID_KEY_REGEX.test(key);
    }
    __name(validateKey, "validateKey");
    exports.validateKey = validateKey;
    function validateValue(value) {
      return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
    }
    __name(validateValue, "validateValue");
    exports.validateValue = validateValue;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-impl.js
var require_tracestate_impl = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-impl.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TraceStateImpl = void 0;
    var tracestate_validators_1 = require_tracestate_validators();
    var MAX_TRACE_STATE_ITEMS = 32;
    var MAX_TRACE_STATE_LEN = 512;
    var LIST_MEMBERS_SEPARATOR = ",";
    var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
    var TraceStateImpl = class _TraceStateImpl {
      static {
        __name(this, "TraceStateImpl");
      }
      constructor(rawTraceState) {
        this._internalState = /* @__PURE__ */ new Map();
        if (rawTraceState)
          this._parse(rawTraceState);
      }
      set(key, value) {
        const traceState = this._clone();
        if (traceState._internalState.has(key)) {
          traceState._internalState.delete(key);
        }
        traceState._internalState.set(key, value);
        return traceState;
      }
      unset(key) {
        const traceState = this._clone();
        traceState._internalState.delete(key);
        return traceState;
      }
      get(key) {
        return this._internalState.get(key);
      }
      serialize() {
        return this._keys().reduce((agg, key) => {
          agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key));
          return agg;
        }, []).join(LIST_MEMBERS_SEPARATOR);
      }
      _parse(rawTraceState) {
        if (rawTraceState.length > MAX_TRACE_STATE_LEN)
          return;
        this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reverse().reduce((agg, part) => {
          const listMember = part.trim();
          const i6 = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
          if (i6 !== -1) {
            const key = listMember.slice(0, i6);
            const value = listMember.slice(i6 + 1, part.length);
            if ((0, tracestate_validators_1.validateKey)(key) && (0, tracestate_validators_1.validateValue)(value)) {
              agg.set(key, value);
            } else {
            }
          }
          return agg;
        }, /* @__PURE__ */ new Map());
        if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
          this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
        }
      }
      _keys() {
        return Array.from(this._internalState.keys()).reverse();
      }
      _clone() {
        const traceState = new _TraceStateImpl();
        traceState._internalState = new Map(this._internalState);
        return traceState;
      }
    };
    exports.TraceStateImpl = TraceStateImpl;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/utils.js
var require_utils2 = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/utils.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTraceState = void 0;
    var tracestate_impl_1 = require_tracestate_impl();
    function createTraceState(rawTraceState) {
      return new tracestate_impl_1.TraceStateImpl(rawTraceState);
    }
    __name(createTraceState, "createTraceState");
    exports.createTraceState = createTraceState;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context-api.js
var require_context_api = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context-api.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.context = void 0;
    var context_1 = require_context2();
    exports.context = context_1.ContextAPI.getInstance();
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag-api.js
var require_diag_api = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag-api.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.diag = void 0;
    var diag_1 = require_diag();
    exports.diag = diag_1.DiagAPI.instance();
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeterProvider.js
var require_NoopMeterProvider = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeterProvider.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NOOP_METER_PROVIDER = exports.NoopMeterProvider = void 0;
    var NoopMeter_1 = require_NoopMeter();
    var NoopMeterProvider = class {
      static {
        __name(this, "NoopMeterProvider");
      }
      getMeter(_name, _version, _options) {
        return NoopMeter_1.NOOP_METER;
      }
    };
    exports.NoopMeterProvider = NoopMeterProvider;
    exports.NOOP_METER_PROVIDER = new NoopMeterProvider();
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/metrics.js
var require_metrics = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/metrics.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MetricsAPI = void 0;
    var NoopMeterProvider_1 = require_NoopMeterProvider();
    var global_utils_1 = require_global_utils();
    var diag_1 = require_diag();
    var API_NAME = "metrics";
    var MetricsAPI = class _MetricsAPI {
      static {
        __name(this, "MetricsAPI");
      }
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
      }
      /** Get the singleton instance of the Metrics API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new _MetricsAPI();
        }
        return this._instance;
      }
      /**
       * Set the current global meter provider.
       * Returns true if the meter provider was successfully registered, else false.
       */
      setGlobalMeterProvider(provider) {
        return (0, global_utils_1.registerGlobal)(API_NAME, provider, diag_1.DiagAPI.instance());
      }
      /**
       * Returns the global meter provider.
       */
      getMeterProvider() {
        return (0, global_utils_1.getGlobal)(API_NAME) || NoopMeterProvider_1.NOOP_METER_PROVIDER;
      }
      /**
       * Returns a meter from the global meter provider.
       */
      getMeter(name, version2, options2) {
        return this.getMeterProvider().getMeter(name, version2, options2);
      }
      /** Remove the global meter provider */
      disable() {
        (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
      }
    };
    exports.MetricsAPI = MetricsAPI;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics-api.js
var require_metrics_api = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics-api.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.metrics = void 0;
    var metrics_1 = require_metrics();
    exports.metrics = metrics_1.MetricsAPI.getInstance();
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/NoopTextMapPropagator.js
var require_NoopTextMapPropagator = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/NoopTextMapPropagator.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoopTextMapPropagator = void 0;
    var NoopTextMapPropagator = class {
      static {
        __name(this, "NoopTextMapPropagator");
      }
      /** Noop inject function does nothing */
      inject(_context, _carrier) {
      }
      /** Noop extract function does nothing and returns the input context */
      extract(context, _carrier) {
        return context;
      }
      fields() {
        return [];
      }
    };
    exports.NoopTextMapPropagator = NoopTextMapPropagator;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/context-helpers.js
var require_context_helpers = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/context-helpers.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deleteBaggage = exports.setBaggage = exports.getActiveBaggage = exports.getBaggage = void 0;
    var context_1 = require_context2();
    var context_2 = require_context();
    var BAGGAGE_KEY = (0, context_2.createContextKey)("OpenTelemetry Baggage Key");
    function getBaggage(context) {
      return context.getValue(BAGGAGE_KEY) || void 0;
    }
    __name(getBaggage, "getBaggage");
    exports.getBaggage = getBaggage;
    function getActiveBaggage() {
      return getBaggage(context_1.ContextAPI.getInstance().active());
    }
    __name(getActiveBaggage, "getActiveBaggage");
    exports.getActiveBaggage = getActiveBaggage;
    function setBaggage(context, baggage) {
      return context.setValue(BAGGAGE_KEY, baggage);
    }
    __name(setBaggage, "setBaggage");
    exports.setBaggage = setBaggage;
    function deleteBaggage(context) {
      return context.deleteValue(BAGGAGE_KEY);
    }
    __name(deleteBaggage, "deleteBaggage");
    exports.deleteBaggage = deleteBaggage;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/propagation.js
var require_propagation = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/propagation.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PropagationAPI = void 0;
    var global_utils_1 = require_global_utils();
    var NoopTextMapPropagator_1 = require_NoopTextMapPropagator();
    var TextMapPropagator_1 = require_TextMapPropagator();
    var context_helpers_1 = require_context_helpers();
    var utils_1 = require_utils();
    var diag_1 = require_diag();
    var API_NAME = "propagation";
    var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator_1.NoopTextMapPropagator();
    var PropagationAPI = class _PropagationAPI {
      static {
        __name(this, "PropagationAPI");
      }
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
        this.createBaggage = utils_1.createBaggage;
        this.getBaggage = context_helpers_1.getBaggage;
        this.getActiveBaggage = context_helpers_1.getActiveBaggage;
        this.setBaggage = context_helpers_1.setBaggage;
        this.deleteBaggage = context_helpers_1.deleteBaggage;
      }
      /** Get the singleton instance of the Propagator API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new _PropagationAPI();
        }
        return this._instance;
      }
      /**
       * Set the current propagator.
       *
       * @returns true if the propagator was successfully registered, else false
       */
      setGlobalPropagator(propagator) {
        return (0, global_utils_1.registerGlobal)(API_NAME, propagator, diag_1.DiagAPI.instance());
      }
      /**
       * Inject context into a carrier to be propagated inter-process
       *
       * @param context Context carrying tracing data to inject
       * @param carrier carrier to inject context into
       * @param setter Function used to set values on the carrier
       */
      inject(context, carrier, setter = TextMapPropagator_1.defaultTextMapSetter) {
        return this._getGlobalPropagator().inject(context, carrier, setter);
      }
      /**
       * Extract context from a carrier
       *
       * @param context Context which the newly created context will inherit from
       * @param carrier Carrier to extract context from
       * @param getter Function used to extract keys from a carrier
       */
      extract(context, carrier, getter = TextMapPropagator_1.defaultTextMapGetter) {
        return this._getGlobalPropagator().extract(context, carrier, getter);
      }
      /**
       * Return a list of all fields which may be used by the propagator.
       */
      fields() {
        return this._getGlobalPropagator().fields();
      }
      /** Remove the global propagator */
      disable() {
        (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
      }
      _getGlobalPropagator() {
        return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
      }
    };
    exports.PropagationAPI = PropagationAPI;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation-api.js
var require_propagation_api = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation-api.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.propagation = void 0;
    var propagation_1 = require_propagation();
    exports.propagation = propagation_1.PropagationAPI.getInstance();
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/trace.js
var require_trace = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/trace.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TraceAPI = void 0;
    var global_utils_1 = require_global_utils();
    var ProxyTracerProvider_1 = require_ProxyTracerProvider();
    var spancontext_utils_1 = require_spancontext_utils();
    var context_utils_1 = require_context_utils();
    var diag_1 = require_diag();
    var API_NAME = "trace";
    var TraceAPI = class _TraceAPI {
      static {
        __name(this, "TraceAPI");
      }
      /** Empty private constructor prevents end users from constructing a new instance of the API */
      constructor() {
        this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
        this.wrapSpanContext = spancontext_utils_1.wrapSpanContext;
        this.isSpanContextValid = spancontext_utils_1.isSpanContextValid;
        this.deleteSpan = context_utils_1.deleteSpan;
        this.getSpan = context_utils_1.getSpan;
        this.getActiveSpan = context_utils_1.getActiveSpan;
        this.getSpanContext = context_utils_1.getSpanContext;
        this.setSpan = context_utils_1.setSpan;
        this.setSpanContext = context_utils_1.setSpanContext;
      }
      /** Get the singleton instance of the Trace API */
      static getInstance() {
        if (!this._instance) {
          this._instance = new _TraceAPI();
        }
        return this._instance;
      }
      /**
       * Set the current global tracer.
       *
       * @returns true if the tracer provider was successfully registered, else false
       */
      setGlobalTracerProvider(provider) {
        const success = (0, global_utils_1.registerGlobal)(API_NAME, this._proxyTracerProvider, diag_1.DiagAPI.instance());
        if (success) {
          this._proxyTracerProvider.setDelegate(provider);
        }
        return success;
      }
      /**
       * Returns the global tracer provider.
       */
      getTracerProvider() {
        return (0, global_utils_1.getGlobal)(API_NAME) || this._proxyTracerProvider;
      }
      /**
       * Returns a tracer from the global tracer provider.
       */
      getTracer(name, version2) {
        return this.getTracerProvider().getTracer(name, version2);
      }
      /** Remove the global tracer provider */
      disable() {
        (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
        this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
      }
    };
    exports.TraceAPI = TraceAPI;
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace-api.js
var require_trace_api = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace-api.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.trace = void 0;
    var trace_1 = require_trace();
    exports.trace = trace_1.TraceAPI.getInstance();
  }
});

// ../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/index.js
var require_src = __commonJS({
  "../../node_modules/.deno/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/index.js"(exports) {
    "use strict";
    init_modules_watch_stub();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.trace = exports.propagation = exports.metrics = exports.diag = exports.context = exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = exports.isValidSpanId = exports.isValidTraceId = exports.isSpanContextValid = exports.createTraceState = exports.TraceFlags = exports.SpanStatusCode = exports.SpanKind = exports.SamplingDecision = exports.ProxyTracerProvider = exports.ProxyTracer = exports.defaultTextMapSetter = exports.defaultTextMapGetter = exports.ValueType = exports.createNoopMeter = exports.DiagLogLevel = exports.DiagConsoleLogger = exports.ROOT_CONTEXT = exports.createContextKey = exports.baggageEntryMetadataFromString = void 0;
    var utils_1 = require_utils();
    Object.defineProperty(exports, "baggageEntryMetadataFromString", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return utils_1.baggageEntryMetadataFromString;
    }, "get") });
    var context_1 = require_context();
    Object.defineProperty(exports, "createContextKey", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return context_1.createContextKey;
    }, "get") });
    Object.defineProperty(exports, "ROOT_CONTEXT", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return context_1.ROOT_CONTEXT;
    }, "get") });
    var consoleLogger_1 = require_consoleLogger();
    Object.defineProperty(exports, "DiagConsoleLogger", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return consoleLogger_1.DiagConsoleLogger;
    }, "get") });
    var types_1 = require_types();
    Object.defineProperty(exports, "DiagLogLevel", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return types_1.DiagLogLevel;
    }, "get") });
    var NoopMeter_1 = require_NoopMeter();
    Object.defineProperty(exports, "createNoopMeter", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return NoopMeter_1.createNoopMeter;
    }, "get") });
    var Metric_1 = require_Metric();
    Object.defineProperty(exports, "ValueType", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return Metric_1.ValueType;
    }, "get") });
    var TextMapPropagator_1 = require_TextMapPropagator();
    Object.defineProperty(exports, "defaultTextMapGetter", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return TextMapPropagator_1.defaultTextMapGetter;
    }, "get") });
    Object.defineProperty(exports, "defaultTextMapSetter", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return TextMapPropagator_1.defaultTextMapSetter;
    }, "get") });
    var ProxyTracer_1 = require_ProxyTracer();
    Object.defineProperty(exports, "ProxyTracer", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return ProxyTracer_1.ProxyTracer;
    }, "get") });
    var ProxyTracerProvider_1 = require_ProxyTracerProvider();
    Object.defineProperty(exports, "ProxyTracerProvider", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return ProxyTracerProvider_1.ProxyTracerProvider;
    }, "get") });
    var SamplingResult_1 = require_SamplingResult();
    Object.defineProperty(exports, "SamplingDecision", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return SamplingResult_1.SamplingDecision;
    }, "get") });
    var span_kind_1 = require_span_kind();
    Object.defineProperty(exports, "SpanKind", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return span_kind_1.SpanKind;
    }, "get") });
    var status_1 = require_status();
    Object.defineProperty(exports, "SpanStatusCode", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return status_1.SpanStatusCode;
    }, "get") });
    var trace_flags_1 = require_trace_flags();
    Object.defineProperty(exports, "TraceFlags", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return trace_flags_1.TraceFlags;
    }, "get") });
    var utils_2 = require_utils2();
    Object.defineProperty(exports, "createTraceState", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return utils_2.createTraceState;
    }, "get") });
    var spancontext_utils_1 = require_spancontext_utils();
    Object.defineProperty(exports, "isSpanContextValid", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return spancontext_utils_1.isSpanContextValid;
    }, "get") });
    Object.defineProperty(exports, "isValidTraceId", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return spancontext_utils_1.isValidTraceId;
    }, "get") });
    Object.defineProperty(exports, "isValidSpanId", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return spancontext_utils_1.isValidSpanId;
    }, "get") });
    var invalid_span_constants_1 = require_invalid_span_constants();
    Object.defineProperty(exports, "INVALID_SPANID", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return invalid_span_constants_1.INVALID_SPANID;
    }, "get") });
    Object.defineProperty(exports, "INVALID_TRACEID", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return invalid_span_constants_1.INVALID_TRACEID;
    }, "get") });
    Object.defineProperty(exports, "INVALID_SPAN_CONTEXT", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return invalid_span_constants_1.INVALID_SPAN_CONTEXT;
    }, "get") });
    var context_api_1 = require_context_api();
    Object.defineProperty(exports, "context", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return context_api_1.context;
    }, "get") });
    var diag_api_1 = require_diag_api();
    Object.defineProperty(exports, "diag", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return diag_api_1.diag;
    }, "get") });
    var metrics_api_1 = require_metrics_api();
    Object.defineProperty(exports, "metrics", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return metrics_api_1.metrics;
    }, "get") });
    var propagation_api_1 = require_propagation_api();
    Object.defineProperty(exports, "propagation", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return propagation_api_1.propagation;
    }, "get") });
    var trace_api_1 = require_trace_api();
    Object.defineProperty(exports, "trace", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return trace_api_1.trace;
    }, "get") });
    exports.default = {
      context: context_api_1.context,
      diag: diag_api_1.diag,
      metrics: metrics_api_1.metrics,
      propagation: propagation_api_1.propagation,
      trace: trace_api_1.trace
    };
  }
});

// ../../node_modules/.deno/preact@10.27.0/node_modules/preact/dist/preact.module.js
function d(n5, l7) {
  for (var u6 in l7) n5[u6] = l7[u6];
  return n5;
}
function g(n5) {
  n5 && n5.parentNode && n5.parentNode.removeChild(n5);
}
function _(l7, u6, t5) {
  var i6, r4, o6, e4 = {};
  for (o6 in u6) "key" == o6 ? i6 = u6[o6] : "ref" == o6 ? r4 = u6[o6] : e4[o6] = u6[o6];
  if (arguments.length > 2 && (e4.children = arguments.length > 3 ? n.call(arguments, 2) : t5), "function" == typeof l7 && null != l7.defaultProps) for (o6 in l7.defaultProps) void 0 === e4[o6] && (e4[o6] = l7.defaultProps[o6]);
  return m(l7, e4, i6, r4, null);
}
function m(n5, t5, i6, r4, o6) {
  var e4 = { type: n5, props: t5, key: i6, ref: r4, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o6 ? ++u : o6, __i: -1, __u: 0 };
  return null == o6 && null != l.vnode && l.vnode(e4), e4;
}
function k(n5) {
  return n5.children;
}
function x(n5, l7) {
  this.props = n5, this.context = l7;
}
function S(n5, l7) {
  if (null == l7) return n5.__ ? S(n5.__, n5.__i + 1) : null;
  for (var u6; l7 < n5.__k.length; l7++) if (null != (u6 = n5.__k[l7]) && null != u6.__e) return u6.__e;
  return "function" == typeof n5.type ? S(n5) : null;
}
function C(n5) {
  var l7, u6;
  if (null != (n5 = n5.__) && null != n5.__c) {
    for (n5.__e = n5.__c.base = null, l7 = 0; l7 < n5.__k.length; l7++) if (null != (u6 = n5.__k[l7]) && null != u6.__e) {
      n5.__e = n5.__c.base = u6.__e;
      break;
    }
    return C(n5);
  }
}
function M(n5) {
  (!n5.__d && (n5.__d = true) && i.push(n5) && !$.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)($);
}
function $() {
  for (var n5, u6, t5, r4, o6, f6, c6, s6 = 1; i.length; ) i.length > s6 && i.sort(e), n5 = i.shift(), s6 = i.length, n5.__d && (t5 = void 0, o6 = (r4 = (u6 = n5).__v).__e, f6 = [], c6 = [], u6.__P && ((t5 = d({}, r4)).__v = r4.__v + 1, l.vnode && l.vnode(t5), O(u6.__P, t5, r4, u6.__n, u6.__P.namespaceURI, 32 & r4.__u ? [o6] : null, f6, null == o6 ? S(r4) : o6, !!(32 & r4.__u), c6), t5.__v = r4.__v, t5.__.__k[t5.__i] = t5, N(f6, t5, c6), t5.__e != o6 && C(t5)));
  $.__r = 0;
}
function I(n5, l7, u6, t5, i6, r4, o6, e4, f6, c6, s6) {
  var a6, h6, y5, w5, d6, g4, _4 = t5 && t5.__k || v, m4 = l7.length;
  for (f6 = P(u6, l7, _4, f6, m4), a6 = 0; a6 < m4; a6++) null != (y5 = u6.__k[a6]) && (h6 = -1 == y5.__i ? p : _4[y5.__i] || p, y5.__i = a6, g4 = O(n5, y5, h6, i6, r4, o6, e4, f6, c6, s6), w5 = y5.__e, y5.ref && h6.ref != y5.ref && (h6.ref && B(h6.ref, null, y5), s6.push(y5.ref, y5.__c || w5, y5)), null == d6 && null != w5 && (d6 = w5), 4 & y5.__u || h6.__k === y5.__k ? f6 = A(y5, f6, n5) : "function" == typeof y5.type && void 0 !== g4 ? f6 = g4 : w5 && (f6 = w5.nextSibling), y5.__u &= -7);
  return u6.__e = d6, f6;
}
function P(n5, l7, u6, t5, i6) {
  var r4, o6, e4, f6, c6, s6 = u6.length, a6 = s6, h6 = 0;
  for (n5.__k = new Array(i6), r4 = 0; r4 < i6; r4++) null != (o6 = l7[r4]) && "boolean" != typeof o6 && "function" != typeof o6 ? (f6 = r4 + h6, (o6 = n5.__k[r4] = "string" == typeof o6 || "number" == typeof o6 || "bigint" == typeof o6 || o6.constructor == String ? m(null, o6, null, null, null) : w(o6) ? m(k, { children: o6 }, null, null, null) : null == o6.constructor && o6.__b > 0 ? m(o6.type, o6.props, o6.key, o6.ref ? o6.ref : null, o6.__v) : o6).__ = n5, o6.__b = n5.__b + 1, e4 = null, -1 != (c6 = o6.__i = L(o6, u6, f6, a6)) && (a6--, (e4 = u6[c6]) && (e4.__u |= 2)), null == e4 || null == e4.__v ? (-1 == c6 && (i6 > s6 ? h6-- : i6 < s6 && h6++), "function" != typeof o6.type && (o6.__u |= 4)) : c6 != f6 && (c6 == f6 - 1 ? h6-- : c6 == f6 + 1 ? h6++ : (c6 > f6 ? h6-- : h6++, o6.__u |= 4))) : n5.__k[r4] = null;
  if (a6) for (r4 = 0; r4 < s6; r4++) null != (e4 = u6[r4]) && 0 == (2 & e4.__u) && (e4.__e == t5 && (t5 = S(e4)), D(e4, e4));
  return t5;
}
function A(n5, l7, u6) {
  var t5, i6;
  if ("function" == typeof n5.type) {
    for (t5 = n5.__k, i6 = 0; t5 && i6 < t5.length; i6++) t5[i6] && (t5[i6].__ = n5, l7 = A(t5[i6], l7, u6));
    return l7;
  }
  n5.__e != l7 && (l7 && n5.type && !u6.contains(l7) && (l7 = S(n5)), u6.insertBefore(n5.__e, l7 || null), l7 = n5.__e);
  do {
    l7 = l7 && l7.nextSibling;
  } while (null != l7 && 8 == l7.nodeType);
  return l7;
}
function L(n5, l7, u6, t5) {
  var i6, r4, o6, e4 = n5.key, f6 = n5.type, c6 = l7[u6], s6 = null != c6 && 0 == (2 & c6.__u);
  if (null === c6 && null == n5.key || s6 && e4 == c6.key && f6 == c6.type) return u6;
  if (t5 > (s6 ? 1 : 0)) {
    for (i6 = u6 - 1, r4 = u6 + 1; i6 >= 0 || r4 < l7.length; ) if (null != (c6 = l7[o6 = i6 >= 0 ? i6-- : r4++]) && 0 == (2 & c6.__u) && e4 == c6.key && f6 == c6.type) return o6;
  }
  return -1;
}
function T(n5, l7, u6) {
  "-" == l7[0] ? n5.setProperty(l7, null == u6 ? "" : u6) : n5[l7] = null == u6 ? "" : "number" != typeof u6 || y.test(l7) ? u6 : u6 + "px";
}
function j(n5, l7, u6, t5, i6) {
  var r4, o6;
  n: if ("style" == l7) if ("string" == typeof u6) n5.style.cssText = u6;
  else {
    if ("string" == typeof t5 && (n5.style.cssText = t5 = ""), t5) for (l7 in t5) u6 && l7 in u6 || T(n5.style, l7, "");
    if (u6) for (l7 in u6) t5 && u6[l7] == t5[l7] || T(n5.style, l7, u6[l7]);
  }
  else if ("o" == l7[0] && "n" == l7[1]) r4 = l7 != (l7 = l7.replace(f, "$1")), o6 = l7.toLowerCase(), l7 = o6 in n5 || "onFocusOut" == l7 || "onFocusIn" == l7 ? o6.slice(2) : l7.slice(2), n5.l || (n5.l = {}), n5.l[l7 + r4] = u6, u6 ? t5 ? u6.u = t5.u : (u6.u = c, n5.addEventListener(l7, r4 ? a : s, r4)) : n5.removeEventListener(l7, r4 ? a : s, r4);
  else {
    if ("http://www.w3.org/2000/svg" == i6) l7 = l7.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != l7 && "height" != l7 && "href" != l7 && "list" != l7 && "form" != l7 && "tabIndex" != l7 && "download" != l7 && "rowSpan" != l7 && "colSpan" != l7 && "role" != l7 && "popover" != l7 && l7 in n5) try {
      n5[l7] = null == u6 ? "" : u6;
      break n;
    } catch (n6) {
    }
    "function" == typeof u6 || (null == u6 || false === u6 && "-" != l7[4] ? n5.removeAttribute(l7) : n5.setAttribute(l7, "popover" == l7 && 1 == u6 ? "" : u6));
  }
}
function F(n5) {
  return function(u6) {
    if (this.l) {
      var t5 = this.l[u6.type + n5];
      if (null == u6.t) u6.t = c++;
      else if (u6.t < t5.u) return;
      return t5(l.event ? l.event(u6) : u6);
    }
  };
}
function O(n5, u6, t5, i6, r4, o6, e4, f6, c6, s6) {
  var a6, h6, p6, v5, y5, _4, m4, b3, S3, C4, M2, $2, P3, A3, H, L3, T5, j4 = u6.type;
  if (null != u6.constructor) return null;
  128 & t5.__u && (c6 = !!(32 & t5.__u), o6 = [f6 = u6.__e = t5.__e]), (a6 = l.__b) && a6(u6);
  n: if ("function" == typeof j4) try {
    if (b3 = u6.props, S3 = "prototype" in j4 && j4.prototype.render, C4 = (a6 = j4.contextType) && i6[a6.__c], M2 = a6 ? C4 ? C4.props.value : a6.__ : i6, t5.__c ? m4 = (h6 = u6.__c = t5.__c).__ = h6.__E : (S3 ? u6.__c = h6 = new j4(b3, M2) : (u6.__c = h6 = new x(b3, M2), h6.constructor = j4, h6.render = E), C4 && C4.sub(h6), h6.props = b3, h6.state || (h6.state = {}), h6.context = M2, h6.__n = i6, p6 = h6.__d = true, h6.__h = [], h6._sb = []), S3 && null == h6.__s && (h6.__s = h6.state), S3 && null != j4.getDerivedStateFromProps && (h6.__s == h6.state && (h6.__s = d({}, h6.__s)), d(h6.__s, j4.getDerivedStateFromProps(b3, h6.__s))), v5 = h6.props, y5 = h6.state, h6.__v = u6, p6) S3 && null == j4.getDerivedStateFromProps && null != h6.componentWillMount && h6.componentWillMount(), S3 && null != h6.componentDidMount && h6.__h.push(h6.componentDidMount);
    else {
      if (S3 && null == j4.getDerivedStateFromProps && b3 !== v5 && null != h6.componentWillReceiveProps && h6.componentWillReceiveProps(b3, M2), !h6.__e && null != h6.shouldComponentUpdate && false === h6.shouldComponentUpdate(b3, h6.__s, M2) || u6.__v == t5.__v) {
        for (u6.__v != t5.__v && (h6.props = b3, h6.state = h6.__s, h6.__d = false), u6.__e = t5.__e, u6.__k = t5.__k, u6.__k.some(function(n6) {
          n6 && (n6.__ = u6);
        }), $2 = 0; $2 < h6._sb.length; $2++) h6.__h.push(h6._sb[$2]);
        h6._sb = [], h6.__h.length && e4.push(h6);
        break n;
      }
      null != h6.componentWillUpdate && h6.componentWillUpdate(b3, h6.__s, M2), S3 && null != h6.componentDidUpdate && h6.__h.push(function() {
        h6.componentDidUpdate(v5, y5, _4);
      });
    }
    if (h6.context = M2, h6.props = b3, h6.__P = n5, h6.__e = false, P3 = l.__r, A3 = 0, S3) {
      for (h6.state = h6.__s, h6.__d = false, P3 && P3(u6), a6 = h6.render(h6.props, h6.state, h6.context), H = 0; H < h6._sb.length; H++) h6.__h.push(h6._sb[H]);
      h6._sb = [];
    } else do {
      h6.__d = false, P3 && P3(u6), a6 = h6.render(h6.props, h6.state, h6.context), h6.state = h6.__s;
    } while (h6.__d && ++A3 < 25);
    h6.state = h6.__s, null != h6.getChildContext && (i6 = d(d({}, i6), h6.getChildContext())), S3 && !p6 && null != h6.getSnapshotBeforeUpdate && (_4 = h6.getSnapshotBeforeUpdate(v5, y5)), L3 = a6, null != a6 && a6.type === k && null == a6.key && (L3 = V(a6.props.children)), f6 = I(n5, w(L3) ? L3 : [L3], u6, t5, i6, r4, o6, e4, f6, c6, s6), h6.base = u6.__e, u6.__u &= -161, h6.__h.length && e4.push(h6), m4 && (h6.__E = h6.__ = null);
  } catch (n6) {
    if (u6.__v = null, c6 || null != o6) if (n6.then) {
      for (u6.__u |= c6 ? 160 : 128; f6 && 8 == f6.nodeType && f6.nextSibling; ) f6 = f6.nextSibling;
      o6[o6.indexOf(f6)] = null, u6.__e = f6;
    } else {
      for (T5 = o6.length; T5--; ) g(o6[T5]);
      z(u6);
    }
    else u6.__e = t5.__e, u6.__k = t5.__k, n6.then || z(u6);
    l.__e(n6, u6, t5);
  }
  else null == o6 && u6.__v == t5.__v ? (u6.__k = t5.__k, u6.__e = t5.__e) : f6 = u6.__e = q(t5.__e, u6, t5, i6, r4, o6, e4, c6, s6);
  return (a6 = l.diffed) && a6(u6), 128 & u6.__u ? void 0 : f6;
}
function z(n5) {
  n5 && n5.__c && (n5.__c.__e = true), n5 && n5.__k && n5.__k.forEach(z);
}
function N(n5, u6, t5) {
  for (var i6 = 0; i6 < t5.length; i6++) B(t5[i6], t5[++i6], t5[++i6]);
  l.__c && l.__c(u6, n5), n5.some(function(u7) {
    try {
      n5 = u7.__h, u7.__h = [], n5.some(function(n6) {
        n6.call(u7);
      });
    } catch (n6) {
      l.__e(n6, u7.__v);
    }
  });
}
function V(n5) {
  return "object" != typeof n5 || null == n5 || n5.__b && n5.__b > 0 ? n5 : w(n5) ? n5.map(V) : d({}, n5);
}
function q(u6, t5, i6, r4, o6, e4, f6, c6, s6) {
  var a6, h6, v5, y5, d6, _4, m4, b3 = i6.props, k4 = t5.props, x3 = t5.type;
  if ("svg" == x3 ? o6 = "http://www.w3.org/2000/svg" : "math" == x3 ? o6 = "http://www.w3.org/1998/Math/MathML" : o6 || (o6 = "http://www.w3.org/1999/xhtml"), null != e4) {
    for (a6 = 0; a6 < e4.length; a6++) if ((d6 = e4[a6]) && "setAttribute" in d6 == !!x3 && (x3 ? d6.localName == x3 : 3 == d6.nodeType)) {
      u6 = d6, e4[a6] = null;
      break;
    }
  }
  if (null == u6) {
    if (null == x3) return document.createTextNode(k4);
    u6 = document.createElementNS(o6, x3, k4.is && k4), c6 && (l.__m && l.__m(t5, e4), c6 = false), e4 = null;
  }
  if (null == x3) b3 === k4 || c6 && u6.data == k4 || (u6.data = k4);
  else {
    if (e4 = e4 && n.call(u6.childNodes), b3 = i6.props || p, !c6 && null != e4) for (b3 = {}, a6 = 0; a6 < u6.attributes.length; a6++) b3[(d6 = u6.attributes[a6]).name] = d6.value;
    for (a6 in b3) if (d6 = b3[a6], "children" == a6) ;
    else if ("dangerouslySetInnerHTML" == a6) v5 = d6;
    else if (!(a6 in k4)) {
      if ("value" == a6 && "defaultValue" in k4 || "checked" == a6 && "defaultChecked" in k4) continue;
      j(u6, a6, null, d6, o6);
    }
    for (a6 in k4) d6 = k4[a6], "children" == a6 ? y5 = d6 : "dangerouslySetInnerHTML" == a6 ? h6 = d6 : "value" == a6 ? _4 = d6 : "checked" == a6 ? m4 = d6 : c6 && "function" != typeof d6 || b3[a6] === d6 || j(u6, a6, d6, b3[a6], o6);
    if (h6) c6 || v5 && (h6.__html == v5.__html || h6.__html == u6.innerHTML) || (u6.innerHTML = h6.__html), t5.__k = [];
    else if (v5 && (u6.innerHTML = ""), I("template" == t5.type ? u6.content : u6, w(y5) ? y5 : [y5], t5, i6, r4, "foreignObject" == x3 ? "http://www.w3.org/1999/xhtml" : o6, e4, f6, e4 ? e4[0] : i6.__k && S(i6, 0), c6, s6), null != e4) for (a6 = e4.length; a6--; ) g(e4[a6]);
    c6 || (a6 = "value", "progress" == x3 && null == _4 ? u6.removeAttribute("value") : null != _4 && (_4 !== u6[a6] || "progress" == x3 && !_4 || "option" == x3 && _4 != b3[a6]) && j(u6, a6, _4, b3[a6], o6), a6 = "checked", null != m4 && m4 != u6[a6] && j(u6, a6, m4, b3[a6], o6));
  }
  return u6;
}
function B(n5, u6, t5) {
  try {
    if ("function" == typeof n5) {
      var i6 = "function" == typeof n5.__u;
      i6 && n5.__u(), i6 && null == u6 || (n5.__u = n5(u6));
    } else n5.current = u6;
  } catch (n6) {
    l.__e(n6, t5);
  }
}
function D(n5, u6, t5) {
  var i6, r4;
  if (l.unmount && l.unmount(n5), (i6 = n5.ref) && (i6.current && i6.current != n5.__e || B(i6, null, u6)), null != (i6 = n5.__c)) {
    if (i6.componentWillUnmount) try {
      i6.componentWillUnmount();
    } catch (n6) {
      l.__e(n6, u6);
    }
    i6.base = i6.__P = null;
  }
  if (i6 = n5.__k) for (r4 = 0; r4 < i6.length; r4++) i6[r4] && D(i6[r4], u6, t5 || "function" != typeof n5.type);
  t5 || g(n5.__e), n5.__c = n5.__ = n5.__e = void 0;
}
function E(n5, l7, u6) {
  return this.constructor(n5, u6);
}
var n, l, u, t, i, r, o, e, f, c, s, a, h, p, v, y, w;
var init_preact_module = __esm({
  "../../node_modules/.deno/preact@10.27.0/node_modules/preact/dist/preact.module.js"() {
    init_modules_watch_stub();
    p = {};
    v = [];
    y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
    w = Array.isArray;
    __name(d, "d");
    __name(g, "g");
    __name(_, "_");
    __name(m, "m");
    __name(k, "k");
    __name(x, "x");
    __name(S, "S");
    __name(C, "C");
    __name(M, "M");
    __name($, "$");
    __name(I, "I");
    __name(P, "P");
    __name(A, "A");
    __name(L, "L");
    __name(T, "T");
    __name(j, "j");
    __name(F, "F");
    __name(O, "O");
    __name(z, "z");
    __name(N, "N");
    __name(V, "V");
    __name(q, "q");
    __name(B, "B");
    __name(D, "D");
    __name(E, "E");
    n = v.slice, l = { __e: /* @__PURE__ */ __name(function(n5, l7, u6, t5) {
      for (var i6, r4, o6; l7 = l7.__; ) if ((i6 = l7.__c) && !i6.__) try {
        if ((r4 = i6.constructor) && null != r4.getDerivedStateFromError && (i6.setState(r4.getDerivedStateFromError(n5)), o6 = i6.__d), null != i6.componentDidCatch && (i6.componentDidCatch(n5, t5 || {}), o6 = i6.__d), o6) return i6.__E = i6;
      } catch (l8) {
        n5 = l8;
      }
      throw n5;
    }, "__e") }, u = 0, t = /* @__PURE__ */ __name(function(n5) {
      return null != n5 && null == n5.constructor;
    }, "t"), x.prototype.setState = function(n5, l7) {
      var u6;
      u6 = null != this.__s && this.__s != this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n5 && (n5 = n5(d({}, u6), this.props)), n5 && d(u6, n5), null != n5 && this.__v && (l7 && this._sb.push(l7), M(this));
    }, x.prototype.forceUpdate = function(n5) {
      this.__v && (this.__e = true, n5 && this.__h.push(n5), M(this));
    }, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = /* @__PURE__ */ __name(function(n5, l7) {
      return n5.__v.__b - l7.__v.__b;
    }, "e"), $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(false), a = F(true), h = 0;
  }
});

// ../../node_modules/.deno/preact@10.27.0/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
function n2(r4) {
  if (0 === r4.length || false === t2.test(r4)) return r4;
  for (var e4 = 0, n5 = 0, o6 = "", f6 = ""; n5 < r4.length; n5++) {
    switch (r4.charCodeAt(n5)) {
      case 34:
        f6 = "&quot;";
        break;
      case 38:
        f6 = "&amp;";
        break;
      case 60:
        f6 = "&lt;";
        break;
      default:
        continue;
    }
    n5 !== e4 && (o6 += r4.slice(e4, n5)), o6 += f6, e4 = n5 + 1;
  }
  return n5 !== e4 && (o6 += r4.slice(e4, n5)), o6;
}
function u2(e4, t5, n5, o6, i6, u6) {
  t5 || (t5 = {});
  var a6, c6, p6 = t5;
  if ("ref" in p6) for (c6 in p6 = {}, t5) "ref" == c6 ? a6 = t5[c6] : p6[c6] = t5[c6];
  var l7 = { type: e4, props: p6, key: n5, ref: a6, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f2, __i: -1, __u: 0, __source: i6, __self: u6 };
  if ("function" == typeof e4 && (a6 = e4.defaultProps)) for (c6 in a6) void 0 === p6[c6] && (p6[c6] = a6[c6]);
  return l.vnode && l.vnode(l7), l7;
}
function a2(r4) {
  var t5 = u2(k, { tpl: r4, exprs: [].slice.call(arguments, 1) });
  return t5.key = t5.__v, t5;
}
function l2(e4, t5) {
  if (l.attr) {
    var f6 = l.attr(e4, t5);
    if ("string" == typeof f6) return f6;
  }
  if (t5 = function(r4) {
    return null !== r4 && "object" == typeof r4 && "function" == typeof r4.valueOf ? r4.valueOf() : r4;
  }(t5), "ref" === e4 || "key" === e4) return "";
  if ("style" === e4 && "object" == typeof t5) {
    var i6 = "";
    for (var u6 in t5) {
      var a6 = t5[u6];
      if (null != a6 && "" !== a6) {
        var l7 = "-" == u6[0] ? u6 : c2[u6] || (c2[u6] = u6.replace(p2, "-$&").toLowerCase()), s6 = ";";
        "number" != typeof a6 || l7.startsWith("--") || o2.test(l7) || (s6 = "px;"), i6 = i6 + l7 + ":" + a6 + s6;
      }
    }
    return e4 + '="' + n2(i6) + '"';
  }
  return null == t5 || false === t5 || "function" == typeof t5 || "object" == typeof t5 ? "" : true === t5 ? e4 : e4 + '="' + n2("" + t5) + '"';
}
function s2(r4) {
  if (null == r4 || "boolean" == typeof r4 || "function" == typeof r4) return null;
  if ("object" == typeof r4) {
    if (void 0 === r4.constructor) return r4;
    if (i2(r4)) {
      for (var e4 = 0; e4 < r4.length; e4++) r4[e4] = s2(r4[e4]);
      return r4;
    }
  }
  return n2("" + r4);
}
var t2, o2, f2, i2, c2, p2;
var init_jsxRuntime_module = __esm({
  "../../node_modules/.deno/preact@10.27.0/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js"() {
    init_modules_watch_stub();
    init_preact_module();
    init_preact_module();
    t2 = /["&<]/;
    __name(n2, "n");
    o2 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
    f2 = 0;
    i2 = Array.isArray;
    __name(u2, "u");
    __name(a2, "a");
    c2 = {};
    p2 = /[A-Z]/g;
    __name(l2, "l");
    __name(s2, "s");
  }
});

// ../../node_modules/.deno/preact-render-to-string@6.5.13/node_modules/preact-render-to-string/dist/index.module.js
function l3(e4) {
  if (0 === e4.length || false === s3.test(e4)) return e4;
  for (var t5 = 0, r4 = 0, n5 = "", o6 = ""; r4 < e4.length; r4++) {
    switch (e4.charCodeAt(r4)) {
      case 34:
        o6 = "&quot;";
        break;
      case 38:
        o6 = "&amp;";
        break;
      case 60:
        o6 = "&lt;";
        break;
      default:
        continue;
    }
    r4 !== t5 && (n5 += e4.slice(t5, r4)), n5 += o6, t5 = r4 + 1;
  }
  return r4 !== t5 && (n5 += e4.slice(t5, r4)), n5;
}
function h2(e4) {
  var t5 = "";
  for (var r4 in e4) {
    var n5 = e4[r4];
    if (null != n5 && "" !== n5) {
      var o6 = "-" == r4[0] ? r4 : u3[r4] || (u3[r4] = r4.replace(p3, "-$&").toLowerCase()), i6 = ";";
      "number" != typeof n5 || o6.startsWith("--") || f3.has(o6) || (i6 = "px;"), t5 = t5 + o6 + ":" + n5 + i6;
    }
  }
  return t5 || void 0;
}
function d2() {
  this.__d = true;
}
function v2(e4, t5) {
  return { __v: e4, context: t5, props: e4.props, setState: d2, forceUpdate: d2, __d: true, __h: new Array(0) };
}
function D2(n5, o6, i6) {
  var a6 = l.__s;
  l.__s = true, k2 = l.__b, w2 = l.diffed, x2 = l.__r, C2 = l.unmount;
  var c6 = _(k, null);
  c6.__k = [n5];
  try {
    var s6 = U(n5, o6 || S2, false, void 0, c6, false, i6);
    return E2(s6) ? s6.join(j2) : s6;
  } catch (e4) {
    if (e4.then) throw new Error('Use "renderToStringAsync" for suspenseful rendering.');
    throw e4;
  } finally {
    l.__c && l.__c(n5, L2), l.__s = a6, L2.length = 0;
  }
}
function P2(e4, t5) {
  var r4, n5 = e4.type, o6 = true;
  return e4.__c ? (o6 = false, (r4 = e4.__c).state = r4.__s) : r4 = new n5(e4.props, t5), e4.__c = r4, r4.__v = e4, r4.props = e4.props, r4.context = t5, r4.__d = true, null == r4.state && (r4.state = S2), null == r4.__s && (r4.__s = r4.state), n5.getDerivedStateFromProps ? r4.state = T2({}, r4.state, n5.getDerivedStateFromProps(r4.props, r4.state)) : o6 && r4.componentWillMount ? (r4.componentWillMount(), r4.state = r4.__s !== r4.state ? r4.__s : r4.state) : !o6 && r4.componentWillUpdate && r4.componentWillUpdate(), x2 && x2(e4), r4.render(r4.props, r4.state, t5);
}
function U(t5, s6, u6, f6, p6, d6, _4) {
  if (null == t5 || true === t5 || false === t5 || t5 === j2) return j2;
  var m4 = typeof t5;
  if ("object" != m4) return "function" == m4 ? j2 : "string" == m4 ? l3(t5) : t5 + j2;
  if (E2(t5)) {
    var y5, g4 = j2;
    p6.__k = t5;
    for (var b3 = t5.length, A3 = 0; A3 < b3; A3++) {
      var L3 = t5[A3];
      if (null != L3 && "boolean" != typeof L3) {
        var D4, F3 = U(L3, s6, u6, f6, p6, d6, _4);
        "string" == typeof F3 ? g4 += F3 : (y5 || (y5 = new Array(b3)), g4 && y5.push(g4), g4 = j2, E2(F3) ? (D4 = y5).push.apply(D4, F3) : y5.push(F3));
      }
    }
    return y5 ? (g4 && y5.push(g4), y5) : g4;
  }
  if (void 0 !== t5.constructor) return j2;
  t5.__ = p6, k2 && k2(t5);
  var M2 = t5.type, W = t5.props;
  if ("function" == typeof M2) {
    var $2, z3, H, N2 = s6;
    if (M2 === k) {
      if ("tpl" in W) {
        for (var q3 = j2, B3 = 0; B3 < W.tpl.length; B3++) if (q3 += W.tpl[B3], W.exprs && B3 < W.exprs.length) {
          var I2 = W.exprs[B3];
          if (null == I2) continue;
          "object" != typeof I2 || void 0 !== I2.constructor && !E2(I2) ? q3 += I2 : q3 += U(I2, s6, u6, f6, t5, d6, _4);
        }
        return q3;
      }
      if ("UNSTABLE_comment" in W) return "<!--" + l3(W.UNSTABLE_comment) + "-->";
      z3 = W.children;
    } else {
      if (null != ($2 = M2.contextType)) {
        var O2 = s6[$2.__c];
        N2 = O2 ? O2.props.value : $2.__;
      }
      var R = M2.prototype && "function" == typeof M2.prototype.render;
      if (R) z3 = P2(t5, N2), H = t5.__c;
      else {
        t5.__c = H = v2(t5, N2);
        for (var V2 = 0; H.__d && V2++ < 25; ) H.__d = false, x2 && x2(t5), z3 = M2.call(H, W, N2);
        H.__d = true;
      }
      if (null != H.getChildContext && (s6 = T2({}, s6, H.getChildContext())), R && l.errorBoundaries && (M2.getDerivedStateFromError || H.componentDidCatch)) {
        z3 = null != z3 && z3.type === k && null == z3.key && null == z3.props.tpl ? z3.props.children : z3;
        try {
          return U(z3, s6, u6, f6, t5, d6, _4);
        } catch (e4) {
          return M2.getDerivedStateFromError && (H.__s = M2.getDerivedStateFromError(e4)), H.componentDidCatch && H.componentDidCatch(e4, S2), H.__d ? (z3 = P2(t5, s6), null != (H = t5.__c).getChildContext && (s6 = T2({}, s6, H.getChildContext())), U(z3 = null != z3 && z3.type === k && null == z3.key && null == z3.props.tpl ? z3.props.children : z3, s6, u6, f6, t5, d6, _4)) : j2;
        } finally {
          w2 && w2(t5), C2 && C2(t5);
        }
      }
    }
    z3 = null != z3 && z3.type === k && null == z3.key && null == z3.props.tpl ? z3.props.children : z3;
    try {
      var K = U(z3, s6, u6, f6, t5, d6, _4);
      return w2 && w2(t5), l.unmount && l.unmount(t5), K;
    } catch (r4) {
      if (!d6 && _4 && _4.onError) {
        var G = _4.onError(r4, t5, function(e4, t6) {
          return U(e4, s6, u6, f6, t6, d6, _4);
        });
        if (void 0 !== G) return G;
        var J = l.__e;
        return J && J(r4, t5), j2;
      }
      if (!d6) throw r4;
      if (!r4 || "function" != typeof r4.then) throw r4;
      return r4.then(/* @__PURE__ */ __name(function e4() {
        try {
          return U(z3, s6, u6, f6, t5, d6, _4);
        } catch (r5) {
          if (!r5 || "function" != typeof r5.then) throw r5;
          return r5.then(function() {
            return U(z3, s6, u6, f6, t5, d6, _4);
          }, e4);
        }
      }, "e"));
    }
  }
  var Q, X = "<" + M2, Y = j2;
  for (var ee in W) {
    var te = W[ee];
    if ("function" != typeof te || "class" === ee || "className" === ee) {
      switch (ee) {
        case "children":
          Q = te;
          continue;
        case "key":
        case "ref":
        case "__self":
        case "__source":
          continue;
        case "htmlFor":
          if ("for" in W) continue;
          ee = "for";
          break;
        case "className":
          if ("class" in W) continue;
          ee = "class";
          break;
        case "defaultChecked":
          ee = "checked";
          break;
        case "defaultSelected":
          ee = "selected";
          break;
        case "defaultValue":
        case "value":
          switch (ee = "value", M2) {
            case "textarea":
              Q = te;
              continue;
            case "select":
              f6 = te;
              continue;
            case "option":
              f6 != te || "selected" in W || (X += " selected");
          }
          break;
        case "dangerouslySetInnerHTML":
          Y = te && te.__html;
          continue;
        case "style":
          "object" == typeof te && (te = h2(te));
          break;
        case "acceptCharset":
          ee = "accept-charset";
          break;
        case "httpEquiv":
          ee = "http-equiv";
          break;
        default:
          if (o3.test(ee)) ee = ee.replace(o3, "$1:$2").toLowerCase();
          else {
            if (n3.test(ee)) continue;
            "-" !== ee[4] && !c3.has(ee) || null == te ? u6 ? a3.test(ee) && (ee = "panose1" === ee ? "panose-1" : ee.replace(/([A-Z])/g, "-$1").toLowerCase()) : i3.test(ee) && (ee = ee.toLowerCase()) : te += j2;
          }
      }
      null != te && false !== te && (X = true === te || te === j2 ? X + " " + ee : X + " " + ee + '="' + ("string" == typeof te ? l3(te) : te + j2) + '"');
    }
  }
  if (n3.test(M2)) throw new Error(M2 + " is not a valid HTML tag name in " + X + ">");
  if (Y || ("string" == typeof Q ? Y = l3(Q) : null != Q && false !== Q && true !== Q && (Y = U(Q, s6, "svg" === M2 || "foreignObject" !== M2 && u6, f6, t5, d6, _4))), w2 && w2(t5), C2 && C2(t5), !Y && Z.has(M2)) return X + "/>";
  var re = "</" + M2 + ">", ne = X + ">";
  return E2(Y) ? [ne].concat(Y, [re]) : "string" != typeof Y ? [ne, Y, re] : ne + Y + re;
}
var n3, o3, i3, a3, c3, s3, u3, f3, p3, k2, w2, x2, C2, S2, L2, E2, T2, j2, Z;
var init_index_module = __esm({
  "../../node_modules/.deno/preact-render-to-string@6.5.13/node_modules/preact-render-to-string/dist/index.module.js"() {
    init_modules_watch_stub();
    init_preact_module();
    n3 = /[\s\n\\/='"\0<>]/;
    o3 = /^(xlink|xmlns|xml)([A-Z])/;
    i3 = /^(?:accessK|auto[A-Z]|cell|ch|col|cont|cross|dateT|encT|form[A-Z]|frame|hrefL|inputM|maxL|minL|noV|playsI|popoverT|readO|rowS|src[A-Z]|tabI|useM|item[A-Z])/;
    a3 = /^ac|^ali|arabic|basel|cap|clipPath$|clipRule$|color|dominant|enable|fill|flood|font|glyph[^R]|horiz|image|letter|lighting|marker[^WUH]|overline|panose|pointe|paint|rendering|shape|stop|strikethrough|stroke|text[^L]|transform|underline|unicode|units|^v[^i]|^w|^xH/;
    c3 = /* @__PURE__ */ new Set(["draggable", "spellcheck"]);
    s3 = /["&<]/;
    __name(l3, "l");
    u3 = {};
    f3 = /* @__PURE__ */ new Set(["animation-iteration-count", "border-image-outset", "border-image-slice", "border-image-width", "box-flex", "box-flex-group", "box-ordinal-group", "column-count", "fill-opacity", "flex", "flex-grow", "flex-negative", "flex-order", "flex-positive", "flex-shrink", "flood-opacity", "font-weight", "grid-column", "grid-row", "line-clamp", "line-height", "opacity", "order", "orphans", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit", "stroke-opacity", "stroke-width", "tab-size", "widows", "z-index", "zoom"]);
    p3 = /[A-Z]/g;
    __name(h2, "h");
    __name(d2, "d");
    __name(v2, "v");
    S2 = {};
    L2 = [];
    E2 = Array.isArray;
    T2 = Object.assign;
    j2 = "";
    __name(D2, "D");
    __name(P2, "P");
    __name(U, "U");
    Z = /* @__PURE__ */ new Set(["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
  }
});

// ../../node_modules/.deno/preact@10.27.0/node_modules/preact/hooks/dist/hooks.module.js
function p4(n5, t5) {
  c4.__h && c4.__h(r2, n5, o4 || t5), o4 = 0;
  var u6 = r2.__H || (r2.__H = { __: [], __h: [] });
  return n5 >= u6.__.length && u6.__.push({}), u6.__[n5];
}
function d3(n5) {
  return o4 = 1, h3(D3, n5);
}
function h3(n5, u6, i6) {
  var o6 = p4(t3++, 2);
  if (o6.t = n5, !o6.__c && (o6.__ = [i6 ? i6(u6) : D3(void 0, u6), function(n6) {
    var t5 = o6.__N ? o6.__N[0] : o6.__[0], r4 = o6.t(t5, n6);
    t5 !== r4 && (o6.__N = [r4, o6.__[1]], o6.__c.setState({}));
  }], o6.__c = r2, !r2.__f)) {
    var f6 = /* @__PURE__ */ __name(function(n6, t5, r4) {
      if (!o6.__c.__H) return true;
      var u7 = o6.__c.__H.__.filter(function(n7) {
        return !!n7.__c;
      });
      if (u7.every(function(n7) {
        return !n7.__N;
      })) return !c6 || c6.call(this, n6, t5, r4);
      var i7 = o6.__c.props !== n6;
      return u7.forEach(function(n7) {
        if (n7.__N) {
          var t6 = n7.__[0];
          n7.__ = n7.__N, n7.__N = void 0, t6 !== n7.__[0] && (i7 = true);
        }
      }), c6 && c6.call(this, n6, t5, r4) || i7;
    }, "f");
    r2.__f = true;
    var c6 = r2.shouldComponentUpdate, e4 = r2.componentWillUpdate;
    r2.componentWillUpdate = function(n6, t5, r4) {
      if (this.__e) {
        var u7 = c6;
        c6 = void 0, f6(n6, t5, r4), c6 = u7;
      }
      e4 && e4.call(this, n6, t5, r4);
    }, r2.shouldComponentUpdate = f6;
  }
  return o6.__N || o6.__;
}
function T3(n5, r4) {
  var u6 = p4(t3++, 7);
  return C3(u6.__H, r4) && (u6.__ = n5(), u6.__H = r4, u6.__h = n5), u6.__;
}
function j3() {
  for (var n5; n5 = f4.shift(); ) if (n5.__P && n5.__H) try {
    n5.__H.__h.forEach(z2), n5.__H.__h.forEach(B2), n5.__H.__h = [];
  } catch (t5) {
    n5.__H.__h = [], c4.__e(t5, n5.__v);
  }
}
function w3(n5) {
  var t5, r4 = /* @__PURE__ */ __name(function() {
    clearTimeout(u6), k3 && cancelAnimationFrame(t5), setTimeout(n5);
  }, "r"), u6 = setTimeout(r4, 35);
  k3 && (t5 = requestAnimationFrame(r4));
}
function z2(n5) {
  var t5 = r2, u6 = n5.__c;
  "function" == typeof u6 && (n5.__c = void 0, u6()), r2 = t5;
}
function B2(n5) {
  var t5 = r2;
  n5.__c = n5.__(), r2 = t5;
}
function C3(n5, t5) {
  return !n5 || n5.length !== t5.length || t5.some(function(t6, r4) {
    return t6 !== n5[r4];
  });
}
function D3(n5, t5) {
  return "function" == typeof t5 ? t5(n5) : t5;
}
var t3, r2, u4, i4, o4, f4, c4, e2, a4, v3, l4, m2, s4, k3;
var init_hooks_module = __esm({
  "../../node_modules/.deno/preact@10.27.0/node_modules/preact/hooks/dist/hooks.module.js"() {
    init_modules_watch_stub();
    init_preact_module();
    o4 = 0;
    f4 = [];
    c4 = l;
    e2 = c4.__b;
    a4 = c4.__r;
    v3 = c4.diffed;
    l4 = c4.__c;
    m2 = c4.unmount;
    s4 = c4.__;
    __name(p4, "p");
    __name(d3, "d");
    __name(h3, "h");
    __name(T3, "T");
    __name(j3, "j");
    c4.__b = function(n5) {
      r2 = null, e2 && e2(n5);
    }, c4.__ = function(n5, t5) {
      n5 && t5.__k && t5.__k.__m && (n5.__m = t5.__k.__m), s4 && s4(n5, t5);
    }, c4.__r = function(n5) {
      a4 && a4(n5), t3 = 0;
      var i6 = (r2 = n5.__c).__H;
      i6 && (u4 === r2 ? (i6.__h = [], r2.__h = [], i6.__.forEach(function(n6) {
        n6.__N && (n6.__ = n6.__N), n6.u = n6.__N = void 0;
      })) : (i6.__h.forEach(z2), i6.__h.forEach(B2), i6.__h = [], t3 = 0)), u4 = r2;
    }, c4.diffed = function(n5) {
      v3 && v3(n5);
      var t5 = n5.__c;
      t5 && t5.__H && (t5.__H.__h.length && (1 !== f4.push(t5) && i4 === c4.requestAnimationFrame || ((i4 = c4.requestAnimationFrame) || w3)(j3)), t5.__H.__.forEach(function(n6) {
        n6.u && (n6.__H = n6.u), n6.u = void 0;
      })), u4 = r2 = null;
    }, c4.__c = function(n5, t5) {
      t5.some(function(n6) {
        try {
          n6.__h.forEach(z2), n6.__h = n6.__h.filter(function(n7) {
            return !n7.__ || B2(n7);
          });
        } catch (r4) {
          t5.some(function(n7) {
            n7.__h && (n7.__h = []);
          }), t5 = [], c4.__e(r4, n6.__v);
        }
      }), l4 && l4(n5, t5);
    }, c4.unmount = function(n5) {
      m2 && m2(n5);
      var t5, r4 = n5.__c;
      r4 && r4.__H && (r4.__H.__.forEach(function(n6) {
        try {
          z2(n6);
        } catch (n7) {
          t5 = n7;
        }
      }), r4.__H = void 0, t5 && c4.__e(t5, r4.__v));
    };
    k3 = "function" == typeof requestAnimationFrame;
    __name(w3, "w");
    __name(z2, "z");
    __name(B2, "B");
    __name(C3, "C");
    __name(D3, "D");
  }
});

// ../../node_modules/.deno/@preact+signals-core@1.11.0/node_modules/@preact/signals-core/dist/signals-core.module.js
function t4() {
  if (!(s5 > 1)) {
    var i6, t5 = false;
    while (void 0 !== h4) {
      var r4 = h4;
      h4 = void 0;
      f5++;
      while (void 0 !== r4) {
        var o6 = r4.o;
        r4.o = void 0;
        r4.f &= -3;
        if (!(8 & r4.f) && c5(r4)) try {
          r4.c();
        } catch (r5) {
          if (!t5) {
            i6 = r5;
            t5 = true;
          }
        }
        r4 = o6;
      }
    }
    f5 = 0;
    s5--;
    if (t5) throw i6;
  } else s5--;
}
function r3(i6) {
  if (s5 > 0) return i6();
  s5++;
  try {
    return i6();
  } finally {
    t4();
  }
}
function n4(i6) {
  var t5 = o5;
  o5 = void 0;
  try {
    return i6();
  } finally {
    o5 = t5;
  }
}
function e3(i6) {
  if (void 0 !== o5) {
    var t5 = i6.n;
    if (void 0 === t5 || t5.t !== o5) {
      t5 = { i: 0, S: i6, p: o5.s, n: void 0, t: o5, e: void 0, x: void 0, r: t5 };
      if (void 0 !== o5.s) o5.s.n = t5;
      o5.s = t5;
      i6.n = t5;
      if (32 & o5.f) i6.S(t5);
      return t5;
    } else if (-1 === t5.i) {
      t5.i = 0;
      if (void 0 !== t5.n) {
        t5.n.p = t5.p;
        if (void 0 !== t5.p) t5.p.n = t5.n;
        t5.p = o5.s;
        t5.n = void 0;
        o5.s.n = t5;
        o5.s = t5;
      }
      return t5;
    }
  }
}
function u5(i6, t5) {
  this.v = i6;
  this.i = 0;
  this.n = void 0;
  this.t = void 0;
  this.W = null == t5 ? void 0 : t5.watched;
  this.Z = null == t5 ? void 0 : t5.unwatched;
}
function d4(i6, t5) {
  return new u5(i6, t5);
}
function c5(i6) {
  for (var t5 = i6.s; void 0 !== t5; t5 = t5.n) if (t5.S.i !== t5.i || !t5.S.h() || t5.S.i !== t5.i) return true;
  return false;
}
function a5(i6) {
  for (var t5 = i6.s; void 0 !== t5; t5 = t5.n) {
    var r4 = t5.S.n;
    if (void 0 !== r4) t5.r = r4;
    t5.S.n = t5;
    t5.i = -1;
    if (void 0 === t5.n) {
      i6.s = t5;
      break;
    }
  }
}
function l5(i6) {
  var t5 = i6.s, r4 = void 0;
  while (void 0 !== t5) {
    var o6 = t5.p;
    if (-1 === t5.i) {
      t5.S.U(t5);
      if (void 0 !== o6) o6.n = t5.n;
      if (void 0 !== t5.n) t5.n.p = o6;
    } else r4 = t5;
    t5.S.n = t5.r;
    if (void 0 !== t5.r) t5.r = void 0;
    t5 = o6;
  }
  i6.s = r4;
}
function y2(i6, t5) {
  u5.call(this, void 0);
  this.x = i6;
  this.s = void 0;
  this.g = v4 - 1;
  this.f = 4;
  this.W = null == t5 ? void 0 : t5.watched;
  this.Z = null == t5 ? void 0 : t5.unwatched;
}
function w4(i6, t5) {
  return new y2(i6, t5);
}
function _2(i6) {
  var r4 = i6.u;
  i6.u = void 0;
  if ("function" == typeof r4) {
    s5++;
    var n5 = o5;
    o5 = void 0;
    try {
      r4();
    } catch (t5) {
      i6.f &= -2;
      i6.f |= 8;
      b(i6);
      throw t5;
    } finally {
      o5 = n5;
      t4();
    }
  }
}
function b(i6) {
  for (var t5 = i6.s; void 0 !== t5; t5 = t5.n) t5.S.U(t5);
  i6.x = void 0;
  i6.s = void 0;
  _2(i6);
}
function g2(i6) {
  if (o5 !== this) throw new Error("Out-of-order effect");
  l5(this);
  o5 = i6;
  this.f &= -2;
  if (8 & this.f) b(this);
  t4();
}
function p5(i6) {
  this.x = i6;
  this.u = void 0;
  this.s = void 0;
  this.o = void 0;
  this.f = 32;
}
function E3(i6) {
  var t5 = new p5(i6);
  try {
    t5.c();
  } catch (i7) {
    t5.d();
    throw i7;
  }
  var r4 = t5.d.bind(t5);
  r4[Symbol.dispose] = r4;
  return r4;
}
var i5, o5, h4, s5, f5, v4;
var init_signals_core_module = __esm({
  "../../node_modules/.deno/@preact+signals-core@1.11.0/node_modules/@preact/signals-core/dist/signals-core.module.js"() {
    init_modules_watch_stub();
    i5 = Symbol.for("preact-signals");
    __name(t4, "t");
    __name(r3, "r");
    o5 = void 0;
    __name(n4, "n");
    h4 = void 0;
    s5 = 0;
    f5 = 0;
    v4 = 0;
    __name(e3, "e");
    __name(u5, "u");
    u5.prototype.brand = i5;
    u5.prototype.h = function() {
      return true;
    };
    u5.prototype.S = function(i6) {
      var t5 = this, r4 = this.t;
      if (r4 !== i6 && void 0 === i6.e) {
        i6.x = r4;
        this.t = i6;
        if (void 0 !== r4) r4.e = i6;
        else n4(function() {
          var i7;
          null == (i7 = t5.W) || i7.call(t5);
        });
      }
    };
    u5.prototype.U = function(i6) {
      var t5 = this;
      if (void 0 !== this.t) {
        var r4 = i6.e, o6 = i6.x;
        if (void 0 !== r4) {
          r4.x = o6;
          i6.e = void 0;
        }
        if (void 0 !== o6) {
          o6.e = r4;
          i6.x = void 0;
        }
        if (i6 === this.t) {
          this.t = o6;
          if (void 0 === o6) n4(function() {
            var i7;
            null == (i7 = t5.Z) || i7.call(t5);
          });
        }
      }
    };
    u5.prototype.subscribe = function(i6) {
      var t5 = this;
      return E3(function() {
        var r4 = t5.value, n5 = o5;
        o5 = void 0;
        try {
          i6(r4);
        } finally {
          o5 = n5;
        }
      });
    };
    u5.prototype.valueOf = function() {
      return this.value;
    };
    u5.prototype.toString = function() {
      return this.value + "";
    };
    u5.prototype.toJSON = function() {
      return this.value;
    };
    u5.prototype.peek = function() {
      var i6 = o5;
      o5 = void 0;
      try {
        return this.value;
      } finally {
        o5 = i6;
      }
    };
    Object.defineProperty(u5.prototype, "value", { get: /* @__PURE__ */ __name(function() {
      var i6 = e3(this);
      if (void 0 !== i6) i6.i = this.i;
      return this.v;
    }, "get"), set: /* @__PURE__ */ __name(function(i6) {
      if (i6 !== this.v) {
        if (f5 > 100) throw new Error("Cycle detected");
        this.v = i6;
        this.i++;
        v4++;
        s5++;
        try {
          for (var r4 = this.t; void 0 !== r4; r4 = r4.x) r4.t.N();
        } finally {
          t4();
        }
      }
    }, "set") });
    __name(d4, "d");
    __name(c5, "c");
    __name(a5, "a");
    __name(l5, "l");
    __name(y2, "y");
    y2.prototype = new u5();
    y2.prototype.h = function() {
      this.f &= -3;
      if (1 & this.f) return false;
      if (32 == (36 & this.f)) return true;
      this.f &= -5;
      if (this.g === v4) return true;
      this.g = v4;
      this.f |= 1;
      if (this.i > 0 && !c5(this)) {
        this.f &= -2;
        return true;
      }
      var i6 = o5;
      try {
        a5(this);
        o5 = this;
        var t5 = this.x();
        if (16 & this.f || this.v !== t5 || 0 === this.i) {
          this.v = t5;
          this.f &= -17;
          this.i++;
        }
      } catch (i7) {
        this.v = i7;
        this.f |= 16;
        this.i++;
      }
      o5 = i6;
      l5(this);
      this.f &= -2;
      return true;
    };
    y2.prototype.S = function(i6) {
      if (void 0 === this.t) {
        this.f |= 36;
        for (var t5 = this.s; void 0 !== t5; t5 = t5.n) t5.S.S(t5);
      }
      u5.prototype.S.call(this, i6);
    };
    y2.prototype.U = function(i6) {
      if (void 0 !== this.t) {
        u5.prototype.U.call(this, i6);
        if (void 0 === this.t) {
          this.f &= -33;
          for (var t5 = this.s; void 0 !== t5; t5 = t5.n) t5.S.U(t5);
        }
      }
    };
    y2.prototype.N = function() {
      if (!(2 & this.f)) {
        this.f |= 6;
        for (var i6 = this.t; void 0 !== i6; i6 = i6.x) i6.t.N();
      }
    };
    Object.defineProperty(y2.prototype, "value", { get: /* @__PURE__ */ __name(function() {
      if (1 & this.f) throw new Error("Cycle detected");
      var i6 = e3(this);
      this.h();
      if (void 0 !== i6) i6.i = this.i;
      if (16 & this.f) throw this.v;
      return this.v;
    }, "get") });
    __name(w4, "w");
    __name(_2, "_");
    __name(b, "b");
    __name(g2, "g");
    __name(p5, "p");
    p5.prototype.c = function() {
      var i6 = this.S();
      try {
        if (8 & this.f) return;
        if (void 0 === this.x) return;
        var t5 = this.x();
        if ("function" == typeof t5) this.u = t5;
      } finally {
        i6();
      }
    };
    p5.prototype.S = function() {
      if (1 & this.f) throw new Error("Cycle detected");
      this.f |= 1;
      this.f &= -9;
      _2(this);
      a5(this);
      s5++;
      var i6 = o5;
      o5 = this;
      return g2.bind(this, i6);
    };
    p5.prototype.N = function() {
      if (!(2 & this.f)) {
        this.f |= 2;
        this.o = h4;
        h4 = this;
      }
    };
    p5.prototype.d = function() {
      this.f |= 8;
      if (!(1 & this.f)) b(this);
    };
    p5.prototype.dispose = function() {
      this.d();
    };
    __name(E3, "E");
  }
});

// ../../node_modules/.deno/@preact+signals@2.2.1/node_modules/@preact/signals/dist/signals.module.js
function _3(i6, r4) {
  l[i6] = r4.bind(null, l[i6] || function() {
  });
}
function g3(i6) {
  if (d5) d5();
  d5 = i6 && i6.S();
}
function b2(i6) {
  var n5 = this, t5 = i6.data, o6 = useSignal(t5);
  o6.value = t5;
  var e4 = T3(function() {
    var i7 = n5, t6 = n5.__v;
    while (t6 = t6.__) if (t6.__c) {
      t6.__c.__$f |= 4;
      break;
    }
    var f6 = w4(function() {
      var i8 = o6.value.value;
      return 0 === i8 ? 0 : true === i8 ? "" : i8 || "";
    }), e5 = w4(function() {
      return !Array.isArray(f6.value) && !t(f6.value);
    }), a7 = E3(function() {
      this.N = T4;
      if (e5.value) {
        var n6 = f6.value;
        if (i7.__v && i7.__v.__e && 3 === i7.__v.__e.nodeType) i7.__v.__e.data = n6;
      }
    }), v6 = n5.__$u.d;
    n5.__$u.d = function() {
      a7();
      v6.call(this);
    };
    return [e5, f6];
  }, []), a6 = e4[0], v5 = e4[1];
  return a6.value ? v5.peek() : v5.value;
}
function y4(i6, n5, r4, t5) {
  var f6 = n5 in i6 && void 0 === i6.ownerSVGElement, o6 = d4(r4);
  return { o: /* @__PURE__ */ __name(function(i7, n6) {
    o6.value = i7;
    t5 = n6;
  }, "o"), d: E3(function() {
    this.N = T4;
    var r5 = o6.value.value;
    if (t5[n5] !== r5) {
      t5[n5] = r5;
      if (f6) i6[n5] = r5;
      else if (r5) i6.setAttribute(n5, r5);
      else i6.removeAttribute(n5);
    }
  }) };
}
function useSignal(i6, n5) {
  return T3(function() {
    return d4(i6, n5);
  }, []);
}
function F2() {
  r3(function() {
    var i6;
    while (i6 = m3.shift()) h5.call(i6);
  });
}
function T4() {
  if (1 === m3.push(this)) (l.requestAnimationFrame || q2)(F2);
}
var h5, l6, d5, m3, q2;
var init_signals_module = __esm({
  "../../node_modules/.deno/@preact+signals@2.2.1/node_modules/@preact/signals/dist/signals.module.js"() {
    init_modules_watch_stub();
    init_preact_module();
    init_hooks_module();
    init_signals_core_module();
    m3 = [];
    E3(function() {
      h5 = this.N;
    })();
    __name(_3, "_");
    __name(g3, "g");
    __name(b2, "b");
    b2.displayName = "_st";
    Object.defineProperties(u5.prototype, { constructor: { configurable: true, value: void 0 }, type: { configurable: true, value: b2 }, props: { configurable: true, get: /* @__PURE__ */ __name(function() {
      return { data: this };
    }, "get") }, __b: { configurable: true, value: 1 } });
    _3("__b", function(i6, n5) {
      if ("string" == typeof n5.type) {
        var r4, t5 = n5.props;
        for (var f6 in t5) if ("children" !== f6) {
          var o6 = t5[f6];
          if (o6 instanceof u5) {
            if (!r4) n5.__np = r4 = {};
            r4[f6] = o6;
            t5[f6] = o6.peek();
          }
        }
      }
      i6(n5);
    });
    _3("__r", function(i6, n5) {
      if (n5.type !== k) {
        g3();
        var r4, f6 = n5.__c;
        if (f6) {
          f6.__$f &= -2;
          if (void 0 === (r4 = f6.__$u)) f6.__$u = r4 = function(i7) {
            var n6;
            E3(function() {
              n6 = this;
            });
            n6.c = function() {
              f6.__$f |= 1;
              f6.setState({});
            };
            return n6;
          }();
        }
        l6 = f6;
        g3(r4);
      }
      i6(n5);
    });
    _3("__e", function(i6, n5, r4, t5) {
      g3();
      l6 = void 0;
      i6(n5, r4, t5);
    });
    _3("diffed", function(i6, n5) {
      g3();
      l6 = void 0;
      var r4;
      if ("string" == typeof n5.type && (r4 = n5.__e)) {
        var t5 = n5.__np, f6 = n5.props;
        if (t5) {
          var o6 = r4.U;
          if (o6) for (var e4 in o6) {
            var u6 = o6[e4];
            if (void 0 !== u6 && !(e4 in t5)) {
              u6.d();
              o6[e4] = void 0;
            }
          }
          else {
            o6 = {};
            r4.U = o6;
          }
          for (var a6 in t5) {
            var c6 = o6[a6], v5 = t5[a6];
            if (void 0 === c6) {
              c6 = y4(r4, a6, v5, f6);
              o6[a6] = c6;
            } else c6.o(v5, f6);
          }
        }
      }
      i6(n5);
    });
    __name(y4, "y");
    _3("unmount", function(i6, n5) {
      if ("string" == typeof n5.type) {
        var r4 = n5.__e;
        if (r4) {
          var t5 = r4.U;
          if (t5) {
            r4.U = void 0;
            for (var f6 in t5) {
              var o6 = t5[f6];
              if (o6) o6.d();
            }
          }
        }
      } else {
        var e4 = n5.__c;
        if (e4) {
          var u6 = e4.__$u;
          if (u6) {
            e4.__$u = void 0;
            u6.d();
          }
        }
      }
      i6(n5);
    });
    _3("__h", function(i6, n5, r4, t5) {
      if (t5 < 3 || 9 === t5) n5.__$f |= 2;
      i6(n5, r4, t5);
    });
    x.prototype.shouldComponentUpdate = function(i6, n5) {
      var r4 = this.__$u, t5 = r4 && void 0 !== r4.s;
      for (var f6 in n5) return true;
      if (this.__f || "boolean" == typeof this.u && true === this.u) {
        var o6 = 2 & this.__$f;
        if (!(t5 || o6 || 4 & this.__$f)) return true;
        if (1 & this.__$f) return true;
      } else {
        if (!(t5 || 4 & this.__$f)) return true;
        if (3 & this.__$f) return true;
      }
      for (var e4 in i6) if ("__source" !== e4 && i6[e4] !== this.props[e4]) return true;
      for (var u6 in this.props) if (!(u6 in i6)) return true;
      return false;
    };
    __name(useSignal, "useSignal");
    q2 = /* @__PURE__ */ __name(function(i6) {
      queueMicrotask(function() {
        queueMicrotask(i6);
      });
    }, "q");
    __name(F2, "F");
    __name(T4, "T");
  }
});

// _fresh/server/assets/index-BkfEFnq_.mjs
var index_BkfEFnq_exports = {};
__export(index_BkfEFnq_exports, {
  default: () => Index
});
function Index() {
  return a2($$_tpl_1);
}
var $$_tpl_1;
var init_index_BkfEFnq = __esm({
  "_fresh/server/assets/index-BkfEFnq_.mjs"() {
    init_modules_watch_stub();
    init_jsxRuntime_module();
    $$_tpl_1 = [
      "<h1>index page2</h1>"
    ];
    __name(Index, "Index");
  }
});

// _fresh/server/assets/about-Dn0hkKPu.mjs
var about_Dn0hkKPu_exports = {};
__export(about_Dn0hkKPu_exports, {
  default: () => About,
  handler: () => handler
});
function About() {
  return a2($$_tpl_12, u2(Foo, null), u2(Bar, null));
}
var $$_tpl_12, handler;
var init_about_Dn0hkKPu = __esm({
  "_fresh/server/assets/about-Dn0hkKPu.mjs"() {
    init_modules_watch_stub();
    init_jsxRuntime_module();
    init_server_entry();
    init_preact_module();
    init_index_module();
    init_hooks_module();
    init_signals_module();
    $$_tpl_12 = [
      "<div><h1>About me2</h1>",
      "",
      "</div>"
    ];
    handler = /* @__PURE__ */ __name((ctx) => {
      console.log(ctx.req.referrer);
      return {
        data: {}
      };
    }, "handler");
    __name(About, "About");
  }
});

// _fresh/server/server-entry.mjs
function checkWindows() {
  const global2 = globalThis;
  const os = global2.Deno?.build?.os;
  return typeof os === "string" ? os === "windows" : global2.navigator?.platform?.startsWith("Win") ?? global2.process?.platform?.startsWith("win") ?? false;
}
function assertPath(path) {
  if (typeof path !== "string") {
    throw new TypeError(`Path must be a string, received "${JSON.stringify(path)}"`);
  }
}
function assertArg$1(url) {
  url = url instanceof URL ? url : new URL(url);
  if (url.protocol !== "file:") {
    throw new TypeError(`URL must be a file URL: received "${url.protocol}"`);
  }
  return url;
}
function fromFileUrl$1(url) {
  url = assertArg$1(url);
  return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function isPosixPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH;
}
function isPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
}
function isWindowsDeviceRoot(code) {
  return code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z || code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z;
}
function fromFileUrl(url) {
  url = assertArg$1(url);
  let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
  if (url.hostname !== "") {
    path = `\\\\${url.hostname}${path}`;
  }
  return path;
}
function assertArg(path) {
  assertPath(path);
  if (path.length === 0) return ".";
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator2) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code;
  for (let i6 = 0; i6 <= path.length; ++i6) {
    if (i6 < path.length) code = path.charCodeAt(i6);
    else if (isPathSeparator2(code)) break;
    else code = CHAR_FORWARD_SLASH;
    if (isPathSeparator2(code)) {
      if (lastSlash === i6 - 1 || dots === 1) ;
      else if (lastSlash !== i6 - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== CHAR_DOT || res.charCodeAt(res.length - 2) !== CHAR_DOT) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i6;
            dots = 0;
            continue;
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i6;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += `${separator}..`;
          else res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) res += separator + path.slice(lastSlash + 1, i6);
        else res = path.slice(lastSlash + 1, i6);
        lastSegmentLength = i6 - lastSlash - 1;
      }
      lastSlash = i6;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
function normalize$1(path) {
  if (path instanceof URL) {
    path = fromFileUrl$1(path);
  }
  assertArg(path);
  const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
  const trailingSeparator = isPosixPathSeparator(path.charCodeAt(path.length - 1));
  path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
  if (path.length === 0 && !isAbsolute) path = ".";
  if (path.length > 0 && trailingSeparator) path += "/";
  if (isAbsolute) return `/${path}`;
  return path;
}
function join$2(path, ...paths) {
  if (path === void 0) return ".";
  if (path instanceof URL) {
    path = fromFileUrl$1(path);
  }
  paths = path ? [
    path,
    ...paths
  ] : paths;
  paths.forEach((path2) => assertPath(path2));
  const joined = paths.filter((path2) => path2.length > 0).join("/");
  return joined === "" ? "." : normalize$1(joined);
}
function normalize(path) {
  if (path instanceof URL) {
    path = fromFileUrl(path);
  }
  assertArg(path);
  const len = path.length;
  let rootEnd = 0;
  let device;
  let isAbsolute = false;
  const code = path.charCodeAt(0);
  if (len > 1) {
    if (isPathSeparator(code)) {
      isAbsolute = true;
      if (isPathSeparator(path.charCodeAt(1))) {
        let j4 = 2;
        let last = j4;
        for (; j4 < len; ++j4) {
          if (isPathSeparator(path.charCodeAt(j4))) break;
        }
        if (j4 < len && j4 !== last) {
          const firstPart = path.slice(last, j4);
          last = j4;
          for (; j4 < len; ++j4) {
            if (!isPathSeparator(path.charCodeAt(j4))) break;
          }
          if (j4 < len && j4 !== last) {
            last = j4;
            for (; j4 < len; ++j4) {
              if (isPathSeparator(path.charCodeAt(j4))) break;
            }
            if (j4 === len) {
              return `\\\\${firstPart}\\${path.slice(last)}\\`;
            } else if (j4 !== last) {
              device = `\\\\${firstPart}\\${path.slice(last, j4)}`;
              rootEnd = j4;
            }
          }
        }
      } else {
        rootEnd = 1;
      }
    } else if (isWindowsDeviceRoot(code)) {
      if (path.charCodeAt(1) === CHAR_COLON) {
        device = path.slice(0, 2);
        rootEnd = 2;
        if (len > 2) {
          if (isPathSeparator(path.charCodeAt(2))) {
            isAbsolute = true;
            rootEnd = 3;
          }
        }
      }
    }
  } else if (isPathSeparator(code)) {
    return "\\";
  }
  let tail;
  if (rootEnd < len) {
    tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
  } else {
    tail = "";
  }
  if (tail.length === 0 && !isAbsolute) tail = ".";
  if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
    tail += "\\";
  }
  if (device === void 0) {
    if (isAbsolute) {
      if (tail.length > 0) return `\\${tail}`;
      else return "\\";
    }
    return tail;
  } else if (isAbsolute) {
    if (tail.length > 0) return `${device}\\${tail}`;
    else return `${device}\\`;
  }
  return device + tail;
}
function join$1(path, ...paths) {
  if (path instanceof URL) {
    path = fromFileUrl(path);
  }
  paths = path ? [
    path,
    ...paths
  ] : paths;
  paths.forEach((path2) => assertPath(path2));
  paths = paths.filter((path2) => path2.length > 0);
  if (paths.length === 0) return ".";
  let needsReplace = true;
  let slashCount = 0;
  const firstPart = paths[0];
  if (isPathSeparator(firstPart.charCodeAt(0))) {
    ++slashCount;
    const firstLen = firstPart.length;
    if (firstLen > 1) {
      if (isPathSeparator(firstPart.charCodeAt(1))) {
        ++slashCount;
        if (firstLen > 2) {
          if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
          else {
            needsReplace = false;
          }
        }
      }
    }
  }
  let joined = paths.join("\\");
  if (needsReplace) {
    for (; slashCount < joined.length; ++slashCount) {
      if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
    }
    if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
  }
  return normalize(joined);
}
function join(path, ...paths) {
  return isWindows ? join$1(path, ...paths) : join$2(path, ...paths);
}
function setBuildId(id) {
  BUILD_ID = id;
}
function matchesUrl(current, needle) {
  let href = new URL(needle, "http://localhost").pathname;
  if (href !== "/" && href.endsWith("/")) {
    href = href.slice(0, -1);
  }
  if (current !== "/" && current.endsWith("/")) {
    current = current.slice(0, -1);
  }
  if (current === href) {
    return 2;
  } else if (current.startsWith(href + "/") || href === "/") {
    return 1;
  }
  return 0;
}
function setActiveUrl(vnode, pathname) {
  const props = vnode.props;
  const hrefProp = props.href;
  if (typeof hrefProp === "string" && hrefProp.startsWith("/")) {
    const match = matchesUrl(pathname, hrefProp);
    if (match === 2) {
      props[DATA_CURRENT] = "true";
      props["aria-current"] = "page";
    } else if (match === 1) {
      props[DATA_ANCESTOR] = "true";
      props["aria-current"] = "true";
    }
  }
}
function assetInternal(path, buildId) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  try {
    const url = new URL(path, "https://freshassetcache.local");
    if (url.protocol !== "https:" || url.host !== "freshassetcache.local" || url.searchParams.has(ASSET_CACHE_BUST_KEY)) {
      return path;
    }
    url.searchParams.set(ASSET_CACHE_BUST_KEY, buildId);
    return url.pathname + url.search + url.hash;
  } catch (err) {
    console.warn(`Failed to create asset() URL, falling back to regular path ('${path}'):`, err);
    return path;
  }
}
function assetSrcSetInternal(srcset, buildId) {
  if (srcset.includes("(")) return srcset;
  const parts = srcset.split(",");
  const constructed = [];
  for (const part of parts) {
    const trimmed = part.trimStart();
    const leadingWhitespace = part.length - trimmed.length;
    if (trimmed === "") return srcset;
    let urlEnd = trimmed.indexOf(" ");
    if (urlEnd === -1) urlEnd = trimmed.length;
    const leading = part.substring(0, leadingWhitespace);
    const url = trimmed.substring(0, urlEnd);
    const trailing = trimmed.substring(urlEnd);
    constructed.push(leading + assetInternal(url, buildId) + trailing);
  }
  return constructed.join(",");
}
function assetHashingHook(vnode, buildId) {
  if (vnode.type === "img" || vnode.type === "source") {
    const { props } = vnode;
    if (props["data-fresh-disable-lock"]) return;
    if (typeof props.src === "string") {
      props.src = assetInternal(props.src, buildId);
    }
    if (typeof props.srcset === "string") {
      props.srcset = assetSrcSetInternal(props.srcset, buildId);
    }
  }
}
function Partial(props) {
  return props.children;
}
function stringify(data, custom) {
  const out = [];
  const indexes = /* @__PURE__ */ new Map();
  const res = serializeInner(out, indexes, data, custom);
  if (res < 0) {
    return String(res);
  }
  return `[${out.join(",")}]`;
}
function serializeInner(out, indexes, value, custom) {
  const seenIdx = indexes.get(value);
  if (seenIdx !== void 0) return seenIdx;
  if (value === void 0) return UNDEFINED;
  if (value === null) return NULL;
  if (Number.isNaN(value)) return NAN;
  if (value === Infinity) return INFINITY_POS;
  if (value === -Infinity) return INFINITY_NEG;
  if (value === 0 && 1 / value < 0) return ZERO_NEG;
  const idx = out.length;
  out.push("");
  indexes.set(value, idx);
  let str = "";
  if (typeof value === "number") {
    str += String(value);
  } else if (typeof value === "boolean") {
    str += String(value);
  } else if (typeof value === "bigint") {
    str += `["BigInt","${value}"]`;
  } else if (typeof value === "string") {
    str += JSON.stringify(value);
  } else if (Array.isArray(value)) {
    str += "[";
    for (let i6 = 0; i6 < value.length; i6++) {
      if (i6 in value) {
        str += serializeInner(out, indexes, value[i6], custom);
      } else {
        str += HOLE;
      }
      if (i6 < value.length - 1) {
        str += ",";
      }
    }
    str += "]";
  } else if (typeof value === "object") {
    if (custom !== void 0) {
      for (const k4 in custom) {
        const fn = custom[k4];
        if (fn === void 0) continue;
        const res = fn(value);
        if (res === void 0) continue;
        const innerIdx = serializeInner(out, indexes, res.value, custom);
        str = `["${k4}",${innerIdx}]`;
        out[idx] = str;
        return idx;
      }
    }
    if (value instanceof Date) {
      str += `["Date","${value.toISOString()}"]`;
    } else if (value instanceof RegExp) {
      str += `["RegExp",${JSON.stringify(value.source)}, "${value.flags}"]`;
    } else if (value instanceof Uint8Array) {
      str += `["Uint8Array","${b64encode(value.buffer)}"]`;
    } else if (value instanceof Set) {
      const items = new Array(value.size);
      let i6 = 0;
      value.forEach((v5) => {
        items[i6++] = serializeInner(out, indexes, v5, custom);
      });
      str += `["Set",[${items.join(",")}]]`;
    } else if (value instanceof Map) {
      const items = new Array(value.size * 2);
      let i6 = 0;
      value.forEach((v5, k4) => {
        items[i6++] = serializeInner(out, indexes, k4, custom);
        items[i6++] = serializeInner(out, indexes, v5, custom);
      });
      str += `["Map",[${items.join(",")}]]`;
    } else {
      str += "{";
      const keys = Object.keys(value);
      for (let i6 = 0; i6 < keys.length; i6++) {
        const key = keys[i6];
        str += JSON.stringify(key) + ":";
        str += serializeInner(out, indexes, value[key], custom);
        if (i6 < keys.length - 1) {
          str += ",";
        }
      }
      str += "}";
    }
  } else if (typeof value === "function") {
    throw new Error(`Serializing functions is not supported.`);
  }
  out[idx] = str;
  return idx;
}
function b64encode(buffer) {
  const uint8 = new Uint8Array(buffer);
  let result = "", i6;
  const l7 = uint8.length;
  for (i6 = 2; i6 < l7; i6 += 3) {
    result += base64abc[uint8[i6 - 2] >> 2];
    result += base64abc[(uint8[i6 - 2] & 3) << 4 | uint8[i6 - 1] >> 4];
    result += base64abc[(uint8[i6 - 1] & 15) << 2 | uint8[i6] >> 6];
    result += base64abc[uint8[i6] & 63];
  }
  if (i6 === l7 + 1) {
    result += base64abc[uint8[i6 - 2] >> 2];
    result += base64abc[(uint8[i6 - 2] & 3) << 4];
    result += "==";
  }
  if (i6 === l7) {
    result += base64abc[uint8[i6 - 2] >> 2];
    result += base64abc[(uint8[i6 - 2] & 3) << 4 | uint8[i6 - 1] >> 4];
    result += base64abc[(uint8[i6 - 1] & 15) << 2];
    result += "=";
  }
  return result;
}
function escape(str) {
  return str.replaceAll(rawRe, (m4) => rawToEntity.get(m4));
}
function escapeScript(content, options2 = {}) {
  return content.replaceAll(SCRIPT_ESCAPE, "<\\/$1").replaceAll(COMMENT_ESCAPE, options2.json ? "\\u003C!--" : "\\x3C!--");
}
function isLazy(value) {
  return typeof value === "function";
}
function setRenderState(state) {
  RENDER_STATE = state;
}
function normalizeKey(key) {
  const value = key ?? "";
  const s6 = typeof value !== "string" ? String(value) : value;
  return s6.replaceAll(":", "_");
}
function Slot(props) {
  if (RENDER_STATE !== null) {
    RENDER_STATE.slots[props.id] = null;
  }
  return wrapWithMarker(props.children, "slot", `${props.id}:${props.name}`);
}
function hasIslandOwner(current, vnode) {
  let tmpVNode = vnode;
  let owner;
  while ((owner = current.owners.get(tmpVNode)) !== void 0) {
    if (current.buildCache.islandRegistry.has(owner.type)) {
      return true;
    }
    tmpVNode = owner;
  }
  return false;
}
function wrapWithMarker(vnode, kind, markerText) {
  return _(k, null, _(k, {
    // @ts-ignore unstable property is not typed
    UNSTABLE_comment: `frsh:${kind}:${markerText}`
  }), vnode, _(k, {
    // @ts-ignore unstable property is not typed
    UNSTABLE_comment: "/frsh:" + kind
  }));
}
function isSignal(x3) {
  return x3 !== null && typeof x3 === "object" && typeof x3.peek === "function" && "value" in x3;
}
function isVNode(x3) {
  return x3 !== null && typeof x3 === "object" && "type" in x3 && "ref" in x3 && "__k" in x3 && t(x3);
}
function FreshScripts() {
  if (RENDER_STATE === null) return null;
  if (RENDER_STATE.hasRuntimeScript) {
    return null;
  }
  RENDER_STATE.hasRuntimeScript = true;
  const { slots } = RENDER_STATE;
  return a2($$_tpl_1$2, s2(slots.map((slot) => {
    if (slot === null) return null;
    return a2($$_tpl_2, l2("key", slot.id), l2("id", `frsh-${slot.id}-${slot.name}`), s2(slot.vnode));
  })), u2(FreshRuntimeScript, null));
}
function FreshRuntimeScript() {
  const { islands: islands2, nonce, ctx, islandProps, partialId, buildCache } = RENDER_STATE;
  const basePath = ctx.config.basePath;
  const islandArr = Array.from(islands2);
  if (ctx.url.searchParams.has(PARTIAL_SEARCH_PARAM)) {
    const islands22 = islandArr.map((island) => {
      return {
        exportName: island.exportName,
        chunk: island.file,
        name: island.name
      };
    });
    const serializedProps = stringify(islandProps, stringifiers);
    const json = {
      islands: islands22,
      props: serializedProps
    };
    return u2("script", {
      id: `__FRSH_STATE_${partialId}`,
      type: "application/json",
      dangerouslySetInnerHTML: {
        __html: escapeScript(JSON.stringify(json), {
          json: true
        })
      }
    });
  } else {
    const islandImports = islandArr.map((island) => {
      const named = island.exportName === "default" ? island.name : island.exportName === island.name ? `{ ${island.exportName} }` : `{ ${island.exportName} as ${island.name} }`;
      return `import ${named} from "${`${basePath}${island.file}`}";`;
    }).join("");
    const islandObj = "{" + islandArr.map((island) => island.name).join(",") + "}";
    const serializedProps = escapeScript(JSON.stringify(stringify(islandProps, stringifiers)), {
      json: true
    });
    const runtimeUrl = buildCache.clientEntry;
    const scriptContent = `import { boot } from "${runtimeUrl}";${islandImports}boot(${islandObj},${serializedProps});`;
    return a2($$_tpl_3, u2("script", {
      type: "module",
      nonce,
      dangerouslySetInnerHTML: {
        __html: scriptContent
      }
    }));
  }
}
function recordSpanError(span, err) {
  if (err instanceof Error) {
    span.recordException(err);
  } else {
    span.setStatus({
      code: import_api.SpanStatusCode.ERROR,
      message: String(err)
    });
  }
}
function isAsyncAnyComponent(fn) {
  return typeof fn === "function" && fn.constructor.name === "AsyncFunction";
}
async function renderAsyncAnyComponent(fn, props) {
  return await tracer.startActiveSpan(
    "invoke async component",
    async (span) => {
      span.setAttribute("fresh.span_type", "fs_routes/async_component");
      try {
        const result = await fn(props);
        span.setAttribute(
          "fresh.component_response",
          result instanceof Response ? "http" : "jsx"
        );
        return result;
      } catch (err) {
        recordSpanError(span, err);
        throw err;
      } finally {
        span.end();
      }
    }
  );
}
function preactRender(vnode, ctx, state, headers) {
  try {
    let res = D2(vnode);
    if (!state.renderedHtmlBody) {
      let scripts = "";
      if (ctx.url.pathname !== ctx.config.basePath + DEV_ERROR_OVERLAY_URL) {
        scripts = D2(_(FreshScripts, null));
      }
      res = `<body>${res}${scripts}</body>`;
    }
    if (!state.renderedHtmlHead) {
      res = `<head><meta charset="utf-8"></head>${res}`;
    }
    if (!state.renderedHtmlTag) {
      res = `<html>${res}</html>`;
    }
    return `<!DOCTYPE html>${res}`;
  } finally {
    const basePath = ctx.config.basePath;
    const runtimeUrl = state.buildCache.clientEntry;
    let link = `<${encodeURI(runtimeUrl)}>; rel="modulepreload"; as="script"`;
    state.islands.forEach((island) => {
      link += `, <${encodeURI(`${basePath}${island.file}`)}>; rel="modulepreload"; as="script"`;
    });
    if (link !== "") {
      headers.append("Link", link);
    }
    state.clear();
    setRenderState(null);
  }
}
async function renderRouteComponent(ctx, def, child) {
  const vnodeProps = {
    Component: child,
    config: ctx.config,
    data: def.props,
    error: ctx.error,
    info: ctx.info,
    isPartial: ctx.isPartial,
    params: ctx.params,
    req: ctx.req,
    state: ctx.state,
    url: ctx.url
  };
  if (isAsyncAnyComponent(def.component)) {
    const result = await renderAsyncAnyComponent(def.component, vnodeProps);
    if (result instanceof Response) {
      return result;
    }
    return result;
  }
  return _(def.component, vnodeProps);
}
function runMiddlewares(middlewares, ctx) {
  let fn = ctx.next;
  let i6 = middlewares.length;
  while (i6--) {
    const local = fn;
    let next = middlewares[i6];
    const idx = i6;
    fn = /* @__PURE__ */ __name(async () => {
      const internals = getInternals(ctx);
      const { app: prevApp, layouts: prevLayouts } = internals;
      ctx.next = local;
      try {
        const result = await next(ctx);
        if (typeof result === "function") {
          middlewares[idx] = result;
          next = result;
          return await result(ctx);
        }
        return result;
      } catch (err) {
        ctx.error = err;
        throw err;
      } finally {
        internals.app = prevApp;
        internals.layouts = prevLayouts;
      }
    }, "fn");
  }
  return fn();
}
function newByMethod() {
  return {
    GET: [],
    POST: [],
    PATCH: [],
    DELETE: [],
    PUT: [],
    HEAD: [],
    OPTIONS: []
  };
}
function patternToSegments(path, root2, includeLast = false) {
  const out = [root2];
  if (path === "/" || path === "*" || path === "/*") return out;
  let start = -1;
  for (let i6 = 0; i6 < path.length; i6++) {
    const ch = path[i6];
    if (ch === "/") {
      if (i6 > 0) {
        const raw = path.slice(start + 1, i6);
        out.push(raw);
      }
      start = i6;
    }
  }
  if (includeLast && start < path.length - 1) {
    out.push(path.slice(start + 1));
  }
  return out;
}
function mergePath(basePath, path) {
  if (basePath.endsWith("*")) basePath = basePath.slice(0, -1);
  if (basePath === "/") basePath = "";
  if (path === "*") path = "";
  else if (path === "/*") path = "/*";
  const s6 = basePath !== "" && path === "/" ? "" : path;
  return basePath + s6;
}
function isHandlerByMethod(handler2) {
  return handler2 !== null && !Array.isArray(handler2) && typeof handler2 === "object";
}
function newSegment(pattern, parent) {
  return {
    pattern,
    middlewares: [],
    layout: null,
    app: null,
    errorRoute: null,
    notFound: null,
    parent,
    children: /* @__PURE__ */ new Map()
  };
}
function getOrCreateSegment(root2, path, includeLast) {
  let current = root2;
  const segments = patternToSegments(path, root2.pattern, includeLast);
  for (let i6 = 0; i6 < segments.length; i6++) {
    const seg = segments[i6];
    if (seg === root2.pattern) {
      current = root2;
    } else {
      let child = current.children.get(seg);
      if (child === void 0) {
        child = newSegment(seg, current);
        current.children.set(seg, child);
      }
      current = child;
    }
  }
  return current;
}
function segmentToMiddlewares(segment) {
  const result = [];
  const stack = [];
  let current = segment;
  while (current !== null) {
    stack.push(current);
    current = current.parent;
  }
  const root2 = stack.at(-1);
  for (let i6 = stack.length - 1; i6 >= 0; i6--) {
    const seg = stack[i6];
    const { layout, app: app2, errorRoute } = seg;
    result.push(/* @__PURE__ */ __name(async function segmentMiddleware(ctx) {
      const internals = getInternals(ctx);
      const prevApp = internals.app;
      const prevLayouts = internals.layouts;
      if (app2 !== null) {
        internals.app = app2;
      }
      if (layout !== null) {
        if (layout.config?.skipAppWrapper) {
          internals.app = null;
        }
        const def = { props: null, component: layout.component };
        if (layout.config?.skipInheritedLayouts) {
          internals.layouts = [def];
        } else {
          internals.layouts = [...internals.layouts, def];
        }
      }
      try {
        return await ctx.next();
      } catch (err) {
        const status = err instanceof HttpError ? err.status : 500;
        if (root2.notFound !== null && status === 404) {
          return await root2.notFound(ctx);
        }
        if (errorRoute !== null) {
          return await renderRoute(ctx, errorRoute, status);
        }
        throw err;
      } finally {
        internals.app = prevApp;
        internals.layouts = prevLayouts;
      }
    }, "segmentMiddleware"));
    if (seg.middlewares.length > 0) {
      result.push(...seg.middlewares);
    }
  }
  return result;
}
async function renderRoute(ctx, route, status = 200) {
  const internals = getInternals(ctx);
  if (route.config?.skipAppWrapper) {
    internals.app = null;
  }
  if (route.config?.skipInheritedLayouts) {
    internals.layouts = [];
  }
  const method = ctx.req.method;
  const handlers = route.handler;
  if (handlers === void 0) {
    throw new Error(`Unexpected missing handlers`);
  }
  const headers = new Headers();
  headers.set("Content-Type", "text/html;charset=utf-8");
  const res = await tracer.startActiveSpan("handler", {
    attributes: { "fresh.span_type": "fs_routes/handler" }
  }, async (span) => {
    try {
      const fn = isHandlerByMethod(handlers) ? handlers[method] ?? null : handlers;
      if (fn === null) return await ctx.next();
      return await fn(ctx);
    } catch (err) {
      recordSpanError(span, err);
      throw err;
    } finally {
      span.end();
    }
  });
  if (res instanceof Response) {
    return res;
  }
  if (typeof res.status === "number") {
    status = res.status;
  }
  if (res.headers) {
    for (const [name, value] of Object.entries(res.headers)) {
      headers.set(name, value);
    }
  }
  let vnode = null;
  if (route.component !== void 0) {
    const result = await renderRouteComponent(ctx, {
      component: route.component,
      // deno-lint-ignore no-explicit-any
      props: res.data
    }, () => null);
    if (result instanceof Response) {
      return result;
    }
    vnode = result;
  }
  return ctx.render(vnode, { headers, status });
}
function ensureHandler(route) {
  if (route.handler === void 0) {
    route.handler = route.component !== void 0 ? DEFAULT_RENDER : DEFAULT_NOT_FOUND;
  } else if (isHandlerByMethod(route.handler)) {
    if (route.component !== void 0 && !route.handler.GET) {
      route.handler.GET = DEFAULT_RENDER;
    }
  }
}
function newErrorCmd(pattern, routeOrMiddleware, includeLastSegment) {
  const route = typeof routeOrMiddleware === "function" ? { handler: routeOrMiddleware } : routeOrMiddleware;
  ensureHandler(route);
  return { type: "error", pattern, item: route, includeLastSegment };
}
function newAppCmd(component) {
  return { type: "app", component };
}
function newLayoutCmd(pattern, component, config, includeLastSegment) {
  return {
    type: "layout",
    pattern,
    component,
    config,
    includeLastSegment
  };
}
function newMiddlewareCmd(pattern, fns, includeLastSegment) {
  return { type: "middleware", pattern, fns, includeLastSegment };
}
function newNotFoundCmd(routeOrMiddleware) {
  const route = typeof routeOrMiddleware === "function" ? { handler: routeOrMiddleware } : routeOrMiddleware;
  ensureHandler(route);
  return { type: "notFound", fn: /* @__PURE__ */ __name((ctx) => renderRoute(ctx, route), "fn") };
}
function newRouteCmd(pattern, route, config, includeLastSegment) {
  let normalized;
  if (isLazy(route)) {
    normalized = /* @__PURE__ */ __name(async () => {
      const result = await route();
      ensureHandler(result);
      return result;
    }, "normalized");
  } else {
    ensureHandler(route);
    normalized = route;
  }
  return {
    type: "route",
    pattern,
    route: normalized,
    config,
    includeLastSegment
  };
}
function newHandlerCmd(method, pattern, fns, includeLastSegment) {
  return {
    type: "handler",
    pattern,
    method,
    fns,
    includeLastSegment
  };
}
function applyCommands(router, commands, basePath) {
  const root2 = newSegment("", null);
  applyCommandsInner(root2, router, commands, basePath);
  return { rootMiddlewares: segmentToMiddlewares(root2) };
}
function applyCommandsInner(root2, router, commands, basePath) {
  for (let i6 = 0; i6 < commands.length; i6++) {
    const cmd = commands[i6];
    switch (cmd.type) {
      case "middleware": {
        const segment = getOrCreateSegment(
          root2,
          cmd.pattern,
          cmd.includeLastSegment
        );
        segment.middlewares.push(...cmd.fns);
        break;
      }
      case "notFound": {
        root2.notFound = cmd.fn;
        break;
      }
      case "error": {
        const segment = getOrCreateSegment(
          root2,
          cmd.pattern,
          cmd.includeLastSegment
        );
        segment.errorRoute = cmd.item;
        break;
      }
      case "app": {
        root2.app = cmd.component;
        break;
      }
      case "layout": {
        const segment = getOrCreateSegment(
          root2,
          cmd.pattern,
          cmd.includeLastSegment
        );
        segment.layout = {
          component: cmd.component,
          config: cmd.config ?? null
        };
        break;
      }
      case "route": {
        const { pattern, route, config } = cmd;
        const segment = getOrCreateSegment(
          root2,
          pattern,
          cmd.includeLastSegment
        );
        const fns = segmentToMiddlewares(segment);
        if (isLazy(route)) {
          const routePath = mergePath(
            basePath,
            config?.routeOverride ?? pattern
          );
          let def;
          fns.push(async (ctx) => {
            if (def === void 0) {
              def = await route();
            }
            return renderRoute(ctx, def);
          });
          if (config === void 0 || config.methods === "ALL") {
            router.add("GET", routePath, fns);
            router.add("DELETE", routePath, fns);
            router.add("HEAD", routePath, fns);
            router.add("OPTIONS", routePath, fns);
            router.add("PATCH", routePath, fns);
            router.add("POST", routePath, fns);
            router.add("PUT", routePath, fns);
          } else if (Array.isArray(config.methods)) {
            for (let i22 = 0; i22 < config.methods.length; i22++) {
              const method = config.methods[i22];
              router.add(method, routePath, fns);
            }
          }
        } else {
          fns.push((ctx) => renderRoute(ctx, route));
          const routePath = mergePath(
            basePath,
            route.config?.routeOverride ?? pattern
          );
          if (typeof route.handler === "function") {
            router.add("GET", routePath, fns);
            router.add("DELETE", routePath, fns);
            router.add("HEAD", routePath, fns);
            router.add("OPTIONS", routePath, fns);
            router.add("PATCH", routePath, fns);
            router.add("POST", routePath, fns);
            router.add("PUT", routePath, fns);
          } else if (isHandlerByMethod(route.handler)) {
            for (const method of Object.keys(route.handler)) {
              router.add(method, routePath, fns);
            }
          }
        }
        break;
      }
      case "handler": {
        const { pattern, fns, method } = cmd;
        const segment = getOrCreateSegment(
          root2,
          pattern,
          cmd.includeLastSegment
        );
        const result = segmentToMiddlewares(segment);
        result.push(...fns);
        const resPath = mergePath(basePath, pattern);
        if (method === "ALL") {
          router.add("GET", resPath, result);
          router.add("DELETE", resPath, result);
          router.add("HEAD", resPath, result);
          router.add("OPTIONS", resPath, result);
          router.add("PATCH", resPath, result);
          router.add("POST", resPath, result);
          router.add("PUT", resPath, result);
        } else {
          router.add(method, resPath, result);
        }
        break;
      }
      case "fsRoute": {
        const items = cmd.getItems();
        applyCommandsInner(root2, router, items, basePath);
        break;
      }
      default:
        throw new Error(`Unknown command: ${JSON.stringify(cmd)}`);
    }
  }
}
function isFreshFile(mod) {
  if (mod === null || typeof mod !== "object") return false;
  return typeof mod.default === "function" || typeof mod.config === "object" || typeof mod.handlers === "object" || typeof mod.handlers === "function" || typeof mod.handler === "object" || typeof mod.handler === "function";
}
function fsItemsToCommands(items) {
  const commands = [];
  for (let i6 = 0; i6 < items.length; i6++) {
    const item = items[i6];
    const { filePath, type, mod: rawMod, pattern, routePattern } = item;
    switch (type) {
      case CommandType.Middleware: {
        if (isLazy(rawMod)) continue;
        const { handlers, mod } = validateFsMod(filePath, rawMod);
        let middlewares = handlers ?? mod.default ?? null;
        if (middlewares === null) continue;
        if (isHandlerByMethod(middlewares)) {
          warnInvalidRoute(
            `Middleware does not support object handlers with GET, POST, etc. in ${filePath}`
          );
          continue;
        }
        if (!Array.isArray(middlewares)) {
          middlewares = [middlewares];
        }
        commands.push(newMiddlewareCmd(pattern, middlewares, true));
        continue;
      }
      case CommandType.Layout: {
        const { handlers, mod } = validateFsMod(filePath, rawMod);
        if (handlers !== null) {
          warnInvalidRoute("Layout does not support handlers");
        }
        if (!mod.default) continue;
        commands.push(newLayoutCmd(pattern, mod.default, mod.config, true));
        continue;
      }
      case CommandType.Error: {
        const { handlers, mod } = validateFsMod(filePath, rawMod);
        commands.push(newErrorCmd(
          pattern,
          {
            component: mod.default ?? void 0,
            config: mod.config ?? void 0,
            // deno-lint-ignore no-explicit-any
            handler: handlers ?? void 0
          },
          true
        ));
        continue;
      }
      case CommandType.NotFound: {
        const { handlers, mod } = validateFsMod(filePath, rawMod);
        commands.push(newNotFoundCmd({
          config: mod.config,
          component: mod.default,
          // deno-lint-ignore no-explicit-any
          handler: handlers ?? void 0
        }));
        continue;
      }
      case CommandType.App: {
        const { mod } = validateFsMod(filePath, rawMod);
        if (mod.default === void 0) continue;
        commands.push(newAppCmd(mod.default));
        continue;
      }
      case CommandType.Route: {
        let normalized;
        let config = {};
        if (isLazy(rawMod)) {
          normalized = /* @__PURE__ */ __name(async () => {
            const result = await rawMod();
            return normalizeRoute(filePath, result, routePattern);
          }, "normalized");
          config.methods = item.overrideConfig?.methods ?? "ALL";
          config.routeOverride = item.overrideConfig?.routeOverride ?? routePattern;
        } else {
          normalized = normalizeRoute(filePath, rawMod, routePattern);
          if (rawMod.config) {
            config = rawMod.config;
          }
        }
        commands.push(
          newRouteCmd(pattern, normalized, config, false)
        );
        continue;
      }
      case CommandType.Handler:
        throw new Error(`Not supported`);
      case CommandType.FsRoute:
        throw new Error(`Nested FsRoutes are not supported`);
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }
  return commands;
}
function warnInvalidRoute(message) {
  console.warn(
    `\u{1F34B} %c[WARNING] Unsupported route config: ${message}`,
    "color:rgb(251, 184, 0)"
  );
}
function validateFsMod(filePath, mod) {
  if (!isFreshFile(mod)) {
    throw new Error(
      `Expected a route, middleware, layout or error template, but couldn't find relevant exports in: ${filePath}`
    );
  }
  const handlers = mod.handlers ?? mod.handler ?? null;
  if (typeof handlers === "function" && handlers.length > 1) {
    throw new Error(
      `Handlers must only have one argument but found more than one. Check the function signature in: ${filePath}`
    );
  }
  return { handlers, mod };
}
function normalizeRoute(filePath, rawMod, routePattern) {
  const { handlers, mod } = validateFsMod(filePath, rawMod);
  return {
    config: {
      ...mod.config,
      routeOverride: mod.config?.routeOverride ?? routePattern
    },
    // deno-lint-ignore no-explicit-any
    handler: handlers ?? void 0,
    component: mod.default
  };
}
async function listenOnFreePort(options2, handler2) {
  let firstError = null;
  for (let port = 8e3; port < 8020; port++) {
    try {
      return await Deno.serve({ ...options2, port }, handler2);
    } catch (err) {
      if (err instanceof Deno.errors.AddrInUse) {
        if (!firstError) firstError = err;
        continue;
      }
      throw err;
    }
  }
  throw firstError;
}
async function listen(options2 = {}, basePath, handler2) {
  if (!options2.onListen) ;
  if (options2.port) {
    await Deno.serve(options2, handler2);
    return;
  }
  await listenOnFreePort(options2, handler2);
}
function Bar() {
  const [count, set] = d3(0);
  return a2($$_tpl_1$1, l2("onclick", () => set((v5) => v5 + 1)), s2(count));
}
function Foo() {
  const count = useSignal(0);
  return a2($$_tpl_13, l2("onclick", () => count.value++), s2(count));
}
function trailingSlashes(mode) {
  return /* @__PURE__ */ __name(function trailingSlashesMiddleware(ctx) {
    const url = ctx.url;
    if (url.pathname !== "/") {
      if (url.pathname.endsWith("/")) {
        return ctx.redirect(`${url.pathname.slice(0, -1)}${url.search}`);
      }
    }
    return ctx.next();
  }, "trailingSlashesMiddleware");
}
function staticFiles() {
  return /* @__PURE__ */ __name(async function freshServeStaticFiles(ctx) {
    const { req, url, config } = ctx;
    const buildCache = getBuildCache(ctx);
    if (buildCache === null) return await ctx.next();
    let pathname = decodeURIComponent(url.pathname);
    if (config.basePath) {
      pathname = pathname !== config.basePath ? pathname.slice(config.basePath.length) : "/";
    }
    const startTime = performance.now() + performance.timeOrigin;
    const file = await buildCache.readFile(pathname);
    if (pathname === "/" || file === null) {
      if (pathname === "/favicon.ico") {
        return new Response(null, { status: 404 });
      }
      return await ctx.next();
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      file.close();
      return new Response("Method Not Allowed", { status: 405 });
    }
    const span = tracer.startSpan("static file", {
      attributes: { "fresh.span_type": "static_file" },
      startTime
    });
    try {
      const cacheKey = url.searchParams.get(ASSET_CACHE_BUST_KEY);
      if (cacheKey !== null && BUILD_ID !== cacheKey) {
        url.searchParams.delete(ASSET_CACHE_BUST_KEY);
        const location = url.pathname + url.search;
        file.close();
        span.setAttribute("fresh.cache", "invalid_bust_key");
        span.setAttribute("fresh.cache_key", cacheKey);
        return new Response(null, {
          status: 307,
          headers: {
            location
          }
        });
      }
      const etag = file.hash;
      const headers = new Headers({
        "Content-Type": file.contentType,
        vary: "If-None-Match"
      });
      const ifNoneMatch = req.headers.get("If-None-Match");
      if (ifNoneMatch !== null && (ifNoneMatch === etag || ifNoneMatch === `W/"${etag}"`)) {
        file.close();
        span.setAttribute("fresh.cache", "not_modified");
        return new Response(null, { status: 304, headers });
      } else if (etag !== null) {
        headers.set("Etag", `W/"${etag}"`);
      }
      if (ctx.config.mode !== "development" && (BUILD_ID === cacheKey || url.pathname.startsWith(
        `${ctx.config.basePath}/_fresh/js/${BUILD_ID}/`
      ))) {
        span.setAttribute("fresh.cache", "immutable");
        headers.append("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        span.setAttribute("fresh.cache", "no_cache");
        headers.append(
          "Cache-Control",
          "no-cache, no-store, max-age=0, must-revalidate"
        );
      }
      headers.set("Content-Length", String(file.size));
      if (req.method === "HEAD") {
        file.close();
        return new Response(null, { status: 200, headers });
      }
      return new Response(file.readable, { headers });
    } finally {
      span.end();
    }
  }, "freshServeStaticFiles");
}
var import_api, __typeError, __accessCheck, __privateGet, __privateAdd, __privateSet, _internal, _buildCache, _getBuildCache, _commands, isWindows, CHAR_UPPERCASE_A, CHAR_LOWERCASE_A, CHAR_UPPERCASE_Z, CHAR_LOWERCASE_Z, CHAR_DOT, CHAR_FORWARD_SLASH, CHAR_BACKWARD_SLASH, CHAR_COLON, BUILD_ID, DATA_CURRENT, DATA_ANCESTOR, DATA_FRESH_KEY, CLIENT_NAV_ATTR, ASSET_CACHE_BUST_KEY, PartialMode, UNDEFINED, NULL, NAN, INFINITY_POS, INFINITY_NEG, ZERO_NEG, HOLE, base64abc, INTERNAL_PREFIX, DEV_ERROR_OVERLAY_URL, PARTIAL_SEARCH_PARAM, rawToEntityEntries, rawToEntity, rawRe, STATUS_CODE, STATUS_TEXT, HttpError, SCRIPT_ESCAPE, COMMENT_ESCAPE, UniqueNamer, $$_tpl_1$2, $$_tpl_2, $$_tpl_3, options, RenderState, RENDER_STATE, oldVNodeHook, oldAttrHook, PATCHED, oldDiff, oldRender, oldDiffed, stringifiers, version$1, denoJson, CURRENT_FRESH_VERSION, tracer, getBuildCache, getInternals, Context, IS_PATTERN, EMPTY, UrlPatternRouter, DEFAULT_NOT_FOUND, DEFAULT_NOT_ALLOWED_METHOD, DEFAULT_RENDER, CommandType, MockBuildCache, DEFAULT_CONN_INFO, defaultOptionsHandler, DEFAULT_ERROR_HANDLER, setBuildCache, App, ProdBuildCache, IslandPreparer, $$_tpl_1$1, Bar$1, $$_tpl_13, Foo$1, clientEntry, version, islands, islandPreparer, staticFiles$1, fsRoutes, snapshot, app, root, _fresh_server_entry;
var init_server_entry = __esm({
  "_fresh/server/server-entry.mjs"() {
    init_modules_watch_stub();
    import_api = __toESM(require_src(), 1);
    init_preact_module();
    init_jsxRuntime_module();
    init_index_module();
    init_hooks_module();
    init_signals_module();
    __typeError = /* @__PURE__ */ __name((msg) => {
      throw TypeError(msg);
    }, "__typeError");
    __accessCheck = /* @__PURE__ */ __name((obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg), "__accessCheck");
    __privateGet = /* @__PURE__ */ __name((obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj)), "__privateGet");
    __privateAdd = /* @__PURE__ */ __name((obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value), "__privateAdd");
    __privateSet = /* @__PURE__ */ __name((obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value), "__privateSet");
    __name(checkWindows, "checkWindows");
    isWindows = checkWindows();
    __name(assertPath, "assertPath");
    __name(assertArg$1, "assertArg$1");
    __name(fromFileUrl$1, "fromFileUrl$1");
    CHAR_UPPERCASE_A = 65;
    CHAR_LOWERCASE_A = 97;
    CHAR_UPPERCASE_Z = 90;
    CHAR_LOWERCASE_Z = 122;
    CHAR_DOT = 46;
    CHAR_FORWARD_SLASH = 47;
    CHAR_BACKWARD_SLASH = 92;
    CHAR_COLON = 58;
    __name(isPosixPathSeparator, "isPosixPathSeparator");
    __name(isPathSeparator, "isPathSeparator");
    __name(isWindowsDeviceRoot, "isWindowsDeviceRoot");
    __name(fromFileUrl, "fromFileUrl");
    __name(assertArg, "assertArg");
    __name(normalizeString, "normalizeString");
    __name(normalize$1, "normalize$1");
    __name(join$2, "join$2");
    __name(normalize, "normalize");
    __name(join$1, "join$1");
    __name(join, "join");
    BUILD_ID = "8c7f3c42590b1b72ab3d15e06aa3f2bda5d02d72\n";
    __name(setBuildId, "setBuildId");
    DATA_CURRENT = "data-current";
    DATA_ANCESTOR = "data-ancestor";
    DATA_FRESH_KEY = "data-frsh-key";
    CLIENT_NAV_ATTR = "f-client-nav";
    ASSET_CACHE_BUST_KEY = "__frsh_c";
    __name(matchesUrl, "matchesUrl");
    __name(setActiveUrl, "setActiveUrl");
    PartialMode = /* @__PURE__ */ function(PartialMode2) {
      PartialMode2[PartialMode2["Replace"] = 0] = "Replace";
      PartialMode2[PartialMode2["Append"] = 1] = "Append";
      PartialMode2[PartialMode2["Prepend"] = 2] = "Prepend";
      return PartialMode2;
    }({});
    __name(assetInternal, "assetInternal");
    __name(assetSrcSetInternal, "assetSrcSetInternal");
    __name(assetHashingHook, "assetHashingHook");
    __name(Partial, "Partial");
    Partial.displayName = "Partial";
    UNDEFINED = -1;
    NULL = -2;
    NAN = -3;
    INFINITY_POS = -4;
    INFINITY_NEG = -5;
    ZERO_NEG = -6;
    HOLE = -7;
    __name(stringify, "stringify");
    __name(serializeInner, "serializeInner");
    base64abc = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "+",
      "/"
    ];
    __name(b64encode, "b64encode");
    INTERNAL_PREFIX = "/_frsh";
    DEV_ERROR_OVERLAY_URL = `${INTERNAL_PREFIX}/error_overlay`;
    PARTIAL_SEARCH_PARAM = "fresh-partial";
    rawToEntityEntries = [
      [
        "&",
        "&amp;"
      ],
      [
        "<",
        "&lt;"
      ],
      [
        ">",
        "&gt;"
      ],
      [
        '"',
        "&quot;"
      ],
      [
        "'",
        "&#39;"
      ]
    ];
    Object.fromEntries([
      ...rawToEntityEntries.map(([raw, entity]) => [
        entity,
        raw
      ]),
      [
        "&apos;",
        "'"
      ],
      [
        "&nbsp;",
        "\xA0"
      ]
    ]);
    rawToEntity = new Map(rawToEntityEntries);
    rawRe = new RegExp(`[${[
      ...rawToEntity.keys()
    ].join("")}]`, "g");
    __name(escape, "escape");
    STATUS_CODE = {
      /** RFC 7231, 6.2.1 */
      Continue: 100,
      /** RFC 7231, 6.2.2 */
      SwitchingProtocols: 101,
      /** RFC 2518, 10.1 */
      Processing: 102,
      /** RFC 8297 **/
      EarlyHints: 103,
      /** RFC 7231, 6.3.1 */
      OK: 200,
      /** RFC 7231, 6.3.2 */
      Created: 201,
      /** RFC 7231, 6.3.3 */
      Accepted: 202,
      /** RFC 7231, 6.3.4 */
      NonAuthoritativeInfo: 203,
      /** RFC 7231, 6.3.5 */
      NoContent: 204,
      /** RFC 7231, 6.3.6 */
      ResetContent: 205,
      /** RFC 7233, 4.1 */
      PartialContent: 206,
      /** RFC 4918, 11.1 */
      MultiStatus: 207,
      /** RFC 5842, 7.1 */
      AlreadyReported: 208,
      /** RFC 3229, 10.4.1 */
      IMUsed: 226,
      /** RFC 7231, 6.4.1 */
      MultipleChoices: 300,
      /** RFC 7231, 6.4.2 */
      MovedPermanently: 301,
      /** RFC 7231, 6.4.3 */
      Found: 302,
      /** RFC 7231, 6.4.4 */
      SeeOther: 303,
      /** RFC 7232, 4.1 */
      NotModified: 304,
      /** RFC 7231, 6.4.5 */
      UseProxy: 305,
      /** RFC 7231, 6.4.7 */
      TemporaryRedirect: 307,
      /** RFC 7538, 3 */
      PermanentRedirect: 308,
      /** RFC 7231, 6.5.1 */
      BadRequest: 400,
      /** RFC 7235, 3.1 */
      Unauthorized: 401,
      /** RFC 7231, 6.5.2 */
      PaymentRequired: 402,
      /** RFC 7231, 6.5.3 */
      Forbidden: 403,
      /** RFC 7231, 6.5.4 */
      NotFound: 404,
      /** RFC 7231, 6.5.5 */
      MethodNotAllowed: 405,
      /** RFC 7231, 6.5.6 */
      NotAcceptable: 406,
      /** RFC 7235, 3.2 */
      ProxyAuthRequired: 407,
      /** RFC 7231, 6.5.7 */
      RequestTimeout: 408,
      /** RFC 7231, 6.5.8 */
      Conflict: 409,
      /** RFC 7231, 6.5.9 */
      Gone: 410,
      /** RFC 7231, 6.5.10 */
      LengthRequired: 411,
      /** RFC 7232, 4.2 */
      PreconditionFailed: 412,
      /** RFC 7231, 6.5.11 */
      ContentTooLarge: 413,
      /** RFC 7231, 6.5.12 */
      URITooLong: 414,
      /** RFC 7231, 6.5.13 */
      UnsupportedMediaType: 415,
      /** RFC 7233, 4.4 */
      RangeNotSatisfiable: 416,
      /** RFC 7231, 6.5.14 */
      ExpectationFailed: 417,
      /** RFC 7168, 2.3.3 */
      Teapot: 418,
      /** RFC 7540, 9.1.2 */
      MisdirectedRequest: 421,
      /** RFC 4918, 11.2 */
      UnprocessableEntity: 422,
      /** RFC 4918, 11.3 */
      Locked: 423,
      /** RFC 4918, 11.4 */
      FailedDependency: 424,
      /** RFC 8470, 5.2 */
      TooEarly: 425,
      /** RFC 7231, 6.5.15 */
      UpgradeRequired: 426,
      /** RFC 6585, 3 */
      PreconditionRequired: 428,
      /** RFC 6585, 4 */
      TooManyRequests: 429,
      /** RFC 6585, 5 */
      RequestHeaderFieldsTooLarge: 431,
      /** RFC 7725, 3 */
      UnavailableForLegalReasons: 451,
      /** RFC 7231, 6.6.1 */
      InternalServerError: 500,
      /** RFC 7231, 6.6.2 */
      NotImplemented: 501,
      /** RFC 7231, 6.6.3 */
      BadGateway: 502,
      /** RFC 7231, 6.6.4 */
      ServiceUnavailable: 503,
      /** RFC 7231, 6.6.5 */
      GatewayTimeout: 504,
      /** RFC 7231, 6.6.6 */
      HTTPVersionNotSupported: 505,
      /** RFC 2295, 8.1 */
      VariantAlsoNegotiates: 506,
      /** RFC 4918, 11.5 */
      InsufficientStorage: 507,
      /** RFC 5842, 7.2 */
      LoopDetected: 508,
      /** RFC 2774, 7 */
      NotExtended: 510,
      /** RFC 6585, 6 */
      NetworkAuthenticationRequired: 511
    };
    STATUS_TEXT = {
      [STATUS_CODE.Accepted]: "Accepted",
      [STATUS_CODE.AlreadyReported]: "Already Reported",
      [STATUS_CODE.BadGateway]: "Bad Gateway",
      [STATUS_CODE.BadRequest]: "Bad Request",
      [STATUS_CODE.Conflict]: "Conflict",
      [STATUS_CODE.Continue]: "Continue",
      [STATUS_CODE.Created]: "Created",
      [STATUS_CODE.EarlyHints]: "Early Hints",
      [STATUS_CODE.ExpectationFailed]: "Expectation Failed",
      [STATUS_CODE.FailedDependency]: "Failed Dependency",
      [STATUS_CODE.Forbidden]: "Forbidden",
      [STATUS_CODE.Found]: "Found",
      [STATUS_CODE.GatewayTimeout]: "Gateway Timeout",
      [STATUS_CODE.Gone]: "Gone",
      [STATUS_CODE.HTTPVersionNotSupported]: "HTTP Version Not Supported",
      [STATUS_CODE.IMUsed]: "IM Used",
      [STATUS_CODE.InsufficientStorage]: "Insufficient Storage",
      [STATUS_CODE.InternalServerError]: "Internal Server Error",
      [STATUS_CODE.LengthRequired]: "Length Required",
      [STATUS_CODE.Locked]: "Locked",
      [STATUS_CODE.LoopDetected]: "Loop Detected",
      [STATUS_CODE.MethodNotAllowed]: "Method Not Allowed",
      [STATUS_CODE.MisdirectedRequest]: "Misdirected Request",
      [STATUS_CODE.MovedPermanently]: "Moved Permanently",
      [STATUS_CODE.MultiStatus]: "Multi Status",
      [STATUS_CODE.MultipleChoices]: "Multiple Choices",
      [STATUS_CODE.NetworkAuthenticationRequired]: "Network Authentication Required",
      [STATUS_CODE.NoContent]: "No Content",
      [STATUS_CODE.NonAuthoritativeInfo]: "Non Authoritative Info",
      [STATUS_CODE.NotAcceptable]: "Not Acceptable",
      [STATUS_CODE.NotExtended]: "Not Extended",
      [STATUS_CODE.NotFound]: "Not Found",
      [STATUS_CODE.NotImplemented]: "Not Implemented",
      [STATUS_CODE.NotModified]: "Not Modified",
      [STATUS_CODE.OK]: "OK",
      [STATUS_CODE.PartialContent]: "Partial Content",
      [STATUS_CODE.PaymentRequired]: "Payment Required",
      [STATUS_CODE.PermanentRedirect]: "Permanent Redirect",
      [STATUS_CODE.PreconditionFailed]: "Precondition Failed",
      [STATUS_CODE.PreconditionRequired]: "Precondition Required",
      [STATUS_CODE.Processing]: "Processing",
      [STATUS_CODE.ProxyAuthRequired]: "Proxy Auth Required",
      [STATUS_CODE.ContentTooLarge]: "Content Too Large",
      [STATUS_CODE.RequestHeaderFieldsTooLarge]: "Request Header Fields Too Large",
      [STATUS_CODE.RequestTimeout]: "Request Timeout",
      [STATUS_CODE.URITooLong]: "URI Too Long",
      [STATUS_CODE.RangeNotSatisfiable]: "Range Not Satisfiable",
      [STATUS_CODE.ResetContent]: "Reset Content",
      [STATUS_CODE.SeeOther]: "See Other",
      [STATUS_CODE.ServiceUnavailable]: "Service Unavailable",
      [STATUS_CODE.SwitchingProtocols]: "Switching Protocols",
      [STATUS_CODE.Teapot]: "I'm a teapot",
      [STATUS_CODE.TemporaryRedirect]: "Temporary Redirect",
      [STATUS_CODE.TooEarly]: "Too Early",
      [STATUS_CODE.TooManyRequests]: "Too Many Requests",
      [STATUS_CODE.Unauthorized]: "Unauthorized",
      [STATUS_CODE.UnavailableForLegalReasons]: "Unavailable For Legal Reasons",
      [STATUS_CODE.UnprocessableEntity]: "Unprocessable Entity",
      [STATUS_CODE.UnsupportedMediaType]: "Unsupported Media Type",
      [STATUS_CODE.UpgradeRequired]: "Upgrade Required",
      [STATUS_CODE.UseProxy]: "Use Proxy",
      [STATUS_CODE.VariantAlsoNegotiates]: "Variant Also Negotiates"
    };
    HttpError = class extends Error {
      static {
        __name(this, "HttpError");
      }
      /**
       * Constructs a new instance.
       *
       * @param status The HTTP status code.
       * @param message The error message. Defaults to the status text of the given
       * status code.
       * @param options Optional error options.
       */
      constructor(status, message = STATUS_TEXT[status], options2) {
        super(message, options2);
        this.name = this.constructor.name;
        this.status = status;
      }
    };
    SCRIPT_ESCAPE = /<\/(style|script)/gi;
    COMMENT_ESCAPE = /<!--/gi;
    __name(escapeScript, "escapeScript");
    UniqueNamer = class {
      static {
        __name(this, "UniqueNamer");
      }
      #seen = /* @__PURE__ */ new Map();
      getUniqueName(name) {
        const count = this.#seen.get(name);
        if (count === void 0) {
          this.#seen.set(name, 1);
        } else {
          this.#seen.set(name, count + 1);
          name = `${name}_${count}`;
        }
        return name;
      }
    };
    __name(isLazy, "isLazy");
    $$_tpl_1$2 = [
      "",
      "",
      ""
    ];
    $$_tpl_2 = [
      "<template ",
      " ",
      ">",
      "</template>"
    ];
    $$_tpl_3 = [
      "",
      ""
    ];
    options = l;
    RenderState = class {
      static {
        __name(this, "RenderState");
      }
      ctx;
      buildCache;
      partialId;
      nonce;
      partialDepth;
      partialCount;
      error;
      // deno-lint-ignore no-explicit-any
      slots;
      // deno-lint-ignore no-explicit-any
      islandProps;
      islands;
      // deno-lint-ignore no-explicit-any
      encounteredPartials;
      owners;
      ownerStack;
      // TODO: merge into bitmask field
      renderedHtmlTag;
      renderedHtmlBody;
      renderedHtmlHead;
      hasRuntimeScript;
      constructor(ctx, buildCache, partialId) {
        this.ctx = ctx;
        this.buildCache = buildCache;
        this.partialId = partialId;
        this.partialDepth = 0;
        this.partialCount = 0;
        this.error = null;
        this.slots = [];
        this.islandProps = [];
        this.islands = /* @__PURE__ */ new Set();
        this.encounteredPartials = /* @__PURE__ */ new Set();
        this.owners = /* @__PURE__ */ new Map();
        this.ownerStack = [];
        this.renderedHtmlTag = false;
        this.renderedHtmlBody = false;
        this.renderedHtmlHead = false;
        this.hasRuntimeScript = false;
        this.nonce = crypto.randomUUID().replace(/-/g, "");
      }
      clear() {
        this.islands.clear();
        this.encounteredPartials.clear();
        this.owners.clear();
        this.slots = [];
        this.islandProps = [];
        this.ownerStack = [];
      }
    };
    RENDER_STATE = null;
    __name(setRenderState, "setRenderState");
    oldVNodeHook = options["vnode"];
    options["vnode"] = (vnode) => {
      if (RENDER_STATE !== null) {
        RENDER_STATE.owners.set(vnode, RENDER_STATE.ownerStack.at(-1));
        if (vnode.type === "a") {
          setActiveUrl(vnode, RENDER_STATE.ctx.url.pathname);
        }
      }
      assetHashingHook(vnode, BUILD_ID);
      if (typeof vnode.type === "function") {
        if (vnode.type === Partial) {
          const props = vnode.props;
          const key = normalizeKey(vnode.key);
          const mode = !props.mode || props.mode === "replace" ? PartialMode.Replace : props.mode === "append" ? PartialMode.Append : PartialMode.Prepend;
          props.children = wrapWithMarker(props.children, "partial", `${props.name}:${mode}:${key}`);
        }
      } else if (typeof vnode.type === "string") {
        if (vnode.type === "body") {
          const scripts = _(FreshScripts, null);
          if (vnode.props.children == null) {
            vnode.props.children = scripts;
          } else if (Array.isArray(vnode.props.children)) {
            vnode.props.children.push(scripts);
          } else {
            vnode.props.children = [
              vnode.props.children,
              scripts
            ];
          }
        }
        if (CLIENT_NAV_ATTR in vnode.props) {
          vnode.props[CLIENT_NAV_ATTR] = String(vnode.props[CLIENT_NAV_ATTR]);
        }
      }
      oldVNodeHook?.(vnode);
    };
    oldAttrHook = options["attr"];
    options["attr"] = (name, value) => {
      if (name === CLIENT_NAV_ATTR) {
        return `${CLIENT_NAV_ATTR}="${String(Boolean(value))}"`;
      } else if (name === "key") {
        return `${DATA_FRESH_KEY}="${escape(String(value))}"`;
      }
      return oldAttrHook?.(name, value);
    };
    PATCHED = /* @__PURE__ */ new WeakSet();
    __name(normalizeKey, "normalizeKey");
    oldDiff = options["__b"];
    options["__b"] = (vnode) => {
      if (RENDER_STATE !== null) {
        patcher: if (typeof vnode.type === "function" && vnode.type !== k) {
          if (vnode.type === Partial) {
            RENDER_STATE.partialDepth++;
            const name = vnode.props.name;
            if (typeof name === "string") {
              if (RENDER_STATE.encounteredPartials.has(name)) {
                throw new Error(`Rendered response contains duplicate partial name: "${name}"`);
              }
              RENDER_STATE.encounteredPartials.add(name);
            }
            if (hasIslandOwner(RENDER_STATE, vnode)) {
              throw new Error(`<Partial> components cannot be used inside islands.`);
            }
          } else if (!PATCHED.has(vnode) && !hasIslandOwner(RENDER_STATE, vnode)) {
            const island = RENDER_STATE.buildCache.islandRegistry.get(vnode.type);
            if (island === void 0) {
              if (vnode.key !== void 0) {
                const key = normalizeKey(vnode.key);
                const originalType2 = vnode.type;
                vnode.type = (props) => {
                  const child = _(originalType2, props);
                  PATCHED.add(child);
                  return wrapWithMarker(child, "key", key);
                };
              }
              break patcher;
            }
            const { islands: islands2, islandProps } = RENDER_STATE;
            islands2.add(island);
            const originalType = vnode.type;
            vnode.type = (props) => {
              for (const name in props) {
                const value = props[name];
                if (name === "children" || t(value) && !isSignal(value)) {
                  const slotId = RENDER_STATE.slots.length;
                  RENDER_STATE.slots.push({
                    id: slotId,
                    name,
                    vnode: value
                  });
                  props[name] = _(Slot, {
                    name,
                    id: slotId
                  }, value);
                }
              }
              const propsIdx = islandProps.push({
                slots: [],
                props
              }) - 1;
              const child = _(originalType, props);
              PATCHED.add(child);
              const key = normalizeKey(vnode.key);
              return wrapWithMarker(child, "island", `${island.name}:${propsIdx}:${key}`);
            };
          }
        } else if (typeof vnode.type === "string") {
          switch (vnode.type) {
            case "html":
              RENDER_STATE.renderedHtmlTag = true;
              break;
            case "head":
              RENDER_STATE.renderedHtmlHead = true;
              break;
            case "body":
              RENDER_STATE.renderedHtmlBody = true;
              break;
          }
          if (vnode.key !== void 0 && (RENDER_STATE.partialDepth > 0 || hasIslandOwner(RENDER_STATE, vnode))) {
            vnode.props[DATA_FRESH_KEY] = String(vnode.key);
          }
        }
      }
      oldDiff?.(vnode);
    };
    oldRender = options["__r"];
    options["__r"] = (vnode) => {
      if (typeof vnode.type === "function" && vnode.type !== k && RENDER_STATE !== null) {
        RENDER_STATE.ownerStack.push(vnode);
      }
      oldRender?.(vnode);
    };
    oldDiffed = options["diffed"];
    options["diffed"] = (vnode) => {
      if (typeof vnode.type === "function" && vnode.type !== k && RENDER_STATE !== null) {
        RENDER_STATE.ownerStack.pop();
        if (vnode.type === Partial) {
          RENDER_STATE.partialDepth--;
        }
      }
      oldDiffed?.(vnode);
    };
    __name(Slot, "Slot");
    __name(hasIslandOwner, "hasIslandOwner");
    __name(wrapWithMarker, "wrapWithMarker");
    __name(isSignal, "isSignal");
    __name(isVNode, "isVNode");
    stringifiers = {
      Signal: /* @__PURE__ */ __name((value) => {
        return isSignal(value) ? {
          value: value.peek()
        } : void 0;
      }, "Signal"),
      Slot: /* @__PURE__ */ __name((value) => {
        if (isVNode(value) && value.type === Slot) {
          const props = value.props;
          return {
            value: {
              name: props.name,
              id: props.id
            }
          };
        }
      }, "Slot")
    };
    __name(FreshScripts, "FreshScripts");
    __name(FreshRuntimeScript, "FreshRuntimeScript");
    version$1 = "2.0.0-alpha.50";
    denoJson = {
      version: version$1
    };
    CURRENT_FRESH_VERSION = denoJson.version;
    tracer = import_api.trace.getTracer("fresh", CURRENT_FRESH_VERSION);
    __name(recordSpanError, "recordSpanError");
    __name(isAsyncAnyComponent, "isAsyncAnyComponent");
    __name(renderAsyncAnyComponent, "renderAsyncAnyComponent");
    __name(preactRender, "preactRender");
    __name(renderRouteComponent, "renderRouteComponent");
    Context = class {
      static {
        __name(this, "Context");
      }
      constructor(req, url, info, route, params, config, next, buildCache) {
        __privateAdd(this, _internal);
        __privateAdd(this, _buildCache);
        __privateSet(this, _internal, {
          app: null,
          layouts: []
        });
        this.state = {};
        this.data = void 0;
        this.error = null;
        this.url = url;
        this.req = req;
        this.info = info;
        this.params = params;
        this.route = route;
        this.config = config;
        this.isPartial = url.searchParams.has(PARTIAL_SEARCH_PARAM);
        this.next = next;
        __privateSet(this, _buildCache, buildCache);
      }
      /**
       * Return a redirect response to the specified path. This is the
       * preferred way to do redirects in Fresh.
       *
       * ```ts
       * ctx.redirect("/foo/bar") // redirect user to "<yoursite>/foo/bar"
       *
       * // Disallows protocol relative URLs for improved security. This
       * // redirects the user to `<yoursite>/evil.com` which is safe,
       * // instead of redirecting to `http://evil.com`.
       * ctx.redirect("//evil.com/");
       * ```
       */
      redirect(pathOrUrl, status = 302) {
        let location = pathOrUrl;
        if (pathOrUrl !== "/" && pathOrUrl.startsWith("/")) {
          let idx = pathOrUrl.indexOf("?");
          if (idx === -1) {
            idx = pathOrUrl.indexOf("#");
          }
          const pathname = idx > -1 ? pathOrUrl.slice(0, idx) : pathOrUrl;
          const search = idx > -1 ? pathOrUrl.slice(idx) : "";
          location = `${pathname.replaceAll(/\/+/g, "/")}${search}`;
        }
        return new Response(null, {
          status,
          headers: {
            location
          }
        });
      }
      /**
       * Render JSX and return an HTML `Response` instance.
       * ```tsx
       * ctx.render(<h1>hello world</h1>);
       * ```
       */
      async render(vnode, init = {}) {
        if (arguments.length === 0) {
          throw new Error(`No arguments passed to: ctx.render()`);
        } else if (vnode !== null && !t(vnode)) {
          throw new Error(`Non-JSX element passed to: ctx.render()`);
        }
        const defs = __privateGet(this, _internal).layouts;
        const appDef = __privateGet(this, _internal).app;
        const props = this;
        for (let i6 = defs.length - 1; i6 >= 0; i6--) {
          const child = vnode;
          props.Component = () => child;
          const def = defs[i6];
          const result = await renderRouteComponent(this, def, () => child);
          if (result instanceof Response) {
            return result;
          }
          vnode = result;
        }
        if (isAsyncAnyComponent(appDef)) {
          const child = vnode;
          props.Component = () => child;
          const result = await renderAsyncAnyComponent(appDef, props);
          if (result instanceof Response) {
            return result;
          }
          vnode = result;
        } else if (appDef !== null) {
          const child = vnode;
          vnode = _(appDef, {
            Component: /* @__PURE__ */ __name(() => child, "Component"),
            config: this.config,
            data: null,
            error: this.error,
            info: this.info,
            isPartial: this.isPartial,
            params: this.params,
            req: this.req,
            state: this.state,
            url: this.url
          });
        }
        const headers = init.headers !== void 0 ? init.headers instanceof Headers ? init.headers : new Headers(init.headers) : new Headers();
        headers.set("Content-Type", "text/html; charset=utf-8");
        const responseInit = {
          status: init.status ?? 200,
          headers,
          statusText: init.statusText
        };
        let partialId = "";
        if (this.url.searchParams.has(PARTIAL_SEARCH_PARAM)) {
          partialId = crypto.randomUUID();
          headers.set("X-Fresh-Id", partialId);
        }
        const html = tracer.startActiveSpan("render", (span) => {
          span.setAttribute("fresh.span_type", "render");
          const state = new RenderState(
            this,
            __privateGet(this, _buildCache),
            partialId
          );
          try {
            setRenderState(state);
            return preactRender(
              vnode ?? _(k, null),
              this,
              state,
              headers
            );
          } catch (err) {
            if (err instanceof Error) {
              span.recordException(err);
            } else {
              span.setStatus({
                code: import_api.SpanStatusCode.ERROR,
                message: String(err)
              });
            }
            throw err;
          } finally {
            state.clear();
            setRenderState(null);
            span.end();
          }
        });
        return new Response(html, responseInit);
      }
    };
    _internal = /* @__PURE__ */ new WeakMap();
    _buildCache = /* @__PURE__ */ new WeakMap();
    getInternals = /* @__PURE__ */ __name((ctx) => __privateGet(ctx, _internal), "getInternals");
    getBuildCache = /* @__PURE__ */ __name((ctx) => __privateGet(ctx, _buildCache), "getBuildCache");
    __name(runMiddlewares, "runMiddlewares");
    __name(newByMethod, "newByMethod");
    IS_PATTERN = /[*:{}+?()]/;
    EMPTY = [];
    UrlPatternRouter = class {
      static {
        __name(this, "UrlPatternRouter");
      }
      #statics = /* @__PURE__ */ new Map();
      #dynamics = /* @__PURE__ */ new Map();
      #dynamicArr = [];
      #allowed = /* @__PURE__ */ new Map();
      getAllowedMethods(pattern) {
        const allowed = this.#allowed.get(pattern);
        if (allowed === void 0) return EMPTY;
        return Array.from(allowed);
      }
      add(method, pathname, handlers) {
        let allowed = this.#allowed.get(pathname);
        if (allowed === void 0) {
          allowed = /* @__PURE__ */ new Set();
          this.#allowed.set(pathname, allowed);
        }
        allowed.add(method);
        let byMethod;
        if (IS_PATTERN.test(pathname)) {
          let def = this.#dynamics.get(pathname);
          if (def === void 0) {
            def = {
              pattern: new URLPattern({ pathname }),
              byMethod: newByMethod()
            };
            this.#dynamics.set(pathname, def);
            this.#dynamicArr.push(def);
          }
          byMethod = def.byMethod;
        } else {
          let def = this.#statics.get(pathname);
          if (def === void 0) {
            def = {
              pattern: pathname,
              byMethod: newByMethod()
            };
            this.#statics.set(pathname, def);
          }
          byMethod = def.byMethod;
        }
        byMethod[method].push(...handlers);
      }
      match(method, url, init = []) {
        const result = {
          params: /* @__PURE__ */ Object.create(null),
          handlers: init,
          methodMatch: false,
          pattern: null
        };
        const staticMatch = this.#statics.get(url.pathname);
        if (staticMatch !== void 0) {
          result.pattern = url.pathname;
          const handlers = staticMatch.byMethod[method];
          if (handlers.length > 0) {
            result.methodMatch = true;
            result.handlers.push(...handlers);
          }
          return result;
        }
        for (let i6 = 0; i6 < this.#dynamicArr.length; i6++) {
          const route = this.#dynamicArr[i6];
          const match = route.pattern.exec(url);
          if (match === null) continue;
          result.pattern = route.pattern.pathname;
          const handlers = route.byMethod[method];
          if (handlers.length > 0) {
            result.methodMatch = true;
            result.handlers.push(...handlers);
            for (const [key, value] of Object.entries(match.pathname.groups)) {
              result.params[key] = value === void 0 ? "" : decodeURI(value);
            }
          }
          break;
        }
        return result;
      }
    };
    __name(patternToSegments, "patternToSegments");
    __name(mergePath, "mergePath");
    __name(isHandlerByMethod, "isHandlerByMethod");
    __name(newSegment, "newSegment");
    __name(getOrCreateSegment, "getOrCreateSegment");
    __name(segmentToMiddlewares, "segmentToMiddlewares");
    __name(renderRoute, "renderRoute");
    DEFAULT_NOT_FOUND = /* @__PURE__ */ __name(() => {
      throw new HttpError(404);
    }, "DEFAULT_NOT_FOUND");
    DEFAULT_NOT_ALLOWED_METHOD = /* @__PURE__ */ __name(() => {
      throw new HttpError(405);
    }, "DEFAULT_NOT_ALLOWED_METHOD");
    DEFAULT_RENDER = /* @__PURE__ */ __name(() => (
      // deno-lint-ignore no-explicit-any
      Promise.resolve({ data: {} })
    ), "DEFAULT_RENDER");
    __name(ensureHandler, "ensureHandler");
    CommandType = /* @__PURE__ */ ((CommandType2) => {
      CommandType2["Middleware"] = "middleware";
      CommandType2["Layout"] = "layout";
      CommandType2["App"] = "app";
      CommandType2["Route"] = "route";
      CommandType2["Error"] = "error";
      CommandType2["NotFound"] = "notFound";
      CommandType2["Handler"] = "handler";
      CommandType2["FsRoute"] = "fsRoute";
      return CommandType2;
    })(CommandType || {});
    __name(newErrorCmd, "newErrorCmd");
    __name(newAppCmd, "newAppCmd");
    __name(newLayoutCmd, "newLayoutCmd");
    __name(newMiddlewareCmd, "newMiddlewareCmd");
    __name(newNotFoundCmd, "newNotFoundCmd");
    __name(newRouteCmd, "newRouteCmd");
    __name(newHandlerCmd, "newHandlerCmd");
    __name(applyCommands, "applyCommands");
    __name(applyCommandsInner, "applyCommandsInner");
    __name(isFreshFile, "isFreshFile");
    __name(fsItemsToCommands, "fsItemsToCommands");
    __name(warnInvalidRoute, "warnInvalidRoute");
    __name(validateFsMod, "validateFsMod");
    __name(normalizeRoute, "normalizeRoute");
    MockBuildCache = class {
      static {
        __name(this, "MockBuildCache");
      }
      constructor(files) {
        this.root = "";
        this.clientEntry = "";
        this.islandRegistry = /* @__PURE__ */ new Map();
        this.#files = files;
      }
      #files;
      getFsRoutes() {
        return fsItemsToCommands(this.#files);
      }
      readFile(_pathname) {
        return Promise.resolve(null);
      }
    };
    DEFAULT_CONN_INFO = {
      localAddr: { transport: "tcp", hostname: "localhost", port: 8080 },
      remoteAddr: { transport: "tcp", hostname: "localhost", port: 1234 }
    };
    defaultOptionsHandler = /* @__PURE__ */ __name((methods) => {
      return () => Promise.resolve(
        new Response(null, {
          status: 204,
          headers: { Allow: methods.join(", ") }
        })
      );
    }, "defaultOptionsHandler");
    DEFAULT_ERROR_HANDLER = /* @__PURE__ */ __name(async (ctx) => {
      const { error } = ctx;
      if (error instanceof HttpError) {
        if (error.status >= 500) {
          console.error(error);
        }
        return new Response(error.message, { status: error.status });
      }
      console.error(error);
      return new Response("Internal server error", { status: 500 });
    }, "DEFAULT_ERROR_HANDLER");
    __name(listenOnFreePort, "listenOnFreePort");
    App = class {
      static {
        __name(this, "App");
      }
      constructor(config = {}) {
        __privateAdd(this, _getBuildCache, () => null);
        __privateAdd(this, _commands, []);
        this.config = {
          root: Deno.cwd(),
          basePath: config.basePath ?? "",
          mode: "production"
        };
      }
      use(pathOrMiddleware, ...middlewares) {
        let pattern;
        let fns;
        if (typeof pathOrMiddleware === "string") {
          pattern = pathOrMiddleware;
          fns = middlewares;
        } else {
          pattern = "*";
          middlewares.unshift(pathOrMiddleware);
          fns = middlewares;
        }
        __privateGet(this, _commands).push(newMiddlewareCmd(pattern, fns, true));
        return this;
      }
      /**
       * Set the app's 404 error handler. Can be a {@linkcode Route} or a {@linkcode Middleware}.
       */
      notFound(routeOrMiddleware) {
        __privateGet(this, _commands).push(newNotFoundCmd(routeOrMiddleware));
        return this;
      }
      onError(path, routeOrMiddleware) {
        __privateGet(this, _commands).push(newErrorCmd(path, routeOrMiddleware, true));
        return this;
      }
      appWrapper(component) {
        __privateGet(this, _commands).push(newAppCmd(component));
        return this;
      }
      layout(path, component, config) {
        __privateGet(this, _commands).push(newLayoutCmd(path, component, config, true));
        return this;
      }
      route(path, route, config) {
        __privateGet(this, _commands).push(newRouteCmd(path, route, config, false));
        return this;
      }
      /**
       * Add middlewares for GET requests at the specified path.
       */
      get(path, ...middlewares) {
        __privateGet(this, _commands).push(newHandlerCmd("GET", path, middlewares, false));
        return this;
      }
      /**
       * Add middlewares for POST requests at the specified path.
       */
      post(path, ...middlewares) {
        __privateGet(this, _commands).push(newHandlerCmd("POST", path, middlewares, false));
        return this;
      }
      /**
       * Add middlewares for PATCH requests at the specified path.
       */
      patch(path, ...middlewares) {
        __privateGet(this, _commands).push(newHandlerCmd("PATCH", path, middlewares, false));
        return this;
      }
      /**
       * Add middlewares for PUT requests at the specified path.
       */
      put(path, ...middlewares) {
        __privateGet(this, _commands).push(newHandlerCmd("PUT", path, middlewares, false));
        return this;
      }
      /**
       * Add middlewares for DELETE requests at the specified path.
       */
      delete(path, ...middlewares) {
        __privateGet(this, _commands).push(newHandlerCmd("DELETE", path, middlewares, false));
        return this;
      }
      /**
       * Add middlewares for HEAD requests at the specified path.
       */
      head(path, ...middlewares) {
        __privateGet(this, _commands).push(newHandlerCmd("HEAD", path, middlewares, false));
        return this;
      }
      /**
       * Add middlewares for all HTTP verbs at the specified path.
       */
      all(path, ...middlewares) {
        __privateGet(this, _commands).push(newHandlerCmd("ALL", path, middlewares, false));
        return this;
      }
      /**
       * Insert file routes collected in {@linkcode Builder} at this point.
       * @param pattern Append file routes at this pattern instead of the root
       * @returns
       */
      fsRoutes(pattern = "*") {
        __privateGet(this, _commands).push({
          type: CommandType.FsRoute,
          pattern,
          getItems: /* @__PURE__ */ __name(() => {
            const buildCache = __privateGet(this, _getBuildCache).call(this);
            if (buildCache === null) return [];
            return buildCache.getFsRoutes();
          }, "getItems"),
          includeLastSegment: false
        });
        return this;
      }
      /**
       * Merge another {@linkcode App} instance into this app at the
       * specified path.
       */
      mountApp(path, app2) {
        for (let i6 = 0; i6 < __privateGet(app2, _commands).length; i6++) {
          const cmd = __privateGet(app2, _commands)[i6];
          if (cmd.type !== CommandType.App && cmd.type !== CommandType.NotFound) {
            const clone = {
              ...cmd,
              pattern: mergePath(path, cmd.pattern),
              includeLastSegment: cmd.pattern === "/" || cmd.includeLastSegment
            };
            __privateGet(this, _commands).push(clone);
            continue;
          }
          __privateGet(this, _commands).push(cmd);
        }
        const self2 = this;
        __privateSet(app2, _getBuildCache, () => {
          var _a;
          return __privateGet(_a = self2, _getBuildCache).call(_a);
        });
        return this;
      }
      /**
       * Create handler function for `Deno.serve` or to be used in
       * testing.
       */
      handler() {
        let buildCache = __privateGet(this, _getBuildCache).call(this);
        if (buildCache === null) {
          if (this.config.mode === "production") {
            throw new Error(
              `Could not find _fresh directory. Maybe you forgot to run "deno task build"?`
            );
          } else {
            buildCache = new MockBuildCache([]);
          }
        }
        const router = new UrlPatternRouter();
        const { rootMiddlewares } = applyCommands(
          router,
          __privateGet(this, _commands),
          this.config.basePath
        );
        return async (req, conn = DEFAULT_CONN_INFO) => {
          const url = new URL(req.url);
          url.pathname = url.pathname.replace(/\/+/g, "/");
          const method = req.method.toUpperCase();
          const matched = router.match(method, url);
          let { params, pattern, handlers, methodMatch } = matched;
          const span = import_api.trace.getActiveSpan();
          if (span && pattern) {
            span.updateName(`${method} ${pattern}`);
            span.setAttribute("http.route", pattern);
          }
          let next;
          if (pattern === null || !methodMatch) {
            handlers = rootMiddlewares;
          }
          if (matched.pattern !== null && !methodMatch) {
            if (method === "OPTIONS") {
              const allowed = router.getAllowedMethods(matched.pattern);
              next = defaultOptionsHandler(allowed);
            } else {
              next = DEFAULT_NOT_ALLOWED_METHOD;
            }
          } else {
            next = DEFAULT_NOT_FOUND;
          }
          const ctx = new Context(
            req,
            url,
            conn,
            matched.pattern,
            params,
            this.config,
            next,
            buildCache
          );
          try {
            if (handlers.length === 0) return await next();
            const result = await runMiddlewares(handlers, ctx);
            if (!(result instanceof Response)) {
              throw new Error(
                `Expected a "Response" instance to be returned, but got: ${result}`
              );
            }
            return result;
          } catch (err) {
            ctx.error = err;
            return await DEFAULT_ERROR_HANDLER(ctx);
          }
        };
      }
      /**
       * Spawn a server for this app.
       */
      async listen(options2 = {}) {
        const handler2 = this.handler();
        return await listen(options2, this.config.basePath, handler2);
      }
    };
    _getBuildCache = /* @__PURE__ */ new WeakMap();
    _commands = /* @__PURE__ */ new WeakMap();
    setBuildCache = /* @__PURE__ */ __name((app2, cache) => {
      app2.config.root = cache.root;
      __privateSet(app2, _getBuildCache, () => cache);
    }, "setBuildCache");
    __name(listen, "listen");
    ProdBuildCache = class {
      static {
        __name(this, "ProdBuildCache");
      }
      constructor(root2, snapshot2) {
        this.root = root2;
        setBuildId(snapshot2.version);
        this.#snapshot = snapshot2;
        this.islandRegistry = snapshot2.islands;
        this.clientEntry = snapshot2.clientEntry;
      }
      #snapshot;
      getFsRoutes() {
        return fsItemsToCommands(this.#snapshot.fsRoutes);
      }
      async readFile(pathname) {
        const { staticFiles: staticFiles2 } = this.#snapshot;
        const info = staticFiles2.get(pathname);
        console.log(this.#snapshot);
        console.log("reading", { pathname, info, cwd: Deno.cwd() });
        if (info === void 0) return null;
        const filePath = join(this.root, info.filePath);
        const [stat, file] = await Promise.all([
          Deno.stat(filePath),
          Deno.open(filePath)
        ]);
        return {
          hash: info.hash,
          contentType: info.contentType,
          size: stat.size,
          readable: file.readable,
          close: /* @__PURE__ */ __name(() => file.close(), "close")
        };
      }
    };
    IslandPreparer = class {
      static {
        __name(this, "IslandPreparer");
      }
      #namer = new UniqueNamer();
      prepare(registry, mod, chunkName, modName) {
        for (const [name, value] of Object.entries(mod)) {
          if (typeof value !== "function") continue;
          const islandName = name === "default" ? modName : name;
          const uniqueName = this.#namer.getUniqueName(islandName);
          const fn = value;
          registry.set(fn, {
            exportName: name,
            file: chunkName,
            fn,
            name: uniqueName
          });
        }
      }
    };
    $$_tpl_1$1 = [
      '<div><h1>island asdf</h1><button type="button" ',
      ">update ",
      "</button></div>"
    ];
    __name(Bar, "Bar");
    Bar$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      Bar
    }, Symbol.toStringTag, { value: "Module" }));
    $$_tpl_13 = [
      '<div><h1>island</h1><button type="button" ',
      ">update ",
      "</button></div>"
    ];
    __name(Foo, "Foo");
    Foo$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      Foo
    }, Symbol.toStringTag, { value: "Module" }));
    clientEntry = "./assets/client-entry-NJkU4fnY.js";
    version = "8c7f3c42590b1b72ab3d15e06aa3f2bda5d02d72\n";
    islands = /* @__PURE__ */ new Map();
    islandPreparer = new IslandPreparer();
    islandPreparer.prepare(islands, Bar$1, "./assets/Bar-CLga_KZq.js", "Bar");
    islandPreparer.prepare(islands, Foo$1, "./assets/Foo-OSv-fwFE.js", "Foo");
    staticFiles$1 = /* @__PURE__ */ new Map([
      ["/assets/client-entry-NJkU4fnY.js", { "name": "/assets/client-entry-NJkU4fnY.js", "hash": "ce0f3db5515fa350aa1b78eb21df0ae7e6865b8203054b0c2da66d268da0ee03", "filePath": "_fresh/client/assets/client-entry-NJkU4fnY.js", "contentType": "text/javascript; charset=UTF-8" }],
      ["/assets/client-snapshot-DZtwluTH.js", { "name": "/assets/client-snapshot-DZtwluTH.js", "hash": "60c025e946b9313992440772672fc8199bc62e6b624747e517c5910bf775e6ca", "filePath": "_fresh/client/assets/client-snapshot-DZtwluTH.js", "contentType": "text/javascript; charset=UTF-8" }],
      ["/assets/hooks.module-CXWrrMH9.js", { "name": "/assets/hooks.module-CXWrrMH9.js", "hash": "9f827b42745e07f50376c69719c4cd18ad4123319192bd23746c0a9d57e9ea83", "filePath": "_fresh/client/assets/hooks.module-CXWrrMH9.js", "contentType": "text/javascript; charset=UTF-8" }],
      ["/assets/jsxRuntime.module-DMq64iqm.js", { "name": "/assets/jsxRuntime.module-DMq64iqm.js", "hash": "6d3003ae487761043e4f8f8ee1b91f039b56c77118d6fac90c2699ea30fc7107", "filePath": "_fresh/client/assets/jsxRuntime.module-DMq64iqm.js", "contentType": "text/javascript; charset=UTF-8" }],
      ["/assets/signals.module-CCyNXCvl.js", { "name": "/assets/signals.module-CCyNXCvl.js", "hash": "5542a503397fc722a02c5d4b4578f43c462fa29f99995e9210161f8f7da3e50e", "filePath": "_fresh/client/assets/signals.module-CCyNXCvl.js", "contentType": "text/javascript; charset=UTF-8" }],
      ["/assets/Bar-CLga_KZq.js", { "name": "/assets/Bar-CLga_KZq.js", "hash": "59d73798661ef97b34f917d15095585d5b3c122fc9e3c999dc829bb7677d8c00", "filePath": "_fresh/client/assets/Bar-CLga_KZq.js", "contentType": "text/javascript; charset=UTF-8" }],
      ["/assets/Foo-OSv-fwFE.js", { "name": "/assets/Foo-OSv-fwFE.js", "hash": "5c2fc19e58f436c4a7f7ae4cd1d80f2a7be4c32dba61ca7c3081d7d3098f383f", "filePath": "_fresh/client/assets/Foo-OSv-fwFE.js", "contentType": "text/javascript; charset=UTF-8" }],
      ["/foo.txt", { "name": "/foo.txt", "hash": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae", "filePath": "_fresh/client/foo.txt", "contentType": "text/plain; charset=UTF-8" }]
    ]);
    fsRoutes = [
      { id: "/index", mod: /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_index_BkfEFnq(), index_BkfEFnq_exports)), "mod"), type: "route", pattern: "/", routePattern: "/" },
      { id: "/about", mod: /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_about_Dn0hkKPu(), about_Dn0hkKPu_exports)), "mod"), type: "route", pattern: "/about", routePattern: "/about" }
    ];
    snapshot = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      clientEntry,
      fsRoutes,
      islands,
      staticFiles: staticFiles$1,
      version
    }, Symbol.toStringTag, { value: "Module" }));
    __name(trailingSlashes, "trailingSlashes");
    __name(staticFiles, "staticFiles");
    app = new App().use(staticFiles()).use(trailingSlashes()).get("/", () => new Response("it works")).fsRoutes();
    root = "";
    setBuildCache(app, new ProdBuildCache(root, snapshot));
    _fresh_server_entry = {
      fetch: app.handler()
    };
  }
});

// .wrangler/tmp/bundle-yeLVwx/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-yeLVwx/middleware-insertion-facade.js
init_modules_watch_stub();
init_server_entry();

// ../../node_modules/.deno/wrangler@4.26.1/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e4) {
      console.error("Failed to drain the unused request body.", e4);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/.deno/wrangler@4.26.1/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
function reduceError(e4) {
  return {
    name: e4?.name,
    message: e4?.message ?? String(e4),
    stack: e4?.stack,
    cause: e4?.cause === void 0 ? void 0 : reduceError(e4.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e4) {
    const error = reduceError(e4);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-yeLVwx/middleware-insertion-facade.js
init_server_entry();
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = _fresh_server_entry;

// ../../node_modules/.deno/wrangler@4.26.1/node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-yeLVwx/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Bar as B,
  Foo as F,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=server-entry.js.map
