// Sunucu testleri için ortak yardımcılar: ham HTTP isteği (yol normalleştirilmeden, Host ve
// X-Forwarded-For elle verilerek) ve uygulamayı rastgele bir portta başlatma.
import http from 'node:http';
import { createSiteApp } from '../uygulama.mjs';

export function rawRequest(port, path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, headers: { Host: 'www.birlikteiyilik.com', ...headers }, agent: false }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

export async function startTestApp(options = {}) {
  const app = await createSiteApp(options);
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const { port } = app.server.address();
  return {
    ...app,
    port,
    request: (path, init) => rawRequest(port, path, init),
    close: () => new Promise((resolve) => { app.server.closeAllConnections(); app.server.close(resolve); })
  };
}
