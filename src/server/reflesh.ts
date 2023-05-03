export function refleshJs(aliveUrl: string, buildId: string) {
  return minifyScript(`
  new EventSource("${aliveUrl}").addEventListener(
    "message",
    function listener(e) {
      if (e.data !== "${buildId}") {
        this.removeEventListener("message", listener);
        location.reload();
      }
    }
  );
`);
}

function minifyScript(src: string) {
  return src
    .replace(/^[ \t]+/gm, "")
    .replace(/\n/g, " ")
    .replace(/^ +/g, "")
    .replace(/ +$/g, "");
}
