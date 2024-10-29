import { type ComponentChildren, h } from "preact";
import {
  CLIENT_NAV_ATTR,
  DATA_ANCESTOR,
  DATA_CURRENT,
  matchesUrl,
  PartialMode,
  UrlMatchKind,
} from "../shared_internal.tsx";
import {
  ACTIVE_PARTIALS,
  copyOldChildren,
  CUSTOM_PARSER,
  type DeserializedProps,
  domToVNode,
  ISLAND_REGISTRY,
  Marker,
  maybeHideMarker,
  PartialComp,
} from "./reviver.ts";
import { createRootFragment, isCommentNode, isElementNode } from "./reviver.ts";
import type { PartialStateJson } from "../server/preact_hooks.tsx";
import { parse } from "../../jsonify/parse.ts";
import { INTERNAL_PREFIX } from "../../constants.ts";

export const PARTIAL_ATTR = "f-partial";
export const PARTIAL_SEARCH_PARAM = "fresh-partial";

class NoPartialsError extends Error {}

export interface FreshHistoryState {
  index: number;
  scrollX: number;
  scrollY: number;
}

function checkClientNavEnabled(el: HTMLElement) {
  const setting = el.closest(`[${CLIENT_NAV_ATTR}]`);
  if (setting === null) return false;
  return setting.getAttribute(CLIENT_NAV_ATTR) !== "false";
}

// Keep track of history state to apply forward or backward animations
let index = history.state?.index || 0;
if (!history.state) {
  const state: FreshHistoryState = {
    index,
    scrollX,
    scrollY,
  };
  history.replaceState(state, document.title);
}

function maybeUpdateHistory(nextUrl: URL) {
  // Only add history entry when URL is new. Still apply
  // the partials because sometimes users click a link to
  // "refresh" the current page.
  if (nextUrl.href !== globalThis.location.href) {
    const state: FreshHistoryState = {
      index,
      scrollX: globalThis.scrollX,
      scrollY: globalThis.scrollY,
    };

    // Store current scroll position
    history.replaceState({ ...state }, "", location.href);

    // Now store the new position
    index++;
    state.scrollX = 0;
    state.scrollY = 0;
    history.pushState(state, "", nextUrl.href);
  }
}

document.addEventListener("click", async (e) => {
  let el = e.target;
  if (el && (el instanceof HTMLElement || el instanceof SVGElement)) {
    const originalEl = el;

    // Check if we clicked inside an anchor link
    if (el.nodeName !== "A") {
      el = el.closest("a");
    }
    if (el === null) {
      el = originalEl.closest("button");
    }

    if (
      // Check that we're still dealing with an anchor tag
      el && el instanceof HTMLAnchorElement &&
      // Check if it's an internal link
      el.href && (!el.target || el.target === "_self") &&
      el.origin === location.origin &&
      // Check if it was a left click and not a right click
      e.button === 0 &&
      // Check that the user doesn't press a key combo to open the
      // link in a new tab or something
      !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button) &&
      // Check that the event isn't aborted already
      !e.defaultPrevented
    ) {
      const partial = el.getAttribute(PARTIAL_ATTR);

      // Check if the user opted out of client side navigation or if
      // we're doing a fragment navigation.
      if (
        el.getAttribute("href")?.startsWith("#") ||
        !checkClientNavEnabled(el)
      ) {
        return;
      }

      // deno-lint-ignore no-explicit-any
      const indicator = (el as any)._freshIndicator;
      if (indicator !== undefined) {
        indicator.value = true;
      }

      e.preventDefault();

      const nextUrl = new URL(el.href);
      try {
        maybeUpdateHistory(nextUrl);

        const partialUrl = new URL(
          partial ? partial : nextUrl.href,
          location.href,
        );
        await fetchPartials(nextUrl, partialUrl);
        updateLinks(nextUrl);
        scrollTo({ left: 0, top: 0, behavior: "instant" });
      } finally {
        if (indicator !== undefined) {
          indicator.value = false;
        }
      }
    } else if (
      el && el instanceof HTMLButtonElement &&
      (el.type !== "submit" || el.form === null)
    ) {
      const partial = el.getAttribute(PARTIAL_ATTR);

      // Check if the user opted out of client side navigation.
      if (partial === null || !checkClientNavEnabled(el)) {
        return;
      }

      const partialUrl = new URL(
        partial,
        location.href,
      );
      await fetchPartials(partialUrl, partialUrl);
    }
  }
});

addEventListener("popstate", async (e) => {
  // When state is `null` then the browser navigated to a document
  // fragment. In this case we do nothing.
  if (e.state === null) {
    // Reset to browser default
    if (history.scrollRestoration) {
      history.scrollRestoration = "auto";
    }
    return;
  }

  const state: FreshHistoryState = history.state;
  const nextIdx = state.index ?? index + 1;
  index = nextIdx;

  const setting = document.querySelector(`[${CLIENT_NAV_ATTR}]`);
  if (setting === null || setting.getAttribute(CLIENT_NAV_ATTR) === "false") {
    location.reload();
    return;
  }

  // We need to keep track of that ourselves since we do client side
  // navigation.
  if (history.scrollRestoration) {
    history.scrollRestoration = "manual";
  }

  const url = new URL(location.href, location.origin);
  try {
    await fetchPartials(url, url);
    updateLinks(url);
    scrollTo({
      left: state.scrollX ?? 0,
      top: state.scrollY ?? 0,
      behavior: "instant",
    });
  } catch (err) {
    // If the response didn't contain a partial, then we can only
    // do a reload.
    if (err instanceof NoPartialsError) {
      location.reload();
      return;
    }

    throw err;
  }
});

