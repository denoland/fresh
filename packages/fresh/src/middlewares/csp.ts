import type { Middleware } from "./mod.ts";

/** Options for Content-Security-Policy middleware */
export interface CSPOptions {
  /** If true, sets Content-Security-Policy-Report-Only header instead of Content-Security-Policy */
  reportOnly?: boolean;

  /** If set, adds Reporting-Endpoints, report-to, and report-uri directive */
  reportTo?: string;

  /** Additional CSP directives to add or override the defaults */
  csp?: string[];

  /**
   * If true, replaces 'unsafe-inline' with a nonce-based policy for
   * script-src and style-src directives. Fresh automatically injects
   * nonce attributes on inline `<script>` and `<style>` tags during
   * server rendering, so this option locks down the policy to only
   * allow those Fresh-rendered inline elements.
   */
  useNonce?: boolean;
}

const NONCE_HEADER = "X-Fresh-Nonce";

/**
 * Middleware to set Content-Security-Policy headers
 *
 * @param options - CSP options
 *
 * @example Basic usage
 * ```ts
 * app.use(csp({
 *   reportOnly: true,
 *   reportTo: '/api/csp-reports',
 *   csp: [
 *     "script-src 'self' 'unsafe-inline' 'https://example.com'",
 *   ],
 * }));
 * ```
 *
 * @example Nonce-based CSP
 * ```ts
 * app.use(csp({ useNonce: true }));
 * ```
 */
export function csp<State>(options: CSPOptions = {}): Middleware<State> {
  const {
    reportOnly = false,
    reportTo,
    csp = [],
    useNonce = false,
  } = options;

  const defaultCsp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for fresh
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    "media-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  const cspDirectives = [...defaultCsp, ...csp];
  if (reportTo) {
    cspDirectives.push(`report-to csp-endpoint`);
    cspDirectives.push(`report-uri ${reportTo}`); // deprecated but some browsers still use it
  }

  const headerName = reportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

  if (!useNonce) {
    // Static CSP — no per-request nonce
    const cspString = cspDirectives.join("; ");
    return async (ctx) => {
      const res = await ctx.next();
      res.headers.set(headerName, cspString);
      if (reportTo) {
        res.headers.set("Reporting-Endpoints", `csp-endpoint="${reportTo}"`);
      }
      return res;
    };
  }

  // Nonce-based CSP — replace 'unsafe-inline' with nonce per request
  return async (ctx) => {
    const res = await ctx.next();
    const nonce = res.headers.get(NONCE_HEADER);

    let directives: string[];
    if (nonce) {
      // Remove the internal header so it's not exposed to clients
      res.headers.delete(NONCE_HEADER);

      directives = cspDirectives.map((d) => {
        if (
          (d.startsWith("script-src ") || d.startsWith("style-src ")) &&
          d.includes("'unsafe-inline'")
        ) {
          return d.replace("'unsafe-inline'", `'nonce-${nonce}'`);
        }
        return d;
      });
    } else {
      directives = cspDirectives;
    }

    res.headers.set(headerName, directives.join("; "));
    if (reportTo) {
      res.headers.set("Reporting-Endpoints", `csp-endpoint="${reportTo}"`);
    }
    return res;
  };
}
