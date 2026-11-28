// vercel.json kurallarını Vercel'in uyguladığı sırayla ve aynı düzenli ifadelerle derler.
//
// Vercel (@vercel/routing-utils getTransformedRoutes) yapılandırmayı şu sırayla rotalara çevirir:
//   1. cleanUrls       → /x.html, /x/index(.html) için 308 /x
//   2. trailingSlash   → false ise /x/ için 308 /x
//   3. redirects       → kaynak sırasıyla, ilk eşleşen yönlendirir (işlem biter)
//   4. headers         → "continue" rotaları: eşleşen bütün kurallar birleşir, aynı başlıkta sonraki kazanır
//   5. dosya sistemi, API işlevleri, 404
// Yönlendirme rotaları başlık rotalarından önce geldiği için Vercel'de yönlendirme yanıtları
// vercel.json başlıklarını taşımaz; burada da taşımaz.
//
// `source` → düzenli ifade dönüşümü path-to-regexp 6.1.0'ın (Vercel'in kullandığı sürüm)
// { strict: true, sensitive: true, delimiter: '/' } seçenekleriyle ürettiğinin aynısıdır.
// Desteklenmeyen bir sözdizimi ya da koşul sessizce yanlış uygulanmaz: açılışta hata verilir.

const ESCAPE = /([.+*?=^!:${}()[\]|\\])/g; // path-to-regexp escapeString ('/' kaçışsız, anlamı aynı)
const DEFAULT_PATTERN = '[^/]+?';

class VercelConfigError extends Error {
  constructor(message) {
    super(`vercel.json: ${message}`);
    this.name = 'VercelConfigError';
  }
}

function lex(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (char === '*' || char === '+' || char === '?') { tokens.push({ type: 'MODIFIER', value: char, index: i++ }); continue; }
    if (char === '\\') { tokens.push({ type: 'ESCAPED_CHAR', value: source[i + 1], index: i }); i += 2; continue; }
    if (char === '{' || char === '}') throw new VercelConfigError(`"${source}" içinde { } grupları desteklenmiyor.`);
    if (char === ':') {
      let name = '';
      let j = i + 1;
      while (j < source.length && /[0-9A-Za-z_]/.test(source[j])) name += source[j++];
      if (!name) throw new VercelConfigError(`"${source}" ${i}. karakterde parametre adı eksik.`);
      tokens.push({ type: 'NAME', value: name, index: i });
      i = j;
      continue;
    }
    if (char === '(') {
      let depth = 1;
      let pattern = '';
      let j = i + 1;
      if (source[j] === '?') throw new VercelConfigError(`"${source}" içindeki grup "?" ile başlayamaz.`);
      while (j < source.length) {
        if (source[j] === '\\') { pattern += source[j++] + source[j++]; continue; }
        if (source[j] === ')') { depth -= 1; if (depth === 0) { j += 1; break; } }
        else if (source[j] === '(') {
          depth += 1;
          if (source[j + 1] !== '?') throw new VercelConfigError(`"${source}" içinde iç içe yakalama grubu desteklenmiyor.`);
        }
        pattern += source[j++];
      }
      if (depth || !pattern) throw new VercelConfigError(`"${source}" içindeki grup hatalı.`);
      tokens.push({ type: 'PATTERN', value: pattern, index: i });
      i = j;
      continue;
    }
    tokens.push({ type: 'CHAR', value: char, index: i++ });
  }
  tokens.push({ type: 'END', value: '', index: i });
  return tokens;
}

