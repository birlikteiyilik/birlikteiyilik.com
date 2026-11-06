import { useEffect, useMemo, useRef, useState } from "react";
import { ageCurricula, curriculumTopicAtPage, readableTopicTitle, type AgeCurriculum, type CurriculumAge } from "./age-curricula";
import { resourceLabel } from "./native-curriculum";
import { FlipbookPanel, type FlipbookPanelHandle } from "./FlipbookPanel";
import { ReaderHeading } from "./BookReader";
import { CurriculumLinkIcon } from "./CurriculumLinkIcon";
import type { Book, PageLink } from "./books";

const base = import.meta.env.BASE_URL;
const home = base.replace(/\/$/, "");
const libraryHref = `${home}?bolum=ahlak-mufredati`;

export type CurriculumPageData = { id: CurriculumAge; pageCount: number; width: number; height: number; imageFolder: string; links: Record<string, { href: string; rect: PageLink["rect"] }[]> };

function readStart() {
  const params = new URLSearchParams(window.location.search);
  const page = Number(params.get("sayfa"));
  return { topic: Number(params.get("konu")) || 0, page: Number.isInteger(page) && page >= 1 ? page : 0 };
}

/** Wordwall activities printed on a topic's pages, in reading order and without repeats. */
export function wordwallLinks(pages: CurriculumPageData | null, startPage: number, endPage: number) {
  if (!pages) return [];
  const hrefs: string[] = [];
  for (let page = startPage; page <= endPage; page++) {
    for (const link of pages.links[String(page)] || []) {
      if (/^https?:\/\/(www\.)?wordwall\.net\//.test(link.href) && !hrefs.includes(link.href)) hrefs.push(link.href);
    }
  }
  return hrefs;
}

export function AgeCurriculumPortal() {
  const ageParam = new URLSearchParams(window.location.search).get("yas");
  const age: CurriculumAge = ageParam === "11-14" ? "11-14" : "7-10";
  const metadata = ageCurricula.find((program) => program.id === age)!;
  const start = useRef(readStart());
  const [data, setData] = useState<AgeCurriculum | null>(null);
  const [pages, setPages] = useState<CurriculumPageData | null>(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const panelRef = useRef<FlipbookPanelHandle>(null);
  const navRef = useRef<HTMLElement>(null);
  const pdfFile = `ahlak-mufredati/${age}/birlikte-iyilik-ahlak-egitim-programi-${age}-yas.pdf`;
  const downloadName = `Birlikte-Iyilik-Ahlak-Egitim-Programi-${age}-Yas.pdf`;
  const pdf = `${base}assets/${pdfFile}`;

  useEffect(() => {
    const controller = new AbortController();
    const load = (file: string) => fetch(`${base}data/${file}`, { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error("Kaynak yüklenemedi"); return response.json(); });
    Promise.all([load(`ahlak-mufredati-${age}.json`), load(`ahlak-mufredati-${age}-sayfalar.json`)])
      .then(([value, pageData]: [AgeCurriculum, CurriculumPageData]) => {
        if (value.id !== age || !Array.isArray(value.topics) || !value.topics.length || pageData.id !== age) throw new Error("Kaynak geçersiz");
        setData(value); setPages(pageData);
      })
      .catch((failure: Error) => { if (failure.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, [age]);

  const book = useMemo<Book | null>(() => {
    if (!pages) return null;
    const pageLinks: Record<number, PageLink[]> = {};
    for (const [number, links] of Object.entries(pages.links)) pageLinks[Number(number)] = links.map((link, index) => ({ ...link, label: resourceLabel(link.href, index) || link.href.replace(/^mailto:/, "") }));
    return {
      id: `ahlak-mufredati-${age}`, title: `Ahlak Eğitim Programı · ${metadata.ageLabel}`, imageLabel: `Ahlak Eğitim Programı ${metadata.ageLabel}`,
      pageCount: pages.pageCount, width: pages.width, height: pages.height, direction: "ltr", singlePage: true,
      imageFolder: pages.imageFolder, pdfFile, downloadName, pageLinks,
    };
  }, [pages, age, metadata, pdfFile, downloadName]);

  const initialPage = useMemo(() => {
    if (!data || !pages) return 1;
    if (start.current.page) return Math.min(pages.pageCount, start.current.page);
    return data.topics.find((topic) => topic.number === start.current.topic)?.startPage || 1;
  }, [data, pages]);

  const topic = data ? curriculumTopicAtPage(data, page || initialPage) : undefined;
  const activities = topic ? wordwallLinks(pages, topic.startPage, topic.endPage) : [];

  useEffect(() => {
    navRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [topic?.number]);

  useEffect(() => {
    if (!data) return;
    document.title = `${topic ? `${readableTopicTitle(topic.title)} · ` : ""}Ahlak Eğitim Programı ${metadata.ageLabel} · Birlikte İyilik`;
    const url = new URL(window.location.href);
    url.searchParams.set("yas", age);
    if (topic) url.searchParams.set("konu", String(topic.number)); else url.searchParams.delete("konu");
    url.searchParams.delete("sekme"); url.searchParams.delete("gorunum");
    window.history.replaceState({}, "", url);
  }, [data, topic, age, metadata]);

  return (
    <div className="archive-book-shell">
      <ReaderHeading homeHref={home} title="Ahlak Eğitim Programları" pdfHref={pdf} downloadName={downloadName} />
      <section className="archive-book-controls" aria-label="Yaş grubu seçimi">
        <nav className="archive-segments" aria-label="Müfredat yaş grubu">
          {ageCurricula.map((program) => <a key={program.id} href={`${libraryHref}&yas=${program.id}`} aria-current={program.id === age ? "page" : undefined}>{program.ageLabel}</a>)}
        </nav>
        <p className="archive-book-summary">{metadata.topicCount} konu · {metadata.edition}</p>
      </section>
      <div className="archive-book-body">
        <nav className="archive-week-nav archive-topic-nav" aria-label="Konu seçimi" ref={navRef}>
          {data?.topics.map((item) => {
            const active = topic?.number === item.number;
            return (
              <button key={item.number} className={active ? "active" : ""} aria-current={active ? "true" : undefined} onClick={() => panelRef.current?.goTo(item.startPage)}>
                <span className="archive-topic-number">{String(item.number).padStart(2, "0")}</span>
                <strong>{readableTopicTitle(item.title)}</strong>
              </button>
            );
          })}
        </nav>
        <div className="archive-book-reader">
          {topic && activities.length > 0 && (
            <div className="archive-activities" aria-label="Bu konunun Wordwall etkinlikleri">
              <span>Etkinlikler</span>
              {activities.map((href, index) => {
                const label = resourceLabel(href, index);
                return <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label.charAt(0).toLocaleUpperCase("tr-TR") + label.slice(1)} <CurriculumLinkIcon /></a>;
              })}
            </div>
          )}
          {error && <div className="empty-state" role="alert"><p>Müfredat yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.</p><a href={pdf} target="_blank" rel="noopener noreferrer">Kaynak PDF’yi aç →</a></div>}
          {!book && !error && <div className="empty-state" role="status"><p>Müfredat açılıyor…</p></div>}
          {book && data && <FlipbookPanel key={book.id} ref={panelRef} book={book} initialPage={initialPage} onPageChange={(value) => setPage(value)} />}
        </div>
      </div>
    </div>
  );
}
