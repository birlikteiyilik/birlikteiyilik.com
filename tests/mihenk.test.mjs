import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = readFileSync(resolve(root, 'mihenk/index.html'), 'utf8');
const script = readFileSync(resolve(root, 'mihenk/app.js'), 'utf8');

test('MİHENK uses canonical /mihenk and subpath-safe resources', () => {
  assert.match(html, /rel="canonical" href="https:\/\/birlikteiyilik\.com\/mihenk"/);
  for (const [, value] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(#|[a-z]+:)/i.test(value)) continue;
    assert.ok(value.startsWith('/mihenk/'), `Not scoped to /mihenk: ${value}`);
    assert.ok(existsSync(resolve(root, value.slice(1))), `Missing resource: ${value}`);
  }
  assert.doesNotMatch(html, /<base\b/); // Fragment links stay on the clean URL.
});

test('styles resolve their own local images, fonts and imports', () => {
  for (const filename of ['styles.css', 'sections.css', 'experience.css', 'tokens.css']) {
    const file = resolve(root, 'mihenk', filename);
    const css = readFileSync(file, 'utf8');
    for (const [, value] of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
      if (/^(data:|https?:|#)/.test(value)) continue;
      assert.ok(existsSync(resolve(dirname(file), value)), `${filename}: ${value}`);
    }
  }
});

test('dynamic posters, downloads and opening film stay inside /mihenk', () => {
  assert.doesNotMatch(script, /['"]assets\//);
  assert.match(script, /\/mihenk\/assets\/mihenk-opening\.mp4/);
  for (const person of ['nuh', 'hayati', 'ahmet', 'ramazan']) {
    for (const extension of ['png', 'webp']) {
      assert.ok(existsSync(resolve(root, `mihenk/assets/${person}.${extension}`)));
    }
  }
  for (const asset of ['certificate.webp', 'wordmark.png', 'mihenk-opening.mp4']) {
    assert.ok(existsSync(resolve(root, 'mihenk/assets', asset)));
  }
});

test('sitemap includes MİHENK now and after the site generator is run', () => {
  assert.match(readFileSync(resolve(root, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/birlikteiyilik\.com\/mihenk<\/loc>/);
  assert.match(readFileSync(resolve(root, '_src/build.py'), 'utf8'), /STATIC_SCAN_DIRS = .*'mihenk'/);
});