function parse(source) {
  const tokens = lex(source);
  const result = [];
  let key = 0;
  let i = 0;
  let path = '';
  const take = (type) => (i < tokens.length && tokens[i].type === type ? tokens[i++].value : undefined);
  while (i < tokens.length) {
    const char = take('CHAR');
    const name = take('NAME');
    const pattern = take('PATTERN');
    if (name || pattern) {
      let prefix = char || '';
      if (!'./'.includes(prefix) || prefix === '') { path += prefix; prefix = ''; }
      if (path) { result.push(path); path = ''; }
      result.push({ name: name || key++, prefix, pattern: pattern || DEFAULT_PATTERN, modifier: take('MODIFIER') || '' });
      continue;
    }
    const value = char || take('ESCAPED_CHAR');
    if (value) { path += value; continue; }
    if (path) { result.push(path); path = ''; }
    if (take('END') === undefined) {
      const token = tokens[i];
      throw new VercelConfigError(`"${source}" ${token.index}. karakterde beklenmeyen "${token.value}".`);
    }
  }
  return result;
}

/** path-to-regexp 6.1.0 { strict, sensitive, delimiter: '/' } karşılığı: `{ src, segments }`. */
export function sourceToRegex(source) {
  if (typeof source !== 'string' || !source.startsWith('/')) throw new VercelConfigError(`kaynak "/" ile başlamalı: ${source}`);
  const segments = [];
  let src = '^';
  for (const token of parse(source)) {
    if (typeof token === 'string') { src += token.replace(ESCAPE, '\\$1'); continue; }
    segments.push(typeof token.name === 'string' ? token.name : null);
    const prefix = token.prefix.replace(ESCAPE, '\\$1');
    if (prefix) {
      if (token.modifier === '+' || token.modifier === '*') {
        const mod = token.modifier === '*' ? '?' : '';
        src += `(?:${prefix}((?:${token.pattern})(?:${prefix}(?:${token.pattern}))*))${mod}`;
      } else {
        src += `(?:${prefix}(${token.pattern}))${token.modifier}`;
      }
    } else {
      src += `(${token.pattern})${token.modifier}`;
    }
  }
  return { src: `${src}$`, segments };
}

// Hedefteki :ad parametrelerini yakalama grubu numarasıyla ($1, $2...) değiştirir.
function compileTemplate(template, segments) {
  let compiled = template;
  segments.forEach((name, index) => {
    if (!name) return;
    compiled = compiled.replace(new RegExp(`:${name}(?![0-9A-Za-z_])[*+?]?`, 'g'), `$${index + 1}`);
  });
  return compiled;
}

export function fillTemplate(template, match) {
  return template.replace(/\$(\d+)/g, (_, index) => match[Number(index)] ?? '');
}

function assertNoConditions(kind, rule) {
  if (rule.has || rule.missing) {
    throw new VercelConfigError(`${kind} "${rule.source}" için has/missing koşulu desteklenmiyor; sunucu kodunu güncelleyin.`);
  }
}

/**
 * vercel.json içeriğini derler.
 * @returns {{ cleanUrls: boolean, trailingSlash: boolean|undefined, redirects: object[], headers: object[], skipped: object[] }}
 */
