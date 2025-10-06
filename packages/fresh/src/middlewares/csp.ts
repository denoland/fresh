import type { Middleware } from "./mod.ts";

/** Options for Content-Security-Policy middleware */
export interface CSPOptions {
  /** If true, sets Content-Security-Policy-Report-Only header instead of Content-Security-Policy */
  reportOnly?: boolean;

  /** If set, adds Reporting-Endpoints, report-to, and report-uri directive */
  reportTo?: string;

  /** Additional CSP directives to add or override the defaults */
  csp?: string[];
}

/** Middleware to set Content-Security-Policy headers
 * @param options - CSP options
 * @example
 * app.use(csp({
 *   reportOnly: true,
 *   reportTo: '/api/csp-reports',
 *   csp: [
 *       "script-src 'self' 'unsafe-inline' 'https://example.com'",
 *   ],
 * }));
 */
export function csp<State>(options: CSPOptions = {}): Middleware<State> {
  const {
    reportOnly = false,
    reportTo,
    csp = [],
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
  const cspString = cspDirectives.join("; ");

  return async (ctx) => {
    const res = await ctx.next();
    const headerName = reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";
    res.headers.set(headerName, cspString);
    if (reportTo) {
      res.headers.set("Reporting-Endpoints", `csp-endpoint="${reportTo}"`);
    }
    return res;
  };
}
