import { handler, page as definePage } from "./$[slug].ts";
import { HttpError } from "fresh/errors";
import { Seo } from "../../components/Seo.tsx";
import Header from "../../components/Header.tsx";
import Footer from "../../components/Footer.tsx";
import * as Icons from "../../components/Icons.tsx";
import { type BlogPost, formatDate, LOCAL_POSTS_BY_SLUG } from "../../data/blog.ts";
import { parsePmCookie, type PmName, renderMarkdown } from "../../utils/markdown.ts";

interface Data {
  post: BlogPost & { markdown: string };
  activePm: PmName;
}

export const handlers = handler({
  GET(ctx): { data: Data } | Response {
    let slug = ctx.params.slug;

    // `/blog/<slug>.md` serves the raw markdown source for that post.
    const rawMarkdown = slug.endsWith(".md");
    if (rawMarkdown) slug = slug.slice(0, -3);

    const post = LOCAL_POSTS_BY_SLUG.get(slug);
    if (!post || post.markdown === undefined) {
      throw new HttpError(404);
    }

    if (rawMarkdown) {
      return new Response(post.markdown, {
        headers: { "content-type": "text/markdown; charset=utf-8" },
      });
    }

    return {
      data: {
        post: { ...post, markdown: post.markdown },
        activePm: parsePmCookie(ctx.req.headers.get("cookie")),
      },
    };
  },
});

export default definePage(function BlogPostPage(props) {
  // `props.data` infers to `never` because the handler can also return a
  // `Response` — at render time the data is always `Data`.
  const { post, activePm } = props.data as Data;
  const { html } = renderMarkdown(post.markdown, { activePm });

  return (
    <div class="flex flex-col min-h-screen mx-auto max-w-screen-2xl">
      <Seo
        url={props.url}
        title={`${post.title} | Fresh blog`}
        description={post.description}
        ogImage={new URL(post.image ?? "/og-image.webp", props.url).href}
      />
      <Header title="blog" active="/blog" />
      <main class="w-full max-w-3xl mx-auto mt-8 mb-16 flex-1">
        <div class="px-4 md:px-0">
          <a
            href="/blog"
            class="text-sm text-foreground-secondary hover:text-foreground-primary hover:underline"
          >
            ← All posts
          </a>
          <h1 class="text-4xl tracking-tight font-bold mt-4">{post.title}</h1>
          <p class="mt-3 text-sm text-foreground-secondary">
            <time datetime={post.date.toISOString()}>{formatDate(post.date)}</time>
            {post.authors.length > 0 && <> · {post.authors.join(", ")}</>}
          </p>
          {post.image && (
            <img
              src={post.image}
              alt=""
              class="mt-8 w-full rounded-sm border border-foreground-secondary/20"
            />
          )}
        </div>
        <div
          class="markdown-body mt-8 mb-8"
          // deno-lint-ignore react-no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <hr />
        <div class="px-4 md:px-0 flex justify-between items-center my-6 gap-4">
          <a
            href={`https://github.com/freshframework/fresh/edit/main/www/${post.file}`}
            class="text-gray-700 dark:text-gray-200 text-md flex items-center bg-[#ebedf0] dark:bg-[#2c2d39] px-4 py-2 rounded-sm hover:bg-gray-200 dark:hover:bg-[#36394c] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="mr-2 inline-flex">Edit this post</span>
            <Icons.GitHub />
          </a>
          <a
            href={`${props.url.pathname}.md`}
            class="text-xs text-foreground-secondary hover:text-foreground-primary hover:underline"
          >
            View as Markdown
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
});
