import { handler } from "./$feed.ts";
import { escape } from "@std/html";
import { POSTS } from "../../data/blog.ts";

/** Atom feed of every post — Deno blog entries link out to deno.com. */
export const handlers = handler({
  GET(ctx) {
    const origin = ctx.url.origin;
    const entries = POSTS.map((post) => {
      const href = new URL(post.href, origin).href;
      const date = post.date.toISOString();
      const authors = post.authors
        .map((name) => `<author><name>${escape(name)}</name></author>`)
        .join("");
      return `<entry><id>${escape(href)}</id><title>${escape(post.title)}</title><link href="${escape(href)}"/><published>${date}</published><updated>${date}</updated><summary>${escape(post.description)}</summary>${authors}</entry>`;
    });
    const updated = (POSTS[0]?.date ?? new Date(0)).toISOString();
    const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><id>${origin}/blog</id><title>Fresh blog</title><updated>${updated}</updated><author><name>The Fresh authors</name></author><link rel="alternate" href="${origin}/blog"/><link rel="self" href="${origin}/blog/feed"/>${entries.join("")}</feed>
`;
    return new Response(body, {
      headers: { "content-type": "application/atom+xml; charset=utf-8" },
    });
  },
});
