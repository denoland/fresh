import { VNode } from "preact";

/**
 * Mark active or ancestor link
 * Note: This function is used both on the server and the client
 */
export function setActiveUrl(vnode: VNode, url: URL) {
  const hrefProp = vnode.props.href;
  if (typeof hrefProp === "string" && hrefProp.startsWith("/")) {
    let href = new URL(hrefProp, "http://localhost").pathname;
    if (href !== "/" && href.endsWith("/")) {
      href = href.slice(0, -1);
    }

    let pathname = url.pathname;
    if (pathname !== "/" && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    if (pathname === href) {
      vnode.props["data-current"] = "true";
    } else if (pathname.startsWith(href + "/") || href === "/") {
      vnode.props["data-ancestor"] = "true";
    }
  }
}
