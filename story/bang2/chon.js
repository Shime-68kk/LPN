// Băng số 2 sau khi đã xem hết phim (lpn:bang2xong): không còn bảng chọn chặn ở cửa.
// Mở chương là đứng ở sân đình (san.js, ?phong=13). Bảng này chỉ hiện khi chạm dấu sao ở góc sân: xem lại, chơi lại.
(() => {
  const doc = (k) => {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  };
  const q = new URLSearchParams(location.search);
  const NHA = /^(localhost|127\.0\.0\.1|192\.168\.)/.test(location.hostname);
  // thử trong mạng nhà: ?thu=ve giả làm máy đã xem hết phim, chưa có mảnh nào (như máy Thủy lúc quay lại), rồi vào từ đầu
  if (q.get('thu') === 've' && NHA) {
    try {
      if (!doc('lpn:bang2xong')) localStorage.setItem('lpn:bang2xong', String(Date.now()));
      ['lpn:ket2', 'lpn:ket2ngoai', 'lpn:bang2manh', 'lpn:bang2'].forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* bỏ qua */ }
    location.replace(location.pathname);
    return;
  }

  const trangThai = () => {
    let ket2Co = false, ket2Xong = false;
    try {
      const k2 = JSON.parse(doc('lpn:ket2') || 'null');
      if (k2 && typeof k2 === 'object') {
        if (Array.isArray(k2.manh) && k2.manh.length >= 1) ket2Co = true;
        if (k2.xong === true) ket2Xong = true;
      }
    } catch (e) { /* bỏ qua */ }
    try { // tài khoản đã xong kết 2 thì luôn xem lại được, kể cả khi đang chơi lại dở
      const st = JSON.parse(doc('lpn:story') || 'null');
      if (st && st.flags && st.flags.b2k2) ket2Xong = true;
    } catch (e) { /* bỏ qua */ }
    try {
      const m2 = JSON.parse(doc('lpn:bang2manh') || 'null');
      if (Array.isArray(m2) && m2.length >= 1) ket2Co = true;
    } catch (e) { /* bỏ qua */ }
    return { ket2Co, ket2Xong };
  };

  const hien = () => {
    if (document.getElementById('lpn-chon')) return;
    const tt = trangThai();
    // Mỗi phần tử: { chu: nhãn nút, hien: điều kiện hiện, den: đường dẫn } hoặc { dong: true } để đóng bảng.
    const MUC = [
      { chu: 'Xem lại kết 1', hien: true, den: '?phong=7&tu=1' },
      { chu: 'Xem lại kết 2', hien: tt.ket2Xong, den: '?phong=11&tu=1' },
      { chu: 'Chơi lại kết 2', hien: tt.ket2Co || tt.ket2Xong, den: '?phong=12&tu=1&xoa502=1' },
      { chu: 'Chơi lại từ đầu', hien: true, den: '?moi=1&tu=1' },
      { chu: 'Về trang chủ', hien: true, den: '../../home/' },
      { chu: 'Quay lại sân đình', hien: true, dong: true },
    ];
    if (!document.getElementById('lpn-chon-css')) {
      const css = document.createElement('style');
      css.id = 'lpn-chon-css';
      css.textContent = [
        "#lpn-chon{position:fixed;top:0;right:0;bottom:0;left:0;z-index:10;background:radial-gradient(ellipse at 50% 45%,rgba(22,18,14,.94) 0%,rgba(5,4,3,.97) 70%);display:flex;flex-direction:column;align-items:center;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;font-family:'Patrick Hand','Be Vietnam Pro',sans-serif;}",
        '#lpn-chon .khung{margin:auto 0;padding:10px 0;display:flex;flex-direction:column;align-items:center;width:100%;max-width:340px;}',
        '#lpn-chon .ten{margin:0 0 2px;font-size:26px;line-height:1.2;color:rgba(240,232,220,.88);text-align:center;}',
        '#lpn-chon .phu{margin:0 0 10px;font-size:16px;color:rgba(240,232,220,.42);text-align:center;}',
        '#lpn-chon .nut{display:flex;flex-direction:column;gap:2px;width:100%;}',
        '#lpn-chon button{appearance:none;-webkit-appearance:none;width:100%;min-height:44px;padding:6px 20px;box-sizing:border-box;font-family:inherit;font-size:23px;line-height:1.2;color:rgba(240,232,220,.86);background:none;border:0;border-radius:22px;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
        '#lpn-chon button:active,#lpn-chon button:hover{background:rgba(255,214,160,.08);color:rgba(255,232,200,.98);}',
        '#lpn-chon button.dong{color:rgba(240,232,220,.5);font-size:20px;}',
      ].join('\n');
      document.head.appendChild(css);
    }
    const lop = document.createElement('div');
    lop.id = 'lpn-chon';
    const chan = (e) => e.stopPropagation();
    ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click'].forEach((ev) => lop.addEventListener(ev, chan));
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
      if (m.dong) btn.className = 'dong';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (m.dong) { if (lop.parentNode) lop.parentNode.removeChild(lop); return; }
        location.replace(m.den);
      });
      nhom.appendChild(btn);
    });
    khung.appendChild(nhom);
    lop.appendChild(khung);
    document.body.appendChild(lop);
  };
  window.LPN_CHON = hien; // san.js gọi khi chạm dấu sao

  // xem thử bảng trong mạng nhà: ?thu=chon
  if (q.get('thu') === 'chon' && NHA) { if (document.body) hien(); else addEventListener('DOMContentLoaded', hien, { once: true }); return; }
  // Đã xem hết phim, mở chương không kèm chỉ dẫn gì: vào sân đình
  if (doc('lpn:bang2xong') && !q.has('phong') && !q.has('trailer') && !q.has('tu')) location.replace('?phong=13&tu=1');
})();
