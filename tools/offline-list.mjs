// Danh sách file cho chế độ chơi offline (service-worker.js đọc): mỗi file kèm mã băm nội dung,
// để service worker biết file nào đã đổi mà tải lại, file nào giữ nguyên trong máy.
//
// Cách dùng: node tools/offline-list.mjs [thư mục, mặc định dist]  → ghi <thư mục>/offline.json
//   Cloudflare chạy sau bước chép file (package.json "build"). Thử trong mạng nhà: node tools/offline-list.mjs .
//
// Ba nhóm:
//   core  trang, code, dữ liệu, ảnh bìa nhỏ: tải ngay khi service worker cài
//   warm  ảnh, tiếng của Mặt B: tải dần từng file một sau đó
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
  const group = f.startsWith('assets/sound/') ? 'songs'
    : f.startsWith('assets/thumbs/') || f.startsWith('assets/img/icon') || !MEDIA.test(f) ? 'core'
      : 'warm';
  out[group][f] = [h, buf.length];
  bytes[group] += buf.length;
}
fs.writeFileSync(path.join(DIR, 'offline.json'), JSON.stringify(out));
const mb = (n) => (n / 1048576).toFixed(1) + 'MB';
console.log('offline.json:', Object.keys(out.core).length, 'core', mb(bytes.core) + ',', Object.keys(out.warm).length, 'warm', mb(bytes.warm) + ',', Object.keys(out.songs).length, 'songs', mb(bytes.songs));
