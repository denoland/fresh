import type { PluginObj, PluginPass, types } from "@babel/core";
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

const JSX_TEMPLATES = "jsxTemplates";
const JSX_TEMPLATE_ID = "jsxTemplateId";
const JSX_TEMPLATE_NAME = "jsxTemplateName";
const JSX_ESCAPE_NAME = "jsxEscapeName";
const JSX_ATTR_NAME = "jsxAttrName";
const JSX_HAS_ATTR = "jsxHasAttr";

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

export function precompileJsx(
  { types: t }: { types: typeof types },
): PluginObj {
  let tplIdx = 1;

  const options: ResolvedPrecompileOptions = {
    importSource: "react",
    skipSerializeElements: new Set(),
    skipSerializeProperties: new Set(),
  };

  return {
    inherits: jsxSyntax.default,
    name: "fresh:precompile-jsx",
    pre() {
      const opts = (this.opts) as any;
      if (opts.skipSerializeProperties) {
        options.skipSerializeProperties = new Set(opts.skipSerializeProperties);
      }
      if (opts.skipSerializeElements) {
        options.skipSerializeElements = new Set(opts.skipSerializeElements);
      }
      if (opts.importSource) {
        options.importSource = opts.importSource;
      }
    },
    visitor: {
      Program: {
        enter(path, state) {
          const tpl = path.scope.generateUid("jsxTemplate");
          const escape = path.scope.generateUid("jsxEscape");
          const attr = path.scope.generateUid("jsxAttr");
          const tplId = path.scope.generateUid("$$_tpl");

          state.set(JSX_TEMPLATE_NAME, tpl);
          state.set(JSX_ESCAPE_NAME, escape);
          state.set(JSX_ATTR_NAME, attr);
          state.set(JSX_TEMPLATE_ID, tplId);
          state.set(JSX_TEMPLATES, []);
        },
        exit(path, state) {
          const templates = state.get(JSX_TEMPLATES);

          const specifiers: types.ImportSpecifier[] = [];

          if (templates.length > 0) {
            const id = state.get(JSX_TEMPLATE_NAME);
            specifiers.push(
              t.importSpecifier(t.identifier(id), t.identifier("jsxTemplate")),
            );

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

          if (state.get(JSX_HAS_ATTR)) {
            const id = state.get(JSX_ATTR_NAME);
            specifiers.push(
              t.importSpecifier(t.identifier(id), t.identifier("jsxAttr")),
            );
          }

          if (specifiers.length > 0) {
            const source = `${options.importSource ?? "react"}/jsx-runtime`;

            path.unshiftContainer(
              "body",
              t.importDeclaration(specifiers, t.stringLiteral(source)),
            );
          }
        },
      },
      JSXElement: {
        enter(path, state) {
          const ctx: SerializeCtx = {
            options,
            state,
            t,
            template: [],
            args: [],
          };
          serializeJsx(ctx, path.node);

          if (ctx.template.length > 0) {
            const id = state.get(JSX_TEMPLATE_NAME);
            const tplId = `${state.get(JSX_TEMPLATE_ID)}_${tplIdx++}`;

            path.replaceWith(
              t.callExpression(t.identifier(id), [
                t.identifier(tplId),
                ...ctx.args,
              ]),
            );

            state.get(JSX_TEMPLATES).push(
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
          }

          if (ctx.args.length > 0) {
            state.set(JSX_HAS_ATTR, true);
          }
        },
      },
    },
  };
}

interface SerializeCtx {
  t: typeof types;
  state: PluginPass;
  options: ResolvedPrecompileOptions;
  template: types.StringLiteral[];
  args: types.Expression[];
}

function serializeJsx(ctx: SerializeCtx, node: types.JSXElement) {
  const { t } = ctx;

  if (t.isJSXIdentifier(node.openingElement.name)) {
    const name = node.openingElement.name.name;

    if (name.toLowerCase() === name) {
      const attrs = node.openingElement.attributes;

      // We can't serialize if we encounter a spreaded attribute
      let canSerialize = true;
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (t.isJSXSpreadAttribute(attr)) {
          canSerialize = false;
          break;
        }
      }

      if (canSerialize) {
        appendString(ctx, `<${name}`);

        for (let i = 0; i < attrs.length; i++) {
          const attr = attrs[i];

          if (!t.isJSXAttribute(attr)) {
            throw new Error(`Unexpected node: ${attr.type}`);
          }

          const name = typeof attr.name.name === "string"
            ? attr.name.name
            : attr.name.name.name;

          if (ctx.options.skipSerializeProperties.has(name)) {
            let value:
              | types.ArgumentPlaceholder
              | types.SpreadElement
              | types.Expression;
            if (
              t.isStringLiteral(attr.value) || t.isJSXElement(attr.value) ||
              t.isJSXFragment(attr.value)
            ) {
              value = t.cloneNode(attr.value);
            } else if (attr.value === null) {
              value = t.nullLiteral();
            } else if (attr.value === undefined) {
              value = t.identifier("undefined");
            } else if (t.isJSXExpressionContainer(attr.value)) {
              if (t.isJSXEmptyExpression(attr.value.expression)) {
                value = t.identifier("undefined");
              } else {
                value = attr.value.expression;
              }
            } else {
              throw new Error(`Unknown JSX attribute value: ${attr.value}`);
            }

            const id = ctx.state.get(JSX_ATTR_NAME);
            ctx.args.push(
              t.callExpression(t.identifier(id), [
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
            continue;
          } else if (t.isJSXText(child)) {
            appendString(ctx, child.value);
          }
        }

        appendString(ctx, `</${name}>`);
      }
    }
  }
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
