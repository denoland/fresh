import { page } from "./$index.ts";
import { Seo } from "../../components/Seo.tsx";
import Header from "../../components/Header.tsx";
import Footer from "../../components/Footer.tsx";
import { type BlogPost, formatDate, POSTS } from "../../data/blog.ts";

export default page(function BlogIndex(props) {
  return (
    <div class="flex flex-col min-h-screen mx-auto max-w-screen-2xl">
      <Seo
        url={props.url}
        title="Blog | Fresh"
        description="News, releases, and guides from the Fresh team."
        ogImage={new URL("/og-image.webp", props.url).href}
      />
      <Header title="blog" active="/blog" />
      <main class="w-full max-w-3xl mx-auto px-4 md:px-0 mt-8 mb-16 flex-1">
        <div class="flex items-baseline justify-between gap-4 mb-8">
          <h1 class="text-4xl tracking-tight font-bold">Blog</h1>
          <a
            href="/blog/feed"
            class="text-sm text-foreground-secondary hover:text-foreground-primary hover:underline"
          >
            Atom feed
          </a>
        </div>
        <ol class="flex flex-col divide-y divide-foreground-secondary/20">
          {POSTS.map((post) => (
            <PostEntry key={post.href} post={post} />
          ))}
        </ol>
      </main>
      <Footer />
    </div>
  );
});

function PostEntry({ post }: { post: BlogPost }) {
  const external = post.markdown === undefined;
  return (
    <li class="py-8">
      {post.image && (
        <a href={post.href} tabIndex={-1} aria-hidden="true" class="block mb-4">
          <img
            src={post.image}
            alt=""
            loading="lazy"
            class="w-full h-auto rounded-sm border border-foreground-secondary/20"
          />
        </a>
      )}
      <time
        datetime={post.date.toISOString()}
        class="text-sm text-foreground-secondary flex items-center gap-2"
      >
        {formatDate(post.date)}
        {external && (
          <span class="text-xs border border-foreground-secondary/30 rounded-sm px-1.5 py-0.5">
            deno.com
          </span>
        )}
      </time>
      <h2 class="text-2xl font-bold tracking-tight mt-1">
        <a href={post.href} class="hover:underline">
          {post.title}
          {external && (
            <span aria-hidden="true" class="text-foreground-secondary">
              {" "}
              ↗
            </span>
          )}
        </a>
      </h2>
      <p class="mt-2 text-foreground-secondary">{post.description}</p>
    </li>
  );
}
