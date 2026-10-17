import { frontMatter } from "../utils/markdown.ts";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: Date;
  authors: string[];
  /** Header image, as a path under `public/` (e.g. `/blog/<slug>/header.png`). */
  image?: string;
  /** Where the post lives — `/blog/<slug>` here, or its deno.com URL. */
  href: string;
  /** Set for posts published here; `undefined` for posts on the Deno blog. */
  markdown?: string;
  file?: string;
  /** Drafts are left off the index and feed, and only served in dev. */
  draft?: boolean;
}

/**
 * Fresh posts published on the Deno blog before the Fresh blog existed. They
 * stay on deno.com — the index just links to them. New posts go in `/blog/`
 * as markdown instead.
 */
const DENO_BLOG_POSTS: Omit<BlogPost, "href" | "authors">[] = [
  {
    slug: "fresh-2.3",
    image: "/blog/fresh-2.3/og-image.jpg",
    title: "Fresh 2.3: Zero JS by default, View Transitions, and Temporal support",
    description:
      "Fresh 2.3 ships true zero-JS pages, View Transitions, CSP nonce support, IP filtering, and Temporal API support in islands.",
    date: new Date("2026-04-24T15:00:00.000Z"),
  },
  {
    slug: "fresh-and-vite",
    image: "/blog/fresh-and-vite/og.png",
    title: "Fresh 2.0 Graduates to Beta, Adds Vite Support",
    description:
      "Fresh 2.0 beta introduces optional Vite integration - with hot reloading, faster boot times, seamless React aliasing, and the full Vite plugin ecosystem",
    date: new Date("2025-09-02T13:30:00.000Z"),
  },
  {
    slug: "an-update-on-fresh",
    image: "/blog/an-update-on-fresh/ogp.png",
    title: "An Update on Fresh",
    description:
      "Fresh 2.0 is very much still active. Here’s an update and how to try out the alpha.",
    date: new Date("2025-05-15T13:30:00.000Z"),
  },
  {
    slug: "fresh-1.6",
    image: "/blog/fresh-1.6/og-image.jpg",
    title: "Fresh 1.6: Tailwind CSS plugin, simplified typings and more",
    description:
      "Discover new improvements in Fresh 1.6 that simplify your project and make it speedier.",
    date: new Date("2023-12-01T15:00:00.000Z"),
  },
  {
    slug: "fresh-1.5",
    image: "/blog/fresh-1.5/og-image.png",
    title: "Fresh 1.5: Partials, client side navigation and more",
    description:
      "Discover new improvements in Fresh 1.5 that makes your site quicker to load and comes with several improvements to make authoring complex projects easier.",
    date: new Date("2023-10-10T15:00:00.000Z"),
  },
  {
    slug: "fresh-1.4",
    image: "/blog/fresh-1.4/og-image.png",
    title: "Fresh 1.4 – Faster Page Loads, Layouts and More",
    description:
      "Discover new improvements in Fresh 1.4 that makes your site quicker to load and comes with several improvements to make authoring complex projects easier.",
    date: new Date("2023-08-16T15:00:00.000Z"),
  },
  {
    slug: "fresh-1.3",
    image: "/blog/fresh-1.3/lemon.jpg",
    title: "Fresh 1.3 – Simplified Route Components and More",
    description:
      "Explore the key improvements in Fresh 1.3: streamlined route components, enhanced error handling, updated linting rules, and multi-island exports. This release also supports the stable Deno.serve API, making Deno projects more efficient and manageable.",
    date: new Date("2023-07-18T15:00:00.000Z"),
  },
  {
    slug: "fresh-1.2",
    image: "/blog/fresh-1.2/og-image.png",
    title:
      "Fresh 1.2 – welcoming a full-time maintainer, sharing state between islands, limited npm support, and more",
    description: "Learn what new features the 1.2 release brings and about the future of Fresh.",
    date: new Date("2023-06-15T15:00:00.000Z"),
  },
  {
    slug: "build-chatgpt-doc-search-with-supabase-fresh",
    image: "/blog/build-chatgpt-doc-search-with-supabase-fresh/og-image.png",
    title: "Build your own ChatGPT-style doc search with Fresh, OpenAI, and Supabase",
    description:
      "Learn how to setup a customized ChatGPT-style doc search and work with the OpenAI Chat-GPT3 API.",
    date: new Date("2023-05-11T15:00:00.000Z"),
  },
  {
    slug: "intro-to-islands",
    image: "/blog/intro-to-islands/og.png",
    title: "A Gentle Introduction to Islands",
    description: "What islands are, what they're not, and how they work.",
    date: new Date("2023-04-26T14:15:00.000Z"),
  },
  {
    slug: "you-dont-need-a-build-step",
    image: "/blog/you-dont-need-a-build-step/og.png",
    title: "You Don't Need a Build Step",
    description:
      "The build step helps Node.js/npm run in the browser, optimize end-user performance, etc. But long build times limit productivity. With modern tooling, do we still need a build step?",
    date: new Date("2023-03-01T16:00:00.000Z"),
  },
  {
    slug: "introducing-fresh-wordpress-themes",
    image: "/blog/introducing-fresh-wordpress-themes/ogp.png",
    title: "Introducing Fresh WordPress Themes",
    description:
      "Combine the DX and performance of Fresh with the reliability and dependability of WordPress.",
    date: new Date("2022-11-10T13:00:00.000Z"),
  },
  {
    slug: "setup-auth-with-fresh",
    image: "/blog/setup-auth-with-fresh/og-image.png",
    title: "How to Setup Auth with Fresh",
    description: "A tutorial to setting up authentication with Fresh.",
    date: new Date("2022-11-04T15:00:00.000Z"),
  },
  {
    slug: "build-a-blog-with-fresh",
    image: "/blog/build-a-blog-with-fresh/og-image.png",
    title: "How to Build a Blog with Fresh",
    description: "Create a simple blog with Fresh in minutes.",
    date: new Date("2022-10-25T15:00:00.000Z"),
  },
  {
    slug: "fresh-1.1",
    image: "/blog/fresh-1.1/ogp.png",
    title: "Fresh 1.1 - automatic JSX, plugins, DevTools, and more",
    description:
      "This release makes Fresh even more powerful with automatic JSX, plugins, DevTools integration and more.",
    date: new Date("2022-09-08T13:30:00.000Z"),
  },
  {
    slug: "fresh-is-stable",
    image: "/blog/fresh-is-stable/header.png",
    title: "Fresh 1.0",
    description:
      "Fresh is a new full stack web framework for Deno. By default, Fresh web pages send zero JavaScript to the client.",
    date: new Date("2022-06-28T14:15:00.000Z"),
  },
];

