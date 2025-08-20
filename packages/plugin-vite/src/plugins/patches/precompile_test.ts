import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { precompileJsx, type PrecompileOptions } from "./precompile.ts";

function runTest(
  options: PrecompileOptions,
  input: string,
  expected: string,
) {
  const res = babel.transformSync(input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [[precompileJsx, options]],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(expected);
}

Deno.test("precompile - basic", () => {
  runTest(
    {},
    `const a = <div>Hello!</div>;
const b = <div>Hello {name}!</div>;
const c = <button class="btn" onClick={onClick}>Hello {name}!</button>;
`,
    `import { jsxTemplate as _jsxTemplate, jsxAttr as _jsxAttr, jsxEscape as _jsxEscape } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>Hello!</div>"];
const _$$_tpl_2 = ["<div>Hello ", "!</div>"];
const _$$_tpl_3 = ["<button class=\\"btn\\" ", ">Hello ", "!</button>"];
const a = _jsxTemplate(_$$_tpl_1);
const b = _jsxTemplate(_$$_tpl_2, _jsxEscape(name));
const c = _jsxTemplate(_$$_tpl_3, _jsxAttr("onclick", onClick), _jsxEscape(name));`,
  );
});

Deno.test("precompile - convert self closing", () => {
  runTest(
    {},
    `const a = <div />;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div></div>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );

  // Void elements
  runTest(
    {},
    `const a = <br></br>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<br>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );
});

Deno.test("precompile - normalize attr name", () => {
  const mappings: Record<string, string> = {
    htmlFor: "for",
    className: "class",
    xlinkRole: "xlink:role",
    acceptCharset: "accept-charset",
    onFoo: "onfoo",
  };

  for (const [key, value] of Object.entries(mappings)) {
    runTest(
      {},
      `const a = <label ${key}="foo">label</label>`,
      `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<label ${value}=\\"foo\\">label</label>"];
const a = _jsxTemplate(_$$_tpl_1);`,
    );

    let quoted = value;
    if (value.includes("-") || value.includes(":")) {
      quoted = `"${value}"`;
    }

    // should still be normalized if HTML element cannot
    // be serialized
    runTest(
      {},
      `const a = <label ${key}="foo" {...foo} />`,
      `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx("label", {
  ${quoted}: "foo",
  ...foo
});`,
    );
  }

  // Component props should never be normalized
  for (const [key, _] of Object.entries(mappings)) {
    runTest(
      {},
      `const a = <Foo ${key}="foo">foo</Foo>`,
      `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  ${key}: "foo",
  children: "foo"
});`,
    );
  }
});

Deno.test("precompile - boolean attr", () => {
  runTest(
    {},
    `const a = <input type="checkbox" checked />;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<input type=\\"checkbox\\" checked>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );

  runTest(
    {},
    `const a = <input type="checkbox" checked={false} required={true} selected={foo} />;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  '<input type="checkbox" required ',
  ">"
];
const a = _jsxTemplate($$_tpl_1, foo ? "selected" : "");`,
  );

  runTest(
    {},
    `const a = <div f-client-nav />;`,
    `import { jsxTemplate as _jsxTemplate, jsxAttr as _jsxAttr } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<div ",
  "></div>"
];
const a = _jsxTemplate($$_tpl_1, _jsxAttr("f-client-nav", true));`,
  );

  runTest(
    {},
    `const a = <div f-client-nav={false} />;`,
    `import { jsxTemplate as _jsxTemplate, jsxAttr as _jsxAttr } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<div ",
  "></div>"
];
const a = _jsxTemplate($$_tpl_1, _jsxAttr("f-client-nav", false));`,
  );
});

Deno.test("precompile - dynamic attr", () => {
  runTest(
    {},
    `const a = <div class="foo" bar={2 + 2}></div>;`,
    `import { jsxTemplate as _jsxTemplate, jsxAttr as _jsxAttr } from "react/jsx-runtime";
const $$_tpl_1 = [
  '<div class="foo" ',
  "></div>"
];
const a = _jsxTemplate($$_tpl_1, _jsxAttr("bar", 2 + 2));`,
  );
});

Deno.test("precompile - namespace attr", () => {
  runTest(
    {},
    `const a = <a xlink:href="foo">foo</a>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  '<a href="foo">foo</a>'
];
const a = _jsxTemplate($$_tpl_1);`,
  );

  runTest(
    {},
    `const a = <a foo:bar="foo">foo</a>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  '<a foo:bar="foo">foo</a>'
];
const a = _jsxTemplate($$_tpl_1);`,
  );
});

Deno.test("precompile - mixed static dynamic props", () => {
  runTest(
    {},
    `const a = <div foo="1" {...props} bar="2">foo</div>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx("div", {
  foo: "1",
  ...props,
  bar: "2",
  children: "foo"
});`,
  );
});

Deno.test("precompile - non-identifier attr", () => {
  runTest(
    {},
    `const a = <Foo aria-label="bar" {...props} />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  "aria-label": "bar",
  ...props
});`,
  );
});

Deno.test("precompile - dangerouslySetInnerHTML", () => {
  runTest(
    {},
    `const a = <div dangerouslySetInnerHTML={{__html: "foo"}}>foo</div>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx("div", {
  dangerouslySetInnerHTML: {
    __html: "foo"
  },
  children: "foo"
});`,
  );
});

Deno.test("precompile - key attr", () => {
  runTest(
    {},
    `const a = <div key="foo">foo</div>;`,
    `import { jsxTemplate as _jsxTemplate, jsxAttr as _jsxAttr } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<div ",
  ">foo</div>"
];
const a = _jsxTemplate($$_tpl_1, _jsxAttr("key", "foo"));`,
  );

  runTest(
    {},
    `const a = <div key={foo}>foo</div>;`,
    `import { jsxTemplate as _jsxTemplate, jsxAttr as _jsxAttr } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<div ",
  ">foo</div>"
];
const a = _jsxTemplate($$_tpl_1, _jsxAttr("key", foo));`,
  );
});

Deno.test("precompile - key attr", () => {
  runTest(
    {},
    `const a = <Foo key="foo" />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, null, "foo");`,
  );

  runTest(
    {},
    `const a = <Foo key={2} />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, null, 2);`,
  );

  runTest(
    {},
    `const a = <Foo key={2}>foo</Foo>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  children: "foo"
}, 2);`,
  );
});

Deno.test("precompile - ref attr", () => {
  runTest(
    {},
    `const a = <div ref="foo">foo</div>;`,
    `import { jsxTemplate as _jsxTemplate, jsxAttr as _jsxAttr } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<div ",
  ">foo</div>"
];
const a = _jsxTemplate($$_tpl_1, _jsxAttr("ref", "foo"));`,
  );

  runTest(
    {},
    `const a = <div ref={bar}>foo</div>;`,
    `import { jsxTemplate as _jsxTemplate, jsxAttr as _jsxAttr } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<div ",
  ">foo</div>"
];
const a = _jsxTemplate($$_tpl_1, _jsxAttr("ref", bar));`,
  );
});

Deno.test("precompile - serialize literal attr", () => {
  // Numeric literals
  runTest(
    {},
    `const a = <img width={100} />;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  '<img width="100">'
];
const a = _jsxTemplate($$_tpl_1);`,
  );

  runTest(
    {},
    `const a = <div tabIndex={-1} />;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  '<div tabindex="-1"></div>'
];
const a = _jsxTemplate($$_tpl_1);`,
  );

  // String literals
  runTest(
    {},
    `const a = <div foo={"b&>'\\"ar"} bar={'baz'} />;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  '<div foo="b&amp;&gt;&#39;&quot;ar" bar="baz"></div>'
];
const a = _jsxTemplate($$_tpl_1);`,
  );
});

Deno.test("precompile - escape attr", () => {
  runTest(
    {},
    `const a = <div class="a&<>'">foo</div>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  '<div class="a&amp;&lt;&gt;&#39;">foo</div>'
];
const a = _jsxTemplate($$_tpl_1);`,
  );
});

Deno.test("precompile - escape children", () => {
  runTest(
    {},
    `const a = <div>"a&>'</div>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>&quot;a&amp;&gt;&#39;</div>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );

  runTest(
    {},
    `const child = [\`"a&>'\`].join("");
const a = <div>{child}</div>;`,
    `import { jsxTemplate as _jsxTemplate, jsxEscape as _jsxEscape } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>", "</div>"];
const child = [\`"a&>'\`].join("");
const a = _jsxTemplate(_$$_tpl_1, _jsxEscape(child));`,
  );

  runTest(
    {},
    `const a = <div>{foo}{bar}</div>;`,
    `import { jsxTemplate as _jsxTemplate, jsxEscape as _jsxEscape } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>", "", "</div>"];
const a = _jsxTemplate(_$$_tpl_1, _jsxEscape(foo), _jsxEscape(bar));`,
  );

  runTest(
    {},
    `const a = <div>{"\\"a&>'"}</div>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>&quot;a&amp;&gt;&#39;</div>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );
});

Deno.test("precompile - namespace name", () => {
  // Note: This isn't really supported anywhere, but I guess why not
  runTest(
    {},
    `const a = <a:b>foo</a:b>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx("a:b", {
  children: "foo"
});`,
  );
});

Deno.test("precompile - empty jsx child", () => {
  runTest(
    {},
    `const a = <p>{}</p>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<p></p>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );
});

