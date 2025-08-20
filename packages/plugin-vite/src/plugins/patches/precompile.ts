import type { PluginObj, types } from "@babel/core";
import {
  isIdentifierName,
  isReservedWord,
} from "@babel/helper-validator-identifier";
import jsxSyntax from "@babel/plugin-syntax-jsx";

const VOID_ELEMENTS = new Set([
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
]);

// See: https://html.spec.whatwg.org/multipage/indices.html#attributes-3
const BOOLEAN_ATTR = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
]);

export interface PrecompileOptions {
  // The import path to import the jsx runtime from. Will be
  // `<import_source>/jsx-runtime`.
  importSource?: string;
  // List of HTML elements which should not be serialized
  skipSerializeElements?: string[];
  // List of props/attributes that should not be serialized and
  // always be treated as dynamic instead.
  skipSerializeProperties?: string[];
}

interface ResolvedPrecompileOptions {
  importSource: string;
  skipSerializeElements: Set<string>;
  skipSerializeProperties: Set<string>;
}

interface PluginState {
  idx: number;
  options: ResolvedPrecompileOptions;
  jsxTemplateId: string;
  jsxEscapeId: string;
  jsxAttrId: string;
  jsxId: string;
  templateId: string;
  hasJsxTemplate: boolean;
  hasJsxEscape: boolean;
  hasJsxAttr: boolean;
  hasJsx: boolean;
  templates: types.VariableDeclaration[];
}

const INTERNAL = "internal_state";

export function precompileJsx(
  { types: t }: { types: typeof types },
): PluginObj {
  return {
    inherits: jsxSyntax.default,
    name: "fresh:precompile-jsx",
    pre() {
      // deno-lint-ignore no-explicit-any
      const opts = (this.opts) as any;

      const pluginState: PluginState = {
        idx: 1,
        hasJsx: false,
        hasJsxAttr: false,
        hasJsxEscape: false,
        hasJsxTemplate: false,
        jsxAttrId: "",
        jsxEscapeId: "",
        jsxId: "",
        jsxTemplateId: "",
        templateId: "",
        templates: [],
        options: {
          importSource: opts.importSource ?? "react",
          skipSerializeElements: new Set(opts.skipSerializeElements ?? []),
          skipSerializeProperties: new Set(opts.skipSerializeProperties ?? []),
        },
      };

      this.set(INTERNAL, pluginState);
    },
    visitor: {
      Program: {
        enter(path, state) {
          const internal = state.get(INTERNAL) as PluginState;
          internal.templateId = path.scope.generateUid("$$_tpl");
          internal.jsxAttrId = path.scope.generateUid("jsxAttr");
          internal.jsxEscapeId = path.scope.generateUid("jsxEscape");
          internal.jsxTemplateId = path.scope.generateUid("jsxTemplate");
          internal.jsxId = path.scope.generateUid("jsx");
        },
        exit(path, state) {
          const internal = state.get(
            INTERNAL,
          ) as PluginState;
          const { templates, options } = internal;
          const specifiers: types.ImportSpecifier[] = [];

          if (internal.hasJsx) {
            specifiers.push(
              t.importSpecifier(
                t.identifier(internal.jsxId),
                t.identifier("jsx"),
              ),
            );
          }

          if (templates.length > 0) {
            specifiers.push(
              t.importSpecifier(
                t.identifier(internal.jsxTemplateId),
                t.identifier("jsxTemplate"),
              ),
            );
          }

          if (internal.hasJsxAttr) {
            specifiers.push(
              t.importSpecifier(
                t.identifier(internal.jsxAttrId),
                t.identifier("jsxAttr"),
              ),
            );
          }

          if (internal.hasJsxEscape) {
            specifiers.push(
              t.importSpecifier(
                t.identifier(internal.jsxEscapeId),
                t.identifier("jsxEscape"),
              ),
            );
          }

          if (specifiers.length > 0) {
            const source = `${options.importSource}/jsx-runtime`;
            path.unshiftContainer(
              "body",
              t.importDeclaration(specifiers, t.stringLiteral(source)),
            );
          }

          if (templates.length > 0) {
            let found = false;
            const children = path.get("body");

            for (let i = 0; i < children.length; i++) {
              const child = children[i];
              if (
                t.isImportDeclaration(child.node) ||
                t.isEmptyStatement(child.node)
              ) {
                continue;
              }

              found = true;

              child.insertBefore(templates);

              break;
            }

            if (!found) {
              path.unshiftContainer("body", templates);
            }
          }
        },
      },
      JSXElement: {
        enter(path, state) {
          const ctx: SerializeCtx = {
            state: state.get(INTERNAL) as PluginState,
            t,
            template: [],
            args: [],
          };
          serializeJsx(ctx, path.node);

          const node = ctxToNode(ctx);
          if (node !== null) {
            path.replaceWith(node);
          }
        },
      },
      JSXFragment: {
        enter(path, state) {
          if (path.node.children.length === 0) {
            path.replaceWith(t.nullLiteral());
            return;
          }
        },
      },
    },
  };
}

