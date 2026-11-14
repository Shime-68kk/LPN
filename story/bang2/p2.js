// ================= PHÒNG 2 · HÀNH LANG, TỐI 10/11: "Em chờ anh có lâu không?" =================
// Thư 10/11 em xin những dấu hiệu nhỏ mỗi ngày. Quanh hành lang có 7 dấu hiệu rất nhỏ (C): mỗi dấu kèm 1–7 chấm = một ngày.
// Mỗi dấu tìm theo một cách khác nhau. Hộp đựng băng 10/11 khoá bằng 7 ô hình, xếp theo số chấm. Không báo đúng sai từng ô.
const SIGN_ORDER = ['giot', 'nui', 'song', 'trang', 'mat', 'sao', 'tim'];
const SIGN_DAY = { giot: 1, nui: 2, song: 3, trang: 4, mat: 5, sao: 6, tim: 7 };
const P2 = { on: false, found: {}, order: [], slots: [0, 0, 0, 0, 0, 0, 0], open: false, lid: 0, bang: false, done: false, calm: false, calmT: 0,
  fog: 0, holding: false, tilt: 0, scroll: 0, dep: [0, 0], depFlip: -1, aoFlip: [0, 0], aoTap: -1, dust: null, hintKey: '', seenT: 0, knock: 0 };
let hallG = null;

// ---------- vẽ dấu hiệu: nét phấn tay, không phải icon ----------
function drawSign(c, id, x, y, s = 1, a = 1, col = '242,234,214', lw = 3) {
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = `rgba(${col},${a})`; c.fillStyle = `rgba(${col},${a})`; c.lineWidth = lw / s; c.lineCap = 'round'; c.lineJoin = 'round';
  const j = (v) => v + Math.sin(v * 12.9) * 0.8; // run tay
  c.beginPath();
  if (id === 'giot') { c.moveTo(0, -26); c.bezierCurveTo(j(12), -8, 18, 6, 0, 22); c.bezierCurveTo(-18, 6, j(-12), -8, 0, -26); }
  else if (id === 'nui') { c.moveTo(-28, 18); c.lineTo(j(-10), -16); c.lineTo(2, 2); c.lineTo(j(12), -22); c.lineTo(30, 18); }
  else if (id === 'song') { c.moveTo(-30, 4); for (let i = 0; i <= 30; i++) { const u = i / 30; c.lineTo(-30 + u * 60, 4 - Math.sin(u * Math.PI * 2.2) * 12 * (1 - u * 0.3)); } }
  else if (id === 'trang') { c.arc(0, 0, 22, Math.PI * 0.35, Math.PI * 1.65); c.moveTo(13, -18); c.quadraticCurveTo(-8, 0, 13, 18); }
  else if (id === 'mat') { c.arc(0, 0, 11, 0, Math.PI * 2); for (let i = 0; i < 8; i++) { const an = (i * Math.PI) / 4; c.moveTo(Math.cos(an) * 17, Math.sin(an) * 17); c.lineTo(Math.cos(an) * 26, Math.sin(an) * 26); } }
  else if (id === 'sao') { for (let i = 0; i <= 5; i++) { const an = -Math.PI / 2 + (i * 4 * Math.PI) / 5; const px = Math.cos(an) * 24, py = Math.sin(an) * 24; i ? c.lineTo(px, py) : c.moveTo(px, py); } }
  else if (id === 'tim') { c.moveTo(0, 20); c.bezierCurveTo(-30, 0, -20, -24, 0, -9); c.bezierCurveTo(20, -24, 30, 0, 0, 20); }
  c.stroke(); c.restore();
}
function drawDots(c, n, x, y, s = 1, a = 1, col = '242,234,214') { c.fillStyle = `rgba(${col},${a})`; for (let i = 0; i < n; i++) { const r = i < 4 ? 0 : 1, k = i < 4 ? i : i - 4; c.beginPath(); c.arc(x + k * 11 * s, y + r * 11 * s, 3.2 * s, 0, Math.PI * 2); c.fill(); } }
// tiếng thấy dấu: hai nốt mộc ấm, lệch nhau, ngân ngắn (không bíp)
function foundChime() { const t = ac.currentTime; [[523.25, 0], [783.99, 0.14], [659.25, 0.3]].forEach(([f, d]) => { tone(t + d, f, f * 0.998, 0.035, 1.4, 'sine'); tone(t + d, f * 2, f * 2, 0.008, 0.6, 'triangle'); }); nz(t, 0.03, 'bandpass', 3000, 3, 0.15); }
function foundSign(id) { if (P2.found[id]) return; P2.found[id] = true; P2.order.push(id); setTimeout(foundChime, 250); P2.seenT = performance.now(); hallHints(); }

