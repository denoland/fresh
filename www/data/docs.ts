import RAW_TOC from "../../docs/toc.json" assert { type: "json" };

export type TableOfContents = Record<string, TableOfContentsEntry>;

export interface TableOfContentsEntry {
  title: string;
  pages?: [string, string][];
}

export const TOC = RAW_TOC as unknown as TableOfContents;
