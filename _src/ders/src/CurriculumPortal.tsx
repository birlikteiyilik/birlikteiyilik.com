import { useEffect, useMemo, useRef, useState } from "react";
import { bandForGrade, type ArchiveData } from "./lesson-guide";
import { readableArchivePages } from "./archive-pages";
import { archiveWeeks, weekAtPage } from "./archive-weeks";
import { renderArchiveLeaf } from "./archive-leaf";
import { FlipbookPanel, type FlipbookPanelHandle } from "./FlipbookPanel";
import type { Book } from "./books";

export const archiveBookTitle = "Çocuklar ve Gençler İçin Temel Dini Bilgiler";
const grades = [3, 4, 5, 6, 7, 8];
const months = Array.from({ length: 9 }, (_, index) => index + 1);

function readSelection() {
  const params = new URLSearchParams(window.location.search);
  const gradeParam = Number(params.get("sinif"));
  // Older links may still point to grades 1 and 2; they share the 3rd grade sources.
  const grade = Number.isInteger(gradeParam) && gradeParam >= 1 && gradeParam <= 8 ? Math.max(3, gradeParam) : 3;
  const monthParam = Number(params.get("ay"));
  const month = Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 9 ? monthParam : 1;
  const weekParam = Number(params.get("hafta"));
  const week = Number.isInteger(weekParam) && weekParam >= 1 && weekParam <= 4 ? weekParam : 1;
  const pageParam = Number(params.get("sayfa"));
  return { grade, month, week, page: Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 0 };
}

export function CurriculumPortal({ onHomeHref }: { onHomeHref: string }) {
  const initial = useRef(readSelection());
  const [archive, setArchive] = useState<ArchiveData | null>(null);
  const [error, setError] = useState("");
  const [grade, setGrade] = useState(initial.current.grade);
  const [month, setMonth] = useState(initial.current.month);
  const [page, setPage] = useState(0);
  const [start, setStart] = useState({ week: initial.current.week, page: initial.current.page });
  const panelRef = useRef<FlipbookPanelHandle>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/archive.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Arşiv verisi yüklenemedi.");
        return response.json();
      })
      .then((data: ArchiveData) => setArchive(data))
      .catch(() => setError("Kaynak arşivi yüklenemedi. Lütfen sayfayı yenileyin."));
  }, []);

  const source = useMemo(() => {
    if (!archive) return null;
    const band = bandForGrade(grade);
    const plan = archive.plans[band]?.[String(month)];
    const sourceBand = plan?.isExtended ? "7-8" : band;
    return archive.documents.find((item) => item.kind === "content" && item.month === month && item.band === sourceBand) || null;
  }, [archive, grade, month]);

  const pages = useMemo(() => readableArchivePages(source?.pages || []), [source]);
  const weeks = useMemo(() => archiveWeeks(pages), [pages]);
  const missingPages = source?.pages.filter((item) => !item.text.trim()).map((item) => item.number) || [];

  const book = useMemo<Book | null>(() => {
    if (!source || !pages.length) return null;
    const label = `${grade}. Sınıf · ${month}. Ay`;
    return {
      id: `${source.id}-${grade}`, title: archiveBookTitle, imageLabel: archiveBookTitle,
      pageCount: pages.length, width: 1240, height: 1754, direction: "ltr",
      renderPage: (position) => renderArchiveLeaf(pages[position - 1], label, position, pages.length),
    };
  }, [source, pages, grade, month]);

  const initialPage = useMemo(() => {
    if (!weeks.length) return 1;
    if (start.page) return Math.min(pages.length, start.page);
    return weeks.find((item) => item.week === start.week)?.startPage || 1;
  }, [weeks, pages.length, start]);

  const activeWeek = weeks.length ? weekAtPage(weeks, page || initialPage) : null;

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("bolum", "guzel-ahlak");
    url.searchParams.set("sinif", String(grade));
    url.searchParams.set("ay", String(month));
    url.searchParams.delete("ders");
    if (activeWeek) url.searchParams.set("hafta", String(activeWeek.week));
    window.history.replaceState({}, "", url);
  }, [grade, month, activeWeek]);

  useEffect(() => {
    navRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeWeek?.week]);

  const changeSelection = (nextGrade: number, nextMonth: number) => {
    setGrade(nextGrade);
    setMonth(nextMonth);
    setPage(0);
    setStart({ week: 1, page: 0 });
  };

  const openWeek = (week: number) => {
    const target = weeks.find((item) => item.week === week);
    if (target) panelRef.current?.goTo(target.startPage);
  };

  return (
    <div className="archive-book-shell">
      <header className="reader-heading archive-book-heading">
        <a className="reader-back" href={onHomeHref} aria-label="Kitap seçimine dön">← <span>Kitap seçimi</span></a>
        <h1>{archiveBookTitle}</h1>
      </header>
      <section className="archive-book-controls" aria-label="Sınıf ve ay seçimi">
        <label><span>Sınıf</span>
          <select value={grade} onChange={(event) => changeSelection(Number(event.target.value), month)}>
            {grades.map((value) => <option key={value} value={value}>{value}. Sınıf</option>)}
          </select>
        </label>
        <label><span>Ay</span>
          <select value={month} onChange={(event) => changeSelection(grade, Number(event.target.value))}>
            {months.map((value) => <option key={value} value={value}>{value}. Ay</option>)}
          </select>
        </label>
        {missingPages.length > 0 && <p className="archive-book-note" role="note">Özgün dosyada metni bulunmayan sayfalar: {missingPages.join(", ")}.</p>}
      </section>
      <div className="archive-book-body">
        <nav className="archive-week-nav" aria-label="Hafta seçimi" ref={navRef}>
          {weeks.map((item) => (
            <button key={item.week} className={activeWeek?.week === item.week ? "active" : ""} aria-current={activeWeek?.week === item.week ? "true" : undefined} onClick={() => openWeek(item.week)}>
              <strong>{item.week}. Hafta</strong>
              <span className="archive-week-pages">Sayfa {item.startPage}–{item.endPage}</span>
              {item.topics.length > 0 && <ul>{item.topics.map((topic) => <li key={topic.page}>{topic.title}</li>)}</ul>}
            </button>
          ))}
        </nav>
        <div className="archive-book-reader">
          {error && <div className="empty-state" role="alert"><p>{error}</p></div>}
          {!archive && !error && <div className="empty-state" role="status"><p>Kitap açılıyor…</p></div>}
          {archive && !book && <div className="empty-state"><p>Bu sınıf ve ay için kaynak bulunamadı.</p></div>}
          {book && <FlipbookPanel key={book.id} ref={panelRef} book={book} initialPage={initialPage} onPageChange={(value) => setPage(value)} />}
        </div>
      </div>
    </div>
  );
}
