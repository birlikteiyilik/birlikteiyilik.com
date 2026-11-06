import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { readableArchivePages } from "../src/archive-pages.ts";
import { archiveWeeks, isTopicHeading, topicTitle, weekAtPage } from "../src/archive-weeks.ts";
import { videoCover, embedUrl } from "../src/elifba-videos.ts";
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

test("programme flipbooks have a page image and link areas for every page", () => {
  for (const age of ["7-10", "11-14"]) {
    const data = read(`../public/data/ahlak-mufredati-${age}.json`);
    const pages = read(`../public/data/ahlak-mufredati-${age}-sayfalar.json`);
    assert.equal(pages.pageCount, data.pageCount);
    for (let page = 1; page <= pages.pageCount; page++) {
      assert.ok(existsSync(new URL(`../public/assets/${pages.imageFolder}/page-${String(page).padStart(3, "0")}.webp`, import.meta.url)), `${age} ${page}`);
    }
    for (const links of Object.values(pages.links) as { href: string; rect: number[] }[][]) {
      for (const link of links) {
        assert.match(link.href, /^(https?:\/\/|mailto:)/);
        assert.ok(link.rect.every((value) => value >= 0 && value <= 100) && link.rect[0] < link.rect[2] && link.rect[1] < link.rect[3]);
      }
    }
    const vatan = data.topics.find((topic: { title: string }) => topic.title === "VATAN SEVGİSİ");
    assert.ok(vatan.links.includes(newVatanActivity));
    assert.ok(!vatan.links.includes("https://wordwall.net/tr/resource/28325043"));
    const pageLinks = Array.from({ length: vatan.endPage - vatan.startPage + 1 }, (_, index) => pages.links[String(vatan.startPage + index)] || []).flat();
    assert.ok(pageLinks.some((link: { href: string }) => link.href === newVatanActivity));
  }
});

test("Karabaş Tecvid is published as a 52 page right-to-left book", () => {
  for (let page = 1; page <= 52; page++) assert.ok(existsSync(new URL(`../public/assets/karabas-tecvid-pages/page-${String(page).padStart(2, "0")}.webp`, import.meta.url)));
  assert.ok(existsSync(new URL("../public/assets/karabas-tecvid.pdf", import.meta.url)));
});

test("video covers read the lesson number and topic from playlist titles", () => {
  assert.deepEqual(videoCover("ElifBa Mobil - Ders 01 / Harfler", 1), { lesson: "Ders 01", topic: "Harfler" });
  assert.deepEqual(videoCover("ElifBa Mobil - Ders 12 - Üstün", 12), { lesson: "Ders 12", topic: "Üstün" });
  assert.deepEqual(videoCover(undefined, 7), { lesson: "Ders 07", topic: "" });
  assert.equal(embedUrl("EqgHsdzLvWc"), "https://www.youtube-nocookie.com/embed/EqgHsdzLvWc?rel=0&modestbranding=1&playsinline=1&autoplay=1");
});
