// Chơi offline / mạng yếu: bật service worker (../service-worker.js lưu trang, code, ảnh, nhạc vào máy),
// xin trình duyệt đừng tự xoá phần đã lưu, và mỗi lần mở trang nhắc service worker xem có bản mới không.
// Trang chủ có thêm nút "Tải nhạc về máy" trong bảng Âm nhạc (#dl-songs).
// Gắn vào mọi trang chính; đường dẫn tự tính từ chỗ đặt file này, nên trang ở thư mục nào cũng dùng được.
'use strict';
(() => {
  if (!('serviceWorker' in navigator)) return;
  const ROOT = new URL('../', document.currentScript.src).href;
  navigator.serviceWorker.register(ROOT + 'service-worker.js', { scope: ROOT }).catch(() => {});
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* bỏ qua */ }
  const send = (msg) => navigator.serviceWorker.ready.then((r) => { if (r.active) r.active.postMessage(msg); }).catch(() => {});
  // đợi trang tải xong hẳn rồi mới tải thêm, để không giành mạng với trang
  const later = () => setTimeout(() => send({ type: 'sync' }), 4000);
  if (document.readyState === 'complete') later(); else addEventListener('load', later);

  const btn = document.getElementById('dl-songs'), state = document.getElementById('dl-state');
  if (!btn || !state) return;
  const mb = (n) => Math.round(n / 1048576);
  function show(s) {
    if (!s || !s.n) return;
    const all = s.have >= s.n;
    btn.disabled = s.busy || all;
    btn.textContent = all ? 'Đã có đủ nhạc trong máy' : s.busy ? 'Đang tải…' : s.have ? 'Tải nốt phần còn lại' : 'Tải nhạc về máy';
    state.textContent = all ? 'Mất mạng vẫn nghe và chơi được.'
      : 'Đã lưu ' + mb(s.haveBytes) + ' / ' + mb(s.bytes) + 'MB.' + (s.busy ? ' Cứ để trang mở nhé.' : ' Nên tải lúc có wifi.');
  }
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'songs') show(e.data); });
  btn.addEventListener('click', () => { btn.disabled = true; btn.textContent = 'Đang tải…'; send({ type: 'songs-get' }); });
  // service worker vừa cài lần đầu thì chưa có danh sách: hỏi lại vài lần
  [800, 5000, 15000].forEach((t) => setTimeout(() => send({ type: 'songs-status' }), t));
})();
