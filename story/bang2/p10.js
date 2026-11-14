// ================= BÓNG ANH THẤP THOÁNG Ở PHÍA EM (gài sẵn cho cú lật cuối) =================
// Suốt ba đêm, thỉnh thoảng có một cái bóng người thoáng hiện gần em rồi mất: hơi rợn, không doạ to.
// Cuối game, hai hình nhân diễn kịch bóng: em nhận ra cái bóng ấy luôn là anh, dõi theo, ở cạnh em từ xa.
// Dáng bóng dùng đúng hình nhân anh (puppet2 / frontFig trong p7.js).
const GH = { c: null, lastFlash: null, flashN: 0, dormT: -1e9, hallStart: 0, hallN: 0, hallT: -1e9, stairN: 0, stairT: -1e9, stairDir: 1 };
function ghostCanvas() { if (!GH.c) { GH.c = document.createElement('canvas'); GH.c.width = W; GH.c.height = H; } return GH.c; }
function drawGhost(c, fn, alpha, soft = 0) {
  if (alpha <= 0.01) return; const g = ghostCanvas(), m = g.getContext('2d');
  m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, W, H); m.fillStyle = '#fff'; m.strokeStyle = '#fff'; fn(m);
  m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = 'rgb(5,5,8)'; m.fillRect(0, 0, W, H); m.globalCompositeOperation = 'source-over';
  c.save(); if (soft) { c.globalAlpha = alpha * 0.45; c.drawImage(g, -soft, -soft * 0.5, W + soft * 2, H + soft); } c.globalAlpha = alpha; c.drawImage(g, 0, 0, W, H); c.restore();
}
// tiếng "sật" vụt qua sau lưng từ tai trái sang tai phải (như có ai lướt ngang), hai tiếng "tinh" mảnh cao, rồi một hơi thở trầm khẽ
function ghostSound(k = 1) {
  const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9; bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(3000, t + 0.2); bp.frequency.exponentialRampToValueAtTime(800, t + 0.5);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55 * k, t + 0.16); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  const pn = ac.createPanner(); pn.panningModel = 'HRTF'; pn.distanceModel = 'inverse'; pn.refDistance = 1;
  if (pn.positionX) { pn.positionX.setValueAtTime(-2.6, t); pn.positionX.linearRampToValueAtTime(2.6, t + 0.5); pn.positionY.setValueAtTime(0, t); pn.positionZ.setValueAtTime(0.9, t); } else pn.setPosition(0, 0, 0.9); // sau lưng, đi ngang từ trái sang phải
  s.connect(bp).connect(g).connect(pn).connect(master); s.start(t); s.stop(t + 0.6);
  [[0.06, 2960, -0.6], [0.2, 3330, 0.6]].forEach(([d, f, pan]) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; const og = ac.createGain(); og.gain.setValueAtTime(0.0001, t + d); og.gain.exponentialRampToValueAtTime(0.045 * k, t + d + 0.006); og.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.9); const op = ac.createStereoPanner(); op.pan.value = pan; o.connect(og).connect(op).connect(master); o.start(t + d); o.stop(t + d + 1); });
  nz(t + 0.45, 1.3, 'lowpass', 280, 0.7, 0.11 * k, 0.3);
}

