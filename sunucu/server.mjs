// Birlikte İyilik ana site sunucusu. Başlatma: `node sunucu/server.mjs`
// Ortam değişkenleri için sunucu/ORTAM.md'ye bakın. PORT zorunludur; HOST varsayılanı 127.0.0.1.
import { logError, startSite } from './uygulama.mjs';

const port = Number(process.env.PORT);
const host = process.env.HOST || '127.0.0.1';
const appEnv = process.env.APP_ENV || 'production';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('[site] PORT ortam değişkeni zorunlu (1-65535).');
  process.exit(1);
}
if (!['production', 'test'].includes(appEnv)) {
  console.error(`[site] APP_ENV yalnızca production ya da test olabilir.`);
  process.exit(1);
}

process.on('unhandledRejection', (error) => logError('yakalanmamış söz (promise) reddi', error));
process.on('uncaughtException', (error) => {
  logError('yakalanmamış hata, süreç yeniden başlatılacak', error);
  process.exit(1);
});

try {
  const app = await startSite({ port, host });
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => app.shutdown(true));
  console.log(`[site] ${appEnv} dinliyor: http://${host}:${port} (sürüm ${process.env.SURUM || 'yok'})`);
} catch (error) {
  logError('sunucu başlatılamadı', error);
  process.exit(1);
}