Deno.test("precompile - empty jsx text children", () => {
  runTest(
    {},
    `const a = <p>
      foo
</p>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<p>foo</p>"
];
const a = _jsxTemplate($$_tpl_1);`,
  );

  runTest(
    {},
    `const a = <p>
      foo
      bar
</p>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<p>foo bar</p>"
];
const a = _jsxTemplate($$_tpl_1);`,
  );

  runTest(
    {},
    `const a = <p>
  <span />
</p>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<p><span></span></p>"
];
const a = _jsxTemplate($$_tpl_1);`,
  );

  runTest(
    {},
    `const a = <Foo>
  <span />
</Foo>;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<span></span>"
];
const a = _jsx(Foo, {
  children: _jsxTemplate($$_tpl_1)
});`,
  );

  runTest(
    {},
    `const a = <Foo>
  foo
</Foo>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  children: "foo"
});`,
  );
});

Deno.test("precompile - child expr", () => {
  runTest(
    {},
    `const a = <p>{2 + 2}</p>;`,
    `import { jsxTemplate as _jsxTemplate, jsxEscape as _jsxEscape } from "react/jsx-runtime";
const _$$_tpl_1 = ["<p>", "</p>"];
const a = _jsxTemplate(_$$_tpl_1, _jsxEscape(2 + 2));`,
  );
});