interface SerializeCtx {
  t: typeof types;
  state: PluginState;
  template: types.StringLiteral[];
  args: types.Expression[];
}

function ctxToNode(ctx: SerializeCtx): types.Expression | null {
  const { t, args, template, state } = ctx;
  if (args.length === 1 && template.length === 1) {
    return args[0];
  }

  if (template.length > 0) {
    const tplId = `${state.templateId}_${state.idx++}`;

    state.templates.push(
      t.variableDeclaration(
        "const",
        [
          t.variableDeclarator(
            t.identifier(tplId),
            t.arrayExpression(ctx.template),
          ),
        ],
      ),
    );

    return t.callExpression(t.identifier(ctx.state.jsxTemplateId), [
      t.identifier(tplId),
      ...ctx.args,
    ]);
  }

  return null;
}

function serializeJsx(ctx: SerializeCtx, node: types.JSXElement) {
  const { t } = ctx;

  if (
    t.isJSXNamespacedName(node.openingElement.name) ||
    t.isJSXMemberExpression(node.openingElement.name)
  ) {
    const callExpr = jsxToRuntime(ctx, node);
    ctx.args.push(callExpr);
    ctx.template.push(t.stringLiteral(""));
    return;
  }

  if (t.isJSXIdentifier(node.openingElement.name)) {
    const name = node.openingElement.name.name;

    if (name.toLowerCase() !== name) {
      const callExpr = jsxToRuntime(ctx, node);
      ctx.args.push(callExpr);
      ctx.template.push(t.stringLiteral(""));
      return;
    }

    if (ctx.state.options.skipSerializeElements.has(name)) {
      const callExpr = jsxToRuntime(ctx, node);
      ctx.args.push(callExpr);
      ctx.template.push(t.stringLiteral(""));
      return;
    }

    const attrs = node.openingElement.attributes;

    // We can't serialize if we encounter a spreaded attribute
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      if (t.isJSXSpreadAttribute(attr)) {
        const callExpr = jsxToRuntime(ctx, node);
        ctx.args.push(callExpr);
        ctx.template.push(t.stringLiteral(""));

        return;
      }
    }

    appendString(ctx, `<${name}`);

    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];

      if (!t.isJSXAttribute(attr)) {
        throw new Error(`Unexpected node: ${attr.type}`);
      }

      const name = typeof attr.name.name === "string"
        ? attr.name.name
        : attr.name.name.name;

      if (ctx.state.options.skipSerializeProperties.has(name)) {
        let value:
          | types.ArgumentPlaceholder
          | types.SpreadElement
          | types.Expression;
        if (
          t.isStringLiteral(attr.value) || t.isJSXElement(attr.value) ||
          t.isJSXFragment(attr.value)
        ) {
          value = t.cloneNode(attr.value, true);
        } else if (attr.value === null) {
          value = t.nullLiteral();
        } else if (attr.value === undefined) {
          value = t.identifier("undefined");
        } else if (t.isJSXExpressionContainer(attr.value)) {
          if (t.isJSXEmptyExpression(attr.value.expression)) {
            value = t.identifier("undefined");
          } else {
            value = t.cloneNode(attr.value.expression, true);
          }
        } else {
          throw new Error(`Unknown JSX attribute value: ${attr.value}`);
        }

        ctx.state.hasJsxAttr = true;

        ctx.args.push(
          t.callExpression(t.identifier(ctx.state.jsxAttrId), [
            t.stringLiteral(name),
            value,
          ]),
        );
        ctx.template.push(t.stringLiteral(""));
        continue;
      }

      if (t.isStringLiteral(attr.value)) {
        const attrName = normalizeDomAttrName(name);
        appendString(ctx, ` ${attrName}="${attr.value.value}"`);
      }
    }

    appendString(ctx, `>`);
    if (VOID_ELEMENTS.has(name)) {
      return;
    }

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (t.isJSXElement(child)) {
        serializeJsx(ctx, child);
      } else if (t.isJSXExpressionContainer(child)) {
        if (t.isJSXEmptyExpression(child.expression)) {
          continue;
        } else if (t.isStringLiteral(child.expression)) {
          const escaped = escapeHtml(child.expression.value);
          appendString(ctx, escaped);
          continue;
        }

        ctx.state.hasJsxEscape = true;

        ctx.args.push(
          t.callExpression(t.identifier(ctx.state.jsxEscapeId), [
            t.cloneNode(child.expression, true),
          ]),
        );
        ctx.template.push(t.stringLiteral(""));

        continue;
      } else if (t.isJSXText(child)) {
        const escaped = escapeHtml(child.value);
        appendString(ctx, escaped);
      }
    }

    appendString(ctx, `</${name}>`);
  }
}

