import type { Component, Options as PreactOptions, VNode } from "preact";
import { ASSET_CACHE_BUST_KEY } from "../constants.ts";

export const DATA_CURRENT = "data-current";
export const DATA_ANCESTOR = "data-ancestor";
export const DATA_FRESH_KEY = "data-frsh-key";
export const CLIENT_NAV_ATTR = "f-client-nav";

export const enum OptionsType {
  ATTR = "attr",
  VNODE = "vnode",
  HOOK = "__h",
  DIFF = "__b",
  RENDER = "__r",
  DIFFED = "diffed",
  ERROR = "__e",
}

export interface InternalVNode extends VNode {
  __c: Component | null;
  __: InternalVNode | null;
}

export interface InternalPreactOptions extends PreactOptions {
  [OptionsType.ATTR](name: string, value: unknown): string | void;
  [OptionsType.VNODE](vnode: InternalVNode): void;
  [OptionsType.HOOK](component: Component, index: number, type: number): void;
  [OptionsType.DIFF](vnode: InternalVNode): void;
  [OptionsType.RENDER](vnode: InternalVNode): void;
  [OptionsType.DIFFED](vnode: InternalVNode): void;
  [OptionsType.ERROR](
    error: unknown,
    vnode: InternalVNode,
    oldVNode: InternalVNode,
  ): void;
}

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

export const enum PartialMode {
  Replace,
  Append,
  Prepend,
}

/**
 * Create a "locked" asset path. This differs from a plain path in that it is
 * specific to the current version of the application, and as such can be safely
 * served with a very long cache lifetime (1 year).
 */
export function assetInternal(
  path: string,
  buildId: string,
  basePath?: string,
): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  try {
    const url = new URL(path, "https://freshassetcache.local");
    if (
      url.protocol !== "https:" || url.host !== "freshassetcache.local" ||
      url.searchParams.has(ASSET_CACHE_BUST_KEY)
    ) {
      return path;
    }
    url.searchParams.set(ASSET_CACHE_BUST_KEY, buildId);
    let finalPath = url.pathname + url.search + url.hash;

    finalPath = applyBasePath(finalPath, basePath);

    return finalPath;
  } catch (err) {
    // deno-lint-ignore no-console
    console.warn(
      `Failed to create asset() URL, falling back to regular path ('${path}'):`,
      err,
    );
    return path;
  }
}

/** Apply the `asset` function to urls in a `srcset` attribute. */
export function assetSrcSetInternal(
  srcset: string,
  buildId: string,
  basePath?: string,
): string {
  if (srcset.includes("(")) return srcset; // Bail if the srcset contains complicated syntax.
  const parts = srcset.split(",");
  const constructed = [];
  for (const part of parts) {
    const trimmed = part.trimStart();
    const leadingWhitespace = part.length - trimmed.length;
    if (trimmed === "") return srcset; // Bail if the srcset is malformed.
    let urlEnd = trimmed.indexOf(" ");
    if (urlEnd === -1) urlEnd = trimmed.length;
    const leading = part.substring(0, leadingWhitespace);
    const url = trimmed.substring(0, urlEnd);
    const trailing = trimmed.substring(urlEnd);
    constructed.push(
      leading + assetInternal(url, buildId, basePath) + trailing,
    );
  }
  return constructed.join(",");
}

export function assetHashingHook(
  vnode: VNode<{
    src?: string;
    srcset?: string;
    ["data-fresh-disable-lock"]?: boolean;
  }>,
  buildId: string,
  basePath?: string,
) {
  if (vnode.type === "img" || vnode.type === "source") {
    const { props } = vnode;
    if (props["data-fresh-disable-lock"]) return;
    if (typeof props.src === "string") {
      props.src = assetInternal(props.src, buildId, basePath);
    }
    if (typeof props.srcset === "string") {
      props.srcset = assetSrcSetInternal(props.srcset, buildId, basePath);
    }
  }
}

/** Apply basePath to a given path string */
export function applyBasePath(path: string, basePath?: string): string {
  if (!basePath || basePath === "/") {
    return path;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return path;
  }

  if (basePath === "./") {
    return basePath + path.substring(1);
  }

  return basePath + path;
}
