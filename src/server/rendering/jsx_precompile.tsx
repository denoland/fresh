import { Fragment, h, options, VNode } from "preact";
import { RenderState } from "./state.ts";

const VOID_ELEMENTS = new Set<string>(
  [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ],
);

const enum Char {
  SPACE = 32,
  '"' = 34,
  "-" = 45,
  "/" = 47,
  n0 = 48,
  n9 = 57,
  "<" = 60,
  "=" = 61,
  ">" = 62,
  a = 97,
  z = 122,
}

export enum Token {
  ELEM_OPEN_START,
  ELEM_OPEN_END,
  ELEM_CLOSE,
  TEXT,
  ATTR_NAME,
  ATTR_VALUE,
  PLACEHOLDER,
}

export function parseJsxTemplateToBuf(tpl: string[]): number[] {
  const buf: number[] = [];

  let token = Token.TEXT;
  let tagStart = -1;
  let tagEnd = -1;
  let attrNameStart = -1;
  let attrNameEnd = -1;
  let attrValueStart = -1;
  let attrValueEnd = -1;
  let textStart = -1;
  let isVoidElem = false;
  for (let i = 0; i < tpl.length; i++) {
    const str = tpl[i];

    if (str !== "" && str !== " ") {
      for (let j = 0; j < str.length; j++) {
        const ch = str.charCodeAt(j);
        if (token === Token.TEXT && ch === Char["<"]) {
          if (textStart > -1 && textStart < j) {
            buf.push(Token.TEXT);
            buf.push(textStart);
            buf.push(j);
            textStart = -1;
          }

          if (j + 1 < str.length) {
            const nextCh = str.charCodeAt(j + 1);
            if (nextCh === Char["/"]) {
              j++;
              token = Token.ELEM_CLOSE;
              buf.push(Token.ELEM_CLOSE);
              buf.push(0);
              buf.push(0);
              continue;
            }
          }

          tagStart = j + 1;
          token = Token.ELEM_OPEN_START;
        } else if (token === Token.ELEM_OPEN_START) {
          if (ch === Char.SPACE) {
            tagEnd = j;
            token = Token.ATTR_NAME;
            buf.push(Token.ELEM_OPEN_START);
            buf.push(tagStart);
            buf.push(tagEnd);
            isVoidElem = VOID_ELEMENTS.has(str.slice(tagStart, tagEnd));
          } else if (ch === Char[">"]) {
            tagEnd = j;
            token = Token.TEXT;
            textStart = j + 1;

            buf.push(Token.ELEM_OPEN_START);
            buf.push(tagStart);
            buf.push(tagEnd);

            isVoidElem = VOID_ELEMENTS.has(str.slice(tagStart, tagEnd));

            buf.push(Token.ELEM_OPEN_END);
            buf.push(0);
            buf.push(0);

            const name = str.slice(tagStart, tagEnd);
            if (isVoidElem) {
              buf.push(Token.ELEM_CLOSE);
              buf.push(0);
              buf.push(0);
            }

            isVoidElem = false;
          }
        } else if (token === Token.ELEM_CLOSE) {
          if (ch === Char[">"]) {
            token = Token.TEXT;
            textStart = j + 1;
          }
        } else if (token === Token.ATTR_NAME) {
          if (ch === Char[">"]) {
            if (attrValueStart === -1 && attrNameStart !== -1) {
              buf.push(Token.ATTR_NAME);
              buf.push(attrNameStart);
              buf.push(j);
            }

            buf.push(Token.ELEM_OPEN_END);
            buf.push(0);
            buf.push(0);

            if (isVoidElem) {
              buf.push(Token.ELEM_CLOSE);
              buf.push(0);
              buf.push(0);
              isVoidElem = false;
            }

            attrNameStart = -1;
            attrNameEnd = -1;
            tagStart = -1;
            tagEnd = -1;
            textStart = j + 1;
            token = Token.TEXT;
          } else if (attrNameStart === -1) {
            if (ch !== Char.SPACE) {
              attrNameStart = j;
            }
            continue;
          } else if (ch === Char.SPACE) {
            buf.push(Token.ATTR_NAME);
            buf.push(attrNameStart);
            buf.push(j);

            attrNameStart = -1;
            attrNameEnd = -1;
            attrValueStart = -1;
            attrValueEnd = -1;
            textStart = -1;
          } else if (ch === Char["="]) {
            attrNameEnd = j;

            buf.push(Token.ATTR_NAME);
            buf.push(attrNameStart);
            buf.push(attrNameEnd);

            token = Token.ATTR_VALUE;
            attrValueStart = j + 2;
          }
        } else if (token === Token.ATTR_VALUE) {
          if (j <= attrValueStart) {
            continue;
          }

          if (ch === Char['"']) {
            attrValueEnd = j;

            buf.push(Token.ATTR_VALUE);
            buf.push(attrValueStart);
            buf.push(attrValueEnd);

            token = Token.ATTR_NAME;
            attrNameStart = -1;
            attrNameEnd = -1;
            attrValueStart = -1;
            attrValueEnd = -1;
            textStart = -1;
          }
        }
      }

      if (token === Token.TEXT && textStart > -1 && textStart < str.length) {
        buf.push(Token.TEXT);
        buf.push(textStart);
        buf.push(str.length);
        textStart = -1;
      }
    }

    if (i < tpl.length - 1) {
      buf.push(Token.PLACEHOLDER);
      buf.push(0);
      buf.push(0);
    }
  }

  return buf;
}

