import { sourceDisplayText, type CurriculumAge, type CurriculumTopic } from "./age-curricula.ts";

export type ReadingBlock = { kind: "heading" | "paragraph"; text: string } | { kind: "list"; items: string[] };

function isHeading(line: string) {
  if (line.length > 85 || !/^[A-ZÇĞİÖŞÜÂÎÛ]/.test(line) || /[.,;:]$/.test(line)) return false;
  const words = line.split(/\s+/).filter((word) => !/^(ve|bir|ile|da|de|ki|için)$/i.test(word));
  return words.length <= 10 && words.filter((word) => /^[A-ZÇĞİÖŞÜÂÎÛ]/.test(word)).length / words.length >= .75;
}

export function readingBlocks(text: string, headings = true): ReadingBlock[] {
  const blocks: ReadingBlock[] = [];
  let pending = "", item = false;
  const flush = () => {
    if (!pending) return;
    if (item) {
      const previous = blocks.at(-1);
      if (previous?.kind === "list") previous.items.push(pending);
      else blocks.push({ kind: "list", items: [pending] });
    } else blocks.push({ kind: "paragraph", text: pending });
    pending = ""; item = false;
  };
  for (const original of sourceDisplayText(text).split("\n")) {
    const line = original.trim();
    if (!line) { flush(); continue; }
    const marker = /^(?:[•●]|\d+[.)])\s+/.exec(line);
    if (marker) { flush(); pending = line.slice(marker[0].length); item = true; continue; }
    if (headings && isHeading(line)) { flush(); blocks.push({ kind: "heading", text: line }); continue; }
    pending += `${pending ? " " : ""}${line}`;
    if (!item && /[.!?…:\]](?:["”')])?$/.test(line)) flush();
  }
  flush();
  return blocks;
}

export function learningItems(text: string) {
  return readingBlocks(text, false).flatMap((block) => block.kind === "list" ? block.items : [block.text]);
}

export function topicText(topic: CurriculumTopic, key: string) {
  return topic.sections.find((section) => section.key === key)?.text || "";
}

export function topicDuration(topic: CurriculumTopic) {
  const values = /^\s*(\d+)(?:\s*\+\s*(\d+))?/.exec(topicText(topic, "duration"));
  if (!values) return { label: "", total: 0 };
  const first = Number(values[1]), second = Number(values[2]) || 0;
  return { label: second ? first === second ? `2 × ${first} dk` : `${first} + ${second} dk` : `${first} dk`, total: first + second };
}

export function sectionLinks(topic: CurriculumTopic, key: string) {
  return [...new Set((topicText(topic, key).match(/https?:\/\/[^\s]+/g) || []).map((url) => topic.links.find((link) => link.startsWith(url)) || url))];
}

export function resourceLabel(href: string, index: number) {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "wordwall.net") {
      const slug = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) || "");
      return /^\d+$/.test(slug) ? `Wordwall etkinliği ${index + 1}` : slug.replace(/-/g, " ").trim();
    }
    const names: Record<string, string> = { "dinimizislam.com": "Dinimiz İslam", "hakikatkitabevi.net": "Hakikat Kitabevi", "cocukpinari.com": "Çocuk Pınarı" };
    return names[host] || host;
  } catch (_) { return "Kaynağı aç"; }
}

export function assessmentQuestions(topic: CurriculumTopic, age: CurriculumAge) {
  const original = topicText(topic, "questions");
  if (original) return learningItems(original);
  if (age === "7-10" && topic.number === 41) {
    return ["Nezaket kurallarına örnekler verebilir misiniz?", "Nezaket kurallarına niçin uymalıyız?", "Nezaket kurallarına uyan bir insanın hayatı nasıl olur?"];
  }
  if (age === "11-14" && topic.number === 56) {
    return ["Sıla-i rahim ne anlama gelir?", "Akrabalarımızla ilişkilerimizi güçlü tutmak için hangi davranışlarda bulunabiliriz?", "Büyüklerimizi ve yakınlarımızı ziyaret ederken nelere dikkat etmeliyiz?"];
  }
  if (age === "11-14" && topic.number === 57) {
    return ["Birine doğruyu söylerken onun duygularını gözetmek neden önemlidir?", "Kaba bir davranışla karşılaştığımızda nasıl karşılık verebiliriz?", "Bir arkadaşımızı mahcup etmeden uyarmak için nasıl bir yol izleyebiliriz?"];
  }
  return [];
}
