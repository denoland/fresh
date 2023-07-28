// TS types don't include that yet
declare global {
  interface Document {
    startViewTransition?(fn: () => void): {
      finished: Promise<boolean>;
    };
  }

  interface Navigator {
    connection?: NetworkInformation;
  }

  interface NetworkInformation {
    effectiveType: string; // "slow-2g" | "2g" | "3g" | "4g";
    saveData: boolean;
  }
}

// WARNING: Must be a self contained function
export function initViewTransitions() {
  // Keep track of history state to apply forward or backward animations
  let index = history.state?.index || 0;
  if (!history.state) {
    history.replaceState({ index }, document.title);
  }

  const supportsViewTransitions = document.startViewTransition;
  const hasViewTransitions = !!document.head.querySelector(
    "#__FRSH_TRANSITIONS",
  );
  const parser = new DOMParser();

  function patchAttrs(oldEl: HTMLElement, newEl: HTMLElement) {
    // Remove old attributes not present anymore
    const oldAttrs = oldEl.getAttributeNames();
    for (let i = 0; i < oldAttrs.length; i++) {
      const name = oldAttrs[i];
      if (!name.startsWith("data-frsh") && !newEl.hasAttribute(name)) {
        oldEl.removeAttribute(name);
      }
    }

    // Add new attributes
    const attrs = newEl.getAttributeNames();
    for (let i = 0; i < attrs.length; i++) {
      const name = attrs[i];
      const value = newEl.getAttribute(name);
      if (value === null) oldEl.removeAttribute(name);
      else if (oldEl.getAttribute(name) !== value) {
        oldEl.setAttribute(name, value);
      }
    }
  }

  async function updatePage(html: string) {
    const doc = parser.parseFromString(html, "text/html");

    const existing = new Set(
      (Array.from(
        document.querySelectorAll('head link[rel="stylesheet"]'),
      ) as HTMLLinkElement[]).map((el) =>
        new URL(el.href, location.origin).toString()
      ),
    );

    // Grab all pending styles from the new document and wait
    // until they are loaded before   beginning the transition. This
    // avoids layout flickering
    const styles = (Array.from(
      doc.querySelectorAll('head link[rel="stylesheet"]'),
    ) as HTMLLinkElement[])
      // Filter out stylesheets that we've already loaded
      .filter((el) => !existing.has(el.href))
      .map(
        (link) => {
          const clone = link.cloneNode() as HTMLLinkElement;
          return new Promise((resolve, reject) => {
            clone.addEventListener("load", resolve);
            clone.addEventListener("error", reject);
          });
        },
      );

    if (styles.length) {
      await Promise.all(styles);
    }

    // Replacing the full document breaks animations in Chrome, but
    // replacing only the <body> works. So we do that and diff the
    // <html> and <head> elements ourselves.

    // Replacing <head>
    document.title = doc.title;

    // Patch <html> attributes if there are any
    patchAttrs(document.documentElement, doc.documentElement);
    // Replace <body>. That's the only way that keeps animations working
    document.body.replaceWith(doc.body);
  }

  async function navigate(url: string, direction: "forward" | "back") {
    const res = await fetch(url);
    // Abort transition and navigate directly to the target
    // when request failed
    if (!res.ok) {
      location.href = url;
      return;
    }
    const text = await res.text();

    // TODO: Error handling?
    try {
      document.documentElement.setAttribute(
        "data-frsh-nav",
        direction,
      );
      await supportsViewTransitions
        ? document.startViewTransition!(() => updatePage(text)).finished
        : updatePage(text);
    } catch (_err) {
      // Fall back to a classic navigation if an error occurred
      location.href = url;
      return;
    }
  }

  document.addEventListener("click", async (e) => {
    let el = e.target;
    if (el && el instanceof HTMLElement) {
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
        e.preventDefault();

        await navigate(el.href, "forward");

        index++;
        history.pushState({ index }, "", el.href);
      }
    }
  });

  // deno-lint-ignore no-window-prefix
  window.addEventListener("popstate", async () => {
    const nextIdx = history.state?.index ?? index + 1;
    const direction = nextIdx > index ? "forward" : "back";
    index = nextIdx;
    await navigate(location.href, direction);
  });

  // Prefetch sites when the user starts to click on them. A click
  // takes on average 100ms, which means we can fetch the next page
  // early.
  ["mousedown", "touchstart"].forEach((evName) => {
    document.addEventListener(evName, (ev) => {
      if (ev.target instanceof HTMLAnchorElement) {
        const el = ev.target;
        if (
          el.origin === location.origin && el.pathname !== location.pathname &&
          hasViewTransitions
        ) {
          if (
            document.querySelector(`link[rel=prefetch][href="${el.pathname}"]`)
          ) {
            return;
          }
          if (
            navigator.connection &&
            (navigator.connection.saveData ||
              /(2|3)g/.test(navigator.connection.effectiveType || ""))
          ) {
            return;
          }
          const link = document.createElement("link");
          link.setAttribute("rel", "prefetch");
          link.setAttribute("href", el.pathname);
          document.head.append(link);
        }
      }
    }, {
      passive: true,
      capture: true,
    });
  });
}
