"use client";

import { useEffect, useMemo, useState } from "react";
import type { buildLessonGuide } from "./lesson-guide";
import type { LessonSourceBundle, MaterialKit } from "./lesson-materials";

type LessonGuide = ReturnType<typeof buildLessonGuide>;
type StudioTab = "text" | "cards" | "game" | "quiz" | "forms";

function SourceTextPanel({ source }: { source: LessonSourceBundle | null }) {
  if (!source) {
    return <p className="material-empty">Bu ders için otomatik özgün metin eşleşmesi bulunamadı.</p>;
  }
  return (
    <details className="original-source">
      <summary>
        <span>Özgün metin · öğretmen incelemesi</span>
        <small>{source.documentName} · {source.pages.map((page) => `s. ${page.number}`).join(", ")}</small>
      </summary>
      <div className="source-guidance">
        Bu bölüm içerik doğrulaması içindir. Sınıfta doğrudan kullanmak için yukarıdaki yaşa uygun anlatım metni hazırlanmıştır.
      </div>
      {source.pages.map((page) => (
        <article key={page.number}>
          <strong>Sayfa {page.number}</strong>
          <pre>{page.text}</pre>
        </article>
      ))}
    </details>
  );
}

function TeachingText({ kit }: { kit: MaterialKit }) {
  return (
    <div className="teaching-text-card">
      <p className="material-eyebrow">Çocuklara doğrudan okuyabilirsiniz</p>
      <h4>{kit.teachingTitle}</h4>
      {kit.teachingParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
  );
}

function CardsPanel({ kit }: { kit: MaterialKit }) {
  const [revealedConcepts, setRevealedConcepts] = useState<number[]>([]);
  const [revealedScenarios, setRevealedScenarios] = useState<number[]>([]);
  const toggle = (items: number[], index: number, setter: (value: number[]) => void) => {
    setter(items.includes(index) ? items.filter((item) => item !== index) : [...items, index]);
  };
  return (
    <div className="material-stack">
      <div>
        <div className="material-subhead"><div><span>01</span><h4>Kavram kartları</h4></div><p>Terimi gösterin, öğrencilerin tanımını alın, sonra açıklamayı açın.</p></div>
        <div className="concept-card-grid">
          {kit.conceptCards.map((card, index) => {
            const revealed = revealedConcepts.includes(index);
            return (
              <button key={`${card.term}-${index}`} className={`concept-card ${revealed ? "revealed" : ""}`} onClick={() => toggle(revealedConcepts, index, setRevealedConcepts)} aria-expanded={revealed}>
                <span>Kavram {String(index + 1).padStart(2, "0")}</span>
                <strong>{card.term}</strong>
                {revealed ? <><p>{card.meaning}</p><small>{card.prompt}</small></> : <em>Açıklamayı göster</em>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="material-subhead"><div><span>02</span><h4>Durum kartları</h4></div><p>Kartı okuyun, sınıftan karar ve gerekçe alın; önerilen cevabı en son açın.</p></div>
        <div className="scenario-grid">
          {kit.scenarioCards.map((card, index) => {
            const revealed = revealedScenarios.includes(index);
            return (
              <article className="scenario-card" key={card.title}>
                <span>Durum {index + 1}</span>
                <h5>{card.title}</h5>
                <p>{card.situation}</p>
                <strong>{card.prompt}</strong>
                <button onClick={() => toggle(revealedScenarios, index, setRevealedScenarios)}>{revealed ? "Öneriyi kapat" : "Önerilen yaklaşımı göster"}</button>
                {revealed && <aside>{card.suggested}</aside>}
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <div className="material-subhead"><div><span>03</span><h4>Duygu ve katılım kartları</h4></div><p>Öğrenci konuşmak zorunda kalmadan bir kart seçerek katılabilir.</p></div>
        <div className="emotion-grid">
          {kit.emotionCards.map((card) => <div key={card.label}><strong>{card.label}</strong><span>{card.cue}</span></div>)}
        </div>
      </div>
    </div>
  );
}

function MatchGame({ kit }: { kit: MaterialKit }) {
  const choices = useMemo(() => [...kit.matchPairs].sort((a, b) => b.id.localeCompare(a.id)), [kit]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const correct = kit.matchPairs.filter((pair) => answers[pair.id] === pair.right).length;
  return (
    <div className="game-panel">
      <div className="material-subhead"><div><span>01</span><h4>Kavram–açıklama eşleştirmesi</h4></div><p>Sınıf cevabı söyler; öğretmen ekrandan seçer ve birlikte kontrol eder.</p></div>
      <div className="match-list">
        {kit.matchPairs.map((pair, index) => {
          const isCorrect = checked && answers[pair.id] === pair.right;
          const isWrong = checked && answers[pair.id] && answers[pair.id] !== pair.right;
          return (
            <label className={`${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`} key={pair.id}>
              <span><b>{index + 1}</b>{pair.left}</span>
              <select value={answers[pair.id] || ""} onChange={(event) => { setAnswers({ ...answers, [pair.id]: event.target.value }); setChecked(false); }}>
                <option value="">Açıklamayı seçin</option>
                {choices.map((choice) => <option key={choice.id} value={choice.right}>{choice.right}</option>)}
              </select>
            </label>
          );
        })}
      </div>
      <div className="game-actions">
        <button className="primary-button" onClick={() => setChecked(true)} disabled={Object.keys(answers).length !== kit.matchPairs.length}>Eşleştirmeyi kontrol et</button>
        <button onClick={() => { setAnswers({}); setChecked(false); }}>Yeniden başlat</button>
        {checked && <strong>{correct === kit.matchPairs.length ? "Harika — tüm eşleştirmeler doğru." : `${correct} / ${kit.matchPairs.length} doğru. Yanlışları birlikte yeniden düşünün.`}</strong>}
      </div>

      <div className="material-subhead sequence-head"><div><span>02</span><h4>Düşünme sırası</h4></div><p>Kartları soldan sağa okuyun; her basamak için sınıftan bir örnek isteyin.</p></div>
      <div className="sequence-track">
        {kit.sequenceCards.map((card, index) => <article key={card.label}><span>{index + 1}</span><strong>{card.label}</strong><p>{card.detail}</p></article>)}
      </div>
    </div>
  );
}

function QuizPanel({ kit }: { kit: MaterialKit }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <div className="quiz-list">
      {kit.quiz.map((item, questionIndex) => {
        const answer = answers[questionIndex];
        const answered = answer !== undefined;
        return (
          <article key={item.question}>
            <span>Soru {questionIndex + 1} / {kit.quiz.length}</span>
            <h4>{item.question}</h4>
            <div>
              {item.choices.map((choice, choiceIndex) => {
                const selected = answer === choiceIndex;
                const correct = answered && choiceIndex === item.correctIndex;
                return <button key={choice} className={`${selected ? "selected" : ""} ${correct ? "correct" : ""}`} onClick={() => setAnswers({ ...answers, [questionIndex]: choiceIndex })}>{String.fromCharCode(65 + choiceIndex)}. {choice}</button>;
              })}
            </div>
            {answered && <p className={answer === item.correctIndex ? "quiz-correct" : "quiz-retry"}>{answer === item.correctIndex ? "Doğru. " : "Bir kez daha düşünelim. "}{item.feedback}</p>}
          </article>
        );
      })}
    </div>
  );
}

function FormsPanel({ kit }: { kit: MaterialKit }) {
  return (
    <div className="forms-grid">
      <section className="exit-ticket-card">
        <span>ÖĞRENCİ FORMU</span>
        <h4>3–2–1 Çıkış Bileti</h4>
        {kit.exitTicket.map((item, index) => <label key={item}><b>{3 - index}</b><div><strong>{item}</strong><i /></div></label>)}
        <footer>Ad / rumuz: ____________________  Tarih: ____________</footer>
      </section>
      <section className="observation-card">
        <span>ÖĞRETMEN FORMU</span>
        <h4>Hızlı gözlem kaydı</h4>
        <table>
          <thead><tr><th>Gözlenebilir öğrenme kanıtı</th><th>Bağımsız</th><th>Destekle</th><th>Sonraki adım</th></tr></thead>
          <tbody>{kit.observation.map((item) => <tr key={item}><td>{item}</td><td>□</td><td>□</td><td>□</td></tr>)}</tbody>
        </table>
        <label className="teacher-note">Öğretmen notu <i /></label>
      </section>
    </div>
  );
}

export function LessonMaterialsStudio({ guide, kit, source, onStart, onPrint }: { guide: LessonGuide; kit: MaterialKit; source: LessonSourceBundle | null; onStart: () => void; onPrint: () => void }) {
  const [tab, setTab] = useState<StudioTab>("text");
  const tabs: Array<[StudioTab, string]> = [["text", "Anlatım Metni"], ["cards", "Hazır Kartlar"], ["game", "Sınıf Oyunu"], ["quiz", "Mini Quiz"], ["forms", "Formlar"]];
  return (
    <section className="materials-studio">
      <header className="materials-studio-head">
        <div><p className="material-eyebrow">Ders için hazırlandı</p><h3>Hazır Ders Materyalleri</h3><span>Öğretmen bu bölümden ayrılmadan anlatabilir, yansıtabilir, oynatabilir ve değerlendirebilir.</span></div>
        <div><button onClick={onPrint}>Materyal setini yazdır</button><button className="start-lesson-button" onClick={onStart}>Dersi Başlat →</button></div>
      </header>
      <div className="material-counts"><span><strong>{kit.conceptCards.length}</strong> kavram kartı</span><span><strong>{kit.scenarioCards.length}</strong> durum kartı</span><span><strong>{kit.quiz.length}</strong> soru</span><span><strong>{kit.observation.length}</strong> gözlem ölçütü</span></div>
      <nav className="material-tabs" aria-label="Hazır ders materyalleri">
        {tabs.map(([value, label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}
      </nav>
      <div className="material-panel">
        {tab === "text" && <div className="material-stack"><div className="board-plan">{kit.boardPlan.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.text}</strong></div>)}</div><TeachingText kit={kit} /><div className="teacher-language"><h4>Öğretmenin kullanabileceği güvenli cümleler</h4>{kit.teacherLanguage.map((item) => <p key={item}>“{item}”</p>)}</div><SourceTextPanel source={source} /></div>}
        {tab === "cards" && <CardsPanel kit={kit} />}
        {tab === "game" && <MatchGame kit={kit} />}
        {tab === "quiz" && <QuizPanel kit={kit} />}
        {tab === "forms" && <FormsPanel kit={kit} />}
      </div>
      <footer className="material-method-note">Bu set {guide.age} düzeyi için kısa anlatım, aktif katılım, çoklu ifade ve biçimlendirici değerlendirme ilkeleriyle hazırlanmıştır.</footer>
    </section>
  );
}

export function ClassroomMode({ open, guide, kit, onClose }: { open: boolean; guide: LessonGuide; kit: MaterialKit; onClose: () => void }) {
  const [slide, setSlide] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    setSlide(0); setRevealed(false); setQuizAnswer(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setSlide((value) => Math.min(6, value + 1));
      if (event.key === "ArrowLeft") setSlide((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  useEffect(() => { setRevealed(false); setQuizAnswer(null); }, [slide]);
  if (!open) return null;
  const quizItem = kit.quiz[0];
  return (
    <div className="classroom-mode" role="dialog" aria-modal="true" aria-label={`${guide.title} sınıf sunumu`}>
      <header><div><span>{guide.grade}. sınıf · {guide.month}. ay · {guide.lessonNumber}. ders</span><strong>{guide.title}</strong></div><button onClick={onClose}>Sunumu kapat ×</button></header>
      <main>
        {slide === 0 && <section className="class-slide cover-slide"><p>Bugünkü ders</p><h2>{guide.title}</h2><div>{guide.categoryLabel}</div><span>Hazırsanız birlikte başlayalım.</span></section>}
        {slide === 1 && <section className="class-slide goal-slide"><p>Bugünkü hedefimiz</p><h2>{kit.boardPlan[1].text}</h2><div className="big-question"><span>Ana sorumuz</span><strong>{kit.boardPlan[2].text}</strong></div></section>}
        {slide === 2 && <section className="class-slide read-slide"><p>Birlikte dinleyelim ve düşünelim</p><h2>{kit.teachingTitle}</h2>{kit.teachingParagraphs.map((paragraph) => <div key={paragraph}>{paragraph}</div>)}</section>}
        {slide === 3 && <section className="class-slide concept-slide"><p>Kavram kartları</p><div>{kit.conceptCards.slice(0, 4).map((card) => <article key={card.term}><strong>{card.term}</strong>{revealed && <span>{card.meaning}</span>}</article>)}</div><button onClick={() => setRevealed(!revealed)}>{revealed ? "Açıklamaları gizle" : "Açıklamaları göster"}</button></section>}
        {slide === 4 && <section className="class-slide scenario-slide"><p>Birlikte karar verelim</p><h2>{kit.scenarioCards[0].title}</h2><div>{kit.scenarioCards[0].situation}</div><strong>{kit.scenarioCards[0].prompt}</strong><button onClick={() => setRevealed(!revealed)}>{revealed ? "Öneriyi gizle" : "Önerilen yaklaşımı göster"}</button>{revealed && <aside>{kit.scenarioCards[0].suggested}</aside>}</section>}
        {slide === 5 && <section className="class-slide quiz-slide"><p>Mini quiz</p><h2>{quizItem.question}</h2><div>{quizItem.choices.map((choice, index) => <button key={choice} className={`${quizAnswer === index ? "selected" : ""} ${quizAnswer !== null && index === quizItem.correctIndex ? "correct" : ""}`} onClick={() => setQuizAnswer(index)}>{String.fromCharCode(65 + index)}. {choice}</button>)}</div>{quizAnswer !== null && <strong>{quizAnswer === quizItem.correctIndex ? "Doğru! " : "Bir kez daha düşünelim. "}{quizItem.feedback}</strong>}</section>}
        {slide === 6 && <section className="class-slide exit-slide"><p>Dersi tamamlayalım</p><h2>Çıkış bileti</h2>{kit.exitTicket.map((item, index) => <div key={item}><span>{3 - index}</span><strong>{item}</strong></div>)}</section>}
      </main>
      <footer><button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0}>← Geri</button><div>{Array.from({ length: 7 }, (_, index) => <span key={index} className={index === slide ? "active" : ""} />)}<strong>{slide + 1} / 7</strong></div><button className="primary-button" onClick={() => slide === 6 ? onClose() : setSlide(slide + 1)}>{slide === 6 ? "Dersi bitir" : "Devam →"}</button></footer>
    </div>
  );
}

export function PrintMaterials({ guide, kit, source }: { guide: LessonGuide; kit: MaterialKit; source: LessonSourceBundle | null }) {
  return (
    <article className="material-print-sheet">
      <header><span>Güzel Ahlak · Hazır Ders Materyali</span><h1>{guide.title}</h1><p>{guide.grade}. sınıf · {guide.month}. ay · {guide.lessonNumber}. ders</p></header>
      <h2>Çocuklara okunacak anlatım</h2>
      {kit.teachingParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <h2>Kavram kartları</h2>
      <div className="print-card-grid">{kit.conceptCards.map((card) => <section key={card.term}><h3>{card.term}</h3><p>{card.meaning}</p><strong>{card.prompt}</strong></section>)}</div>
      <h2>Durum kartları</h2>
      <div className="print-card-grid">{kit.scenarioCards.map((card) => <section key={card.title}><h3>{card.title}</h3><p>{card.situation}</p><strong>{card.prompt}</strong><small>Öneri: {card.suggested}</small></section>)}</div>
      <h2>Düşünme sırası</h2>
      <ol>{kit.sequenceCards.map((card) => <li key={card.label}><strong>{card.label}:</strong> {card.detail}</li>)}</ol>
      <FormsPanel kit={kit} />
      {source && <section className="print-source"><h2>Özgün metin · öğretmen incelemesi</h2><small>{source.documentName} · {source.pages.map((page) => `s. ${page.number}`).join(", ")}</small><pre>{source.text}</pre></section>}
    </article>
  );
}
