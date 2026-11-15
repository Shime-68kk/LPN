// Màn chọn đoạn sau khi đã chơi xong Băng số 2 (lpn:bang2xong).
// Chỉ hiện khi đã xem hết ít nhất một lần và đường dẫn chưa có phong, trailer, tu.
(() => {
  const doc = (k) => {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  };
  const q = new URLSearchParams(location.search);
  // xem thử trong mạng nhà: ?thu=chon hiện màn chọn dù máy chưa xem hết (không ghi gì vào máy)
  const thu = q.get('thu') === 'chon' && /^(localhost|127\.0\.0\.1|192\.168\.)/.test(location.hostname);
  if (!doc('lpn:bang2xong') && !thu) return;

  if (q.has('phong') || q.has('trailer') || q.has('tu')) return;

  let phong = 0;
  try {
    const sv = JSON.parse(doc('lpn:bang2') || '{}');
    const n = Number(sv && sv.phong);
    if (Number.isInteger(n) && n >= 2) phong = n;
  } catch (e) { /* bỏ qua */ }

  // Mỗi phần tử: { chu: nhãn nút, hien: điều kiện hiện, den: đường dẫn }.
  // Thêm nút mới chỉ cần thêm một dòng trong mảng này.
  const MUC = [
    { chu: 'Chơi tiếp', hien: phong >= 2, den: '?phong=' + phong + '&tu=1' },
    { chu: 'Chơi lại từ đầu', hien: true, den: '?moi=1&tu=1' },
    { chu: 'Xem lại phim cuối', hien: true, den: '?phong=8&tu=1' },
    // { chu: 'Xem kết khác', hien: true, den: '?phong=10&tu=1' },
  ];

  const hien = () => {
    const css = document.createElement('style');
    css.textContent = [
      "#lpn-chon{position:fixed;top:0;right:0;bottom:0;left:0;z-index:10;background:radial-gradient(ellipse at 50% 45%,#16120e 0%,#050403 70%);display:flex;flex-direction:column;align-items:center;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));box-sizing:border-box;font-family:'Patrick Hand','Be Vietnam Pro',sans-serif;}",
      '#lpn-chon .khung{margin:auto 0;display:flex;flex-direction:column;align-items:center;width:100%;max-width:340px;}',
      '#lpn-chon .ten{margin:0 0 4px;font-size:30px;line-height:1.2;color:rgba(240,232,220,.88);text-align:center;}',
      '#lpn-chon .phu{margin:0 0 22px;font-size:17px;color:rgba(240,232,220,.42);text-align:center;}',
      '#lpn-chon .tai{margin:20px 0 0;font-size:16px;color:rgba(240,232,220,.32);text-align:center;}',
      '#lpn-chon .nut{display:flex;flex-direction:column;gap:6px;width:100%;}',
      '#lpn-chon button{appearance:none;-webkit-appearance:none;width:100%;min-height:52px;padding:10px 20px;box-sizing:border-box;font-family:inherit;font-size:25px;line-height:1.25;color:rgba(240,232,220,.86);background:none;border:0;border-radius:26px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
      '#lpn-chon button:active,#lpn-chon button:hover{background:rgba(255,214,160,.08);color:rgba(255,232,200,.98);}',
    ].join('\n');
    document.head.appendChild(css);

    const lop = document.createElement('div');
    lop.id = 'lpn-chon';
    const chan = (e) => e.stopPropagation();
    lop.addEventListener('pointerdown', chan);
    lop.addEventListener('pointerup', chan);
    lop.addEventListener('click', chan);

    const khung = document.createElement('div');
    khung.className = 'khung';

    const ten = document.createElement('div');
    ten.className = 'ten';
    ten.textContent = 'Không tua nhanh được';
    khung.appendChild(ten);
    const phu = document.createElement('div');
    phu.className = 'phu';
    phu.textContent = 'Cuộn băng số 2';
    khung.appendChild(phu);

    const nhom = document.createElement('div');
    nhom.className = 'nut';
    MUC.forEach((m) => {
      if (!m.hien) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = m.chu;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        location.replace(m.den);
      });
      nhom.appendChild(btn);
    });
    khung.appendChild(nhom);
    const tai = document.createElement('div');
    tai.className = 'tai';
    tai.textContent = 'Đeo tai nghe vào nhé.';
    khung.appendChild(tai);
    lop.appendChild(khung);
    document.body.appendChild(lop);
  };

  if (document.body) hien();
  else addEventListener('DOMContentLoaded', hien, { once: true });
})();
