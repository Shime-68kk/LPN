// Chơi Mặt B bằng bàn phím máy tính (chuột / chạm vẫn như cũ). Gắn vào gác xép và mọi thùng.
//   Ổ khoá số (.lockbox có .dial): gõ số là đặt ô đang chọn rồi sang ô sau; ← → chọn ô, ↑ ↓ xoay, Enter bấm Mở
//   Esc: đóng lớp phóng to (✕); không có thì đóng thùng (nút "‹ Đóng thùng" của gác xép)
// Trang có trò riêng (phím đàn, gõ chữ) bắt phím trước và gọi e.preventDefault() thì ở đây bỏ qua.
'use strict';
(() => {
  const vis = (el) => !!el && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';
  let box = null, cur = 0;
  function dials() {
    const b = [...document.querySelectorAll('.lockbox')].find((x) => vis(x) && x.querySelector('.dial'));
    if (!b) return null;
    const ds = b.querySelectorAll('.dial');
    if (b !== box) { box = b; cur = 0; }
    cur = (cur + ds.length) % ds.length;
    ds.forEach((d, i) => d.classList.toggle('cur', i === cur));
    return { b, ds };
  }
  // Gắn sau khi trang dựng xong: phím của riêng từng trang (gắn trong script của trang) được xử lý trước
  addEventListener('DOMContentLoaded', () => addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const L = dials();
    if (L) {
      const turn = (d) => { const bt = L.ds[cur].querySelector('button[data-d="' + d + '"]'); if (bt) bt.click(); };
      if (/^[0-9]$/.test(e.key)) {
        const now = +L.ds[cur].querySelector('b').textContent;
        for (let n = (+e.key - now + 10) % 10; n > 0; n--) turn(1);
        cur++; dials(); e.preventDefault(); return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Backspace') { cur += e.key === 'ArrowRight' ? 1 : -1; dials(); e.preventDefault(); return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { turn(e.key === 'ArrowUp' ? 1 : -1); e.preventDefault(); return; }
      if (e.key === 'Enter') { const t = L.b.querySelector('#try'); if (t) t.click(); e.preventDefault(); return; }
    }
    if (e.key === 'Escape') {
      const x = document.getElementById('zx');
      if (vis(x) && x.closest('.on')) { x.click(); e.preventDefault(); return; }
      try { const cl = parent !== window && parent.document.getElementById('cl'); if (cl) { cl.click(); e.preventDefault(); } } catch (err) { /* bỏ qua */ }
    }
  }));
})();