function hallHints() {
  const n = Object.keys(P2.found).length; let k, L;
  if (P2.done) return;
  if (n === 0) { k = 'h0'; L = ['Có những dấu vết rất nhỏ quanh hành lang. Mỗi dấu có vài chấm bên cạnh.', 'Nhìn kỹ những thứ ở đây: cửa kính, vũng nước, áo phơi, điện thoại, lan can, đôi dép, ngọn đèn.', 'Có thứ chỉ hiện khi hà hơi, có thứ chỉ hiện khi đèn chớp, có thứ phải lật lên mới thấy.']; }
  else if (n < 7) { k = 'h' + n; L = [`Mới thấy ${n} dấu. Còn ${7 - n} dấu nữa.`, 'Mỗi nơi giấu dấu theo một cách: hà hơi, cúi xuống, lật lên, lau đi, chờ đèn, cuộn xuống.', 'Những nơi chưa tìm: ' + ['kinh', 'dep', 'lancan', 'vung', 'den', 'ao', 'dt'].filter((w) => !Object.keys(P2.found).some((id) => SIGN_WHERE[id] === w)).map((w) => WHERE_NAME[w]).slice(0, 3).join(', ') + '.']; }
  else if (!P2.open) { k = 'hlock'; L = ['Đủ bảy dấu rồi. Cuối hành lang, cạnh lối xuống cầu thang có một chiếc hộp.', 'Dưới mỗi ô của hộp có khắc vài chấm.', 'Dấu có mấy chấm thì bỏ vào ô có bấy nhiêu chấm.']; }
  else if (!P2.bang) { k = 'hbang'; L = ['Hộp mở rồi.', 'Trong hộp có một cuộn băng.', 'Chạm vào cuộn băng.']; }
  else return;
  if (P2.hintKey !== k) { P2.hintKey = k; hints(L); }
}
const SIGN_WHERE = { giot: 'kinh', nui: 'dep', song: 'lancan', trang: 'vung', mat: 'den', sao: 'ao', tim: 'dt' };
const WHERE_NAME = { kinh: 'ô kính cửa thứ hai', dep: 'đôi dép trước cửa', lancan: 'mặt dưới lan can', vung: 'vũng nước', den: 'ngọn đèn cuối hành lang', ao: 'áo phơi', dt: 'điện thoại' };

// ---------- âm thanh hành lang: gió lan can, áo đập, vòi nước nhỏ giọt, đèn rè, dế xa ----------
function startHall() {
  const t = ac.currentTime;
  if (rainG) ramp(rainG.gain, 0.025, 4); if (sleepG) ramp(sleepG.gain, 0, 2);
  hallG = ac.createGain(); hallG.gain.value = 0; hallG.connect(master); AMB.push(hallG); ramp(hallG.gain, 1, 3);
  const pan = (v) => { const p = ac.createStereoPanner(); p.pan.value = v; p.connect(hallG); return p; };
  const wind = loopNoise(0.07, 'bandpass', 420, 0.6, 0.8); const wl = ac.createOscillator(); wl.frequency.value = 0.09; const wg = ac.createGain(); wg.gain.value = 0.045; wl.connect(wg).connect(wind.gain.gain); wl.start(); wind.gain.connect(pan(0.55));
  const hiss = loopNoise(0.012, 'highpass', 2600, 0.7); hiss.gain.connect(pan(0.7));
  const buzz = ac.createOscillator(); buzz.type = 'sawtooth'; buzz.frequency.value = 100; const bl = ac.createBiquadFilter(); bl.type = 'lowpass'; bl.frequency.value = 380; const bg = ac.createGain(); bg.gain.value = 0.0035; buzz.connect(bl).connect(bg).connect(pan(-0.1)); buzz.start(); P2.buzzG = bg;
  const dripP = pan(-0.45), flapP = pan(0.35), crP = pan(0.85);
  const drip = () => { if (!P2.on) return; const t2 = ac.currentTime; tone(t2, 1500 + Math.random() * 300, 900, 0.025, 0.07); tone(t2 + 0.19, 1300, 850, 0.008, 0.07); setTimeout(drip, 1500 + Math.random() * 1100); };
  const flap = () => { if (!P2.on) return; const t2 = ac.currentTime, n = 1 + ((Math.random() * 3) | 0); for (let i = 0; i < n; i++) nz(t2 + i * 0.11, 0.07, 'bandpass', 700 + Math.random() * 500, 1.4, P2.calm ? 0.05 : 0.16, 0, 0, flapP); setTimeout(flap, 1400 + Math.random() * 3200); };
  const cri = () => { if (!P2.on) return; const t2 = ac.currentTime; for (let i = 0; i < 3; i++) tone(t2 + i * 0.07, 4400, 4300, 0.006, 0.04, 'sine', crP); setTimeout(cri, 900 + Math.random() * 2400); };
  P2.on = true; setTimeout(drip, 800); setTimeout(flap, 1500); setTimeout(cri, 2500);
  // dép bước ra hành lang
  for (let i = 0; i < 4; i++) { FX.step(t + 0.1 + i * 0.48, i % 2 ? 0.15 : -0.15); }
  if (TMUSIC) { TMUSIC.far = [0, 500]; musicOff(3); }
}
// đèn cuối hành lang: thỉnh thoảng bừng sáng (vũng nước soi rõ), có tiếng rè to lên
const SURGE = { at: -99, next: 6 };
function surgeTick(now, dt) {
  SURGE.next -= dt; if (SURGE.next < 0) { SURGE.at = now; SURGE.next = 7 + Math.random() * 5; if (P2.buzzG) { const t = ac.currentTime; P2.buzzG.gain.setValueAtTime(0.0035, t); P2.buzzG.gain.linearRampToValueAtTime(0.02, t + 0.05); P2.buzzG.gain.linearRampToValueAtTime(0.0035, t + 1.3); nz(t, 0.02, 'highpass', 4000, 1, 0.2); } }
  const e = (now - SURGE.at) / 1000; return e >= 0 && e < 1.4 ? (e < 0.06 ? e / 0.06 : e < 0.12 ? 0.4 : e < 0.2 ? 1 : Math.max(0, 1 - (e - 0.2) / 1.2)) : 0;
}