export function compileVercelConfig(config) {
  const known = new Set(['$schema', 'cleanUrls', 'trailingSlash', 'headers', 'redirects']);
  for (const key of Object.keys(config)) {
    if (!known.has(key)) throw new VercelConfigError(`"${key}" ayarı sunucuda uygulanmıyor; sunucu kodunu güncelleyin.`);
  }
  const redirects = [];
  const skipped = [];

  if (config.cleanUrls) {
    const location = config.trailingSlash ? '/$1/' : '/$1';
    redirects.push({ kind: 'cleanUrls', regex: /^\/(?:(.+)\/)?index(?:\.html)?\/?$/, location, status: 308 });
    redirects.push({ kind: 'cleanUrls', regex: /^\/(.*)\.html\/?$/, location, status: 308 });
  }
  if (config.trailingSlash === false) {
    redirects.push({ kind: 'trailingSlash', regex: /^\/(.*)\/$/, location: '/$1', status: 308 });
  } else if (config.trailingSlash === true) {
    redirects.push({ kind: 'trailingSlash', regex: /^\/\.well-known(?:\/.*)?$/, location: null, status: 0 });
    redirects.push({ kind: 'trailingSlash', regex: /^\/((?:[^/]+\/)*[^/.]+)$/, location: '/$1/', status: 308 });
    redirects.push({ kind: 'trailingSlash', regex: /^\/((?:[^/]+\/)*[^/]+\.\w+)\/$/, location: '/$1', status: 308 });
  }

  for (const rule of config.redirects || []) {
    // Ana makine koşullu kurallar (www ↔ apex) sunucuda uygulanmaz: alan adı yönlendirmesini
    // Caddy yapar (birlikteiyilik.com → www.birlikteiyilik.com, 308). Vercel'deki
    // www → apex kuralı burada uygulansaydı Caddy'nin kuralıyla sonsuz döngü oluşurdu.
    if ((rule.has || []).some((condition) => condition.type === 'host')) {
      skipped.push({ rule, reason: 'Ana makine yönlendirmesini Caddy yapar (apex → www); bu kural sonsuz döngü oluştururdu.' });
      continue;
    }
    assertNoConditions('redirect', rule);
    const { src, segments } = sourceToRegex(rule.source);
    const status = typeof rule.permanent === 'boolean' ? (rule.permanent ? 308 : 307) : (rule.statusCode || 308);
    redirects.push({ kind: 'redirect', source: rule.source, regex: new RegExp(src), src,
      location: compileTemplate(rule.destination, segments), status });
  }

  const headers = (config.headers || []).map((rule) => {
    assertNoConditions('header', rule);
    const { src, segments } = sourceToRegex(rule.source);
    const named = segments.some(Boolean);
    return {
      source: rule.source, regex: new RegExp(src), src,
      headers: rule.headers.map(({ key, value }) => [key, named ? compileTemplate(value, segments) : value, named && value.includes(':')])
    };
  });

  return { cleanUrls: Boolean(config.cleanUrls), trailingSlash: config.trailingSlash, redirects, headers, skipped };
}

/** İlk eşleşen yönlendirme: `{ status, location }` ya da null. Konum, sorgu dizesi olmadan döner. */
export function matchRedirect(rules, pathname) {
  for (const rule of rules.redirects) {
    const match = rule.regex.exec(pathname);
    if (!match) continue;
    if (!rule.location) return null; // ör. trailingSlash: true için .well-known muafiyeti
    return { status: rule.status, location: fillTemplate(rule.location, match), rule };
  }
  return null;
}

/** Yola uyan bütün başlık kuralları birleşir; aynı başlıkta sonraki kural kazanır (Vercel gibi). */
export function matchHeaders(rules, pathname) {
  const merged = new Map(); // küçük harfli ad → [ad, değer]
  for (const rule of rules.headers) {
    const match = rule.regex.exec(pathname);
    if (!match) continue;
    for (const [key, value, templated] of rule.headers) {
      merged.set(key.toLowerCase(), [key, templated ? fillTemplate(value, match) : value]);
    }
  }
  return [...merged.values()];
}

/** Yönlendirme hedefine isteğin sorgu dizesini ekler (hedefte aynı parametre varsa hedefinki kalır). */
export function withQuery(location, rawQuery) {
  if (!rawQuery) return location;
  const hashIndex = location.indexOf('#');
  const hash = hashIndex >= 0 ? location.slice(hashIndex) : '';
  const base = hashIndex >= 0 ? location.slice(0, hashIndex) : location;
  const queryIndex = base.indexOf('?');
  if (queryIndex < 0) return `${base}?${rawQuery}${hash}`;
  const existing = new URLSearchParams(base.slice(queryIndex + 1));
  const extra = rawQuery.split('&').filter((part) => {
    const name = part.split('=')[0];
    try { return part && !existing.has(decodeURIComponent(name.replace(/\+/g, ' '))); } catch { return false; }
  });
  return extra.length ? `${base}&${extra.join('&')}${hash}` : `${base}${hash}`;
}
