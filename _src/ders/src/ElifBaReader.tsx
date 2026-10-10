import { useEffect, useState } from "react";

const pageCount = 56;
const assets = `${import.meta.env.BASE_URL}assets/`;
const pdfHref = `${assets}elif-ba-mufredat.pdf`;
const clampPage = (page: number) => Number.isFinite(page) ? Math.max(1, Math.min(pageCount, Math.trunc(page))) : 1;

export function ElifBaReader({ homeHref }: { homeHref: string }) {
  const [page, setPage] = useState(() => clampPage(Number(new URLSearchParams(window.location.search).get("sayfa")) || 1));
  const [zoomed, setZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("sayfa", String(page));
    window.history.replaceState({}, "", url);
    setImageError(false);
  }, [page]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.matches("input, select, textarea") || event.target.isContentEditable)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault(); setPage((current) => clampPage(current + 1));
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault(); setPage((current) => clampPage(current - 1));
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
        <div className="reader-toolbar" aria-label="Kitap sayfa araçları">
          <button onClick={() => setPage((current) => clampPage(current - 1))} disabled={page === 1} aria-label="Önceki sayfa">← <span>Önceki</span></button>
          <label className="reader-page-select"><span>Sayfa</span><select value={page} aria-label="Sayfa seçin" onChange={(event) => setPage(Number(event.target.value))}>{Array.from({ length: pageCount }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select><span>/ {pageCount}</span></label>
          <button onClick={() => setPage((current) => clampPage(current + 1))} disabled={page === pageCount} aria-label="Sonraki sayfa"><span>Sonraki</span> →</button>
          <button className="reader-zoom" aria-pressed={zoomed} onClick={() => setZoomed((current) => !current)}>{zoomed ? "Sayfaya sığdır" : "Yakınlaştır +"}</button>
        </div>
        <div className={`reader-page ${zoomed ? "is-zoomed" : ""}`}>
          {imageError ? <div className="empty-state"><p>Bu sayfa yüklenemedi. Kitabı PDF olarak açabilirsiniz.</p><a href={`${pdfHref}#page=${page}`} target="_blank" rel="noopener noreferrer">PDF’yi aç →</a></div> : <img key={page} src={`${assets}elif-ba-pages/page-${String(page).padStart(2, "0")}.webp`} alt={`Elif Ba müfredatı, ${page}. sayfa`} width="1272" height="1800" onError={() => setImageError(true)} />}
        </div>
        <span className="reader-status" role="status" aria-live="polite">{page} / {pageCount}</span>
      </main>
    </div>
  );
}
