import { useEffect, useMemo, useRef, useState } from "react";
import { ageCurricula, readableTopicTitle, type AgeCurriculum, type CurriculumAge } from "./age-curricula";
import { programBlocks } from "./program-text";
import { paginateProgram, programLeafShell, type ProgramPages, type ProgramType } from "./program-book";
import { FlipbookPanel, type FlipbookPanelHandle } from "./FlipbookPanel";
import { ReaderHeading } from "./BookReader";
import type { Book } from "./books";

const base = import.meta.env.BASE_URL;
const home = base.replace(/\/$/, "");
const libraryHref = `${home}?bolum=ahlak-mufredati`;

const phoneQuery = "(max-width: 700px)";
const typeForScreen = (): ProgramType => window.matchMedia(phoneQuery).matches ? "large" : "regular";

function readStart() {
  const params = new URLSearchParams(window.location.search);
  const page = Number(params.get("sayfa"));
  return { topic: Number(params.get("konu")) || 0, page: Number.isInteger(page) && page >= 1 ? page : 0 };
}

/**
 * The programme as a plain reading book: for every topic only the text a teacher reads aloud,
 * with the topic's Wordwall activities in place. The full PDF stays available for download.
 */
export function AgeCurriculumPortal() {
  const ageParam = new URLSearchParams(window.location.search).get("yas");
  const age: CurriculumAge = ageParam === "11-14" ? "11-14" : "7-10";
  const metadata = ageCurricula.find((program) => program.id === age)!;
  const start = useRef(readStart());
  const [data, setData] = useState<AgeCurriculum | null>(null);
  const [program, setProgram] = useState<ProgramPages | null>(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [spread, setSpread] = useState(false);
  const [type, setType] = useState<ProgramType>(typeForScreen);
  const panelRef = useRef<FlipbookPanelHandle>(null);
  const navRef = useRef<HTMLElement>(null);
  const topicRef = useRef<number | undefined>(undefined);
  const pdfFile = `ahlak-mufredati/${age}/birlikte-iyilik-ahlak-egitim-programi-${age}-yas.pdf`;
  const downloadName = `Birlikte-Iyilik-Ahlak-Egitim-Programi-${age}-Yas.pdf`;
  const pdf = `${base}assets/${pdfFile}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${base}data/ahlak-mufredati-${age}.json`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Kaynak yüklenemedi"); return response.json(); })
      .then((value: AgeCurriculum) => {
        if (value.id !== age || !Array.isArray(value.topics) || !value.topics.length) throw new Error("Kaynak geçersiz");
        setData(value);
      })
      .catch((failure: Error) => { if (failure.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, [age]);

  useEffect(() => {
    // Phones get larger type and so more pages; page numbers differ, so a switch reopens the same topic.
    const query = window.matchMedia(phoneQuery);
    const update = () => {
      start.current = { topic: topicRef.current || start.current.topic, page: 0 };
      setPage(0);
      setType(typeForScreen());
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!data) return;
    setProgram(paginateProgram(data.topics.map((topic) => ({ number: topic.number, title: readableTopicTitle(topic.title), blocks: programBlocks(topic, age) })), type));
  }, [data, age, type]);

  const titles = useMemo(() => new Map((data?.topics || []).map((topic) => [topic.number, readableTopicTitle(topic.title)])), [data]);

  const book = useMemo<Book | null>(() => {
    if (!program) return null;
    return {
      id: `ahlak-programi-${age}-${type}`, title: `Ahlak Eğitim Programı · ${metadata.ageLabel}`, imageLabel: `Ahlak Eğitim Programı ${metadata.ageLabel}`,
      pageCount: program.pages.length, width: 1240, height: 1754, direction: "ltr", pdfFile, downloadName,
      renderPage: (position) => {
        const number = program.pageTopics[position - 1];
        const { leaf, body } = programLeafShell([`${metadata.ageLabel} · Konu ${number}`, titles.get(number) || ""], String(position), type);
        body.append(...program.pages[position - 1].map((element) => element.cloneNode(true)));
        return leaf;
      },
    };
  }, [program, age, type, metadata, pdfFile, downloadName, titles]);

  const initialPage = useMemo(() => {
    if (!program) return 1;
    if (start.current.page) return Math.min(program.pages.length, start.current.page);
    return program.topicStarts.get(start.current.topic) || 1;
  }, [program]);

  // On a two-page spread a topic that opens on the right-hand page is the one being read.
  const topicNumber = program ? program.pageTopics[Math.min(program.pages.length, (page || initialPage) + (spread ? 1 : 0)) - 1] : undefined;
  const topic = data?.topics.find((item) => item.number === topicNumber);
  topicRef.current = topicNumber;

  useEffect(() => {
    navRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [topicNumber]);

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
          {ageCurricula.map((item) => <a key={item.id} href={`${libraryHref}&yas=${item.id}`} aria-current={item.id === age ? "page" : undefined}>{item.ageLabel}</a>)}
        </nav>
        <p className="archive-book-summary">{metadata.topicCount} konu · hocanın okuyacağı metin ve etkinlikler</p>
      </section>
      <div className="archive-book-body">
        <nav className="archive-week-nav archive-topic-nav" aria-label="Konu seçimi" ref={navRef}>
          {data?.topics.map((item) => {
            const active = topicNumber === item.number;
            return (
              <button key={item.number} className={active ? "active" : ""} aria-current={active ? "true" : undefined} disabled={!program} onClick={() => panelRef.current?.goTo(program?.topicStarts.get(item.number) || 1)}>
                <span className="archive-topic-number">{String(item.number).padStart(2, "0")}</span>
                <strong>{readableTopicTitle(item.title)}</strong>
              </button>
            );
          })}
        </nav>
        <div className="archive-book-reader">
          {error && <div className="empty-state" role="alert"><p>Müfredat yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.</p><a href={pdf} target="_blank" rel="noopener noreferrer">Kaynak PDF’yi aç →</a></div>}
          {!book && !error && <div className="empty-state" role="status"><p>Müfredat açılıyor…</p></div>}
          {book && <FlipbookPanel key={book.id} ref={panelRef} book={book} initialPage={initialPage} onPageChange={(value, isSpread) => { setPage(value); setSpread(isSpread); }} />}
        </div>
      </div>
    </div>
  );
}
