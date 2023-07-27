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
  const supportsViewTransitions = document.startViewTransition;
  const parser = new DOMParser();
  document.body.setAttribute("data-frsh-transition", "new");

  function swap(el: HTMLElement) {
    document.documentElement.replaceWith(el);
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
      swap(doc.documentElement);
    } else {
      let isAnimating = false;
      document.addEventListener("animationstart", () => {
        isAnimating = true;
      }, { once: true });
      document.addEventListener("animationend", () => {
        isAnimating = false;
        doc.body.setAttribute("data-frsh-transition", "old");
        swap(doc.documentElement);
        document.body.setAttribute("data-frsh-transition", "new");
      }, { once: true });
      document.body.setAttribute("data-frsh-transition", "old");

      // Wait for class changes to take effect
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          !isAnimating && swap(doc.documentElement);
          resolve();
        }, 100);
      });
    }
  }

  // TODO: Prefetching
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

        console.log("click", el.href, "...fetching");
        const res = await fetch(el.href);
        // Abort transition and navigate directly to the target
        // when request failed
        if (!res.ok) {
          location.href = el.href;
          return;
        }
        const text = await res.text();

        const promise = supportsViewTransitions
          ? document.startViewTransition!(() => updatePage(text)).finished
          : updatePage(text);

        // TODO: Error handling
        try {
          await promise;
        } catch (_err) {
          console.log(_err);
          // Fall back to a classic navigation if an error occurred
          location.href = el.href;
        }
        console.log("...finished!");
      }
    }
  });
}
