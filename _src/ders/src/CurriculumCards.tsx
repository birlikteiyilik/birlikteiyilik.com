import { ageCurricula } from "./age-curricula";
import { CurriculumLinkIcon } from "./CurriculumLinkIcon";

const home = import.meta.env.BASE_URL.replace(/\/$/, "");

export function CurriculumCards() {
  return <div className="age-curriculum-cards">
    {ageCurricula.map((program, index) => <a key={program.id} className={`age-curriculum-card age-curriculum-card-${index}`} href={`${home}?bolum=ahlak-mufredati&yas=${program.id}`}>
      <div className="age-curriculum-card-top"><span>TACEV · AHLAK EĞİTİM PROGRAMI</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1m0-14c3-2 6-2 9-1v14c-3-1-6-1-9 1V6Z"/><path d="M6 9h3m-3 4h3m6-4h3m-3 4h3"/></svg></div>
      <h3>{program.ageLabel}<span>müfredatı</span></h3>
      <p>{program.description}</p>
      <div className="age-curriculum-card-bottom"><span>{program.topicCount} konu · Ders rehberi</span><strong>Konuları keşfet <CurriculumLinkIcon /></strong></div>
    </a>)}
  </div>;
}
