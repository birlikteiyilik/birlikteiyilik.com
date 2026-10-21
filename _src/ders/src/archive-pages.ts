import type { ArchivePage } from "./lesson-guide";

export function readableArchivePages(pages: ArchivePage[]): ArchivePage[] {
  return pages.filter((page) => page.text.trim().length > 0);
}
