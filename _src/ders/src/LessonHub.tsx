import { lazy, Suspense } from "react";
import { BookReader } from "./BookReader";
import { elifBaBook, karabasTecvidBook, mehmedMertElifBaBook, quranBook } from "./books";
import { CurriculumCards } from "./CurriculumCards";
import { AcademyHeader } from "./AcademyHeader";

const CurriculumPortal = lazy(() => import("./CurriculumPortal").then((module) => ({ default: module.CurriculumPortal })));
const ElifbaVideos = lazy(() => import("./ElifbaVideos").then((module) => ({ default: module.ElifbaVideos })));
const AgeCurriculumPortal = lazy(() => import("./AgeCurriculumPortal").then((module) => ({ default: module.AgeCurriculumPortal })));
const home = import.meta.env.BASE_URL.replace(/\/$/, "");
const cardAssets = `${import.meta.env.BASE_URL}assets/book-cards/`;

const bookCards = [
  { section: "kuran-i-kerim", title: "Kur’an-ı Kerim", image: "kuran-grid-v1.webp", mobileImage: "kuran-mobile-v1.webp", description: "Sayfalarını çevirerek okuyabileceğiniz Kur’an-ı Kerim kitabı.", metadata: "615 sayfa · PDF kitap", action: "Kitabı aç" },
  { section: "guzel-ahlak", title: "Çocuklar ve Gençler İçin Temel Dini Bilgiler", image: "temel-dini-bilgiler-grid-v1.webp", mobileImage: "temel-dini-bilgiler-mobile-v1.webp", description: "Sınıf ve aya göre haftalık ders sayfaları; okunaklı, çevrilebilir kitap düzeni.", metadata: "3–8. sınıf · 9 ay", action: "Derslere git" },
  { section: "elif-ba", title: "Elifba", image: "elifba-grid-v4.webp", mobileImage: "elifba-mobile-v3.webp", description: "Tecvîdli Kur’ân-ı Kerîm elifbâsı, Karabaş Tecvid ve video dersler.", metadata: "3 kitap · Video dersler", action: "Kitabı aç" },
];

export function LessonHub() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("bolum");
  if (section === "ahlak-mufredati") return <Suspense fallback={<div className="empty-state" role="status"><p>Müfredat açılıyor…</p></div>}><AgeCurriculumPortal /></Suspense>;
  if (section === "guzel-ahlak" || (!section && params.has("sinif"))) {
    return <Suspense fallback={<div className="empty-state" role="status"><p>Ders kitabı açılıyor…</p></div>}><CurriculumPortal onHomeHref={home} /></Suspense>;
  }
  if (section === "elif-ba") {
    const requested = params.get("kitap");
    const choice = requested === "mehmed-mert" || requested === "mehmet-mert" ? "mehmed-mert" : requested === "karabas-tecvid" || requested === "videolar" ? requested : "elifba";
    const bookChoices = [
      { title: elifBaBook.title, href: `${home}?bolum=elif-ba`, active: choice === "elifba" },
      { title: mehmedMertElifBaBook.title, href: `${home}?bolum=elif-ba&kitap=mehmed-mert`, active: choice === "mehmed-mert" },
      { title: karabasTecvidBook.title, href: `${home}?bolum=elif-ba&kitap=karabas-tecvid`, active: choice === "karabas-tecvid" },
      { title: "Video dersler", href: `${home}?bolum=elif-ba&kitap=videolar`, active: choice === "videolar" },
    ];
    if (choice === "videolar") {
      return <BookReader homeHref={home} title="Elifba video dersleri" bookChoices={bookChoices}><Suspense fallback={<div className="empty-state" role="status"><p>Videolar açılıyor…</p></div>}><ElifbaVideos /></Suspense></BookReader>;
    }
    const book = choice === "mehmed-mert" ? mehmedMertElifBaBook : choice === "karabas-tecvid" ? karabasTecvidBook : elifBaBook;
    return <BookReader homeHref={home} book={book} bookChoices={bookChoices} />;
  }
  if (section === "kuran-i-kerim") return <BookReader homeHref={home} book={quranBook} />;

  return (
    <div className="hub-shell">
      <AcademyHeader />
      <main className="hub-main">
        <div className="hub-intro">
          <p className="hub-eyebrow">BİRLİKTE ÖĞRENİYORUZ</p>
          <h1>Öğretmen Kitabı</h1>
          <p>Kitaplara, temel dini bilgiler ders kitabına ve yaş gruplarına göre ahlak eğitim programlarına ulaşın.</p>
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
        <section className="hub-curricula" aria-labelledby="hubCurriculaTitle"><div className="hub-curricula-heading"><div><p className="hub-eyebrow">YAŞA GÖRE MÜFREDATLAR</p><h2 id="hubCurriculaTitle">Ahlak Eğitim Programları</h2></div><span>Birlikte İyilik</span></div><CurriculumCards /></section>
        <footer className="hub-footer"><span>Birlikte İyilik Akademi</span><a href="/">Ana siteye dön <span aria-hidden="true">↗</span></a></footer>
      </main>
    </div>
  );
}
