import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ageCurricula, clampCurriculumPage, curriculumTopic, curriculumTopicAtPage, readableTopicTitle, searchCurriculumTopics, sourceDisplayText } from "../src/age-curricula.ts";
import type { AgeCurriculum } from "../src/age-curricula.ts";

const sources = {
  "7-10": "52d83511d10716414b277d69c9d346f19ec9ffa903898685e3a98c00269ccbc3",
  "11-14": "18469302f9d3951c003889f5659550b05700d489c3aab8e25467d1fa31368bd4",
};
const load = (id: string): AgeCurriculum => JSON.parse(readFileSync(new URL(`../public/data/ahlak-mufredati-${id}.json`, import.meta.url), "utf8"));

test("published PDFs match their manifest while original-source fingerprints are retained", () => {
  for (const metadata of ageCurricula) {
    const data = load(metadata.id);
    const original = readFileSync(new URL(`../public/assets/ahlak-mufredati/${metadata.id}/${data.pdfFile}`, import.meta.url));
    assert.equal(createHash("sha256").update(original).digest("hex"), data.pdfSha256);
    assert.equal(data.sourceSha256, sources[metadata.id]);
    assert.equal(data.publisher, "Birlikte İyilik");
    assert.ok(data.pdfFile.startsWith("birlikte-iyilik-"));
    assert.equal(data.pageCount, metadata.pageCount);
    assert.equal(data.topicCount, metadata.topicCount);
  }
});

test("all 115 topics retain their source order and cover every teaching page without gaps", () => {
  for (const metadata of ageCurricula) {
    const data = load(metadata.id);
    assert.equal(data.topics.length, metadata.topicCount);
    assert.deepEqual(data.topics.map((topic) => topic.number), Array.from({ length: metadata.topicCount }, (_, index) => index + 1));
    let nextPage = 3;
    for (const topic of data.topics) {
      assert.equal(topic.startPage, nextPage);
      assert.ok(topic.endPage >= topic.startPage);
      for (const key of ["outcomes", "method", "concepts", "messages", "sayings", "explanation", "stories", "sources"]) {
        assert.ok(topic.sections.some((section) => section.key === key && section.text.trim()), `${metadata.id}, topic ${topic.number}: ${key}`);
      }
      nextPage = topic.endPage + 1;
    }
    assert.equal(nextPage, metadata.pageCount + 1);
  }
});

test("native lesson text retains source content across page breaks, including the final page", () => {
  const first = load("7-10").topics[0];
  const explanation = first.sections.find((section) => section.key === "explanation")!;
  assert.ok(explanation.text.includes("Herkes kızar."));
  assert.ok(explanation.text.includes("Gadabın [öfkenin] aşırı olmasına saldırganlık denir."));
  assert.deepEqual(explanation.pages, [3, 4]);
  const last = load("11-14").topics.at(-1)!;
  assert.ok(last.sections.some((section) => section.text.includes("canını kurtarabilmek için ülkeyi terk")));
  assert.equal(last.endPage, 187);
});

test("same-titled source topics remain separate and resolve to their own original pages", () => {
  const data = load("11-14");
  const sitting = data.topics.filter((topic) => topic.title === "OTURMA ÂDÂBI");
  assert.deepEqual(sitting.map((topic) => topic.number), [43, 44]);
  assert.equal(curriculumTopicAtPage(data, 142)?.number, 43);
  assert.equal(curriculumTopicAtPage(data, 144)?.number, 44);
  assert.equal(curriculumTopicAtPage(data, 1), undefined);
});

test("search supports Turkish spelling, accents and text inside a topic", () => {
  const data = load("7-10");
  assert.ok(searchCurriculumTopics(data.topics, "ofkeye hakim").some((topic) => topic.number === 1));
  assert.ok(searchCurriculumTopics(data.topics, "Duygularını kontrol etmeyi").some((topic) => topic.number === 1));
  assert.equal(searchCurriculumTopics(data.topics, "bu-sozcuk-kaynakta-yok").length, 0);
  assert.equal(searchCurriculumTopics(data.topics, "  ").length, 56);
});

test("deep links clamp invalid page/topic numbers and preserve lowercase teâlâ display", () => {
  const data = load("11-14");
  assert.equal(curriculumTopic(data, -1).number, 1);
  assert.equal(curriculumTopic(data, 999).number, 1);
  assert.equal(clampCurriculumPage(999, 187, 3), 187);
  assert.equal(clampCurriculumPage(NaN, 187, 3), 3);
  assert.equal(clampCurriculumPage(-2, 187, 3), 3);
  assert.equal(sourceDisplayText("Allahü Teâlâ ve Allahü Teala"), "Allahü teâlâ ve Allahü teala");
  assert.equal(readableTopicTitle("ALLAHÜ TEALAYA KULLUK"), "Allahü tealaya Kulluk");
});
