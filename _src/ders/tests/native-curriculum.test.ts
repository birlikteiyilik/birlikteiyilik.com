import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assessmentQuestions, learningItems, readingBlocks, resourceLabel, sectionLinks, topicDuration } from "../src/native-curriculum.ts";
import type { AgeCurriculum } from "../src/age-curricula.ts";

const junior: AgeCurriculum = JSON.parse(readFileSync(new URL("../public/data/ahlak-mufredati-7-10.json", import.meta.url), "utf8"));
const senior: AgeCurriculum = JSON.parse(readFileSync(new URL("../public/data/ahlak-mufredati-11-14.json", import.meta.url), "utf8"));

test("PDF line wraps become paragraphs and source story titles stay distinct", () => {
  assert.deepEqual(readingBlocks("Öfkelenme\nBir adam çölden\nMedine’ye geldi.\nBir nasihat istedi."), [
    { kind: "heading", text: "Öfkelenme" },
    { kind: "paragraph", text: "Bir adam çölden Medine’ye geldi." },
    { kind: "paragraph", text: "Bir nasihat istedi." },
  ]);
});

test("wrapped numbered and bulleted learning outcomes become clean native list items", () => {
  assert.deepEqual(learningItems("1. Duygularını kontrol\netmeyi öğrenirler.\n2. Kendilerini ifade ederler."), ["Duygularını kontrol etmeyi öğrenirler.", "Kendilerini ifade ederler."]);
  assert.deepEqual(learningItems("• Saygılı davranır.\n• Başkasının\nhakkını gözetir."), ["Saygılı davranır.", "Başkasının hakkını gözetir."]);
});

test("lesson duration follows each actual source rather than imposing one age-group default", () => {
  assert.deepEqual(topicDuration(junior.topics[0]), { label: "2 × 40 dk", total: 80 });
  assert.deepEqual(topicDuration(junior.topics[40]), { label: "40 dk", total: 40 });
  assert.deepEqual(topicDuration(senior.topics[0]), { label: "40 dk", total: 40 });
});

test("every topic has useful questions, including discussion prompts for the two source gaps", () => {
  for (const data of [junior, senior]) for (const topic of data.topics) {
    assert.ok(assessmentQuestions(topic, data.id).length, `${data.id}: ${topic.number}`);
  }
  assert.ok(assessmentQuestions(senior.topics[55], "11-14")[0].includes("Sıla-i rahim"));
  assert.ok(assessmentQuestions(junior.topics[40], "7-10")[0].includes("Nezaket"));
});

test("external material cards retain actual source URLs with readable labels", () => {
  const links = sectionLinks(junior.topics[0], "materials");
  assert.equal(links.length, 2);
  assert.ok(links.every((href) => new URL(href).hostname === "wordwall.net"));
  assert.equal(resourceLabel("https://wordwall.net/tr/resource/123", 0), "Wordwall etkinliği 1");
  assert.equal(resourceLabel("https://wordwall.net/tr/resource/123/%C3%B6fke-labirent-oyunu", 0), "öfke labirent oyunu");
  assert.equal(resourceLabel("https://dinimizislam.com/", 0), "Dinimiz İslam");
});
