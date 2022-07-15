import { default as remarkGfm } from "https://esm.sh/remark-gfm@3.0.1";
import { default as remarkMath } from "https://esm.sh/remark-math@5.1.1";
import { parse as frontMatter } from "https://deno.land/x/frontmatter@v0.1.4/mod.ts";
import { default as rehypeAutolinkHeadings } from "https://esm.sh/rehype-autolink-headings@6.1.1";
import { default as rehypeCodeTitles } from "https://esm.sh/rehype-code-titles@1.1.0";
import { default as rehypeSlug } from "https://esm.sh/rehype-slug@5.0.1";
import { default as rehypePrism } from "https://esm.sh/rehype-prism@2.1.2";
import { type Plugin, unified } from "https://esm.sh/unified@10.1.2";
import { default as remarkParser } from "https://esm.sh/remark-parse@10.0.1";
import { default as remarkRehype } from "https://esm.sh/remark-rehype@10.1.0";
import { default as rehypeStringify } from "https://esm.sh/rehype-stringify@9.0.3";
import { default as rehypeExternalLinks } from "https://esm.sh/rehype-external-links@1.0.1";
import { default as remarkImages } from "https://esm.sh/remark-images@3.1.0";

const basePath = "../data/posts";

interface Frontmatter {
  title: string;
  publishedOn: string;
  image?: string;
}

export interface ParsedContent {
  html: string;
  frontmatter: Frontmatter;
}

export async function compileMarkdown(
  filename: string,
): Promise<ParsedContent> {
  const content = await readFile(`${basePath}/${filename}.md`);
  const compiledMarkdown = await unified()
    .use(remarkParser as Plugin)
    .use(remarkRehype)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkImages)
    .use(rehypeStringify as Plugin)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { class: "anchor" },
    })
    .use(rehypeCodeTitles)
    .use(rehypeExternalLinks)
    .use(rehypePrism)
    .process(content);
  const { value: html } = compiledMarkdown;
  const { data: frontmatter } = frontMatter(content) as { data: Frontmatter };
  return { html: String(html.slice(html.indexOf('</h2>'))), frontmatter };
}

async function readFile(filepath: string): Promise<string> {
  try {
    const path = new URL(filepath, import.meta.url);
    return await Deno.readTextFile(path);
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : `Encoutered an error: ` + error;
    throw new Error(errorMessage);
  }
}