function jsxToRuntime(ctx: SerializeCtx, node: types.JSXElement) {
  const { t, state } = ctx;

  ctx.state.hasJsx = true;

  let isComponent = true;
  const openName = node.openingElement.name;
  let tag;
  if (t.isJSXIdentifier(openName)) {
    if (openName.name === openName.name.toLowerCase()) {
      isComponent = false;
      tag = t.stringLiteral(openName.name);
    } else {
      tag = t.identifier(openName.name);
    }
  } else if (t.isJSXMemberExpression(openName)) {
    tag = jsxMemberToMemberExpr(t, openName);
  } else if (t.isMemberExpression(openName)) {
    tag = t.cloneNode(openName, true);
  } else if (t.isJSXNamespacedName(openName)) {
    const { name, namespace } = openName;
    tag = t.stringLiteral(`${namespace.name}:${name.name}`);
  } else {
    throw new Error(`Unexpected node: ${openName}`);
  }

  const props: Array<types.ObjectProperty | types.SpreadElement> = [];

  for (let i = 0; i < node.openingElement.attributes.length; i++) {
    const attr = node.openingElement.attributes[i];

    if (t.isJSXSpreadAttribute(attr)) {
      props.push(t.spreadElement(t.cloneNode(attr.argument, true)));
    } else {
      let key;
      if (t.isJSXIdentifier(attr.name)) {
        const name = isComponent
          ? attr.name.name
          : normalizeDomAttrName(attr.name.name);

        if (isIdentifierName(name) || isReservedWord(name)) {
          key = t.identifier(name);
        } else {
          key = t.stringLiteral(name);
        }

        if (
          BOOLEAN_ATTR.has(name) &&
          (attr.value === null || attr.value === undefined)
        ) {
          props.push(t.objectProperty(key, t.booleanLiteral(true)));
          continue;
        }
      } else if (t.isJSXNamespacedName(attr.name)) {
        key = t.stringLiteral(
          `${attr.name.name.name}:${attr.name.namespace.name}`,
        );
      } else {
        throw new Error(`Unexpected node: ${attr.name}`);
      }

      let value;
      if (t.isJSXExpressionContainer(attr.value)) {
        if (t.isJSXEmptyExpression(attr.value.expression)) {
          value = t.identifier("undefined");
        } else {
          value = attr.value.expression;
        }
      } else {
        value = attr.value ?? t.identifier("undefined");
      }

      props.push(t.objectProperty(key, value));
    }
  }

  const children: types.Expression[] = [];
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    if (t.isJSXText(child)) {
      const last = children.at(-1);
      if (last !== undefined && t.isStringLiteral(last)) {
        last.value += " " + child.value;
      } else {
        children.push(t.stringLiteral(child.value));
      }
    } else if (t.isJSXElement(child)) {
      const newCtx: SerializeCtx = {
        state: ctx.state,
        t: ctx.t,
        template: [],
        args: [],
      };

      serializeJsx(newCtx, child);

      const innerNode = ctxToNode(newCtx);
      if (innerNode !== null) {
        children.push(innerNode);
      }
    } else if (t.isJSXExpressionContainer(child)) {
      if (t.isJSXEmptyExpression(child.expression)) {
        continue;
      }

      children.push(t.cloneNode(child.expression, true));
    }
  }

  if (children.length > 0) {
    props.push(
      t.objectProperty(
        t.identifier("children"),
        children.length === 1 ? children[0] : t.arrayExpression(children),
      ),
    );
  }

  return t.callExpression(t.identifier(state.jsxId), [
    tag,
    props.length === 0 ? t.nullLiteral() : t.objectExpression(props),
  ]);
}