Deno.test("precompile - empty fragment", () => {
  runTest(
    {},
    `const a = <></>;`,
    `const a = null;`,
  );
});

Deno.test("precompile - fragment expr", () => {
  runTest(
    {},
    `const a = <>{"foo"}</>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "foo"
];
const a = _jsxTemplate($$_tpl_1);`,
  );

  runTest(
    {},
    `const a = <>&'"</>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "&amp;&#39;&quot;"
];
const a = _jsxTemplate($$_tpl_1);`,
  );
});

Deno.test("precompile - fragment", () => {
  runTest(
    {},
    `const a = <>foo</>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "foo"
];
const a = _jsxTemplate($$_tpl_1);`,
  );

  runTest(
    {},
    `const a = <>&'"</>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "&amp;&#39;&quot;"
];
const a = _jsxTemplate($$_tpl_1);`,
  );
});

Deno.test("precompile - fragment nested", () => {
  runTest(
    {},
    `const a = <><>foo</></>;`,
    `const a = "foo";`,
  );
});

Deno.test("precompile - text indent", () => {
  runTest(
    {},
    // force tab indentation
    `const result = <div>
			foo
			bar
</div>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<div>foo bar</div>"
];
const result = _jsxTemplate($$_tpl_1);`,
  );

  runTest(
    {},
    // force space indentation
    `const result = <div>
  foo
  bar
</div>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<div>foo bar</div>"
];
const result = _jsxTemplate($$_tpl_1);`,
  );
});

