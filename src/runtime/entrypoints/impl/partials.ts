import "../../polyfills.ts";
import {
  Component,
  ComponentChildren,
  Fragment,
  h,
  isValidElement, VNode
} from "preact";
import { INTERNAL_PREFIX } from "../../utils.ts";
import { type SerializedState } from "../../../server/rendering/fresh_tags.tsx";
import type { Signal } from "@preact/signals";
import {
  PARTIAL_SEARCH_PARAM,
  PartialMode
} from "../../../constants.ts";
import {
  RenderRequest,
  IslandRegistry,
  _walkInner,
  isCommentNode,
  isElementNode,
} from "./common.ts";

const partialErrorMessage = `Unable to process partial response.`;

export class PartialComp extends Component<
  { children?: ComponentChildren; mode: number; name: string }
> {
  componentDidMount() {
    partials.set(this.props.name, this);
  }

  render() {
    return this.props.children;
  }
}

const partials = new Map<string, PartialComp>();

export async function fetchPartials(url: URL, init: RequestInit = {}) {
  init.redirect = "follow";
  url.searchParams.set(PARTIAL_SEARCH_PARAM, "true");
  const res = await fetch(url, init);
  await applyPartials(res);
}

function collectPartials(
  encounteredPartials: RenderRequest[],
  islands: IslandRegistry,
  state: SerializedState,
  node: Node,
) {
  let startNode = null;
  let sib: ChildNode | null = node.firstChild;
  let partialCount = 0;
  while (sib !== null) {
    if (isCommentNode(sib)) {
      const comment = sib.data;
      if (comment.startsWith("frsh-partial")) {
        startNode = sib;
        partialCount++;
      } else if (comment.startsWith("/frsh-partial")) {
        partialCount--;
        // Create a fake DOM node that spans the partial we discovered.
        // We need to include the partial markers itself for _walkInner
        // to register them.
        const rootFrag = {
          _frshRootFrag: true,
          nodeType: 1,
          nextSibling: null,
          firstChild: startNode,
          parentNode: node,
          get childNodes() {
            const children: ChildNode[] = [startNode!];
            let node = startNode!;
            while ((node = node.nextSibling) !== null) {
              children.push(node);
            }

            return children;
          },
          // deno-lint-ignore no-explicit-any
        } as any as HTMLElement;

        _walkInner(
          islands,
          state[0] ?? [],
          [],
          [h(Fragment, null) as VNode],
          rootFrag,
          encounteredPartials,
        );
      }
    } else if (partialCount === 0 && isElementNode(sib)) {
      // Do not recurse if we know that we are inisde a partial
      collectPartials(encounteredPartials, islands, state, sib);
    }

    sib = sib.nextSibling;
  }
}

/**
 * Apply partials from a HTML response
 */
export async function applyPartials(res: Response): Promise<void> {
  const contentType = res.headers.get("Content-Type");
  if (contentType !== "text/html; charset=utf-8") {
    throw new Error(partialErrorMessage);
  }

  const resText = await res.text();
  const doc = new DOMParser().parseFromString(resText, "text/html") as Document;

  const promises: Promise<void>[] = [];

  // Preload all islands because they need to be available synchronously
  // for rendering later
  const islands: IslandRegistry = {};
  const dataRaw = doc.getElementById("__FRSH_PARTIAL_DATA")!;
  let data: {
    islands: Record<string, { export: string; url: string }>;
    signals: string | null;
    deserializer: string | null;
  } | null = null;
  if (dataRaw !== null) {
    data = JSON.parse(dataRaw.textContent!);

    promises.push(
      ...Array.from(Object.entries(data!.islands)).map(async (entry) => {
        const mod = await import(`${entry[1].url}`);
        islands[entry[0]] = mod[entry[1].export];
      }),
    );
  }

  const stateDom = doc.getElementById("__FRSH_STATE")?.textContent;
  let state: SerializedState = [[], []];

  // Load all dependencies
  let signal: (<T>(value: T) => Signal<T>) | undefined;
  if (data !== null && data.signals !== null) {
    promises.push(
      import(data.signals).then((m) => {
        signal = m.signal;
      }),
    );
  }

  let deserialize:
    | ((str: string, signal?: <T>(value: T) => Signal<T>) => unknown)
    | undefined;
  if (stateDom && data && data.deserializer !== null) {
    promises.push(
      import(data.deserializer).then((mod) => deserialize = mod.deserialize),
    );
  }

  await Promise.all(promises);

  if (stateDom) {
    state = deserialize
      ? deserialize(stateDom, signal) as SerializedState
      : JSON.parse(stateDom)?.v;
  }

  // Collect all partials and build up the vnode tree
  const encounteredPartials: RenderRequest[] = [];
  collectPartials(encounteredPartials, islands, state, doc.body);

  if (encounteredPartials.length === 0) {
    throw new NoPartialsError(
      `Found no partials in HTML response. Please make sure to render at least one partial. Requested url: ${res.url}`,
    );
  }

  // Update <head>
  document.title = doc.title;

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
      if (script.src === `${INTERNAL_PREFIX}/refresh.js`) return;
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

  // Update all encountered partials
  for (let i = 0; i < encounteredPartials.length; i++) {
    const { vnode, marker } = encounteredPartials[i];
    const instance = partials.get(marker.text);

    if (!instance) {
      console.warn(`Partial "${marker.text}" not found. Skipping...`);
    } else {
      // deno-lint-ignore no-explicit-any
      const mode = (vnode.props as any).mode;
      let children = vnode.props.children;

      // Modify children depending on the replace mode
      if (mode === PartialMode.REPLACE) {
        instance.props.children = children;
      } else {
        const oldChildren = instance.props.children;
        const newChildren = Array.isArray(oldChildren)
          ? oldChildren
          : [oldChildren];

        if (mode === PartialMode.APPEND) {
          newChildren.push(children);
        } else {
          // Workaround for missing keys
          if (!isValidElement(children)) {
            children = h(Fragment, null, children);
          }

          if ((children as VNode).key == null) {
            (children as VNode).key = newChildren.length;
          }

          // Update rendered children keys if necessary
          // deno-lint-ignore no-explicit-any
          const renderedChildren = (instance as any).__v.__k as VNode[] | null;
          if (Array.isArray(renderedChildren)) {
            for (let i = 0; i < renderedChildren.length; i++) {
              const child = renderedChildren[i];
              if (child.key == null) {
                child.key = i;
              } else {
                // Assume list is keyed. We don't support mixed
                // keyed an unkeyed
                break;
              }
            }
          }

          for (let i = 0; i < newChildren.length; i++) {
            const child = newChildren[i];
            if (child.key == null) {
              child.key = i;
            } else {
              // Assume list is keyed. We don't support mixed
              // keyed an unkeyed
              break;
            }
          }

          newChildren.unshift(children);
        }

        instance.props.children = newChildren;
      }

      instance.setState({});
    }
  }
}

export class NoPartialsError extends Error {}
