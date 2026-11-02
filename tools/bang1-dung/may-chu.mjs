// Máy chủ thử trong mạng nhà (thay cho python3 -m http.server): phục vụ cả repo, thêm /_phim/ là các bản dựng phim trong
// ~/Videos/bang1-dung/_dung/. Hỗ trợ tải từng đoạn (Range), iPhone mới chịu phát video và tua được.
//
// Cách dùng: node tools/bang1-dung/may-chu.mjs [cổng, mặc định 8080]
//   Game xem thử bản dựng trên TV: http://<IP máy>:8080/story/hoi-uc.html?thu=bangthat&phim=nhap-1
//   Thêm ?xemthu vào link bất kỳ: máy đó vào chế độ xem thử (không đồng bộ Firebase) và ví thử có 20.000 đốt cây,
//   quay / mở hộp thoải mái mà không đụng ví thật. ?xemthat để thôi.
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const PHIM = path.join(os.homedir(), 'Videos/bang1-dung/_dung');
const PORT = Number(process.argv[2]) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
  '.m3u8': 'application/vnd.apple.mpegurl', '.m4s': 'video/iso.segment', '.ts': 'video/mp2t', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.wasm': 'application/wasm',
};

// Chèn ngay đầu <head> của mọi trang, chạy trước home/sync.js.
const XEMTHU = '<script>(function(){try{var q=location.search,L=localStorage;'
  + 'if(/[?&]xemthat\\b/.test(q)){L.removeItem("lpn:preview");return;}'
  + 'if(!/[?&]xemthu\\b/.test(q))return;L.setItem("lpn:preview","1");'
  + 'var w=JSON.parse(L.getItem("lpn:wallet")||"{}");if(!(w.dot>=1500)){w.dot=20000;L.setItem("lpn:wallet",JSON.stringify(w));}'
  + '}catch(e){}})();</script>';

http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400).end(); return; }
  const base = p.startsWith('/_phim/') ? PHIM : ROOT;
  let f = path.normalize(path.join(base, p.startsWith('/_phim/') ? p.slice(6) : p));
  if (!f.startsWith(base)) { res.writeHead(403).end(); return; }
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { /* xử lý ở dưới */ }
  let st;
  try { st = fs.statSync(f); } catch (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Không có ' + p); return; }
  if (/tam-su|hoi-uc\.html|bang1\.js|\/game\/(index\.html)?$|game\.js/.test(p)) console.log(new Date().toLocaleTimeString('vi-VN'), req.socket.remoteAddress, p, req.headers.range || '', (req.headers['user-agent'] || '').slice(0, 60));
  const head = { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (m && (m[1] || m[2])) {
    let a = m[1] ? Number(m[1]) : st.size - Number(m[2]), b = m[1] && m[2] ? Number(m[2]) : st.size - 1;
    if (a < 0) a = 0;
    if (a >= st.size || b < a) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }).end(); return; }
    b = Math.min(b, st.size - 1);
    res.writeHead(206, { ...head, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Content-Length': b - a + 1 });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(f, { start: a, end: b }).pipe(res);
    return;
  }
  if (path.extname(f).toLowerCase() === '.html') {
    const html = Buffer.from(fs.readFileSync(f, 'utf8').replace(/<head>/i, '<head>' + XEMTHU));
    res.writeHead(200, { ...head, 'Content-Length': html.length });
    res.end(req.method === 'HEAD' ? undefined : html);
    return;
  }
  res.writeHead(200, { ...head, 'Content-Length': st.size });
  if (req.method === 'HEAD') { res.end(); return; }
  fs.createReadStream(f).pipe(res);
}).listen(PORT, '0.0.0.0', () => console.log('Máy chủ thử: http://0.0.0.0:' + PORT + ' (repo ' + ROOT + ', /_phim/ → ' + PHIM + ')'));
