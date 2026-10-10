export type Book = {
  title: string;
  imageLabel: string;
  pageCount: number;
  width: number;
  height: number;
  direction: "ltr" | "rtl";
  imageFolder: string;
  pdfFile: string;
  downloadName: string;
};

export const elifBaBook: Book = {
  title: "Elif Ba", imageLabel: "Elif Ba müfredatı", pageCount: 56,
  width: 1273, height: 1800, direction: "rtl",
  imageFolder: "elif-ba-pages", pdfFile: "elif-ba-mufredat.pdf",
  downloadName: "Elif-Ba-Mufredatimiz.pdf",
};

export const quranBook: Book = {
  title: "Kur’an-ı Kerim", imageLabel: "Kur’an-ı Kerim", pageCount: 615,
  width: 1244, height: 1800, direction: "ltr",
  imageFolder: "kuran-i-kerim-pages", pdfFile: "kuran-i-kerim.pdf",
  downloadName: "Kuran-i-Kerim.pdf",
};

const assets = `${import.meta.env.BASE_URL}assets/`;
export const bookPdfHref = (book: Book) => `${assets}${book.pdfFile}`;
export const bookPageImage = (book: Book, page: number) => `${assets}${book.imageFolder}/page-${String(page).padStart(String(book.pageCount).length, "0")}.webp`;