// tiếng dọa: một nhịp hẫng, rồi tiếng trầm dội xuống + chùm dây đàn rít chói lệch tông, rung nhanh, tắt dần
let SCARE_LIM = null; // chặn đỉnh riêng cho tiếng dọa: to và giật nhưng không rè, không chói tai nghe
function scareLim() { if (!SCARE_LIM) { SCARE_LIM = ac.createDynamicsCompressor(); SCARE_LIM.threshold.value = -12; SCARE_LIM.knee.value = 4; SCARE_LIM.ratio.value = 14; SCARE_LIM.attack.value = 0.002; SCARE_LIM.release.value = 0.25; SCARE_LIM.connect(master); } return SCARE_LIM; }
function scareHit(k = 1) {
  const t = ac.currentTime + 0.02, L = scareLim();
  const sub = ac.createOscillator(), sg = ac.createGain(); sub.type = 'sine'; sub.frequency.setValueAtTime(62, t); sub.frequency.exponentialRampToValueAtTime(30, t + 0.9);
  sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.9 * k, t + 0.015); sg.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); sub.connect(sg).connect(L); sub.start(t); sub.stop(t + 1.5);
  nz(t, 0.3, 'lowpass', 1100, 0.7, 0.8 * k, 0, 0, L); nz(t, 0.12, 'highpass', 2500, 0.7, 0.35 * k, 0, 0, L);
  const bus = ac.createGain(), hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500; bus.gain.setValueAtTime(0.0001, t); bus.gain.exponentialRampToValueAtTime(0.11 * k, t + 0.012); bus.gain.setValueAtTime(0.11 * k, t + 0.18); bus.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
  const trem = ac.createOscillator(), tg = ac.createGain(), am = ac.createGain(); trem.frequency.value = 14; tg.gain.value = 0.45; am.gain.value = 0.55; trem.connect(tg).connect(am.gain); trem.start(t); trem.stop(t + 1.8);
  bus.connect(hp).connect(am).connect(L);
  [740, 784, 831, 1109, 1175, 1568].forEach((f, i) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * (1 + (i % 2 ? 0.004 : -0.004)), t); o.frequency.linearRampToValueAtTime(f * 1.03, t + 1.6); const og = ac.createGain(); og.gain.value = i > 3 ? 0.6 : 1; o.connect(og).connect(bus); o.start(t); o.stop(t + 1.8); });
}
// ---- đêm 96, phòng ngủ: một tia chớp, trên tường cạnh giường em có bóng người đứng ----
const dormDraw10 = SC.dorm.draw;
SC.dorm.draw = function (c, now, dt) {
  dormDraw10.call(this, c, now, dt);
  if (P1.flash !== GH.lastFlash) { GH.lastFlash = P1.flash; GH.flashN++; if (P1.torch && !P1.done && (GH.flashN === 2 || GH.flashN === 5)) { GH.dormT = P1.flash; scareHit(1); setTimeout(() => ghostSound(0.6), 380); } }
  const fe = (now - GH.dormT) / 1000;
  if (fe >= 0 && fe < 0.6) { const fl = fe < 0.08 ? 1 : fe < 0.16 ? 0.25 : fe < 0.24 ? 0.85 : Math.max(0, 1 - (fe - 0.24) / 0.32) * 0.5;
    const near = GH.flashN >= 5; drawGhost(c, (m) => puppet2(m, { her: false, H: near ? 304 : 262, base: near ? 534 : 506, x: near ? 760 : 800, fx: 1, t: now * 0.001, look: -0.3 }), 0.92 * fl, 4); } // lần sau: đứng sát kính hơn // đứng ngay trước khung cửa sổ: chớp sáng thì in đen lên kính
};

// ---- đêm 97, hành lang: đèn cuối hành lang chập; trong nhịp sáng ngắn có bóng người đứng dưới đèn ----
const hallDraw10 = SC.hall.draw;
SC.hall.draw = function (c, now, dt) {
  hallDraw10.call(this, c, now, dt);
  if (!GH.hallStart) GH.hallStart = now;
  const since = (now - GH.hallStart) / 1000, busy = typeof P2 !== 'undefined' && (P2.done || P2.calm);
  if (!busy && ((GH.hallN === 0 && since > 18) || (GH.hallN === 1 && since > 78))) { GH.hallN++; GH.hallT = now; const t = ac.currentTime; for (let i = 0; i < 4; i++) nz(t + [0, 0.5, 0.8, 1.05][i], 0.07, 'bandpass', 160 + i * 20, 5, 0.18); setTimeout(() => scareHit(0.9), 200); setTimeout(() => ghostSound(0.6), 700); }
  const e = (now - GH.hallT) / 1000;
  if (e >= 0 && e < 1.3) {
    const off = e < 0.2 || (e > 0.52 && e < 0.64) || (e > 0.82 && e < 0.9);
    if (off) { c.fillStyle = 'rgba(0,0,0,.74)'; c.fillRect(-300, -300, W + 600, H + 600); }
    else if (e > 0.2 && e < 0.82) { const near = GH.hallN >= 2; drawGhost(c, (m) => puppet2(m, { her: false, H: near ? 205 : 128, base: near ? 566 : 482, x: near ? 660 : 642, fx: 1, t: now * 0.001 }), 0.85); } // lần hai: đã đi gần lại nửa hành lang
  }
};

