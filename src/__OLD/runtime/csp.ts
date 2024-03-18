import { createContext } from "preact";
import { useContext } from "preact/hooks";

export const SELF = "'self'";
export const UNSAFE_INLINE = "'unsafe-inline'";
export const UNSAFE_EVAL = "'unsafe-eval'";
export const UNSAFE_HASHES = "'unsafe-hashes'";
export const NONE = "'none'";
export const STRICT_DYNAMIC = "'strict-dynamic'";

export function nonce(val: string) {
  return `'nonce-${val}'`;
}

export interface ContentSecurityPolicy {
  directives: ContentSecurityPolicyDirectives;
  reportOnly: boolean;
}

export interface ContentSecurityPolicyDirectives {
  // Fetch directives
  /**
   * Defines the valid sources for web workers and nested browsing contexts
   * loaded using elements such as <frame> and <iframe>.
   */
  childSrc?: string[];
  /**
   * Restricts the URLs which can be loaded using script interfaces.
   */
  connectSrc?: string[];
  /**
   * Serves as a fallback for the other fetch directives.
   */
  defaultSrc?: string[];
  /**
   * Specifies valid sources for fonts loaded using @font-face.
   */
  fontSrc?: string[];
  /**
   * Specifies valid sources for nested browsing contexts loading using elements
   * such as <frame> and <iframe>.
   */
  frameSrc?: string[];
  /**
   * Specifies valid sources of images and favicons.
   */
  imgSrc?: string[];
  /**
   * Specifies valid sources of application manifest files.
   */
  manifestSrc?: string[];
  /**
   * Specifies valid sources for loading media using the <audio> , <video> and
   * <track> elements.
   */
  mediaSrc?: string[];
  /**
   * Specifies valid sources for the <object>, <embed>, and <applet> elements.
   */
  objectSrc?: string[];
  /**
   * Specifies valid sources to be prefetched or prerendered.
   */
  prefetchSrc?: string[];
  /**
   * Specifies valid sources for JavaScript.
   */
  scriptSrc?: string[];
  /**
   * Specifies valid sources for JavaScript <script> elements.
   */
  scriptSrcElem?: string[];
  /**
   * Specifies valid sources for JavaScript inline event handlers.
   */
  scriptSrcAttr?: string[];
  /**
   * Specifies valid sources for stylesheets.
   */
  styleSrc?: string[];
  /**
   * Specifies valid sources for stylesheets <style> elements and <link>
   * elements with rel="stylesheet".
   */
  styleSrcElem?: string[];
  /**
   * Specifies valid sources for inline styles applied to individual DOM
   * elements.
   */
  styleSrcAttr?: string[];
  /**
   * Specifies valid sources for Worker, SharedWorker, or ServiceWorker scripts.
   */
  workerSrc?: string[];

  // Document directives
  /**
   * Restricts the URLs which can be used in a document's <base> element.
   */
  baseUri?: string[];
  /**
   * Enables a sandbox for the requested resource similar to the <iframe>
   * sandbox attribute.
   */
  sandbox?: string[];

  // Navigation directives
  /**
   * Restricts the URLs which can be used as the target of a form submissions
   * from a given context.
   */
  formAction?: string[];
  /**
   * Specifies valid parents that may embed a page using <frame>, <iframe>,
   * <object>, <embed>, or <applet>.
   */
  frameAncestors?: string[];
  /**
   * Restricts the URLs to which a document can initiate navigation by any
   * means, including <form> (if form-action is not specified), <a>,
   * window.location, window.open, etc.
   */
  navigateTo?: string[];

  /**
   * The URI to report CSP violations to.
   */
  reportUri?: string;
}

export const CSP_CONTEXT = createContext<ContentSecurityPolicy | undefined>(
  undefined,
);

export function useCSP(mutator: (csp: ContentSecurityPolicy) => void) {
  const csp = useContext(CSP_CONTEXT);
  if (csp) {
    mutator(csp);
  }
}
