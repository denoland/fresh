import { bundleAssetUrl } from "../constants.ts";
import { RenderState } from "./state.ts";
import { htmlEscapeJsonString } from "../htmlescape.ts";
import { serialize } from "../serializer.ts";
import { Plugin, PluginRenderResult, PluginRenderStyleTag } from "../types.ts";
import { ContentSecurityPolicy, nonce } from "../../runtime/csp.ts";
import { h } from "preact";

function getRandomNonce(
  opts: { randomNonce?: string; csp?: ContentSecurityPolicy },
): string {
  if (opts.randomNonce === undefined) {
    opts.randomNonce = crypto.randomUUID().replace(/-/g, "");
    if (opts.csp) {
      opts.csp.directives.scriptSrc = [
        ...opts.csp.directives.scriptSrc ?? [],
        nonce(opts.randomNonce),
      ];
    }
  }
  return opts.randomNonce;
}

export function renderFreshTags(
  renderState: RenderState,
  opts: {
    bodyHtml: string;
    csp?: ContentSecurityPolicy;
    imports: string[];
    randomNonce?: string;
    dependenciesFn: (path: string) => string[];
    styles: string[];
    pluginRenderResults: [Plugin, PluginRenderResult][];
  },
) {
  const moduleScripts: [string, string][] = [];
  for (const url of opts.imports) {
    moduleScripts.push([url, getRandomNonce(opts)]);
  }

  const preloadSet = new Set<string>();
  function addImport(path: string): string {
    const url = bundleAssetUrl(`/${path}`);
    preloadSet.add(url);
    for (const depPath of opts.dependenciesFn(path)) {
      const url = bundleAssetUrl(`/${depPath}`);
      preloadSet.add(url);
    }
    return url;
  }

  const state: [islands: unknown[], plugins: unknown[]] = [
    renderState.islandProps,
    [],
  ];
  const styleTags: PluginRenderStyleTag[] = [];
  const pluginScripts: [string, string, number][] = [];

  for (const [plugin, res] of opts.pluginRenderResults) {
    for (const hydrate of res.scripts ?? []) {
      const i = state[1].push(hydrate.state) - 1;
      pluginScripts.push([plugin.name, hydrate.entrypoint, i]);
    }
    styleTags.splice(styleTags.length, 0, ...res.styles ?? []);
  }

  // The inline script that will hydrate the page.
  let script = "";

  // Serialize the state into the <script id=__FRSH_STATE> tag and generate the
  // inline script to deserialize it. This script starts by deserializing the
  // state in the tag. This potentially requires importing @preact/signals.
  if (state[0].length > 0 || state[1].length > 0) {
    const res = serialize(state);
    const escapedState = htmlEscapeJsonString(res.serialized);
    opts.bodyHtml +=
      `<script id="__FRSH_STATE" type="application/json">${escapedState}</script>`;

    if (res.requiresDeserializer) {
      const url = addImport("deserializer.js");
      script += `import { deserialize } from "${url}";`;
    }
    if (res.hasSignals) {
      const url = addImport("signals.js");
      script += `import { signal } from "${url}";`;
    }
    script += `const ST = document.getElementById("__FRSH_STATE").textContent;`;
    script += `const STATE = `;
    if (res.requiresDeserializer) {
      if (res.hasSignals) {
        script += `deserialize(ST, signal);`;
      } else {
        script += `deserialize(ST);`;
      }
    } else {
      script += `JSON.parse(ST).v;`;
    }
  }

  // Then it imports all plugin scripts and executes them (with their respective
  // state).
  for (const [pluginName, entrypoint, i] of pluginScripts) {
    const url = addImport(`plugin-${pluginName}-${entrypoint}.js`);
    script += `import p${i} from "${url}";p${i}(STATE[1][${i}]);`;
  }

  // Finally, it loads all island scripts and hydrates the islands using the
  // reviver from the "main" script.
  if (renderState.encounteredIslands.size > 0) {
    // Load the main.js script
    const url = addImport("main.js");
    script += `import { revive } from "${url}";`;

    // Prepare the inline script that loads and revives the islands
    let islandRegistry = "";
    for (const island of renderState.encounteredIslands) {
      const url = addImport(`island-${island.id}.js`);
      script +=
        `import * as ${island.name}_${island.exportName} from "${url}";`;
      islandRegistry += `${island.id}:${island.name}_${island.exportName},`;
    }
    script += `revive({${islandRegistry}}, STATE[0]);`;
  }

  // Append the inline script.
  if (script !== "") {
    opts.bodyHtml += `<script type="module" nonce="${
      getRandomNonce(opts)
    }">${script}</script>`;
  }

  if (opts.styles.length > 0) {
    const node = h("style", {
      id: "__FRSH_STYLE",
      dangerouslySetInnerHTML: { __html: opts.styles.join("\n") },
    });

    renderState.headVNodes.splice(0, 0, node);
  }

  for (const style of styleTags) {
    const node = h("style", {
      id: style.id,
      media: style.media,
      dangerouslySetInnerHTML: { __html: style.cssText },
    });
    renderState.headVNodes.splice(0, 0, node);
  }

  return { bodyHtml: opts.bodyHtml, preloadSet, moduleScripts };
}
