import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readableArchivePages } from "../src/archive-pages.ts";
import type { ArchiveData } from "../src/lesson-guide.ts";

const archive: ArchiveData = JSON.parse(readFileSync(new URL("../public/data/archive.json", import.meta.url), "utf8"));

test("reported archive gaps are skipped for every affected grade without renumbering or changing original text", () => {
  for (const [grade, month, missing] of [[3, 7, [2, 3]], [3, 8, [3, 25]], [5, 8, [3, 25]], [7, 8, [3, 25]]] as const) {
    const band = grade === 3 ? "1-2-3" : grade === 5 ? "4-5-6" : "7-8";
    const plan = archive.plans[band][String(month)];
    const document = archive.documents.find((item) => item.month === month && item.kind === "content" && item.band === (plan.isExtended ? "7-8" : band));
    assert.ok(document);
    const pages = readableArchivePages(document.pages);
    assert.deepEqual(document.pages.filter((page) => !page.text.trim()).map((page) => page.number), [...missing]);
    assert.ok(pages.every((page) => page.text.trim() && document.pages.includes(page)));
    assert.ok(pages.some((page) => page.number === 4));
    assert.equal(pages.length, document.pages.length - missing.length);
  }
});

test("no archive reader entry is blank and original page counts remain intact", () => {
  assert.equal(archive.documents.reduce((sum, doc) => sum + doc.pages.length, 0), 963);
  for (const document of archive.documents) {
    assert.ok(readableArchivePages(document.pages).every((page) => page.text.trim().length > 0));
  }
  assert.deepEqual(readableArchivePages([{ number: 1, text: " \n\t" }]), []);
});
