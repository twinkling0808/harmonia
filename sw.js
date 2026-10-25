// 앱 화면 파일을 이 기기에 저장해 두어, 인터넷이 없어도 앱이 열리게 합니다.
const V = 'harmonia-v17';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k.indexOf('harmonia-') === 0).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function firstOf(req, ms) {                       // 네트워크가 느리면 저장본을 바로 사용
  return new Promise(res => {
    let done = false;
    const t = setTimeout(() => caches.match(req, { ignoreSearch: true }).then(m => { if (m && !done) { done = true; res(m); } }), ms);
    fetch(req).then(r => {
      clearTimeout(t);
      if (r && r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); }
      if (!done) { done = true; res(r); }
    }).catch(() => { clearTimeout(t); caches.match(req, { ignoreSearch: true }).then(m => { if (!done) { done = true; res(m || Response.error()); } }); });
  });
}
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin) {
    if (r.mode === 'navigate') e.respondWith(firstOf(new Request('index.html'), 2500));
    else e.respondWith(firstOf(r, 2500));
  } else if (u.hostname === 'cdnjs.cloudflare.com') {      // PDF·ZIP 도구는 한 번 받으면 저장
    e.respondWith(caches.open(V).then(c => c.match(r).then(m => m || fetch(r).then(x => { c.put(r, x.clone()); return x; }))));
  }
});
