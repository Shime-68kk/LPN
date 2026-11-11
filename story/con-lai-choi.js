// "Phần còn lại": phần CHƠI (trước đoạn cao trào). Màn hình chia đôi như Sợi chỉ: một nửa là phía anh, một nửa là phía em.
// Đường chia là cánh cổng. Không vẽ người. Ba câu đố nhẹ, câu nào cũng phải nhìn bên này để làm bên kia:
//   1. "Năm giờ": điện thoại bên anh ghi lịch của em → chỉnh đồng hồ bên em về 5 giờ → còi hú.
//   2. "Gọi": bên em gọi mãi → điện thoại bên anh rung, lật lên → vuốt bên anh để nghe máy.
//   3. "Những gì em kể": tìm ba thứ giấu trong doanh trại (khay cơm, bộ bài Uno, ngọn đồi).
// Sau mỗi câu đố, giữ tay bên anh để anh bước. Xong thì gọi ConLai.finale() (đoạn cao trào theo bài hát, ở con-lai.js).
// Câu chữ trong ngoặc kép lấy từ chương "Người cúp máy sau cùng"; còn lại là nháp chờ anh Quang duyệt.
'use strict';
(() => {
  const K = () => window.ConLai, A = window.ConLaiAm;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
  const rgb = (c, a = 1) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  let g, L, now = 0;

  // ================= Trạng thái =================
  const C = {
    stage: 0,        // 0 chờ em bước · 1 năm giờ · 2 gọi · 3 những gì em kể · 4 xong
    sub: '',         // bước nhỏ trong từng chặng
    count: 0, cap: 0,        // số bước anh đã đi / được phép đi tới
    walking: false, walkAcc: 0,
    sky: 0,          // 0 đêm → 1 ngày
    skyTo: 0,
    hourE: 2, hourA: 2, hand: 2,   // đồng hồ hai bên (dừng ở hai giờ: lúc hai đứa cúp máy)
    lamp: false, noteSeen: false, lit: 0,
    calls: 0, calling: 0, buzz: 0, flip: 0, slide: 0, talk: -1,
    found: {}, shutter: 0, deck: 0, lid: 0, lidHold: false,
    close: null, closeT: 0,          // cận cảnh đang mở: {side:'a'|'e', id}
    hold: 0, holding: false, stepped: false, flare: 0,
    idle: 0, t: 0, car: 0, carT: 0,
    msg: '', msgUntil: 0,
  };
  const say = (text, sec = 6.5) => { C.msg = text; C.msgUntil = C.t + sec; K().setText('cap', text); };
  const hint = (text) => { const h = document.getElementById('hint'); h.textContent = text; h.classList.add('on'); clearTimeout(hint.tm); hint.tm = setTimeout(() => h.classList.remove('on'), 5200); };

  // ================= Bố cục: hai nửa và cánh cổng ở giữa =================
  const R = { a: {}, e: {}, d: {} };
  function rects() {
    const { W, H, P } = L, dv = Math.max(12, L.m * 0.034);
    if (P) { const h = (H - dv) / 2; R.a = { x: 0, y: 0, w: W, h }; R.d = { x: 0, y: h, w: W, h: dv }; R.e = { x: 0, y: h + dv, w: W, h }; }
    else { const w = (W - dv) / 2; R.a = { x: 0, y: 0, w, h: H }; R.d = { x: w, y: 0, w: dv, h: H }; R.e = { x: w + dv, y: 0, w, h: H }; }
  }
  const inR = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  // Vùng chạm của đồ vật (toạ độ 0..1 trong từng nửa)
  const HOT = {
    a: { phone: [0.6, 0.54, 0.34, 0.26], lamp: [0.5, 0.26, 0.2, 0.36], laptop: [0.18, 0.34, 0.32, 0.3], clock: [0.72, 0.1, 0.2, 0.24], win: [0.05, 0.08, 0.3, 0.42] },
    e: { clock: [0.14, 0.24, 0.2, 0.2], loa: [0.44, 0.14, 0.16, 0.3], phone: [0.0, 0.56, 0.22, 0.2], shutter: [0.66, 0.46, 0.3, 0.3], bench: [0.08, 0.76, 0.28, 0.22], hill: [0.5, 0.2, 0.5, 0.26], foot: [0.36, 0, 0.28, 0.2] },
  };
  const hit = (side, x, y) => {
    const r = R[side], nx = (x - r.x) / r.w, ny = (y - r.y) / r.h;
    for (const [id, b] of Object.entries(HOT[side])) if (nx >= b[0] && nx <= b[0] + b[2] && ny >= b[1] && ny <= b[1] + b[3]) return id;
    return null;
  };
  // Dấu chân của em: sát cánh cổng
  const footPos = () => (L.P ? { x: R.e.x + R.e.w * 0.56, y: R.e.y + R.e.h * 0.92 } : { x: R.e.x + R.e.w * 0.5, y: R.e.y + R.e.h * 0.9 });

  // ================= Vẽ =================
  const SKY = (k) => [mix([6, 8, 20], mix([40, 46, 98], [112, 156, 214], ss(0.5, 1, k)), ss(0, 0.6, k)), mix([12, 15, 34], mix([214, 138, 142], [206, 226, 244], ss(0.5, 1, k)), ss(0, 0.6, k))];
  function sky(x, y, w, h, k) { const [a, b] = SKY(k), gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, rgb(a)); gr.addColorStop(1, rgb(b)); g.fillStyle = gr; g.fillRect(x, y, w, h); }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function clockFace(cx, cy, r, hour, glow) {
    g.fillStyle = '#e9e4d6'; g.beginPath(); g.arc(cx, cy, r, 0, 6.29); g.fill(); g.strokeStyle = '#1b1c26'; g.lineWidth = Math.max(2, r * 0.13); g.stroke();
    g.fillStyle = '#1b1c26'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.arc(cx + Math.sin(a) * r * 0.78, cy - Math.cos(a) * r * 0.78, r * (i % 3 ? 0.035 : 0.06), 0, 6.29); g.fill(); }
    const ha = hour * Math.PI / 6, ma = (hour % 1) * 2 * Math.PI;
    g.strokeStyle = '#1b1c26'; g.lineCap = 'round'; g.lineWidth = r * 0.11; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(ha) * r * 0.48, cy - Math.cos(ha) * r * 0.48); g.stroke();
    g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(ma) * r * 0.72, cy - Math.cos(ma) * r * 0.72); g.stroke();
    if (glow > 0.01) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = glow; g.drawImage(K().SP.glow, cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  const pulse = (ph = 0) => 0.5 + 0.5 * Math.sin(now * 2.4 + ph);
  // vòng sáng mời chạm (chỉ hiện ở thứ đang cần)
  function invite(x, y, r) { g.strokeStyle = 'rgba(255,220,160,' + (0.25 + 0.4 * pulse()) + ')'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r * (1 + 0.08 * pulse()), 0, 6.29); g.stroke(); }

  // ----- Phía anh: căn phòng đêm -----
  function drawRoom(r) {
    const { x, y, w, h } = r, m = Math.min(w, h), lampOn = C.lamp;
    let gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, lampOn ? '#15121a' : '#07080f'); gr.addColorStop(1, lampOn ? '#1d1719' : '#0a0a12'); g.fillStyle = gr; g.fillRect(x, y, w, h);
    // cửa sổ
    const wx = x + w * 0.07, wy = y + h * 0.1, ww = Math.min(w * 0.26, h * 0.3), wh = ww * 1.3;
    sky(wx, wy, ww, wh, C.sky); g.fillStyle = '#05060b'; g.fillRect(wx + ww / 2 - 2, wy, 4, wh); g.fillRect(wx, wy + wh / 2 - 2, ww, 4); g.strokeStyle = '#05060b'; g.lineWidth = 5; g.strokeRect(wx, wy, ww, wh);
    // đồng hồ treo tường
    clockFace(x + w * 0.82, y + h * 0.22, m * 0.085, C.hourA, 0);
    // bàn
    const dy = y + h * 0.7; gr = g.createLinearGradient(0, dy, 0, y + h); gr.addColorStop(0, '#3b2a21'); gr.addColorStop(0.15, '#281c16'); gr.addColorStop(1, '#0a0706'); g.fillStyle = gr; g.fillRect(x, dy, w, y + h - dy);
    g.fillStyle = 'rgba(255,214,150,' + (lampOn ? 0.24 : 0.06) + ')'; g.fillRect(x, dy, w, 1.5);
    // laptop và đèn bàn (đèn tắt thì chỉ còn bóng)
    const u = Math.min(w * 0.3, h * 0.32);
    g.save(); g.translate(x + w * 0.42, dy - 0.52 * u); g.globalAlpha = lampOn ? 1 : 0.42;
    if (lampOn) K().OBJS.den(u, 1, 0); else { g.save(); g.beginPath(); g.rect(-u * 1.2, -u, u * 2.4, u * 1.6); g.clip(); K().OBJS.den(u, 0, 0); g.fillStyle = 'rgba(5,6,12,.78)'; g.fillRect(-u * 1.2, -u, u * 2.4, u * 1.6); g.restore(); }
    g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // điện thoại trên bàn
    const px = x + w * 0.76, py = dy - m * 0.012, pw = m * 0.2, ph = m * 0.05, bz = C.buzz > 0 ? Math.sin(now * 150) * 2.2 : 0;
    g.save(); g.translate(px + bz - C.calls * m * 0.012, py);
    g.transform(1, 0, -0.5, 1, 0, 0); rr(-pw / 2, -ph, pw, ph, 4); g.fillStyle = '#0b0c12'; g.fill(); g.strokeStyle = '#34374a'; g.lineWidth = 1.2; g.stroke();
    const face = C.stage === 1 || C.flip > 0.5; // úp xuống trong đêm thứ bảy, cho tới khi lật
    if (face) { rr(-pw / 2 + 3, -ph + 2.5, pw - 6, ph - 5, 3); g.fillStyle = C.stage === 2 ? '#1f6f43' : (C.noteSeen ? '#1a2238' : 'rgba(150,180,255,' + (0.5 + 0.4 * pulse()) + ')'); g.fill(); }
    g.restore();
    if (C.buzz > 0 || (C.stage === 1 && !C.noteSeen)) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(K().SP.fog, px - pw, py - pw * 0.7, pw * 2, pw); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    if (C.stage === 1 && !C.noteSeen && !C.close) invite(px, py - ph * 0.5, pw * 0.62);
    if (C.stage === 2 && C.flip > 0.5 && !C.close) invite(px, py - ph * 0.5, pw * 0.62);
  }
  // ----- Phía anh: trên xe, cửa kính trôi qua -----
  function drawCar(r) {
    const { x, y, w, h } = r, m = Math.min(w, h), sp = C.carT;
    g.fillStyle = '#07080d'; g.fillRect(x, y, w, h);
    const wx = x + w * 0.07, wy = y + h * 0.13, ww = w * 0.86, wh = h * 0.6;
    g.save(); rr(wx, wy, ww, wh, m * 0.06); g.clip();
    sky(wx, wy, ww, wh, C.sky);
    const day = ss(0.3, 1, C.sky);
    for (let i = 0; i < 3; i++) { // núi, đồi chè trôi ngang, lớp gần trôi nhanh hơn
      const sp2 = sp * [9, 26, 70][i], base = wy + wh * [0.62, 0.72, 0.84][i], amp = wh * [0.2, 0.16, 0.14][i];
      g.fillStyle = rgb(mix([[14, 18, 40], [10, 15, 30], [8, 14, 20]][i], [[150, 146, 186], [78, 122, 104], [46, 96, 70]][i], day));
      g.beginPath(); g.moveTo(wx, wy + wh);
      for (let k = 0; k <= 40; k++) { const fx = k / 40, q = fx * [3, 4.4, 6][i] + sp2 / 100; g.lineTo(wx + ww * fx, base - amp * (0.5 + 0.34 * Math.sin(q * 1.9) + 0.16 * Math.sin(q * 4.7 + i))); }
      g.lineTo(wx + ww, wy + wh); g.closePath(); g.fill();
    }
    g.fillStyle = rgb(mix([12, 14, 24], [96, 96, 104], day)); g.fillRect(wx, wy + wh * 0.9, ww, wh * 0.1); // mặt đường
    for (let i = 0; i < 4; i++) { // cột điện lướt qua
      const px = wx + ww - (((sp * 190 + i * ww * 0.37) % (ww * 1.3))), ph = wh * 0.62;
      g.fillStyle = rgb(mix([3, 4, 9], [40, 44, 58], day)); g.fillRect(px, wy + wh * 0.9 - ph, m * 0.012, ph); g.fillRect(px - m * 0.03, wy + wh * 0.9 - ph * 0.94, m * 0.072, m * 0.008);
    }
    // biển chỉ đường (hiện một lần giữa chặng)
    const sx = wx + ww * (1.5 - ((sp * 0.42) % 2.6)); if (sx > wx - ww * 0.3 && sx < wx + ww) {
      g.fillStyle = '#1d4fa0'; rr(sx, wy + wh * 0.3, ww * 0.3, wh * 0.2, 4); g.fill(); g.strokeStyle = '#e8ecf6'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#f2f4fa'; g.font = '600 ' + (wh * 0.085) + 'px "Barlow Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THÁI NGUYÊN', sx + ww * 0.15, wy + wh * 0.4);
      g.fillStyle = '#2a2d38'; g.fillRect(sx + ww * 0.145, wy + wh * 0.5, 3, wh * 0.4);
    }
    // kính phản chiếu
    const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gr.addColorStop(0, 'rgba(255,255,255,.07)'); gr.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
    g.restore();
    g.strokeStyle = '#15171f'; g.lineWidth = m * 0.03; rr(wx, wy, ww, wh, m * 0.06); g.stroke();
    // lưng ghế trước
    g.fillStyle = '#0c0d14'; rr(x + w * 0.56, y + h * 0.56, w * 0.3, h * 0.6, m * 0.05); g.fill(); rr(x + w * 0.63, y + h * 0.44, w * 0.16, h * 0.15, m * 0.03); g.fill();
  }
  // ----- Phía em: trong doanh trại -----
  function drawCamp(r) {
    const { x, y, w, h } = r, m = Math.min(w, h), day = ss(0.3, 1, C.sky), SP = K().SP;
    sky(x, y, w, h * 0.72, C.sky);
    if (C.sky < 0.55) for (let i = 0; i < 40; i++) { g.globalAlpha = (1 - C.sky / 0.55) * (0.4 + 0.5 * Math.sin(now * (0.6 + i % 5 * 0.3) + i)); g.fillStyle = '#e9ecff'; g.fillRect(x + ((i * 97.3) % 1) * w + (i * 53 % w), y + (i * 31 % (h * 0.4)), 1.2, 1.2); }
    g.globalAlpha = 1;
    // ngọn đồi tập
    g.fillStyle = rgb(mix([10, 15, 26], [70, 118, 84], day)); g.beginPath(); g.moveTo(x + w * 0.3, y + h * 0.72);
    g.bezierCurveTo(x + w * 0.5, y + h * 0.22, x + w * 0.86, y + h * 0.2, x + w * 1.05, y + h * 0.5); g.lineTo(x + w * 1.05, y + h * 0.72); g.closePath(); g.fill();
    if (C.found.hill) { g.fillStyle = 'rgba(255,214,150,.5)'; g.beginPath(); g.arc(x + w * 0.76, y + h * 0.33, 3, 0, 6.29); g.fill(); }
    // sân
    let gr = g.createLinearGradient(0, y + h * 0.7, 0, y + h); gr.addColorStop(0, rgb(mix([12, 13, 21], [150, 134, 112], day))); gr.addColorStop(1, rgb(mix([6, 6, 11], [108, 96, 82], day))); g.fillStyle = gr; g.fillRect(x, y + h * 0.7, w, h * 0.3);
    // dãy nhà ở: cửa sổ tối, sau còi thì sáng dần
    const bx = x + w * 0.03, by = y + h * 0.36, bw = w * 0.4, bh = h * 0.4;
    g.fillStyle = rgb(mix([14, 16, 26], [196, 186, 160], day)); g.fillRect(bx, by, bw, bh); g.fillStyle = rgb(mix([8, 9, 16], [120, 70, 58], day)); g.beginPath(); g.moveTo(bx - 6, by); g.lineTo(bx + bw / 2, by - h * 0.07); g.lineTo(bx + bw + 6, by); g.closePath(); g.fill();
    for (let i = 0; i < 6; i++) {
      const wx = bx + bw * (0.1 + (i % 3) * 0.3), wy = by + bh * (0.3 + Math.floor(i / 3) * 0.36), on = clamp(C.lit * 6 - i);
      g.fillStyle = on > 0 ? 'rgba(255,214,140,' + (0.25 + 0.75 * on) * (1 - day * 0.6) + ')' : '#080910'; g.fillRect(wx, wy, bw * 0.19, bh * 0.2);
    }
    // đồng hồ trên đầu hồi
    const cr = m * 0.07, ccx = bx + bw / 2, ccy = by + bh * 0.02;
    clockFace(ccx, ccy, cr, C.hand, C.stage === 1 && C.noteSeen ? 0.25 + 0.2 * pulse() : 0);
    if (C.stage === 1 && C.noteSeen && C.sub !== 'coi') invite(ccx, ccy, cr * 1.5);
    // điện thoại của em trên bậu cửa sổ
    if (C.stage >= 2) { const ex = bx + bw * 0.195, ey = by + bh * 0.66 + bh * 0.2; g.fillStyle = '#0b0c12'; rr(ex - m * 0.02, ey - m * 0.06, m * 0.04, m * 0.06, 2); g.fill();
      if (C.stage === 2) { g.fillStyle = 'rgba(120,230,160,' + (0.5 + 0.4 * pulse()) + ')'; g.fillRect(ex - m * 0.015, ey - m * 0.055, m * 0.03, m * 0.05); if (!C.close && C.flip < 0.5) invite(ex, ey - m * 0.03, m * 0.07); } }
    // cột loa còi
    const lx = x + w * 0.52, ly = y + h * 0.72; g.fillStyle = rgb(mix([5, 6, 11], [58, 60, 70], day)); g.fillRect(lx - 2.5, y + h * 0.2, 5, ly - (y + h * 0.2));
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(lx, y + h * 0.24); g.lineTo(lx + s * m * 0.09, y + h * 0.2); g.lineTo(lx + s * m * 0.09, y + h * 0.3); g.closePath(); g.fill(); }
    if (C.sub === 'coi') { g.strokeStyle = 'rgba(255,220,160,.5)'; g.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const rr2 = m * (0.12 + ((now * 0.9 + k / 3) % 1) * 0.3); g.globalAlpha = 1 - ((now * 0.9 + k / 3) % 1); g.beginPath(); g.arc(lx, y + h * 0.25, rr2, 0, 6.29); g.stroke(); } g.globalAlpha = 1; }
    // quầy nhà ăn: cửa chớp kéo lên thì thấy khay cơm
    const kx = x + w * 0.66, ky = y + h * 0.44, kw = w * 0.3, kh = h * 0.3;
    g.fillStyle = rgb(mix([12, 14, 22], [170, 176, 170], day)); g.fillRect(kx, ky, kw, kh);
    g.fillStyle = '#05060a'; g.fillRect(kx + kw * 0.1, ky + kh * 0.16, kw * 0.8, kh * 0.5);
    if (C.shutter > 0.02) { const tu = kw * 0.26; g.save(); g.beginPath(); g.rect(kx + kw * 0.1, ky + kh * 0.16, kw * 0.8, kh * 0.5); g.clip(); g.translate(kx + kw * 0.5, ky + kh * 0.5); K().OBJS.khay(tu, 1, 0); g.restore(); }
    g.fillStyle = rgb(mix([24, 27, 40], [132, 142, 150], day)); const sh = kh * 0.5 * (1 - C.shutter); g.fillRect(kx + kw * 0.1, ky + kh * 0.16, kw * 0.8, sh);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let i = 1; i < 6; i++) { const yy = ky + kh * 0.16 + sh * i / 6; if (sh > 6) { g.beginPath(); g.moveTo(kx + kw * 0.1, yy); g.lineTo(kx + kw * 0.9, yy); g.stroke(); } }
    // ghế đá, bộ bài nằm khuất dưới gầm
    const hx = x + w * 0.12, hy2 = y + h * 0.84, hw = w * 0.2;
    g.fillStyle = rgb(mix([18, 19, 28], [126, 120, 112], day)); g.fillRect(hx, hy2, hw, h * 0.03); g.fillRect(hx + hw * 0.08, hy2, hw * 0.08, h * 0.09); g.fillRect(hx + hw * 0.84, hy2, hw * 0.08, h * 0.09);
    const dk = C.deck; { const dx = hx + hw * (0.5 + 0.0 * dk), dy = hy2 + h * 0.065 - dk * h * 0.085; g.save(); g.translate(dx, dy); g.rotate(-0.12);
      for (let i = 0; i < 3; i++) { rr(-m * 0.028 + i * 1.5, -m * 0.02 - i * 1.5, m * 0.056, m * 0.04, 2); g.fillStyle = ['#b3262c', '#e2b23a', '#b3262c'][i]; g.fill(); g.strokeStyle = '#f3ead6'; g.lineWidth = 1; g.stroke(); } g.restore(); }
    // gợi ý chỗ còn thứ chưa tìm (chặng 3)
    if (C.stage === 3 && !C.close) { if (!C.found.khay) invite(kx + kw * 0.5, ky + kh * 0.4, kw * 0.34 * (C.idle > 16 ? 1 : 0.0001)); if (!C.found.uno) invite(hx + hw * 0.5, hy2 + h * 0.04, hw * 0.4 * (C.idle > 24 ? 1 : 0.0001)); if (!C.found.hill) invite(x + w * 0.76, y + h * 0.33, m * 0.1 * (C.idle > 32 ? 1 : 0.0001)); }
    // mí mắt sụp xuống (ngủ gật trên đồi)
    if (C.lid > 0.01) { g.fillStyle = '#020204'; const lh = h * 0.52 * C.lid; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + lh * 0.7); g.quadraticCurveTo(x + w / 2, y + lh * 1.3, x, y + lh * 0.7); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w, y + h); g.lineTo(x + w, y + h - lh * 0.7); g.quadraticCurveTo(x + w / 2, y + h - lh * 1.3, x, y + h - lh * 0.7); g.closePath(); g.fill(); }
  }

  // ----- Cận cảnh (mở trong đúng nửa của nó) -----
  function phoneBody(u) { const w = 0.74 * u, h = 1.46 * u; rr(-w / 2, -h / 2, w, h, 0.1 * u); g.fillStyle = '#0c0d13'; g.fill(); g.strokeStyle = '#3a3d4c'; g.lineWidth = 1.5; g.stroke(); rr(-w / 2 + 0.03 * u, -h / 2 + 0.03 * u, w - 0.06 * u, h - 0.06 * u, 0.075 * u); g.fillStyle = '#0f1220'; g.fill(); return [w, h]; }
  const T = (s, x, y, f, col = '#EEF0F8', al = 'center') => { g.font = f; g.fillStyle = col; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(s, x, y); };
  const tm = (s) => { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function drawClose() {
    const c = C.close; if (!c) return;
    const r = R[c.side], k = ss(0, 0.45, C.closeT), u = Math.min(r.w * 0.36, r.h * 0.31), cx = r.x + r.w / 2, cy = r.y + r.h * 0.48;
    g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
    g.fillStyle = 'rgba(3,4,9,' + 0.86 * k + ')'; g.fillRect(r.x, r.y, r.w, r.h);
    g.globalAlpha = k; g.translate(cx, cy + (1 - k) * 14);
    const F = (px, wt = 400) => wt + ' ' + (px * u) + 'px "Be Vietnam Pro", sans-serif';
    if (c.id === 'note') { // điện thoại của anh: ghi chú lịch của em
      phoneBody(u); T('Ghi chú', 0, -0.56 * u, F(0.06), 'rgba(238,240,248,.5)'); T('Lịch của em', -0.28 * u, -0.42 * u, F(0.1, 600), '#FFE2A8', 'left');
      [['05:00', 'còi báo thức'], ['12:45', 'còi đầu giờ chiều'], ['21:00', 'em nhận lại máy']].forEach((row, i) => { const yy = (-0.22 + i * 0.2) * u; T(row[0], -0.28 * u, yy, '500 ' + (0.115 * u) + 'px "Barlow Condensed", sans-serif', i === 0 ? '#FFD79A' : '#EEF0F8', 'left'); T(row[1], -0.28 * u, yy + 0.085 * u, F(0.052), 'rgba(238,240,248,.55)', 'left'); });
    } else if (c.id === 'call') { // điện thoại của em: gọi anh
      phoneBody(u); T('Anh', 0, -0.4 * u, F(0.15, 600));
      const st = C.talk >= 0 ? tm(C.talk) : C.calling > 0 ? 'Đang gọi…' : C.calls ? 'Không trả lời' : ''; T(st, 0, -0.24 * u, C.talk >= 0 ? '400 ' + (0.14 * u) + 'px "Barlow Condensed", sans-serif' : F(0.062), C.talk >= 0 ? '#9BE8B4' : 'rgba(238,240,248,.6)');
      if (C.calls) T('Đã gọi ' + C.calls + ' lần', 0, -0.12 * u, F(0.05), 'rgba(255,128,128,.8)');
      if (C.talk < 0) { g.fillStyle = C.calling > 0 ? '#2c6b45' : '#34c26b'; g.beginPath(); g.arc(0, 0.36 * u, 0.15 * u * (C.calling > 0 ? 1 : 1 + 0.06 * pulse()), 0, 6.29); g.fill(); T('Gọi', 0, 0.365 * u, F(0.066, 600), '#07140c'); }
    } else if (c.id === 'answer') { // điện thoại của anh: em đang gọi, vuốt để nghe
      phoneBody(u); T('Em', 0, -0.4 * u, F(0.15, 600));
      if (C.talk >= 0) T(tm(C.talk), 0, -0.22 * u, '400 ' + (0.16 * u) + 'px "Barlow Condensed", sans-serif', '#9BE8B4');
      else { T('đang gọi…', 0, -0.24 * u, F(0.062), 'rgba(238,240,248,.6)');
        const tw = 0.56 * u, tx = -tw / 2, ty = 0.36 * u; rr(tx, ty - 0.085 * u, tw, 0.17 * u, 0.085 * u); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill();
        T('vuốt để nghe', 0.06 * u, ty, F(0.048), 'rgba(238,240,248,.45)');
        g.fillStyle = '#34c26b'; g.beginPath(); g.arc(tx + 0.085 * u + C.slide * (tw - 0.17 * u), ty, 0.075 * u, 0, 6.29); g.fill(); c.track = { x: cx + tx, w: tw, y: cy + ty, r: 0.12 * u }; }
    } else if (c.id === 'khay') { K().OBJS.khay(u * 0.95, 1, C.closeT); }
    else if (c.id === 'uno') { // những lá bài xoè ra
      const cols = ['#c22c32', '#e6b63c', '#2f8f57', '#2a62b8', '#c22c32'];
      for (let i = 0; i < 5; i++) { const on = ss(0.3 + i * 0.28, 0.75 + i * 0.28, C.closeT), a = (-0.5 + i * 0.25) * on; g.save(); g.translate(0, 0.5 * u); g.rotate(a); g.translate(0, -0.72 * u);
        rr(-0.2 * u, -0.3 * u, 0.4 * u, 0.6 * u, 0.04 * u); g.fillStyle = cols[i]; g.fill(); g.strokeStyle = '#f6efdc'; g.lineWidth = 0.02 * u; g.stroke();
        g.save(); g.rotate(-0.5); g.fillStyle = '#f6efdc'; g.beginPath(); g.ellipse(0, 0, 0.15 * u, 0.22 * u, 0, 0, 6.29); g.fill(); g.restore(); T(String([7, 2, 9, 4, 1][i]), 0, 0, '600 ' + (0.2 * u) + 'px "Barlow Condensed", sans-serif', cols[i]); g.restore(); }
    }
    g.restore(); g.globalAlpha = 1;
  }

  // ----- Cánh cổng giữa hai nửa + con đường 999 vạch chạy dọc phía anh -----
  function drawGateBar() {
    const d = R.d, P = L.P, SP = K().SP;
    g.fillStyle = '#05060b'; g.fillRect(d.x, d.y, d.w, d.h);
    g.fillStyle = '#1a1c28'; const n = 22; for (let i = 0; i < n; i++) { if (P) g.fillRect(d.x + (i + 0.5) * d.w / n - 2, d.y - 5, 4, d.h + 10); else g.fillRect(d.x - 5, d.y + (i + 0.5) * d.h / n - 2, d.w + 10, 4); }
    g.fillStyle = '#0a0b12'; if (P) g.fillRect(d.x, d.y + d.h / 2 - 2.5, d.w, 5); else g.fillRect(d.x + d.w / 2 - 2.5, d.y, 5, d.h);
    // con đường: màn dọc chạy dọc mép phải của nửa anh, màn ngang chạy dọc đáy
    const a = R.a, k = C.count / 999;
    const p0 = P ? [a.x + a.w - 16, a.y + 18] : [a.x + 18, a.y + a.h - 16], p1 = P ? [a.x + a.w - 16, a.y + a.h - 4] : [a.x + a.w - 4, a.y + a.h - 16];
    const N = 74; for (let i = 0; i < N; i++) { const f = (i + 0.5) / N, px = lerp(p0[0], p1[0], f), py = lerp(p0[1], p1[1], f), on = f <= k;
      g.fillStyle = on ? 'rgba(255,226,170,.95)' : 'rgba(200,208,235,.2)'; g.beginPath(); g.arc(px, py, on ? 1.9 : 1.3, 0, 6.29); g.fill(); }
    if (C.count > 0) { const hx = lerp(p0[0], p1[0], k), hy = lerp(p0[1], p1[1], k); g.globalCompositeOperation = 'lighter'; g.drawImage(SP.glow, hx - 16, hy - 16, 32, 32); g.globalCompositeOperation = 'source-over'; }
    // dấu chân của em, sát cánh cổng
    const f = footPos(), fr = Math.max(18, L.m * 0.055);
    if (!C.stepped) { g.setLineDash([4, 5]); g.strokeStyle = 'rgba(232,226,214,' + (0.35 + 0.35 * pulse()) + ')'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(f.x, f.y, fr, fr * 0.5, 0, 0, 6.29); g.stroke(); g.setLineDash([]);
      if (C.hold > 0) { g.strokeStyle = 'rgba(255,220,160,.95)'; g.lineWidth = 2.4; g.beginPath(); g.ellipse(f.x, f.y, fr * 1.35, fr * 0.7, 0, -1.571, -1.571 + 6.283 * C.hold); g.stroke(); } }
    else { const gw = fr * (4.4 + 4 * C.flare); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.8; g.drawImage(SP.glow, f.x - gw / 2, f.y - gw * 0.3, gw, gw * 0.6); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#FFF1D2'; g.beginPath(); g.ellipse(f.x, f.y, fr * 0.8, fr * 0.4, 0, 0, 6.29); g.fill(); }
  }

  // ================= Diễn biến =================
  function goStage(n) {
    C.stage = n; C.idle = 0; C.sub = '';
    if (n === 1) { A.songDist(0.13, 3); }
    if (n === 2) { C.skyTo = 0.12; C.hourA = 23; C.hand = 23; C.lit = 0.34; A.songDist(0.22, 3); }
    if (n === 3) { C.skyTo = 0.95; C.car = 1; C.hourA = 8.5; C.hand = 8.5; C.lit = 1; A.songDist(0.33, 3); }
    if (n === 4) { K().setText('cap', ''); setTimeout(() => { const cap = document.getElementById('cap'); cap.style.top = ''; cap.style.bottom = ''; K().finale(); }, 1500); }
  }
  function walkTo(cap, text) { C.cap = cap; C.sub = 'walk'; C.idle = 0; if (text) say(text, 7); setTimeout(() => { if (C.sub === 'walk' && C.count < C.cap) hint('giữ tay bên anh để anh bước'); }, 5200); }
  function open(side, id) { C.close = { side, id }; C.closeT = 0; C.idle = 0; }
  function shut() { C.close = null; }

  function step() {
    if (C.stepped) return;
    C.stepped = true; C.holding = false; C.flare = 1; C.count = 0;
    A.step(1, 0); A.boom(); try { if (navigator.vibrate) navigator.vibrate(35); } catch (e) { /* bỏ qua */ }
    document.getElementById('hint').classList.remove('on'); K().setText('line', '');
    A.songDist(0.1, 0.1); A.songPlay(0);
    document.getElementById('title').classList.add('on'); setTimeout(() => document.getElementById('title').classList.remove('on'), 5600);
    setTimeout(() => goStage(1), 6800);
  }

  function tap(x, y) {
    C.idle = 0;
    if (C.stage === 0) return;
    // ----- đang mở cận cảnh -----
    if (C.close) {
      const c = C.close, inside = inR(R[c.side], x, y);
      if (c.id === 'note') { shut(); if (!C.noteSeen) { C.noteSeen = true; } return; }
      if (c.id === 'call' && inside && C.talk < 0 && C.calling <= 0 && C.flip < 0.5) { C.calling = 3.1; C.calls++; A.ring(); setTimeout(() => { C.buzz = 2.2; A.buzz(2); }, 500); return; }
      if (c.id === 'khay') { if (C.closeT > 1) { A.clink(); } return; }
      if ((c.id === 'uno' || c.id === 'khay') && C.closeT > 3) shut();
      return;
    }
    const side = inR(R.a, x, y) ? 'a' : inR(R.e, x, y) ? 'e' : null; if (!side) return;
    const id = hit(side, x, y);
    if (C.stage === 1) {
      if (side === 'a' && id === 'phone') { A.tick(); open('a', 'note'); return; }
      if (side === 'a' && (id === 'lamp' || id === 'laptop')) { C.lamp = !C.lamp; A.lamp(); return; }
      if (side === 'e' && id === 'clock' && C.sub !== 'coi' && C.sub !== 'walk') {
        if (!C.noteSeen) { A.tick(); hint('chưa biết phải chỉnh về mấy giờ'); return; }
        C.hourE = C.hourE >= 12 ? 1 : C.hourE + 1; A.tick();
        if (C.hourE === 5) { C.sub = 'coi'; setTimeout(() => { A.siren(5.2); C.skyTo = 0.3; }, 500);
          setTimeout(() => { C.lamp = true; A.lamp(); C.hourA = 5; }, 3200); setTimeout(() => walkTo(250), 7200); }
        return;
      }
      if (side === 'e' && id === 'loa') { hint('chưa tới giờ còi'); return; }
    }
    if (C.stage === 2 && C.sub !== 'walk') {
      if (side === 'e' && id === 'phone' && C.talk < 0) { open('e', 'call'); return; }
      if (side === 'a' && id === 'phone' && C.flip > 0.5) { open('a', 'answer'); return; }
      if (side === 'a' && id === 'phone') { hint('máy úp xuống, im lìm'); return; }
    }
    if (C.stage === 3 && C.sub !== 'walk') {
      if (side === 'e' && id === 'shutter' && !C.found.khay) { C.found.khay = 1; A.shutter(); setTimeout(() => { open('e', 'khay'); A.clink(); }, 900); setTimeout(() => { if (C.close && C.close.id === 'khay') shut(); got(); }, 8600); return; }
      if (side === 'e' && id === 'bench' && !C.found.uno) { C.found.uno = 1; A.flip(); setTimeout(() => { open('e', 'uno'); for (let i = 0; i < 5; i++) setTimeout(() => A.flip(), 300 + i * 280); }, 700); setTimeout(() => { if (C.close && C.close.id === 'uno') shut(); got(); }, 8600); return; }
      if (side === 'e' && id === 'hill' && !C.found.hill) { hint('chạm và giữ ngọn đồi'); return; }
    }
    if (C.sub !== 'walk' && id === null && C.stage >= 1) { /* chạm chỗ trống: không có gì */ }
  }
  // mỗi thứ tìm được: anh đi thêm một đoạn
  function got() {
    const n = Object.keys(C.found).length; C.cap = 500 + n * 150; C.auto = true; C.idle = 0;
    if (n >= 3) setTimeout(() => { C.sub = 'done'; say('“Người ta chỉ than với người mà người ta tin nhất.”', 7); }, 400);
  }

  function down(x, y) {
    if (C.stage === 0) { C.holding = true; return; }
    C.idle = 0;
    if (C.close && C.close.id === 'answer' && C.close.track && C.talk < 0) { const t = C.close.track; if (Math.abs(y - t.y) < t.r * 2.2 && x > t.x - t.r && x < t.x + t.w + t.r) { C.sliding = true; return; } }
    if (C.sub === 'walk' && inR(R.a, x, y) && !C.close) { C.walking = true; return; }
    if (C.stage === 3 && !C.close && !C.found.hill && inR(R.e, x, y) && hit('e', x, y) === 'hill') { C.lidHold = true; A.windTo(0.05, 1.5); return; }
    C.tapAt = [x, y, now];
  }
  function move(x) { if (C.sliding && C.close && C.close.track) { const t = C.close.track; C.slide = clamp((x - t.x - t.r * 0.7) / (t.w - t.r * 1.4)); } }
  function up(x, y) {
    C.holding = false; C.walking = false;
    if (C.sliding) { C.sliding = false; if (C.slide > 0.8) { C.slide = 1; C.talk = 0; C.buzz = 0; A.tick(); open('a', 'answer'); C.close.keep = true; } else C.slide = 0; return; }
    if (C.lidHold) { C.lidHold = false; A.windTo(0.3, 2); if (C.lid > 0.92) { C.found.hill = 1; got(); } return; }
    if (C.tapAt && now - C.tapAt[2] < 0.6) tap(C.tapAt[0], C.tapAt[1]);
    C.tapAt = null;
  }

  function update(dt) {
    C.t += dt; C.idle += dt; if (C.close) C.closeT += dt;
    C.sky += (C.skyTo - C.sky) * Math.min(1, dt * 0.5);
    C.hand += (C.hourE - C.hand) * Math.min(1, dt * 6); if (C.stage >= 2) C.hand = C.hourA;
    if (C.stage === 0) { if (C.holding && !C.stepped) { C.hold = Math.min(1, C.hold + dt / 0.95); if (C.hold >= 1) step(); } else C.hold = Math.max(0, C.hold - dt * 2.2); }
    C.flare = Math.max(0, C.flare - dt * 0.5);
    if (C.sub === 'coi') C.lit = Math.min(1, C.lit + dt * 0.14);
    if (C.car) C.carT += dt * (0.4 + (C.count < C.cap ? 0.8 : 0));
    C.shutter = Math.min(1, C.shutter + (C.found.khay ? dt * 1.4 : 0)); C.deck = Math.min(1, C.deck + (C.found.uno ? dt * 2 : 0));
    C.lid = clamp(C.lid + (C.lidHold ? dt / 2.4 : -dt * 1.6));
    if (C.lidHold && C.lid >= 1) { C.lidFull = (C.lidFull || 0) + dt; if (C.lidFull > 1.4) up(0, 0); } // ngủ đủ một giấc thì tự mở mắt
    // bài hát ở phần chơi: chỉ đoạn dạo và đoạn đầu, lặp lại (đoạn rap để dành cho cao trào)
    if (C.stage < 4 && A.el && !A.el.paused && A.el.currentTime > 56.2) { try { A.el.currentTime = 10.9; } catch (e) { /* bỏ qua */ } }
    // cuộc gọi
    if (C.calling > 0) { C.calling -= dt; if (C.calling <= 0 && C.calls >= 3 && C.flip < 0.5) { C.flip = 1; A.tick(); shut(); setTimeout(() => { C.buzz = 30; A.buzz(2); hint('máy bên anh đã lật lên'); }, 900); } }
    if (C.buzz > 0) { C.buzz -= dt; if (C.flip > 0.5 && C.talk < 0 && Math.floor(C.buzz * 0.55) !== Math.floor((C.buzz + dt) * 0.55)) A.buzz(1); }
    if (C.talk >= 0) { const was = C.talk; C.talk += dt * (C.talk < 30 ? 6 : 95); // đồng hồ cuộc gọi chạy nhanh dần, qua mười phút vẫn chạy
      if (was < 600 && C.talk >= 600) { A.bell(659.3, 0.08, 3); }
      if (was < 760 && C.talk >= 760) { shut(); C.talk = 760; C.stage = 2; walkTo(500); C.talk = -2; } }
    // anh bước
    const moving = (C.sub === 'walk' && C.walking) || C.auto;
    if (moving && C.count < C.cap) {
      const was = C.count; C.walkAcc += dt * 46; const add = Math.floor(C.walkAcc); C.walkAcc -= add; C.count = Math.min(C.cap, C.count + add);
      if (Math.floor(was / 9) !== Math.floor(C.count / 9)) A.step(0.32, (Math.floor(C.count / 9) & 1) ? 0.25 : -0.25);
      if (C.count >= C.cap) { C.auto = false; C.walking = false; A.bell(493.9, 0.06, 2.5);
        if (C.sub === 'walk') { C.sub = ''; goStage(C.stage + 1); }
        else if (C.sub === 'done') goStage(4); }
    }
    if (C.sub === 'done' && !C.auto && C.count >= C.cap && C.stage === 3) goStage(4);
    if (C.msg && C.t > C.msgUntil) { C.msg = ''; K().setText('cap', ''); }
    // gợi ý khi em đứng lâu
    if (C.idle > 15 && !C.close) { C.idle = 3;
      if (C.stage === 0 && !C.stepped) hint('chạm và giữ dấu chân của em');
      else if (C.sub === 'walk') hint('giữ tay bên anh để anh bước');
      else if (C.stage === 1 && !C.noteSeen) hint('điện thoại trên bàn anh đang sáng');
      else if (C.stage === 1) hint('chiếc đồng hồ bên em vẫn chỉ hai giờ');
      else if (C.stage === 2 && C.flip < 0.5) hint(C.calls ? 'gọi nữa đi' : 'điện thoại của em, trên bậu cửa sổ');
      else if (C.stage === 2 && C.talk < 0) hint('chạm điện thoại bên anh, rồi vuốt để nghe');
      else if (C.stage === 3) hint('bên em còn ' + (3 - Object.keys(C.found).length) + ' thứ em đã kể'); }
    const n = document.getElementById('count-n'); if (n.textContent !== String(C.count)) n.textContent = C.count;
    document.getElementById('count').classList.toggle('on', C.stage >= 1 && C.count > 0);
  }

  function frame(ctx, layout, t, dt) {
    g = ctx; L = layout; now = t; rects(); update(dt);
    // phụ đề: màn dọc đặt ngay dưới cánh cổng (khoảng trời bên em), màn ngang để ở đáy
    const cap = document.getElementById('cap'), top = L.P ? Math.round(R.e.y + R.e.h * 0.045) + 'px' : '';
    if (cap.style.top !== top) { cap.style.top = top; cap.style.bottom = L.P ? 'auto' : ''; }
    g.save(); g.beginPath(); g.rect(R.a.x, R.a.y, R.a.w, R.a.h); g.clip(); if (C.car) drawCar(R.a); else drawRoom(R.a); g.restore();
    g.save(); g.beginPath(); g.rect(R.e.x, R.e.y, R.e.w, R.e.h); g.clip(); drawCamp(R.e); g.restore();
    drawGateBar(); drawClose();
    // chữ đầu: mời em bước
    if (C.stage === 0 && !C.stepped && C.t > 3.5 && !C.asked) { C.asked = true; K().setText('line', 'Bước một bước thôi.'); }
  }
  function start() { C.t = 0; C.stage = 0; A.bedStart(); }
  window.ConLaiChoi = { start, frame, down, move, up, C };
})();
