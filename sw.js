/* 체험단 앱 서비스워커 — 네트워크 우선, 실패하면 캐시(오프라인에서도 열림) */
const CACHE = 'trial-app-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-64.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req)
          .then((hit) => hit || caches.match('./index.html'))
          .then((hit) => hit || new Response('오프라인 상태예요. 인터넷에 연결한 뒤 다시 열어 주세요.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          }))
      )
  );
});
