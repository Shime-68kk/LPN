// Service worker của app (phạm vi cả trang, đăng ký từ home/offline.js và home/push.js). Hai việc:
//
// 1) Chơi offline / mạng yếu. offline.json (tools/offline-list.mjs, tạo lúc build) liệt kê mọi file kèm mã băm.
//    - Trang, .json, .txt: lấy từ mạng trước (để chương mới, sự kiện mới hiện ngay); quá 2.5s hay mất mạng thì dùng bản đã lưu.
//    - Code (?v=), ảnh, nhạc: lấy ngay từ máy; chưa có thì tải rồi giữ lại. Nhạc/video phát bằng <audio> hỏi từng đoạn (Range):
//      trả đúng đoạn từ bản đã lưu.
//    - Mỗi lần mở trang (tối đa 2 phút một lần) đọc lại offline.json: file nào đổi mã băm thì tải lại, file nào bị bỏ thì xoá.
//      Cài lần đầu: tải nhóm core (code, trang, dữ liệu) ngay, rồi nhóm warm (ảnh, tiếng Mặt B) từng file một.
//      Nhạc (songs) tải khi nghe/chơi lần đầu, hoặc khi bấm "Tải nhạc về máy" ở trang chủ.
//    - Không đụng tới: legacy/, assets/bang1/ (phim Mặt A, HLS), Firebase, thời tiết.
// 2) Thông báo đẩy (chương mới, sự kiện mới), chạm vào thì mở đúng trang.
'use strict';
const CACHE = 'lpn-off-1', FONTS = 'lpn-fonts-1', KEEP = [CACHE, FONTS];
const ROOT = self.registration.scope; // .../ (gốc web)
const META = ROOT + '__lpn/meta';
const SKIP = /\/(assets\/bang1|legacy|_phim)\/|\/offline\.json$|\/service-worker\.js$/;
const WAIT = 2500;
// Vừa có một lần mạng không kịp trả trong WAIT: 30s tới coi như mạng đang yếu, chỉ chờ 400ms rồi dùng bản đã lưu (vẫn tải bản mới ngầm).
let slowUntil = 0;

// Khoá trong bộ nhớ đệm: bỏ .html và index.html (Cloudflare chuyển x.html → x), bỏ tham số, riêng ?v= của code thì ghi nhớ riêng.
function keyOf(u) {
  const url = new URL(u, ROOT);
  return url.origin + url.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
}
const extOf = (url) => ((url.pathname.match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase();

// ===== Sổ ghi: mã băm từng file đang lưu (h), ?v= tương ứng của code (v), danh sách mới nhất (list) =====
let metaP = null, metaT = 0;
function meta() {
  if (!metaP) metaP = caches.open(CACHE).then((c) => c.match(META)).then((r) => (r ? r.json() : null)).catch(() => null)
    .then((m) => Object.assign({ at: 0, h: {}, v: {}, list: null }, m || {}));
  return metaP;
}
function saveMeta() {
  clearTimeout(metaT);
  return new Promise((ok) => { metaT = setTimeout(async () => { const m = await meta(); const c = await caches.open(CACHE); await c.put(META, new Response(JSON.stringify(m), { headers: { 'Content-Type': 'application/json' } })); ok(); }, 300); });
}
// mã băm theo danh sách mới nhất của một khoá (để biết bản vừa tải ứng với bản nào)
function listHash(m, key) {
  if (!m.list) return null;
  for (const g of ['core', 'warm', 'songs']) for (const [p, [h]] of Object.entries(m.list[g] || {})) if (keyOf(p) === key) return h;
  return null;
}

// Phản hồi đi qua chuyển hướng: Safari không cho trả lại nguyên như thế cho trang → đóng gói lại.
async function clean(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}
const storable = (res) => res && res.ok && res.status === 200 && (res.type === 'basic' || res.type === 'default');
async function put(key, res, url) {
  const c = await caches.open(CACHE);
  await c.put(key, await clean(res));
  const m = await meta(), h = listHash(m, key);
  if (h) m.h[key] = h; else m.h[key] = m.h[key] || '?';
  const v = url && new URL(url).searchParams.get('v'); if (v) m.v[key] = v;
  saveMeta();
}

// ===== Cài, kích hoạt =====
// Cài: tải nhóm core. Nhóm warm để trang gọi 'sync' sau (kích hoạt mà chờ tải xong thì trang phải chờ theo).
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(sync(true, ['core']).then(async () => { (await meta()).at = 0; return saveMeta(); }).catch(() => {})); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((names) => Promise.all(names.filter((n) => !KEEP.includes(n)).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()).catch(() => {}));
});