// ---- đêm 98, cầu thang: một lần đèn pha quét qua in ra một cái bóng người ngồi trên bậc ----
const quet10 = CT.quet;
CT.quet = function (dir) { const r = quet10.apply(this, arguments); GH.stairN++; if ((GH.stairN === 3 || GH.stairN === 9) && typeof P3 !== 'undefined' && !P3.calm) { GH.stairT = performance.now(); GH.stairDir = dir || 1; setTimeout(() => scareHit(0.85), 450); setTimeout(() => ghostSound(0.6), 900); } return r; };
const stairDraw10 = SC.cauthang.draw;
SC.cauthang.draw = function (c, now, dt) {
  stairDraw10.call(this, c, now, dt);
  const e = (now - GH.stairT) / 1000;
  if (e > 0.45 && e < 1.75) { const a = e < 1.5 ? 1 : 1 - (e - 1.5) / 0.25, dx = GH.stairDir * (e - 1.1) * 40 + (e < 0.7 ? (Math.random() - 0.5) * 8 : 0); // bật lên đột ngột, giật nhẹ, rồi tắt phụt
    if (e < 0.58) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-300, -300, W + 600, H + 600); }
    drawGhost(c, (m) => frontFig(m, { her: false, x: 640 + dx, seat: 352, base: 428, H: 198, w: 1, lean: 0.4, t: now * 0.001 }), 0.85 * a, 3); } // chỉ một bóng anh ngồi, nghiêng sang khoảng trống bên cạnh
};

// ---- món đi kèm phải NHÌN THẤY trong chỗ cất (lấy cùng một lần chạm với mảnh giấy) ----
function lying(c, id, x, y, rot, s) { c.save(); c.translate(x, y); c.rotate(rot); drawItem9(c, id, 0, 0, s); c.restore(); }
const hsDraw10 = SC.hopsat.draw; // hộp sắt: hình nhân chàng trai nằm chéo trên mảnh giấy
SC.hopsat.draw = function (c, now, dt) { hsDraw10.call(this, c, now, dt); if (P3.open && HS.mo > 0.9 && !P3.manh) lying(c, 'nhan_anh', 700, 482, -1.47, 0.72); };
const rdDraw10 = SC.radio.draw; // lòng radio: hình nhân cô gái nằm cạnh mảnh giấy
SC.radio.draw = function (c, now, dt) { rdDraw10.call(this, c, now, dt); if (P5.radioLat && P5.radioFace > 0.9 && P5.radioOpen > 0.6 && !P5.manh[2]) lying(c, 'nhan_em', 650, 398, -1.42, 0.78); };
const bdDraw10 = SC.banda.draw; // ngăn bàn đá: nửa khuôn nằm dưới mảnh giấy
SC.banda.draw = function (c, now, dt) { bdDraw10.call(this, c, now, dt); if (P5.banOpen > 0.5 && !P5.manh[3]) { const a = BD5.notch, k = ease(P5.banOpen), x = BD5.cx + Math.cos(a) * (BD5.r + 20 + 70 * k), y = BD5.cy + Math.sin(a) * (BD5.r + 20 + 70 * k); lying(c, 'khuon_nam', x + 46, y + 4, 0.18, 0.22); c.save(); c.translate(x - 30, y - 4); drawManh(c, 3, 0, 0, 0.3); c.restore(); } };

// ================= BÓNG CHỈ LỐI =================
// Mỗi lần em bí (thử sai nhiều lần, hoặc đứng lâu) và dòng gợi ý hiện ra, một bóng nam ngược sáng thoáng hiện ở mép khung,
// tay chỉ vào giữa, rồi vụt mất; có lần nó lướt ngang phía sau. Lúc chơi: rợn, như có ai theo dõi.
// Sau danh đề (mặt khuất): những dòng gợi ý ấy hiện lại bằng nét chữ tay của anh, anh đứng chỉ từng dòng → hoá ra anh luôn bên cạnh chỉ lối.
const HELP = { log: [], at: -1e9, n: 0, side: 1, mode: 0, listSeen: null, tierSeen: 0 };
const NO_HELP = /^(tape|tui|ket|thu|manh|khuon)$/;
function helpFire(text) {
  if (!text) return; if (!HELP.log.includes(text)) HELP.log.push(text);
  const now = performance.now();
  if (NO_HELP.test(V.cur || '') || /play|phones|armed/.test(TAPE.phase) || now - HELP.at < 25000 || now - GH.dormT < 8000 || now - GH.hallT < 8000 || now - GH.stairT < 8000) return;
  HELP.at = now; HELP.n++; HELP.side = -HELP.side; HELP.mode = HELP.n % 3 === 2 ? 1 : 0; if (HELP.mode === 0) { scareHit(0.8); setTimeout(() => ghostSound(0.4), 420); } else { scareHit(0.45); ghostSound(0.6); }
}
const missHint10 = missHint; // gợi ý theo số lần thử sai
missHint = function (key, list, every) { const s0 = HINT.show; missHint10(key, list, every); if (HINT.show !== s0 && HINT.text) helpFire(HINT.text); };
const drawHint10 = drawHint; // gợi ý theo thời gian đứng yên
drawHint = function (c, now) { drawHint10(c, now);
  if (HINT.list !== HELP.listSeen) { HELP.listSeen = HINT.list; HELP.tierSeen = HINT.tier; }
  else if (HINT.tier > HELP.tierSeen) { HELP.tierSeen = HINT.tier; helpFire(HINT.text); } };
