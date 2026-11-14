// ================= PHÒNG 3 · CẦU THANG, 1 GIỜ SÁNG 11/11: "Anh có thương em không?" =================
// Nhạc tắt hẳn. Gió qua ô thoáng, xe chạy ngoài cao tốc. Vệt đèn xe soi lên tường vài vạch số → 01:00. Hộp sắt 0100.
// Trong hộp không có băng: băng 11/11 nằm sẵn trong máy. Bấm phát thì kẹt → quay lõi bằng bút, thật chậm.
// Lật mặt: phòng anh lúc 1 giờ, điện thoại úp rung hai hồi không ai nghe, rồi anh gọi lại [THẬT, chương "Phần còn lại"].
const P3 = { on: false, open: false, but: false, phan: false, done: false, calm: false, calmT: 0, hintKey: '', prog: 0, lastA: null, lastT: 0, ringT: -99 };
let stairG = null;
HS.so = [3, 7, 2, 5]; // không để sẵn gần đáp án

function stairHints() {
  let k, L;
  if (P3.calm) return;
  if (!P3.open) { k = 's0'; L = ['Mỗi lần có xe chạy qua, đèn pha soi lên tường vài vạch sáng.', 'Các vạch ghép lại thành bốn con số, như mặt đồng hồ điện tử.', 'Giờ em ngồi ở cầu thang này. Hộp sắt dưới gầm cầu thang.']; }
  else if (!P3.but || !P3.phan || !P3.manh) { k = 's1'; L = ['Hộp mở rồi.', 'Trong hộp có vài thứ nhỏ.', 'Lấy hết đồ trong hộp.']; }
  else return;
  if (P3.hintKey !== k) { P3.hintKey = k; hints(L); }
}

// ---------- âm thanh cầu thang ----------
function carPass(dir) {
  const t = ac.currentTime, d = 2.5, s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t); lp.frequency.linearRampToValueAtTime(900, t + d * 0.45); lp.frequency.linearRampToValueAtTime(300, t + d);
  const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + d * 0.45); g.gain.linearRampToValueAtTime(0, t + d);
  const pn = ac.createStereoPanner(); pn.pan.setValueAtTime(-0.85 * dir, t); pn.pan.linearRampToValueAtTime(0.85 * dir, t + d);
  s.connect(lp).connect(g).connect(pn).connect(stairG); s.start(t); s.stop(t + d + 0.1);
  nz(t + d * 0.4, 0.5, 'highpass', 3000, 0.7, 0.05, 0, 0, stairG);
}
function startStairs() {
  const t = ac.currentTime;
  if (hallG) ramp(hallG.gain, 0, 2.5); P2.on = false;
  if (TMUSIC) { TMUSIC.far = [0, 400]; musicOff(3); }
  stairG = ac.createGain(); stairG.gain.value = 0; stairG.connect(master); AMB.push(stairG); ramp(stairG.gain, 1, 3);
  const wind = loopNoise(0.06, 'bandpass', 700, 2.5, 0.6); const wl = ac.createOscillator(); wl.frequency.value = 0.13; const wg = ac.createGain(); wg.gain.value = 0.05; wl.connect(wg).connect(wind.gain.gain); wl.start(); const wp = ac.createStereoPanner(); wp.pan.value = -0.4; wind.gain.connect(wp).connect(stairG);
  const room = loopNoise(0.03, 'lowpass', 140, 0.7); room.gain.connect(stairG);
  const hw = loopNoise(0.02, 'lowpass', 300, 0.6, 0.5); const hp = ac.createStereoPanner(); hp.pan.value = -0.6; hw.gain.connect(hp).connect(stairG);
  P3.on = true; P3.nextCar = 2;
  // bước chân xuống cầu thang bê tông: khô, vang ngắn
  for (let i = 0; i < 6; i++) { const tt = t + 0.2 + i * 0.42; nz(tt, 0.05, 'bandpass', 380, 2, 0.6, i % 2 ? 0.15 : -0.15); nz(tt + 0.08, 0.12, 'bandpass', 380, 2, 0.12, i % 2 ? -0.3 : 0.3); }
}

// ---------- cầu thang: xe qua theo nhịp, chạm hộp sắt / đầu cầu thang ----------
const stairDraw = SC.cauthang.draw;
SC.cauthang.draw = function (c, now, dt) {
  if (P3.on && !TAPE.phase.match(/play|phones|armed/)) { P3.nextCar -= dt; if (P3.nextCar < 0 && !CT._auto) { const dir = Math.random() < 0.7 ? 1 : -1; CT.quet(dir); carPass(dir); P3.nextCar = 5 + Math.random() * 3; } }
  stairDraw.call(this, c, now, dt);
  if (P3.calm) { P3.calmT += dt; const h = HOT.dau_cau_thang, k = clamp((P3.calmT - 4) / 3, 0, 1); if (k > 0 && h) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(h.x + h.w / 2, h.y + h.h / 2, 10, h.x + h.w / 2, h.y + h.h / 2, 260); g.addColorStop(0, `rgba(255,205,140,${0.28 * k})`); g.addColorStop(1, 'rgba(255,205,140,0)'); c.fillStyle = g; c.fillRect(h.x - 260, h.y - 260, h.w + 520, h.h + 520); c.restore(); } }
  // điện thoại em trên bậc thang: anh gọi lại, rung trên bê tông
  if (CT.dt > 0 && P3.ringT > 0) { const e = (now - P3.ringT) / 1000; CT.dt = e < 9 ? 0.6 + 0.4 * (Math.sin(e * 9) > 0 ? 1 : 0.3) : 1; }
};
SC.cauthang.enter = function () { stairHints(); nudge(); };
SC.cauthang.tap = function (p) {
  if (P3.calm && P3.calmT > 5 && HOT.dau_cau_thang && inR(p, HOT.dau_cau_thang)) { endRoom3(); return; }
  if (HOT.hop_sat && inR(p, HOT.hop_sat)) { FX.click(ac.currentTime, 0.7, 0.2); go('hopsat'); return; }
};

