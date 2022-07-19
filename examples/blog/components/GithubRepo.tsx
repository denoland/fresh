/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";

interface GithubRepoProps {
  id: number;
  name: string;
  description: string;
  language: string;
  isPrivate: boolean;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
}
export default function GithubRepo({
  name,
  description,
  language,
  isPrivate,
  stargazers_count,
  forks_count,
  html_url,
}: GithubRepoProps) {
  return (
    <article className={tw`border  rounded-lg p-4 dark:border-gray-700`}>
      <div className={tw`flex items-center justify-between`}>
        <a
          href={html_url}
          target="_blank"
          className={tw`font-bold block flex-1 dark:text-gray-100 hover:underline`}
        >
          {name}
        </a>

        <p
          className={tw`text-xs px-2 py-1 border text-gray-500 dark:text-gray-400 rounded-full dark:border-gray-400`}
        >
          {isPrivate ? "Private" : "Public"}
        </p>
      </div>

      <p className={tw`mt-4 text-sm text-gray-500 dark:text-gray-400`}>{description}</p>

      <div className={tw`mt-4 flex items-center space-x-4 `}>
        <div>
          <p className={tw`text-sm text-gray-500 dark:text-gray-400`}> {language}</p>
        </div>
        <div className={tw`flex items-center space-x-2`}>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="gray"
            >
              <path
                fill-rule="evenodd"
                d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"
              ></path>
            </svg>
          </div>
          <p className={tw`text-xs dark:text-gray-300`}>{stargazers_count}</p>
        </div>
        <div className={tw`flex items-center space-x-2`}>
          <div>
            <svg
              aria-label="forks"
              role="img"
              height="16"
              viewBox="0 0 16 16"
              version="1.1"
              width="16"
              data-view-component="true"
              fill="gray"
            >
              <path
                fill-rule="evenodd"
                d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"
              ></path>
            </svg>
          </div>
          <p className={tw`text-xs dark:text-gray-300`}>{forks_count}</p>
        </div>
      </div>
    </article>
  );
}