// ---------- hành lang: thêm lớp vật nhỏ + vùng chạm lên cảnh Antigravity vẽ ----------
const H2 = { dep: { x: 440, y: 540, w: 110, h: 70 }, lancan: { x: 1380, y: 380, w: 220, h: 90 }, den: null, vung: { x: 640, y: 545, w: 130, h: 75 } };
const hallDraw = SC.hall.draw;
SC.hall.draw = function (c, now, dt) {
  hallDraw(c, now, dt);
  const sg = surgeTick(now, dt), L = HALLX.lamp();
  H2.den = { x: L[0] - 70, y: L[1] - 70, w: 140, h: 140 };
  if (sg > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(L[0], L[1], 10, L[0], L[1], 420); g.addColorStop(0, `rgba(255,214,150,${0.35 * sg})`); g.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = g; c.fillRect(L[0] - 420, L[1] - 420, 840, 840); const pd = HALLX.PUDDLES[1]; c.fillStyle = `rgba(255,226,170,${0.4 * sg})`; c.beginPath(); c.ellipse(pd.center[0], pd.center[1], pd.width2d, 9, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
  // đôi dép trước cửa thứ ba
  c.save(); c.translate(492, 572); c.fillStyle = '#2a3340'; for (const dx of [-12, 12]) { c.beginPath(); c.ellipse(dx, 0, 9, 4, 0, 0, Math.PI * 2); c.fill(); } c.strokeStyle = 'rgba(160,180,200,.35)'; c.lineWidth = 1.2; for (const dx of [-12, 12]) { c.beginPath(); c.moveTo(dx - 6, -1); c.lineTo(dx + 6, -1); c.stroke(); } c.restore();
  // sau băng: đèn cầu thang sáng hẳn, mời đi tiếp
  if (P2.calm) { P2.calmT += dt; const k = clamp((P2.calmT - 3) / 3, 0, 1); if (k > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const e = HOT2.end, g = c.createRadialGradient(e.x + e.w / 2, e.y + e.h, 10, e.x + e.w / 2, e.y + e.h, 300); g.addColorStop(0, `rgba(255,200,130,${0.35 * k})`); g.addColorStop(1, 'rgba(255,200,130,0)'); c.fillStyle = g; c.fillRect(e.x - 300, e.y - 300, e.w + 600, e.h + 600); c.restore(); } }
};
SC.hall.enter = function () { hallHints(); nudge(); };
SC.hall.tap = function (p) {
  if (P2.calm && P2.calmT > 4 && inR(p, HOT2.end)) { endRoom2(); return; }
  if (inR(p, H2.vung)) { go('vung2'); return; }
  if (H2.den && inR(p, H2.den)) { FX.click(ac.currentTime, 0.4); go('den2'); return; }
  if (inR(p, H2.dep)) { FX.cloth(); go('dep2'); return; }
  if (inR(p, HOT2.phone)) { FX.pick(); go('dt2'); return; }
  if (inR(p, H2.lancan)) { FX.click(ac.currentTime, 0.5, 0.6); go('lancan2'); return; }
  if (inR(p, HOT2.ao)) { FX.cloth(); go('ao2'); return; }
  if (inR(p, HOT2.end)) { FX.step(ac.currentTime, 0); go('hop2'); return; }
  if (inR(p, HOT2.door2)) { go('kinh2'); return; }
  for (const k of ['door1', 'door3', 'door4', 'door5', 'door6']) if (inR(p, HOT2[k])) { const t = ac.currentTime, pn = clamp((p[0] - 800) / 800, -1, 1); for (let i = 0; i < 2; i++) { nz(t + i * 0.22, 0.05, 'bandpass', 260, 2, 0.5, pn); nz(t + i * 0.22, 0.02, 'bandpass', 1300, 3, 0.15, pn); } if (++P2.knock === 3) sayNow('Mọi người ngủ cả rồi.'); return; }
};

// nền chung cho cận cảnh
function closeBg(c, top = '#15181c', bot = '#0a0b0d') { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-300, -300, W + 600, H + 600); }
function warmSpot(c, x, y, r, a) { const g = c.createRadialGradient(x, y, 10, x, y, r); g.addColorStop(0, `rgba(255,232,196,${a})`); g.addColorStop(1, 'rgba(255,232,196,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }

// 1) Ô kính cửa thứ hai: giữ ngón tay = hà hơi lên kính → lộ nét vẽ bằng tay trên kính
SC.kinh2 = {
  back: 'hall',
  enter() { nudge(); },
  draw(c, now, dt) {
    closeBg(c, '#1c241f', '#0c100e');
    c.fillStyle = '#26302a'; c.fillRect(380, 90, 840, 760); c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 9; i++) c.fillRect(380, 120 + i * 82, 840, 2);
    c.fillStyle = '#0d1116'; c.fillRect(500, 170, 600, 420); // ô kính tối, sau kính là phòng đang ngủ
    c.fillStyle = 'rgba(70,90,110,.12)'; c.fillRect(540, 420, 260, 150); c.fillRect(840, 380, 220, 190);
    P2.fog = clamp(P2.fog + (P2.holding ? dt * 0.55 : -dt * 0.18), 0, 1);
    if (P2.fog > 0) {
      c.fillStyle = `rgba(190,200,205,${0.62 * P2.fog})`; c.fillRect(500, 170, 600, 420);
      // nét ai đó vẽ bằng ngón tay trên kính: chỉ hiện khi kính mờ hơi thở
      drawSign(c, 'giot', 800, 360, 3.2, 0.85 * P2.fog, '13,17,22', 7); drawDots(c, 1, 790, 470, 2, 0.85 * P2.fog, '13,17,22');
      if (P2.fog > 0.6) { if (!P2.kT) P2.kT = now; if (now - P2.kT > 600) foundSign('giot'); } else P2.kT = 0;
    }
    c.strokeStyle = '#3a463e'; c.lineWidth = 14; c.strokeRect(493, 163, 614, 434);
    if (!P2.found.giot && P2.fog < 0.1) text(c, 'giữ ngón tay trên kính', W / 2, 650, 24, 0.3 + 0.1 * Math.sin(now * 0.003));
  },
  down(p) { if (p[0] > 500 && p[0] < 1100 && p[1] > 170 && p[1] < 590) { P2.holding = true; FX.breath(); nudge(); return true; } return false; },
  up() { const h = P2.holding; P2.holding = false; return h; },
};

// 2) Đôi dép: lật lên mới thấy đế
SC.dep2 = {
  back: 'hall',
  draw(c, now, dt) {
    closeBg(c, '#1e2228', '#0c0d10');
    c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0, 220 + i * 80); c.lineTo(W, 200 + i * 80); c.stroke(); } // gạch sàn
    warmSpot(c, 800, 460, 520, 0.08);
    [0, 1].forEach((i) => {
      P2.dep[i] = clamp(P2.dep[i] + ((P2.depFlip === i ? 1 : 0) - P2.dep[i]) * Math.min(1, dt * 7), 0, 1);
      const x = 620 + i * 360, y = 430, k = Math.cos(P2.dep[i] * Math.PI), sy = Math.abs(k) || 0.02, under = k < 0;
      c.save(); c.translate(x, y); c.rotate(i ? 0.08 : -0.06); c.scale(1, sy);
      c.fillStyle = under ? '#1b1f24' : '#33404f'; roundRect(c, -95, -230, 190, 460, 90); c.fill();
      if (!under) { c.fillStyle = '#4a5a6c'; roundRect(c, -100, -120, 200, 70, 30); c.fill(); }
      else { c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 3; for (let r = -200; r < 220; r += 26) { c.beginPath(); c.moveTo(-70, r); c.lineTo(70, r + 8); c.stroke(); }
        if (i === 1) { drawSign(c, 'nui', 0, -20, 2.4, 0.9, '238,232,218', 5); drawDots(c, 2, -12, 70, 2, 0.9, '238,232,218'); } }
      c.restore();
    });
    if (P2.depFlip === 1 && P2.dep[1] > 0.9) foundSign('nui');
  },
  tap(p) { const i = p[0] < 800 ? 0 : 1; P2.depFlip = P2.depFlip === i ? -1 : i; const t = ac.currentTime; nz(t, 0.08, 'bandpass', 500, 1.5, 0.4); nz(t + 0.12, 0.05, 'lowpass', 300, 1, 0.5); nudge(); },
};

