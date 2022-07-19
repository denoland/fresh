/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Post } from "types/blog.ts";
import Tag from "./Tag.tsx";
import BlogAuthor from "./BlogAuthor.tsx";
export default function BlogPost({
  description,
  postedAt,
  poster,
  tags,
  title,
  slug,
  authorAvatar,
  authorName,
}: Post) {
  return (
    <a
      href={`/${slug}`}
      className={tw`border shadow rounded-lg dark:border-gray-700 dark:bg-gray-800`}
    >
      <article>
        <img
          src={poster}
          alt={"Poster image"}
          className={tw`blog-post--img object-fit rounded-t-lg`}
        />

        <div className={tw`p-4`}>
          <p
            className={tw`dark:text-gray-100 text-xl font-medium hover:underline`}
          >
            {title}
          </p>
          <p className={tw`mt-2 text-gray-500 dark:text-gray-400`}>
            {postedAt}
          </p>

          <p className={tw`text-lg text-gray-600 mt-2 dark:text-gray-300 `}>
            {description}
          </p>

          <div className={tw`mt-4 flex flex-wrap gap-4`}>
            {tags.map((tag) => (
              <Tag title={tag} key={tag} />
            ))}
          </div>

          <div className="mt-4">
            <BlogAuthor authorAvatar={authorAvatar} authorName={authorName} />
          </div>
        </div>
      </article>
    </a>
  );
}
