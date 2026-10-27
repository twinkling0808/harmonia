// 앱 화면 파일을 이 기기에 저장해 두어, 인터넷이 없어도 앱이 바로 열리게 합니다.
const V = 'harmonia-v014';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k.indexOf('harmonia-') === 0).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 저장된 화면을 먼저 보여주고(빠름), 뒤에서 새 버전을 받아 둡니다. 새 버전은 다음에 열 때 적용돼요.
async function swr(req) {
  const c = await caches.open(V), hit = await c.match(req, { ignoreSearch: true });
  const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
  if (hit) { net.catch(() => {}); return hit; }
  return (await net) || Response.error();
}
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin) {
    e.respondWith(swr(r.mode === 'navigate' ? new Request('index.html') : r));
  } else if (u.hostname === 'cdnjs.cloudflare.com') {      // PDF·ZIP 도구는 한 번 받으면 저장
    e.respondWith(caches.open(V).then(c => c.match(r).then(m => m || fetch(r).then(x => { c.put(r, x.clone()); return x; }))));
  }
});