// ---------- hộp sắt: 0100, không báo đúng sai ----------
SC.hopsat.back = 'cauthang';
const hsDraw = SC.hopsat.draw;
SC.hopsat.draw = function (c, now, dt) {
  if (P3.open) HS.mo = Math.min(1, HS.mo + dt / 1.1);
  hsDraw.call(this, c, now, dt);
  if (P3.open && HS.mo > 0.9) {
    // trong hộp: một cây bút bi, vài viên phấn vụn
    if (!P3.but) { c.save(); c.translate(800, 560); c.rotate(-0.25); c.fillStyle = '#20324f'; roundRect(c, -110, -8, 200, 16, 6); c.fill(); c.fillStyle = '#c9ccd2'; c.fillRect(90, -6, 26, 12); c.fillStyle = '#111'; c.beginPath(); c.moveTo(116, -4); c.lineTo(130, 0); c.lineTo(116, 4); c.fill(); c.restore(); }
    if (!P3.manh && typeof drawManh === 'function') drawManh(c, 0, 690, 380, 0.42);
    if (!P3.phan) { c.fillStyle = 'rgba(236,233,224,.9)'; [[640, 600, 22, 9], [668, 612, 16, 8], [700, 598, 12, 7], [960, 610, 18, 8]].forEach(([x, y, w, h]) => { c.save(); c.translate(x, y); c.rotate(0.3); c.fillRect(-w / 2, -h / 2, w, h); c.restore(); }); }
  }
};
SC.hopsat.tap = function (p) {
  if (P3.open) {
    if (HS.mo < 0.9) return;
    if (!P3.but && Math.hypot(p[0] - 800, p[1] - 560) < 140) { P3.but = true; FX.pick(); bagAdd('but', 'cây bút', (c, s) => { c.save(); c.scale(s, s); c.rotate(-0.6); c.fillStyle = '#20324f'; c.fillRect(-60, -5, 110, 10); c.fillStyle = '#c9ccd2'; c.fillRect(50, -4, 14, 8); c.restore(); }); }
    else if (!P3.phan && p[1] > 570 && p[1] < 650 && (p[0] < 740 || p[0] > 900)) { P3.phan = true; FX.pocket(); bagAdd('phan', 'phấn', (c, s) => { c.save(); c.scale(s * 2, s * 2); c.fillStyle = '#ece9e0'; c.fillRect(-30, -8, 26, 12); c.fillRect(4, 0, 22, 10); c.restore(); }); }
    else if (!P3.manh && Math.abs(p[0] - 690) < 110 && Math.abs(p[1] - 420) < 120) { P3.manh = true; manhAdd(0); sayNow('Một mảnh giấy xé dở, kẹp một hình nhân giấy.'); }
    stairHints();
    if (P3.but && P3.phan && P3.manh && !P3.done) { P3.done = true; sayNow('Hộp không có băng.'); setTimeout(() => { const t = ac.currentTime; FX.click(t, 0.8); sayNow('Máy cát-sét trong túi khẽ kêu "tách".'); }, 2600); setTimeout(() => { HINT.off = true; HINT.text = ''; tapeStart('11/11', 'am/bang3.mp3', SUB3, stairG, afterTape3, flipToAnh3, { inMachine: true, noBed: true, jam: (done) => { P3.jamDone = done; go('kenbang', 700); } }); }, 5200); }
    return;
  }
  for (let i = 0; i < 4; i++) { const b = HS.banh[i]; if (b && p[0] > b.x - 6 && p[0] < b.x + b.w + 6 && p[1] > b.y - 30 && p[1] < b.y + b.h + 30) { HS.so[i] = (HS.so[i] + (p[1] < b.y + b.h / 2 ? 9 : 1)) % 10; FX.wheel(); nudge(); if (HS.so.join('') !== '0100') missHint('hs', ['Bốn con số, như mặt đồng hồ điện tử.', 'Chờ xe chạy qua, nhìn những vạch đèn pha in lên tường.', 'Ghép các vạch sáng thành giờ: hai số giờ, hai số phút.'], 30);
    if (HS.so.join('') === '0100') setTimeout(() => { P3.open = true; FX.latch(); const t = ac.currentTime; nz(t + 0.15, 0.6, 'bandpass', 420, 2, 0.5); nz(t + 0.2, 0.3, 'highpass', 2500, 1, 0.15); stairHints(); }, 380);
    return; } }
};

