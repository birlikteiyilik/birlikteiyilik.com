import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AcademyHeader } from "./AcademyHeader";
import { CurriculumCards } from "./CurriculumCards";
import { CurriculumLinkIcon } from "./CurriculumLinkIcon";
import { ageCurricula, curriculumTopic, curriculumTopicAtPage, readableTopicTitle, searchCurriculumTopics, type AgeCurriculum, type CurriculumAge, type CurriculumTopic } from "./age-curricula";
import { assessmentQuestions, learningItems, readingBlocks, resourceLabel, sectionLinks, topicDuration, topicText } from "./native-curriculum";

const base = import.meta.env.BASE_URL;
const home = base.replace(/\/$/, "");
const libraryHref = `${home}?bolum=ahlak-mufredati`;
const tabs = [
  { id: "plan", label: "Ders planı" },
  { id: "anlatim", label: "Anlatım" },
  { id: "menkibeler", label: "Menkıbeler" },
  { id: "sorular", label: "Sorular" },
] as const;
type Tab = typeof tabs[number]["id"];
type Selection = { topic: number; tab: Tab; sourcePage?: number };
function readSelection(): Selection {
  const params = new URLSearchParams(window.location.search);
  const tab = tabs.find((item) => item.id === params.get("sekme"))?.id || "plan";
  return { topic: Number(params.get("konu")) || 1, tab, sourcePage: params.get("gorunum") === "ozgun" ? Number(params.get("sayfa")) : undefined };
}

function Reading({ text }: { text: string }) {
  return <div className="native-prose">{readingBlocks(text).map((block, index) => {
    if (block.kind === "heading") return <h4 key={index}>{block.text}</h4>;
    if (block.kind === "list") return <ul key={index}>{block.items.map((item, number) => <li key={number}>{item}</li>)}</ul>;
    return <p key={index}>{block.text}</p>;
  })}</div>;
}

function Resources({ topic, section = "materials" }: { topic: CurriculumTopic; section?: string }) {
  const links = sectionLinks(topic, section);
  if (!links.length) return null;
  return <div className="native-resources">{links.map((href, index) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">
    <span><strong>{resourceLabel(href, index)}</strong><small>{new URL(href).hostname.replace(/^www\./, "")}</small></span><CurriculumLinkIcon />
  </a>)}</div>;
}

