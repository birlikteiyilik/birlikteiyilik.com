import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/admin-applications.js', import.meta.url), 'utf8');
const definition = source.match(/  function normalizeProgramTime\(value\) \{[\s\S]*?\n  \}/)?.[0];
assert.ok(definition);
const normalize = vm.runInNewContext(`${definition}\nnormalizeProgramTime`);

test('24-hour time entry preserves noon and midnight and accepts numeric keyboard shortcuts', () => {
  for (const [input, expected] of [['00:00','00:00'],['12:00','12:00'],['15:30','15:30'],['23:59','23:59'],
    ['1500','15:00'],['900','09:00'],['9:00','09:00'],['15.30','15:30'],['9','09:00'],['15','15:00']]) {
    assert.equal(normalize(input), expected, input);
  }
});

test('invalid 24-hour times and AM/PM input are never silently converted into valid times', () => {
  for (const input of ['24:00','12:60','25:30','03 PM','3pm','15:','', '0060']) {
    assert.equal(normalize(input), input);
    assert.ok(!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalize(input)));
  }
});
