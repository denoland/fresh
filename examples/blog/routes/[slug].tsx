/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Handlers, PageProps } from "$fresh/server.ts";
import Layout from "components/Layout.tsx";
import { Marked } from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import { PostDetail } from "types/blog.ts";
import { fetchRepoMetadata } from "utils/github.ts";
import GithubRepo from "components/GithubRepo.tsx";
import Tag from "../components/Tag.tsx";
import BlogAuthor from "../components/BlogAuthor.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const BLOG_DIR = "blog";
      const slug = ctx.params.slug;

      const postPath = `${BLOG_DIR}/${slug}.md`;
      // check file exists
      await Deno.stat(postPath);

      const decoder = new TextDecoder("utf-8");
      const markdown = decoder.decode(await Deno.readFile(postPath));
      const markup = Marked.parse(markdown);

      let github;
      if (markup.meta.github) {
        github = await fetchRepoMetadata(markup.meta.github);
      }

      return ctx.render({
        post: { ...markup.meta, content: markup.content },
        github,
      });
    } catch (error) {
      // redirect to home page if post not found
      return new Response(undefined, {
        status: 302,
        headers: { location: "/" },
      });
    }
  },
};

export default function Blog({ data }: PageProps) {
  const post: PostDetail = data?.post;
  const github = data?.github;

  return (
    <Layout title={post.title}>
      <div>
        <img
          src={post.poster}
          alt="Post cover image"
          className={tw`blog-post--img rounded-lg`}
        />
      </div>
      <h2 className={tw`font-medium text-3xl mt-8`}>{post.title}</h2>
      <p className={tw`mt-2 text-gray-600 text-lg dark:text-gray-400`}>
        {post.postedAt}
      </p>
      <div className={tw`mt-4`}>
        <BlogAuthor
          authorAvatar={post.authorAvatar}
          authorName={post.authorName}
        />
        <div className={tw`mt-4 flex flex-wrap gap-4`}>
          {post.tags.map((tag) => (
            <Tag title={tag} key={tag} />
          ))}
        </div>
        <div className={tw`mt-4`}>{github && <GithubRepo {...github} />}</div>
        <div
          className={tw`mt-8 prose lg:prose-xl overflow-x-auto dark:text-gray-400`}
          dangerouslySetInnerHTML={{ __html: post.content }}
        ></div>
      </div>
    </Layout>
  );
}
