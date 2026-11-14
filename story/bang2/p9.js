// ================= KHUÔN 100 · hai hình nhân giấy, hai nửa khuôn gỗ =================
// Mỗi phía giữ hình nhân của người kia và nửa khuôn của chính mình:
//   phía em: hộp sắt cầu thang → hình nhân chàng trai; khe bức tường → nửa khuôn trái (khoét dáng cô gái)
//   phía anh: lưng radio đình → hình nhân cô gái; ngăn bàn đá → nửa khuôn phải (khoét dáng chàng trai)
// Đọc thư xong: ghép hai nửa khuôn (số 100 liền lại ở giữa), đặt mỗi hình nhân vào đúng dáng của nó.
// Đặt hình nhân cuối cùng: khuôn bừng sáng, nhạc vào, phim bắt đầu (chính tay em đặt mảnh cuối).
const P9 = { has: {}, placed: {}, sel: null, glow: 0, done: false, hintKey: '', shake: { id: null, t: 0 } };
const ITEM9 = {
  nhan_anh: { label: 'hình nhân chàng trai', say: 'Kẹp trong đó còn một hình nhân giấy cắt hình một chàng trai, có dây buộc.' },
  khuon_nu: { label: 'nửa khuôn trái', say: 'Rơi ra cùng là nửa tấm khuôn gỗ, khoét hình một cô gái.' },
  nhan_em: { label: 'hình nhân cô gái', say: 'Trên bàn của anh, một hình nhân giấy cắt hình cô gái tóc buộc.' },
  khuon_nam: { label: 'nửa khuôn phải', say: 'Dưới mảnh giấy là nửa tấm khuôn gỗ, khoét hình một chàng trai.' },
};
const PAIR9 = { 0: 'nhan_anh', 1: 'khuon_nu', 3: 'khuon_nam' }; // hình nhân cô gái không đi theo mảnh giấy: nó nằm trên bàn của anh (DESK9)
const DESK9 = { x: 1268, y: 468 }; // trên mặt bàn, bên phải khuôn, dưới ánh đèn
const ORDER9 = ['khuon_nu', 'khuon_nam', 'nhan_em', 'nhan_anh'];
const PAPER9 = '#ece3cf';
// dáng đứng yên của hình nhân trong khuôn: cô gái nhìn sang phải, chàng trai nhìn sang trái (nhìn nhau)
const fig9 = (g, her, x, base, H) => puppet(g, { her, H, base, x, fx: her ? 1 : -1, t: 0 });
function drawPuppetPaper(c, her, x, base, H) { c.save(); c.fillStyle = PAPER9; c.strokeStyle = PAPER9; fig9(c, her, x, base, H); c.restore(); }
// ---- hai nửa khuôn gỗ, nướng sẵn ----
const HALF = { w: 280, h: 420 }, HALF9 = {};
function bakeHalf(side) {
  const k = 2, cv2 = document.createElement('canvas'); cv2.width = HALF.w * k; cv2.height = HALF.h * k; const g = cv2.getContext('2d'); g.scale(k, k);
  const wg = g.createLinearGradient(0, 0, HALF.w, HALF.h); wg.addColorStop(0, '#7e5634'); wg.addColorStop(1, '#4b2f1b'); g.fillStyle = wg; roundRect(g, side === 'nu' ? 0 : -20, 0, HALF.w + 20, HALF.h, 18); g.fill();
  for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(30,16,8,${0.08 + (i % 4) * 0.03})`; g.lineWidth = 1 + (i % 3); g.beginPath(); const y = 8 + i * 16; g.moveTo(0, y); g.bezierCurveTo(90, y + Math.sin(i) * 8, 190, y - Math.cos(i * 1.3) * 8, HALF.w, y + 4); g.stroke(); } // vân gỗ
  g.strokeStyle = 'rgba(255,220,170,.18)'; g.lineWidth = 2; g.strokeRect(6, 6, HALF.w - 12, HALF.h - 12);
  // khoét dáng người
  const her = side === 'nu', cx = her ? 120 : HALF.w - 120, H = 300, base = HALF.h - 40;
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = 'rgba(0,0,0,0)'; fig9(g, her, cx, base, H); g.restore();
  g.save(); g.globalCompositeOperation = 'destination-over'; const hg = g.createRadialGradient(cx, base - H * 0.5, 10, cx, base - H * 0.5, H * 0.6); hg.addColorStop(0, '#2a180c'); hg.addColorStop(1, '#140b05'); g.fillStyle = hg; g.fillRect(0, 0, HALF.w, HALF.h); g.restore();
  // số 100 khắc chìm ngay đường ghép: nửa trái "10", nửa phải "0"
  g.font = `600 64px Fraunces, Georgia, serif`; g.textBaseline = 'middle';
  const sx = her ? HALF.w - 1 : 3, al = her ? 'right' : 'left', tx = her ? '10' : '0';
  g.textAlign = al; g.fillStyle = 'rgba(255,225,180,.16)'; g.fillText(tx, sx + 1.5, 64 + 1.5); g.fillStyle = 'rgba(28,14,6,.85)'; g.fillText(tx, sx, 64);
  HALF9[side] = cv2;
}
const SEAM = { x: 800, y: 175 }; // đường ghép giữa hai nửa, mép trên khuôn
const halfRect = (side) => ({ x: side === 'nu' ? SEAM.x - HALF.w : SEAM.x, y: SEAM.y, w: HALF.w, h: HALF.h });
const trayX = (i) => 520 + i * 186, TRAY_Y = 730;
function drawItem9(c, id, x, y, s) {
  if (id === 'nhan_anh' || id === 'nhan_em') { c.save(); c.translate(x, y); c.scale(s, s); drawPuppetPaper(c, id === 'nhan_em', 0, 60, 150); c.strokeStyle = 'rgba(236,227,207,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(id === 'nhan_em' ? 2 : -2, -78); c.lineTo(0, -120); c.stroke(); c.restore(); }
  else { const side = id === 'khuon_nu' ? 'nu' : 'nam'; if (!HALF9[side]) bakeHalf(side); c.drawImage(HALF9[side], x - HALF.w * s / 2, y - HALF.h * s / 2, HALF.w * s, HALF.h * s); }
}
function khuonHints() {
  const both = P9.placed.khuon_nu && P9.placed.khuon_nam; let k, L;
  if (!P9.has.nhan_em) { k = 'kx'; L = ['Đây là bàn của anh. Trên bàn còn một thứ.', 'Dưới ngọn đèn, bên phải chiếc khuôn.', 'Chạm vào hình nhân giấy nằm trên mặt bàn.']; }
  else if (!both) { k = 'k0'; L = ['Hai nửa khuôn gỗ và hai hình nhân em mang theo.', 'Mỗi nửa khuôn có một chỗ của nó.', 'Chạm một nửa khuôn dưới khay, rồi chạm vào chỗ của nó trên bàn.']; }
  else { k = 'k1'; L = ['Mỗi chỗ khoét vừa đúng một dáng người.', 'Hình nhân nào vừa với chỗ nào?', 'Cô gái tóc buộc vào chỗ khoét dáng cô gái, chàng trai vào chỗ còn lại.']; }
  if (P9.hintKey !== k) { P9.hintKey = k; hints(L); }
}
SC.khuon = {
  noBag: true, tapBelow: true, hintY: 640,
  enter() { ['nu', 'nam'].forEach((s) => HALF9[s] || bakeHalf(s)); FX.cloth(); HINT.off = false; khuonHints(); nudge(); },
  draw(c, now, dt) {
    // căn phòng nhỏ sau cánh cửa: một ngọn đèn vàng rọi xuống mặt bàn gỗ
    c.fillStyle = '#0a0705'; c.fillRect(-300, -300, W + 600, H + 600);
    const tg = c.createLinearGradient(0, 120, 0, H); tg.addColorStop(0, '#2b1c12'); tg.addColorStop(1, '#170e08'); c.fillStyle = tg; c.fillRect(-300, 120, W + 600, H + 300);
    for (let i = 0; i < 9; i++) { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-300, 160 + i * 90); c.lineTo(W + 300, 150 + i * 92); c.stroke(); } // ván bàn
    const lg = c.createRadialGradient(800, 330, 30, 800, 400, 760); lg.addColorStop(0, `rgba(255,200,130,${0.3 + 0.35 * P9.glow})`); lg.addColorStop(1, 'rgba(255,170,90,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = lg; c.fillRect(-300, -300, W + 600, H + 600); c.restore();
    // chỗ đặt hai nửa khuôn (viền mờ)
    ['nu', 'nam'].forEach((side) => { const r = halfRect(side), id = side === 'nu' ? 'khuon_nu' : 'khuon_nam';
      if (!P9.placed[id]) { c.strokeStyle = 'rgba(255,220,170,.16)'; c.setLineDash([10, 10]); c.lineWidth = 2; roundRect(c, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 16); c.stroke(); c.setLineDash([]); return; }
      const sh = P9.shake.id === id ? Math.sin((now - P9.shake.t) * 0.05) * 6 * Math.max(0, 1 - (now - P9.shake.t) / 500) : 0;
      c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(r.x + 10, r.y + 14, r.w, r.h); c.drawImage(HALF9[side], r.x + sh, r.y, r.w, r.h); });
    // hình nhân đã đặt vào chỗ khoét
    const keep9 = P9.doneAt ? 1 - sstep(1.7, 2.2, (now - P9.doneAt) / 1000) : 1; // lúc dây rối bắt vào: hình nhân giấy tĩnh nhường chỗ cho hình nhân cử động
    if (keep9 > 0) { c.save(); c.globalAlpha *= keep9;
      if (P9.placed.nhan_em) drawPuppetPaper(c, true, SEAM.x - HALF.w + 120, SEAM.y + HALF.h - 40, 300);
      if (P9.placed.nhan_anh) drawPuppetPaper(c, false, SEAM.x + HALF.w - 120, SEAM.y + HALF.h - 40, 300); c.restore(); }
    // hình nhân cô gái nằm sẵn trên bàn của anh, chưa nhặt
    if (!P9.has.nhan_em) { c.save(); c.translate(DESK9.x + 8, DESK9.y + 12); c.rotate(-1.38); c.globalAlpha *= 0.3; c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, 4, 26, 78, 0, 0, Math.PI * 2); c.fill(); c.restore(); c.save(); c.translate(DESK9.x, DESK9.y); c.rotate(-1.38); drawItem9(c, 'nhan_em', 0, 0, 0.95); c.restore(); }
    // khay: những món chưa đặt
    ORDER9.forEach((id, i) => { if (P9.placed[id] || !P9.has[id]) return; const x = trayX(i), up = P9.sel === id ? -14 : 0;
      if (P9.sel === id) { const g = c.createRadialGradient(x, TRAY_Y + up, 8, x, TRAY_Y + up, 110); g.addColorStop(0, 'rgba(255,214,160,.25)'); g.addColorStop(1, 'rgba(255,214,160,0)'); c.fillStyle = g; c.fillRect(x - 110, TRAY_Y - 110 + up, 220, 220); }
      drawItem9(c, id, x, TRAY_Y + up - 6, id.startsWith('khuon') ? 0.34 : 0.9); });
    // xong: khuôn bừng sáng từ các chỗ khoét và số 100
    if (P9.done) { P9.glow = Math.min(1, P9.glow + dt / 1.6); c.save(); c.globalCompositeOperation = 'lighter';
      [[SEAM.x - HALF.w + 120, SEAM.y + HALF.h * 0.55], [SEAM.x + HALF.w - 120, SEAM.y + HALF.h * 0.55], [SEAM.x, SEAM.y + 64]].forEach(([x, y], i) => { const r = (i === 2 ? 140 : 260) * (0.6 + 0.4 * P9.glow), g = c.createRadialGradient(x, y, 4, x, y, r); g.addColorStop(0, `rgba(255,222,160,${0.55 * P9.glow})`); g.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); });
      c.restore(); }
    if (P9.doneAt) drawLift9(c, now, (now - P9.doneAt) / 1000);
    vignette(c, 0.7);
  },
  tap(p) {
    if (P9.done) return;
    if (!P9.has.nhan_em && Math.abs(p[0] - DESK9.x) < 130 && Math.abs(p[1] - DESK9.y) < 90) { P9.has.nhan_em = true; FX.paper(); sayNow(ITEM9.nhan_em.say); khuonHints(); nudge(); return; }
    for (let i = 0; i < ORDER9.length; i++) { const id = ORDER9[i]; if (P9.placed[id] || !P9.has[id]) continue; if (Math.abs(p[0] - trayX(i)) < 85 && Math.abs(p[1] - TRAY_Y) < 90) { P9.sel = P9.sel === id ? null : id; FX.pick(); return; } }
    if (!P9.sel) return;
    const id = P9.sel, inL = inR(p, halfRect('nu')), inRt = inR(p, halfRect('nam'));
    if (!inL && !inRt) return;
    const want = { khuon_nu: 'L', khuon_nam: 'R', nhan_em: 'L', nhan_anh: 'R' }[id], ok = (want === 'L' && inL) || (want === 'R' && inRt);
    if (id.startsWith('nhan') && !(P9.placed.khuon_nu && P9.placed.khuon_nam)) { sayNow('Ghép khuôn trước đã.'); return; }
    if (!ok) { // không vừa: nửa khuôn/hình nhân trượt về khay, không nói thêm
      const t = ac.currentTime; nz(t, 0.12, 'lowpass', 260, 1, 0.5); P9.shake = { id: id.startsWith('khuon') ? (want === 'L' ? 'khuon_nam' : 'khuon_nu') : (want === 'L' ? 'khuon_nam' : 'khuon_nu'), t: performance.now() }; P9.sel = null;
      missHint('khuon', ['Không vừa.', 'Mỗi chỗ chỉ vừa một thứ.', 'Nhìn dáng khoét trên khuôn: tóc buộc là cô gái.'], 1); return; }
    P9.placed[id] = true; P9.sel = null; const t = ac.currentTime;
    if (id.startsWith('khuon')) { nz(t, 0.25, 'lowpass', 180, 1, 1); FX.click(t + 0.05, 0.9);
      if (P9.placed.khuon_nu && P9.placed.khuon_nam) setTimeout(() => { const t2 = ac.currentTime; FX.latch(); tone(t2 + 0.2, 392, 392, 0.012, 1.8); khuonHints(); sayNow('Hai nửa khớp vào nhau. Số 100 liền lại ở giữa.'); }, 350); }
    else { FX.paper(); tone(t + 0.1, id === 'nhan_em' ? 587.33 : 493.88, id === 'nhan_em' ? 587.33 : 493.88, 0.012, 1.6); }
    if (P9.placed.nhan_em && P9.placed.nhan_anh) { // mảnh cuối cùng: khuôn bừng sáng, phim bắt đầu ngay trong cú chạm này (âm thanh cần cú chạm của người chơi)
      P9.done = true; HINT.text = ''; HINT.off = true; const t3 = ac.currentTime; [392, 493.88, 587.33, 783.99].forEach((f, i) => tone(t3 + i * 0.18, f, f, 0.014, 2.2));
      P9.doneAt = performance.now(); setTimeout(() => FX.paper(), 1900); startKet(4700); }
  },
};
// ---- mở màn: bốn sợi dây rối thả xuống bắt vào hai hình nhân; hai hình nhân nhấc khỏi khuôn, khẽ nghiêng về phía nhau, rồi theo dây bay lên (vào phim) ----
let LIFT9 = null;
function drawLift9(c, now, d) {
  if (d < 0.6) return;
  if (!LIFT9) LIFT9 = layer(); const [lc, m] = LIFT9; if (lc.width !== cv.width || lc.height !== cv.height) { lc.width = cv.width; lc.height = cv.height; }
  m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, lc.width, lc.height);
  const drop = sstep(0.7, 1.9, d), up = sstep(1.9, 3.3, d), lean = sstep(2.6, 3.9, d), fly = sstep(3.6, 6.4, d), show = sstep(1.6, 2.1, d), tt = Math.max(0, d - 1.9);
  const anchors = [];
  if (show > 0) { setT(m); m.fillStyle = '#fff'; m.strokeStyle = '#fff';
    [[true, SEAM.x - HALF.w + 120, 1], [false, SEAM.x + HALF.w - 120, -1]].forEach(([her, x0, fx]) => {
      const x = x0 + fx * (46 * lean + 30 * fly), base = SEAM.y + HALF.h - 40 - 30 * up - 760 * fly * fly + Math.sin(tt * 1.7 + (her ? 0 : 1.3)) * 4 * up;
      const r = puppet2(m, { her, H: 300, base, x, fx, t: tt, still: 1 - up, air: 0.5 * fly, look: her ? 0.08 * lean : -0.05 * lean, lean: 0.05 * lean, open: 0.25 * up });
      if (r && r.anchors) anchors.push(...r.anchors); }); }
  else { // dây thả xuống trước khi hình nhân động: điểm buộc lấy từ dáng nằm im
    setT(m); [[true, SEAM.x - HALF.w + 120, 1], [false, SEAM.x + HALF.w - 120, -1]].forEach(([her, x0, fx]) => { const r = puppet2(m, { her, H: 300, base: SEAM.y + HALF.h - 40, x: x0, fx, t: 0, still: 1 }); if (r && r.anchors) anchors.push(...r.anchors); });
    m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, lc.width, lc.height); }
  m.setTransform(1, 0, 0, 1, 0, 0);
  if (show > 0) {
    const sh = (3 + 8 * up) * S * dpr; // bóng in xuống mặt bàn: hình nhân càng nhấc cao bóng càng lệch
    m.globalCompositeOperation = 'source-in'; m.fillStyle = 'rgb(8,4,2)'; m.fillRect(0, 0, lc.width, lc.height);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha *= 0.32 * show * (1 - fly); c.drawImage(lc, sh * 0.5, sh); c.restore();
    m.fillStyle = PAPER9; m.fillRect(0, 0, lc.width, lc.height); m.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha *= show; c.drawImage(lc, 0, 0); c.restore();
  }
  if (drop > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.strokeStyle = 'rgba(236,227,207,.5)'; c.lineWidth = Math.max(1, dpr);
    anchors.forEach(([ax, ay], i) => { const sw = Math.sin(now * 0.0011 + i * 1.9) * 5 * dpr * (1 - drop * 0.6), ey = ay * drop - (1 - drop) * 20; c.beginPath(); c.moveTo(ax + sw, -10); c.lineTo(ax, ey); c.stroke(); }); c.restore(); }
  // ánh sáng ấm từ trên rọi xuống theo dây (như ngọn đèn lồng đang chờ hai hình nhân)
  const lg = sstep(2.8, 5.6, d); if (lg > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(800, -40, 20, 800, -40, 620); gg.addColorStop(0, `rgba(255,214,150,${0.45 * lg})`); gg.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = gg; c.fillRect(-300, -300, W + 600, H + 600); c.restore(); }
}
// mỗi lần nhặt một mảnh bản đồ, món đi kèm nằm cùng chỗ
const manhAdd5 = manhAdd;
manhAdd = function (i) { const had = P5.manh[i]; manhAdd5(i); const id = PAIR9[i]; if (!had && id && !P9.has[id]) { P9.has[id] = true; bagAdd(id, ITEM9[id].label, (c, s) => drawItem9(c, id, 0, 0, (id.startsWith('khuon') ? 0.3 : 0.55) * s)); if (!P9.quiet) setTimeout(() => sayNow(ITEM9[id].say), 2600); } };
// đọc thư xong: sang bàn ghép khuôn (thay vì vào phim ngay)
const thuTap9 = SC.thu.tap;
SC.thu.tap = function (p) { if (TH.shown >= THU.length && TH.sig >= 1 && !TH.done) { TH.done = true; go('khuon', 1600); return; } thuTap9.call(this, p); };
// đang ở bàn ghép thì phim bắt đầu từ chính cảnh này: khuôn còn sáng trong lúc phim hiện dần
// thử nhanh: ?phong=9 (bàn ghép khuôn, đủ đồ) · ?phong=7 (thư rồi khuôn) cũng cho đủ đồ
{ const q9 = new URLSearchParams(location.search).get('phong');
  if (q9 === '9' || q9 === '7') { const st9 = START; START = () => { st9(); if (q9 === '9') { INTRO.t = 9; Object.assign(P1, { torch: true, calm: true, calmT: 9, done: true }); } setTimeout(() => { P9.quiet = true; [0, 1, 2, 3].forEach((i) => manhAdd(i)); P9.quiet = false; HINT.text = ''; if (q9 === '9') { HINT.off = false; go('khuon', 600); } }, 450); }; } }