function jsxMemberToMemberExpr(
  t: typeof types,
  node: types.JSXMemberExpression,
): types.MemberExpression {
  const left = t.isJSXIdentifier(node.object)
    ? t.identifier(node.object.name)
    : jsxMemberToMemberExpr(t, node.object);
  const right = t.identifier(node.property.name);

  return t.memberExpression(left, right);
}

function appendString(
  ctx: SerializeCtx,
  str: string,
): void {
  const { t, template } = ctx;

  let last = template.at(-1);
  if (last === undefined) {
    last = t.stringLiteral("");
    template.push(last);
  }

  last.value += str;
}

/// Normalize HTML attribute name casing. Depending on which part of
/// the HTML or SVG spec you look at the casings differ. Some attributes
/// are camelCased, other's kebab cased and some lowercased. When
/// developers write JSX they commonly use camelCase only, regardless
/// of the actual attribute name. The spec doesn't care about case
/// sensitivity, but we need to account for the kebab case ones and
/// developers expect attributes in an HTML document to be lowercase.
/// Custom Elements complicate this further as we cannot make any
/// assumptions if the camelCased JSX attribute should be transformed
/// to kebab-case or not. To make matters even more complex, event
/// handlers passed to JSX usually start with `on*` like `onClick`,
/// but this makes them very hard to differentiate from custom element
/// properties when they pick something like `online=""` for example.
function normalizeDomAttrName(name: string): string {
  switch (name) {
    // React specific
    case "htmlFor":
      return "for";
    case "className":
      return "class";
    case "dangerouslySetInnerHTML":
      return name;

    case "panose1":
      return "panose-1";
    case "xlinkActuate":
      return "xlink:actuate";
    case "xlinkArcrole":
      return "xlink:arcrole";

    // xlink:href was removed from SVG and isn't needed
    case "xlinkHref":
      return "href";
    case "xlink:href":
      return "href";

    case "xlinkRole":
      return "xlink:role";
    case "xlinkShow":
      return "xlink:show";
    case "xlinkTitle":
      return "xlink:title";
    case "xlinkType":
      return "xlink:type";
    case "xmlBase":
      return "xml:base";
    case "xmlLang":
      return "xml:lang";
    case "xmlSpace":
      return "xml:space";

    // Attributes that are kebab-cased
    case "accentHeight":
    case "acceptCharset":
    case "alignmentBaseline":
    case "arabicForm":
    case "baselineShift":
    case "capHeight":
    case "clipPath":
    case "clipRule":
    case "colorInterpolation":
    case "colorInterpolationFilters":
    case "colorProfile":
    case "colorRendering":
    case "contentScriptType":
    case "contentStyleType":
    case "dominantBaseline":
    case "enableBackground":
    case "fillOpacity":
    case "fillRule":
    case "floodColor":
    case "floodOpacity":
    case "fontFamily":
    case "fontSize":
    case "fontSizeAdjust":
    case "fontStretch":
    case "fontStyle":
    case "fontVariant":
    case "fontWeight":
    case "glyphName":
    case "glyphOrientationHorizontal":
    case "glyphOrientationVertical":
    case "horizAdvX":
    case "horizOriginX":
    case "horizOriginY":
    case "httpEquiv":
    case "imageRendering":
    case "letterSpacing":
    case "lightingColor":
    case "markerEnd":
    case "markerMid":
    case "markerStart":
    case "overlinePosition":
    case "overlineThickness":
    case "paintOrder":
    case "pointerEvents":
    case "renderingIntent":
    case "shapeRendering":
    case "stopColor":
    case "stopOpacity":
    case "strikethroughPosition":
    case "strikethroughThickness":
    case "strokeDasharray":
    case "strokeDashoffset":
    case "strokeLinecap":
    case "strokeLinejoin":
    case "strokeMiterlimit":
    case "strokeOpacity":
    case "strokeWidth":
    case "textAnchor":
    case "textDecoration":
    case "textRendering":
    case "transformOrigin":
    case "underlinePosition":
    case "underlineThickness":
    case "unicodeBidi":
    case "unicodeRange":
    case "unitsPerEm":
    case "vAlphabetic":
    case "vectorEffect":
    case "vertAdvY":
    case "vertOriginX":
    case "vertOriginY":
    case "vHanging":
    case "vMathematical":
    case "wordSpacing":
    case "writingMode":
    case "xHeight":
      return name.replace(
        /[A-Z]+(?![a-z])|[A-Z]/g,
        (m, lower) => {
          return `${lower ? "-" : ""}${m.toLowerCase()}`;
        },
      );

    // Attributes that are camelCased and should be kept as is.
    case "allowReorder":
    case "attributeName":
    case "attributeType":
    case "baseFrequency":
    case "baseProfile":
    case "calcMode":
    case "clipPathUnits":
    case "diffuseConstant":
    case "edgeMode":
    case "filterUnits":
    case "glyphRef":
    case "gradientTransform":
    case "gradientUnits":
    case "kernelMatrix":
    case "kernelUnitLength":
    case "keyPoints":
    case "keySplines":
    case "keyTimes":
    case "lengthAdjust":
    case "limitingConeAngle":
    case "markerHeight":
    case "markerUnits":
    case "markerWidth":
    case "maskContentUnits":
    case "maskUnits":
    case "numOctaves":
    case "pathLength":
    case "patternContentUnits":
    case "patternTransform":
    case "patternUnits":
    case "pointsAtX":
    case "pointsAtY":
    case "pointsAtZ":
    case "preserveAlpha":
    case "preserveAspectRatio":
    case "primitiveUnits":
    case "referrerPolicy":
    case "refX":
    case "refY":
    case "repeatCount":
    case "repeatDur":
    case "requiredExtensions":
    case "requiredFeatures":
    case "specularConstant":
    case "specularExponent":
    case "spreadMethod":
    case "startOffset":
    case "stdDeviation":
    case "stitchTiles":
    case "surfaceScale":
    case "systemLanguage":
    case "tableValues":
    case "targetX":
    case "targetY":
    case "textLength":
    case "viewBox":
    case "xChannelSelector":
    case "yChannelSelector":
    case "zoomAndPan":
      return name;

    default:
      // Devs expect attributes in the HTML document to be lowercased.
      return name.toLowerCase();
  }
}

function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#39;")
    .replaceAll('"', "&quot;");
}
