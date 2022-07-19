/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";

export default function BlogAuthor({
  authorName,
  authorAvatar,
}: {
  authorAvatar: string;
  authorName: string;
}) {
  return (
    <div className={tw`flex items-center space-x-3`}>
      <img
        src={authorAvatar}
        alt={authorName}
        className={tw`w-12 h=12 rounded-full`}
      />
      <div>
        <h2 className={tw`font-medium`}>{authorName}</h2>
        <p className={tw`text-gray-500 text-sm dark:text-gray-400`}>Author</p>
      </div>
    </div>
  );
}
