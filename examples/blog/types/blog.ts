export type Post = {
  slug: string;
  title: string;
  poster: string;
  description: string;
  postedAt: string;
  tags: string[];
  authorName: string;
  authorAvatar: string;
};

export type PostDetail = {
  slug: string;
  title: string;
  poster: string;
  description: string;
  postedAt: string;
  tags: string[];
  content: string;
  authorName: string;
  authorAvatar: string;
};
