import { VNode } from "preact";

/**
 * Mark active or ancestor link
 * Note: This function is used both on the server and the client
 */
export function setActiveUrl(vnode: VNode, pathname: string) {
  const props = vnode.props as Record<string, unknown>;
  const hrefProp = props.href;
  if (typeof hrefProp === "string" && hrefProp.startsWith("/")) {
    let href = new URL(hrefProp, "http://localhost").pathname;
    if (href !== "/" && href.endsWith("/")) {
      href = href.slice(0, -1);
    }

    if (pathname !== "/" && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    if (pathname === href) {
      props["data-current"] = "true";
    } else if (pathname.startsWith(href + "/") || href === "/") {
      props["data-ancestor"] = "true";
    }
  }
}
