// 서비스워커: 방문한 페이지를 저장해 두었다가, 인터넷이 안 될 때 보여줍니다.
// 파일을 고쳐 배포할 때는 CACHE 이름의 숫자를 올리세요 (옛날 저장분이 지워집니다).
const CACHE = 'goodsshop-v1';
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

self.addEventListener('install', (e) => {
  // 오프라인에서도 페이지 스크립트가 돌도록 supabase-js를 미리 저장
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SUPABASE_JS)).then(() => self.skipWaiting()));
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
  const url = new URL(req.url);
  const sameSite = url.origin === self.location.origin;
  // 저장 대상: 우리 사이트 파일 + supabase-js. 그 외(Supabase 서버, 토스 등)는 건드리지 않음
  if (!sameSite && req.url !== SUPABASE_JS) return;
  // 결제 결과 화면은 항상 새로 받아야 하므로 저장하지 않음
  if (sameSite && /\/(success|fail)\.html$/.test(url.pathname)) return;

  // 네트워크 먼저, 실패하면 저장해 둔 것
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit) return hit;
        // 처음 가는 페이지를 오프라인에서 열면 홈 화면으로 대신 보여줌
        if (req.mode === 'navigate') {
          const home = (await caches.match('index.html', { ignoreSearch: true })) ||
            (await caches.match('./', { ignoreSearch: true }));
          if (home) return home;
        }
        return Response.error();
      })
  );
});
