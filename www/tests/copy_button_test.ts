import { assertEquals } from "@std/assert";
import { renderMarkdown } from "../utils/markdown.ts";

Deno.test("Markdown renderer - should add data attributes to code blocks", () => {
  const markdown = `
\`\`\`typescript
const hello = 'world';
console.log(hello);
\`\`\`

\`\`\`javascript
function test() {
  return 42;
}
\`\`\`
  `;

  const { html } = renderMarkdown(markdown);

  // Check that code blocks have the required data attributes
  assertEquals(
    html.includes('data-code-lang="typescript"'),
    true,
    "Should include language data attribute",
  );
  assertEquals(
    html.includes("data-code-text="),
    true,
    "Should include code text data attribute",
  );
  assertEquals(
    html.includes('class="fenced-code relative"'),
    true,
    "Should include relative class for positioning",
  );

  // Check that both code blocks are present
  const typescriptMatch = html.match(/data-code-lang="typescript"/g);
  const javascriptMatch = html.match(/data-code-lang="javascript"/g);

  assertEquals(
    typescriptMatch?.length,
    1,
    "Should have one TypeScript code block",
  );
  assertEquals(
    javascriptMatch?.length,
    1,
    "Should have one JavaScript code block",
  );
});

Deno.test("Markdown renderer - should handle code blocks without language", () => {
  const markdown = `
\`\`\`
plain code block
\`\`\`
  `;

  const { html } = renderMarkdown(markdown);

  // Should still add data attributes even without language
  assertEquals(
    html.includes('data-code-lang=""'),
    true,
    "Should include empty language data attribute",
  );
  assertEquals(
    html.includes("data-code-text="),
    true,
    "Should include code text data attribute",
  );
  assertEquals(
    html.includes("plain code block"),
    true,
    "Should include the code content",
  );
});

Deno.test("Markdown renderer - should escape HTML in code text attribute", () => {
  const markdown = `
\`\`\`html
<div class="test">Hello & goodbye</div>
\`\`\`
  `;

  const { html } = renderMarkdown(markdown);

  // Should escape HTML characters in the data-code-text attribute
  assertEquals(
    html.includes("&lt;div class=&quot;test&quot;&gt;"),
    true,
    "Should escape HTML in data attribute",
  );
  assertEquals(
    html.includes("Hello &amp; goodbye"),
    true,
    "Should escape ampersand in data attribute",
  );
});

Deno.test("Markdown renderer - should handle multiline code blocks", () => {
  const markdown = `
\`\`\`typescript
const multiline = \`
  This is a
  multiline string
  with various content
\`;

function process() {
  return multiline.split('\\n').map(line => line.trim());
}
\`\`\`
  `;

  const { html } = renderMarkdown(markdown);

  assertEquals(
    html.includes('data-code-lang="typescript"'),
    true,
    "Should handle TypeScript",
  );
  assertEquals(
    html.includes("data-code-text="),
    true,
    "Should include code text",
  );
  assertEquals(
    html.includes("const multiline"),
    true,
    "Should preserve multiline content",
  );
});

Deno.test("Markdown renderer - should handle special characters in code", () => {
  const markdown = `
\`\`\`bash
echo "Hello 'World'" > file.txt
grep -r "test & more" --include="*.js" .
\`\`\`
  `;

  const { html } = renderMarkdown(markdown);

  // Should properly escape special characters
  assertEquals(
    html.includes('data-code-lang="bash"'),
    true,
    "Should identify bash language",
  );
  assertEquals(
    html.includes("&quot;"),
    true,
    "Should escape quotes in data attribute",
  );
  assertEquals(
    html.includes("&amp;"),
    true,
    "Should escape ampersands in data attribute",
  );
});
