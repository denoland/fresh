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
        : <SearchButton />}

      <div class="mb-4">
        <VersionSelect
          selectedVersion={props.selectedVersion}
          versions={props.versionLinks}
        />
      </div>

      <ul class="list-inside font-semibold nested ml-2.5">
        {CATEGORIES[props.selectedVersion].map((category) => (
          <SidebarCategory key={category.href} category={category} />
        ))}
      </ul>
    </>
  );
}

export function SidebarCategory(props: {
  category: TableOfContentsCategory;
}) {
  const { title, href, entries } = props.category;

  return (
    <li class="my-2 block">
      <a
        href={href}
        class="text(gray-900 hover:gray-600) [data-current]:text-green-700 [data-current]:hover:underline font-bold"
      >
        {title}
      </a>
      {entries.length > 0 && (
        <ul class="py-2 nested list-outside">
          {entries.map((entry) => (
            <SidebarEntry key={entry.href} entry={entry} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SidebarEntry(props: {
  entry: TableOfContentsCategoryEntry;
}) {
  const { title, href } = props.entry;

  return (
    <li class="py-[1px]">
      <a
        href={href}
        class="[data-current]:text-green-700 [data-current]:border-green-600 [data-current]:bg-green-50 border-l-4 border-transparent px-4 py-0.5 transition-colors hover:text-green-500 font-normal block"
      >
        {title}
      </a>
    </li>
  );
}
