/** A clickable area on a page, given as percentages of the page: [left, top, right, bottom]. */
export type PageLink = { href: string; label: string; rect: [number, number, number, number] };

export type Book = {
  /** Stable identity; the flipbook is rebuilt when it changes. */
  id: string;
  title: string;
  imageLabel: string;
  pageCount: number;
  width: number;
  height: number;
  direction: "ltr" | "rtl";
  imageFolder?: string;
  pdfFile?: string;
  downloadName?: string;
  /** Wide pages read best one at a time, so they are never paired into spreads. */
  singlePage?: boolean;
  pageLinks?: Record<number, PageLink[]>;
  /** Text books draw their own leaves instead of loading page images. */
  renderPage?: (page: number) => HTMLElement;
};

export const elifBaBook: Book = {
  id: "elif-ba", title: "Elifba", imageLabel: "Elifba", pageCount: 56,
  width: 1273, height: 1800, direction: "rtl",
  imageFolder: "elif-ba-pages", pdfFile: "elif-ba-mufredat.pdf",
  downloadName: "Elifba.pdf",
};

export const mehmedMertElifBaBook: Book = {
  id: "elif-ba-mehmed-mert", title: "Elifba Mehmed Mert", imageLabel: "Elifba Mehmed Mert", pageCount: 51,
  width: 1314, height: 1800, direction: "rtl",
  imageFolder: "elifba-mehmed-mert-pages", pdfFile: "elifba-mehmed-mert.pdf",
  downloadName: "Elifba-Mehmed-Mert.pdf",
};

export const karabasTecvidBook: Book = {
  id: "karabas-tecvid", title: "Karabaş Tecvid", imageLabel: "Karabaş Tecvid", pageCount: 52,
  width: 1272, height: 1800, direction: "rtl",
  imageFolder: "karabas-tecvid-pages", pdfFile: "karabas-tecvid.pdf",
  downloadName: "Karabas-Tecvid.pdf",
};

export const quranBook: Book = {
  id: "kuran-i-kerim", title: "Kur’an-ı Kerim", imageLabel: "Kur’an-ı Kerim", pageCount: 615,
  width: 1244, height: 1800, direction: "rtl",
  imageFolder: "kuran-i-kerim-pages", pdfFile: "kuran-i-kerim.pdf",
  downloadName: "Kuran-i-Kerim.pdf",
};

const assets = `${import.meta.env.BASE_URL}assets/`;
export const bookPdfHref = (book: Book) => book.pdfFile ? `${assets}${book.pdfFile}` : "";
export const bookPageImage = (book: Book, page: number) => `${assets}${book.imageFolder}/page-${String(page).padStart(String(book.pageCount).length, "0")}.webp`;
