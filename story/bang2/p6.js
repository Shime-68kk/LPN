// ================= CỬA KHU TRỌ · câu đố cuối (nửa bên em, nửa bên anh) =================
// Vân tay không nhận tay em. Ghép 4 mảnh bản đồ vào khung (2 mảnh nhặt phía em, 2 mảnh phía anh): đường chấm chấm đi liền
// từ giường em tới ô cửa sổ sáng. Cạnh ngôi đình trên bản đồ có ô "Anh vẫn ___": điền chữ ghép từ mặt sau 4 mảnh
// (xáo thứ tự; thứ tự đúng chỉ có khi nhớ câu anh nói trong băng 11/11). Đúng: bản đồ bừng sáng, khoá từ xanh, cửa mở.
const P6 = { placed: [false, false, false, false], sel: -1, pick: false, word: [], solved: false, sang: 0, hintKey: '', nen: null, vtN: 0 };
const WORD = ['Ở', 'Đ', 'Â', 'Y'];
const ctrK = () => CTR.khung, ctrTray = (i) => [300 + i * 178, 738]; // khay: trên nền đất dưới cửa kính, tránh khung và chiếc máy
function cuaHints() {
  let k, L;
  if (P6.placed.some((v) => !v)) { k = 'c0'; L = ['Cửa khoá từ. Máy vân tay không nhận tay em.', 'Khung gỗ bên cạnh đang thiếu một tấm bản đồ.', 'Chạm một mảnh giấy dưới khay rồi chạm vào đúng chỗ của nó trong khung.']; }
  else if (!P6.solved) { k = 'c1'; L = ['Cạnh ngôi đình trên bản đồ có một chỗ còn trống.', 'Mặt sau mỗi mảnh giấy có một chữ. Mở túi, lật từng mảnh mà xem.', 'Câu này anh đã nói trong cuộn băng 11/11.']; }
  else return;
  if (P6.hintKey !== k) { P6.hintKey = k; hints(L); }
}
function cuaNen(gain, lp, sec) { // giai điệu nền chỉ trở lại khi tấm bản đồ đã liền
  if (!P6.nen) { const g = ac.createGain(); g.gain.value = 0; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; f.connect(g).connect(master); P6.nen = { g, f }; buf('am/nen.mp3').then((b) => { const s = ac.createBufferSource(); s.buffer = b; s.loop = true; s.connect(f); s.start(); P6.nen.s = s; }); }
  ramp(P6.nen.g.gain, gain, sec); rampF(P6.nen.f.frequency, lp, sec);
}
const cuaDraw = SC.cuatro.draw;
SC.cuatro.noBag = false;
SC.cuatro.tapBelow = true; SC.cuatro.hintY = 640;
SC.cuatro.enter = function () {
  if (typeof quietPast === 'function') quietPast(1.5); [0, 1].forEach((i) => { if (!P5.manh[i]) manhAdd(i); }); // hai mảnh phía em không quay lại lấy được: có sẵn trong túi
  cuaHints(); nudge(); HINT.off = false;
  // đêm ngoài ngõ: không có lớp ù; vài tiếng rời: xe máy xa, chó sủa xa, quạt cục nóng nhà ai
  if (!this.amb) { this.amb = true; const ev = () => { if (V.cur !== 'cuatro' && V.cur !== 'tui' && V.cur !== 'manh') { this.amb = false; return; } const t = ac.currentTime, r = Math.random(); if (r < 0.4) nz(t, 2.4, 'bandpass', 320 + Math.random() * 120, 1.2, 0.08, Math.random() - 0.5); else if (r < 0.55) { for (let i = 0; i < 2; i++) nz(t + i * 0.32, 0.12, 'bandpass', 700, 3, 0.05, 0.7); } setTimeout(ev, 6000 + Math.random() * 9000); }; setTimeout(ev, 1500); }
};
SC.cuatro.draw = function (c, now, dt) {
  SC.cuatro.back = !P6.solved && !(P5.manh[2] && P5.manh[3]) ? 'benphai' : null; // lưới an toàn: thiếu mảnh ở đình thì cho quay lại đình
  cuaDraw.call(this, c, now, dt);
  if (P6.solved) P6.sang = Math.min(1, P6.sang + dt / 3.5);
  CTR.vantay = Math.max(0, (CTR.vantay || 0) - dt * 1.5);
  const K = ctrK();
  if (typeof BD !== 'undefined' && BD.draw) BD.draw(c, K.x, K.y, K.w, K.h, { co: P6.placed, sang: P6.solved ? P6.sang : P6.placed.every(Boolean) ? 0.12 : 0, chu: P6.solved ? 'Ở ĐÂY' : P6.word.join(''), lat: 0 });
  // khay: mảnh chưa đặt
  for (let i = 0; i < 4; i++) { if (P6.placed[i] || !P5.manh[i]) continue; const [x, y] = ctrTray(i), up = P6.sel === i ? -16 : 0; if (P6.sel === i) { const g = c.createRadialGradient(x, y + up, 10, x, y + up, 110); g.addColorStop(0, 'rgba(255,214,160,.22)'); g.addColorStop(1, 'rgba(255,214,160,0)'); c.fillStyle = g; c.fillRect(x - 110, y - 110 + up, 220, 220); } drawManh(c, i, x, y + up, 0.4); }
  if (P6.pick) drawPicker(c, now);
};
// bảng chọn chữ: chỉ có những chữ em đã lật thấy ở mặt sau các mảnh
const PK = { y: 520, slots: () => [[680, 0], [850, 1], [950, 2], [1050, 3]] };
function drawPicker(c, now) {
  c.fillStyle = 'rgba(4,4,6,.72)'; c.fillRect(-300, -300, W + 600, H + 600);
  c.fillStyle = '#efe6d2'; roundRect(c, 330, 250, 940, 420, 18); c.fill();
  for (let i = 0; i < 9; i++) { c.strokeStyle = 'rgba(120,90,60,.18)'; c.lineWidth = 1; c.beginPath(); c.moveTo(360, 300 + i * 40); c.lineTo(1240, 300 + i * 40); c.stroke(); }
  c.fillStyle = '#4a3326'; c.font = `56px ${HAND}`; c.textAlign = 'right'; c.fillText('Anh vẫn', 600, 410); c.textAlign = 'center';
  PK.slots().forEach(([x], i) => { c.strokeStyle = 'rgba(74,51,38,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 38, 420); c.lineTo(x + 38, 420); c.stroke(); if (P6.word[i]) { c.fillStyle = 'rgba(176,36,30,.9)'; c.font = `64px ${HAND}`; c.fillText(P6.word[i], x, 408); } });
  const seen = [0, 1, 2, 3].filter((i) => P5.seen[i]);
  if (!seen.length) { c.fillStyle = 'rgba(74,51,38,.55)'; c.font = `26px ${HAND}`; c.fillText('chưa có chữ nào để điền', 800, 560); }
  seen.forEach((i, n) => { const x = 800 + (n - (seen.length - 1) / 2) * 130, used = P6.word.includes(MANH_CHU[i]); c.fillStyle = used ? 'rgba(74,51,38,.08)' : 'rgba(74,51,38,.14)'; roundRect(c, x - 48, 500, 96, 100, 12); c.fill(); c.fillStyle = `rgba(176,36,30,${used ? 0.25 : 0.9})`; c.font = `60px ${HAND}`; c.fillText(MANH_CHU[i], x, 572); });
  c.textAlign = 'left';
  c.fillStyle = 'rgba(74,51,38,.45)'; c.font = `20px ${HAND}`; c.textAlign = 'center'; c.fillText('chạm chữ để điền · chạm chỗ đã điền để bỏ ra · chạm ngoài tờ giấy để đóng', 800, 650); c.textAlign = 'left';
}
SC.cuatro.tap = function (p) {
  if (P6.solved) return;
  if (P6.pick) { // đang mở bảng chọn chữ
    if (p[0] < 330 || p[0] > 1270 || p[1] < 250 || p[1] > 670) { P6.pick = false; FX.paper(); cuaHints(); return; }
    const sl = PK.slots(); for (let i = 0; i < 4; i++) if (Math.abs(p[0] - sl[i][0]) < 45 && p[1] > 330 && p[1] < 440 && P6.word[i]) { P6.word[i] = null; P6.word = P6.word.slice(0, i).concat(P6.word.slice(i + 1)); FX.put(); return; }
    const seen = [0, 1, 2, 3].filter((i) => P5.seen[i]);
    seen.forEach((i, n) => { const x = 800 + (n - (seen.length - 1) / 2) * 130, ch = MANH_CHU[i]; if (Math.abs(p[0] - x) < 52 && p[1] > 495 && p[1] < 605 && !P6.word.includes(ch) && P6.word.length < 4) { P6.word.push(ch); FX.tap(); nz(ac.currentTime, 0.12, 'bandpass', 3000, 1, 0.08); } });
    if (P6.word.length === 4) setTimeout(() => {
      if (P6.word.join('') === WORD.join('')) cuaSolved();
      else { FX.jam(); P6.word = []; missHint('chu', ['Câu này anh đã nói trong cuộn băng 11/11.', 'Mở túi, nghe lại băng 11/11, để ý câu gần cuối.', '"Anh vẫn … với em thôi."'], 1); }
    }, 450);
    else if (seen.length < 4 && P6.word.length === seen.length && seen.length) sayNow('Còn mảnh chưa lật xem mặt sau.');
    return;
  }
  if (CTR.hot && inR(p, CTR.hot.vantay)) { CTR.vantay = 1; P6.vtN++; const t = ac.currentTime; tone(t, 880, 880, 0.03, 0.12, 'square'); tone(t + 0.16, 660, 660, 0.03, 0.2, 'square'); sayNow(P6.vtN < 3 ? 'Vân tay không khớp.' : 'Máy chỉ nhận tay người ở đây. Khung gỗ bên cạnh thì khác.'); return; }
  if (CTR.hot && inR(p, CTR.hot.cua)) { const t = ac.currentTime; for (let i = 0; i < 3; i++) nz(t + i * 0.09, 0.06, 'bandpass', 500, 2, 0.4); sayNow('Cửa khoá từ, đèn khoá vẫn đỏ.'); return; }
  const K = ctrK();
  // chọn mảnh trong khay
  for (let i = 0; i < 4; i++) { if (P6.placed[i] || !P5.manh[i]) continue; const [x, y] = ctrTray(i); if (Math.abs(p[0] - x) < 84 && Math.abs(p[1] - y) < 62) { P6.sel = P6.sel === i ? -1 : i; FX.paper(); return; } }
  // đặt mảnh vào khung: phải đặt gần đúng chỗ của nó, sai thì mảnh trượt về khay
  if (P6.sel >= 0 && inR(p, K)) { const i = P6.sel, hx = K.x + BD.home[i][0] * K.w, hy = K.y + BD.home[i][1] * K.h;
    if (Math.hypot(p[0] - hx, p[1] - hy) < Math.min(K.w, K.h) * 0.2) { P6.placed[i] = true; P6.sel = -1; FX.put(); nz(ac.currentTime, 0.2, 'bandpass', 2600, 0.6, 0.15); if (P6.placed.every(Boolean)) setTimeout(() => { const t = ac.currentTime; tone(t, 392, 392, 0.012, 2); tone(t + 0.3, 587.33, 587.33, 0.01, 2); sayNow('Đường chấm chấm đi liền một mạch. Chỉ còn ô trống cạnh ngôi đình.'); cuaNen(0.05, 900, 4); cuaHints(); }, 500); }
    else { P6.sel = -1; nz(ac.currentTime, 0.15, 'bandpass', 2400, 0.8, 0.12); missHint('ghep', ['Mỗi mảnh có một đoạn đường chấm chấm.', 'Mảnh có khu trại ở góc trên, toà nhà ở góc dưới.', 'Nối đường chấm chấm từ chiếc giường tới ô cửa sổ sáng.'], 3); }
    return; }
  // ô "Anh vẫn ___" trên bản đồ
  if (P6.placed.every(Boolean)) { const s = BD.slot, sx = K.x + s.u * K.w, sy = K.y + s.v * K.h; if (Math.abs(p[0] - sx) < s.w * K.w * 0.8 + 40 && Math.abs(p[1] - sy) < s.h * K.h * 0.8 + 40) { P6.pick = true; FX.paper(); if (![0, 1, 2, 3].some((i) => P5.seen[i])) sayNow('Mặt sau mấy mảnh giấy có gì?'); return; } }
};
function cuaSolved() {
  P6.solved = true; P6.pick = false; HINT.text = ''; HINT.off = true; FX.latch();
  const t = ac.currentTime; [392, 493.88, 587.33, 783.99].forEach((f, i) => tone(t + 0.4 + i * 0.35, f, f, 0.016, 2.4));
  cuaNen(0.16, 4800, 4);
  setTimeout(() => { CTR.den = 'xanh'; const t2 = ac.currentTime; tone(t2, 1320, 1320, 0.04, 0.12, 'square'); nz(t2 + 0.05, 0.25, 'lowpass', 300, 1, 0.9); FX.click(t2 + 0.06, 1); }, 3800);
  setTimeout(() => { const T0 = performance.now(); const run = () => { CTR.mo = Math.min(1, (performance.now() - T0) / 2200); if (CTR.mo < 1) requestAnimationFrame(run); }; run(); nz(ac.currentTime, 2.2, 'bandpass', 900, 0.5, 0.12); }, 4600);
  setTimeout(() => { if (typeof startThu === 'function') startThu(); }, 7600);
}

// nối từ đoạn lướt ngõ
endNgo = function () { HINT.off = false; go('cuatro', 1600); };

// thử nhanh: ?phong=6 (trước cửa khu trọ, đủ 4 mảnh, chưa lật mảnh nào)
if (new URLSearchParams(location.search).get('phong') === '6') {
  const st0 = START;
  START = () => { st0(); INTRO.t = 9; setTimeout(() => { Object.assign(P1, { torch: true, calm: true, calmT: 9, done: true }); bagAdd('may', '', null); bagAdd('strip', 'dải ảnh', STRIP_DRAW); tapeAdd('9/11', 'am/giong1.mp3', SUB1); tapeAdd('10/11', 'am/giong2.mp3', SUB2); tapeAdd('11/11', 'am/bang3.mp3', SUB3, true); POCKET.msg = null; [0, 1, 2, 3].forEach(manhAdd); go('cuatro', 600); }, 300); };
}
