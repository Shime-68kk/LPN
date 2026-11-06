// Chương 19 · Sợi chỉ: vẽ cảnh bằng canvas. Không vẽ người, chỉ đồ vật và ánh sáng.
// Toạ độ "thế giới" 1000 × 460 (mặt sàn bắt đầu ở y = 372). Nền vẽ tràn ra ngoài (X0, Y0, BW, BH) để camera trôi, thu phóng không hở mép.
// Mỗi nơi có bg(c, variant) vẽ một lần vào ảnh đệm (đèn bật / tắt là hai ảnh, đổi bằng cách mờ chuyển),
// và dyn(c, t, st) vẽ mỗi khung hình (kim giây, hạt bụi, khe cửa sáng…).
//   A: phòng anh ở Hà Nội (variant: on = đèn ngủ bật, off = tắt đèn)
//   B: phòng em (thật ra là doanh trại; variant: dark = trước 5 giờ, tube = đèn tuýp bật)
//   H: hành lang đêm bên em (cảnh mở đầu và cuộc gọi)
'use strict';
(() => {
  const W = 1000, H = 460, X0 = -170, Y0 = -100, BW = 1340, BH = 660, FLOOR = 372;
  const rand = (s) => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const LG = (c, x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, k]) => g.addColorStop(o, k)); return g; };
  const RG = (c, x, y, r0, r1, st) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, k]) => g.addColorStop(o, k)); return g; };
  const fillAll = (c, s) => { c.fillStyle = s; c.fillRect(X0, Y0, BW, BH); };
  // Quầng sáng cộng màu (đèn, màn hình, trăng). sy < 1: dẹt theo chiều dọc
  function glow(c, x, y, r, col, a, sy = 1) {
    if (a <= 0.001) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, y); c.scale(1, sy);
    c.fillStyle = RG(c, 0, 0, 0, r, [[0, rgba(col, a)], [0.35, rgba(col, a * 0.42)], [1, rgba(col, 0)]]);
    c.fillRect(-r, -r, 2 * r, 2 * r); c.restore();
  }
  function shade(c, x, y, rx, ry, a) {
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    c.fillStyle = RG(c, 0, 0, 0, rx, [[0, 'rgba(0,0,0,' + a + ')'], [0.6, 'rgba(0,0,0,' + a * 0.5 + ')'], [1, 'rgba(0,0,0,0)']]);
    c.fillRect(-rx, -rx, 2 * rx, 2 * rx); c.restore();
  }
  // Vân vữa / vân gỗ: nhiễu xám trộn "overlay"
  let NZ = null;
  function texture(c, x, y, w, h, a) {
    if (!NZ) {
      const n = 180, k = document.createElement('canvas'); k.width = k.height = n;
      const g = k.getContext('2d'), im = g.createImageData(n, n);
      for (let i = 0; i < n * n; i++) { const v = (Math.random() * 0.6 + Math.random() * 0.4) * 255 | 0; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
      g.putImageData(im, 0, 0); NZ = k;
    }
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(NZ, 'repeat'); c.fillRect(x, y, w, h); c.restore();
  }
  // Một chùm sáng xiên (trăng qua cửa sổ, nắng sớm): đa giác mờ dần từ trên xuống
  function shaft(c, pts, col, a) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const ys = pts.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    c.fillStyle = LG(c, 0, y0, 0, y1, [[0, rgba(col, a)], [0.7, rgba(col, a * 0.5)], [1, rgba(col, 0)]]);
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.restore();
  }
  function baseboard(c, col) {
    c.fillStyle = col; c.fillRect(X0, FLOOR - 9, BW, 9);
    c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(X0, FLOOR - 9, BW, 1);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(X0, FLOOR - 1, BW, 1);
  }
  // Gối: mặt trên sáng hơn, đường may, vết lõm (gối có người nằm)
  function pillow(c, x, y, w, h, col, dent) {
    c.fillStyle = LG(c, 0, y, 0, y + h, [[0, col[0]], [1, col[1]]]);
    c.beginPath(); c.moveTo(x + 6, y + 3);
    c.bezierCurveTo(x + w * 0.3, y - 1, x + w * 0.7, y - 1, x + w - 6, y + 3);
    c.bezierCurveTo(x + w + 2, y + h * 0.4, x + w + 2, y + h * 0.75, x + w - 5, y + h);
    c.lineTo(x + 5, y + h); c.bezierCurveTo(x - 2, y + h * 0.75, x - 2, y + h * 0.4, x + 6, y + 3); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + 4, y + h * 0.55); c.quadraticCurveTo(x + w / 2, y + h * 0.62, x + w - 4, y + h * 0.55); c.stroke();
    if (dent) { c.fillStyle = 'rgba(40,30,60,.18)'; c.beginPath(); c.ellipse(x + w * 0.55, y + 4, w * 0.24, 3.2, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(x + w * 0.35, y + 3, w * 0.2, 1.4, 0, 0, Math.PI * 2); c.fill();
  }

  // ======================= A · Phòng anh (Hà Nội) =======================
  function windowHN(c, x, y, w, h, day) {
    if (day) return windowHNday(c, x, y, w, h);
    const R = rand(3);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = LG(c, 0, y, 0, y + h, [[0, '#060918'], [0.55, '#111737'], [1, '#2C2444']]); c.fillRect(x, y, w, h);
    for (let i = 0; i < 26; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.25 + R() * 0.6) + ')'; c.beginPath(); c.arc(x + R() * w, y + R() * h * 0.5, 0.35 + R() * 0.75, 0, 7); c.fill(); }
    const mx = x + w * 0.72, my = y + h * 0.2;
    glow(c, mx, my, 70, [215, 222, 255], 0.22); glow(c, mx, my, 20, [240, 240, 255], 0.35);
    c.fillStyle = '#F4F0E0'; c.beginPath(); c.arc(mx, my, 8.5, 0, 7); c.fill();
    c.fillStyle = 'rgba(150,140,120,.18)'; [[-2, -2, 2.2], [3, 1, 1.6], [-1, 3.5, 1.2]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(mx + dx, my + dy, r, 0, 7); c.fill(); });
    // Phố xa: khối nhà mờ
    c.fillStyle = '#171a36';
    for (let xx = x - 8; xx < x + w + 10; xx += 12 + R() * 18) { const hh = 22 + R() * 40; c.fillRect(xx, y + h - hh, 16 + R() * 16, hh); }
    // Nhà ống gần: mái bằng, bồn nước inox, ăng-ten, cửa sổ còn sáng (gần sáng nên ít đèn)
    for (let xx = x - 6; xx < x + w + 10;) {
      const ww = 11 + R() * 13, hh = 42 + R() * 70, top = y + h - hh;
      c.fillStyle = '#0A0B17'; c.fillRect(xx, top, ww, hh + 2);
      c.fillRect(xx - 1, top - 2, ww + 2, 2.5);
      if (R() < 0.45) { c.fillStyle = '#151827'; c.fillRect(xx + 2, top - 8, 7, 6); c.beginPath(); c.ellipse(xx + 5.5, top - 8, 3.5, 1.2, 0, 0, 7); c.fill(); }
      if (R() < 0.35) { c.strokeStyle = '#0A0B17'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(xx + ww - 3, top); c.lineTo(xx + ww - 3, top - 12 - R() * 8); c.moveTo(xx + ww - 6, top - 9); c.lineTo(xx + ww, top - 9); c.stroke(); }
      const nWin = R() < 0.55 ? (R() < 0.4 ? 2 : 1) : 0;
      for (let k = 0; k < nWin; k++) { const tv = R() < 0.3; c.fillStyle = tv ? 'rgba(150,175,255,' + (0.35 + R() * 0.3) + ')' : 'rgba(255,198,110,' + (0.4 + R() * 0.45) + ')'; c.fillRect(xx + 2 + R() * (ww - 6), top + 8 + R() * (hh - 22), 2.6, 3.2); }
      xx += ww + R() * 3;
    }
    // Dây điện chằng chịt kiểu Hà Nội
    c.strokeStyle = 'rgba(2,2,6,.9)'; c.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x - 2, y + h * 0.4 + i * 6); c.quadraticCurveTo(x + w * 0.5, y + h * 0.5 + i * 7 + R() * 4, x + w + 2, y + h * 0.36 + i * 5); c.stroke(); }
    c.restore();
    // Kính: vệt phản chiếu
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = LG(c, x, y, x + w, y + h, [[0, 'rgba(255,255,255,0)'], [0.42, 'rgba(255,255,255,.05)'], [0.5, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,255,255,.03)'], [1, 'rgba(255,255,255,0)']]);
    c.fillRect(x, y, w, h); c.restore();
    // Khung gỗ, song chia ô, bậu cửa
    c.strokeStyle = '#2C2026'; c.lineWidth = 8; c.strokeRect(x - 4, y - 4, w + 8, h + 8);
    c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; c.strokeRect(x - 8, y - 8, w + 16, h + 16);
    c.fillStyle = '#2C2026'; c.fillRect(x + w / 2 - 2.5, y, 5, h); c.fillRect(x, y + h * 0.42 - 2.5, w, 5);
    c.fillStyle = LG(c, 0, y + h + 4, 0, y + h + 13, [[0, '#45343A'], [1, '#2A1F24']]); rr(c, x - 16, y + h + 4, w + 32, 9, 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(x - 15, y + h + 4, w + 30, 1);
    shade(c, x + w / 2, y + h + 18, w * 0.6, 6, 0.35);
  }
  // Cửa sổ lúc nắng sáng: trời xanh nhạt, nhà ống nhiều màu, bồn nước inox loá nắng, dây điện
  function windowHNday(c, x, y, w, h) {
    const R = rand(3);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = LG(c, 0, y, 0, y + h, [[0, '#7FB2E2'], [0.6, '#B9D5EC'], [1, '#E8E4D8']]); c.fillRect(x, y, w, h);
    glow(c, x + w * 0.9, y + 6, 90, [255, 248, 220], 0.5);
    c.fillStyle = 'rgba(255,255,255,.55)'; [[0.25, 0.22, 26], [0.55, 0.14, 18]].forEach(([u, v, r]) => { c.beginPath(); c.ellipse(x + w * u, y + h * v, r, r * 0.3, 0, 0, 7); c.fill(); });
    c.fillStyle = '#A9B6C6';
    for (let xx = x - 8; xx < x + w + 10; xx += 12 + R() * 18) { const hh = 22 + R() * 40; c.fillRect(xx, y + h - hh, 16 + R() * 16, hh); }
    const cols = ['#C9B7A2', '#B8A08C', '#D4C6AE', '#A8968A', '#C2A99A', '#BFB5A5'];
    for (let xx = x - 6; xx < x + w + 10;) {
      const ww = 11 + R() * 13, hh = 42 + R() * 70, top = y + h - hh, col = cols[Math.floor(R() * cols.length)];
      c.fillStyle = col; c.fillRect(xx, top, ww, hh + 2);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(xx + ww - 3, top, 3, hh + 2);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(xx - 1, top - 2, ww + 2, 2.5);
      if (R() < 0.45) { c.fillStyle = '#D9DEE3'; c.fillRect(xx + 2, top - 8, 7, 6); c.fillStyle = '#F4F6F8'; c.beginPath(); c.ellipse(xx + 5.5, top - 8, 3.5, 1.2, 0, 0, 7); c.fill(); }
      if (R() < 0.35) { c.strokeStyle = '#5A5450'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(xx + ww - 3, top); c.lineTo(xx + ww - 3, top - 12 - R() * 8); c.stroke(); }
      for (let k = 0, nw = 1 + Math.floor(R() * 3); k < nw; k++) { c.fillStyle = 'rgba(40,40,50,.45)'; c.fillRect(xx + 2 + R() * (ww - 6), top + 8 + R() * (hh - 22), 2.6, 3.4); }
      xx += ww + R() * 3;
    }
    c.strokeStyle = 'rgba(30,26,30,.8)'; c.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x - 2, y + h * 0.4 + i * 6); c.quadraticCurveTo(x + w * 0.5, y + h * 0.5 + i * 7 + R() * 4, x + w + 2, y + h * 0.36 + i * 5); c.stroke(); }
    c.restore();
    c.strokeStyle = '#4A3A40'; c.lineWidth = 8; c.strokeRect(x - 4, y - 4, w + 8, h + 8);
    c.fillStyle = '#4A3A40'; c.fillRect(x + w / 2 - 2.5, y, 5, h); c.fillRect(x, y + h * 0.42 - 2.5, w, 5);
    c.fillStyle = LG(c, 0, y + h + 4, 0, y + h + 13, [[0, '#6A5458'], [1, '#43343A']]); rr(c, x - 16, y + h + 4, w + 32, 9, 2); c.fill();
    c.fillStyle = 'rgba(255,240,220,.25)'; c.fillRect(x - 15, y + h + 4, w + 30, 1.2);
  }
  function curtains(c, x, y, w, h) {
    c.fillStyle = '#4A3A33'; c.fillRect(x - 40, y - 18, w + 80, 3.5);
    c.fillStyle = '#6A5446'; [x - 42, x + w + 42].forEach((px) => { c.beginPath(); c.arc(px, y - 16.3, 3.2, 0, 7); c.fill(); });
    const panel = (px, pw, seed) => {
      const R = rand(seed), g = c.createLinearGradient(px, 0, px + pw, 0), n = 7;
      for (let i = 0; i <= n; i++) g.addColorStop(i / n, i % 2 ? '#2B1A2A' : '#4D3048');
      c.fillStyle = g; c.beginPath(); c.moveTo(px, y - 15); c.lineTo(px + pw, y - 15);
      c.lineTo(px + pw + 2, y + h + 34);
      for (let i = n; i >= 0; i--) c.quadraticCurveTo(px + (i + 0.5) * pw / n, y + h + 38 + (R() - 0.5) * 5, px + i * pw / n, y + h + 34 + (i % 2) * 3);
      c.closePath(); c.fill();
      for (let i = 0; i < 6; i++) { c.fillStyle = '#7A6250'; c.beginPath(); c.arc(px + 4 + i * (pw - 8) / 5, y - 15, 1.4, 0, 7); c.fill(); }
      c.fillStyle = LG(c, 0, y - 15, 0, y + h + 36, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.35)']]); c.fillRect(px, y - 15, pw + 2, h + 52);
    };
    panel(x - 40, 46, 5); panel(x + w - 6, 46, 9);
  }
  function clockFace(c, x, y, r, hr = 4.5) {
    shade(c, x + 4, y + 6, r + 10, r + 10, 0.4);
    c.fillStyle = '#2A2020'; c.beginPath(); c.arc(x, y, r + 4, 0, 7); c.fill();
    c.fillStyle = RG(c, x - 8, y - 8, 2, r * 1.3, [[0, '#ECE5D6'], [1, '#B8AD9B']]); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = '#3A302C';
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = big ? r - 6.5 : r - 2.6;
      c.lineWidth = big ? 1.8 : 0.6; c.beginPath(); c.moveTo(x + Math.sin(a) * r0, y - Math.cos(a) * r0); c.lineTo(x + Math.sin(a) * (r - 1.6), y - Math.cos(a) * (r - 1.6)); c.stroke();
    }
    // Không có số. Kim: 4 giờ 30 (đọc được nếu chịu nhìn kỹ)
    const hand = (a, len, wd, col) => { c.strokeStyle = col; c.lineWidth = wd; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - Math.sin(a) * 3, y + Math.cos(a) * 3); c.lineTo(x + Math.sin(a) * len, y - Math.cos(a) * len); c.stroke(); };
    hand((hr % 12) / 12 * Math.PI * 2, r * 0.5, 3, '#241C1C'); hand((hr % 1) * Math.PI * 2, r * 0.78, 2, '#241C1C');
    c.lineCap = 'butt';
  }
  function wardrobe(c, x, y, w, h, on) {
    c.fillStyle = LG(c, x, 0, x + w, 0, [[0, on ? '#4F3C34' : '#3C2D28'], [1, '#2A1E1A']]); c.fillRect(x, y, w, h);
    c.save(); c.globalAlpha = 0.08; c.strokeStyle = '#000'; c.lineWidth = 0.6;
    for (let i = 0; i < 18; i++) { const gx = x + 3 + i * (w - 6) / 18; c.beginPath(); c.moveTo(gx, y + 8); c.bezierCurveTo(gx + 2, y + h * 0.3, gx - 2, y + h * 0.6, gx + 1, y + h - 18); c.stroke(); }
    c.restore();
    c.fillStyle = '#56423A'; c.fillRect(x - 6, y - 9, w + 12, 10); c.fillStyle = 'rgba(255,230,200,.08)'; c.fillRect(x - 6, y - 9, w + 12, 1.2);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + w / 2, y + 4); c.lineTo(x + w / 2, y + h - 18); c.stroke();
    [x + 7, x + w / 2 + 6].forEach((px) => {
      [[y + 12, h * 0.42], [y + h * 0.42 + 22, h * 0.42 - 34]].forEach(([py, ph]) => {
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.4; rr(c, px, py, w / 2 - 13, ph, 2); c.stroke();
        c.strokeStyle = 'rgba(255,230,200,.05)'; c.lineWidth = 1; rr(c, px + 1.5, py + 1.5, w / 2 - 16, ph - 3, 2); c.stroke();
      });
    });
    c.fillStyle = '#A48E72'; rr(c, x + w / 2 - 6, y + h * 0.45, 2.4, 16, 1.2); c.fill(); rr(c, x + w / 2 + 3.6, y + h * 0.45, 2.4, 16, 1.2); c.fill();
    c.fillStyle = '#201713'; c.fillRect(x - 2, y + h - 16, w + 4, 16);
  }
  function door(c, x, y, w, h, cols, handleLeft) {
    c.fillStyle = '#18121A'; c.fillRect(x - 8, y - 8, w + 16, h + 8);
    c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(x - 8, y - 8, w + 16, 1);
    c.fillStyle = LG(c, x, 0, x + w, 0, [[0, cols[0]], [1, cols[1]]]); c.fillRect(x, y, w, h - 3);
    texture(c, x, y, w, h, 0.12);
    [[y + 14, h * 0.36], [y + h * 0.36 + 26, h * 0.5 - 22]].forEach(([py, ph]) => {
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2; rr(c, x + 11, py, w - 22, ph, 2); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; rr(c, x + 13, py + 2, w - 26, ph - 4, 2); c.stroke();
    });
    const hx = handleLeft ? x + 9 : x + w - 9, hy = y + h * 0.53;
    c.fillStyle = '#8E7C68'; rr(c, hx - 2.2, hy - 6, 4.4, 14, 2); c.fill();
    c.fillRect(handleLeft ? hx : hx - 12, hy - 1, 12, 3);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(handleLeft ? hx : hx - 12, hy - 1, 12, 0.8);
    c.fillStyle = '#040306'; c.fillRect(x, y + h - 3, w, 3);
  }
  function floorWood(c, R, base = ['#2C2029', '#110C13']) {
    const yb = Y0 + BH;
    c.fillStyle = LG(c, 0, FLOOR, 0, yb, [[0, base[0]], [1, base[1]]]); c.fillRect(X0, FLOOR, BW, yb - FLOOR);
    let y = FLOOR, k = 0;
    while (y < yb) {
      const hh = 5.5 + k * 2.4;
      c.fillStyle = R() < 0.5 ? 'rgba(255,235,220,' + (0.015 + R() * 0.03) + ')' : 'rgba(0,0,0,' + (0.04 + R() * 0.06) + ')';
      c.fillRect(X0, y, BW, hh);
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(X0, y, BW, 0.8);
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 0.7;
      for (let x = X0 + R() * 140; x < X0 + BW; x += 100 + R() * 170) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + (x - 500) * hh / 700, y + hh); c.stroke(); }
      y += hh; k++;
    }
    texture(c, X0, FLOOR, BW, yb - FLOOR, 0.14);
  }
  function nightstand(c, x, y, w, h, on) {
    c.fillStyle = LG(c, x, 0, x + w, 0, [[0, on ? '#5A4238' : '#45332C'], [1, '#30231E']]); c.fillRect(x, y + 5, w, h - 12);
    c.fillStyle = '#5E463B'; rr(c, x - 3, y, w + 6, 6.5, 2); c.fill();
    c.fillStyle = on ? 'rgba(255,215,160,.22)' : 'rgba(255,255,255,.06)'; c.fillRect(x - 2, y, w + 4, 1);
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.2; rr(c, x + 5, y + 12, w - 10, 20, 2); c.stroke();
    c.fillStyle = '#B49870'; c.beginPath(); c.arc(x + w / 2, y + 22, 2, 0, 7); c.fill();
    c.fillStyle = '#1D1411'; c.fillRect(x + 5, y + 38, w - 10, h - 52);
    c.fillStyle = '#5B3E5A'; c.fillRect(x + 9, y + 44, 5, h - 58); c.fillStyle = '#3E5468'; c.fillRect(x + 15, y + 47, 4, h - 61); c.fillStyle = '#6B5A3E'; c.fillRect(x + 20, y + 46, 6, h - 60);
    c.fillStyle = '#251A16'; c.fillRect(x + 2, y + h - 7, 5, 7); c.fillRect(x + w - 7, y + h - 7, 5, 7);
  }
  function lampA(c, x, yb, on) {
    c.fillStyle = '#2E2420'; c.beginPath(); c.ellipse(x, yb - 1.5, 12, 3, 0, 0, 7); c.fill();
    c.fillStyle = LG(c, x - 8, 0, x + 8, 0, [[0, '#8C7A9A'], [1, '#56496A']]); rr(c, x - 8, yb - 17, 16, 15, 6); c.fill();
    c.fillStyle = '#5A4A40'; c.fillRect(x - 1.2, yb - 40, 2.4, 24);
    c.beginPath(); c.moveTo(x - 14, yb - 66); c.lineTo(x + 14, yb - 66); c.lineTo(x + 25, yb - 36); c.lineTo(x - 25, yb - 36); c.closePath();
    c.fillStyle = on ? LG(c, 0, yb - 66, 0, yb - 36, [[0, '#FFE9C0'], [1, '#F2B262']]) : LG(c, 0, yb - 66, 0, yb - 36, [[0, '#4C403C'], [1, '#342B28']]); c.fill();
    c.strokeStyle = on ? 'rgba(255,240,210,.5)' : 'rgba(0,0,0,.3)'; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = on ? '#FFF6DE' : '#221B19'; c.beginPath(); c.ellipse(x, yb - 36, 25, 2.6, 0, 0, 7); c.fill();
  }
  function glassWater(c, x, y) {
    c.fillStyle = 'rgba(190,210,255,.10)'; c.fillRect(x - 5, y - 18, 10, 18);
    c.fillStyle = 'rgba(170,200,255,.16)'; c.fillRect(x - 5, y - 10, 10, 10);
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 0.7; c.strokeRect(x - 5, y - 18, 10, 18);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - 3.6, y - 16, 1, 13);
  }
  function bedA(c) {
    c.fillStyle = LG(c, 362, 0, 382, 0, [[0, '#4C3631'], [1, '#30221E']]); rr(c, 362, 238, 18, 156, 7); c.fill();
    c.fillStyle = 'rgba(255,220,180,.12)'; c.fillRect(363, 240, 2, 150);
    c.fillStyle = LG(c, 0, 336, 0, 362, [[0, '#46302B'], [1, '#2C1F1B']]); c.fillRect(372, 336, 290, 24);
    c.fillStyle = '#271A16'; c.fillRect(377, 358, 10, 36); c.fillRect(644, 358, 10, 36);
    c.fillStyle = LG(c, 650, 0, 666, 0, [[0, '#46302B'], [1, '#2A1D19']]); rr(c, 650, 294, 15, 100, 6); c.fill();
    c.fillStyle = LG(c, 0, 312, 0, 340, [[0, '#DAD2E8'], [1, '#A499BA']]); rr(c, 378, 312, 274, 28, 7); c.fill();
    c.strokeStyle = 'rgba(80,60,110,.25)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(382, 322); c.lineTo(648, 322); c.stroke();
    // Hai chiếc gối: chiếc phía sau phẳng phiu (không ai nằm), chiếc trước có vết lõm
    pillow(c, 394, 290, 62, 22, ['#EEE9F5', '#C9C0D8'], false);
    pillow(c, 402, 296, 72, 24, ['#F3EEF8', '#CDC4DC'], true);
    // Chăn: phủ nửa giường, rủ xuống mép trước
    c.beginPath(); c.moveTo(468, 318);
    c.bezierCurveTo(500, 304, 540, 313, 570, 308); c.bezierCurveTo(602, 303, 632, 314, 658, 309);
    c.lineTo(662, 347);
    c.bezierCurveTo(640, 359, 612, 350, 590, 361); c.bezierCurveTo(560, 369, 520, 356, 490, 363);
    c.bezierCurveTo(475, 365, 465, 352, 463, 340); c.bezierCurveTo(461, 330, 461, 322, 468, 318); c.closePath();
    c.fillStyle = LG(c, 0, 304, 0, 368, [[0, '#6E5B94'], [0.4, '#55457A'], [1, '#342852']]); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 2.2;
    [[520, 318, 512, 340, 528, 358], [584, 312, 596, 336, 600, 358], [632, 314, 640, 336, 636, 352]].forEach(([a, b, d, e, f, g]) => { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(d, e, f, g); c.stroke(); });
    c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1.6;
    [[526, 318, 518, 340, 534, 358], [590, 312, 602, 336, 606, 358]].forEach(([a, b, d, e, f, g]) => { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(d, e, f, g); c.stroke(); });
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.beginPath(); c.moveTo(470, 317); c.bezierCurveTo(500, 304, 540, 313, 570, 308); c.bezierCurveTo(602, 303, 632, 314, 656, 309); c.stroke();
  }
  // Ô cửa sổ in xuống sàn và mép giường dưới ánh trăng
  function moonPatch(c, a) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(160,180,255,' + a + ')';
    const q = (x0, y0, x1, y1) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1 + 26, y1); c.lineTo(x0 + 26, y1); c.closePath(); c.fill(); };
    q(300, 404, 352, 420); q(357, 404, 409, 420); q(304, 424, 356, 444); q(361, 424, 413, 444);
    c.restore();
  }
  function bgA(c, v) {
    const on = v === 'on' || v === 'toi' || v === 'khuya', day = v === 'sang', R = rand(7);
    c.fillStyle = day ? LG(c, 0, Y0, 0, FLOOR, [[0, '#4A3E58'], [0.55, '#5E5070'], [1, '#6A5C7A']]) : LG(c, 0, Y0, 0, FLOOR, [[0, '#110E18'], [0.55, '#1E1A2B'], [1, '#292337']]); c.fillRect(X0, Y0, BW, FLOOR - Y0);
    c.save(); c.globalAlpha = 0.06; c.fillStyle = '#D9C8F0';
    for (let x = X0; x < X0 + BW; x += 24) c.fillRect(x, Y0, 1, FLOOR - Y0);
    for (let x = X0 + 12, j = 0; x < X0 + BW; x += 24, j++) for (let y = Y0 + 8 + (j % 2) * 13; y < FLOOR - 10; y += 26) { c.beginPath(); c.arc(x, y, 1.3, 0, 7); c.fill(); }
    c.restore();
    texture(c, X0, Y0, BW, FLOOR - Y0, 0.12);
    windowHN(c, 128, 64, 158, 172, day);
    curtains(c, 128, 64, 158, 172);
    clockFace(c, 520, 110, 30, day ? 8.5 : v === 'toi' ? 21 + 40 / 60 : v === 'khuya' ? 23 + 50 / 60 : 4.5);
    wardrobe(c, 682, 100, 104, 272, on);
    door(c, 806, 148, 82, 224, ['#3D2F37', '#2B2027'], true);
    baseboard(c, '#16111A');
    floorWood(c, R, day ? ['#4E3A3C', '#2A1E22'] : undefined);
    shade(c, 515, 396, 185, 12, 0.6); shade(c, 734, 376, 70, 7, 0.55); shade(c, 324, 396, 48, 6, 0.55);
    nightstand(c, 288, 318, 72, 76, on);
    lampA(c, 312, 318, on);
    glassWater(c, 345, 318);
    bedA(c);
    if (day) {
      // Nắng 8 giờ rưỡi: sáng cả phòng, một luồng nắng xiên qua cửa sổ đổ lên giường, in ô cửa xuống chăn và sàn
      c.save(); c.globalCompositeOperation = 'screen'; fillAll(c, 'rgba(255,236,214,.16)'); c.restore();
      glow(c, 207, 150, 260, [255, 240, 210], 0.22);
      shaft(c, [[136, 72], [282, 72], [640, 452], [420, 452]], [255, 226, 168], 0.13);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,228,170,.16)';
      [[470, 318, 46, 12], [522, 318, 46, 12], [478, 334, 46, 14], [530, 334, 46, 14], [560, 404, 54, 14], [618, 404, 54, 14], [570, 422, 56, 18], [630, 422, 56, 18]].forEach(([qx, qy, qw, qh]) => { c.beginPath(); c.moveTo(qx, qy); c.lineTo(qx + qw, qy); c.lineTo(qx + qw + 10, qy + qh); c.lineTo(qx + 10, qy + qh); c.closePath(); c.fill(); });
      c.restore();
      fillAll(c, LG(c, 300, 0, 1100, 0, [[0, 'rgba(20,10,20,0)'], [1, 'rgba(20,10,20,.32)']]));
    } else if (on) {
      glow(c, 312, 284, 460, [255, 176, 92], 0.28);
      glow(c, 312, 290, 150, [255, 206, 140], 0.22);
      glow(c, 312, 324, 90, [255, 200, 130], 0.25, 0.25);
      c.fillStyle = LG(c, 330, 0, 1000, 0, [[0, 'rgba(6,5,12,0)'], [0.5, 'rgba(6,5,12,.3)'], [1, 'rgba(6,5,12,.62)']]); c.fillRect(X0, Y0, BW, BH);
      shaft(c, [[128, 236], [286, 236], [420, 450], [290, 450]], [150, 170, 255], 0.035);
      moonPatch(c, 0.03);
    } else {
      fillAll(c, 'rgba(4,5,14,.72)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(40,52,100,.2)'; c.fillRect(128, 64, 158, 172); c.restore();
      glow(c, 128 + 158 * 0.72, 64 + 172 * 0.2, 40, [220, 225, 255], 0.22);
      shaft(c, [[128, 236], [286, 236], [470, 452], [330, 452]], [150, 170, 255], 0.045);
      moonPatch(c, 0.06);
    }
  }
  function dynA(c, t, st) {
    // Kim giây nhảy từng tiếng tích
    const s = Math.floor(st.sec || 0), a = (s % 60) / 60 * Math.PI * 2;
    c.strokeStyle = st.lamp ? '#9A2E2E' : '#4A1E1E'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(520 - Math.sin(a) * 6, 110 + Math.cos(a) * 6); c.lineTo(520 + Math.sin(a) * 25, 110 - Math.cos(a) * 25); c.stroke();
    c.fillStyle = '#2A1F1F'; c.beginPath(); c.arc(520, 110, 2.2, 0, 7); c.fill();
    if (!st.lamp && !st.day) { c.fillStyle = 'rgba(4,5,14,.62)'; c.beginPath(); c.arc(520, 110, 27, 0, 7); c.fill(); }
    // Bụi bay trong ánh đèn / trong nắng
    if (st.day) motes(c, t, 420, 260, 150, [255, 236, 200], 22, 13);
    else if (st.lamp) motes(c, t, 312, 250, 120, [255, 214, 160], 14, 7);
    else motes(c, t, 360, 330, 90, [170, 190, 255], 8, 9);
  }

  // ======================= B · Phòng em =======================
  function windowB(c, x, y, w, h, day, night) {
    const R = rand(12);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = night ? LG(c, 0, y, 0, y + h, [[0, '#03050C'], [1, '#121830']]) : day ? LG(c, 0, y, 0, y + h, [[0, '#86BDEB'], [1, '#D6EAF6']]) : LG(c, 0, y, 0, y + h, [[0, '#17305A'], [0.5, '#3E6C93'], [0.85, '#9AAAB6'], [1, '#D8B49A']]); c.fillRect(x, y, w, h);
    if (day) { glow(c, x + w * 0.5, y, 120, [255, 252, 235], 0.45); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(x + w * 0.3, y + h * 0.25, 22, 6, 0, 0, 7); c.fill(); }
    else { c.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < (night ? 9 : 1); k++) { c.beginPath(); c.arc(x + w * (0.22 + k * 0.083), y + h * (0.2 + (k % 3) * 0.12), 0.9, 0, 7); c.fill(); } }
    c.fillStyle = night ? '#05080E' : day ? '#3F5E3C' : '#13212D';
    for (let xx = x - 10; xx < x + w + 10; xx += 9 + R() * 12) { c.beginPath(); c.arc(xx, y + h - 6 - R() * 16, 7 + R() * 12, 0, 7); c.fill(); }
    c.fillRect(x, y + h - 10, w, 10);
    c.fillStyle = day ? '#B9B1A2' : '#1A2832'; c.beginPath(); c.moveTo(x + w * 0.62, y + h); c.lineTo(x + w * 0.62, y + h - 26); c.lineTo(x + w * 0.9, y + h - 34); c.lineTo(x + w * 0.9, y + h); c.fill();
    c.restore();
    c.strokeStyle = '#DFE1D7'; c.lineWidth = 7; c.strokeRect(x - 3.5, y - 3.5, w + 7, h + 7);
    c.fillStyle = '#DFE1D7'; c.fillRect(x + w / 3 - 2, y, 4, h); c.fillRect(x + 2 * w / 3 - 2, y, 4, h);
    c.fillStyle = 'rgba(214,218,208,.85)';
    for (let i = 1; i < 6; i++) if (i % 2) c.fillRect(x + i * w / 6 - 0.9, y, 1.8, h);
    c.fillRect(x, y + h * 0.48 - 1.2, w, 2.4);
    c.fillStyle = LG(c, 0, y + h + 3, 0, y + h + 12, [[0, '#E6E7DE'], [1, '#A9ADA2']]); c.fillRect(x - 10, y + h + 3, w + 20, 8);
    shade(c, x + w / 2, y + h + 16, w * 0.6, 5, 0.25);
  }
  function tubeLamp(c, x, y, w, lit) {
    c.fillStyle = '#D2D3CB'; rr(c, x - 7, y, w + 14, 9, 3); c.fill();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x - 6, y + 6, w + 12, 3);
    c.fillStyle = lit ? '#FBFEFF' : '#A5ADB0'; rr(c, x, y + 8.5, w, 6, 3); c.fill();
    c.fillStyle = '#8A8E8C'; c.fillRect(x - 3, y + 8, 5, 7); c.fillRect(x + w - 2, y + 8, 5, 7);
  }
  function doorB(c, x, y, w, h) {
    c.fillStyle = '#3A5143'; c.fillRect(x - 8, y - 8, w + 16, h + 8);
    c.fillStyle = LG(c, x, 0, x + w, 0, [[0, '#62806A'], [1, '#4A6652']]); c.fillRect(x, y, w, h - 3);
    texture(c, x, y, w, h, 0.16);
    const ly = y + 14, lh = h * 0.42;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 10, ly, w - 20, lh);
    for (let yy = ly + 3; yy < ly + lh - 2; yy += 7) {
      c.fillStyle = '#5C7964'; c.fillRect(x + 10, yy, w - 20, 4.4);
      c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(x + 10, yy, w - 20, 0.8);
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + 10, yy + 4.4, w - 20, 1.2);
    }
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.6; rr(c, x + 10, ly + lh + 14, w - 20, h - lh - 44, 2); c.stroke();
    const hx = x + w - 10, hy = y + h * 0.56;
    c.fillStyle = '#9C9A8E'; rr(c, hx - 2, hy - 6, 4, 14, 2); c.fill(); c.fillRect(hx - 12, hy - 1, 12, 3);
    c.fillStyle = '#7C7A70'; c.fillRect(hx - 4, hy + 16, 8, 4);
    c.fillStyle = '#050705'; c.fillRect(x, y + h - 3, w, 3);
  }
  function floorTile(c, R, base) {
    const yb = Y0 + BH, vpY = FLOOR - 760;
    c.fillStyle = LG(c, 0, FLOOR, 0, yb, base); c.fillRect(X0, FLOOR, BW, yb - FLOOR);
    let y = FLOOR, k = 0; const rows = [];
    while (y < yb) { rows.push(y); y += 9 + k * 4.5; k++; }
    rows.forEach((ry, i) => {
      const nh = (rows[i + 1] || yb) - ry;
      for (let j = -24; j < 24; j++) {
        if (R() < 0.5) continue;
        const xb0 = 500 + j * 56, f = (ry - vpY) / (yb - vpY), x0 = 500 + (xb0 - 500) * f;
        c.fillStyle = R() < 0.5 ? 'rgba(255,255,255,' + R() * 0.035 + ')' : 'rgba(0,0,0,' + R() * 0.05 + ')';
        c.fillRect(x0, ry, 56 * f + 1, nh);
      }
      c.fillStyle = 'rgba(30,28,24,.4)'; c.fillRect(X0, ry, BW, 0.9);
    });
    c.strokeStyle = 'rgba(30,28,24,.35)'; c.lineWidth = 0.9;
    for (let j = -24; j < 25; j++) { const xb = 500 + j * 56; const xt = 500 + (xb - 500) * (FLOOR - vpY) / (yb - vpY); c.beginPath(); c.moveTo(xt, FLOOR); c.lineTo(xb, yb); c.stroke(); }
    texture(c, X0, FLOOR, BW, yb - FLOOR, 0.12);
  }
  // Giường sắt, cọc màn, màn buộc gọn. kind: 'mine' (của em) hoặc 'other' (giường bên cạnh, giống hệt)
  function ironBed(c, x0, kind) {
    const iron = (px, top, bot, wd) => {
      c.fillStyle = LG(c, px - wd / 2, 0, px + wd / 2, 0, [[0, '#5B8E99'], [0.4, '#3E6E79'], [1, '#274B53']]); c.fillRect(px - wd / 2, top, wd, bot - top);
      c.fillStyle = '#3E6E79'; c.beginPath(); c.arc(px, top, wd * 0.75, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(px - 1, top - 1, wd * 0.3, 0, 7); c.fill();
    };
    // cọc màn và dây màn
    c.fillStyle = '#5D7880'; c.fillRect(x0 + 1, 146, 2.4, 126); c.fillRect(x0 + 285, 146, 2.4, 156);
    c.strokeStyle = 'rgba(235,236,230,.55)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 + 2, 148); c.lineTo(x0 + 286, 148); c.stroke();
    // màn đã vén, buộc gọn trên dây
    c.fillStyle = 'rgba(242,244,238,.62)'; c.beginPath(); c.moveTo(x0 + 6, 148);
    for (let i = 0; i <= 8; i++) c.quadraticCurveTo(x0 + 6 + (i + 0.5) * 34.5, 166 + (i % 2) * 3, x0 + 6 + (i + 1) * 34.5 - (i === 8 ? 34.5 - 4 : 0), 150);
    c.lineTo(x0 + 6, 148); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; [x0 + 40, x0 + 145, x0 + 250].forEach((tx) => { c.fillRect(tx - 1, 147, 2.4, 14); });
    c.fillStyle = 'rgba(242,244,238,.35)'; c.beginPath(); c.moveTo(x0 + 3, 150); c.quadraticCurveTo(x0 - 4, 200, x0 + 3, 250); c.lineTo(x0 + 7, 250); c.quadraticCurveTo(x0 + 2, 200, x0 + 8, 152); c.fill();
    iron(x0 + 2, 266, 394, 6); iron(x0 + 286, 298, 394, 6);
    // đệm, chiếu
    c.fillStyle = LG(c, 0, 322, 0, 338, [[0, '#506F95'], [1, '#36506F']]); rr(c, x0 + 6, 322, 278, 15, 4); c.fill();
    c.fillStyle = '#CDBA8C'; rr(c, x0 + 6, 317.5, 278, 6, 3); c.fill();
    c.strokeStyle = 'rgba(120,95,50,.3)'; c.lineWidth = 0.5; for (let xx = x0 + 10; xx < x0 + 282; xx += 3) { c.beginPath(); c.moveTo(xx, 318); c.lineTo(xx, 323); c.stroke(); }
    // thanh giường
    c.fillStyle = LG(c, 0, 334, 0, 340, [[0, '#5B8E99'], [1, '#274B53']]); c.fillRect(x0 + 2, 334, 285, 5.5);
    c.fillStyle = LG(c, 0, 377, 0, 382, [[0, '#4C7C87'], [1, '#22424A']]); c.fillRect(x0 + 2, 377, 285, 4.5);
    pillow(c, x0 + 14, 300, 62, 19, kind === 'mine' ? ['#F6E3EA', '#D8BFC8'] : ['#EAE8E2', '#C8C6BF'], false);
    if (kind === 'other') {
      c.fillStyle = LG(c, 0, 296, 0, 320, [[0, '#7A8B74'], [1, '#55654F']]); rr(c, x0 + 204, 297, 72, 22, 3); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1; [303, 309, 314].forEach((ly) => { c.beginPath(); c.moveTo(x0 + 206, ly); c.lineTo(x0 + 274, ly); c.stroke(); });
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x0 + 206, 297, 68, 1.2);
      c.fillStyle = '#C9C6BC'; c.fillRect(x0 + 160, 392, 13, 3); c.fillRect(x0 + 176, 392, 13, 3);
    } else {
      c.fillStyle = LG(c, x0 + 250, 0, x0 + 272, 0, [[0, '#EBA2B4'], [1, '#C97E92']]); c.fillRect(x0 + 252, 333, 20, 36);
      c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(x0 + 252, 360, 20, 2); c.fillRect(x0 + 252, 364, 20, 1);
      c.fillStyle = '#D9A2B2'; c.beginPath(); c.ellipse(x0 + 118, 392, 8, 2.4, 0, 0, 7); c.ellipse(x0 + 136, 393, 8, 2.4, 0, 0, 7); c.fill();
    }
  }
  function cabinet(c, x, y, w, h) {
    c.fillStyle = LG(c, x, 0, x + w, 0, [[0, '#7E8E86'], [1, '#5A6A62']]); c.fillRect(x, y, w, h - 4);
    c.fillStyle = '#909E96'; rr(c, x - 2, y - 3, w + 4, 5, 1); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.2; rr(c, x + 5, y + 8, w - 10, 18, 2); c.stroke();
    c.fillStyle = '#C4CBC6'; c.fillRect(x + w / 2 - 7, y + 15, 14, 2.4);
    rr(c, x + 5, y + 32, w - 10, h - 42, 2); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.3)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + 14, y + 42 + i * 4); c.lineTo(x + w - 14, y + 42 + i * 4); c.stroke(); }
    c.fillStyle = '#2A302D'; c.beginPath(); c.arc(x + w - 13, y + 62, 1.5, 0, 7); c.fill();
    c.fillStyle = '#3C4642'; c.fillRect(x + 3, y + h - 4, 5, 4); c.fillRect(x + w - 8, y + h - 4, 5, 4);
    // cốc, bàn chải, tuýp kem
    c.fillStyle = LG(c, x + 9, 0, x + 23, 0, [[0, '#F0ECE2'], [1, '#C9C4B8']]); rr(c, x + 9, y - 20, 14, 17, 2); c.fill();
    c.strokeStyle = '#CFCABF'; c.lineWidth = 1.6; c.beginPath(); c.arc(x + 24, y - 12, 3.5, -1.3, 1.3); c.stroke();
    c.strokeStyle = '#F29BB4'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x + 17, y - 18); c.lineTo(x + 21, y - 34); c.stroke();
    c.fillStyle = '#FFFFFF'; c.fillRect(x + 19.5, y - 37, 3, 4);
    c.fillStyle = '#ECECEA'; rr(c, x + 30, y - 9, 24, 6, 3); c.fill(); c.fillStyle = '#4A7BC4'; c.fillRect(x + 52, y - 8.5, 4, 5);
  }
  // Lớp sáng cho phòng trong nhà (doanh trại, phòng học): góc trần và chân tường tối lại, hai mép phòng khuất,
  // đèn tuýp hắt một vùng sáng xuống tường và phản chiếu mờ trên sàn gạch, cửa sổ ban ngày in một mảng sáng xuống sàn.
  // Vẽ một lần vào ảnh nền, không tốn gì mỗi khung hình.
  function interiorLight(c, o) {
    fillAll(c, LG(c, 0, Y0, 0, 96, [[0, 'rgba(14,18,16,.5)'], [1, 'rgba(14,18,16,0)']]));
    fillAll(c, LG(c, 0, FLOOR - 30, 0, FLOOR, [[0, 'rgba(10,14,12,0)'], [1, 'rgba(10,14,12,.26)']]));
    c.fillStyle = LG(c, 0, FLOOR, 0, FLOOR + 34, [[0, 'rgba(0,0,0,.3)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(X0, FLOOR, BW, 34);
    fillAll(c, LG(c, -120, 0, 150, 0, [[0, 'rgba(8,12,10,.42)'], [1, 'rgba(8,12,10,0)']]));
    fillAll(c, LG(c, 850, 0, 1120, 0, [[0, 'rgba(8,12,10,0)'], [1, 'rgba(8,12,10,.42)']]));
    for (const [x, y, w] of o.tubes || []) {
      const cx = x + w / 2;
      glow(c, cx, y + 18, 330, [236, 243, 250], 0.1, 0.62);
      glow(c, cx, y + 14, 70, [255, 255, 255], 0.28, 0.32);
      shaft(c, [[x + 8, y + 16], [x + w - 8, y + 16], [x + w + 70, FLOOR], [x - 70, FLOOR]], [236, 243, 250], 0.035);
      // phản chiếu trên sàn gạch bóng
      glow(c, cx, FLOOR + 46, 64, [236, 243, 250], 0.11, 2.1);
      glow(c, cx, FLOOR + 20, 28, [255, 255, 255], 0.14, 0.6);
    }
    if (o.win && o.day) {
      const [x, y, w, h] = o.win;
      glow(c, x + w / 2, FLOOR + 70, w * 0.75, [255, 246, 222], 0.09, 0.28);
      for (let i = 0; i < 7; i++) { c.fillStyle = 'rgba(90,80,60,' + (0.025 + (i % 3) * 0.012) + ')'; c.fillRect(x + 8 + i * (w - 16) / 6, y + h + 12, 1.4, 34 + (i * 13) % 40); }
    }
  }
  function bgB(c, v) {
    const lit = v === 'tube', day = v === 'trua', night = v === 'dem', R = rand(19);
    c.fillStyle = LG(c, 0, Y0, 0, 244, [[0, '#B7BCB0'], [1, '#CDD0C4']]); c.fillRect(X0, Y0, BW, 244 - Y0);
    c.fillStyle = LG(c, 0, 244, 0, FLOOR, [[0, '#5B7962'], [1, '#475F4E']]); c.fillRect(X0, 244, BW, FLOOR - 244);
    c.fillStyle = '#3D5644'; c.fillRect(X0, 241, BW, 4);
    texture(c, X0, Y0, BW, FLOOR - Y0, 0.16);
    for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(95,88,70,' + (0.025 + R() * 0.03) + ')'; c.beginPath(); c.ellipse(X0 + R() * BW, 60 + R() * 150, 20 + R() * 50, 6 + R() * 20, 0, 0, 7); c.fill(); }
    windowB(c, 410, 58, 184, 80, day, night);
    tubeLamp(c, 652, 66, 118, lit);
    doorB(c, 108, 148, 88, 224);
    baseboard(c, '#33463A');
    floorTile(c, R, [[0, '#8C8B83'], [1, '#55544E']]);
    shade(c, 450, 397, 168, 10, 0.5); shade(c, 850, 397, 168, 10, 0.5); shade(c, 258, 395, 42, 5, 0.5);
    ironBed(c, 700, 'other');
    cabinet(c, 226, 300, 64, 94);
    ironBed(c, 300, 'mine');
    if (lit || day) interiorLight(c, { tubes: lit ? [[652, 66, 118]] : [], win: [410, 58, 184, 80], day });
    if (day) {
      // Nắng trưa: sáng dịu, trắng ấm; một luồng nắng gần như dựng đứng qua ô cửa cao
      glow(c, 502, 100, 320, [255, 248, 228], 0.16);
      shaft(c, [[412, 138], [592, 138], [660, 452], [470, 452]], [255, 240, 200], 0.12);
      glow(c, 565, 420, 120, [255, 240, 200], 0.10, 0.2);
      const fall = c.createRadialGradient(502, 120, 180, 502, 120, 860);
      fall.addColorStop(0, 'rgba(10,14,10,0)'); fall.addColorStop(1, 'rgba(10,14,10,.4)');
      fillAll(c, fall);
    } else if (night) {
      // Sau giờ tắt đèn: tối hẳn, chỉ còn chút ánh trời đêm qua ô cửa cao
      fillAll(c, 'rgba(4,7,18,.84)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(40,50,90,.25)'; c.fillRect(410, 58, 184, 80); c.restore();
      shaft(c, [[410, 138], [594, 138], [740, 452], [540, 452]], [120, 140, 210], 0.05);
    } else if (!lit) {
      fillAll(c, 'rgba(8,16,36,.76)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(70,110,160,.4)'; c.fillRect(410, 58, 184, 80); c.restore();
      shaft(c, [[410, 138], [594, 138], [770, 452], [550, 452]], [140, 180, 235], 0.10);
      glow(c, 502, 98, 140, [150, 190, 240], 0.12);
    } else {
      glow(c, 711, 76, 600, [225, 240, 255], 0.12, 0.7);
      glow(c, 711, 74, 120, [240, 250, 255], 0.34, 0.4);
      glow(c, 640, 392, 240, [230, 240, 255], 0.07, 0.08);
      const fall = c.createRadialGradient(660, 80, 140, 660, 80, 820);
      fall.addColorStop(0, 'rgba(4,12,20,0)'); fall.addColorStop(0.6, 'rgba(4,12,20,.22)'); fall.addColorStop(1, 'rgba(4,12,20,.5)');
      fillAll(c, fall);
      fillAll(c, LG(c, 0, FLOOR, 0, Y0 + BH, [[0, 'rgba(0,8,16,0)'], [1, 'rgba(0,8,16,.3)']]));
    }
  }
  function dynB(c, t, st) {
    if (st.day) motes(c, t, 540, 300, 110, [255, 244, 215], 18, 17);
    else if (!st.tube) motes(c, t, 600, 260, 120, [170, 200, 240], 12, 11);
  }

  // ======================= H · Hành lang đêm =======================
  function column(c, x, w) {
    c.fillStyle = LG(c, x, 0, x + w, 0, [[0, '#2B2D36'], [0.35, '#3A3D48'], [1, '#1E2027']]); c.fillRect(x, 46, w, FLOOR - 46);
    texture(c, x, 46, w, FLOOR - 46, 0.18);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + w - 3, 46, 3, FLOOR - 46);
  }
  function bgH(c) {
    const R = rand(31);
    c.fillStyle = LG(c, 0, Y0, 0, 340, [[0, '#020309'], [0.5, '#070A18'], [1, '#141A34']]); c.fillRect(X0, Y0, BW, FLOOR - Y0 + 10);
    for (let i = 0; i < 90; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.15 + R() * 0.55) + ')'; c.beginPath(); c.arc(X0 + R() * BW, Y0 + R() * (290 - Y0), 0.3 + R() * 0.8, 0, 7); c.fill(); }
    glow(c, 1060, 330, 300, [255, 150, 90], 0.09, 0.3);
    c.fillStyle = '#0A0D1B';
    for (let xx = 830; xx < 1200; xx += 20 + R() * 30) { const hh = 18 + R() * 46; c.fillRect(xx, 336 - hh, 26 + R() * 22, hh); if (R() < 0.3) { c.fillStyle = 'rgba(255,200,120,.6)'; c.fillRect(xx + 6, 336 - hh + 8, 2.4, 3); c.fillStyle = '#0A0D1B'; } }
    // cột cờ xa, cờ rủ
    c.fillStyle = '#1A1D2A'; c.fillRect(760, 118, 2.2, 218); c.beginPath(); c.arc(761, 117, 2.4, 0, 7); c.fill();
    c.fillStyle = '#1C1218'; c.beginPath(); c.moveTo(762.5, 124); c.quadraticCurveTo(772, 130, 768, 150); c.quadraticCurveTo(766, 160, 762.5, 162); c.closePath(); c.fill();
    // cột đèn sân
    c.fillStyle = '#121520'; c.fillRect(904, 214, 3, 122); c.fillRect(898, 210, 15, 5);
    glow(c, 905, 216, 90, [255, 168, 88], 0.28); glow(c, 905, 216, 18, [255, 215, 160], 0.6);
    shaft(c, [[898, 216], [913, 216], [960, 336], [850, 336]], [255, 168, 88], 0.06);
    // cây
    c.fillStyle = '#03050C';
    for (let xx = 280; xx < 1220; xx += 14 + R() * 18) { if (xx > 880 && xx < 930) continue; c.beginPath(); c.arc(xx, 280 + R() * 30, 12 + R() * 22, 0, 7); c.fill(); }
    c.fillRect(260, 300, 980, 40);
    c.fillStyle = '#05060C'; c.fillRect(X0, 330, BW, 46);
    // trần, tường trái
    c.fillStyle = LG(c, 0, Y0, 0, 46, [[0, '#0A0B11'], [1, '#191B23']]); c.fillRect(X0, Y0, BW, 46 - Y0);
    c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(X0, 45, BW, 1);
    c.fillStyle = LG(c, X0, 0, 300, 0, [[0, '#1B1D24'], [1, '#292B34']]); c.fillRect(X0, 46, 300 - X0, FLOOR - 46);
    c.fillStyle = '#20232A'; c.fillRect(X0, 250, 300 - X0, FLOOR - 250);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X0, 248, 300 - X0, 2);
    texture(c, X0, 46, 300 - X0, FLOOR - 46, 0.16);
    // cửa phòng (mọi người đã ngủ: không có ánh đèn dưới khe)
    door(c, 112, 150, 86, 222, ['#33443B', '#25332C'], false);
    c.fillStyle = 'rgba(200,195,180,.35)'; rr(c, 141, 130, 28, 11, 2); c.fill();
    c.fillStyle = 'rgba(40,40,40,.6)'; c.fillRect(147, 134, 7, 3); c.fillRect(157, 134, 6, 3);
    // bảng tin
    c.fillStyle = '#3A3026'; c.fillRect(216, 168, 72, 60); c.fillStyle = '#4C3F30'; c.fillRect(219, 171, 66, 54);
    [[224, 176, 20, 26, -0.05], [248, 174, 16, 20, 0.06], [266, 180, 15, 22, -0.03], [232, 204, 26, 16, 0.04]].forEach(([px, py, pw, ph, a]) => { c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = 'rgba(225,220,205,.45)'; c.fillRect(0, 0, pw, ph); c.fillStyle = 'rgba(60,60,60,.3)'; for (let l = 3; l < ph - 2; l += 3) c.fillRect(2, l, pw - 4, 0.8); c.restore(); });
    column(c, 300, 28); column(c, 712, 28); column(c, 1124, 28);
    // lan can
    c.fillStyle = LG(c, 0, 288, 0, 302, [[0, '#4C4F5A'], [1, '#2E3039']]); c.fillRect(328, 288, 1400, 13);
    c.fillStyle = 'rgba(255,255,255,.09)'; c.fillRect(328, 288, 1400, 1);
    c.fillStyle = '#14161D';
    for (let x = 336; x < 1300; x += 17) { if ((x > 704 && x < 744) || (x > 1116 && x < 1156)) continue; c.fillRect(x, 301, 5, 67); }
    c.fillStyle = '#20222A'; c.fillRect(328, 364, 1400, 8);
    baseboard(c, '#1A1C22');
    floorTile(c, R, [[0, '#2A2C34'], [1, '#0E0F13']]);
    // bóng song lan can đổ xuống sàn (trời sáng hơn phía ngoài)
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(80,100,160,.05)';
    for (let x = 344; x < 1300; x += 17) { c.beginPath(); c.moveTo(x, FLOOR); c.lineTo(x + 12, FLOOR); c.lineTo(x - 2, 452); c.lineTo(x - 14, 452); c.fill(); }
    c.restore();
    fillAll(c, 'rgba(2,3,10,.28)');
  }
  function dynH(c, t, st) {
    // vài ngôi sao nhấp nháy, đom đóm dưới sân
    for (let i = 0; i < 12; i++) { const a = 0.25 + 0.35 * Math.sin(t * (0.6 + i * 0.13) + i * 2.1); if (a < 0.05) continue; c.fillStyle = 'rgba(255,255,255,' + a + ')'; c.beginPath(); c.arc(360 + ((i * 197) % 820), -40 + ((i * 89) % 230), 0.9, 0, 7); c.fill(); }
    for (let i = 0; i < 4; i++) {
      const x = 420 + i * 190 + Math.sin(t * 0.3 + i) * 40, y = 318 + Math.sin(t * 0.5 + i * 1.7) * 10, a = 0.35 + 0.35 * Math.sin(t * 1.3 + i * 2);
      glow(c, x, y, 7, [200, 255, 140], Math.max(0, a) * 0.5);
    }
    const fl = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 3.1);
    glow(c, 905, 216, 26, [255, 200, 130], 0.12 * fl);
  }

  // Tủ áo mở (k 0..1): nửa trái còn áo của anh, nửa phải trống, một chiếc móc không đung đưa. t0: lúc mở (móc đung đưa mạnh rồi lặng dần)
  // Móc ấy màu hồng (màu của em trong cả chương): nhìn là biết móc của em, không phải móc anh vừa lấy áo.
  function shirt(c, x, y, col) {
    c.strokeStyle = '#9A8C78'; c.lineWidth = 1; c.beginPath(); c.arc(x, y + 2, 2.4, Math.PI, Math.PI * 2.2); c.stroke();
    c.beginPath(); c.moveTo(x - 10, y + 10); c.lineTo(x, y + 5); c.lineTo(x + 10, y + 10); c.stroke();
    c.fillStyle = LG(c, x - 11, 0, x + 11, 0, [[0, col], [0.6, col], [1, 'rgba(0,0,0,.6)']]);
    c.beginPath(); c.moveTo(x - 11, y + 10); c.lineTo(x - 4, y + 8); c.quadraticCurveTo(x, y + 12, x + 4, y + 8); c.lineTo(x + 11, y + 10);
    c.lineTo(x + 13, y + 30); c.lineTo(x + 10, y + 31); c.lineTo(x + 9, y + 74); c.lineTo(x - 9, y + 74); c.lineTo(x - 10, y + 31); c.lineTo(x - 13, y + 30); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x, y + 74); c.stroke();
  }
  function wardrobeOpen(c, t, k, t0) {
    if (k <= 0) return;
    const x = 682, y = 100, w = 104, h = 272, ix = x + 4, iw = w - 8, iy = y + 5, ih = h - 24;
    c.fillStyle = LG(c, 0, iy, 0, iy + ih, [[0, '#0F0A09'], [1, '#22170F']]); c.fillRect(ix, iy, iw, ih);
    c.fillStyle = '#8E7E68'; c.fillRect(ix + 3, iy + 16, iw - 6, 2.2);
    shirt(c, ix + 13, iy + 18, '#2F3C5E'); shirt(c, ix + 27, iy + 18, '#5C5C66'); shirt(c, ix + 40, iy + 18, '#4A3D6A');
    // nửa phải: một móc áo không, màu hồng, đung đưa
    const age = Math.max(0, t - t0), sw = Math.sin(age * 2.4) * 0.22 * Math.exp(-age * 0.35) + Math.sin(t * 0.8) * 0.025;
    c.save(); c.translate(ix + 72, iy + 18); c.rotate(sw);
    c.strokeStyle = '#F096B6'; c.lineWidth = 1.3; c.beginPath(); c.arc(0, 2, 2.4, Math.PI, Math.PI * 2.2); c.stroke();
    c.beginPath(); c.moveTo(-12, 12); c.lineTo(0, 5); c.lineTo(12, 12); c.lineTo(-12, 12); c.stroke();
    c.restore();
    c.fillStyle = '#3A2A22'; c.fillRect(ix, iy + ih - 58, iw, 3);
    c.fillStyle = '#34405E'; c.fillRect(ix + 6, iy + ih - 70, 34, 6); c.fillStyle = '#6A6A72'; c.fillRect(ix + 8, iy + ih - 76, 30, 6);
    shade(c, ix + iw / 2, iy + 8, iw * 0.7, 14, 0.5);
    // cánh tủ: phần còn che (thu dần) và cánh đã mở ra hai bên
    const cover = (w / 2) * (1 - k), sw2 = (w / 2) * 0.32 * k;
    c.fillStyle = LG(c, x, 0, x + w, 0, [[0, '#4F3C34'], [1, '#2A1E1A']]);
    if (cover > 0.5) { c.fillRect(x, y, cover, h - 16); c.fillRect(x + w - cover, y, cover, h - 16); }
    c.fillStyle = '#3E2E28';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - sw2, y + 8); c.lineTo(x - sw2, y + h - 22); c.lineTo(x, y + h - 16); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w + sw2, y + 8); c.lineTo(x + w + sw2, y + h - 22); c.lineTo(x + w, y + h - 16); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.stroke();
  }
  // Chùm chìa khoá treo ở tay nắm cửa phòng anh
  function keys(c, t) {
    const x = 824, y = 270, sw = Math.sin(t * 1.3) * 0.05;
    c.save(); c.translate(x, y); c.rotate(sw);
    c.strokeStyle = '#C8CCD2'; c.lineWidth = 1.1; c.beginPath(); c.arc(0, 5, 3.4, 0, 7); c.stroke();
    c.fillStyle = '#C9A65A'; c.save(); c.translate(-1.5, 8); c.rotate(0.18); rr(c, -1.2, 0, 2.4, 12, 1); c.fill(); c.beginPath(); c.arc(0, 0, 2.6, 0, 7); c.fill(); c.fillRect(1.2, 8, 2, 1.5); c.restore();
    c.fillStyle = '#B7BCC4'; c.save(); c.translate(2, 8); c.rotate(-0.25); rr(c, -1.1, 0, 2.2, 11, 1); c.fill(); c.beginPath(); c.arc(0, 0, 2.4, 0, 7); c.fill(); c.restore();
    c.fillStyle = '#F29BB4'; c.beginPath(); c.arc(4.5, 15, 2.2, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(3.9, 14.3, 0.7, 0, 7); c.fill();
    c.restore();
  }
  // ======================= P · Phố Hà Nội (ngoài cửa nhà anh) =======================
  // Mặt tiền nhà ống, cửa cuốn, biển hiệu không đọc được chữ, cột điện dây chằng chịt, gốc cây, ghế nhựa đỏ, xe máy dựng trên vỉa hè.
  // Lối sang nhà em: con ngõ tối bên phải (sợi chỉ chui vào miệng ngõ). variant: chieu (5 giờ chiều, nắng xiên) / toi (8 giờ tối)
  function bike(c, x, night) {
    const y = 404;
    shade(c, x + 64, y + 15, 80, 6, 0.55);
    const wheel = (wx) => {
      c.fillStyle = '#121216'; c.beginPath(); c.arc(wx, y, 17, 0, 7); c.fill();
      c.fillStyle = '#6E7076'; c.beginPath(); c.arc(wx, y, 10, 0, 7); c.fill();
      c.fillStyle = '#2A2B30'; c.beginPath(); c.arc(wx, y, 7, 0, 7); c.fill();
      c.strokeStyle = '#9A9CA2'; c.lineWidth = 0.8; for (let i = 0; i < 5; i++) { const a = i * 1.257; c.beginPath(); c.moveTo(wx, y); c.lineTo(wx + Math.cos(a) * 9, y + Math.sin(a) * 9); c.stroke(); }
    };
    wheel(x + 16); wheel(x + 116);
    c.fillStyle = '#2B2D33'; c.fillRect(x + 20, y - 26, 92, 8);
    c.fillStyle = LG(c, 0, y - 64, 0, y - 20, [[0, '#7A2E36'], [1, '#4E1C22']]);
    c.beginPath(); c.moveTo(x + 4, y - 22); c.quadraticCurveTo(x + 2, y - 52, x + 22, y - 62); c.lineTo(x + 36, y - 60); c.lineTo(x + 40, y - 30); c.lineTo(x + 30, y - 18); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x + 70, y - 46); c.lineTo(x + 128, y - 50); c.quadraticCurveTo(x + 140, y - 40, x + 134, y - 26); c.lineTo(x + 92, y - 22); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + 72, y - 47, 54, 1.4);
    c.fillStyle = LG(c, 0, y - 60, 0, y - 48, [[0, '#2A2224'], [1, '#141012']]); rr(c, x + 58, y - 60, 74, 12, 5); c.fill();
    c.strokeStyle = '#3A3C42'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 22, y - 62); c.lineTo(x + 14, y - 86); c.stroke();
    c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 4, y - 86); c.lineTo(x + 26, y - 88); c.stroke();
    c.strokeStyle = '#55575E'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 8, y - 87); c.lineTo(x + 4, y - 102); c.stroke();
    c.fillStyle = '#2A2B30'; c.beginPath(); c.ellipse(x + 3, y - 104, 4, 3, -0.3, 0, 7); c.fill();
    c.fillStyle = night ? '#FFF3D0' : '#D9DCE0'; c.beginPath(); c.ellipse(x + 6, y - 58, 4, 5, 0, 0, 7); c.fill();
    c.fillStyle = '#B9BBC0'; c.fillRect(x + 108, y - 30, 30, 3);
  }
  function bgP(c, v) {
    const day = v === 'chieu', R = rand(41);
    c.fillStyle = day ? LG(c, 0, Y0, 0, 40, [[0, '#E8A874'], [1, '#F6D6A6']]) : LG(c, 0, Y0, 0, 40, [[0, '#070A1C'], [1, '#1B2142']]); c.fillRect(X0, Y0, BW, 160);
    const cols = ['#C9A889', '#B4C0A2', '#D9C4A0', '#A8B6C4', '#CDAF9A', '#BDB3C8', '#D2BE8E'];
    let x = X0, i = 0;
    while (x < X0 + BW) {
      let w = 150 + R() * 70;
      if (x < 890 && x + w > 806) { if (x < 806) w = 806 - x; else { x = 890; continue; } }
      const top = -40 - R() * 70, col = cols[i++ % cols.length];
      c.fillStyle = col; c.fillRect(x, top, w, FLOOR - top);
      texture(c, x, top, w, FLOOR - top, 0.18);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + w - 4, top, 4, FLOOR - top);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 2, top - 4, w + 4, 6);
      // tầng trên: cửa sổ, ban công, điều hoà, chậu cây
      for (let fy = top + 22; fy < 150; fy += 74) {
        const wx = x + 18 + R() * (w - 80);
        c.fillStyle = day ? '#5A6878' : (R() < 0.6 ? '#FFC877' : '#1A1E2A'); c.fillRect(wx, fy, 34, 38);
        c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(wx + 16, fy, 2, 38); c.fillRect(wx, fy + 18, 34, 2);
        c.strokeStyle = 'rgba(30,30,30,.7)'; c.lineWidth = 1.2; c.beginPath(); for (let bx = x + 8; bx < x + w - 8; bx += 7) { c.moveTo(bx, fy + 40); c.lineTo(bx, fy + 56); } c.moveTo(x + 6, fy + 40); c.lineTo(x + w - 6, fy + 40); c.stroke();
        if (R() < 0.6) { c.fillStyle = '#E6E8EA'; c.fillRect(x + w - 42, fy + 4, 26, 18); c.fillStyle = 'rgba(0,0,0,.2)'; for (let l = 0; l < 4; l++) c.fillRect(x + w - 40, fy + 7 + l * 4, 22, 1); }
        if (R() < 0.6) { c.fillStyle = '#5E4636'; c.fillRect(x + 12, fy + 30, 12, 10); c.fillStyle = '#4E7A44'; c.beginPath(); c.arc(x + 18, fy + 26, 9, 0, 7); c.fill(); }
      }
      // biển hiệu (chữ nhoè) và cửa cuốn kéo nửa chừng
      const sc = ['#B8322E', '#2E5E9A', '#D6A21E', '#2F7A4E'][Math.floor(R() * 4)];
      c.fillStyle = sc; c.fillRect(x + 6, 176, w - 12, 30);
      c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x + 20, 184, (w - 40) * 0.7, 6); c.fillRect(x + 20, 195, (w - 40) * 0.45, 3);
      const sh = 222 + R() * 60;
      c.fillStyle = day ? '#2A2622' : '#FFD08A'; c.fillRect(x + 10, sh, w - 20, FLOOR - sh);
      if (!day) { c.fillStyle = 'rgba(120,70,30,.35)'; c.fillRect(x + 10, sh + 20, w - 20, FLOOR - sh - 20); }
      c.fillStyle = LG(c, 0, 210, 0, sh, [[0, '#9A9C9E'], [1, '#7C7E80']]); c.fillRect(x + 10, 210, w - 20, sh - 210);
      c.fillStyle = 'rgba(0,0,0,.22)'; for (let yy = 214; yy < sh; yy += 5) c.fillRect(x + 10, yy, w - 20, 1);
      x += w;
    }
    // con ngõ: tối, hun hút, một bóng đèn nhỏ treo sâu bên trong
    c.fillStyle = LG(c, 806, 0, 890, 0, [[0, '#0A0A0E'], [0.5, '#16151C'], [1, '#0A0A0E']]); c.fillRect(806, -200, 84, FLOOR + 200);
    c.fillStyle = 'rgba(255,255,255,.04)'; for (let yy = 260; yy < FLOOR; yy += 14) c.fillRect(818, yy, 60, 1);
    glow(c, 850, 236, 46, [255, 200, 140], day ? 0.12 : 0.3); c.fillStyle = '#FFE2B0'; c.beginPath(); c.arc(850, 236, 2.2, 0, 7); c.fill();
    // vỉa hè, bó vỉa, lòng đường
    c.fillStyle = day ? '#9C8C80' : '#4A4440'; c.fillRect(X0, FLOOR, BW, 48);
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 0.8; for (let yy = FLOOR + 12; yy < FLOOR + 48; yy += 12) { c.beginPath(); c.moveTo(X0, yy); c.lineTo(X0 + BW, yy); c.stroke(); }
    for (let xx = X0; xx < X0 + BW; xx += 24) { c.beginPath(); c.moveTo(xx, FLOOR); c.lineTo(xx + (xx - 500) * 0.06, FLOOR + 48); c.stroke(); }
    c.fillStyle = '#B9B5AE'; c.fillRect(X0, FLOOR + 48, BW, 8); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X0, FLOOR + 56, BW, 2);
    c.fillStyle = LG(c, 0, FLOOR + 58, 0, Y0 + BH, [[0, '#3A3A3E'], [1, '#1E1E22']]); c.fillRect(X0, FLOOR + 58, BW, Y0 + BH - FLOOR - 58);
    texture(c, X0, FLOOR, BW, Y0 + BH - FLOOR, 0.2);
    c.fillStyle = 'rgba(240,240,230,.6)'; for (let xx = X0; xx < X0 + BW; xx += 90) c.fillRect(xx, 500, 46, 4);
    // cây bên trái
    c.fillStyle = LG(c, 110, 0, 132, 0, [[0, '#5A4636'], [1, '#3A2C22']]); c.fillRect(112, 120, 18, FLOOR + 30 - 120);
    c.fillStyle = day ? '#4F7A3E' : '#162418';
    for (let k = 0; k < 16; k++) { c.beginPath(); c.arc(60 + R() * 140, -20 + R() * 150, 22 + R() * 26, 0, 7); c.fill(); }
    // cột điện, dây chằng chịt
    c.fillStyle = LG(c, 300, 0, 316, 0, [[0, '#A8A49C'], [1, '#77746E']]); c.fillRect(300, -120, 14, FLOOR + 44 + 120);
    c.fillStyle = '#5A5A5E'; c.fillRect(290, 48, 34, 26);
    c.strokeStyle = 'rgba(20,20,22,.9)'; c.lineWidth = 0.9;
    for (let k = 0; k < 14; k++) { c.beginPath(); c.moveTo(X0, 20 + R() * 60); c.quadraticCurveTo(150, 60 + R() * 60, 307, 40 + R() * 40); c.quadraticCurveTo(600, 80 + R() * 70, X0 + BW, 10 + R() * 70); c.stroke(); }
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(307 + (R() - 0.5) * 20, 70 + R() * 20, 8 + R() * 8, 0, 7); c.stroke(); }
    // ghế nhựa đỏ
    c.fillStyle = '#C8282E'; rr(c, 700, 380, 28, 5, 2); c.fill(); c.fillRect(702, 384, 4, 22); c.fillRect(722, 384, 4, 22);
    bike(c, 520, !day);
    if (day) {
      // nắng chiều xiên từ trái: ấm, bóng đổ dài sang phải
      c.save(); c.globalCompositeOperation = 'screen'; fillAll(c, 'rgba(255,200,140,.12)'); c.restore();
      glow(c, -60, 120, 700, [255, 190, 120], 0.22);
      shade(c, 190, 424, 120, 7, 0.4); shade(c, 360, 424, 90, 6, 0.35);
      fillAll(c, LG(c, X0, 0, X0 + BW, 0, [[0, 'rgba(40,20,10,0)'], [1, 'rgba(40,20,10,.3)']]));
    } else {
      fillAll(c, 'rgba(6,8,24,.62)');
      c.fillStyle = '#3A3A3E'; c.fillRect(314, 82, 44, 4); c.fillRect(352, 84, 14, 6);
      glow(c, 358, 92, 260, [255, 168, 80], 0.22); glow(c, 358, 92, 24, [255, 220, 160], 0.6);
      shaft(c, [[346, 92], [370, 92], [470, 430], [250, 430]], [255, 168, 80], 0.08);
      for (let k = 0; k < 6; k++) glow(c, X0 + 80 + k * 230, 330, 110, [255, 190, 110], 0.08, 0.5);
    }
  }
  function dynP(c, t, st) {
    if (st.v === 'toi') {
      // xe máy chạy ngang dưới lòng đường: một vệt đèn pha lướt qua
      const k = (t % 9) / 9; if (k < 0.5) { const x = X0 - 100 + k * 2 * (BW + 200); glow(c, x, 470, 120, [255, 236, 190], 0.18, 0.35); glow(c, x - 20, 466, 14, [255, 250, 230], 0.6); glow(c, x - 150, 468, 10, [255, 60, 50], 0.35); }
    } else motes(c, t, 300, 250, 220, [255, 220, 170], 20, 23);
  }

  // ======================= L · Phòng học buổi tối (bên em) =======================
  // Trông như ngồi làm bài ở nhà: bàn dài, vở mở, bút, chai nước. Manh mối: bàn còn chỗ khác có vở, chai nước giống hệt;
  // cạnh cửa có chiếc giỏ đựng nhiều điện thoại. Hai đèn tuýp, cửa sổ đen.
  function desk(c) {
    c.fillStyle = LG(c, 0, 284, 0, 300, [[0, '#B88E62'], [1, '#9C7448']]);
    c.beginPath(); c.moveTo(352, 284); c.lineTo(778, 284); c.lineTo(786, 300); c.lineTo(344, 300); c.closePath(); c.fill();
    c.fillStyle = '#6E4E30'; c.fillRect(344, 300, 442, 9);
    c.fillStyle = 'rgba(255,240,210,.18)'; c.fillRect(344, 300, 442, 1);
    c.fillStyle = '#4E3622'; c.fillRect(352, 309, 7, 85); c.fillRect(771, 309, 7, 85); c.fillRect(560, 309, 6, 85);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(359, 340, 412, 4);
    // ghế đẩy vào gầm bàn
    for (const cx of [430, 620]) { c.fillStyle = '#3E5E7A'; c.fillRect(cx - 18, 340, 36, 5); c.fillRect(cx - 16, 345, 4, 49); c.fillRect(cx + 12, 345, 4, 49); }
    // chỗ bên kia: một quyển vở gấp, chai nước, giống hệt chỗ của em
    c.fillStyle = '#D9D4C6'; c.beginPath(); c.moveTo(650, 288); c.lineTo(704, 288); c.lineTo(706, 295); c.lineTo(648, 295); c.closePath(); c.fill();
    c.fillStyle = '#4A72A8'; c.fillRect(648, 295, 58, 2);
    c.fillStyle = 'rgba(200,225,255,.55)'; rr(c, 724, 262, 10, 26, 3); c.fill(); c.fillStyle = '#3A7ACC'; c.fillRect(725, 258, 8, 5);
    // chai nước của em
    c.fillStyle = 'rgba(200,225,255,.55)'; rr(c, 532, 262, 10, 26, 3); c.fill(); c.fillStyle = '#3A7ACC'; c.fillRect(533, 258, 8, 5);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(534, 266, 1.4, 18);
  }
  function bgL(c) {
    const R = rand(52);
    c.fillStyle = LG(c, 0, Y0, 0, 244, [[0, '#B5BAAE'], [1, '#CBCEC2']]); c.fillRect(X0, Y0, BW, 244 - Y0);
    c.fillStyle = LG(c, 0, 244, 0, FLOOR, [[0, '#5B7962'], [1, '#475F4E']]); c.fillRect(X0, 244, BW, FLOOR - 244);
    c.fillStyle = '#3D5644'; c.fillRect(X0, 241, BW, 4);
    texture(c, X0, Y0, BW, FLOOR - Y0, 0.16);
    // cửa sổ đêm: đen, xa xa một ngọn đèn
    c.save(); c.beginPath(); c.rect(470, 64, 170, 76); c.clip();
    c.fillStyle = LG(c, 0, 64, 0, 140, [[0, '#05070F'], [1, '#121830']]); c.fillRect(470, 64, 170, 76);
    glow(c, 600, 126, 30, [255, 190, 110], 0.4); c.fillStyle = '#0A0D16'; c.fillRect(470, 128, 170, 12);
    c.restore();
    c.strokeStyle = '#DFE1D7'; c.lineWidth = 7; c.strokeRect(466.5, 60.5, 177, 83); c.fillStyle = '#DFE1D7'; c.fillRect(553, 64, 4, 76);
    c.fillStyle = '#E6E7DE'; c.fillRect(456, 147, 198, 7);
    tubeLamp(c, 260, 60, 110, true); tubeLamp(c, 760, 60, 110, true);
    // tờ giấy dán tường cạnh cửa (chữ nhỏ, không đọc được)
    c.save(); c.translate(222, 160); c.rotate(-0.02); c.fillStyle = 'rgba(240,238,228,.9)'; c.fillRect(0, 0, 40, 54); c.fillStyle = 'rgba(60,60,60,.35)'; c.fillRect(8, 6, 24, 3); for (let l = 14; l < 50; l += 4) c.fillRect(5, l, 30 - (l % 8), 1.2); c.restore();
    doorB(c, 108, 148, 88, 224);
    baseboard(c, '#33463A');
    floorTile(c, R, [[0, '#8C8B83'], [1, '#55544E']]);
    // bàn nhỏ cạnh cửa (để giỏ)
    shade(c, 262, 396, 50, 5, 0.5);
    c.fillStyle = '#8A6A48'; c.fillRect(224, 318, 78, 7); c.fillStyle = '#5E4630'; c.fillRect(228, 325, 5, 69); c.fillRect(293, 325, 5, 69);
    shade(c, 565, 398, 240, 10, 0.5);
    desk(c);
    interiorLight(c, { tubes: [[260, 60, 110], [760, 60, 110]] });
    glow(c, 315, 72, 420, [225, 240, 255], 0.11, 0.7); glow(c, 815, 72, 420, [225, 240, 255], 0.11, 0.7);
    glow(c, 315, 72, 90, [240, 250, 255], 0.3, 0.4); glow(c, 815, 72, 90, [240, 250, 255], 0.3, 0.4);
    const fall = c.createRadialGradient(560, 100, 200, 560, 100, 860);
    fall.addColorStop(0, 'rgba(4,12,20,0)'); fall.addColorStop(1, 'rgba(4,12,20,.42)'); fillAll(c, fall);
  }
  // Giỏ nhựa đựng điện thoại. inside: điện thoại của em đang nằm trong giỏ; glow: điện thoại trong giỏ sáng lên (có tin)
  function basket(c, t, inside, gl) {
    const x = 262, y = 318;
    const ph = [[-20, -0.3, '#1A1A22'], [-9, 0.15, '#2A2A34'], [3, -0.1, '#121218'], [13, 0.25, '#30303A'], [22, -0.2, '#1E1E26']];
    ph.forEach(([dx, a, col], i) => { c.save(); c.translate(x + dx, y - 20); c.rotate(a); c.fillStyle = col; rr(c, -5, -14, 10, 18, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(-4, -13, 8, 1); c.restore(); });
    if (inside) { c.save(); c.translate(x - 2, y - 22); c.rotate(0.05); if (gl > 0) glow(c, 0, -6, 30, [255, 170, 200], 0.35 * gl); c.fillStyle = '#0D0D13'; rr(c, -5, -15, 10, 19, 2); c.fill(); if (gl > 0) { c.fillStyle = 'rgba(200,190,255,' + 0.8 * gl + ')'; rr(c, -4, -14, 8, 16, 1.5); c.fill(); } c.restore(); }
    c.fillStyle = LG(c, 0, y - 26, 0, y, [[0, '#4F86C6'], [1, '#2F5E96']]);
    c.beginPath(); c.moveTo(x - 32, y - 26); c.lineTo(x + 32, y - 26); c.lineTo(x + 27, y); c.lineTo(x - 27, y); c.closePath(); c.fill();
    c.fillStyle = 'rgba(10,20,40,.55)'; for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) { c.beginPath(); c.ellipse(x - 24 + k * 6 + r, y - 20 + r * 7, 1.6, 2.2, 0, 0, 7); c.fill(); }
    c.fillStyle = '#6FA2DE'; c.fillRect(x - 33, y - 28, 66, 3);
  }
  // Vở mở trên bàn (nhìn chếch từ trên). flip 0..1: trang đang lật; line 0..1: vệt gạch chân
  function notebook(c, flip, line) {
    const x = 410, y = 287;
    c.fillStyle = '#F4F1E8'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 104, y); c.lineTo(x + 108, y + 11); c.lineTo(x - 4, y + 11); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(80,110,170,.35)'; c.lineWidth = 0.4; for (let l = 1; l < 6; l++) { c.beginPath(); c.moveTo(x - 4 + l * 0.6, y + l * 1.8); c.lineTo(x + 108 - l * 0.6, y + l * 1.8); c.stroke(); }
    c.fillStyle = 'rgba(40,40,60,.55)'; for (let l = 1; l < 6; l++) { c.fillRect(x + 4, y + l * 1.8 - 0.9, 38 + (l * 7) % 11, 0.6); c.fillRect(x + 60, y + l * 1.8 - 0.9, 34 - (l * 5) % 9, 0.6); }
    c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x + 52, y); c.lineTo(x + 52, y + 11); c.stroke();
    if (line > 0) { c.strokeStyle = 'rgba(230,80,110,.85)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x + 61, y + 7.6); c.lineTo(x + 61 + 34 * line, y + 7.6); c.stroke(); }
    if (flip > 0 && flip < 1) {
      const a = flip * Math.PI, hx = x + 52 + Math.cos(a) * 52, hy = y + 5 - Math.sin(a) * 26;
      c.fillStyle = 'rgba(250,248,240,.95)'; c.beginPath(); c.moveTo(x + 52, y); c.quadraticCurveTo((x + 52 + hx) / 2, hy - 6, hx, hy); c.lineTo(hx, hy + 11); c.quadraticCurveTo((x + 52 + hx) / 2, hy + 5, x + 52, y + 11); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.15)'; c.stroke();
    }
    c.fillStyle = '#2A4A8A'; c.save(); c.translate(x + 112, y + 6); c.rotate(-0.25); c.fillRect(0, 0, 22, 1.8); c.fillStyle = '#E6E6E6'; c.fillRect(20, 0, 3, 1.8); c.restore();
  }

  // Bụi bay chậm trong một vùng sáng
  function motes(c, t, cx, cy, r, col, n, seed) {
    const R = rand(seed);
    for (let i = 0; i < n; i++) {
      const ox = (R() - 0.5) * 2 * r, oy = (R() - 0.5) * 1.4 * r, sp = 0.05 + R() * 0.08, ph = R() * 6.28;
      const x = cx + ox + Math.sin(t * sp * 3 + ph) * 12, y = cy + oy + Math.cos(t * sp * 2 + ph) * 9;
      const a = 0.25 + 0.25 * Math.sin(t * (0.5 + R()) + ph);
      if (a > 0.02) { c.fillStyle = rgba(col, a); c.beginPath(); c.arc(x, y, 0.7 + R() * 0.6, 0, 7); c.fill(); }
    }
  }

  // ======================= Đồ dùng chung =======================
  const COL = { q: [190, 160, 255], t: [255, 150, 182] };
  // Điện thoại. ph: { x, y (đáy), ang, mode: 'up' | 'down', glow 0..1, scr: 'chat' | 'call' | 'off', msgs: [{me, col}], me: 'q'|'t', s }
  function drawPhone(c, ph, t) {
    if (ph.hidden) return;
    c.save(); c.translate(ph.x, ph.y); c.rotate(ph.ang || 0); const s = ph.s || 1; c.scale(s, s);
    const gl = ph.glow == null ? 1 : ph.glow;
    if (ph.mode === 'down') {
      glow(c, 0, -1, 26, [170, 190, 255], 0.08 * gl, 0.3);
      c.fillStyle = '#0C0C11'; rr(c, -15, -4.2, 30, 4.4, 1.6); c.fill();
      c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(-14, -4.2, 28, 0.7);
      c.fillStyle = 'rgba(120,120,140,.5)'; c.beginPath(); c.arc(-9, -4.6, 1.5, Math.PI, 0); c.fill();
      c.restore(); return;
    }
    const w = 17, h = 31;
    if (gl > 0.01) {
      glow(c, 0, -h / 2, 80, ph.lightCol || [190, 205, 255], 0.2 * gl);
      glow(c, 0, -h / 2, 26, ph.lightCol || [210, 220, 255], 0.22 * gl);
    }
    if (ph.buzz) c.translate(Math.sin(t * 90) * 0.7, 0);
    c.fillStyle = '#0D0D13'; rr(c, -w / 2, -h, w, h, 3.4); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 0.6; rr(c, -w / 2 + 0.3, -h + 0.3, w - 0.6, h - 0.6, 3.2); c.stroke();
    const sx = -w / 2 + 1.2, sy = -h + 1.2, sw = w - 2.4, sh = h - 2.4;
    if (gl > 0.01) {
      c.globalAlpha = gl;
      c.fillStyle = LG(c, 0, sy, 0, sy + sh, [[0, '#211E36'], [1, '#141225']]); rr(c, sx, sy, sw, sh, 2.6); c.fill();
      c.save(); rr(c, sx, sy, sw, sh, 2.6); c.clip();
      if (ph.num && ph.scr === 'num') {
        c.fillStyle = LG(c, 0, sy, 0, sy + sh, [[0, '#3A2E5A'], [1, '#1A1630']]); c.fillRect(sx, sy, sw, sh);
        c.fillStyle = 'rgba(255,255,255,.92)'; c.font = '600 8.5px Fraunces, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(ph.num, 0, sy + sh * 0.42); c.textAlign = 'start';
        c.fillStyle = 'rgba(255,180,205,.8)'; c.beginPath(); c.arc(0, sy + sh * 0.62, 1.2, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-4, sy + sh * 0.72, 8, 0.8);
      } else if (ph.scr === 'call') {
        c.fillStyle = 'rgba(255,180,205,.55)'; c.beginPath(); c.arc(0, sy + 8, 3.2, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-4, sy + 13, 8, 1.1);
        c.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-4.2 + (i % 3) * 4.2, sy + 18 + Math.floor(i / 3) * 3.6, 1.2, 0, 7); c.fill(); }
        c.fillStyle = '#FF4F5E'; c.beginPath(); c.arc(0, sy + sh - 3.2, 1.7, 0, 7); c.fill();
      } else {
        const msgs = ph.msgs || [];
        let y = sy + sh - 3.2;
        for (let i = msgs.length - 1; i >= 0 && y > sy + 3; i--) {
          const m = msgs[i], bw = sw * (0.38 + ((i * 37) % 5) * 0.08), col = COL[m.col] || COL.q, a = m.a == null ? 1 : m.a;
          const bx = m.me ? sx + sw - 1.4 - bw : sx + 1.4;
          c.fillStyle = rgba(col, 0.28 * a); rr(c, bx - 0.6, y - 2.9, bw + 1.2, 3.6, 1.8); c.fill();
          c.fillStyle = rgba(col, 0.85 * a); rr(c, bx, y - 2.4, bw, 2.4, 1.2); c.fill();
          y -= 3.5;
        }
      }
      c.fillStyle = LG(c, sx, sy, sx + sw, sy + sh, [[0, 'rgba(255,255,255,.08)'], [0.5, 'rgba(255,255,255,0)']]); c.fillRect(sx, sy, sw, sh);
      c.restore(); c.globalAlpha = 1;
    } else {
      c.fillStyle = '#06060A'; rr(c, sx, sy, sw, sh, 2.6); c.fill();
      c.fillStyle = 'rgba(255,255,255,.05)'; c.beginPath(); c.moveTo(sx, sy + sh * 0.6); c.lineTo(sx + sw, sy + sh * 0.2); c.lineTo(sx + sw, sy + sh * 0.35); c.lineTo(sx, sy + sh * 0.75); c.fill();
    }
    c.fillStyle = '#000'; rr(c, -3, sy + 1.1, 6, 1.7, 0.85); c.fill();
    c.restore();
  }
  // Sợi chỉ phát sáng: quầng rộng mờ, lõi mảnh gần trắng. pts: [{x, y}]
  function pathOf(c, P) {
    c.beginPath(); c.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < P.length - 1; i++) c.quadraticCurveTo(P[i].x, P[i].y, (P[i].x + P[i + 1].x) / 2, (P[i].y + P[i + 1].y) / 2);
    c.lineTo(P[P.length - 1].x, P[P.length - 1].y);
  }
  function strokeThread(c, P, col, a = 1, wd = 1) {
    if (!P || P.length < 2 || a <= 0.01) return;
    const C = COL[col] || col;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    pathOf(c, P);
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(C, 0.09 * a); c.lineWidth = 8 * wd; c.stroke();
    c.strokeStyle = rgba(C, 0.26 * a); c.lineWidth = 3 * wd; c.stroke();
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = rgba([Math.min(255, C[0] + 40), Math.min(255, C[1] + 60), Math.min(255, C[2] + 40)], 0.92 * a); c.lineWidth = 1.05 * wd; c.stroke();
    c.restore();
  }
  // Hạt tin nhắn trên sợi chỉ
  function bead(c, x, y, col, a = 1) {
    const C = COL[col] || col;
    glow(c, x, y, 16, C, 0.45 * a); glow(c, x, y, 5, [255, 255, 255], 0.55 * a);
  }
  // Vòng gợi ý: thở nhẹ quanh chỗ cần chạm
  function hintRing(c, x, y, t, a = 1, r = 22) {
    const k = (t * 0.7) % 1;
    c.save(); c.strokeStyle = 'rgba(255,255,255,' + 0.5 * (1 - k) * a + ')'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(x, y, r * (0.6 + k * 0.8), 0, 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,' + 0.5 * a * (0.6 + 0.4 * Math.sin(t * 3)) + ')'; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill();
    c.restore();
  }
  // Búi chỉ nằm trên sàn (chờ càng lâu càng to). frac 0..1 phần còn lại, max: số vòng lúc đầy
  function coil(c, x, y, frac, col, seed, max = 12) {
    if (frac <= 0) return;
    const R = rand(seed), k = Math.ceil(frac * max), pts = [{ x, y }];
    for (let i = 0; i < max; i++) {
      const a = R() * 6.28, r = 6 + R() * 14 + max * 1.1, e = { x: x + Math.cos(a) * r * 1.6, y: y + Math.sin(a) * r * 0.42 - 2 };
      if (i < k) pts.push(e);
    }
    pts.push({ x, y });
    strokeThread(c, pts, col, 0.95, 0.9);
  }

  window.SoiChiVe = { W, H, X0, Y0, BW, BH, FLOOR, COL, rr, LG, RG, glow, rgba, rand,
    rooms: { A: { bg: bgA, dyn: dynA }, B: { bg: bgB, dyn: dynB }, H: { bg: bgH, dyn: dynH }, P: { bg: bgP, dyn: dynP }, L: { bg: bgL, dyn: () => {} } },
    basket, notebook,
    drawPhone, strokeThread, pathOf, bead, hintRing, coil, wardrobeOpen, keys };
})();