function coldBack(c, x, y, r, a) { c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(x, y, 10, x, y, r); gg.addColorStop(0, `rgba(150,170,210,${a})`); gg.addColorStop(1, 'rgba(150,170,210,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
OVER.push((c, now) => {
  const e = (now - HELP.at) / 1000; if (e < 0 || e > 1.0 || NO_HELP.test(V.cur || '')) return; const sd = HELP.side;
  if (HELP.mode === 0) { // bật lên đột ngột sát mép khung, ngược sáng lạnh, tay đã chỉ sẵn vào giữa; giật nhẹ rồi tắt phụt
    const fl = e < 0.06 ? 1 : e < 0.1 ? 0 : e < 0.78 ? 1 : 0; if (!fl) return;
    if (e < 0.16) { c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(-300, -300, W + 600, H + 600); } // đèn như sụt xuống một nhịp
    const jit = e < 0.32 ? (Math.random() - 0.5) * 10 : 0, x = W / 2 + sd * 560 + jit, base = 920, Hh = 520;
    coldBack(c, x, base - Hh * 0.6, Hh * 0.85, 0.22);
    drawGhost(c, (m) => puppet2(m, { her: false, H: Hh, base, x, fx: -sd, t: now * 0.001, reach: 1, look: -0.12 }), 0.95, 5);
  } else { // lướt ngang phía sau, rất nhanh
    const k = clamp(e / 0.6, 0, 1), x = W / 2 - sd * (720 - 1440 * k), fl = k < 1 ? 1 : 0;
    coldBack(c, x, 470, 260, 0.12 * fl);
    drawGhost(c, (m) => puppet2(m, { her: false, H: 270, base: 640, x, fx: sd, t: now * 0.001, walk: 1, ph: now * 0.012 }), 0.75 * fl, 4);
  }
});

// ---- mặt khuất (sau "Hết cuộn băng số 2"): băng tưởng đã dừng lại chạy tiếp ----
const MK = { t0: 133, lines: null, snd: {} };
function mkLines() {
  const L = HELP.log.filter((s) => s.length < 70);
  if (!L.length) return ['Có ánh sáng lọt qua khe cửa.', 'Bức tường duy nhất không có vệt đèn xe nào quét qua.', 'Mỗi chỗ khoét vừa đúng một dáng người.'];
  if (L.length <= 5) return L; return [0, 1, 2, 3, 4].map((i) => L[Math.round((i * (L.length - 1)) / 4)]);
}
function mkOnce(k, fn) { if (!MK.snd[k]) { MK.snd[k] = 1; fn(ac.currentTime); } }
function matKhuat(c, now, s) {
  if (!MK.lines) MK.lines = mkLines(); const n = MK.lines.length, tEnd = 5 + n * 3.6 + 0.6;
  mkOnce('chay', (t) => { FX.click(t, 1.1); nz(t + 0.25, tEnd + 12, 'highpass', 3200, 0.6, 0.05); }); // cạch, rồi tiếng xì của băng chạy tiếp
  c.fillStyle = `rgba(0,0,0,${clamp(s / 0.8, 0, 1)})`; c.fillRect(-300, -300, W + 600, H + 600);
  const out = 1 - sstep(tEnd + 9, tEnd + 12, s), lamp = sstep(1.2, 3.5, s) * out; if (lamp <= 0.001 && s > 1) { if (s > tEnd + 12.5) { mkOnce('nha', (t) => { FX.click(t, 1.2); FX.click(t + 0.2, 0.8); }); text(c, 'Hết cuộn băng số 2', W / 2, 450, 34, 0.75 * sstep(tEnd + 13, tEnd + 15, s), 'center', '255,236,210'); } return; }
  // một ngọn đèn rọi lên khoảng tường
  c.save(); const lg = c.createRadialGradient(840, 230, 30, 840, 380, 760); lg.addColorStop(0, `rgba(196,150,100,${0.55 * lamp})`); lg.addColorStop(0.55, `rgba(110,78,50,${0.32 * lamp})`); lg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = lg; c.fillRect(-300, -300, W + 600, H + 600);
  c.fillStyle = `rgba(0,0,0,${0.35 * lamp})`; c.fillRect(-300, 770, W + 600, 400); c.restore();
  // từng dòng gợi ý, nét chữ tay của anh
  let reach = 0;
  MK.lines.forEach((ln, i) => { const ti = 5 + i * 3.6, w = kseg(s, ti, ti + 2.1); reach = Math.max(reach, span(s, ti - 0.4, ti + 2.7, 0.5)); if (w <= 0) return;
    mkOnce('but' + i, (t) => { for (let j = 0; j < 9; j++) nz(t + j * 0.21 + Math.random() * 0.08, 0.09, 'bandpass', 4200 + Math.random() * 1400, 0.8, 0.07); });
    let fs = 40; c.font = `500 ${fs}px ${SCRIPT}`; let tw = c.measureText(ln).width; if (tw > 820) { fs = Math.floor(fs * 820 / tw); c.font = `500 ${fs}px ${SCRIPT}`; tw = c.measureText(ln).width; }
    const x1 = 930, y = 182 + i * 66, cur = s < ti + 3.4 || i === n - 1; c.save(); c.beginPath(); c.rect(x1 - tw - 10, y - 60, (tw + 20) * w, 90); c.clip();
    c.fillStyle = `rgba(255,236,206,${(cur ? 0.92 : 0.42) * lamp})`; c.textAlign = 'right'; c.fillText(ln, x1, y); c.restore(); c.textAlign = 'left'; });
  // anh: hiện dần trong vùng đèn, tay chỉ từng dòng; em bước vào đọc, rồi nhìn sang anh
  const ap = sstep(2.5, 4.5, s) * out, ex = glide(s, tEnd, tEnd + 4.5, -120, 640), ew = s > tEnd && s < tEnd + 4.5 ? 1 : 0, ep = sstep(tEnd - 0.2, tEnd + 0.8, s) * out;
  const meet = sstep(tEnd + 5.2, tEnd + 6.6, s); let hA = null, hE = null;
  drawGhost(c, (m) => {
    const ra = puppet2(m, { her: false, H: 380, base: 770, x: 1130, fx: -1, t: now * 0.001, reach: reach * (1 - meet), look: 0.06 - 0.12 * meet });
    hA = ra && ra.heart; strings(m, (ra && ra.anchors) || [], now * 0.001, 1.3);
    if (ep > 0) { const re = puppet2(m, { her: true, H: 330, base: 770, x: ex, fx: 1, t: now * 0.001, walk: ew, ph: s * 7, look: 0.22 * (1 - meet) }); hE = re && re.heart; strings(m, (re && re.anchors) || [], now * 0.001, 2.1); }
  }, Math.min(ap, 1) * 0.95, 4);
  if (meet > 0) { mkOnce('tim', (t) => { tone(t, 587.33, 587.33, 0.01, 2.2); tone(t + 0.5, 783.99, 783.99, 0.008, 2.4); });
    c.save(); c.globalCompositeOperation = 'lighter'; [hE, hA].forEach((h, i) => { if (!h) return; const a = meet * out * (0.75 + 0.25 * Math.sin(now * 0.004 + i)), gg = c.createRadialGradient(h[0], h[1], 2, h[0], h[1], 46); gg.addColorStop(0, `rgba(255,200,140,${0.85 * a})`); gg.addColorStop(1, 'rgba(255,170,100,0)'); c.fillStyle = gg; c.fillRect(h[0] - 50, h[1] - 50, 100, 100); }); c.restore(); }
  if (s > tEnd + 7 && s < tEnd + 10 && now > (MK.chirp || 0)) { MK.chirp = now + 900 + Math.random() * 1600; const ct = ac.currentTime, f = 4300 + Math.random() * 500; for (let i = 0; i < 3; i++) nz(ct + i * 0.055, 0.03, 'bandpass', f, 12, 0.05); }
}
const ketDraw10 = SC.ket.draw;
SC.ket.draw = function (c, now, dt) { ketDraw10.call(this, c, now, dt); const s = ketT() - MK.t0; if (s >= 0) { setT(c); matKhuat(c, now, s); } };
