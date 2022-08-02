/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Author } from "types/author.ts";
export default function BlogAuthor({
  authorName,
  authorAvatar,
}: Author) {
  return (
    <div class={tw`flex items-center space-x-3`}>
      <img
        src={authorAvatar}
        alt={authorName}
        class={tw`w-12 h=12 rounded-full`}
      />
      <div>
        <h2 class={tw`font-medium`}>{authorName}</h2>
        <p class={tw`text-gray-500 text-sm dark:text-gray-400`}>Author</p>
      </div>
    </div>
  );
}
