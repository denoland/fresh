import {
  CATEGORIES,
  TableOfContentsCategory,
  TableOfContentsCategoryEntry,
} from "../data/docs.ts";
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
    <div class="fixed w-[18rem] flex h-[calc(100vh_-_4rem)] top-16">
      <div class="h-full relative">
        <div class="absolute left-0 top-0 right-0 h-[1px] mr-4 bg-gray-200" />
        <div
          class="h-full pr-4 overflow-y-auto"
          style="scrollbar-width: thin;"
        >
          <div class="pt-7 pb-16">
            <VersionSelect
              selectedVersion={props.selectedVersion}
              versions={props.versionLinks}
            />
            <ul class="list-inside font-semibold nested mt-4 ml-2.5">
              {CATEGORIES[props.selectedVersion].map((category) => (
                <SidebarCategory key={category.href} category={category} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
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
        class="text-gray-900 hover:text-gray-600 aria-[current]:text-green-700 aria-[current]:hover:underline font-bold"
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
        class="aria-[current]:text-green-700 aria-[current]:border-green-600 aria-[current]:bg-green-50 border-l-4 border-transparent px-4 py-0.5 transition-colors hover:text-green-500 font-normal block"
      >
        {title}
      </a>
    </li>
  );
}
