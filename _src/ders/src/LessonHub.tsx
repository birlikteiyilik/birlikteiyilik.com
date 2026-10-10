import { lazy, Suspense } from "react";
import { BookReader } from "./BookReader";
import { elifBaBook, quranBook } from "./books";

const CurriculumPortal = lazy(() => import("./CurriculumPortal").then((module) => ({ default: module.CurriculumPortal })));
const home = import.meta.env.BASE_URL.replace(/\/$/, "");
const cardAssets = `${import.meta.env.BASE_URL}assets/book-cards/`;

const bookCards = [
  { section: "kuran-i-kerim", title: "Kur’an-ı Kerim", image: "kuran-grid-v1.webp", mobileImage: "kuran-mobile-v1.webp", description: "Sayfalarını çevirerek okuyabileceğiniz Kur’an-ı Kerim kitabı.", metadata: "615 sayfa · PDF kitap", action: "Kitabı aç" },
  { section: "guzel-ahlak", title: "Güzel Ahlak", image: "guzel-ahlak-grid-v1.webp", mobileImage: "guzel-ahlak-mobile-v1.webp", description: "Ayrıntılı ders planları, öğretmen araçları ve hazır sınıf materyalleri.", metadata: "1–8. sınıf · 9 ay", action: "Derslere git" },
  { section: "elif-ba", title: "Elif Ba", image: "elif-ba-grid-v2.webp", mobileImage: "elif-ba-mobile-v1.webp", description: "Tecvîdli Kur’ân-ı Kerîm elifbâsı ve ezber müfredatı.", metadata: "56 sayfa · PDF kitap", action: "Kitabı aç" },
];

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
  if (section === "elif-ba") return <BookReader homeHref={home} book={elifBaBook} />;
  if (section === "kuran-i-kerim") return <BookReader homeHref={home} book={quranBook} />;

  return (
    <div className="hub-shell">
      <AcademyHeader />
      <main className="hub-main">
        <div className="hub-intro">
          <p className="hub-eyebrow">BİRLİKTE ÖĞRENİYORUZ</p>
          <h1>Öğretmen Kitabı</h1>
          <p>Kur’an-ı Kerim, ders rehberi veya Elif Ba kitabına ulaşmak için bir bölüm seçin.</p>
        </div>
        <nav className="book-grid" aria-label="Ders kitabı seçimi">
          {bookCards.map((card) => (
            <a className="book-option" key={card.section} href={`${home}?bolum=${card.section}`} aria-label={`${card.title} — ${card.action}`}>
              <picture>
                <source media="(max-width: 680px) and (orientation: portrait), (max-width: 680px) and (min-height: 501px)" srcSet={`${cardAssets}${card.mobileImage}`} width="2172" height="724" />
                <img className="book-card-art" src={`${cardAssets}${card.image}`} alt="" width="1122" height="1402" decoding="async" />
              </picture>
              <div className="book-card-accessible"><h2>{card.title}</h2><p>{card.description}</p><span>{card.metadata}</span></div>
            </a>
          ))}
        </nav>
        <footer className="hub-footer"><span>Birlikte İyilik Akademi</span><a href="/">Ana siteye dön <span aria-hidden="true">↗</span></a></footer>
      </main>
    </div>
  );
}
