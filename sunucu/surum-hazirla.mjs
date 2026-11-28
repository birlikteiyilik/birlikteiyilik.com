// Sürüm klasörünü hazırlar: git'te izlenen dosyalardan sunucuda gerekmeyenleri (geliştirme
// dosyaları, testler, kaynaklar, belgeler) çıkarıp hedefe kopyalar. Üretim bağımlılıkları
// ardından hedefte `npm ci --omit=dev` ile kurulur (bkz. .github/workflows/sunucu-yayin.yml).
//
//   node sunucu/surum-hazirla.mjs <hedef-klasör>
//
// vercel.json, package.json, package-lock.json ve api/ sunucuda gereklidir (sunucu bunları
// okur/çalıştırır) ama statik olarak sunulmaz: engel listesi sunucu/lib/statik.mjs'tedir.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const EXCLUDED_ROOTS = new Set(['_src', 'tests', 'node_modules']);
const EXCLUDED_PREFIXES = ['sunucu/test/', 'yon/remotion/', 'content/applications/'];
const EXCLUDED_FILES = new Set(['sunucu/ornek.env', 'sunucu/surum-hazirla.mjs']);

/** Depo köküne göre göreli yol sürüm klasörüne girmemeli mi? */
export function excludedFromRelease(file) {
  const lower = file.toLowerCase();
  const parts = lower.split('/');
  if (parts.some((part) => part.startsWith('.'))) return true; // .git, .github, .hallmark, .gitignore ...
  if (EXCLUDED_ROOTS.has(parts[0])) return true;
  if (EXCLUDED_PREFIXES.some((prefix) => lower.startsWith(prefix))) return true;
  if (EXCLUDED_FILES.has(lower)) return true;
  return lower.endsWith('.md');
}

export function trackedFiles(root = ROOT) {
  return execFileSync('git', ['ls-files', '-z'], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
    .toString('utf8').split('\0').filter(Boolean);
}

export function releaseFiles(root = ROOT) {
  return trackedFiles(root).filter((file) => !excludedFromRelease(file));
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('kullanım: node sunucu/surum-hazirla.mjs <hedef-klasör>');
    process.exit(1);
  }
  const destination = path.resolve(target);
  if (existsSync(destination) && readdirSync(destination).length) {
    console.error(`hedef klasör boş değil: ${destination}`);
    process.exit(1);
  }
  let bytes = 0;
  const files = releaseFiles();
  for (const file of files) {
    const from = path.join(ROOT, file);
    const to = path.join(destination, file);
    mkdirSync(path.dirname(to), { recursive: true });
    const info = lstatSync(from);
    if (info.isSymbolicLink()) symlinkSync(readlinkSync(from), to);
    else { copyFileSync(from, to); bytes += info.size; }
  }
  console.log(`sürüm klasörü hazır: ${files.length} dosya, ${(bytes / 1024 / 1024).toFixed(1)} MB → ${destination}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
