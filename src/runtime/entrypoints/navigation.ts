// Keep track of history state to apply forward or backward animations
let index = history.state?.index || 0;
if (!history.state) {
  history.replaceState({ index }, document.title);
}

const parser = new DOMParser();

async function navigate(url: string, direction: "forward" | "back") {
  const res = await fetch(url, {
    headers: {
      "x-fresh-client-nav": "true",
    },
  });
  // Abort transition and navigate directly to the target
  // when request failed
  if (!res.ok) {
    location.href = url;
    return;
  }
  const text = await res.text();

  const doc = parser.parseFromString(text, "text/html");

  console.log(direction, doc);
}

document.body.addEventListener("click", async (e) => {
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