// Form submit
document.addEventListener("submit", async (e) => {
  const el = e.target;
  if (el !== null && el instanceof HTMLFormElement && !e.defaultPrevented) {
    if (
      // Check if form has client nav enabled
      !checkClientNavEnabled(el) ||
      // Bail out if submitter is set and client nav is disabled
      (e.submitter !== null && !checkClientNavEnabled(e.submitter))
    ) {
      return;
    }

    const lowerMethod =
      e.submitter?.getAttribute("formmethod")?.toLowerCase() ??
        el.method.toLowerCase();
    if (
      lowerMethod !== "get" && lowerMethod !== "post" &&
      lowerMethod !== "dialog"
    ) {
      return;
    }

    const rawPartialUrl = e.submitter?.getAttribute(PARTIAL_ATTR) ??
      e.submitter?.getAttribute("formaction") ??
      el.getAttribute(PARTIAL_ATTR) ?? el.action;
    const rawActionUrl = e.submitter?.getAttribute("formaction") ?? el.action;

    if (rawPartialUrl !== "") {
      e.preventDefault();

      const partialUrl = new URL(rawPartialUrl, location.href);
      const actionUrl = new URL(rawActionUrl, location.href);

      let init: RequestInit | undefined;

      // GET method appends form data via url search params
      if (lowerMethod === "get") {
        // TODO: Looks like constructor type for URLSearchParam is wrong
        // deno-lint-ignore no-explicit-any
        const qs = new URLSearchParams(new FormData(el, e.submitter) as any);
        qs.forEach((value, key) => partialUrl.searchParams.append(key, value));
      } else {
        init = { body: new FormData(el, e.submitter), method: lowerMethod };
      }

      await fetchPartials(actionUrl, partialUrl, init);
    }
  }
});

function updateLinks(url: URL) {
  document.querySelectorAll("a").forEach((link) => {
    const match = matchesUrl(url.pathname, link.href);

    if (match === UrlMatchKind.Current) {
      link.setAttribute(DATA_CURRENT, "true");
      link.setAttribute("aria-current", "page");
      link.removeAttribute(DATA_ANCESTOR);
    } else if (match === UrlMatchKind.Ancestor) {
      link.setAttribute(DATA_ANCESTOR, "true");
      link.setAttribute("aria-current", "true");
      link.removeAttribute(DATA_CURRENT);
    } else {
      link.removeAttribute(DATA_CURRENT);
      link.removeAttribute(DATA_ANCESTOR);
      link.removeAttribute("aria-current");
    }
  });
}

async function fetchPartials(
  actualUrl: URL,
  partialUrl: URL,
  init: RequestInit = {},
) {
  init.redirect = "follow";
  partialUrl = new URL(partialUrl);
  partialUrl.searchParams.set(PARTIAL_SEARCH_PARAM, "true");
  const res = await fetch(partialUrl, init);

  if (res.redirected) {
    const nextUrl = new URL(res.url);
    if (nextUrl.origin === actualUrl.origin) {
      actualUrl = nextUrl;
    }
  }

  maybeUpdateHistory(actualUrl);
  await applyPartials(res);
}

interface PartialReviveCtx {
  foundPartials: number;
}

/**
 * Apply partials from a HTML response
 */
