import { readableTopicTitle, sourceDisplayText, type CurriculumAge, type CurriculumTopic } from "./age-curricula.ts";
import { assessmentQuestions, resourceLabel, sectionLinks, topicText } from "./native-curriculum.ts";

export type ProgramLink = { href: string; label: string };
/** What a teacher reads aloud for one topic, in reading order. Paragraph text may hold plain URLs. */
export type ProgramBlock =
  | { kind: "title"; number: number; text: string }
  | { kind: "activities"; links: ProgramLink[] }
  | { kind: "quote"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "verse"; lines: string[] };

const sentenceEnd = /[.!?…:;\]](?:["”’')\]])*$/;
const storyLabel = /^(menk[ıi]be|hik[âa]ye|k[ıi]ssa|n[üu]kte)\b/i;

function lines(text: string) {
  return sourceDisplayText(text).split("\n").map((line) => line.replace(/\s+/g, " ").trim());
}

/** A short line without closing punctuation that names a story, e.g. "Menkıbe 1 - İhtiyar Kadının Sevinci". */
function isStoryTitle(line: string, next: string | undefined) {
  if (storyLabel.test(line)) return true;
  return Boolean(next) && line.length <= 70 && /^[A-ZÇĞİÖŞÜÂÎÛ“"]/.test(line) && !/[.,;:!?…"”\]]$/.test(line) && !/[.!?…]/.test(line) && line.split(" ").length <= 9;
}

/**
 * Joins the PDF's wrapped lines back into paragraphs. A line ends a paragraph only when it closes a
 * sentence and stops clearly short of the column width; full lines that happen to end with a full
 * stop keep flowing into the next line.
 */
export function paragraphs(text: string, options: { titles?: boolean } = {}): ProgramBlock[] {
  const source = lines(text);
  const width = Math.max(60, ...source.map((line) => line.length));
  const blocks: ProgramBlock[] = [];
  let pending = "";
  let item = false;
  let skipUntil = 0;
  const nextLine = (index: number) => source.slice(index + 1).find(Boolean);
  const flush = () => {
    if (pending && item) {
      const previous = blocks.at(-1);
      if (previous?.kind === "list") previous.items.push(pending); else blocks.push({ kind: "list", items: [pending] });
    } else if (pending) blocks.push({ kind: "paragraph", text: pending });
    pending = ""; item = false;
  };
  source.forEach((line, index) => {
    if (!line || /^[•●*]$/.test(line)) { if (!line) flush(); return; }
    const bullet = /^[•●*]\s*/.exec(line);
    if (bullet) { flush(); pending = line.slice(bullet[0].length); item = true; return; }
    if (index < skipUntil) return;
    if (!pending) {
      // Four or more short lines in a row are a poem, a dialogue or a list of sayings: keep their lines.
      let end = index;
      while (end + 1 < source.length && source[end + 1] && source[end + 1].length < width * 0.6 && !/^[•●*]/.test(source[end + 1])) end++;
      if (line.length < width * 0.6 && end - index >= 3) {
        const titled = options.titles && isStoryTitle(line, nextLine(index));
        if (titled) blocks.push({ kind: "heading", text: line });
        blocks.push({ kind: "verse", lines: source.slice(titled ? index + 1 : index, end + 1) });
        skipUntil = end + 1;
        return;
      }
    }
    if (options.titles && !pending && isStoryTitle(line, nextLine(index))) { blocks.push({ kind: "heading", text: line }); return; }
    pending += pending ? ` ${line}` : line;
    if (sentenceEnd.test(line) && line.length < width * 0.82) flush();
  });
  flush();
  return blocks;
}

/** Discussion questions: one per bullet or per line ending in a question mark. */
export function questionItems(text: string) {
  const items: string[] = [];
  let pending = "";
  for (const line of lines(text)) {
    if (!line) continue;
    const bullet = /^(?:[•●-]|\d+[.)])\s*/.exec(line);
    if (bullet) { if (pending) items.push(pending); pending = line.slice(bullet[0].length); }
    else pending += pending ? ` ${line}` : line;
    if (/[?.!]["”]?$/.test(pending)) { items.push(pending); pending = ""; }
  }
  if (pending) items.push(pending);
  // Drop printed labels such as "KAZANDIK, NE ANLADIK?".
  return items.filter((item) => item && !isUpperCase(item));
}

function isUpperCase(text: string) {
  const letters = [...text].filter((char) => /\p{L}/u.test(char));
  return letters.length > 0 && letters.every((char) => char === char.toLocaleUpperCase("tr-TR"));
}

/**
 * Büyüklerin sözleri. A leading all-caps label such as "SÖZLERİNDEN MİSAL/LER" and the
 * "Büyükler buyuruyor ki:" lead-in are dropped; the saying itself is kept as printed.
 */
export function quoteText(text: string) {
  const kept = lines(text).filter(Boolean);
  if (kept.length && isUpperCase(kept[0])) kept.shift();
  const saying = kept.join(" ").replace(/^[•●*]\s*/, "").replace(/^büyükler(?:imiz)?\s+buyur\p{L}*\s+ki\s*[:,]?\s*/iu, "").trim();
  return saying.replace(/^([“"‘']?)(\p{Ll})/u, (_, mark: string, letter: string) => mark + letter.toLocaleUpperCase("tr-TR"));
}

export function activityLinks(topic: CurriculumTopic): ProgramLink[] {
  return sectionLinks(topic, "materials")
    .filter((href) => /^https?:\/\/(www\.)?wordwall\.net\//.test(href))
    .map((href, index, all) => {
      // Links without a name in the address read "Wordwall etkinliği", numbered only when there are several.
      const label = all.length === 1 ? resourceLabel(href, index).replace(/^(Wordwall etkinliği) 1$/, "$1") : resourceLabel(href, index);
      return { href, label: label.charAt(0).toLocaleUpperCase("tr-TR") + label.slice(1) };
    });
}

/**
 * The teacher's reading text for a topic: title, the topic's Wordwall activities where the
 * programme lists them, the elders' saying, the explanation, the stories and the closing questions.
 * Learning outcomes, method, key concepts, messages and source lists stay in the PDF.
 */
export function programBlocks(topic: CurriculumTopic, age: CurriculumAge): ProgramBlock[] {
  const blocks: ProgramBlock[] = [{ kind: "title", number: topic.number, text: readableTopicTitle(topic.title) }];
  const links = activityLinks(topic);
  if (links.length) blocks.push({ kind: "activities", links });
  const saying = quoteText(topicText(topic, "sayings"));
  if (saying) blocks.push({ kind: "quote", text: saying });
  blocks.push(...paragraphs(topicText(topic, "explanation"), { titles: true }));
  const stories = paragraphs(topicText(topic, "stories"), { titles: true });
  if (stories.length) {
    if (stories[0].kind !== "heading") blocks.push({ kind: "heading", text: "Hikâye" });
    blocks.push(...stories);
  }
  const original = topicText(topic, "questions");
  const questions = original ? questionItems(original) : assessmentQuestions(topic, age);
  if (questions.length) blocks.push({ kind: "heading", text: "Sorular" }, { kind: "list", items: questions });
  return blocks;
}