Deno.test("precompile - fragment multiple children", () => {
  runTest(
    {},
    `const a = <>foo<div /><Foo /></>;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "foo<div></div>",
  ""
];
const a = _jsxTemplate($$_tpl_1, _jsx(Foo, null));`,
  );

  runTest(
    {},
    `const a = <>{foo}<Foo /></>;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate, jsxEscape as _jsxEscape } from "react/jsx-runtime";
const $$_tpl_1 = [
  "",
  "",
  ""
];
const a = _jsxTemplate($$_tpl_1, _jsxEscape(foo), _jsx(Foo, null));`,
  );

  runTest(
    {},
    `const a = <>{foo}</>;`,
    `import { jsxTemplate as _jsxTemplate, jsxEscape as _jsxEscape } from "react/jsx-runtime";
const $$_tpl_1 = [
  "",
  ""
];
const a = _jsxTemplate($$_tpl_1, _jsxEscape(foo));`,
  );

  runTest(
    {},
    `const a = <>{foo}{bar}</>;`,
    `import { jsxTemplate as _jsxTemplate, jsxEscape as _jsxEscape } from "react/jsx-runtime";
const $$_tpl_1 = [
  "",
  "",
  ""
];
const a = _jsxTemplate($$_tpl_1, _jsxEscape(foo), _jsxEscape(bar));`,
  );

  runTest(
    {},
    `const a = <Foo><div /><><>foo</><span /></></Foo>;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<div></div>"
];
const $$_tpl_2 = [
  "<span></span>"
];
const a = _jsx(Foo, {
  children: [
    _jsxTemplate($$_tpl_1),
    "foo",
    _jsxTemplate($$_tpl_2)
  ]
});`,
  );
});

Deno.test("precompile - fragment escape", () => {
  runTest(
    {},
    `const Component = (props: any) => <>{props.children}</>;
const jsx1 = (
  <Component>
    "test"
    <span>test</span>
  </Component>
);
const jsx2 = (
  <Component>
    "test"
  </Component>
);`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate, jsxEscape as _jsxEscape } from "react/jsx-runtime";
const $$_tpl_1 = [
  "",
  ""
];
const $$_tpl_2 = [
  "&quot;test&quot;<span>test</span>"
];
const Component = (props: any)=>_jsxTemplate($$_tpl_1, _jsxEscape(props.children));
const jsx1 = (_jsx(Component, {
  children: _jsxTemplate($$_tpl_2)
}));
const jsx2 = (_jsx(Component, {
  children: '"test"'
}));`,
  );
});

Deno.test("precompile - nested elements", () => {
  runTest(
    {},
    `const a = <div>foo<p>bar</p></div>;`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>foo<p>bar</p></div>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );
});

Deno.test("precompile - prop spread without children", () => {
  runTest(
    {},
    `const a = <div {...props} />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx("div", {
  ...props
});`,
  );
});

Deno.test("precompile - prop spread with children", () => {
  runTest(
    {},
    `const a = <div {...props}>hello</div>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx("div", {
  ...props,
  children: "hello"
});`,
  );
});

Deno.test("precompile - prop spread with other attrs", () => {
  runTest(
    {},
    `const a = <div foo="1" {...props} bar="2">hello</div>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx("div", {
  foo: "1",
  ...props,
  bar: "2",
  children: "hello"
});`,
  );
});

Deno.test("precompile - component", () => {
  runTest(
    {},
    `const a = <div><Foo /></div>;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>", "</div>"];
const a = _jsxTemplate(_$$_tpl_1, _jsx(Foo, null));`,
  );
});

Deno.test("precompile - component outer", () => {
  runTest(
    {},
    `const a = <Foo />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, null);`,
  );
});

Deno.test("precompile - component with props", () => {
  runTest(
    {},
    `const a = <Foo required foo="1" bar={2} />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  required: true,
  foo: "1",
  bar: 2
});`,
  );
});

Deno.test("precompile - component with spread props", () => {
  runTest(
    {},
    `const a = <Foo {...props} foo="1" />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  ...props,
  foo: "1"
});`,
  );
});

Deno.test("precompile - component with children", () => {
  runTest(
    {},
    `const a = <Foo>bar</Foo>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  children: "bar"
});`,
  );
});

Deno.test("precompile - component with children", () => {
  runTest(
    {},
    `const a = <Foo><span>hello</span></Foo>;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<span>hello</span>"];
