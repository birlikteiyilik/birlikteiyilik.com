import type { ArchivePage } from "./lesson-guide.ts";

export type ArchiveTopic = { title: string; page: number };
/** Pages are 1-based positions in the readable page list, i.e. flipbook pages. */
export type ArchiveWeek = { week: number; startPage: number; endPage: number; topics: ArchiveTopic[] };

const storyPrefix = /^(menk[ıi]be|hik[âa]ye|n[üu]kte|k[ıi]ssa|●)/i;

function firstLines(text: string) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 2);
}

/** The topic title that opens a page, or null for a continuation or story page. */
export function pageHeading(text: string) {
  const [first = "", second = ""] = firstLines(text);
  if (!isTopicHeading(first)) return null;
  // "Konu:" can stand alone with the title on the next line.
  return /^konu\s*[:.]?\s*$/i.test(first) && second ? topicTitle(second) : topicTitle(first);
}

/** A content page that opens a new topic starts with "Konu:" or an upper-case title line. */
export function isTopicHeading(line: string) {
  if (/^konu\b/i.test(line)) return true;
  if (storyPrefix.test(line) || line.length >= 90) return false;
  const letters = [...line].filter((char) => /\p{L}/u.test(char));
  if (letters.length < 4) return false;
  return letters.filter((char) => char === char.toLocaleUpperCase("tr-TR") && char !== char.toLocaleLowerCase("tr-TR")).length / letters.length > 0.75;
}

export function topicTitle(line: string) {
  const title = line.replace(/^konu\s*[:.]?\s*/i, "").replace(/\s*[:,]\s*$/, "").trim() || line.trim();
  const letters = [...title].filter((char) => /\p{L}/u.test(char));
  const upper = letters.filter((char) => char === char.toLocaleUpperCase("tr-TR") && char !== char.toLocaleLowerCase("tr-TR")).length;
  const readable = upper / Math.max(1, letters.length) > 0.75
    ? title.toLocaleLowerCase("tr-TR").replace(/(^|[\s/(–-])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toLocaleUpperCase("tr-TR"))
    : title.charAt(0).toLocaleUpperCase("tr-TR") + title.slice(1);
  return readable.replace(/\bTe[âa]l[âa]/g, (word) => `t${word.slice(1)}`).replace(/\s+/g, " ");
}

/**
 * Splits a month's content document into four teaching weeks. The original files hold the
 * month's topics in order (normally 20, five per week), so weeks follow topic starts; when a
 * file has too few recognisable topic titles, the pages are divided evenly instead.
 */
export function archiveWeeks(pages: ArchivePage[], weekCount = 4): ArchiveWeek[] {
  const total = pages.length;
  if (!total) return [];
  const heads = pages.flatMap((page, index) => {
    const title = pageHeading(page.text);
    return title ? [{ title, page: index + 1 }] : [];
  });
  // Several lessons can share one title in the source (e.g. five "Namâzın Rükünleri" lessons); number them.
  const counts = new Map<string, number>();
  heads.forEach((head) => counts.set(head.title, (counts.get(head.title) || 0) + 1));
  const seen = new Map<string, number>();
  heads.forEach((head) => {
    if ((counts.get(head.title) || 0) < 2) return;
    const order = (seen.get(head.title) || 0) + 1;
    seen.set(head.title, order);
    head.title = `${head.title} · ${order}`;
  });
  const starts = [1];
  for (let week = 1; week < weekCount; week++) {
    const previous = starts[week - 1];
    const candidate = heads.length >= weekCount
      ? heads[Math.floor((week * heads.length) / weekCount)].page
      : 1 + Math.round((week * total) / weekCount);
    starts.push(Math.min(total, Math.max(previous + 1, candidate)));
  }
  const distinct = starts.filter((start, index) => index === 0 || start > starts[index - 1]);
  return distinct.map((startPage, index) => {
    const endPage = index + 1 < distinct.length ? distinct[index + 1] - 1 : total;
    return { week: index + 1, startPage, endPage, topics: heads.filter((head) => head.page >= startPage && head.page <= endPage) };
  });
}

export function weekAtPage(weeks: ArchiveWeek[], page: number) {
  return weeks.find((week) => page >= week.startPage && page <= week.endPage) || weeks[0];
}
