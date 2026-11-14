// ================= BỨC TƯỜNG · đầu cầu thang =================
// 1) Mưa xoá mất 3 bó vạch phấn: tô lại bằng phấn cho đủ 99. 2) Bóc vữa, lộ lịch 100 ô: đặt từng món vào đúng "ngày thứ".
// 3) Đủ thì 99 ô sáng, chỉ ô 100 trống: đặt tay giữ yên lên ô 100, tường ấm dần (không tua nhanh được: phải ở yên đó).
const P4 = { marks: 0, peel: 0, sel: -1, placed: {}, solved: false, lightT: 0, hold: 0, holding: false, done: false, hintKey: '' };
const TOKENS = [ // món đồ → ngày thứ (6/8 = ngày 1)
  { id: 'strip', label: 'dải ảnh', day: 76, draw: (c, s) => STRIP_DRAW(c, s * 0.62) },
  { id: '9/11', label: '9/11', day: 96, draw: (c, s) => drawCassette(c, 0, 0, s * 0.3, '9/11') },
  { id: '10/11', label: '10/11', day: 97, draw: (c, s) => drawCassette(c, 0, 0, s * 0.3, '10/11') },
  { id: '11/11', label: '11/11', day: 98, draw: (c, s) => drawCassette(c, 0, 0, s * 0.3, '11/11') },
];
const trayPos = (i) => [330 + i * 120, 640];
const LIT_T0 = 1.1, LIT_RATE = 22; // nhịp im trước khi sáng; số ô sáng mỗi giây (10 ô một hàng ≈ 0,45 s)
// ô 100: tối giữa 99 ô sáng, viền ấm thở, một vết bàn tay phấn mờ; giữ tay thì vòng sáng chạy quanh và hơi ấm loang ra
function drawCell100(c, now) {
  const o = BT.o[100], x = o.x, y = o.y, h = P4.done ? 1 : P4.hold;
  if (!P4.lit100) { P4.lit100 = true; sayNow('Còn đúng một ô chưa sáng.'); }
  c.save();
  if (h > 0) { // hơi ấm loang ra từ ô 100
    c.globalCompositeOperation = 'lighter';
    const r = 50 + 520 * h, g = c.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, `rgba(255,190,110,${0.5 * h})`); g.addColorStop(1, 'rgba(255,170,90,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over';
    const sw = (o.w - 4) * h, sh = (o.h - 4) * h; // ánh sáng lan từ giữa ô ra mép
    c.fillStyle = `rgba(255,${206 + Math.round(30 * h)},${140 + Math.round(70 * h)},.95)`; c.fillRect(x - sw / 2, y - sh / 2, sw, sh);
  }
  const pulse = 0.45 + 0.35 * Math.sin(now * 0.0035);
  c.strokeStyle = `rgba(255,200,130,${P4.done ? 0.9 : pulse})`; c.lineWidth = 3; c.strokeRect(x - o.w / 2 + 3, y - o.h / 2 + 3, o.w - 6, o.h - 6);
  // vết bàn tay phấn
  c.strokeStyle = `rgba(236,232,222,${0.32 + 0.2 * pulse})`; c.lineWidth = 1.8; c.lineCap = 'round';
  c.beginPath(); c.ellipse(x, y + 7, 9, 10, 0, 0, Math.PI * 2);
  [[-7, -3, 9], [-2.5, -5, 12], [2.5, -5, 11], [7, -3, 8]].forEach(([dx, dy, L]) => { c.moveTo(x + dx, y + dy); c.lineTo(x + dx * 1.15, y + dy - L); });
  c.moveTo(x - 9, y + 6); c.lineTo(x - 16, y - 1); c.stroke();
  if (P4.holding || (h > 0 && !P4.done)) { // vòng giữ tay
    c.strokeStyle = 'rgba(255,214,160,.85)'; c.lineWidth = 4;
    c.beginPath(); c.arc(x, y, Math.max(o.w, o.h) * 0.78, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * h); c.stroke();
  }
  c.restore();
}
function wallHints() {
  let k, L;
  if (P4.marks < 15) { k = 'w0'; L = ['Mưa đã xoá mất mấy bó vạch phấn.', 'Mỗi bó là năm vạch. Tô lại cho đủ.', 'Cầm viên phấn trong túi lên, rồi chạm vào chỗ vạch bị nhoè.']; }
  else if (P4.peel < 1) { k = 'w1'; L = ['Đủ chín mươi chín vạch rồi. Mảng vữa bên cạnh đã nứt.', 'Bóc lớp vữa ra.', 'Vuốt lên mảng vữa bên phải.']; }
  else if (!P4.solved) { k = 'w2'; L = ['Mỗi món em mang theo có một ngày của nó.', 'Ngày thứ 96 là 9/11. Đếm lùi để ra những ngày khác.', 'Dải ảnh Sa Pa ghi 20/10. Mỗi cuộn băng có ngày trên nhãn.']; }
  else if (!P4.done) { k = 'w3'; L = ['Chỉ còn một ô trống.', 'Đặt tay lên ô cuối cùng.', 'Giữ yên tay trên ô 100, đừng buông.']; }
  else return;
  if (P4.hintKey !== k) { P4.hintKey = k; hints(L); }
}
const btDraw = SC.buctuong.draw;
SC.buctuong.enter = function () { wallHints(); nudge(); };
SC.buctuong.tapBelow = true; SC.buctuong.hintY = 792; // khay đồ nằm ngay chỗ dòng gợi ý mặc định: đẩy gợi ý xuống dưới, chạm khay không bị nuốt
SC.buctuong.draw = function (c, now, dt) {
  BT.vua = P4.peel;
  if (P4.holding && P4.solved && !P4.done) { P4.hold = Math.min(1, P4.hold + dt / 5); if (P4.hold >= 1) wallDone(); } else if (!P4.done) P4.hold = Math.max(0, P4.hold - dt / 2.5);
  BT.am = P4.done ? 1 : P4.hold;
  if (wallHum) { wallHum.g.gain.value = 0.05 * P4.hold; wallHum.o.frequency.value = 110 + 55 * P4.hold; }
  btDraw.call(this, c, now, dt);
  // vạch phấn tô lại (3 bó trong vùng bị nhoè)
  const X = BT.xoa; c.strokeStyle = 'rgba(232,230,222,.9)'; c.lineWidth = 3; c.lineCap = 'round';
  for (let m = 0; m < P4.marks; m++) { const b = Math.floor(m / 5), k = m % 5, bx = X.x + 12 + b * (X.w / 3), by = X.y + 6; c.beginPath(); if (k < 4) { c.moveTo(bx + k * 11, by); c.lineTo(bx + k * 11 + 2, by + X.h - 12); } else { c.moveTo(bx - 4, by + X.h - 16); c.lineTo(bx + 42, by + 6); } c.stroke(); }
  if (P4.peel >= 1) {
    // ĐÚNG: một nhịp im, tờ lịch chìm vào tối, rồi từng ô bừng sáng 1 → 99 như có đèn sau giấy; ô 100 tối, chờ tay
    if (P4.solved) {
      P4.lightT += dt;
      const n = Math.max(0, Math.min(99, Math.floor((P4.lightT - LIT_T0) * LIT_RATE) + 1));
      const o1 = BT.o[1], oz = BT.o[100], x0 = o1.x - o1.w / 2, y0 = o1.y - o1.h / 2, cw = oz.x + oz.w / 2 - x0, ch = oz.y + oz.h / 2 - y0;
      c.save();
      c.fillStyle = `rgba(5,8,14,${0.62 * Math.min(1, P4.lightT / LIT_T0)})`; c.fillRect(x0, y0, cw, ch);
      c.font = "22px 'Patrick Hand'"; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 1; i <= n; i++) {
        const o = BT.o[i], age = P4.lightT - LIT_T0 - (i - 1) / LIT_RATE, f = Math.max(0, 1 - age / 0.4); // vừa bật thì loé rồi lắng
        const v = ((i * 37) % 11) / 11 - 0.5, gg = 196 + Math.round(10 * v + 44 * f), bb = 128 + Math.round(12 * v + 96 * f); // giấy mỗi ô ngấm sáng một khác
        const lg = c.createLinearGradient(o.x, o.y - o.h / 2, o.x, o.y + o.h / 2);
        lg.addColorStop(0, `rgba(252,${gg + 8},${bb + 10},.93)`); lg.addColorStop(1, `rgba(236,${gg - 18},${bb - 22},.93)`);
        c.fillStyle = lg; c.fillRect(o.x - o.w / 2 + 2, o.y - o.h / 2 + 2, o.w - 4, o.h - 4);
        if (!TOKENS.some((t) => P4.placed[t.id] === i)) { c.fillStyle = 'rgba(78,40,12,.92)'; c.fillText(String(i), o.x, o.y + 1); }
      }
      // mép tờ lịch tối hơn giữa, như đèn rọi từ phía sau
      const ev = c.createRadialGradient(x0 + cw / 2, y0 + ch / 2, cw * 0.25, x0 + cw / 2, y0 + ch / 2, cw * 0.75);
      ev.addColorStop(0, 'rgba(40,18,4,0)'); ev.addColorStop(1, `rgba(40,18,4,${0.32 * n / 99})`);
      c.fillStyle = ev; c.fillRect(x0, y0, cw, ch);
      // ánh ấm tràn ra tường quanh tờ lịch
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(x0 + cw / 2, y0 + ch / 2, 60, x0 + cw / 2, y0 + ch / 2, cw * 0.95);
      g.addColorStop(0, `rgba(255,170,90,${0.2 * n / 99})`); g.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = g; c.fillRect(x0 - cw * 0.6, y0 - ch * 0.6, cw * 2.2, ch * 2.2);
      c.restore();
      if (n >= 99) drawCell100(c, now);
    }
    // các món đã đặt lên lịch
    for (const t of TOKENS) { const d = P4.placed[t.id]; if (!d) continue; const o = BT.o[d]; c.save(); c.translate(o.x, o.y); t.draw(c, 0.45); c.restore(); }
    // khay đồ: chạm một món rồi chạm vào ô
    if (!P4.solved) TOKENS.forEach((t, i) => { if (P4.placed[t.id] || !wallHas(t.id)) return; const [x, y] = trayPos(i); c.fillStyle = P4.sel === i ? 'rgba(255,214,160,.2)' : 'rgba(236,230,218,.06)'; roundRect(c, x - 52, y - 52, 104, 104, 12); c.fill(); c.save(); c.translate(x, y - 6); t.draw(c, 0.75); c.restore(); text(c, t.label, x, y + 44, 18, 0.55); });
  }
};
const wallHas = (id) => (id === 'strip' ? bagHas('strip') : TAPES.some((t) => t.label === id));
let wallHum = null;
SC.buctuong.down = function (p) {
  if (P4.solved && !P4.done) { const o = BT.o[100]; if (Math.abs(p[0] - o.x) < o.w && Math.abs(p[1] - o.y) < o.h) { P4.holding = true; if (!wallHum) { const o2 = ac.createOscillator(); o2.type = 'sine'; const g = ac.createGain(); g.gain.value = 0; o2.connect(g).connect(master); o2.start(); wallHum = { o: o2, g }; } FX.heart(2); return true; } }
  if (P4.marks >= 15 && P4.peel < 1 && p[0] > 790) { this.py = p[1]; return true; }
  return false;
};
SC.buctuong.move = function (p, b) { if (b && this.py != null && P4.peel < 1) { const d = this.py - p[1]; if (Math.abs(d) > 30) { P4.peel = Math.min(1, P4.peel + 0.18); this.py = p[1]; const t = ac.currentTime; nz(t, 0.25, 'bandpass', 900 + Math.random() * 600, 1.2, 0.35); for (let i = 0; i < 4; i++) nz(t + 0.05 + i * 0.05, 0.02, 'highpass', 3000, 1, 0.15); nudge(); if (P4.peel >= 1) wallHints(); } } };
SC.buctuong.up = function (p, moved) { const was = this.py != null; this.py = null; if (P4.holding) { P4.holding = false; if (!P4.done && !P4.toldHold) { P4.toldHold = true; sayNow('Giữ yên tay. Đừng buông.'); } return true; } return was && moved; };
SC.buctuong.tap = function (p) {
  const X = BT.xoa;
  if (P4.marks < 15) {
    if (p[0] > X.x - 20 && p[0] < X.x + X.w + 20 && p[1] > X.y - 30 && p[1] < X.y + X.h + 30) {
      if (!held('phan')) { MISS.phan = (MISS.phan || 0) + 1; sayNow(MISS.phan < 2 || !bagHas('phan') ? 'Cần thứ gì để viết lên tường.' : 'Chạm vào chiếc máy để mở túi, cầm viên phấn lên.'); return; }
      const t = ac.currentTime; nz(t, 0.18, 'bandpass', 2600 + Math.random() * 900, 2, 0.3); nz(t, 0.12, 'highpass', 5000, 1, 0.08);
      P4.marks = Math.min(15, P4.marks + 1); nudge();
      if (P4.marks === 15) setTimeout(() => { BAG.sel = null; const t2 = ac.currentTime; nz(t2, 0.5, 'lowpass', 300, 1, 0.6); for (let i = 0; i < 6; i++) nz(t2 + 0.1 + i * 0.07, 0.03, 'bandpass', 1500, 2, 0.2); sayNow('Chín mươi chín vạch. Mảng vữa bên cạnh khẽ nứt.'); wallHints(); }, 400);
    }
    return;
  }
  if (P4.peel < 1 || P4.solved) return;
  // chọn món trong khay
  for (let i = 0; i < TOKENS.length; i++) { const t = TOKENS[i]; if (P4.placed[t.id] || !wallHas(t.id)) continue; const [x, y] = trayPos(i); if (Math.abs(p[0] - x) < 55 && Math.abs(p[1] - y) < 55) { P4.sel = P4.sel === i ? -1 : i; FX.tap(); return; } }
  // chạm vào một ô lịch
  for (let d = 1; d <= 100; d++) { const o = BT.o[d]; if (Math.abs(p[0] - o.x) < o.w / 2 && Math.abs(p[1] - o.y) < o.h / 2) {
    const onIt = TOKENS.find((t) => P4.placed[t.id] === d); if (onIt) { delete P4.placed[onIt.id]; FX.pick(); return; } // nhấc lại
    if (P4.sel < 0) return; P4.placed[TOKENS[P4.sel].id] = d; P4.sel = -1; FX.put(); nudge();
    const need = TOKENS.filter((t) => wallHas(t.id));
    if (need.every((t) => P4.placed[t.id])) setTimeout(() => {
      if (need.every((t) => P4.placed[t.id] === t.day)) {
        P4.solved = true; P4.lightT = 0; FX.latch(); const t0 = ac.currentTime + LIT_T0;
        // mỗi ô một tiếng tách khẽ như bật đèn; mỗi hàng một nốt ngũ cung đi lên
        for (let i = 0; i < 99; i++) nz(t0 + i / LIT_RATE, 0.018, 'bandpass', 2400 + i * 18, 3, 0.05, -0.4 + (i % 10) * 0.09);
        const PEN = [196, 220, 246.94, 293.66, 329.63, 392, 440, 493.88, 587.33, 659.25];
        PEN.forEach((f, r) => tone(t0 + r * (10 / LIT_RATE), f, f, 0.018, 1.6, 'sine'));
        wallHints();
      }
      else { FX.jam(); P4.placed = {}; missHint('wall', ['Chưa đúng. Mỗi món ứng với đúng một ngày bên nhau.', 'Đêm 9/11 là ngày thứ 96. Ngày 10/11 là ngày thứ 97.', 'Dải ảnh ghi 20/10. Đếm lùi từ 9/11, nhớ tháng Mười có 31 ngày.', 'Từ 20/10 đến 9/11 là 20 ngày.'], 1); }
    }, 500);
    return; } }
};
function wallDone() {
  P4.done = true; P4.holding = false; const t = ac.currentTime;
  if (stairG) ramp(stairG.gain, 0, 3); // gió tắt
  if (wallHum) { ramp(wallHum.g.gain, 0, 4); setTimeout(() => wallHum.o.stop(), 4200); }
  tone(t, 196, 196, 0.05, 4, 'sine'); tone(t + 0.4, 293.66, 293.66, 0.035, 4, 'sine');
  setTimeout(() => { if (typeof manhAdd === 'function') manhAdd(1); sayNow('Từ khe tường, một mảnh giấy gấp rơi xuống tay em.'); }, 1800);
  setTimeout(() => endWall(), 5200);
}
function endWall() { go('end4', 1600); }
SC.end4 = { draw(c) { c.fillStyle = '#000'; c.fillRect(-300, -300, W + 600, H + 600); text(c, '(qua bức tường · đình làng đang làm)', W / 2, H / 2, 28, 0.5); } };