// ---------- băng kẹt: xỏ bút vào lõi, quay thật chậm. Quay nhanh thì băng nhăn, không cuốn ----------
SC.kenbang.enter = function () { KB.chung = 1; KB.nhan = 0; P3.prog = 0; P3.lastA = null; hints(['Băng lòi ra ngoài rồi. Cây bút đang xỏ vào lõi.', 'Xoay ngón tay theo vòng tròn quanh lõi để cuốn băng vào.', 'Quay thật chậm. Nhanh quá băng sẽ nhăn, không vào.']); };
const kbDraw = SC.kenbang.draw;
SC.kenbang.draw = function (c, now, dt) { KB.nhan = Math.max(0, KB.nhan - dt * 0.6); kbDraw.call(this, c, now, dt); if (KB.chung < 0.02 && P3.jamDone) { const f = P3.jamDone; P3.jamDone = null; FX.latch(); setTimeout(f, 700); } };
SC.kenbang.down = function (p) { P3.lastA = Math.atan2(p[1] - KB.loi[1], p[0] - KB.loi[0]); P3.lastT = performance.now(); return true; };
SC.kenbang.move = function (p, b) {
  if (!b || P3.lastA == null || KB.chung < 0.02) return;
  const a = Math.atan2(p[1] - KB.loi[1], p[0] - KB.loi[0]), n = performance.now(); let da = a - P3.lastA; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
  const sp = Math.abs(da) / Math.max(0.008, (n - P3.lastT) / 1000); P3.lastA = a; P3.lastT = n; KB.goc += da; nudge();
  const t = ac.currentTime;
  if (sp > 7) { KB.nhan = Math.min(1, KB.nhan + 0.12); if (Math.random() < 0.5) nz(t, 0.06, 'bandpass', 2500 + Math.random() * 2000, 2, 0.22); } // băng nhăn, kêu rẹt
  else { P3.prog += Math.abs(da); KB.chung = Math.max(0, 1 - P3.prog / (Math.PI * 2 * 3)); if (Math.floor(P3.prog / 0.7) !== Math.floor((P3.prog - Math.abs(da)) / 0.7)) { FX.click(t, 0.25); nz(t, 0.08, 'bandpass', 1200, 1.5, 0.08); } }
};
SC.kenbang.up = function (p, moved) { P3.lastA = null; return moved; };

// ---------- sau băng 11/11 ----------
function afterTape3() {
  P3.calm = true; P3.calmT = 0; go('cauthang', 900);
  CT.dt = 1; P3.ringT = performance.now();
  const t = ac.currentTime; for (let i = 0; i < 8; i++) { const tt = t + 1 + i * 1.0; nz(tt, 0.35, 'bandpass', 170, 4, 0.5, 0.1, 0, stairG); nz(tt, 0.35, 'bandpass', 2400, 6, 0.06, 0.1, 0, stairG); } // điện thoại rung trên bậc bê tông
  setTimeout(() => hints(['Gió lặng rồi. Đầu cầu thang có một bức tường.', 'Bức tường duy nhất không có vệt đèn xe nào quét qua.', 'Đi lên đầu cầu thang.']), 9000);
}
// lật mặt đêm 3: phòng anh lúc 1 giờ — rung hai hồi không nghe, rồi anh gọi lại
function flipToAnh3(done) { ANH.mode = 3; ANH.done = done; ANH.dur = 24; go('anh1', 1200); }
function endRoom3() { const t = ac.currentTime; for (let i = 0; i < 5; i++) nz(t + 0.2 + i * 0.45, 0.05, 'bandpass', 380, 2, 0.5, i % 2 ? 0.15 : -0.15); P3.on = false; if (stairG) ramp(stairG.gain, 0, 2); go('end3', 1400); }
SC.end3 = { draw(c) { c.fillStyle = '#000'; c.fillRect(-300, -300, W + 600, H + 600); text(c, '(hết phòng 3 · bức tường và đình làng đang làm)', W / 2, H / 2, 28, 0.5); } };

// nối từ phòng 2: xuống cầu thang
endRoom2 = function () { P2.on = false; startStairs(); go('cauthang', 1600); };

// thử nhanh: ?phong=3
if (new URLSearchParams(location.search).get('phong') === '3') {
  const st0 = START;
  START = () => { st0(); INTRO.t = 9; setTimeout(() => { Object.assign(P1, { torch: true, unlocked: true, noteSeen: true, strip: true, tuOpen: true, may: true, tai: true, open: true, bang: true, done: true, calm: true, calmT: 9 }); bagAdd('strip', 'dải ảnh', STRIP_DRAW); bagAdd('may', 'máy cát-sét', (c, s) => drawMiniWalkman(c, s * 0.72)); bagAdd('tai', 'tai nghe', drawEarbuds); Object.assign(P2, { done: true, calm: true }); hallG = ac.createGain(); hallG.connect(master); startStairs(); go('cauthang', 600); }, 300); };
}
