// Giriş uçları için istemci IP'sine göre deneme sınırı (tek süreç, bellekte).
//
// Her giriş denemesi, şifre doğrulanmadan ÖNCE bir hak harcar; böylece aynı anda gönderilen
// yüzlerce istek de PBKDF2 hesaplatamaz. Başarılı giriş (ya da sunucu hatası) hakkı geri verir;
// yalnızca hatalı şifre denemeleri pencere boyunca sayılır. Kapsamlar (yönetim, öğretmen,
// liste) ayrı sayılır: aynı okul ağındaki bir hatalı liste denemesi öğretmen girişini kilitlemez.

export const LOGIN_WINDOW_MS = 10 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 10;
const MAX_TRACKED_KEYS = 20_000;

const attempts = new Map(); // `${scope}|${ip}` → zaman damgaları (artan)

function prune(list, now) {
  while (list.length && list[0] <= now - LOGIN_WINDOW_MS) list.shift();
}

function sweep(now) {
  for (const [key, list] of attempts) {
    prune(list, now);
    if (!list.length) attempts.delete(key);
  }
}

/** Sunucu, güvendiği istemci IP'sini ikinci argümanda verir; doğrudan çağrılarda ortak bir anahtar kullanılır. */
export function clientIpFrom(context) {
  const ip = typeof context?.clientIp === 'string' ? context.clientIp.trim() : '';
  return ip ? ip.slice(0, 64) : 'bilinmeyen';
}

/**
 * Bir giriş denemesi başlatır.
 * İzin yoksa `{ ok: false, retryAfter }` (saniye). İzin varsa `{ ok: true, refund() }`;
 * deneme hatalı şifre değilse `refund()` çağrılarak hak geri verilir.
 */
export function takeLoginAttempt(scope, ip, now = Date.now()) {
  if (attempts.size > MAX_TRACKED_KEYS) sweep(now);
  const key = `${scope}|${ip}`;
  const list = attempts.get(key) || [];
  prune(list, now);
  if (list.length >= LOGIN_MAX_ATTEMPTS) {
    attempts.set(key, list);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((list[0] + LOGIN_WINDOW_MS - now) / 1000)) };
  }
  list.push(now);
  attempts.set(key, list);
  let refunded = false;
  return {
    ok: true,
    refund() {
      if (refunded) return;
      refunded = true;
      const index = list.indexOf(now);
      if (index >= 0) list.splice(index, 1);
      if (!list.length && attempts.get(key) === list) attempts.delete(key);
    }
  };
}

export function rateLimitMessage(retryAfter) {
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  return `Çok fazla hatalı giriş denemesi yapıldı. ${minutes} dakika sonra yeniden deneyin.`;
}

/** Testler için. */
export function resetLoginAttempts() {
  attempts.clear();
}