// nối từ phòng 3: lên đầu cầu thang
endRoom3 = function () { const t = ac.currentTime; for (let i = 0; i < 5; i++) nz(t + 0.2 + i * 0.45, 0.05, 'bandpass', 380, 2, 0.5, i % 2 ? 0.15 : -0.15); P3.on = false; if (stairG) ramp(stairG.gain, 0.35, 2); go('buctuong', 1400); };

// thử nhanh: ?phong=4 (bức tường, đủ đồ)
if (new URLSearchParams(location.search).get('phong') === '4') {
  const st0 = START;
  START = () => { st0(); INTRO.t = 9; setTimeout(() => { Object.assign(P1, { torch: true, calm: true, calmT: 9, done: true }); bagAdd('may', '', null); bagAdd('strip', 'dải ảnh', STRIP_DRAW); bagAdd('phan', 'phấn', (c, s) => { c.save(); c.scale(s * 2, s * 2); c.fillStyle = '#ece9e0'; c.fillRect(-30, -8, 26, 12); c.fillRect(4, 0, 22, 10); c.restore(); }); tapeAdd('9/11', 'am/giong1.mp3', SUB1); tapeAdd('10/11', 'am/giong2.mp3', SUB2); tapeAdd('11/11', 'am/bang3.mp3', SUB3, true); if (typeof manhAdd === 'function') { P3.manh = true; manhAdd(0); } stairG = ac.createGain(); stairG.gain.value = 0.3; stairG.connect(master); go('buctuong', 600); }, 300); };
}