// 3) Lan can: kéo lên để cúi nhìn mặt dưới tay vịn
SC.lancan2 = {
  back: 'hall',
  enter() { P2.tilt = 0; },
  draw(c, now, dt) {
    const k = P2.tilt;
    closeBg(c, '#0a0f18', '#05070b');
    // đêm ngoài lan can: đồi tối, vài đốm đèn xa
    c.fillStyle = '#0c1220'; c.beginPath(); c.moveTo(0, 520 - k * 260); for (let x = 0; x <= W; x += 80) c.lineTo(x, 500 - k * 260 + Math.sin(x * 0.006) * 30); c.lineTo(W, H + 300); c.lineTo(0, H + 300); c.fill();
    for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(255,210,140,.6)'; c.fillRect(120 + i * 160 + (i % 3) * 20, 520 - k * 260 + (i % 2) * 14, 3, 3); }
    // tay vịn: nhìn từ trên (k=0) → cúi xuống thấy mặt dưới (k=1)
    const y0 = 360 + k * 120, th = 60 + k * 160;
    let g = c.createLinearGradient(0, y0, 0, y0 + th); g.addColorStop(0, '#59636d'); g.addColorStop(1, '#2a3036'); c.fillStyle = g; c.fillRect(-300, y0, W + 600, th);
    c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(-300, y0 + 4, W + 600, 3);
    for (let i = 0; i < 6; i++) { c.fillStyle = '#2b3138'; c.fillRect(140 + i * 270, y0 + th, 16, 600); }
    if (k > 0.5) { const a = (k - 0.5) * 2; c.strokeStyle = `rgba(170,175,180,${0.08 * a})`; for (let i = 0; i < 30; i++) { c.beginPath(); c.moveTo(200 + i * 40, y0 + th * 0.4); c.lineTo(220 + i * 40, y0 + th * 0.55); c.stroke(); } drawSign(c, 'song', 900, y0 + th * 0.5, 2.0, 0.8 * a, '215,220,226', 4); drawDots(c, 3, 990, y0 + th * 0.42, 1.4, 0.8 * a, '215,220,226'); if (a > 0.9) foundSign('song'); }
    if (k < 0.05 && !P2.found.song) text(c, 'kéo lên để cúi nhìn', W / 2, 650, 24, 0.25 + 0.1 * Math.sin(now * 0.003));
  },
  down(p) { this.y0 = p[1]; this.t0 = P2.tilt; return true; },
  move(p, b) { if (b && this.y0 != null) { const nt = clamp(this.t0 + (this.y0 - p[1]) / 300, 0, 1); if (Math.abs(nt - P2.tilt) > 0.15) FX.cloth(); P2.tilt = nt; nudge(); } },
  up(p, moved) { this.y0 = null; return moved; },
};

