"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ArchiveData,
  type ArchiveDocument,
  type ArchiveLesson,
  type ArchivePlan,
  bandForGrade,
  buildLessonGuide,
  monthlyChecklist,
  monthlyOverview,
  rubricRows,
} from "./lesson-guide";
import { buildMaterialKit, findLessonSource } from "./lesson-materials";
import { ClassroomMode, LessonMaterialsStudio, PrintMaterials } from "./LessonMaterialsStudio";

type Tab = "lessons" | "archive" | "assessment";
type PrintScope = "none" | "lesson" | "month" | "materials";

const monthNames = Array.from({ length: 9 }, (_, index) => `${index + 1}. Ay`);

function LessonDetails({
  lesson,
  grade,
  month,
  archive,
  plan,
  onStartLesson,
  onPrintMaterials,
  compact = false,
}: {
  lesson: ArchiveLesson;
  grade: number;
  month: number;
  archive: ArchiveData;
  plan: ArchivePlan;
  onStartLesson?: () => void;
  onPrintMaterials?: () => void;
  compact?: boolean;
}) {
  const guide = buildLessonGuide(lesson, grade, month);
  const kit = buildMaterialKit(guide);
  const source = findLessonSource(archive, plan, lesson, grade, month);
  return (
    <article className={`lesson-details ${compact ? "printable-lesson" : ""}`}>
      <header className="lesson-title-block">
        <div>
          <p className="kicker">{guide.week}. hafta · {guide.lessonNumber}. ders · {guide.categoryLabel}</p>
          <h2>{guide.title}</h2>
        </div>
        <div className="lesson-facts">
          <span><strong>{guide.duration}</strong> dakika</span>
          <span><strong>{guide.age}</strong> öğrenci düzeyi</span>
        </div>
      </header>

      <div className="source-strands">
        <strong>Dersin dayandığı özgün konu başlıkları</strong>
        <div>{guide.sourceStrands.map((strand) => <span key={strand}>{strand}</span>)}</div>
        <small>{guide.sourceLabel}</small>
      </div>

      <section className="purpose-box">
        <p className="section-label">Dersin amacı ve pedagojik çerçevesi</p>
        <p>{guide.purpose}</p>
      </section>

      <div className="two-column-sections">
        <section className="content-section">
          <h3>Kazanımlar</h3>
          <ol className="number-list">
            {guide.outcomes.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </section>
        <section className="content-section">
          <h3>Öğretmen ön hazırlığı</h3>
          <ul className="check-list">
            {guide.preparation.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>

      <section className="content-section teaching-content">
        <h3>Öğretmen anlatım çerçevesi</h3>
        <p className="section-intro">Konu anlatılırken aşağıdaki noktaların tamamı görünür olmalıdır:</p>
        <ul className="content-point-list">
          {guide.content.map((item, index) => (
            <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>
          ))}
        </ul>
      </section>

      <section className="content-section">
        <div className="section-title-row">
          <h3>Adım adım ders akışı</h3>
          <span>Toplam {guide.duration} dakika</span>
        </div>
        <div className="flow-list">
          {guide.flow.map((step, index) => (
            <div className="flow-step" key={step.title}>
              <div className="flow-time"><strong>{step.time}</strong><small>dk</small></div>
              <div><span>{index + 1}. adım</span><h4>{step.title}</h4><p>{step.detail}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="two-column-sections">
        <section className="content-section">
          <h3>Rehber sorular</h3>
          <ul className="question-list">
            {guide.questions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section className="content-section">
          <h3>Materyaller</h3>
          <ul className="plain-list">
            {guide.materials.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="product-note"><strong>Beklenen ürün:</strong> {guide.product}</p>
          {!compact && <button className="inline-start-button" onClick={onStartLesson}>Hazır materyallerle dersi başlat →</button>}
        </section>
      </div>

      {!compact && onStartLesson && onPrintMaterials && (
        <LessonMaterialsStudio guide={guide} kit={kit} source={source} onStart={onStartLesson} onPrint={onPrintMaterials} />
      )}

      <section className="content-section assessment-box">
        <h3>Ölçme ve değerlendirme</h3>
        <p>{guide.assessment}</p>
      </section>

      <div className="two-column-sections">
        <section className="content-section">
          <h3>Farklılaştırma ve özel gereksinim</h3>
          <p>{guide.differentiation}</p>
        </section>
        <section className="content-section">
          <h3>Aileye aktarım</h3>
          <p>{guide.familyTask}</p>
        </section>
      </div>

      <aside className="safety-note">
        <strong>Güvenli eğitim notu</strong>
        <p>{guide.safetyNote}</p>
      </aside>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><span>…</span><p>{text}</p></div>;
}

export function CurriculumPortal({ onHomeHref }: { onHomeHref: string }) {
  const [archive, setArchive] = useState<ArchiveData | null>(null);
  const [error, setError] = useState("");
  const [grade, setGrade] = useState(1);
  const [month, setMonth] = useState(1);
  const [lessonNumber, setLessonNumber] = useState(1);
  const [tab, setTab] = useState<Tab>("lessons");
  const [archiveDocumentId, setArchiveDocumentId] = useState("");
  const [archivePage, setArchivePage] = useState(1);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [printScope, setPrintScope] = useState<PrintScope>("none");
  const [classroomOpen, setClassroomOpen] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/archive.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Arşiv verisi yüklenemedi.");
        return response.json();
      })
      .then((data: ArchiveData) => setArchive(data))
      .catch(() => setError("Kaynak arşivi yüklenemedi. Lütfen sayfayı yenileyin."));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextGrade = Number(params.get("sinif"));
    const nextMonth = Number(params.get("ay"));
    const nextLesson = Number(params.get("ders"));
    if (nextGrade >= 1 && nextGrade <= 8) setGrade(nextGrade);
    if (nextMonth >= 1 && nextMonth <= 9) setMonth(nextMonth);
    if (nextLesson >= 1 && nextLesson <= 20) setLessonNumber(nextLesson);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("sinif", String(grade));
    url.searchParams.set("ay", String(month));
    url.searchParams.set("ders", String(lessonNumber));
    window.history.replaceState({}, "", url);
  }, [grade, month, lessonNumber]);

  const band = bandForGrade(grade);
  const plan = archive?.plans[band]?.[String(month)] as ArchivePlan | undefined;
  const lessons = plan?.lessons || [];
  const selectedLesson = lessons[lessonNumber - 1];
  const selectedGuide = selectedLesson ? buildLessonGuide(selectedLesson, grade, month) : null;
  const selectedKit = selectedGuide ? buildMaterialKit(selectedGuide) : null;
  const selectedSource = archive && plan && selectedLesson
    ? findLessonSource(archive, plan, selectedLesson, grade, month)
    : null;
  const overview = useMemo(
    () => (lessons.length ? monthlyOverview(lessons, grade, month) : null),
    [lessons, grade, month],
  );

  const relevantDocuments = useMemo(() => {
    if (!archive || !plan) return [];
    const sourceBand = plan.isExtended ? "7-8" : band;
    return archive.documents.filter(
      (document) => document.month === month && document.band === sourceBand,
    );
  }, [archive, plan, band, month]);

  useEffect(() => {
    if (!relevantDocuments.length) return;
    if (!relevantDocuments.some((document) => document.id === archiveDocumentId)) {
      const contentDoc = relevantDocuments.find((document) => document.kind === "content") || relevantDocuments[0];
      setArchiveDocumentId(contentDoc.id);
      setArchivePage(1);
      setArchiveSearch("");
    }
  }, [relevantDocuments, archiveDocumentId]);

  const archiveDocument = relevantDocuments.find((document) => document.id === archiveDocumentId);
  const filteredPages = useMemo(() => {
    if (!archiveDocument) return [];
    const query = archiveSearch.trim().toLocaleLowerCase("tr-TR");
    if (!query) return archiveDocument.pages;
    return archiveDocument.pages.filter((page) => page.text.toLocaleLowerCase("tr-TR").includes(query));
  }, [archiveDocument, archiveSearch]);
  const selectedArchivePage = archiveDocument?.pages.find((page) => page.number === archivePage) || filteredPages[0];

  const selectGrade = (value: number) => {
    setGrade(value);
    setLessonNumber(1);
    setArchiveDocumentId("");
    setClassroomOpen(false);
  };

  const selectMonth = (value: number) => {
    setMonth(value);
    setLessonNumber(1);
    setArchiveDocumentId("");
    setClassroomOpen(false);
  };

  const openArchive = () => {
    setTab("archive");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const print = (scope: Exclude<PrintScope, "none">) => {
    setPrintScope(scope);
    window.setTimeout(() => window.print(), 120);
  };

  useEffect(() => {
    const reset = () => setPrintScope("none");
    window.addEventListener("afterprint", reset);
    return () => window.removeEventListener("afterprint", reset);
  }, []);

  return (
    <main className={`teacher-portal print-${printScope}`}>
      <div className="app-shell">
        <header className="simple-header">
          <a className="simple-brand" href="#top">
            <span>GA</span>
            <div><strong>Güzel Ahlak</strong><small>Tam Öğretmen Kitabı</small></div>
          </a>
          <div className="header-meta">
            <a className="section-back-link" href={onHomeHref}>← Kitap seçimi</a>
            <span>46 kaynak dosya</span>
            <span>963 sayfa</span>
            <span>1-8. sınıf · 9 ay</span>
          </div>
        </header>

        <section className="simple-intro" id="top">
          <p>Özgün konu sırası korunmuştur</p>
          <h1>Planla. Anlat.<br />Uygula. Ölç.</h1>
          <div>
            <p>Her sınıf ve ay için 20 ders; çocuklara okunacak metin, etkileşimli materyal, sınıf sunumu ve değerlendirmeyle birlikte.</p>
            <strong>Öğretmen dersten ayrılmadan tüm süreci yönetir</strong>
          </div>
        </section>

        <section className="control-bar" aria-label="Sınıf ve ay seçimi">
          <label>
            <span>Sınıf seçin</span>
            <select value={grade} onChange={(event) => selectGrade(Number(event.target.value))}>
              {Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}. Sınıf</option>)}
            </select>
          </label>
          <label>
            <span>Ay seçin</span>
            <select value={month} onChange={(event) => selectMonth(Number(event.target.value))}>
              {monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
            </select>
          </label>
          <div className="current-selection">
            <strong>{grade}. Sınıf · {month}. Ay</strong>
            <span>20 ders · 4 hafta · zip sırasına göre</span>
          </div>
          <div className="print-actions">
            <button onClick={() => print("lesson")} disabled={!selectedLesson}>Bu dersi yazdır</button>
            <button className="primary-button" onClick={() => print("month")} disabled={!lessons.length}>20 dersi yazdır / PDF</button>
          </div>
        </section>

        <nav className="content-tabs" aria-label="İçerik bölümleri">
          <button className={tab === "lessons" ? "active" : ""} onClick={() => setTab("lessons")}>20 Ayrıntılı Ders</button>
          <button className={tab === "archive" ? "active" : ""} onClick={() => setTab("archive")}>Özgün Metin Arşivi</button>
          <button className={tab === "assessment" ? "active" : ""} onClick={() => setTab("assessment")}>Ölçme ve Öğretmen Araçları</button>
        </nav>

        {error && <EmptyState text={error} />}
        {!archive && !error && <EmptyState text="Tam içerik ve ders materyalleri hazırlanıyor…" />}

        {archive && plan && tab === "lessons" && overview && (
          <section className="lessons-view">
            <header className="month-summary">
              <div>
                <p>{plan.isExtended ? "Yaş düzeyine uyarlanmış arşiv uzantısı" : "Özgün plan sırası"}</p>
                <h2>{overview.title}</h2>
                <span>{overview.description}</span>
              </div>
              <div className="summary-tags">
                {overview.dominant.map((item) => <span key={item}>{item}</span>)}
              </div>
              {plan.extensionNote && <aside>{plan.extensionNote}</aside>}
            </header>

            <div className="lesson-workspace">
              <aside className="lesson-index">
                {[1, 2, 3, 4].map((week) => (
                  <div key={week}>
                    <h3>{week}. Hafta <span>{(week - 1) * 5 + 1}-{week * 5}. dersler</span></h3>
                    {lessons.slice((week - 1) * 5, week * 5).map((lesson) => (
                      <button
                        key={lesson.number}
                        className={lessonNumber === lesson.number ? "active" : ""}
                        onClick={() => { setLessonNumber(lesson.number); setClassroomOpen(false); }}
                      >
                        <span>{String(lesson.number).padStart(2, "0")}</span>
                        <strong>{lesson.title}</strong>
                      </button>
                    ))}
                  </div>
                ))}
              </aside>

              <div className="lesson-main">
                <div className="lesson-toolbar">
                  <button onClick={() => setLessonNumber(Math.max(1, lessonNumber - 1))} disabled={lessonNumber === 1}>← Önceki ders</button>
                  <span>{lessonNumber} / 20</span>
                  <button onClick={() => setLessonNumber(Math.min(20, lessonNumber + 1))} disabled={lessonNumber === 20}>Sonraki ders →</button>
                  <button className="source-button" onClick={openArchive}>Tam arşivi aç</button>
                  <button className="toolbar-start-button" onClick={() => setClassroomOpen(true)}>Dersi Başlat</button>
                </div>
                {selectedLesson && <LessonDetails lesson={selectedLesson} grade={grade} month={month} archive={archive} plan={plan} onStartLesson={() => setClassroomOpen(true)} onPrintMaterials={() => print("materials")} />}
              </div>
            </div>
          </section>
        )}

        {archive && plan && tab === "archive" && (
          <section className="archive-view">
            <header className="view-heading">
              <div><p>Eksiksiz içerik erişimi</p><h2>Özgün Metin Arşivi</h2></div>
              <p>Seçili sınıf grubuna ve aya ait plan ile içerik dosyalarının çıkarılmış tüm sayfaları. Metin sadeleştirilmemiştir.</p>
            </header>
            <div className="archive-stats">
              <span><strong>{archive.meta.fileCount}</strong> öğretim dosyası</span>
              <span><strong>{archive.meta.pageCount}</strong> toplam sayfa</span>
              <span><strong>{relevantDocuments.length}</strong> seçili ay dosyası</span>
              <span><strong>{relevantDocuments.reduce((sum, doc) => sum + doc.pageCount, 0)}</strong> seçili ay sayfası</span>
            </div>
            <div className="archive-controls">
              <label>
                <span>Kaynak dosya</span>
                <select value={archiveDocumentId} onChange={(event) => { setArchiveDocumentId(event.target.value); setArchivePage(1); }}>
                  {relevantDocuments.map((document) => (
                    <option key={document.id} value={document.id}>{document.kind === "plan" ? "PLAN" : "İÇERİK"} · {document.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Bu dosyada ara</span>
                <input value={archiveSearch} onChange={(event) => setArchiveSearch(event.target.value)} placeholder="Örn. adalet, namaz, merhamet…" />
              </label>
            </div>
            {archiveDocument ? (
              <div className="archive-reader">
                <aside>
                  <div className="document-card">
                    <span>{archiveDocument.extension.replace(".", "").toUpperCase()}</span>
                    <strong>{archiveDocument.name}</strong>
                    <small>{archiveDocument.pageCount} sayfa · {archiveDocument.kind === "plan" ? "müfredat planı" : "tam ders içerikleri"}</small>
                  </div>
                  <div className="page-list">
                    {filteredPages.map((page) => (
                      <button key={page.number} className={selectedArchivePage?.number === page.number ? "active" : ""} onClick={() => setArchivePage(page.number)}>
                        <span>Sayfa {page.number}</span>
                        <small>{page.text.slice(0, 90) || "Metin bulunamadı"}</small>
                      </button>
                    ))}
                    {!filteredPages.length && <p>Arama sonucu bulunamadı.</p>}
                  </div>
                </aside>
                <article className="source-page">
                  <header><span>{archiveDocument.name}</span><strong>Sayfa {selectedArchivePage?.number || 1} / {archiveDocument.pageCount}</strong></header>
                  <pre>{selectedArchivePage?.text || "Bu sayfada çıkarılabilir metin bulunamadı."}</pre>
                </article>
              </div>
            ) : <EmptyState text="Bu seçim için kaynak dosya bulunamadı." />}
          </section>
        )}

        {archive && tab === "assessment" && (
          <section className="assessment-view">
            <header className="view-heading">
              <div><p>Her sınıfta kullanılabilir</p><h2>Ölçme ve Öğretmen Araçları</h2></div>
              <p>Değerlendirme öğrencinin kişisel dindarlığını değil; kavramı anlama, davranışın etkisini fark etme, gerekçe kurma ve hayata aktarma becerisini ölçer.</p>
            </header>
            <section className="tool-section">
              <h3>4 düzeyli gelişim rubriği</h3>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Ölçüt</th><th>Başlangıç</th><th>Gelişiyor</th><th>Kazandı</th><th>İleri aktarım</th></tr></thead>
                  <tbody>{rubricRows.map((row) => <tr key={row.criterion}><th>{row.criterion}</th><td>{row.beginning}</td><td>{row.developing}</td><td>{row.achieved}</td><td>{row.advanced}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
            <div className="assessment-grid">
              <section className="tool-section">
                <h3>Aylık öğretmen kontrol listesi</h3>
                <ul className="large-checklist">{monthlyChecklist.map((item) => <li key={item}><span>□</span>{item}</li>)}</ul>
              </section>
              <section className="tool-section protocol-card">
                <h3>Kaynak doğrulama protokolü</h3>
                <ol>
                  <li><strong>Türü belirle:</strong> Ayet, hadis, fıkıh, siyer/tarih, menkıbe veya öğretmen yorumu.</li>
                  <li><strong>Kaynağı kaydet:</strong> Eser, bölüm/sayfa, çeviri ve varsa hadis derecesi.</li>
                  <li><strong>İlmî kontrol:</strong> Kurumun yetkili ilim heyetinden ifade ve yaklaşım onayı.</li>
                  <li><strong>Pedagojik kontrol:</strong> Yaşa uygunluk, korku/utanç riski, mahremiyet ve soyutluk.</li>
                  <li><strong>Sınıf dili:</strong> Kesin hüküm, yorum ve menkıbe açıkça ayrılarak sadeleştirilir.</li>
                </ol>
              </section>
            </div>
          </section>
        )}

        <footer className="simple-footer">
          <strong>Güzel Ahlak · Tam Öğretmen Kitabı</strong>
          <p>46 dosya ve 963 sayfalık özgün içeriğe dayalı pedagojik uyarlama. Resmî MEB müfredatı değildir; dinî içerikler kurumun ilmî onay sürecinden geçirilmelidir.</p>
        </footer>
      </div>

      {selectedGuide && selectedKit && (
        <ClassroomMode open={classroomOpen} guide={selectedGuide} kit={selectedKit} onClose={() => setClassroomOpen(false)} />
      )}

      <div className="print-lesson-copy">
        {archive && plan && selectedLesson && <LessonDetails lesson={selectedLesson} grade={grade} month={month} archive={archive} plan={plan} compact />}
      </div>
      <div className="print-month-book">
        <header className="print-cover">
          <span>Güzel Ahlak · Tam Öğretmen Kitabı</span>
          <h1>{grade}. Sınıf<br />{month}. Ay</h1>
          <p>Özgün konu sırasına göre 20 ayrıntılı ders</p>
        </header>
        {archive && plan && lessons.map((lesson) => <LessonDetails key={lesson.number} lesson={lesson} grade={grade} month={month} archive={archive} plan={plan} compact />)}
      </div>
      <div className="print-materials-copy">
        {selectedGuide && selectedKit && <PrintMaterials guide={selectedGuide} kit={selectedKit} source={selectedSource} />}
      </div>
    </main>
  );
}
