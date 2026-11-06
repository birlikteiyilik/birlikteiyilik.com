import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { readableArchivePages } from "../src/archive-pages.ts";
import { archiveWeeks, isTopicHeading, topicTitle, weekAtPage } from "../src/archive-weeks.ts";
import { videoCover, embedUrl, thumbnailUrl } from "../src/elifba-videos.ts";
import { paragraphs, programBlocks, questionItems } from "../src/program-text.ts";
import type { ArchiveData } from "../src/lesson-guide.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const archive: ArchiveData = read("../public/data/archive.json");
const newVatanActivity = "https://wordwall.net/tr/resource/12756846/vatan-sevgisi";

test("every grade and month splits into ordered weeks that cover each readable page once", () => {
  for (const [band, months] of Object.entries(archive.plans)) {
    for (const [month, plan] of Object.entries(months)) {
      const source = archive.documents.find((item) => item.kind === "content" && item.month === Number(month) && item.band === (plan.isExtended ? "7-8" : band));
      assert.ok(source, `${band}/${month}`);
      const pages = readableArchivePages(source.pages);
      const weeks = archiveWeeks(pages);
      assert.equal(weeks.length, 4, `${band}/${month}`);
      assert.equal(weeks[0].startPage, 1);
      assert.equal(weeks.at(-1)!.endPage, pages.length);
      weeks.forEach((week, index) => {
        assert.ok(week.startPage <= week.endPage);
        if (index) assert.equal(week.startPage, weeks[index - 1].endPage + 1);
      });
      assert.equal(weekAtPage(weeks, pages.length).week, 4);
    }
  }
});

test("a month with twenty topics gets five topics per week, starting at the topic's first page", () => {
  const source = archive.documents.find((item) => item.kind === "content" && item.month === 1 && item.band === "7-8")!;
  const weeks = archiveWeeks(readableArchivePages(source.pages));
  assert.deepEqual(weeks.map((week) => week.topics.length), [5, 5, 5, 5]);
  assert.deepEqual(weeks.map((week) => week.startPage), [1, 15, 28, 45]);
  assert.equal(weeks[0].topics[2].title, "Vatan sevgisi, Çanakkale Savaşı");
});

test("topic titles are recognised and made readable without touching story pages", () => {
  assert.ok(isTopicHeading("Konu: Edeb ve hürmet"));
  assert.ok(isTopicHeading("KUL HAKKI"));
  assert.ok(!isTopicHeading("MENKIBE: Yerdeki Besmele"));
  assert.ok(!isTopicHeading("Selam vermek, bir kimseye yapılacak en güzel duadır."));
  assert.equal(topicTitle("KUL HAKKI"), "Kul Hakkı");
  assert.equal(topicTitle("Konu: Ehemmi Mühimme tercih etmek"), "Ehemmi Mühimme tercih etmek");
});

test("programme books hold only the teacher's reading text, with the Wordwall activities in place", () => {
  for (const age of ["7-10", "11-14"] as const) {
    const data = read(`../public/data/ahlak-mufredati-${age}.json`);
    for (const topic of data.topics) {
      const blocks = programBlocks(topic, age);
      assert.equal(blocks[0].kind, "title", `${age} ${topic.number}`);
      assert.ok(blocks.some((block) => block.kind === "paragraph"), `${age} ${topic.number} has reading text`);
      const text = JSON.stringify(blocks);
      // Lesson-plan rows (outcomes, method, sources) are left to the PDF.
      for (const key of ["outcomes", "method", "sources"]) {
        const first = topic.sections.find((section: { key: string }) => section.key === key)?.text.split("\n")[0].replace(/^[•\d.\s]+/, "").trim();
        if (first && first.length > 25) assert.ok(!text.includes(first), `${age} ${topic.number} leaves out ${key}`);
      }
      const activities = blocks.find((block) => block.kind === "activities");
      const wordwall = topic.links.filter((href: string) => href.includes("wordwall.net"));
      if (wordwall.length) assert.ok(activities && activities.kind === "activities" && activities.links.length, `${age} ${topic.number} links its activities`);
      if (activities?.kind === "activities") assert.equal(blocks.indexOf(activities), 1);
    }
    const vatan = data.topics.find((topic: { title: string }) => topic.title === "VATAN SEVGİSİ");
    const links = programBlocks(vatan, age).flatMap((block) => block.kind === "activities" ? block.links.map((link) => link.href) : []);
    assert.ok(links.includes(newVatanActivity));
    assert.ok(!links.includes("https://wordwall.net/tr/resource/28325043"));
  }
});

test("wrapped PDF lines are joined into paragraphs, and short runs keep their lines", () => {
  const width = "x".repeat(100);
  assert.deepEqual(paragraphs(`${width} birinci satır.\nikinci satır burada biter.\nYeni paragraf.`), [
    { kind: "paragraph", text: `${width} birinci satır. ikinci satır burada biter.` },
    { kind: "paragraph", text: "Yeni paragraf." },
  ]);
  assert.deepEqual(paragraphs(`Menkıbe 1 - Kısa Başlık\n${width} metin.`, { titles: true })[0], { kind: "heading", text: "Menkıbe 1 - Kısa Başlık" });
  const poem = paragraphs(`${width}\nbiter.\nBir Şiir (Şiir)\nŞanlı kitap önderimiz kılındı\nİman, sancak, gönderimiz kılındı\nİklim-i Rum, minderimiz kılındı\nOl mindere kavi diz verilmeli.`, { titles: true });
  assert.deepEqual(poem.slice(1), [{ kind: "heading", text: "Bir Şiir (Şiir)" }, { kind: "verse", lines: ["Şanlı kitap önderimiz kılındı", "İman, sancak, gönderimiz kılındı", "İklim-i Rum, minderimiz kılındı", "Ol mindere kavi diz verilmeli."] }]);
  assert.deepEqual(questionItems("Birinci soru nedir?\nİkinci soru uzun bir\nsatırda devam eder mi?\n• Üçüncü?"), ["Birinci soru nedir?", "İkinci soru uzun bir satırda devam eder mi?", "Üçüncü?"]);
});

test("Karabaş Tecvid is published as a 52 page right-to-left book", () => {
  for (let page = 1; page <= 52; page++) assert.ok(existsSync(new URL(`../public/assets/karabas-tecvid-pages/page-${String(page).padStart(2, "0")}.webp`, import.meta.url)));
  assert.ok(existsSync(new URL("../public/assets/karabas-tecvid.pdf", import.meta.url)));
});

test("video covers use the YouTube cover and read the lesson number and topic from playlist titles", () => {
  assert.deepEqual(videoCover("ElifBa Mobil - Ders 01 / Harfler", 1), { lesson: "Ders 01", topic: "Harfler" });
  assert.deepEqual(videoCover("ElifBa Mobil - Ders 12 - Üstün", 12), { lesson: "Ders 12", topic: "Üstün" });
  assert.deepEqual(videoCover(undefined, 7), { lesson: "Ders 07", topic: "" });
  assert.equal(thumbnailUrl("EqgHsdzLvWc"), "https://i.ytimg.com/vi/EqgHsdzLvWc/hqdefault.jpg");
  assert.equal(embedUrl("EqgHsdzLvWc"), "https://www.youtube-nocookie.com/embed/EqgHsdzLvWc?rel=0&modestbranding=1&playsinline=1&autoplay=1");
});
