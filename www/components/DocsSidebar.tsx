import {
  CATEGORIES,
  TableOfContentsCategory,
  TableOfContentsCategoryEntry,
} from "../data/docs.ts";
import SearchButton from "../islands/SearchButton.tsx";
import VersionSelect from "../islands/VersionSelect.tsx";
import { type VersionLink } from "../routes/docs/[...slug].tsx";
import { Logo } from "$fresh/www/components/Header.tsx";
import DocsTitle from "$fresh/www/components/DocsTitle.tsx";

export default function DocsSidebar(
  props: {
    mobile?: boolean;
    versionLinks: VersionLink[];
    selectedVersion: string;
  },
) {
  return (
    <>
      <div class="fixed  w-[17rem] md:flex h-screen overflow-hidden ">
        <div class="flex-1  h-screen overflow-y-auto">
          <div class="sticky mb-4 top-0 bg-white z-10">
            <div class=" py-4 flex items-center">
              <Logo />
              <DocsTitle />
            </div>
            <hr />
          </div>
          <SearchButton class="mr-4 sm:mr-0" />
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
        </div>
      </div>
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
