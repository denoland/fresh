import { VNode } from "preact";
import { DATA_ANCESTOR, DATA_CURRENT } from "../constants.ts";

export const enum UrlMatchKind {
  None,
  Ancestor,
  Current,
}

export function matchesUrl(current: string, needle: string): UrlMatchKind {
  let href = new URL(needle, "http://localhost").pathname;
  if (href !== "/" && href.endsWith("/")) {
    href = href.slice(0, -1);
  }

  if (current !== "/" && current.endsWith("/")) {
    current = current.slice(0, -1);
  }

  if (current === href) {
    return UrlMatchKind.Current;
  } else if (current.startsWith(href + "/") || href === "/") {
    return UrlMatchKind.Ancestor;
  }

  return UrlMatchKind.None;
}

/**
 * Mark active or ancestor link
 * Note: This function is used both on the server and the client
 */
export function setActiveUrl(vnode: VNode, pathname: string): void {
  const props = vnode.props as Record<string, unknown>;
  const hrefProp = props.href;
  if (typeof hrefProp === "string" && hrefProp.startsWith("/")) {
    const match = matchesUrl(pathname, hrefProp);
    if (match === UrlMatchKind.Current) {
      props[DATA_CURRENT] = "true";
      props["aria-current"] = "page";
    } else if (match === UrlMatchKind.Ancestor) {
      props[DATA_ANCESTOR] = "true";
      props["aria-current"] = "true";
    }
  }
}