// 4) Vũng nước: chỉ lúc đèn bừng sáng mới soi rõ một dấu dán trên trần (thấy ngược trong nước)
SC.vung2 = {
  back: 'hall',
  draw(c, now, dt) {
    const sg = surgeTick(now, dt);
    closeBg(c, '#151a20', '#07090c');
    c.save(); c.beginPath(); c.ellipse(800, 450, 560, 230, 0, 0, Math.PI * 2); c.clip();
    let g = c.createLinearGradient(0, 220, 0, 680); g.addColorStop(0, '#0d1420'); g.addColorStop(1, '#1a2230'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // phản chiếu ngọn đèn và trần (ngược)
    const lg = c.createRadialGradient(560, 360, 5, 560, 360, 160 + sg * 120); lg.addColorStop(0, `rgba(255,214,150,${0.35 + 0.5 * sg})`); lg.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = lg; c.fillRect(300, 150, 600, 450);
    if (sg > 0.2) { c.save(); c.translate(980, 470); c.scale(1, -1); drawSign(c, 'trang', 0, 0, 2.6, 0.9 * sg, '255,226,170', 5); drawDots(c, 4, -30, 56, 1.9, 0.9 * sg, '255,226,170'); c.restore(); if (sg > 0.6) foundSign('trang'); }
    c.strokeStyle = 'rgba(200,220,240,.08)'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const y = 300 + i * 50 + Math.sin(now * 0.002 + i) * 4; c.beginPath(); c.moveTo(300, y); c.lineTo(1300, y + 6); c.stroke(); }
    c.restore();
    c.strokeStyle = 'rgba(120,140,160,.2)'; c.lineWidth = 3; c.beginPath(); c.ellipse(800, 450, 560, 230, 0, 0, Math.PI * 2); c.stroke();
  },
  tap() { nudge(); const t = ac.currentTime; tone(t, 900, 500, 0.02, 0.15); nz(t, 0.2, 'bandpass', 1200, 2, 0.1); },
};

