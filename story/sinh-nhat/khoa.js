'use strict';
// Trước 00:00 ngày 24/11/2026 (giờ Việt Nam): phải nhập mã mới xem được phim (anh Quang xem trước,
// Thủy không lỡ thấy sớm dù mở bằng nick anh hay gõ thẳng đường dẫn). Từ giờ mở trở đi: không hỏi gì.
// Mã không ghi thẳng ở đây, chỉ so dấu băm. Nhập đúng một lần thì cả thẻ trình duyệt đó không hỏi lại.
// Công cụ dựng trong mạng nhà (?S=…) đi thẳng, không bị chặn.
(() => {
  const MO = Date.parse('2026-11-24T00:00:00+07:00');
  const NHA = /^(localhost|127\.0\.0\.1|192\.168\.)/.test(location.hostname);
  if (Date.now() >= MO) return;
  if (NHA && new URLSearchParams(location.search).has('S')) return;
  try { if (sessionStorage.getItem('sn:khoa') === 'mo') return; } catch (e) { /* bỏ qua */ }

  const bam = (s) => { let h = 0x811c9dc5; for (const c of 'lpn-sn:' + s) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); };
  const DUNG = '654857ed';

  const st = document.createElement('style');
  st.textContent = `
    #khoa { position: fixed; inset: 0; z-index: 25; display: flex; align-items: center; justify-content: center; gap: clamp(24px, 7vw, 90px);
      background: #000; color: #eee6da; font-family: 'Be Vietnam Pro', sans-serif; padding: env(safe-area-inset-top) 6vw env(safe-area-inset-bottom); box-sizing: border-box; }
    #khoa .k-chu { text-align: center; }
    #khoa h2 { margin: 0 0 .5em; font: italic 400 clamp(24px, 3.6vw, 40px)/1.15 'Cormorant Garamond', serif; color: #f3eadb; }
    #khoa p { margin: 0; font: 300 clamp(12px, 1.5vw, 15px)/1.7 'Be Vietnam Pro', sans-serif; color: rgba(233,225,212,.6); }
    #khoa .k-cham { display: flex; justify-content: center; gap: 14px; margin-top: 1.4em; }
    #khoa .k-cham i { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid rgba(255,236,206,.6); }
    #khoa .k-cham i.d { background: rgba(255,236,206,.9); }
    #khoa .k-cham.sai { animation: k-lac .4s ease; }
    #khoa .k-cham.sai i { border-color: #d98b7a; }
    @keyframes k-lac { 0%, 100% { transform: none; } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
    #khoa .k-so { display: grid; grid-template-columns: repeat(3, auto); gap: min(10px, 2.2vh); }
    #khoa button { appearance: none; width: min(60px, 15.5vh); height: min(60px, 15.5vh); border-radius: 50%; border: 0; cursor: pointer;
      background: rgba(255,255,255,.07); color: #f2e8d8; font: 300 clamp(18px, 2.4vw, 24px)/1 'Be Vietnam Pro', sans-serif; touch-action: manipulation; }
    #khoa button:active { background: rgba(255,236,206,.22); }
    #khoa button.k-xoa { font-size: clamp(12px, 1.4vw, 14px); letter-spacing: .06em; background: transparent; color: rgba(233,225,212,.6); }
    @media (orientation: portrait) { #khoa { flex-direction: column; } }
  `;
  document.head.appendChild(st);

  const k = document.createElement('div');
  k.id = 'khoa';
  k.innerHTML = '<div class="k-chu"><h2>Chưa tới giờ mở</h2><p>Nhập mã để xem trước.</p><div class="k-cham"><i></i><i></i><i></i><i></i></div></div><div class="k-so"></div>';
  const so = k.querySelector('.k-so'), cham = k.querySelector('.k-cham'), dots = cham.querySelectorAll('i');
  let nhap = '';
  const ve = () => dots.forEach((d, i) => d.classList.toggle('d', i < nhap.length));
  const go = (c) => {
    if (c === 'x') { nhap = nhap.slice(0, -1); ve(); return; }
    if (nhap.length >= 4) return;
    nhap += c; ve();
    if (nhap.length < 4) return;
    if (bam(nhap) === DUNG) {
      try { sessionStorage.setItem('sn:khoa', 'mo'); } catch (e) { /* bỏ qua */ }
      k.remove(); removeEventListener('keydown', phim);
    } else {
      cham.classList.add('sai');
      setTimeout(() => { cham.classList.remove('sai'); nhap = ''; ve(); }, 450);
    }
  };
  for (const c of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'x']) {
    if (!c) { so.appendChild(document.createElement('span')); continue; }
    const b = document.createElement('button');
    b.type = 'button';
    if (c === 'x') { b.className = 'k-xoa'; b.textContent = 'Xoá'; } else b.textContent = c;
    b.addEventListener('click', () => go(c));
    so.appendChild(b);
  }
  const phim = (e) => { if (/^[0-9]$/.test(e.key)) go(e.key); else if (e.key === 'Backspace') go('x'); };
  addEventListener('keydown', phim);
  document.body.appendChild(k);
})();
