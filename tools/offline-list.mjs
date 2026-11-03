// Danh sách file cho chế độ chơi offline (service-worker.js đọc): mỗi file kèm mã băm nội dung,
// để service worker biết file nào đã đổi mà tải lại, file nào giữ nguyên trong máy.
//
// Cách dùng: node tools/offline-list.mjs [thư mục, mặc định dist]  → ghi <thư mục>/offline.json
//   Cloudflare chạy sau bước chép file (package.json "build"). Thử trong mạng nhà: node tools/offline-list.mjs .
//
// Các nhóm:
//   core  trang, code, dữ liệu, ảnh bìa nhỏ: tải ngay khi service worker cài
//   warm  ảnh, tiếng của Băng số 1 / Mặt B (xếp lên đầu), nhạc Mặt A mà ngôi nhà Hồi ức luôn nạp: tải dần từng file một sau đó
//   fonts các link Google Fonts mà trang dùng: service worker lưu cả css lẫn tệp phông
//   songs nhạc trong assets/sound: tải khi nghe / chơi lần đầu, hoặc khi bấm "Tải nhạc về máy" ở trang chủ
// Không đưa vào: legacy/ (web cũ) và assets/bang1/ (phim Mặt A, hơn 100MB, phát qua HLS).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(process.argv[2] || 'dist');
const TOP = ['index.html', 'manifest.json', 'assets', 'home', 'game', 'shop', 'story'];
const SKIP = /^(assets\/bang1\/|legacy\/)|(^|\/)\.|\.(md|mjs|py|sh|bak)$/;
const WEB = /\.(html|js|css|json|txt|svg|png|jpe?g|webp|gif|ico|mp3|m4a|woff2?|ttf)$/i;
const MEDIA = /\.(png|jpe?g|webp|gif|mp3|m4a)$/i;

const files = [];
(function walk(rel) {
  const abs = path.join(DIR, rel);
  if (!fs.existsSync(abs)) return;
  if (fs.statSync(abs).isDirectory()) { for (const n of fs.readdirSync(abs).sort()) walk(rel ? rel + '/' + n : n); return; }
  if (!SKIP.test(rel) && WEB.test(rel)) files.push(rel);
})('');
for (const t of TOP) if (!files.some((f) => f === t || f.startsWith(t + '/'))) console.warn('offline-list: thiếu', t);

const out = { at: new Date().toISOString(), core: {}, warm: {}, songs: {} };
let bytes = { core: 0, warm: 0, songs: 0 };
for (const f of files.filter((f) => TOP.some((t) => f === t || f.startsWith(t + '/')))) {
  const buf = fs.readFileSync(path.join(DIR, f));
  const h = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
  const group = f === 'assets/sound/bang1.mp3' ? 'warm'
    : f.startsWith('assets/sound/') ? 'songs'
    : f.startsWith('assets/thumbs/') || f.startsWith('assets/img/icon') || !MEDIA.test(f) ? 'core'
      : 'warm';
  out[group][f] = [h, buf.length];
  bytes[group] += buf.length;
}
// Băng số 1 / Mặt B tải trước (mạng yếu thì phần đó xong trước), rồi tới ảnh
const FIRST = [/^story\/mat-b\//, /^assets\/sound\/bang1\.mp3$/, /^story\//];
const rank = (f) => { const i = FIRST.findIndex((r) => r.test(f)); return i < 0 ? FIRST.length : i; };
out.warm = Object.fromEntries(Object.entries(out.warm).sort((a, b) => rank(a[0]) - rank(b[0])));
// Google Fonts: gom mọi link css2 trong các trang
const fonts = new Set();
for (const f of Object.keys(out.core)) if (/\.html$/.test(f)) for (const m of fs.readFileSync(path.join(DIR, f), 'utf8').matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s]+/g)) fonts.add(m[0].replace(/&amp;/g, '&'));
out.fonts = [...fonts];
fs.writeFileSync(path.join(DIR, 'offline.json'), JSON.stringify(out));
const mb = (n) => (n / 1048576).toFixed(1) + 'MB';
console.log('offline.json:', Object.keys(out.core).length, 'core', mb(bytes.core) + ',', Object.keys(out.warm).length, 'warm', mb(bytes.warm) + ',', Object.keys(out.songs).length, 'songs', mb(bytes.songs) + ',', out.fonts.length, 'fonts');
