/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";

export default function Tag({ title }: { title: string }) {
  return (
    <p
      className={tw`text-xs rounded-full px-3 py-1 border dark:text-gray-300 uppercase dark:border-gray-400 dark:text-gray-400`}
    >
      {title}
    </p>
  );
}
