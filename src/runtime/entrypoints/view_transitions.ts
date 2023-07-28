// TS types don't include that yet
declare global {
  interface Document {
    startViewTransition?(fn: () => void): {
      finished: Promise<boolean>;
    };
  }
}

// WARNING: Must be a self contained function
export function initViewTransitions() {
  // Keep track of history state to apply forward or backward animations
  let historyIdx = 0;
  const supportsViewTransitions = document.startViewTransition;
  const parser = new DOMParser();
  document.body.setAttribute("data-frsh-transition", "new");

  function patchAttrs(oldEl: HTMLElement, newEl: HTMLElement) {
    // Remove old attributes not present anymore
    const oldAttrs = oldEl.getAttributeNames();
    for (let i = 0; i < oldAttrs.length; i++) {
      const name = oldAttrs[i];
      if (name !== "data-frsh-nav-transition" && !newEl.hasAttribute(name)) {
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

  function swap(doc: Document) {
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

    // Update the current document
    if (supportsViewTransitions) {
      swap(doc);
    } else {
      let isAnimating = false;
      document.addEventListener("animationstart", () => {
        isAnimating = true;
      }, { once: true });
      document.addEventListener("animationend", () => {
        isAnimating = false;
        doc.body.setAttribute("data-frsh-transition", "old");
        swap(doc);
        document.body.setAttribute("data-frsh-transition", "new");
      }, { once: true });
      document.body.setAttribute("data-frsh-transition", "old");

      // Wait for class changes to take effect
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          !isAnimating && swap(doc);
          resolve();
        }, 100);
      });
    }
  }

  async function navigate(url: string, direction: "forward" | "backward") {
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
        "data-frsh-nav-transition",
        direction === "backward" ? "back" : "forward",
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

  // TODO: Prefetching
  history.replaceState({ historyIdx }, "", location.href);
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

        historyIdx++;
        history.pushState({ historyIdx }, "", el.href);
      }
    }
  });

  // deno-lint-ignore no-window-prefix
  window.addEventListener("popstate", async (e) => {
    const direction = e.state.historyIdx > historyIdx ? "forward" : "backward";
    if (direction === "backward") historyIdx--;
    await navigate(location.href, direction);
  });
}