export async function applyPartials(res: Response): Promise<void> {
  const contentType = res.headers.get("Content-Type");
  if (contentType !== "text/html; charset=utf-8") {
    throw new Error(`Unable to process partial response.`);
  }

  const id = res.headers.get("X-Fresh-Id");

  const resText = await res.text();
  const doc = new DOMParser().parseFromString(resText, "text/html") as Document;

  const state = doc.querySelector(`#__FRSH_STATE_${id}`);
  let allProps: DeserializedProps = [];
  if (state !== null) {
    const json = JSON.parse(state.textContent!) as PartialStateJson;
    const promises: Promise<void>[] = [];

    allProps = parse<DeserializedProps>(json.props, CUSTOM_PARSER);

    for (let i = 0; i < json.islands.length; i++) {
      const island = json.islands[i];
      promises.push(
        import(island.chunk).then((mod) => {
          ISLAND_REGISTRY.set(island.name, mod[island.exportName]);
        }),
      );
    }

    await Promise.all(promises);
  }

  const ctx: PartialReviveCtx = {
    foundPartials: 0,
  };

  if (doc.title) {
    document.title = doc.title;
  }

  // Needs to be converted to an array otherwise somehow <link>-tags
  // are missing.
  Array.from(doc.head.childNodes).forEach((childNode) => {
    const child = childNode as HTMLElement;

    if (child.nodeName === "TITLE") return;
    if (child.nodeName === "META") {
      const meta = child as HTMLMetaElement;

      // Ignore charset which is usually set site wide anyway
      if (meta.hasAttribute("charset")) return;

      const name = meta.name;
      if (name !== "") {
        const existing = document.head.querySelector(`meta[name="${name}"]`) as
          | HTMLMetaElement
          | null;
        if (existing !== null) {
          if (existing.content !== meta.content) {
            existing.content = meta.content;
          }
        } else {
          document.head.appendChild(meta);
        }
      } else {
        const property = child.getAttribute("property");
        const existing = document.head.querySelector(
          `meta[property="${property}"]`,
        ) as HTMLMetaElement | null;
        if (existing !== null) {
          if (existing.content !== meta.content) {
            existing.content = meta.content;
          }
        } else {
          document.head.appendChild(meta);
        }
      }
    } else if (child.nodeName === "LINK") {
      const link = child as HTMLLinkElement;
      if (link.rel === "modulepreload") return;
      if (link.rel === "stylesheet") {
        // The `href` attribute may be root relative. This ensures
        // that they both have the same format
        const existing = Array.from(document.head.querySelectorAll("link"))
          .find((existingLink) => existingLink.href === link.href);
        if (existing === undefined) {
          document.head.appendChild(link);
        }
      }
    } else if (child.nodeName === "SCRIPT") {
      const script = child as HTMLScriptElement;
      if (script.src === `${INTERNAL_PREFIX}/fresh-runtime.js`) return;
      // TODO: What to do with script tags?
    } else if (child.nodeName === "STYLE") {
      const style = child as HTMLStyleElement;
      // TODO: Do we need a smarter merging strategy?
      // Don't overwrie existing style sheets that are flagged as unique
      if (style.id === "") {
        document.head.appendChild(style);
      }
    }
  });

  revivePartials(ctx, allProps, doc.body);

  if (ctx.foundPartials === 0) {
    throw new NoPartialsError(
      `Found no partials in HTML response. Please make sure to render at least one partial. Requested url: ${res.url}`,
    );
  }
}

function revivePartials(
  ctx: PartialReviveCtx,
  allProps: DeserializedProps,
  node: Element,
) {
  let startNode = null;
  let sib: ChildNode | null = node.firstChild;
  let partialCount = 0;
  let partialName = "";
  let partialKey = "";
  let partialMode = PartialMode.Replace;
  while (sib !== null) {
    if (isCommentNode(sib)) {
      const comment = sib.data;
      const parts = comment.split(":");
      if (parts[0] === "frsh") {
        sib = maybeHideMarker(sib);
      }

      if (parts[0] === "frsh" && parts[1] === "partial") {
        if (++partialCount === 1) {
          startNode = sib;
          partialName = parts[2];
          partialMode = +parts[3] as PartialMode;
          partialKey = parts[4];
        }
      } else if (comment === "/frsh:partial") {
        ctx.foundPartials++;

        // Skip hydrating nested partials, only hydrate the outer one
        if (--partialCount > 0) {
          sib = sib.nextSibling;
          continue;
        }

        // Create a fake DOM node that spans the partial we discovered.
        // We need to include the partial markers itself for _walkInner
        // to register them.
        const container = createRootFragment(
          node,
          startNode as Comment,
          sib as Comment,
        );

        const root = h(PartialComp, {
          key: partialKey !== "" ? partialKey : undefined,
          name: partialName,
          mode: partialMode,
          children: null,
        });
        domToVNode(
          allProps,
          [root],
          [Marker.Partial],
          container,
          sib as Comment,
        );

        const instance = ACTIVE_PARTIALS.get(partialName);
        if (instance === undefined) {
          // deno-lint-ignore no-console
          console.warn(`Partial "${partialName}" not found. Skipping...`);
          // Partial doesn't exist on the current page
        } else {
          if (partialMode === PartialMode.Replace) {
            instance.props.children = root.props.children;
          } else if (partialMode === PartialMode.Append) {
            const active = ACTIVE_PARTIALS.get(partialName);
            if (active !== undefined) {
              copyOldChildren(instance.props, active.props.children);

              (instance.props.children as ComponentChildren[]).push(
                root.props.children,
              );
            } else {
              instance.props.children = root.props.children;
            }
          } else if (partialMode === PartialMode.Prepend) {
            const active = ACTIVE_PARTIALS.get(partialName);
            if (active !== undefined) {
              copyOldChildren(instance.props, active.props.children);

              (instance.props.children as ComponentChildren[]).unshift(
                root.props.children,
              );
            } else {
              instance.props.children = root.props.children;
            }
          }
          instance.setState({});
        }
      }
    } else if (partialCount === 0 && isElementNode(sib)) {
      // Do not recurse if we know that we are inisde a partial
      revivePartials(ctx, allProps, sib);
    }

    sib = sib.nextSibling;
  }
}
