import { RenderState } from "./state.ts";
import { setRenderState } from "./preact_hooks.ts";
import { renderToString } from "preact-render-to-string";
import {
  ComponentType,
  Fragment,
  h,
  isValidElement,
  toChildArray,
  VNode,
} from "preact";
import { HEAD_CONTEXT } from "../../runtime/head.ts";
import { CSP_CONTEXT } from "../../runtime/csp.ts";

export function renderHtml(state: RenderState) {
  setRenderState(state);
  state.renderingUserTemplate = true;
  state.headChildren = false;

  const componentStack = state.componentStack;
  try {
    const routeComponent = componentStack[componentStack.length - 1];
    let finalComp = h(routeComponent, state.routeOptions) as VNode;

    // Skip page component
    let i = componentStack.length - 1;
    while (i--) {
      const component = componentStack[i] as ComponentType;
      const curComp = finalComp;

      finalComp = h(component, {
        ...state.routeOptions,
        Component() {
          return curComp;
        },
        // deno-lint-ignore no-explicit-any
      } as any) as VNode;
    }

    const app = h(
      CSP_CONTEXT.Provider,
      // deno-lint-ignore no-explicit-any
      { value: state.csp } as any,
      h(HEAD_CONTEXT.Provider, {
        value: state.headVNodes,
        children: finalComp,
      }),
    ) as VNode;

    let html = renderToString(app);

    for (const [id, children] of state.slots.entries()) {
      const slotHtml = renderToString(h(Fragment, null, children) as VNode);
      const templateId = id.replace(/:/g, "-");
      html += `<template id="${templateId}">${slotHtml}</template>`;
    }

    return html;
  } finally {
    setRenderState(null);
  }
}

export function renderOuterDocument(
  state: RenderState,
  opts: {
    bodyHtml: string;
    lang?: string;
    preloads: string[];
    moduleScripts: [src: string, nonce: string][];
  },
) {
  const {
    docHtml,
    docHead,
    renderedHtmlTag,
    docBody,
    docHeadNodes,
    headVNodes,
  } = state;
  let docTitle = state.docTitle;

  // Filter out duplicate head vnodes by "key" if set
  const filteredHeadNodes: VNode[] = [];

  if (headVNodes.length > 0) {
    const seen = new Map<string, VNode>();
    const userChildren = toChildArray(headVNodes);
    for (let i = 0; i < userChildren.length; i++) {
      const child = userChildren[i];

      if (isValidElement(child)) {
        if (child.type === "title") {
          docTitle = child;
        } else if (child.key !== undefined) {
          seen.set(child.key, child);
        } else {
          filteredHeadNodes.push(child);
        }
      }
    }

    if (seen.size > 0) {
      filteredHeadNodes.push(...seen.values());
    }
  }

  const page = h(
    "html",
    docHtml ?? { lang: opts.lang },
    h(
      "head",
      docHead,
      !renderedHtmlTag ? h("meta", { charset: "utf-8" }) : null,
      !renderedHtmlTag
        ? (h("meta", {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0",
        }))
        : null,
      docTitle,
      docHeadNodes.map((node) => h(node.type, node.props)),
      opts.preloads.map((src) =>
        h("link", { rel: "modulepreload", href: src })
      ),
      opts.moduleScripts.map(([src, nonce]) =>
        h("script", { src: src, nonce, type: "module" })
      ),
      filteredHeadNodes,
    ),
    h("body", {
      ...docBody,
      dangerouslySetInnerHTML: { __html: opts.bodyHtml },
    }),
  ) as VNode;

  try {
    setRenderState(state);
    return "<!DOCTYPE html>" + renderToString(page);
  } finally {
    setRenderState(null);
  }
}