// Đọc lại offline.json, tải những file đổi / còn thiếu. groups: các nhóm tải chủ động (songs chỉ cập nhật bài đã có).
let syncing = null;
function sync(force, groups = ['core', 'warm']) {
  if (syncing) return syncing;
  syncing = (async () => {
    const m = await meta();
    if (!force && Date.now() - m.at < 120000) return;
    let list;
    try { const r = await fetch(ROOT + 'offline.json', { cache: 'no-store' }); if (!r.ok) return; list = await r.json(); } catch (e) { return; }
    m.at = Date.now(); m.list = list; saveMeta();
    const c = await caches.open(CACHE), want = new Set();
    for (const g of ['core', 'warm', 'songs']) for (const p of Object.keys(list[g] || {})) want.add(keyOf(p));
    for (const k of Object.keys(m.h)) if (!want.has(k)) { await c.delete(k); delete m.h[k]; delete m.v[k]; }
    const jobs = [];
    for (const g of ['core', 'warm', 'songs']) for (const [p, [h]] of Object.entries(list[g] || {})) {
      const k = keyOf(p), have = m.h[k];
      if (have === h) continue;
      if (g === 'songs' || !groups.includes(g)) { if (have) jobs.push([p, k, h, g]); continue; } // chỉ làm mới cái đã có
      jobs.push([p, k, h, g]);
    }
    // core song song 3 file, còn lại từng file một (mạng yếu thì không giành hết đường truyền của trang đang chơi)
    const core = jobs.filter((j) => j[3] === 'core'), rest = jobs.filter((j) => j[3] !== 'core');
    const grab = async ([p, k, h]) => {
      try { const r = await fetch(ROOT + p, { cache: 'no-cache' }); if (storable(r)) { await c.put(k, await clean(r)); m.h[k] = h; delete m.v[k]; saveMeta(); } } catch (e) { /* lần sau */ }
    };
    for (let i = 0; i < core.length; i += 3) await Promise.all(core.slice(i, i + 3).map(grab));
    for (const j of rest) await grab(j);
    await saveMeta();
  })().finally(() => { syncing = null; });
  return syncing;
}

// Tải hết nhạc về máy (nút ở trang chủ), báo tiến độ về trang.
let songsJob = null;
async function songStatus() {
  const m = await meta(), list = (m.list && m.list.songs) || {};
  let n = 0, have = 0, bytes = 0, haveBytes = 0;
  for (const [p, [h, size]] of Object.entries(list)) { n++; bytes += size; if (m.h[keyOf(p)] === h) { have++; haveBytes += size; } }
  return { type: 'songs', n, have, bytes, haveBytes, busy: !!songsJob };
}
function getSongs(tell) {
  if (songsJob) return songsJob;
  songsJob = (async () => {
    await sync(true);
    const m = await meta(), c = await caches.open(CACHE), list = (m.list && m.list.songs) || {};
    for (const [p, [h]] of Object.entries(list)) {
      const k = keyOf(p); if (m.h[k] === h) continue;
      try { const r = await fetch(ROOT + p, { cache: 'no-cache' }); if (storable(r)) { await c.put(k, await clean(r)); m.h[k] = h; saveMeta(); } } catch (e) { /* bỏ qua, lần sau */ }
      tell(await songStatus());
    }
    await saveMeta();
  })().finally(async () => { songsJob = null; tell(await songStatus()); });
  return songsJob;
}

self.addEventListener('message', (e) => {
  const d = e.data || {}, reply = (x) => { try { e.source && e.source.postMessage(x); } catch (err) { /* trang đã đóng */ } };
  const tellAll = (x) => self.clients.matchAll({ type: 'window' }).then((l) => l.forEach((cl) => cl.postMessage(x)));
  if (d.type === 'sync') e.waitUntil(sync(false).catch(() => {}));
  else if (d.type === 'songs-status') e.waitUntil(songStatus().then(reply));
  else if (d.type === 'songs-get') e.waitUntil(getSongs(tellAll).catch(() => {}));
});

// ===== Trả file =====
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (SKIP.test(url.pathname) || !req.url.startsWith(ROOT)) return;
    e.respondWith(serve(e, req, url));
  } else if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    e.respondWith(font(e, req, url));
  }
});

