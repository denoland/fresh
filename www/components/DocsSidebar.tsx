import {
  CATEGORIES,
  TableOfContentsCategory,
  TableOfContentsCategoryEntry,
} from "../data/docs.ts";
import SearchButton from "../islands/SearchButton.tsx";
import VersionSelect from "../islands/VersionSelect.tsx";
import { type VersionLink } from "../routes/docs/[...slug].tsx";

export default function DocsSidebar(
  props: {
    path: string;
    mobile?: boolean;
    versionLinks: VersionLink[];
    selectedVersion: string;
  },
) {
  return (
    <>
      {props.mobile
        ? (
          <button
            type="button"
            class="bg-gray-200 font-bold text-gray-400 rounded-full py-1 px-2 w-full mb-2"
          >
            <script
              dangerouslySetInnerHTML={{
                __html:
                  `document.currentScript.parentNode.onclick = function () {
                    document.querySelector(".DocSearch.DocSearch-Button").click()
                  }`,
              }}
            />
            <span class="DocSearch-Button-Container">
              <svg
                width="20"
                height="20"
                class="DocSearch-Search-Icon"
                viewBox="0 0 20 20"
              >
                <path
                  d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z"
                  stroke="currentColor"
                  fill="none"
                  fill-rule="evenodd"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                </path>
              </svg>
              <span class="DocSearch-Button-Placeholder">Search</span>
            </span>
          </button>
        )
        : <SearchButton class="lg:hidden" />}

      <div class="mb-4">
        <VersionSelect
          selectedVersion={props.selectedVersion}
          versions={props.versionLinks}
        />
      </div>

      <ol class="list-decimal list-inside font-semibold nested ml-2.5">
        {CATEGORIES[props.selectedVersion].map((category) => (
          <SidebarCategory path={props.path} category={category} />
        ))}
      </ol>
    </>
  );
}

const link = "text(gray-900 hover:gray-600)";
const linkActive = "text-green-700 hover:underline font-bold";

export function SidebarCategory(props: {
  path: string;
  category: TableOfContentsCategory;
}) {
  const { title, href, entries } = props.category;

  const outerLink = `${href == props.path ? linkActive : link} font-bold`;

  return (
    <li class="my-2 block">
      <a href={href} class={outerLink}>
        {title}
      </a>
      {entries.length > 0 && (
        <ol class="pb-2 pl-4 list-decimal nested list-outside">
          {entries.map((entry) => (
            <SidebarEntry path={props.path} entry={entry} />
          ))}
        </ol>
      )}
    </li>
  );
}

export function SidebarEntry(props: {
  path: string;
  entry: TableOfContentsCategoryEntry;
}) {
  const { title, href } = props.entry;

  const innerLink = `${
    href == props.path ? linkActive : link
  } transition-colors hover:text-green-500 font-normal`;

  return (
    <li class="py-0.5">
      <a href={href} class={innerLink}>{title}</a>
    </li>
  );
}
