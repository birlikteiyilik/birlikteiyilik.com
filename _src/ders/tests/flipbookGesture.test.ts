import assert from "node:assert/strict";
import test from "node:test";
import { flipbookGesture } from "../src/flipbookGesture.ts";

const bounds = { left: 20, right: 340 };
for (const direction of ["ltr", "rtl"] as const) {
  const rtl = direction === "rtl";
  test(`${direction}: short taps follow the reading direction`, () => {
    assert.equal(flipbookGesture({ x: 60, y: 200 }, { x: 62, y: 200 }, bounds, 90, direction), rtl ? "next" : "previous");
    assert.equal(flipbookGesture({ x: 300, y: 200 }, { x: 301, y: 200 }, bounds, 90, direction), rtl ? "previous" : "next");
  });
  test(`${direction}: horizontal swipes follow the reading direction`, () => {
    assert.equal(flipbookGesture({ x: 250, y: 200 }, { x: 100, y: 210 }, bounds, 300, direction), rtl ? "previous" : "next");
    assert.equal(flipbookGesture({ x: 100, y: 200 }, { x: 250, y: 210 }, bounds, 300, direction), rtl ? "next" : "previous");
  });
  test(`${direction}: vertical scrolling does not turn a page`, () => {
    assert.equal(flipbookGesture({ x: 100, y: 200 }, { x: 120, y: 300 }, bounds, 200, direction), null);
  });
  test(`${direction}: small diagonal movement and a long press do not turn a page`, () => {
    assert.equal(flipbookGesture({ x: 100, y: 200 }, { x: 112, y: 212 }, bounds, 200, direction), null);
    assert.equal(flipbookGesture({ x: 100, y: 200 }, { x: 100, y: 200 }, bounds, 800, direction), null);
  });
}
