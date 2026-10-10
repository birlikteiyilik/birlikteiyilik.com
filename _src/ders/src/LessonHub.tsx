import { lazy, Suspense } from "react";
import { ElifBaReader } from "./ElifBaReader";

const CurriculumPortal = lazy(() => import("./CurriculumPortal").then((module) => ({ default: module.CurriculumPortal })));
const home = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AcademyHeader() {
  return (
    <header className="academy-header">
      <a className="academy-brand" href="/" aria-label="Birlikte İyilik Akademi ana sayfası">
        <img src="/images/favicon-square.png" alt="" width="42" height="42" />
        <div><strong>Birlikte İyilik</strong><span>AKADEMİ</span></div>
      </a>
      <span className="academy-header-note">Öğretmen kaynakları</span>
    </header>
  );
}

export function LessonHub() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("bolum");
  if (section === "guzel-ahlak" || (!section && params.has("sinif"))) {
    return <Suspense fallback={<div className="empty-state" role="status"><p>Ders kitabı açılıyor…</p></div>}><CurriculumPortal onHomeHref={home} /></Suspense>;
  }
  if (section === "elif-ba") return <ElifBaReader homeHref={home} />;

  return (
    <div className="hub-shell">
      <AcademyHeader />
      <main className="hub-main">
        <div className="hub-intro">
          <p className="hub-eyebrow">BİRLİKTE ÖĞRENİYORUZ</p>
          <h1>Öğretmen Kitabı</h1>
          <p>Ders rehberine veya müfredat kitabına ulaşmak için bir bölüm seçin.</p>
        </div>
        <nav className="book-grid" aria-label="Ders kitabı seçimi">
          <a className="book-option book-ahlak" href={`${home}?bolum=guzel-ahlak`}>
            <div className="book-option-top"><span>01 / DERS REHBERİ</span><span className="book-arrow" aria-hidden="true">↗</span></div>
            <div className="book-symbol" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="M32 16C23 10 13 10 6 13v38c8-3 17-3 26 3 9-6 18-6 26-3V13c-7-3-17-3-26 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M32 16v38M14 22c4-1 8 0 12 2m-12 7c4-1 8 0 12 2m12-9c4-2 8-3 12-2m-12 11c4-2 8-3 12-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
            <h2>Güzel Ahlak</h2>
            <p>Ayrıntılı ders planları, öğretmen araçları ve hazır sınıf materyalleri.</p>
            <div className="book-option-bottom"><span>1–8. sınıf · 9 ay</span><strong>Derslere git <span aria-hidden="true">→</span></strong></div>
          </a>
          <a className="book-option book-elif" href={`${home}?bolum=elif-ba`}>
            <div className="book-option-top"><span>02 / MÜFREDAT KİTABI</span><span className="book-arrow" aria-hidden="true">↗</span></div>
            <div className="book-symbol arabic-symbol" lang="ar" aria-hidden="true">ا ب</div>
            <h2>Elif Ba</h2>
            <p>Tecvîdli Kur’ân-ı Kerîm elifbâsı ve ezber müfredatı.</p>
            <div className="book-option-bottom"><span>56 sayfa · PDF kitap</span><strong>Kitabı aç <span aria-hidden="true">→</span></strong></div>
          </a>
        </nav>
        <footer className="hub-footer"><span>Birlikte İyilik Akademi</span><a href="/">Ana siteye dön <span aria-hidden="true">↗</span></a></footer>
      </main>
    </div>
  );
}