export function AgeCurriculumPortal() {
  const ageParam = new URLSearchParams(window.location.search).get("yas");
  const age: CurriculumAge | null = ageParam === "7-10" || ageParam === "11-14" ? ageParam : null;
  const metadata = ageCurricula.find((program) => program.id === age);
  const [data, setData] = useState<AgeCurriculum | null>(null);
  const [error, setError] = useState(false);
  const [selection, setSelection] = useState(readSelection);
  const [query, setQuery] = useState("");
  const [topicsOpen, setTopicsOpen] = useState(false);
  const contentRef = useRef<HTMLElement>(null);
  const topic = data ? (selection.sourcePage ? curriculumTopicAtPage(data, selection.sourcePage) : undefined) || curriculumTopic(data, selection.topic) : null;
  const filtered = useMemo(() => searchCurriculumTopics(data?.topics || [], query), [data, query]);
  const duration = topic ? topicDuration(topic) : null;
  const outcomes = topic ? learningItems(topicText(topic, "outcomes")) : [];
  const concepts = topic ? topicText(topic, "concepts").split(/[•\n]/).map((value) => value.trim()).filter(Boolean) : [];
  const messages = topic ? learningItems(topicText(topic, "messages")) : [];
  const questions = topic ? assessmentQuestions(topic, age!) : [];
  const pdf = `${base}assets/ahlak-mufredati/${age}/ahlak-egitim-programi-${age}-yas.pdf`;

  useEffect(() => {
    if (!age) return;
    const controller = new AbortController();
    setData(null); setError(false);
    fetch(`${base}data/ahlak-mufredati-${age}.json`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Kaynak yüklenemedi"); return response.json(); })
      .then((value: AgeCurriculum) => { if (value.id !== age || !Array.isArray(value.topics) || !value.topics.length) throw new Error("Kaynak geçersiz"); setData(value); })
      .catch((failure: Error) => { if (failure.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, [age]);

  useEffect(() => {
    const restore = () => setSelection(readSelection());
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    if (!topic) return;
    document.title = `${readableTopicTitle(topic.title)} · ${metadata?.ageLabel} · Birlikte İyilik`;
    const url = new URL(window.location.href);
    url.searchParams.set("konu", String(topic.number));
    url.searchParams.set("sekme", selection.tab);
    url.searchParams.delete("gorunum"); url.searchParams.delete("sayfa");
    window.history.replaceState({}, "", url);
  }, [topic, selection.tab, metadata]);

  function navigate(number: number, tab = selection.tab, scroll = false) {
    if (!data) return;
    const next = curriculumTopic(data, number);
    const url = new URL(window.location.href);
    url.searchParams.set("konu", String(next.number)); url.searchParams.set("sekme", tab);
    url.searchParams.delete("gorunum"); url.searchParams.delete("sayfa");
    if (url.href !== window.location.href) window.history.pushState({}, "", url);
    setSelection({ topic: next.number, tab }); setTopicsOpen(false);
    if (scroll) window.requestAnimationFrame(() => contentRef.current?.scrollIntoView({ block: "start", behavior: "instant" }));
  }

  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault(); navigate(topic!.number, tabs[next].id);
    document.getElementById(`curriculum-tab-${tabs[next].id}`)?.focus();
  }

  if (!metadata) return <div className="hub-shell"><AcademyHeader /><main className="curriculum-library">
    <a className="curriculum-back" href={home}>← Öğretmen Kitabı</a><p className="hub-eyebrow">YAŞA GÖRE DERS REHBERLERİ</p>
    <h1>Ahlak Eğitim Programları</h1><p>Yaş grubunu seçin; her konu için ders planına, anlatıma, menkıbelere ve sorulara ulaşın.</p><CurriculumCards />
  </main></div>;

  return <div className={`curriculum-shell curriculum-age-${age}`}>
    <AcademyHeader />
    <div className="curriculum-topbar">
      <a className="curriculum-back" href={home}>← Öğretmen Kitabı</a><a href={libraryHref}>Ahlak Eğitim Programları</a>
      <nav aria-label="Müfredat yaş grubu">{ageCurricula.map((program) => <a key={program.id} href={`${libraryHref}&yas=${program.id}`} aria-current={program.id === age ? "page" : undefined}>{program.ageLabel}</a>)}</nav>
    </div>
    <header className="curriculum-program-heading">
      <div><p className="hub-eyebrow">AHLAK EĞİTİM PROGRAMI</p><h1>{metadata.ageLabel} <span>Öğretmen rehberi</span></h1><p>{metadata.topicCount} konu · Ders hazırlığından değerlendirmeye</p></div>
      <a className="curriculum-source-download" href={pdf} download={`Ahlak-Egitim-Programi-${age}-Yas.pdf`}>Kaynak PDF ↓</a>
    </header>
    {error ? <main className="curriculum-load-state" role="alert"><h2>Müfredat yüklenemedi</h2><p>Bağlantınızı kontrol edip yeniden deneyin.</p><button onClick={() => window.location.reload()}>Yeniden dene</button><a href={pdf} target="_blank" rel="noopener noreferrer">Kaynak PDF’yi aç</a></main>
      : !data || !topic ? <main className="curriculum-load-state" role="status">Ders rehberi açılıyor…</main>
      : <div className="curriculum-workspace">
        <aside className="curriculum-sidebar" aria-label="Müfredat konu dizini">
          <button className="curriculum-topics-toggle" onClick={() => setTopicsOpen(!topicsOpen)} aria-expanded={topicsOpen} aria-controls="curriculumTopicIndex"><span>Konu seç <small>{metadata.topicCount} konu</small></span><span aria-hidden="true">{topicsOpen ? "−" : "+"}</span></button>
          <div id="curriculumTopicIndex" className={`curriculum-topic-index ${topicsOpen ? "is-open" : ""}`}>
            <div className="curriculum-index-heading"><h2>Konular</h2><span>{metadata.topicCount}</span></div>
            <label className="curriculum-search"><span>Konu veya içerik ara</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Örn. sabır, adalet…" /></label>
            <p className="curriculum-search-count" role="status">{query ? `${filtered.length} konu bulundu` : "Bir konu seçerek başlayın"}</p>
            <nav className="curriculum-topic-list" aria-label="Konu seçimi">{filtered.map((item) => <button key={item.number} aria-current={topic.number === item.number ? "true" : undefined} onClick={() => navigate(item.number, selection.tab, true)}><span className="curriculum-topic-number">{String(item.number).padStart(2, "0")}</span><span><strong>{readableTopicTitle(item.title)}</strong><small>{topicDuration(item).label}</small></span></button>)}
              {!filtered.length && <div className="curriculum-no-results"><p>Aramanızla eşleşen konu bulunamadı.</p><button onClick={() => setQuery("")}>Aramayı temizle</button></div>}
            </nav>
          </div>
        </aside>
        <main className="curriculum-content" ref={contentRef}>
          <div className="curriculum-topic-heading"><p>KONU {String(topic.number).padStart(2, "0")} <span>·</span> {metadata.ageLabel} {duration?.label && <><span>·</span> {duration.label}</>}</p><h2>{readableTopicTitle(topic.title)}</h2><button className="curriculum-print" onClick={() => window.print()}>Ders notlarını yazdır <CurriculumLinkIcon /></button></div>
          <div className="native-tabs" role="tablist" aria-label="Ders bölümleri">{tabs.map((tab, index) => <button id={`curriculum-tab-${tab.id}`} key={tab.id} role="tab" aria-selected={selection.tab === tab.id} tabIndex={selection.tab === tab.id ? 0 : -1} aria-controls="curriculumLessonPanel" onClick={() => navigate(topic.number, tab.id)} onKeyDown={(event) => tabKey(event, index)}>{tab.label}</button>)}</div>
          <div id="curriculumLessonPanel" className="native-panel" role="tabpanel" aria-labelledby={`curriculum-tab-${selection.tab}`}>
            <section className="native-tab-content" hidden={selection.tab !== "plan"}>
              <div className="native-focus"><span>DERSİ BİR SORUYLA AÇALIM</span><p>{questions[0] || outcomes[0]}</p></div>
              <div className="native-plan-grid">
                <section className="native-card"><p className="native-kicker">KAZANIMLAR</p><h3>Öğrenciler neler kazanacak?</h3><ul className="native-outcomes">{outcomes.map((item, index) => <li key={index}><span aria-hidden="true">✓</span>{item}</li>)}</ul></section>
                <section className="native-card native-concept-card"><p className="native-kicker">HAZIRLIK</p><h3>Üzerinde duracağımız kavramlar</h3><ul className="curriculum-concepts">{concepts.map((concept, index) => <li key={index}>{concept}</li>)}</ul></section>
              </div>
              <section className="native-card native-flow"><div className="native-section-heading"><div><p className="native-kicker">ADIM ADIM</p><h3>Dersi birlikte ilerletelim</h3></div><small>{duration?.label}</small></div>
                <button onClick={() => navigate(topic.number, "anlatim", true)}><span>01</span><div><strong>Konuyu anlat</strong><p>{messages[0] || outcomes[0]}</p></div><span aria-hidden="true">→</span></button>
                <button onClick={() => navigate(topic.number, "menkibeler", true)}><span>02</span><div><strong>Menkıbelerle pekiştir</strong><p>Örnek olayları okuyun; konuyla bağlantıları üzerine konuşun.</p></div><span aria-hidden="true">→</span></button>
                <button onClick={() => navigate(topic.number, "sorular", true)}><span>03</span><div><strong>Birlikte değerlendirin</strong><p>{questions[0] || "Kazanımları birlikte gözden geçirin."}</p></div><span aria-hidden="true">→</span></button>
              </section>
              <section className="native-card"><p className="native-kicker">DERSTE KULLANIN</p><h3>Etkinlik ve materyaller</h3><Resources topic={topic} /></section>
            </section>
            <section className="native-tab-content native-reading" hidden={selection.tab !== "anlatim"}>
              <section className="native-card"><p className="native-kicker">VURGULANACAK NOKTALAR</p><h3>Bu dersten akılda kalsın</h3><ul className="native-message-list">{messages.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
              <article className="native-card native-article"><p className="native-kicker">ÖĞRETMEN ANLATIMI</p><h3>{readableTopicTitle(topic.title)}</h3><Reading text={topicText(topic, "explanation")} /></article>
              <aside className="native-quotation"><p className="native-kicker">BÜYÜKLERİN SÖZLERİNDEN</p><Reading text={topicText(topic, "sayings")} /></aside>
            </section>
            <section className="native-tab-content native-reading" hidden={selection.tab !== "menkibeler"}><article className="native-card native-article"><p className="native-kicker">OKUYALIM, ÜZERİNE KONUŞALIM</p><h3>Konuyla ilgili menkıbeler</h3><Reading text={topicText(topic, "stories")} /></article></section>
            <section className="native-tab-content" hidden={selection.tab !== "sorular"}><div className="native-questions-intro"><p className="native-kicker">DERSİN SONUNDA</p><h3>Ne öğrendik, nasıl uygularız?</h3><p>Öğrencilerin kendi örneklerini vermesine ve cevaplarını açıklamasına alan açın.</p></div><ol className="native-question-list">{questions.map((question, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{question}</p></li>)}</ol><section className="native-card native-reflection"><h3>Günlük hayata taşıyalım</h3><p>Bugün öğrendiklerinizden hangisini hayatınızda uygulamak istersiniz?</p></section></section>
          </div>
          <nav className="curriculum-topic-pagination" aria-label="Konu geçişi"><button disabled={topic.number === 1} onClick={() => navigate(topic.number - 1, selection.tab, true)}>← Önceki konu</button><span>{topic.number} / {data.topicCount}</span><button disabled={topic.number === data.topicCount} onClick={() => navigate(topic.number + 1, selection.tab, true)}>Sonraki konu →</button></nav>
          <details className="native-source-details"><summary>Kaynak ve ek okumalar</summary><p>{data.publisher} · {data.edition} · Kaynak s. {topic.startPage}–{topic.endPage}</p><Resources topic={topic} section="sources" /><a href={`${pdf}#page=${topic.startPage}`} target="_blank" rel="noopener noreferrer">Kaynak PDF’yi aç <CurriculumLinkIcon /></a></details>
        </main>
      </div>}
  </div>;
}