// deno-lint-ignore no-explicit-any
function addChild(vnode: VNode<any>, child: any) {
  if (
    vnode.props.children === null || vnode.props.children === undefined
  ) {
    vnode.props.children = child;
  } else if (!Array.isArray(vnode.props.children)) {
    vnode.props.children = [vnode.props.children, child];
  } else {
    vnode.props.children.push(child);
  }
}

export function jsxTemplateBufToVNode(
  buf: number[],
  tpl: string[],
  // deno-lint-ignore no-explicit-any
  exprs: any[],
  // deno-lint-ignore no-explicit-any
): VNode<any> {
  const root = h(Fragment, null);
  // deno-lint-ignore no-explicit-any
  const stack: VNode<any>[] = [root];
  let tplIdx = 0;
  let inAttribute = false;
  for (let i = 0; i < buf.length; i += 3) {
    const token = buf[i];

    const last = stack[stack.length - 1];
    switch (token) {
      case Token.ELEM_OPEN_START:
        {
          const name = tpl[tplIdx].slice(buf[i + 1], buf[i + 2]);
          const vnode = h(name, null);

          addChild(last, vnode);
          stack.push(vnode);
          inAttribute = true;
        }
        break;
      case Token.ELEM_OPEN_END:
        inAttribute = false;
        break;
      case Token.ELEM_CLOSE:
        stack.pop();
        break;
      case Token.ATTR_NAME: {
        const name = tpl[tplIdx].slice(buf[i + 1], buf[i + 2]);
        // deno-lint-ignore no-explicit-any
        let value: any;
        if (buf[i + 3] === Token.ATTR_VALUE) {
          value = tpl[tplIdx].slice(buf[i + 4], buf[i + 5]);
        } else {
          value = true;
        }

        last.props[name] = value;
        break;
      }
      case Token.TEXT:
        {
          const text = tpl[tplIdx].slice(buf[i + 1], buf[i + 2]);
          addChild(last, text);
        }
        break;
      case Token.PLACEHOLDER:
        {
          const expr = exprs[tplIdx];
          if (inAttribute) {
            if (typeof expr === "string" && expr !== "") {
              const idx = expr.indexOf("=");
              if (idx > -1) {
                const name = expr.slice(0, idx);
                const value = expr.slice(idx + 2, -1);
                last.props[name] = value;
              } else {
                last.props[expr] = true;
              }
            }
          } else if (expr !== null) {
            addChild(last, expr);
          }
          tplIdx++;
        }
        break;
    }
  }

  return root;
}

const enum PatchKind {
  Attr,
  VNode,
}

interface AttrPatch {
  kind: PatchKind.Attr;
  tpl: string[];
  attrPatchIdxs: number[];
}

interface VNodePatch {
  kind: PatchKind.VNode;
  buf: number[];
}

const ATTR_REG = /[^\w](href|srcset|src|f-client-nav)(="(\/.+?)"|[^=])/g;
const CONVERT_REG = /<(title|html|head|meta|link|body)[\s>]/g;
const tplPatches = new Map<string[], AttrPatch | VNodePatch | null>();

// deno-lint-ignore no-explicit-any
export function patchJsxTemplate(state: RenderState, vnode: VNode<any>) {
  const tpl = vnode.props.tpl as string[];
  // deno-lint-ignore no-explicit-any
  const exprs = vnode.props.exprs as any[];

  let patch = tplPatches.get(tpl);
  // Nothing to patch, bail out
  if (patch === null) return tpl;

  // First time we're seeing this
  if (patch === undefined) {
    console.time("patch");
    let convertToVNodes = false;
    for (let i = 0; i < tpl.length; i++) {
      if (CONVERT_REG.test(tpl[i])) {
        convertToVNodes = true;
        break;
      }
    }

    if (convertToVNodes) {
      const buf = parseJsxTemplateToBuf(tpl);
      patch = {
        kind: PatchKind.VNode,
        buf,
      };
    } else {
      for (let i = 0; i < tpl.length; i++) {
        const str = tpl[i];
        if (str === "" || str === " ") continue;

        ATTR_REG.lastIndex = 0;
        if (ATTR_REG.test(str)) {
          patch = tplPatches.get(tpl);
          if (patch === undefined || patch === null) {
            patch = {
              kind: PatchKind.Attr,
              attrPatchIdxs: [],
              tpl: tpl.slice(),
            };
          }
          (patch as AttrPatch).attrPatchIdxs.push(i);
        }
      }
    }

    patch = patch ?? null;
    tplPatches.set(tpl, patch);
    console.timeEnd("patch");
    if (patch === null) return tpl;
  }

  if (patch.kind === PatchKind.Attr) {
    for (let i = 0; i < patch.attrPatchIdxs.length; i++) {
      const idx = patch.attrPatchIdxs[i];
      const str = tpl[idx];
      patch.tpl[idx] = str.replaceAll(ATTR_REG, (raw, name, _, value) => {
        let suffix = "";
        if (value === undefined) {
          value = true;
          suffix = raw[raw.length - 1];
        }
        // deno-lint-ignore no-explicit-any
        const res = (options as any).attr?.(name, value);
        return typeof res === "string" ? raw[0] + res + suffix : raw;
      });
    }

    vnode.props.tpl = patch.tpl;
  } else {
    const newVNode = jsxTemplateBufToVNode(patch.buf, tpl, exprs);
    delete vnode.props.tpl;
    delete vnode.props.exprs;
    vnode.props.children = newVNode.props.children;
  }
}