// 5) Ngọn đèn cuối hành lang: chao đèn bám bụi và xác thiêu thân, lau đi mới thấy cái bóng dán bên trong
SC.den2 = {
  back: 'hall',
  enter() { if (!P2.dust) { const [dc] = [document.createElement('canvas')]; dc.width = 600; dc.height = 400; const g = dc.getContext('2d'); g.fillStyle = 'rgba(60,48,30,.85)'; g.fillRect(0, 0, 600, 400); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${30 + Math.random() * 40},${25 + Math.random() * 30},15,${Math.random() * 0.5})`; g.fillRect(Math.random() * 600, Math.random() * 400, 3, 3); } for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(20,15,8,.8)'; g.beginPath(); g.ellipse(Math.random() * 600, Math.random() * 400, 10, 5, Math.random() * 3, 0, Math.PI * 2); g.fill(); } P2.dust = dc; P2.wiped = 0; } },
  draw(c, now) {
    closeBg(c, '#2a2118', '#120d08');
    warmSpot(c, 800, 420, 700, 0.18);
    c.fillStyle = '#1a1612'; roundRect(c, 470, 180, 660, 470, 60); c.fill();
    const fl = 0.85 + 0.15 * Math.sin(now * 0.02) * Math.sin(now * 0.0031);
    const g = c.createRadialGradient(800, 420, 20, 800, 420, 340); g.addColorStop(0, `rgba(255,236,190,${0.95 * fl})`); g.addColorStop(1, 'rgba(255,200,120,.25)'); c.fillStyle = g; roundRect(c, 500, 210, 600, 410, 50); c.fill();
    // cái bóng dán bên trong chao: in tối trên kính sáng
    drawSign(c, 'mat', 800, 400, 3, 0.75, '70,45,20', 7); drawDots(c, 5, 760, 520, 2, 0.75, '70,45,20');
    c.save(); roundRect(c, 500, 210, 600, 410, 50); c.clip(); c.drawImage(P2.dust, 500, 210); c.restore();
    if (P2.wiped > 120 && !P2.found.mat) foundSign('mat');
    if (P2.wiped < 5) text(c, 'chao đèn bám đầy bụi', W / 2, 670, 24, 0.3);
  },
  down(p) { this.wipe(p); return true; }, move(p, b) { if (b) this.wipe(p); },
  wipe(p) { if (p[0] < 500 || p[0] > 1100 || p[1] < 210 || p[1] > 620) return; const g = P2.dust.getContext('2d'); g.globalCompositeOperation = 'destination-out'; const r = g.createRadialGradient(p[0] - 500, p[1] - 210, 4, p[0] - 500, p[1] - 210, 46); r.addColorStop(0, 'rgba(0,0,0,.9)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.beginPath(); g.arc(p[0] - 500, p[1] - 210, 46, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = 'source-over'; P2.wiped++; if (P2.wiped % 6 === 0) FX.wipe(); nudge(); },
};

// 6) Áo phơi: hai chiếc, lật cổ áo xem nhãn
SC.ao2 = {
  back: 'hall',
  draw(c, now, dt) {
    closeBg(c, '#0f141b', '#06080b');
    c.strokeStyle = 'rgba(150,165,180,.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-300, 170); c.lineTo(W + 300, 190); c.stroke();
    [0, 1].forEach((i) => {
      P2.aoFlip[i] = clamp(P2.aoFlip[i] + ((P2.aoTap === i ? 1 : 0) - P2.aoFlip[i]) * Math.min(1, dt * 6), 0, 1);
      c.save(); c.translate(520 + i * 560, 180); c.rotate(Math.sin(now * 0.0012 + i * 2) * 0.03); c.scale(2.3, 2.3); drawUniform(c, [0, 0], 0); c.restore();
      const cx = 520 + i * 560, cy = 290, k = P2.aoFlip[i];
      if (k > 0.05) { c.save(); c.translate(cx, cy); c.fillStyle = '#e9e4d8'; c.fillRect(-46, -20 * k, 92, 56 * k); c.fillStyle = '#2b2b2b'; c.font = `${Math.round(18 * k) || 1}px 'Be Vietnam Pro', sans-serif`; c.textAlign = 'center';
        if (i === 0) c.fillText('cỡ 2', 0, 14 * k); else { drawSign(c, 'sao', -14, 6 * k, 0.75 * k, 0.9, '40,40,40', 3); drawDots(c, 6, 10, -4 * k, 0.6 * k, 0.9, '40,40,40'); }
        c.restore(); c.textAlign = 'left'; }
    });
    if (P2.aoTap === 1 && P2.aoFlip[1] > 0.9) foundSign('sao');
  },
  tap(p) { const i = p[0] < 800 ? 0 : 1; if (p[1] < 420) { P2.aoTap = P2.aoTap === i ? -1 : i; FX.cloth(); nudge(); } },
};

// 7) Điện thoại em trên lan can: chuỗi tin em gửi, không ai trả lời; cuộn tới cuối thấy tin cuối có một dấu thả
const PH2 = { x: 560, y: 110, w: 480, h: 690 };
SC.dt2 = {
  back: 'hall', tapBelow: true,
  draw(c, now) {
    c.fillStyle = '#040506'; c.fillRect(-300, -300, W + 600, H + 600);
    c.fillStyle = '#0e1013'; roundRect(c, PH2.x - 18, PH2.y - 18, PH2.w + 36, PH2.h + 36, 50); c.fill();
    c.save(); roundRect(c, PH2.x, PH2.y, PH2.w, PH2.h, 36); c.clip(); c.fillStyle = '#101418'; c.fillRect(PH2.x, PH2.y, PH2.w, PH2.h);
    c.fillStyle = '#161b21'; c.fillRect(PH2.x, PH2.y, PH2.w, 90); text(c, 'Anh', PH2.x + 40, PH2.y + 60, 32, 0.9, 'left');
    const total = 1500, off = -P2.scroll;
    c.save(); c.beginPath(); c.rect(PH2.x, PH2.y + 90, PH2.w, PH2.h - 90); c.clip();
    for (let i = 0; i < 16; i++) { const y = PH2.y + 120 + i * 78 + off, w = 160 + ((i * 53) % 150); c.fillStyle = 'rgba(70,110,170,.55)'; roundRect(c, PH2.x + PH2.w - 30 - w, y, w, 54, 22); c.fill(); c.fillStyle = 'rgba(230,236,245,.35)'; c.fillRect(PH2.x + PH2.w - 10 - w, y + 18, w - 50, 7); c.fillRect(PH2.x + PH2.w - 10 - w, y + 32, (w - 50) * 0.6, 7); }
    const ly = PH2.y + 120 + 16 * 78 + off; // tin cuối
    c.fillStyle = 'rgba(70,110,170,.55)'; roundRect(c, PH2.x + PH2.w - 260, ly, 230, 54, 22); c.fill();
    c.fillStyle = '#1f252c'; c.beginPath(); c.arc(PH2.x + PH2.w - 252, ly + 56, 26, 0, Math.PI * 2); c.fill();
    drawSign(c, 'tim', PH2.x + PH2.w - 252, ly + 56, 0.62, 0.95, '240,120,140', 3); drawDots(c, 7, PH2.x + PH2.w - 220, ly + 70, 0.7, 0.8, '230,236,245');
    text(c, 'Đã xem', PH2.x + PH2.w - 40, ly + 100, 20, 0.55, 'right');
    if (ly < PH2.y + PH2.h - 140) foundSign('tim');
    c.restore(); c.restore();
    P2.maxScroll = total - (PH2.h - 90) + 80;
    if (P2.scroll < 10) text(c, 'vuốt lên', W / 2, PH2.y + PH2.h - 30, 22, 0.35 + 0.1 * Math.sin(now * 0.003));
  },
  down(p) { this.y0 = p[1]; this.s0 = P2.scroll; return true; },
  move(p, b) { if (b && this.y0 != null) { P2.scroll = clamp(this.s0 + (this.y0 - p[1]), 0, P2.maxScroll || 900); nudge(); } },
  up(p, moved) { this.y0 = null; return moved; },
};

// ---------- hộp băng 10/11: 7 ô hình, xếp theo số chấm. Không báo đúng sai từng ô ----------
const SLOT_SYM = ['', ...SIGN_ORDER];
const slotX = (i) => 290 + i * 146;
SC.hop2 = {
  back: 'hall',
  enter() { hallHints(); },
  draw(c, now, dt) {
    closeBg(c, '#1d1a16', '#0b0a08'); warmSpot(c, 800, 500, 700, 0.1);
    // dải "những dấu em đã thấy" (theo thứ tự tìm ra, không xếp sẵn)
    text(c, 'những dấu em đã thấy', W / 2, 150, 24, 0.45);
    P2.order.forEach((id, i) => { const x = W / 2 - (P2.order.length - 1) * 70 + i * 140; c.fillStyle = 'rgba(236,230,218,.06)'; roundRect(c, x - 56, 175, 112, 120, 12); c.fill(); drawSign(c, id, x, 222, 1.1, 0.9); drawDots(c, SIGN_DAY[id], x - 18, 268, 0.9, 0.8); });
    // hộp thiếc
    P2.lid = P2.open ? Math.min(1, P2.lid + dt / 1.2) : 0; const k = ease(P2.lid);
    c.fillStyle = '#3a3f45'; roundRect(c, 230, 350 - 160 * k, 1140, 300, 20); c.fill(); c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(250, 360 - 160 * k, 1100, 4);
    if (!P2.open || k < 0.5) for (let i = 0; i < 7; i++) { const x = slotX(i); c.fillStyle = '#16181b'; roundRect(c, x, 430, 126, 150, 14); c.fill(); const s = SLOT_SYM[P2.slots[i]]; if (s) drawSign(c, s, x + 63, 505, 1.3, 0.92);
      const n = i + 1, dx = x + 63 - (Math.min(n, 4) - 1) * 9.9 / 2; drawDots(c, n, dx, 600, 0.9, 0.8, '226,220,206'); }
    if (P2.open) { c.fillStyle = '#121416'; roundRect(c, 260, 420, 1080, 220, 16); c.fill(); if (!P2.bang) { c.globalAlpha = k; drawCassette(c, 800, 530, 0.85, '10/11'); c.globalAlpha = 1; } }
  },
  tap(p) {
    if (P2.open) { if (!P2.bang && P2.lid > 0.9 && p[1] > 420 && p[1] < 650 && p[0] > 560 && p[0] < 1040) { P2.bang = true; FX.pick(); bagAdd('bang2', 'cuộn băng 10/11', (c, s) => drawCassette(c, 0, 0, s * 0.42, '10/11')); P2.done = true; HINT.off = true; HINT.text = ''; setTimeout(() => tapeStart('10/11', 'am/giong2.mp3', SUB2, hallG, afterTape2, flipToAnh2), 900); } return; }
    for (let i = 0; i < 7; i++) { const x = slotX(i); if (p[0] > x && p[0] < x + 126 && p[1] > 430 && p[1] < 580) { P2.slots[i] = (P2.slots[i] + 1) % SLOT_SYM.length; FX.wheel(); nudge();
      if (P2.slots.every((v, j) => SLOT_SYM[v] === SIGN_ORDER[j])) setTimeout(() => { P2.open = true; FX.latch(); const t = ac.currentTime; nz(t + 0.2, 0.4, 'bandpass', 900, 3, 0.4); hallHints(); musicNear(); }, 400);
      else if (P2.slots.every((v) => v > 0)) { setTimeout(() => FX.jam(), 250); missHint('hop2', ['Chưa đúng. Mỗi dấu em thấy đều có vài chấm đi kèm.', 'Dưới mỗi ô của hộp cũng khắc chấm.', 'Dấu có một chấm vào ô một chấm, hai chấm vào ô hai chấm, cứ thế.'], 3); }
      return; } }
  },
};

function afterTape2() {
  P2.calm = true; P2.calmT = 0; go('hall', 900);
  musicOff(9);
  hints(['Gió lặng rồi. Cuối hành lang sáng hơn.', 'Lối xuống cầu thang.', 'Chạm vào khoảng sáng cuối hành lang.']);
}
// lật mặt đêm 2: phòng anh tối, chưa ai về; chỉ bể cá sáng
function flipToAnh2(done) { ANH.mode = 2; ANH.done = done; ANH.dur = 17; go('anh1', 1200); }
function endRoom2() { const t = ac.currentTime; for (let i = 0; i < 5; i++) FX.step(t + 0.2 + i * 0.5, i % 2 ? 0.2 : -0.2); P2.on = false; if (hallG) ramp(hallG.gain, 0, 2); go('end2', 1400); }
SC.end2 = { draw(c) { c.fillStyle = '#000'; c.fillRect(-300, -300, W + 600, H + 600); text(c, '(hết phòng 2 · phòng 3 cầu thang đang làm)', W / 2, H / 2, 28, 0.5); } };

// nối từ phòng 1: bước qua cánh cửa ra hành lang
endRoom1 = function () { const t = ac.currentTime; for (let i = 0; i < 3; i++) FX.step(t + 0.2 + i * 0.5, i % 2 ? 0.2 : -0.2); nz(t + 0.1, 0.6, 'bandpass', 300, 1.2, 0.3); setTimeout(() => { startHall(); go('hall', 1400); }, 1200); go('qua', 600); };
SC.qua = { draw(c) { c.fillStyle = '#000'; c.fillRect(-300, -300, W + 600, H + 600); } };

// thử nhanh: ?phong=2 bỏ qua phòng 1, vào thẳng hành lang (có sẵn đồ phòng 1 trong túi)
if (new URLSearchParams(location.search).get('phong') === '2') {
  const st0 = START;
  START = () => { st0(); INTRO.t = 9; setTimeout(() => { Object.assign(P1, { torch: true, unlocked: true, noteSeen: true, strip: true, tuOpen: true, may: true, tai: true, open: true, bang: true, done: true, calm: true, calmT: 9 }); bagAdd('strip', 'dải ảnh', STRIP_DRAW); bagAdd('may', 'máy cát-sét', (c, s) => drawMiniWalkman(c, s * 0.72)); bagAdd('tai', 'tai nghe', drawEarbuds); endRoom1(); }, 300); };
}
