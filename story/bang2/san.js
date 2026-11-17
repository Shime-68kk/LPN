'use strict';
// SÂN ĐÌNH · không gian chung sau khi đã xem hết phim (anh Quang 17/11: như căn phòng ngủ ở Băng 1, quay lại thì nơi ấy vẫn ở đó).
// Ở đây: máy cát-sét trên bàn đá phát lại cuộn băng (Kết 1) · mảnh nhựa cam rơi "tách" trong sân, nhặt rồi theo lối về nhà trọ
// (phòng 502, Kết 2) · dấu sao góc trên: chọn xem lại, chơi lại. Tiến trình không bao giờ mất.
// Vào bằng ?phong=13 (chon.js tự chuyển tới đây khi máy đã xem hết phim). Phim hết cũng về đây (rot.js).
(() => {
  const doc = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const Q = new URLSearchParams(location.search);
  if (Q.get('trailer') === '1') return;
  const MI4 = '218,158,58', MI4_RIM = '246,198,108';
  const PIECE = { x: 905, y: 792 }, MAY = { x: 1190, y: 694 }, SAO = { x: 1482, y: 142 }, LOI = { x: 1395, y: 470 };
  const R_MAY = { x: MAY.x - 105, y: MAY.y - 80, w: 210, h: 150 }, R_SAO = { x: SAO.x - 62, y: SAO.y - 60, w: 124, h: 120 };
  const R_LOI = { x: 1250, y: 350, w: 330, h: 250 }, R_PIECE = { x: PIECE.x - 150, y: PIECE.y - 110, w: 300, h: 190 };
  const L1 = 'Cái gì vừa rơi vậy?', L2 = 'Một mảnh nhựa nhỏ. Hình như ai đó để quên.', CPS = 22;
  const daNhat = () => {
    try { const m = JSON.parse(doc('lpn:bang2manh') || '[]'); if (Array.isArray(m) && m.includes('Mi4')) return true; } catch (e) { /* bỏ qua */ }
    try { const k = JSON.parse(doc('lpn:ket2') || 'null'); if (k && Array.isArray(k.manh) && k.manh.length) return true; } catch (e) { /* bỏ qua */ }
    return false;
  };
  const ST = { t0: 0, picked: false, pickAt: 0, dropAt: 0, clink: false, di: 0, amb: null };

  function tach() { // tiếng mảnh nhựa rơi xuống nền gạch, nảy hai lần
    if (typeof ac === 'undefined' || !ac || !master) return;
    const t = ac.currentTime;
    [[0, 1, 3200, 0.25], [0.09, 0.42, 3450, 0.2], [0.16, 0.19, 3650, 0.3]].forEach((h, i) => {
      nz(t + h[0], 0.025, 'bandpass', h[2], 2.5, 1.1 * h[1], h[3]);
      nz(t + h[0], 0.018, 'bandpass', 560, 1.4, 0.22 * h[1], h[3]);
      tone(t + h[0], 1480 + i * 160, 920 + i * 100, 0.048 * h[1], 0.018, 'triangle');
    });
  }
  function de() { // dế đêm, thưa
    if (typeof ac === 'undefined' || !ac || !master || ST.amb) return;
    const g = ac.createGain(); g.gain.value = 0; g.connect(master); ST.amb = { g, alive: true };
    try { g.gain.linearRampToValueAtTime(1, ac.currentTime + 3); } catch (e) { g.gain.value = 1; }
    const keu = () => {
      const a = ST.amb; if (!a || !a.alive) return;
      if (V.cur === 'san') { const t = ac.currentTime, n = 3 + Math.floor(Math.random() * 3), f = 4200 + Math.random() * 600, pan = Math.random() * 1.6 - 0.8; for (let i = 0; i < n; i++) nz(t + i * 0.055, 0.03, 'bandpass', f, 18, 0.024, pan, 0, a.g); }
      setTimeout(keu, 1500 + Math.random() * 4200);
    };
    setTimeout(keu, 900);
  }
  function tatDe() { const a = ST.amb; if (!a) return; a.alive = false; ST.amb = null; try { a.g.gain.linearRampToValueAtTime(0, ac.currentTime + 1.2); } catch (e) { /* bỏ qua */ } }

  function veManh(c, x, y, sc, rot, a) { // mảnh phím cam
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.globalAlpha *= a;
    const g = c.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, `rgb(${MI4_RIM})`); g.addColorStop(0.5, `rgb(${MI4})`); g.addColorStop(1, 'rgb(150,100,30)');
    c.fillStyle = g; roundRect(c, -46, -13, 92, 26, 6); c.fill();
    c.fillStyle = 'rgba(255,240,200,.45)'; roundRect(c, -40, -10, 80, 5, 2.5); c.fill();
    c.restore();
  }
  function veManhTui(c, s) { veManh(c, 0, 0, (s || 1) * 1.25, -0.2, 1); }
  function veMay(c, x, y, now, sang) { // máy cát-sét cầm tay đặt trên bàn đá, cuộn băng số 2 nằm trong
    c.save(); c.translate(x, y);
    const gl = c.createRadialGradient(0, 6, 4, 0, 6, 120); gl.addColorStop(0, `rgba(255,206,140,${0.30 * sang})`); gl.addColorStop(1, 'rgba(255,190,120,0)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(-130, -110, 260, 230); c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(2, 30, 62, 8, 0, 0, 7); c.fill();
    const b = c.createLinearGradient(0, -26, 0, 28); b.addColorStop(0, '#5d6670'); b.addColorStop(1, '#2f353c');
    c.fillStyle = b; roundRect(c, -56, -26, 112, 54, 9); c.fill();
    c.strokeStyle = 'rgba(210,220,230,.35)'; c.lineWidth = 1.5; roundRect(c, -56, -26, 112, 54, 9); c.stroke();
    c.fillStyle = '#14181c'; roundRect(c, -40, -17, 80, 30, 5); c.fill(); // ô nhìn băng
    c.fillStyle = 'rgba(236,224,196,.92)'; roundRect(c, -34, -13, 68, 9, 2); c.fill(); // nhãn băng
    for (const sx of [-18, 18]) { c.save(); c.translate(sx, 4); c.rotate(now * 0.0006 * (sx < 0 ? 1 : 1)); c.strokeStyle = 'rgba(230,230,230,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 7, 0, 7); c.stroke(); for (let i = 0; i < 3; i++) { c.rotate(2.094); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -7); c.stroke(); } c.restore(); }
    for (let i = 0; i < 4; i++) { c.fillStyle = i === 1 ? 'rgba(255,170,90,.95)' : 'rgba(190,198,206,.8)'; roundRect(c, -44 + i * 14, 18, 10, 6, 2); c.fill(); }
    c.strokeStyle = 'rgba(30,30,34,.9)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(54, 8); c.bezierCurveTo(88, 12, 96, 40, 122, 30); c.stroke(); // dây tai nghe
    c.restore();
  }
  function veSao(c, x, y, now) { // dấu sao vẽ tay
    const a = 0.5 + 0.14 * Math.sin(now * 0.002);
    c.save(); c.translate(x, y); c.rotate(-0.12); c.strokeStyle = `rgba(255,226,170,${a})`; c.fillStyle = `rgba(255,214,150,${a * 0.16})`; c.lineWidth = 2.6; c.lineJoin = 'round';
    c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 11 : 26 + (i === 4 ? 2 : 0), ang = -Math.PI / 2 + i * Math.PI / 5; const px = Math.cos(ang) * r, py = Math.sin(ang) * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  function veNhan(c, s, x, y, a, muiTen) { // nhãn chữ tay, có thể kèm mũi tên sang phải
    if (a <= 0.01) return;
    text(c, s, x, y, 30, a, 'center', '255,236,206');
    if (muiTen) { c.save(); c.strokeStyle = `rgba(255,226,180,${a})`; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; const w = 46, x0 = x - w / 2, y0 = y + 26; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x, y0 + 5, x0 + w, y0 - 1); c.moveTo(x0 + w - 13, y0 - 10); c.lineTo(x0 + w + 2, y0 - 1); c.lineTo(x0 + w - 11, y0 + 10); c.stroke(); c.restore(); }
  }
  function veDong(c, s, n, y, a) { // dòng chữ gõ dần
    if (n <= 0 || a <= 0) return;
    c.save(); c.font = `34px ${HAND}`; const w = c.measureText(s).width; c.textAlign = 'left'; c.fillStyle = `rgba(0,0,0,${0.5 * a})`; c.fillText(s.slice(0, n), W / 2 - w / 2 + 1, y + 2);
    c.fillStyle = `rgba(236,230,218,${0.94 * a})`; c.fillText(s.slice(0, n), W / 2 - w / 2, y); c.restore();
  }

  SC.san = {
    tapBelow: true,
    enter() {
      ST.t0 = performance.now(); ST.picked = daNhat(); ST.pickAt = 0; ST.clink = false; ST.di = 0; ST.dropAt = 0;
      Object.assign(KT, { den: 100, cam: 1, bong: 0, dom: 1, sang: 1 });
      POCKET.may = false; POCKET.on = true; POCKET.msg = null; // máy cát-sét đang nằm trên bàn đá, túi chỉ còn là túi vải
      if (ST.picked && !BAG.items.some((i) => i.id === 'manh_Mi4')) { try { bagAdd('manh_Mi4', 'mảnh nhựa màu cam', veManhTui); } catch (e) { /* bỏ qua */ } }
      try { if (SC.ketdinh && SC.ketdinh.enter) SC.ketdinh.enter(); } catch (e) { /* bỏ qua */ }
      HINT.off = true; HINT.text = '';
      de();
    },
    draw(c, now, dt) {
      const s = (now - ST.t0) / 1000, ba = c.globalAlpha;
      Object.assign(KT, { den: 100, cam: 1, bong: 0, dom: 1, sang: 1 });
      c.save(); try { SC.ketdinh.draw(c, now, dt); } catch (e) { /* bỏ qua */ } c.restore(); setT(c); c.globalAlpha = ba;
      veMay(c, MAY.x, MAY.y, now, 0.75 + 0.25 * Math.sin(now * 0.0018));
      veNhan(c, 'phát lại cuộn băng', MAY.x, MAY.y - 58, clamp((s - 1.2) / 1.2, 0, 1) * (0.5 + 0.16 * Math.sin(now * 0.0026)), false);
      veSao(c, SAO.x, SAO.y, now);
      // mảnh nhựa cam: 2.6 giây sau khi vào thì rơi "tách" xuống sân
      if (!ST.picked) {
        if (s >= 2.6 && !ST.clink) { ST.clink = true; ST.dropAt = now; tach(); }
        if (ST.clink) {
          const e = (now - ST.dropAt) / 1000, roi = clamp(e / 0.16, 0, 1), nay = e < 0.16 ? 0 : Math.abs(Math.sin((e - 0.16) * 13)) * 16 * Math.exp(-(e - 0.16) * 7);
          const y = PIECE.y - (1 - roi * roi) * 240 - nay, pu = 0.6 + 0.4 * Math.sin(now * 0.004);
          c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(PIECE.x, PIECE.y, 4, PIECE.x, PIECE.y, 150); g.addColorStop(0, `rgba(252,208,118,${0.34 * pu * clamp(e / 0.6, 0, 1)})`); g.addColorStop(1, 'rgba(252,208,118,0)'); c.fillStyle = g; c.fillRect(PIECE.x - 160, PIECE.y - 160, 320, 320); c.restore();
          veManh(c, PIECE.x, y, 1, -0.14 + (1 - roi) * 1.4, 1);
          const n1 = e >= 1.4 ? clamp(Math.floor((e - 1.4) * CPS) + 1, 0, L1.length) : 0; veDong(c, L1, n1, 150, 1);
          if (e > 1.4 + L1.length / CPS + 0.6) text(c, 'chạm để nhặt', PIECE.x, PIECE.y + 64, 28, 0.32 + 0.3 * (0.5 + 0.5 * Math.sin(now * 0.0032)));
        }
      } else if (ST.pickAt) {
        const e = (now - ST.pickAt) / 1000, out = 1 - clamp((e - 6.5) / 1.2, 0, 1);
        veDong(c, L2, clamp(Math.floor((e - 0.3) * CPS) + 1, 0, L2.length), 150, out);
      }
      // lối về nhà trọ: có mảnh rồi mới hiện
      if (ST.picked) { const e = ST.pickAt ? (now - ST.pickAt) / 1000 - 2.6 : s - 1.2; veNhan(c, 'về phía nhà trọ', LOI.x, LOI.y, clamp(e / 1.2, 0, 1) * (0.62 + 0.2 * Math.sin(now * 0.003)), true); }
      if (ST.di) { const k = clamp((now - ST.di) / 900, 0, 1); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(0,0,0,${k})`; c.fillRect(0, 0, cv.width, cv.height); c.restore(); setT(c); }
    },
    tap(p) {
      if (ST.di) return;
      const now = performance.now();
      if (inR(p, R_SAO)) { if (window.LPN_CHON) window.LPN_CHON(); return; }
      if (!ST.picked && ST.clink && now - ST.dropAt > 1200 && inR(p, R_PIECE)) {
        ST.picked = true; ST.pickAt = now;
        try { bagAdd('manh_Mi4', 'mảnh nhựa màu cam', veManhTui); } catch (e) { /* bỏ qua */ }
        try { const a = JSON.parse(doc('lpn:bang2manh') || '[]'); const arr = Array.isArray(a) ? a : []; if (!arr.includes('Mi4')) arr.push('Mi4'); localStorage.setItem('lpn:bang2manh', JSON.stringify(arr)); } catch (e) { /* bỏ qua */ }
        try { tone(ac.currentTime, 880, 1320, 0.03, 0.5); } catch (e) { /* bỏ qua */ }
        return;
      }
      if (inR(p, R_MAY)) { ST.di = now; tatDe(); setTimeout(() => { location.replace('?phong=7&tu=1'); }, 700); return; } // Kết 1: bức thư rồi phim
      if (ST.picked && inR(p, R_LOI)) {
        ST.di = now; tatDe();
        setTimeout(() => { ST.di = 0; if (window.KET2 && KET2.vao) KET2.vao(); else location.replace('?phong=12&tu=1'); }, 950);
      }
    },
  };

  // Mở thẳng sân đình bằng ?phong=13
  if (Q.get('phong') === '13') {
    const st0 = START;
    START = () => {
      st0(); INTRO.t = 9;
      setTimeout(() => {
        if (typeof P1 !== 'undefined') Object.assign(P1, { torch: true, calm: true, calmT: 99, done: true });
        if (typeof quietPast === 'function') quietPast(0.2);
        go('san', 500);
      }, 300);
    };
  }
  window.LPN_SAN = { ve: () => { tatDe(); go('san', 1100); } };
})();