const a = _jsx(Foo, {
  children: _jsxTemplate(_$$_tpl_1)
});`,
  );
});

Deno.test("precompile - component with multiple children", () => {
  runTest(
    {},
    `const a = <Foo><span>hello</span>foo<Bar />asdf</Foo>;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "<span>hello</span>foo",
  "asdf"
];
const a = _jsx(Foo, {
  children: _jsxTemplate($$_tpl_1, _jsx(Bar, null))
});`,
  );
});

Deno.test("precompile - component with multiple children #2", () => {
  runTest(
    {},
    `const a = <Foo><span>hello</span>foo<Bar><p>asdf</p></Bar></Foo>;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_2 = [
  "<p>asdf</p>"
];
const $$_tpl_1 = [
  "<span>hello</span>foo",
  ""
];
const a = _jsx(Foo, {
  children: _jsxTemplate($$_tpl_1, _jsx(Bar, {
    children: _jsxTemplate($$_tpl_2)
  }))
});`,
  );
});

Deno.test("precompile - component with child expr", () => {
  runTest(
    {},
    `const a = <Foo>{2 + 2}</Foo>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  children: 2 + 2
});`,
  );
});

Deno.test("precompile - component with jsx attr", () => {
  runTest(
    {},
    `const a = <Foo bar={<div>hello</div>} />;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>hello</div>"];
const a = _jsx(Foo, {
  bar: _jsxTemplate(_$$_tpl_1)
});`,
  );

  runTest(
    {},
    `const a = <Foo bar={<Bar>hello</Bar>} />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  bar: _jsx(Bar, {
    children: "hello"
  })
});`,
  );
});

Deno.test("precompile - component with jsx frag attr", () => {
  runTest(
    {},
    `const a = <Foo bar={<>foo</>} />;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "foo"
];
const a = _jsx(Foo, {
  bar: _jsxTemplate($$_tpl_1)
});`,
  );

  runTest(
    {},
    `const a = <Foo bar={<>foo<Foo/>bar</>} />;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "foo",
  "bar"
];
const a = _jsx(Foo, {
  bar: _jsxTemplate($$_tpl_1, _jsx(Foo, null))
});`,
  );
});

Deno.test("precompile - component with nested fragment", () => {
  runTest(
    {},
    `const a = <Foo><>foo<Bar><></></Bar></></Foo>;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  children: [
    "foo",
    _jsx(Bar, null)
  ]
});`,
  );
});

Deno.test("precompile - component with jsx member", () => {
  runTest(
    {},
    `const a = <ctx.Provider value={null} />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(ctx.Provider, {
  value: null
});`,
  );

  runTest(
    {},
    `const a = <a.b.c.d value={null} />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(a.b.c.d, {
  value: null
});`,
  );
});

Deno.test("precompile - component prop casing", () => {
  runTest(
    {},
    `const a = <Foo someCasing={2} />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  someCasing: 2
});`,
  );

  runTest(
    {},
    `const a = <MyIsland.Foo someCasing={2} />;`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(MyIsland.Foo, {
  someCasing: 2
});`,
  );
});

Deno.test("precompile - import source option", () => {
  runTest(
    { importSource: "foobar" },
    `const a = <div>foo</div>;`,
    `import { jsxTemplate as _jsxTemplate } from "foobar/jsx-runtime";
const _$$_tpl_1 = ["<div>foo</div>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );
});

Deno.test("precompile - template index", () => {
  runTest(
    {},
    `<div><Foo><span /></Foo></div>;`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<span></span>"];
const _$$_tpl_2 = ["<div>", "</div>"];
_jsxTemplate(_$$_tpl_2, _jsx(Foo, {
  children: _jsxTemplate(_$$_tpl_1)
}));`,
  );
});

