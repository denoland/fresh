import "../polyfills.ts";
import {
  ComponentChildren, Fragment,
  h, options,
  render,
  VNode
} from "preact";
import { assetHashingHook } from "../utils.ts";
import {
  CLIENT_NAV_ATTR,
  DATA_ANCESTOR,
  DATA_CURRENT, PARTIAL_ATTR
} from "../../constants.ts";
import { matchesUrl, setActiveUrl, UrlMatchKind } from "../active_url.ts";
import {
  IslandRegistry,
  RenderRequest,
  FreshHistoryState,
  _walkInner,
  NoPartialsError,
  historyState,
  navigate,
  fetchPartials,
} from "./impl/global.ts";

export function revive(
  islands: IslandRegistry,
  // deno-lint-ignore no-explicit-any
  props: any[],
) {
  const result: RenderRequest[] = [];
  _walkInner(
    islands,
    props,
    // markerstack
    [],
    // Keep a root node in the vnode stack to save a couple of checks
    // later during iteration
    [h(Fragment, null) as VNode],
    document.body,
    result,
  );

  for (let i = 0; i < result.length; i++) {
    const { vnode, rootFragment } = result[i];
    const _render = () => {
      render(
        vnode,
        rootFragment,
      );
    };

    "scheduler" in window
      // `scheduler.postTask` is async but that can easily
      // fire in the background. We don't want waiting for
      // the hydration of an island block us.
      // @ts-ignore scheduler API is not in types yet
      ? scheduler!.postTask(_render)
      : setTimeout(_render, 0);
  }
}

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

const originalHook = options.vnode;
options.vnode = (vnode) => {
  assetHashingHook(vnode);

  // Mark active or ancestor links
  if (vnode.type === "a") {
    setActiveUrl(vnode, location.pathname);
  }

  if (originalHook) originalHook(vnode);
};

function checkClientNavEnabled(el: HTMLElement | null) {
  if (el === null) {
    return document.querySelector(`[${CLIENT_NAV_ATTR}="true"]`) !== null;
  }

  const setting = el.closest(`[${CLIENT_NAV_ATTR}]`);
  if (setting === null) return false;
  return setting.getAttribute(CLIENT_NAV_ATTR) === "true";
}

document.addEventListener("click", async (e) => {
  let el = e.target;
  if (el && el instanceof HTMLElement) {
    const originalEl = el;

    // Check if we clicked inside an anchor link
    if (el.nodeName !== "A") {
      el = el.closest("a");
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
        await navigate(el.href, partial);
        updateLinks(nextUrl);
      } finally {
        if (indicator !== undefined) {
          indicator.value = false;
        }
      }
    } else {
      let button: HTMLButtonElement | HTMLElement | null = originalEl;
      // Check if we clicked on a button
      if (button.nodeName !== "A") {
        button = button.closest("button");
      }

      if (
        button !== null && button instanceof HTMLButtonElement &&
        (button.type !== "submit" || button.form === null)
      ) {
        const partial = button.getAttribute(PARTIAL_ATTR);

        // Check if the user opted out of client side navigation.
        if (
          partial === null ||
          !checkClientNavEnabled(button)
        ) {
          return;
        }

        const partialUrl = new URL(
          partial,
          location.href,
        );
        await fetchPartials(partialUrl);
      }
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
  const nextIdx = state.index ?? historyState.index + 1;
  historyState.index = nextIdx;

  if (!checkClientNavEnabled(null)) {
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
    await fetchPartials(url);
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

    const action = e.submitter?.getAttribute(PARTIAL_ATTR) ??
      e.submitter?.getAttribute("formaction") ??
      el.getAttribute(PARTIAL_ATTR) ?? el.action;

    if (action !== "") {
      e.preventDefault();

      const url = new URL(action, location.href);

      let init: RequestInit | undefined;

      // GET method appends form data via url search params
      if (lowerMethod === "get") {
        // TODO: Looks like constructor type for URLSearchParam is wrong
        // deno-lint-ignore no-explicit-any
        const qs = new URLSearchParams(new FormData(el) as any);
        qs.forEach((value, key) => url.searchParams.set(key, value));
      } else {
        init = { body: new FormData(el), method: lowerMethod };
      }

      await fetchPartials(url, init);
    }
  }
});
