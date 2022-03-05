/** @jsx h */

import { apply, h, tw } from "../client_deps.ts";
import { TableOfContentsEntry, TOC } from "../data/docs.ts";

export default function DocsSidebar(props: { path: string }) {
  return (
    <aside class={tw`col-span-2 py-8 pr-4 border(r-2 gray-100)`}>
      <ol class={tw`list-decimal list-inside font-semibold` + " nested"}>
        {Object.entries(TOC).map(([id, entry]) => (
          <SidebarEntry
            id={id}
            path={props.path}
            entry={entry}
          />
        ))}
      </ol>
    </aside>
  );
}

export function SidebarEntry(props: {
  id: string;
  path: string;
  entry: TableOfContentsEntry;
}) {
  const pages = props.entry.pages;
  const outerItem = tw`my-2 block`;
  const link = apply`text(gray-900 hover:gray-600) font-bold`;
  const linkActive = apply`text(blue-600 hover:blue-500) font-bold`;
  const innerList = tw`pl-4 list-decimal` + " nested";
  const innerItem = tw`my-0.5`;
  const href = `/docs/${props.id}`;

  const outerLink = tw`${href == props.path ? linkActive : link} font-bold`;

  return (
    <li class={outerItem}>
      <a href={href} class={outerLink}>
        {props.entry.title}
      </a>
      {pages && (
        <ol class={innerList}>
          {pages.map(([id, title]) => {
            const href = `/docs/${props.id}/${id}`;
            const innerLink = tw`${
              href == props.path ? linkActive : link
            } font-normal`;
            return (
              <li class={innerItem}>
                <a href={`/docs/${props.id}/${id}`} class={innerLink}>
                  {title}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </li>
  );
}