Deno.test("precompile - multi jsx string line to jsx call", () => {
  runTest(
    {},
    `const a = <Foo
key="Register a module with the third party
      registry."
description="Register a module with the third party
      registry."
/>
      `,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  description: "Register a module with the third party registry."
}, "Register a module with the third party registry.");`,
  );
});

Deno.test("precompile - insert tpl after imports", () => {
  runTest(
    {},
    `import Foo from "./foo.ts";
import Bar from "./bar.ts";
const a = <div />`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
import Foo from "./foo.ts";
import Bar from "./bar.ts";
const _$$_tpl_1 = ["<div></div>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );

  runTest(
    {},
    `import Foo from "./foo.ts";

export function foo() {
  return <div />
}`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
import Foo from "./foo.ts";
const _$$_tpl_1 = ["<div></div>"];
export function foo() {
  return _jsxTemplate(_$$_tpl_1);
}`,
  );

  runTest(
    {},
    `import Foo from "./foo.ts";

export default function foo() {
  return <div />
}`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
import Foo from "./foo.ts";
const _$$_tpl_1 = ["<div></div>"];
export default function foo() {
  return _jsxTemplate(_$$_tpl_1);
}`,
  );
});

Deno.test("precompile - merge component text children", () => {
  runTest(
    {},
    `const a = <Foo>foo{" "}bar{' '}</Foo>`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  children: "foo bar "
});`,
  );

  runTest(
    {},
    `const a = <Foo>foo{2}bar{true}{false}baz</Foo>`,
    `import { jsx as _jsx } from "react/jsx-runtime";
const a = _jsx(Foo, {
  children: "foo2barbaz"
});`,
  );

  runTest(
    {},
    `const a = <Foo>foo<div />bar{" "}</Foo>`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const $$_tpl_1 = [
  "foo<div></div>bar "
];
const a = _jsx(Foo, {
  children: _jsxTemplate($$_tpl_1)
});`,
  );
});

Deno.test("precompile - merge element text children", () => {
  runTest(
    {},
    `const a = <div>foo{" "}bar{' '}</div>`,
    `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>foo bar </div>"];
const a = _jsxTemplate(_$$_tpl_1);`,
  );
});

Deno.test("precompile - skip serialization", () => {
  runTest(
    {
      skipSerializeElements: ["a", "img"],
    },
    `const a = <div><img src="foo.jpg"/><a href="#">foo</a></div>`,
    `import { jsx as _jsx, jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div>", "", "</div>"];
const a = _jsxTemplate(_$$_tpl_1, _jsx("img", {
  src: "foo.jpg"
}), _jsx("a", {
  href: "#",
  children: "foo"
}));`,
  );
});

Deno.test("precompile - skip prop serialization", () => {
  runTest(
    {
      skipSerializeProperties: ["class", "className"],
    },
    `const a = <div class="foo"><img id="foo" className="foo" /></div>`,
    `import { jsxTemplate as _jsxTemplate, jsxAttr as _jsxAttr } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div", "><img id=\\"foo\\"", "></div>"];
const a = _jsxTemplate(_$$_tpl_1, _jsxAttr("class", "foo"), _jsxAttr("className", "foo"));`,
  );
});

Deno.test("precompile - attr casing", () => {
  const values: Record<string, string> = {
    accentHeight: "accent-height",
    acceptCharset: "accept-charset",
    alignmentBaseline: "alignment-baseline",
    allowReorder: "allowReorder",
    arabicForm: "arabic-form",
    attributeName: "attributeName",
    attributeType: "attributeType",
    baseFrequency: "baseFrequency",
    baselineShift: "baseline-shift",
    baseProfile: "baseProfile",
    calcMode: "calcMode",
    capHeight: "cap-height",
    className: "class",
    clipPath: "clip-path",
    clipPathUnits: "clipPathUnits",
    clipRule: "clip-rule",
    colorInterpolation: "color-interpolation",
    colorInterpolationFilters: "color-interpolation-filters",
    colorProfile: "color-profile",
    colorRendering: "color-rendering",
    contentScriptType: "content-script-type",
    contentStyleType: "content-style-type",
    diffuseConstant: "diffuseConstant",
    dominantBaseline: "dominant-baseline",
    edgeMode: "edgeMode",
    enableBackground: "enable-background",
    fillOpacity: "fill-opacity",
    fillRule: "fill-rule",
    filterUnits: "filterUnits",
    floodColor: "flood-color",
    floodOpacity: "flood-opacity",
    fontFamily: "font-family",
    fontSize: "font-size",
    fontSizeAdjust: "font-size-adjust",
    fontStretch: "font-stretch",
    fontStyle: "font-style",
    fontVariant: "font-variant",
    fontWeight: "font-weight",
    glyphName: "glyph-name",
    glyphOrientationHorizontal: "glyph-orientation-horizontal",
    glyphOrientationVertical: "glyph-orientation-vertical",
    glyphRef: "glyphRef",
    gradientTransform: "gradientTransform",
    gradientUnits: "gradientUnits",
    horizAdvX: "horiz-adv-x",
    horizOriginX: "horiz-origin-x",
    horizOriginY: "horiz-origin-y",
    htmlFor: "for",
    httpEquiv: "http-equiv",
    imageRendering: "image-rendering",
    kernelMatrix: "kernelMatrix",
    kernelUnitLength: "kernelUnitLength",
    keyPoints: "keyPoints",
    keySplines: "keySplines",
    keyTimes: "keyTimes",
    lengthAdjust: "lengthAdjust",
    letterSpacing: "letter-spacing",
    lightingColor: "lighting-color",
    limitingConeAngle: "limitingConeAngle",
    markerEnd: "marker-end",
    markerHeight: "markerHeight",
    markerMid: "marker-mid",
    markerStart: "marker-start",
    markerUnits: "markerUnits",
    markerWidth: "markerWidth",
    maskContentUnits: "maskContentUnits",
    maskUnits: "maskUnits",
    numOctaves: "numOctaves",
    overlinePosition: "overline-position",
    overlineThickness: "overline-thickness",
    paintOrder: "paint-order",
    panose1: "panose-1",
    pathLength: "pathLength",
    patternContentUnits: "patternContentUnits",
    patternTransform: "patternTransform",
    patternUnits: "patternUnits",
    pointsAtX: "pointsAtX",
    pointsAtY: "pointsAtY",
    pointsAtZ: "pointsAtZ",
    pointerEvents: "pointer-events",
    preserveAlpha: "preserveAlpha",
    preserveAspectRatio: "preserveAspectRatio",
    primitiveUnits: "primitiveUnits",
    referrerPolicy: "referrerPolicy",
    refX: "refX",
    refY: "refY",
    renderingIntent: "rendering-intent",
    repeatCount: "repeatCount",
    repeatDur: "repeatDur",
    requiredExtensions: "requiredExtensions",
    requiredFeatures: "requiredFeatures",
    shapeRendering: "shape-rendering",
    specularConstant: "specularConstant",
    specularExponent: "specularExponent",
    spreadMethod: "spreadMethod",
    startOffset: "startOffset",
    stdDeviation: "stdDeviation",
    stitchTiles: "stitchTiles",
    stopColor: "stop-color",
    stopOpacity: "stop-opacity",
    strikethroughPosition: "strikethrough-position",
    strikethroughThickness: "strikethrough-thickness",
    strokeDasharray: "stroke-dasharray",
    strokeDashoffset: "stroke-dashoffset",
    strokeLinecap: "stroke-linecap",
    strokeLinejoin: "stroke-linejoin",
    strokeMiterlimit: "stroke-miterlimit",
    strokeOpacity: "stroke-opacity",
    strokeWidth: "stroke-width",
    surfaceScale: "surfaceScale",
    systemLanguage: "systemLanguage",
    tableValues: "tableValues",
    targetX: "targetX",
    targetY: "targetY",
    textAnchor: "text-anchor",
    textDecoration: "text-decoration",
    textLength: "textLength",
    textRendering: "text-rendering",
    transformOrigin: "transform-origin",
    underlinePosition: "underline-position",
    underlineThickness: "underline-thickness",
    unicodeBidi: "unicode-bidi",
    unicodeRange: "unicode-range",
    unitsPerEm: "units-per-em",
    vAlphabetic: "v-alphabetic",
    viewBox: "viewBox",
    vectorEffect: "vector-effect",
    vertAdvY: "vert-adv-y",
    vertOriginX: "vert-origin-x",
    vertOriginY: "vert-origin-y",
    vHanging: "v-hanging",
    vMathematical: "v-mathematical",
    wordSpacing: "word-spacing",
    writingMode: "writing-mode",
    xChannelSelector: "xChannelSelector",
    xHeight: "x-height",
    xlinkActuate: "xlink:actuate",
    xlinkArcrole: "xlink:arcrole",
    xlinkHref: "href",
    "xlink:href": "href",
    xlinkRole: "xlink:role",
    xlinkShow: "xlink:show",
    xlinkTitle: "xlink:title",
    xlinkType: "xlink:type",
    xmlBase: "xml:base",
    xmlLang: "xml:lang",
    xmlSpace: "xml:space",
    yChannelSelector: "yChannelSelector",
    zoomAndPan: "zoomAndPan",
  };

  for (const [key, value] of Object.entries(values)) {
    const input = `const a = <div ${key}="foo" />`;
    const expected =
      `import { jsxTemplate as _jsxTemplate } from "react/jsx-runtime";
const _$$_tpl_1 = ["<div ${value}=\\"foo\\"></div>"];
const a = _jsxTemplate(_$$_tpl_1);`;
    runTest({}, input, expected);
  }
});
