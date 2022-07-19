/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Handlers, PageProps } from "$fresh/server.ts";
import Layout from "components/Layout.tsx";
import BlogPost from "components/BlogPost.tsx";
import { Marked } from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import { Post } from "../types/blog.ts";
export const handler: Handlers = {
  async GET(req, ctx) {
    const BLOG_DIR = "blog";
    const posts = [];
    // async iterator to get all md files in blog dir
    for await (const dir of Deno.readDir(BLOG_DIR)) {
      if (dir.isFile) {
        // utf-8 text decoder
        const decoder = new TextDecoder("utf-8");
        // decode md file
        const markdown = decoder.decode(
          await Deno.readFile(`${BLOG_DIR}/${dir.name}`)
        );
        // parse md file into metadata and content
        const markup = Marked.parse(markdown);
        posts.push(markup.meta);
      }
    }
    return ctx.render({ posts });
  },
};
export default function Blog({ data }: PageProps) {
  const posts: Post[] = data.posts;
  return (
    <Layout title="Blog">
      <div>
        <section className={tw`grid grid-cols-1 gap-4 md:grid-cols-2`}>
          {posts.map((post) => (
            <BlogPost key={post.slug} {...post} />
          ))}
        </section>
      </div>
    </Layout>
  );
}
