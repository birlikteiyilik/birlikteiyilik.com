export type CurriculumAge = "7-10" | "11-14";
export type CurriculumSection = { key: string; text: string; pages: number[] };
export type CurriculumTopic = { number: number; title: string; startPage: number; endPage: number; sections: CurriculumSection[]; links: string[] };
export type AgeCurriculum = {
  id: CurriculumAge; title: string; ageLabel: string; publisher: string; edition: string;
  pageCount: number; topicCount: number; pdfFile: string; sourceSha256: string;
  topics: CurriculumTopic[];
};

export const ageCurricula = [
  { id: "7-10" as const, ageLabel: "7–10 yaş", topicCount: 56, pageCount: 175, edition: "Nisan 2025",
    description: "Duyguları tanımak, güzel alışkanlıklar kazanmak ve günlük hayatta nezaket.",
    examples: "Öfkeye hâkim olmak · Paylaşmak · Görgü kuralları" },
  { id: "11-14" as const, ageLabel: "11–14 yaş", topicCount: 59, pageCount: 187, edition: "Mayıs 2025",
    description: "Değerler üzerine düşünmek, sorumluluk almak ve iyi davranışı hayatına taşımak.",
    examples: "Doğruluk · Adalet · Mesuliyet ve sorumluluk" },
];

export const curriculumSectionTitles: Record<string, string> = {
  age: "Yaş seviyesi", outcomes: "Öğrenme çıktıları", materials: "Oyunlar ve materyaller",
  duration: "Süre ve yöntem", concepts: "Anahtar kavramlar", messages: "Verilecek mesajlar",
  sayings: "Büyüklerin sözlerinden", explanation: "Açıklamalar", stories: "Konuyla ilgili menkıbeler",
  questions: "Ders sonunda ne anladık?", sources: "Kaynaklar",
};

export function readableTopicTitle(title: string) {
  return sourceDisplayText(title.toLocaleLowerCase("tr-TR").replace(/(^|[\s/(–-])([a-zçğıöşüâîû])/g, (_, before: string, letter: string) => before + letter.toLocaleUpperCase("tr-TR")));
}

export function sourceDisplayText(text: string) {
  return text.replace(/\bTe[âa]l[âa]/g, (word) => `t${word.slice(1)}`);
}

export function normalizeCurriculumSearch(text: string) {
  return text.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/\p{M}/gu, "").replace(/ı/g, "i").trim();
}

export function searchCurriculumTopics(topics: CurriculumTopic[], query: string) {
  const words = normalizeCurriculumSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return topics;
  return topics.filter((topic) => {
    const text = normalizeCurriculumSearch(`${topic.number} ${topic.title} ${topic.sections.map((section) => section.text).join(" ")}`);
    return words.every((word) => text.includes(word));
  });
}

export function curriculumTopicAtPage(data: AgeCurriculum, page: number) {
  return data.topics.find((topic) => page >= topic.startPage && page <= topic.endPage);
}

export function curriculumTopic(data: AgeCurriculum, number: number) {
  return data.topics.find((topic) => topic.number === number) || data.topics[0];
}

export function clampCurriculumPage(page: number, count: number, fallback: number) {
  return Number.isFinite(page) && page >= 1 ? Math.min(count, Math.trunc(page)) : fallback;
}
