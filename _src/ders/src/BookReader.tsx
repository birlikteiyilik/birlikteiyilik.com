import type { ReactNode } from "react";
import { FlipbookPanel } from "./FlipbookPanel";
import { bookPdfHref, type Book } from "./books";

export type BookChoice = { title: string; href: string; active: boolean };

export function ReaderHeading({ homeHref, title, pdfHref, downloadName }: { homeHref: string; title: string; pdfHref?: string; downloadName?: string }) {
  return (
    <header className="reader-heading">
      <a className="reader-back" href={homeHref} aria-label="Kitap seçimine dön">← <span>Kitap seçimi</span></a>
      <h1>{title}</h1>
      {pdfHref && <div className="reader-file-actions"><a href={pdfHref} target="_blank" rel="noopener noreferrer" aria-label="PDF’yi aç">PDF ↗</a><a className="reader-download" href={pdfHref} download={downloadName} aria-label="PDF indir">İndir ↓</a></div>}
    </header>
  );
}

export function BookChoices({ choices, label }: { choices: BookChoice[]; label: string }) {
  return (
    <nav className="reader-book-choices" aria-label={label}>
      {choices.map((choice) => <a key={choice.href} href={choice.href} aria-current={choice.active ? "page" : undefined}>{choice.title}</a>)}
    </nav>
  );
}

export function BookReader({ homeHref, book, bookChoices, choicesLabel = "Elif Ba kitap seçimi", title, children }: { homeHref: string; book?: Book; bookChoices?: BookChoice[]; choicesLabel?: string; title?: string; children?: ReactNode }) {
  const initialPage = (() => {
    if (!book) return 1;
    const page = Number(new URLSearchParams(window.location.search).get("sayfa")) || 1;
    return Number.isFinite(page) ? Math.max(1, Math.min(book.pageCount, Math.trunc(page))) : 1;
  })();
  return (
    <div className="reader-shell">
      <ReaderHeading homeHref={homeHref} title={title || book?.title || ""} pdfHref={book ? bookPdfHref(book) : undefined} downloadName={book?.downloadName} />
      {bookChoices && <BookChoices choices={bookChoices} label={choicesLabel} />}
      {book ? <FlipbookPanel key={book.id} book={book} initialPage={initialPage} /> : children}
    </div>
  );
}