async function serve(e, req, url) {
  const key = keyOf(url), ext = extOf(url), range = req.headers.get('range');
  const page = req.mode === 'navigate' || ext === 'html' || ext === '';
  let fresh = page || ext === 'json' || ext === 'txt';
  if (!fresh && (ext === 'js' || ext === 'css')) { const v = url.searchParams.get('v'), m = await meta(); fresh = !v || m.v[key] !== v; }
  const c = await caches.open(CACHE);
  if (fresh) return networkFirst(e, req, key, c, page);
  const hit = await c.match(key);
  if (hit) return range ? partial(hit, range) : hit;
  // chưa có: lấy từ mạng; <audio> hỏi từng đoạn thì cứ để mạng trả, đồng thời tải nguyên file về giữ cho lần sau
  if (range) {
    e.waitUntil(fetch(url.href).then((r) => (storable(r) ? put(key, r, url.href) : null)).catch(() => {}));
    return fetch(req);
  }
  const res = await fetch(req);
  if (storable(res)) e.waitUntil(put(key, res.clone(), url.href).catch(() => {}));
  return res;
}

async function networkFirst(e, req, key, c, page) {
  const net = fetch(req).then((res) => {
    if (storable(res)) e.waitUntil(put(key, res.clone(), req.url).catch(() => {}));
    return res;
  });
  e.waitUntil(net.then(() => {}, () => {}));
  const hit = await c.match(key);
  if (!hit) return net.catch(() => (page ? offlinePage() : Response.error()));
  const t0 = Date.now(), wait = Date.now() < slowUntil ? 400 : WAIT;
  const slow = new Promise((ok) => setTimeout(() => ok(null), wait));
  const res = await Promise.race([net.catch(() => null), slow]);
  if (!res) slowUntil = Date.now() + 30000; else if (Date.now() - t0 < 1000) slowUntil = 0;
  return res || hit;
}

// Nhạc / video đã lưu: trả đúng đoạn trình duyệt hỏi (206).
async function partial(res, range) {
  const blob = await res.blob(), size = blob.size, m = /bytes=(\d*)-(\d*)/.exec(range || '');
  let s = 0, en = size - 1;
  if (m && m[1] !== '') { s = +m[1]; if (m[2] !== '') en = Math.min(+m[2], size - 1); } else if (m && m[2] !== '') s = Math.max(0, size - +m[2]);
  if (s >= size || s > en) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  return new Response(blob.slice(s, en + 1), { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
    'Content-Range': 'bytes ' + s + '-' + en + '/' + size, 'Content-Length': String(en - s + 1), 'Accept-Ranges': 'bytes',
  } });
}

// Phông chữ Google: tệp phông giữ mãi, tệp css lấy mạng trước rồi mới tới bản đã lưu.
async function font(e, req, url) {
  const c = await caches.open(FONTS), hit = await c.match(req);
  if (hit && url.hostname === 'fonts.gstatic.com') return hit;
  try {
    const res = await (hit ? Promise.race([fetch(req), new Promise((_, no) => setTimeout(no, WAIT))]) : fetch(req));
    if (res.ok || res.type === 'opaque') e.waitUntil(c.put(req, res.clone()).catch(() => {}));
    return res;
  } catch (err) { return hit || Response.error(); }
}

function offlinePage() {
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#1A1420;color:#F3EBDA;font:16px system-ui;text-align:center;padding:24px">'
    + '<div><p style="font-size:40px;margin:0">📶</p><p>Trang này chưa kịp lưu vào máy, mà mạng đang mất.</p>'
    + '<p style="opacity:.7">Có mạng lại thì mở lại nhé. Những trang em đã mở rồi vẫn chơi được khi mất mạng.</p>'
    + '<p><a href="' + ROOT + 'home/" style="color:#E9C77B">Về trang chủ</a></p></div>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ===== Thông báo đẩy =====
// Nội dung gửi từ tools/push.mjs: { title, body, url, tag }.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Yêu Lệ Thủy', {
    body: data.body || '',
    icon: new URL('assets/img/icon-192.png', self.registration.scope).href,
    tag: data.tag || undefined,
    data: { url: data.url || 'home/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || 'home/', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('navigate' in c) return c.focus().then(() => c.navigate(url));
      }
      return self.clients.openWindow(url);
    })
  );
});
