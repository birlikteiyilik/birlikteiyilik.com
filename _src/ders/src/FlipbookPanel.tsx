import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { BookFlipbook, type FlipbookHandle } from "./BookFlipbook";
import { bookPageImage, bookPdfHref, type Book } from "./books";

export type FlipbookPanelHandle = { goTo: (page: number) => void };

type Props = {
  book: Book;
  initialPage: number;
  /** URL parameter that keeps the open page; leave empty to keep the URL unchanged. */
  pageParam?: string;
  onPageChange?: (page: number, spread: boolean) => void;
  /** Optional label for the page selector, e.g. the source page number of a text book. */
  pageLabel?: (page: number) => string;
  toolbarExtra?: ReactNode;
};

function ZoomedTextPage({ book, page }: { book: Book; page: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host || !book.renderPage) return;
    host.replaceChildren(book.renderPage(page));
  }, [book, page]);
  return <div className="reader-zoom-text" ref={ref} />;
}

function ZoomedImagePage({ book, page, onError }: { book: Book; page: number; onError: () => void }) {
  return (
    <div className="reader-zoom-figure" style={{ width: `max(100%, ${book.width}px)` }}>
      <img src={bookPageImage(book, page)} alt={`${book.imageLabel}, ${page}. sayfa`} width={book.width} height={book.height} onError={onError} />
      {(book.pageLinks?.[page] || []).map((link, index) => {
        const [left, top, right, bottom] = link.rect;
        return <a key={index} className="flipbook-link" href={link.href} target="_blank" rel="noopener noreferrer" title={link.label} aria-label={`${link.label} (yeni sekmede açılır)`} style={{ left: `${left}%`, top: `${top}%`, width: `${right - left}%`, height: `${bottom - top}%` }} />;
      })}
    </div>
  );
}

export const FlipbookPanel = forwardRef<FlipbookPanelHandle, Props>(function FlipbookPanel({ book, initialPage, pageParam = "sayfa", onPageChange, pageLabel, toolbarExtra }, ref) {
  const { pageCount } = book;
  const isRtl = book.direction === "rtl";
  const pdfHref = bookPdfHref(book);
  const [page, setPage] = useState(initialPage);
  const [zoomed, setZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [spread, setSpread] = useState(false);
  const [turning, setTurning] = useState(false);
  const bookRef = useRef<FlipbookHandle>(null);
  const initialPageRef = useRef(initialPage);
  const isLastPage = page + (spread ? 1 : 0) >= pageCount;

  useImperativeHandle(ref, () => ({ goTo: (target: number) => bookRef.current?.goTo(Math.max(1, Math.min(pageCount, target))) }), [pageCount]);

  useEffect(() => {
    if (pageParam) {
      const url = new URL(window.location.href);
      url.searchParams.set(pageParam, String(page));
      window.history.replaceState({}, "", url);
    }
    setImageError(false);
  }, [page, pageParam]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.matches("input, select, textarea") || event.target.isContentEditable)) return;
      if (event.key === (isRtl ? "ArrowLeft" : "ArrowRight") || event.key === "PageDown") {
        event.preventDefault(); bookRef.current?.next();
      } else if (event.key === (isRtl ? "ArrowRight" : "ArrowLeft") || event.key === "PageUp") {
        event.preventDefault(); bookRef.current?.previous();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isRtl]);

  const label = (value: number) => pageLabel ? pageLabel(value) : String(value);

  return (
    <div className="reader-main">
      <div className="reader-toolbar" aria-label="Kitap sayfa araçları">
        {toolbarExtra && <div className="reader-toolbar-extra">{toolbarExtra}</div>}
        <div className="reader-pagination" role="group" aria-label="Sayfa seçimi ve geçişi" dir={book.direction}>
          <button onClick={() => bookRef.current?.previous()} disabled={page === 1 || turning} aria-label="Önceki sayfa">{isRtl ? "Önceki →" : "← Önceki"}</button>
          <label className="reader-page-select"><span>Sayfa</span><select value={page} disabled={turning} aria-label="Sayfa seçin" onChange={(event) => bookRef.current?.goTo(Number(event.target.value))}>{Array.from({ length: pageCount }, (_, index) => <option key={index + 1} value={index + 1}>{label(index + 1)}</option>)}</select><span>{spread ? `–${page + 1} / ${pageCount}` : `/ ${pageCount}`}</span></label>
          <button onClick={() => bookRef.current?.next()} disabled={isLastPage || turning} aria-label="Sonraki sayfa">{isRtl ? "← Sonraki" : "Sonraki →"}</button>
        </div>
        <button className="reader-zoom" aria-pressed={zoomed} onClick={() => setZoomed((current) => !current)}>{zoomed ? "Sayfaya sığdır" : "Yakınlaştır +"}</button>
      </div>
      <div className={`reader-page ${zoomed ? "is-zoomed" : ""}`}>
        <BookFlipbook ref={bookRef} book={book} initialPage={initialPageRef.current} onPageChange={(nextPage, hasSpread) => { setPage(nextPage); setSpread(hasSpread); onPageChange?.(nextPage, hasSpread); }} onTurningChange={setTurning} />
        {zoomed && <div className="reader-zoom-view">
          {book.renderPage ? <ZoomedTextPage book={book} page={page} />
            : imageError ? <div className="empty-state"><p>Bu sayfa yüklenemedi.{pdfHref && " Kitabı PDF olarak açabilirsiniz."}</p>{pdfHref && <a href={`${pdfHref}#page=${page}`} target="_blank" rel="noopener noreferrer">PDF’yi aç →</a>}</div>
            : <ZoomedImagePage key={page} book={book} page={page} onError={() => setImageError(true)} />}
        </div>}
      </div>
      <nav className="reader-mobile-nav" aria-label="Sayfa geçişi" dir={book.direction}>
        <button onClick={() => bookRef.current?.previous()} disabled={page === 1 || turning} aria-label="Önceki sayfa">{isRtl ? "Önceki sayfa →" : "← Önceki sayfa"}</button>
        <button className="reader-mobile-next" onClick={() => bookRef.current?.next()} disabled={isLastPage || turning} aria-label="Sonraki sayfa">{isRtl ? "← Sonraki sayfa" : "Sonraki sayfa →"}</button>
      </nav>
      <span className="reader-status" role="status" aria-live="polite">{spread ? `${page}–${page + 1}` : page} / {pageCount}</span>
    </div>
  );
});
