import { useEffect, useRef } from "preact/hooks";
import { SidebarCategory } from "../components/DocsSidebar.tsx";
import SearchButton from "./SearchButton.tsx";
import VersionSelect from "./VersionSelect.tsx";
import type { TableOfContentsCategory } from "../data/docs.ts";

interface DynamicSidebarProps {
  page: {
    version: string;
    versionLinks: Array<{
      label: string;
      href: string;
      value: string;
    }>;
  };
  categories: TableOfContentsCategory[];
}

export default function DynamicSidebar(
  { page, categories }: DynamicSidebarProps,
) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!sidebarRef.current) return;

          const scrollY = globalThis.scrollY || 0;
          const helloBarHeight = 60; // HelloBar height
          const headerHeight = 80; // Header height
          const initialTop = 156; // 9.75rem = 156px

          // calculate scroll progress
          const scrollProgress = Math.min(scrollY / helloBarHeight, 1);

          // use easing function for smoother animation
          const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
          const easedProgress = easeOutCubic(scrollProgress);

          // calculate new top position, smoothly transitioning from 156px to 80px
          const targetTop = initialTop - (helloBarHeight * easedProgress);
          const newTop = Math.max(headerHeight, targetTop);

          sidebarRef.current.style.top = `${newTop}px`;

          // dynamically adjust height
          const contentHeight = `calc(100vh - ${newTop}px)`;
          const contentEl = sidebarRef.current.querySelector(
            ".sidebar-content",
          ) as HTMLElement;
          if (contentEl) {
            contentEl.style.height = contentHeight;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    globalThis.addEventListener?.("scroll", handleScroll, { passive: true });

    return () => {
      globalThis.removeEventListener?.("scroll", handleScroll);
    };
  }, []);
  return (
    <nav class="flex-shrink-0 hidden lg:block lg:px-4 bg-white">
      <div
        ref={sidebarRef}
        class="fixed top-[9.75rem] w-[17rem] flex overflow-hidden z-40"
        style="will-change: transform; backface-visibility: hidden;"
      >
        <div
          class="sidebar-content flex-1 overflow-y-auto pb-8"
          style="height: calc(100vh - 9.75rem);"
        >
          <SearchButton class="mr-4 sm:mr-0" />
          <div class="mb-4 px-1">
            <VersionSelect
              selectedVersion={page.version}
              versions={page.versionLinks}
            />
          </div>
          <ul class="list-inside font-semibold nested ml-2.5">
            {categories.map((category) => (
              <SidebarCategory key={category.href} category={category} />
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
