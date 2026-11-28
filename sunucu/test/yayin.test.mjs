// Sürüm klasörü içeriği ve yayın iş akışı: herkese açık hiçbir dosya kaybolmaz, sunucunun
// çalışması için gerekenler girer, geliştirme dosyaları girmez; SSH ile yalnızca izinli iki komut.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { excludedFromRelease, releaseFiles, trackedFiles } from '../surum-hazirla.mjs';
import { isBlocked } from '../lib/statik.mjs';

const tracked = trackedFiles();
const release = new Set(releaseFiles());

test('herkese açık sunulan her dosya sürüm klasörüne girer (Vercel\'deki hiçbir sayfa ya da medya kaybolmaz)', () => {
  const missing = tracked.filter((file) => !isBlocked(file) && !release.has(file));
  assert.deepEqual(missing, []);
  assert.ok(release.size > 1000);
});

test('sürüme giren ama sunulmayan dosyalar yalnızca sunucunun çalışması için gerekenlerdir', () => {
  const runtimeOnly = [...release].filter((file) => isBlocked(file));
  for (const file of runtimeOnly) {
    assert.match(file, /^(api\/[^/]+\.js|sunucu\/(server|uygulama)\.mjs|sunucu\/lib\/[^/]+\.mjs|sunucu\/tasima\/[^/]+\.mjs|vercel\.json|package\.json|package-lock\.json)$/, file);
  }
  for (const file of ['sunucu/server.mjs', 'sunucu/uygulama.mjs', 'sunucu/lib/vercel.mjs', 'sunucu/lib/statik.mjs', 'sunucu/tasima/arsivleri-ac.mjs',
    'api/bia-applications.js', 'api/bia-news.js', 'api/_bia-store.js', 'api/_bia-rate-limit.js', 'api/_bia-application-history.js', 'api/_bia-program-hours.js',
    'vercel.json', 'package.json', 'package-lock.json', '404/index.html', 'index.html', 'sw.js', 'yoklama/index.html']) {
    assert.ok(release.has(file), `sürümde olmalı: ${file}`);
  }
});

test('geliştirme dosyaları, testler, kaynaklar, belgeler ve eski şifreli arşivler sürüme girmez', () => {
  for (const file of release) {
    assert.doesNotMatch(file, /^(_src|tests|node_modules|sunucu\/test|yon\/remotion|content\/applications)\//, file);
    assert.doesNotMatch(file, /(^|\/)\./, file);
    assert.doesNotMatch(file, /\.md$/i, file);
  }
  for (const file of ['.github/workflows/sunucu-yayin.yml', '.hallmark/log.json', '.gitignore', 'BASVURU-KURULUM.md', 'sunucu/README.md',
    'sunucu/ORTAM.md', 'sunucu/ornek.env', 'sunucu/surum-hazirla.mjs', 'sunucu/test/statik.test.mjs', 'tests/bia-applications.test.mjs',
    '_src/build.py', 'yon/remotion/package.json', 'content/applications/planning.enc.json']) {
    assert.equal(excludedFromRelease(file), true, file);
  }
});

test('yayın iş akışı sözleşmeye uyar: main\'e push, eşzamanlı çalışma iptali, Node 22, testler, yalnızca izinli SSH komutları', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/sunucu-yayin.yml', import.meta.url), 'utf8');
  assert.match(workflow, /on:\n {2}push:\n {4}branches: \[main\]/);
  assert.match(workflow, /cancel-in-progress: true/);
  assert.match(workflow, /node-version: 22/);
  assert.match(workflow, /run: npm test/);
  assert.match(workflow, /npm ci --omit=dev --ignore-scripts/);
  const rsync = workflow.match(/rsync [^\n]*\\\n[^\n]*/g);
  assert.equal(rsync.length, 1, 'tek rsync komutu');
  assert.match(rsync[0], /^rsync -rlc --delete --link-dest=\/srv\/site\/simdiki\/ -e "\$SSH_KOMUTU" \\\n\s+"\$SURUM_KLASORU\/" "deploy@\$\{SUNUCU_ADRESI\}:\/srv\/site\/gelen\/\$\{GITHUB_SHA\}\/"$/);
  const ssh = workflow.split('\n').filter((line) => /\$SSH_KOMUTU "deploy@/.test(line));
  assert.deepEqual(ssh.map((line) => line.trim()), ['run: $SSH_KOMUTU "deploy@${SUNUCU_ADRESI}" "sudo /usr/local/bin/birlikte-yayinla site ${GITHUB_SHA}"']);
  for (const secret of ['SUNUCU_SSH_ANAHTARI', 'SUNUCU_BILINEN_HOST', 'SUNUCU_ADRESI']) assert.match(workflow, new RegExp(`secrets\\.${secret}`));
  assert.match(workflow, /StrictHostKeyChecking=yes/);
});