/**
 * Every markdown post in `/blog/`, bundled at build time. Eager because the
 * index needs every post's front matter anyway.
 */
const FILES = import.meta.glob<string>("/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function parsePost(file: string, content: string): BlogPost {
  const slug = file.slice("/blog/".length, -".md".length);
  const { body, attrs } = frontMatter<Record<string, unknown>>(content);
  const { title, description, date, authors = [], image, draft = false } = attrs;
  if (typeof title !== "string" || typeof description !== "string") {
    throw new Error(`Blog post ${file} needs a \`title\` and \`description\` in its front matter`);
  }
  // YAML parses an unquoted `2026-10-17` into a `Date` already.
  const parsedDate = date instanceof Date ? date : new Date(String(date));
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Blog post ${file} needs a valid \`date\` in its front matter`);
  }
  if (image !== undefined && typeof image !== "string") {
    throw new Error(`Blog post ${file} has an invalid \`image\` in its front matter`);
  }
  if (!Array.isArray(authors) || !authors.every((a) => typeof a === "string")) {
    throw new Error(`Blog post ${file} has an invalid \`authors\` list in its front matter`);
  }
  if (typeof draft !== "boolean") {
    throw new Error(`Blog post ${file} has an invalid \`draft\` in its front matter`);
  }
  return {
    slug,
    title,
    description,
    date: parsedDate,
    authors,
    image,
    href: `/blog/${slug}`,
    markdown: body,
    file: file.slice(1),
    draft,
  };
}

const LOCAL_POSTS = Object.entries(FILES).map(([file, content]) => parsePost(file, content));

/** Every post, newest first — local and Deno blog posts mixed together. */
export const POSTS: BlogPost[] = [
  ...LOCAL_POSTS.filter((post) => !post.draft),
  ...DENO_BLOG_POSTS.map((post) => ({
    ...post,
    authors: [],
    href: `https://deno.com/blog/${post.slug}`,
  })),
].sort((a, b) => b.date.getTime() - a.date.getTime());

/** Posts published here, keyed by slug. Drafts are only included in dev. */
export const LOCAL_POSTS_BY_SLUG: ReadonlyMap<string, BlogPost> = new Map(
  LOCAL_POSTS.filter((post) => import.meta.env.DEV || !post.draft).map((post) => [post.slug, post]),
);

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
