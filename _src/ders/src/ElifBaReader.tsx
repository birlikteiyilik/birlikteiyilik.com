import { useEffect, useRef, useState } from "react";
import { ElifBaFlipbook, elifBaPageImage, type FlipbookHandle } from "./ElifBaFlipbook";

const pageCount = 56;
const assets = `${import.meta.env.BASE_URL}assets/`;
const pdfHref = `${assets}elif-ba-mufredat.pdf`;
const clampPage = (page: number) => Number.isFinite(page) ? Math.max(1, Math.min(pageCount, Math.trunc(page))) : 1;

export function ElifBaReader({ homeHref }: { homeHref: string }) {
  const [page, setPage] = useState(() => clampPage(Number(new URLSearchParams(window.location.search).get("sayfa")) || 1));
  const [zoomed, setZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [spread, setSpread] = useState(false);
  const [turning, setTurning] = useState(false);
  const bookRef = useRef<FlipbookHandle>(null);
  const initialPage = useRef(page);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("sayfa", String(page));
    window.history.replaceState({}, "", url);
    setImageError(false);
  }, [page]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.matches("input, select, textarea") || event.target.isContentEditable)) return;
      if (event.key === "ArrowLeft" || event.key === "PageDown") {
        event.preventDefault(); bookRef.current?.next();
      } else if (event.key === "ArrowRight" || event.key === "PageUp") {
        event.preventDefault(); bookRef.current?.previous();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="reader-shell">
      <header className="reader-heading">
        <a className="reader-back" href={homeHref} aria-label="Kitap seçimine dön">← <span>Kitap seçimi</span></a>
        <h1>Elif Ba</h1>
        <div className="reader-file-actions"><a href={pdfHref} target="_blank" rel="noopener noreferrer" aria-label="PDF’yi aç">PDF ↗</a><a className="reader-download" href={pdfHref} download="Elif-Ba-Mufredatimiz.pdf" aria-label="PDF indir">İndir ↓</a></div>
      </header>
      <main className="reader-main">
        <div className="reader-toolbar" aria-label="Kitap sayfa araçları" dir="rtl">
          <button onClick={() => bookRef.current?.previous()} disabled={page === 1 || turning} aria-label="Önceki sayfa">→ <span>Önceki</span></button>
          <label className="reader-page-select"><span>Sayfa</span><select value={page} disabled={turning} aria-label="Sayfa seçin" onChange={(event) => bookRef.current?.goTo(Number(event.target.value))}>{Array.from({ length: pageCount }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select><span>{spread ? `–${page + 1} / ${pageCount}` : `/ ${pageCount}`}</span></label>
          <button onClick={() => bookRef.current?.next()} disabled={page === pageCount || turning} aria-label="Sonraki sayfa"><span>Sonraki</span> ←</button>
          <button className="reader-zoom" aria-pressed={zoomed} onClick={() => setZoomed((current) => !current)}>{zoomed ? "Sayfaya sığdır" : "Yakınlaştır +"}</button>
        </div>
        <div className={`reader-page ${zoomed ? "is-zoomed" : ""}`}>
          <ElifBaFlipbook ref={bookRef} initialPage={initialPage.current} onPageChange={(nextPage, hasSpread) => { setPage(nextPage); setSpread(hasSpread); }} onTurningChange={setTurning} />
          {zoomed && <div className="reader-zoom-view">{imageError ? <div className="empty-state"><p>Bu sayfa yüklenemedi. Kitabı PDF olarak açabilirsiniz.</p><a href={`${pdfHref}#page=${page}`} target="_blank" rel="noopener noreferrer">PDF’yi aç →</a></div> : <img key={page} src={elifBaPageImage(page)} alt={`Elif Ba müfredatı, ${page}. sayfa`} width="1273" height="1800" onError={() => setImageError(true)} />}</div>}
        </div>
        <nav className="reader-mobile-nav" aria-label="Sayfa geçişi">
          <button className="reader-mobile-next" onClick={() => bookRef.current?.next()} disabled={page === pageCount || turning} aria-label="Sonraki sayfa">← Sonraki sayfa</button>
          <button onClick={() => bookRef.current?.previous()} disabled={page === 1 || turning} aria-label="Önceki sayfa">Önceki sayfa →</button>
        </nav>
        <span className="reader-status" role="status" aria-live="polite">{spread ? `${page}–${page + 1}` : page} / {pageCount}</span>
      </main>
    </div>
  );
}
