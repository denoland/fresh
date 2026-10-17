# Fresh website

This is the Fresh website source. The Fresh website contains:

- a homepage
- a documentation page
- a blog

### Usage

Start the development server:

```
deno task dev
```

This will watch the project directory and restart as necessary.

### Writing a blog post

Add a markdown file to `blog/`. The file name is the URL slug, so `blog/fresh-3.0.md` is served at `/blog/fresh-3.0`. Every post needs front matter:

```md
---
title: Fresh 3.0
description: One or two sentences, shown on the index and in the feed.
date: 2026-11-01
authors:
  - Luca Casonato
image: /blog/fresh-3.0/header.png
---
```

`authors`, `image` and `draft` are optional. `image` is a path to a file in `public/` (put it in `public/blog/<slug>/`); it's shown on the index, at the top of the post, and used as the post's `og:image`. Posts show up on `/blog` and in the Atom feed at `/blog/feed`, sorted by `date` together with the older posts that live on the Deno blog (listed in `data/blog.ts`). Set `draft: true` to keep a post off the index and feed; drafts are still served at their URL in dev so you can preview them, but 404 in production.
