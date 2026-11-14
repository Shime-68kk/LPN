'use strict';
// PHÒNG 1 · ĐÊM MƯA 9/11 (bản sâu). Câu hỏi của em: "Anh đặt em ở mức nào?"
// Mở đầu bằng điện thoại của em (ba ghi chú + ghi chú thứ tư của anh: luật chơi), rồi phòng ngủ tối, soi bằng đèn điện thoại.
// Chuỗi giải: gối → câu hỏi · quân phục → dải ảnh Sa Pa (mặt sau "20/10 · đỉnh") · gầm giường → vali khoá "____ m"
//             · cửa sổ: lau hơi nước + chờ chớp mới đọc được từng số trên cột mốc → 3143 → băng 9/11.

// ---------- phối cảnh phòng (mét) ----------
const CAM = { y: 1.05 }, F = 820, VX = 720, VY = 400;
const P = (x, y, z) => [VX + (F * x) / z, VY + (F * (CAM.y - y)) / z];
const ROOM = { l: -2.9, r: 2.6, back: 10, top: 3.1 }, WINW = { x0: -0.4, x1: 1.6, y0: 0.95, y1: 2.3 }, LIGHT = [-0.2, -0.42, -1];
const BED = { x0: 0.55, x1: 1.5, z0: 2.2, z1: 4.2 };
function poly(c, pts, fill) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = fill; c.fill(); }
function seg(c, a, b, w, col) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0] + (rnd() - 0.5) * 0.6, a[1] + (rnd() - 0.5) * 0.6); c.lineTo(b[0] + (rnd() - 0.5) * 0.6, b[1] + (rnd() - 0.5) * 0.6); c.stroke(); }
const lit = (x, z) => Math.max(0.15, 1 - Math.hypot(x - 1.0, (z - 8.6) * 0.55) / 7);
function tube3(c, a, b, r, k) { const A = P(...a), B = P(...b), z = (a[2] + b[2]) / 2, w = Math.max(1.2, (F * r) / z); seg(c, A, B, w, `rgb(${18 + 10 * k},${26 + 12 * k},${24 + 12 * k})`); seg(c, [A[0] + w * 0.3, A[1]], [B[0] + w * 0.3, B[1]], Math.max(0.6, w * 0.3), `rgba(130,165,190,${0.15 + 0.35 * k})`); }
function box(c, x0, x1, y0, y1, z0, z1, col, k, edge) { const [r, gg, b] = col, sh = (m) => `rgb(${(r * m) | 0},${(gg * m) | 0},${(b * m) | 0})`; poly(c, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], sh(0.75 + 0.6 * k)); poly(c, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], sh(0.5 + 0.35 * k)); const sx = x1 < 0 ? x1 : x0; poly(c, [P(sx, y0, z0), P(sx, y0, z1), P(sx, y1, z1), P(sx, y1, z0)], sh(0.38 + 0.3 * k)); if (edge) seg(c, P(x0, y1, z0), P(x1, y1, z0), 1, `rgba(170,200,220,${0.12 + 0.3 * k})`); }
// ụ chăn của người đang ngủ (các bạn cùng phòng) — để thở được, vẽ động
const SLEEPERS = [];
function bunk(c, x0, x1, z0, z1, sleepers) {
  const k = lit((x0 + x1) / 2, (z0 + z1) / 2), r = 0.022, lowY = 0.42, upY = 1.55, topY = 1.92;
  box(c, x0 + 0.03, x1 - 0.03, lowY - 0.08, lowY, z0 + 0.03, z1 - 0.03, [92, 90, 78], k, true);
  box(c, x0 + 0.03, x1 - 0.03, upY - 0.08, upY, z0 + 0.03, z1 - 0.03, [92, 90, 78], k * 0.8, true);
  [[lowY, k], [upY, k * 0.8]].forEach(([yy, kk], i) => {
    box(c, x1 - 0.55, x1 - 0.12, yy, yy + 0.07, z0 + 0.15, z0 + 0.55, [76, 74, 66], kk * 0.9, false);
    if (sleepers && sleepers[i]) SLEEPERS.push({ x0: x0 + 0.1, x1: x1 - 0.1, y: yy, z0: z0 + 0.4, z1: z1 - 0.2, k: kk, ph: Math.random() * 6 });
    else { const bx0 = x0 + 0.18, bx1 = x0 + 0.6; box(c, bx0, bx1, yy, yy + 0.16, z1 - 0.55, z1 - 0.12, [44, 60, 44], kk, true); }
  });
  [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([x, z]) => tube3(c, [x, 0, z], [x, topY, z], r, k));
  [lowY - 0.08, upY - 0.08, topY].forEach((yy) => { tube3(c, [x0, yy, z0], [x1, yy, z0], r * 0.8, k); tube3(c, [x0, yy, z1], [x1, yy, z1], r * 0.8, k); tube3(c, [x0, yy, z0], [x0, yy, z1], r * 0.8, k); tube3(c, [x1, yy, z0], [x1, yy, z1], r * 0.8, k); });
  for (let i = 0; i < 4; i++) tube3(c, [x1, 0.62 + i * 0.24, z0], [x1, 0.62 + i * 0.24, z0 + 0.32], 0.012, k);
}
const [roomC, roomG] = layer(), [darkC, darkG] = layer(), [fogC, fogG] = layer();
let WR = null; const HOT = {};
function bakeRoom() {
  roomC.width = cv.width; roomC.height = cv.height; seed = 11; SLEEPERS.length = 0;
  const c = roomG; setT(c); const { l, r, back, top } = ROOM, near = 0.6;
  poly(c, [P(l, top, near), P(r, top, near), P(r, top, back), P(l, top, back)], '#07090c');
  poly(c, [P(l, 0, near), P(l, top, near), P(l, top, back), P(l, 0, back)], '#0d1217');
  poly(c, [P(r, 0, near), P(r, top, near), P(r, top, back), P(r, 0, back)], '#0b0f13');
  poly(c, [P(l, 0, back), P(r, 0, back), P(r, top, back), P(l, top, back)], '#121a21');
  poly(c, [P(l, 0, near), P(r, 0, near), P(r, 0, back), P(l, 0, back)], '#0a0d10');
  for (let i = 0; i < 3500; i++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.03})`; c.fillRect(rnd() * W, rnd() * H, 2, 2); }
  for (let x = l; x <= r; x += 0.5) seg(c, P(x, 0, near), P(x, 0, back), 0.7, 'rgba(140,160,175,.05)');
  for (let z = 1; z <= back; z += 0.5) seg(c, P(l, 0, z), P(r, 0, z), 0.7, 'rgba(140,160,175,.05)');
  // vết mưa thấm loang dưới bậu cửa sổ
  const st0 = P(WINW.x0 + 0.2, WINW.y0 - 0.05, back); for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.ellipse(st0[0] + i * 14, st0[1] + 20 + i * 9, 18, 40 + i * 6, 0, 0, Math.PI * 2); c.fill(); }
  // cửa ra (tường cuối, bên trái cửa sổ)
  const d0 = P(-1.6, 0, back), d1 = P(-0.7, 2.1, back); c.fillStyle = '#0d1318'; c.fillRect(d0[0], d1[1], d1[0] - d0[0], d0[1] - d1[1]); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2; c.strokeRect(d0[0], d1[1], d1[0] - d0[0], d0[1] - d1[1]);
  HOT.door = { x: d0[0] - 20, y: d1[1] - 20, w: d1[0] - d0[0] + 40, h: d0[1] - d1[1] + 40, x0: d0[0], x1: d1[0], y0: d0[1] };
  // cửa sổ
  const a = P(WINW.x0, WINW.y1, back), b = P(WINW.x1, WINW.y0, back); WR = { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] };
  c.fillStyle = '#1b252b'; c.fillRect(WR.x - 6, WR.y - 6, WR.w + 12, WR.h + 12);
  let gr = c.createLinearGradient(0, WR.y, 0, WR.y + WR.h); gr.addColorStop(0, '#0d1824'); gr.addColorStop(1, '#1a2a38'); c.fillStyle = gr; c.fillRect(WR.x, WR.y, WR.w, WR.h);
  c.fillStyle = '#04070a'; c.beginPath(); c.moveTo(WR.x, WR.y + WR.h * 0.86); for (let i = 0; i <= 16; i++) c.lineTo(WR.x + (WR.w * i) / 16, WR.y + WR.h * (0.74 + Math.sin(i * 0.8) * 0.05)); c.lineTo(WR.x + WR.w, WR.y + WR.h); c.lineTo(WR.x, WR.y + WR.h); c.fill();
  c.fillStyle = '#1e292f'; c.fillRect(WR.x + WR.w / 2 - 2.5, WR.y, 5, WR.h); c.fillRect(WR.x, WR.y + WR.h / 2 - 2.5, WR.w, 5);
  gr = c.createRadialGradient(WR.x + WR.w / 2, WR.y + WR.h / 2, WR.w * 0.4, WR.x + WR.w / 2, WR.y + WR.h / 2, WR.w * 3); gr.addColorStop(0, 'rgba(110,150,185,.16)'); gr.addColorStop(1, 'rgba(110,150,185,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
  const floorHit = (x, y) => { const t = y / -LIGHT[1]; return [x + LIGHT[0] * t, 0, back + LIGHT[2] * t]; };
  const fp = [floorHit(WINW.x0, WINW.y0), floorHit(WINW.x1, WINW.y0), floorHit(WINW.x1, WINW.y1), floorHit(WINW.x0, WINW.y1)].map((q) => P(...q));
  c.save(); c.globalCompositeOperation = 'lighter'; gr = c.createLinearGradient(0, fp[0][1], 0, fp[2][1]); gr.addColorStop(0, 'rgba(90,125,155,.16)'); gr.addColorStop(1, 'rgba(90,125,155,.03)'); poly(c, fp, gr); c.restore();
  // giường tầng: các bạn đang ngủ
  bunk(c, l + 0.05, l + 0.95, 7.2, 9.2, [true, true]); bunk(c, l + 0.05, l + 0.95, 4.6, 6.6, [true, false]); bunk(c, r - 0.95, r - 0.05, 6.4, 8.4, [false, true]);
  const { x0: ex0, x1: ex1, z0: ez0, z1: ez1 } = BED;
  // vali dưới gầm giường em
  box(c, ex0 + 0.12, ex1 - 0.15, 0.02, 0.24, ez0 + 0.15, ez0 + 0.75, [30, 34, 40], 0.55, true);
  const lk = P(ex0 + 0.38, 0.16, ez0 + 0.15), sc = F / (ez0 + 0.15); c.fillStyle = '#0c0e11'; c.fillRect(lk[0] - 2, lk[1] - 1, sc * 0.2, sc * 0.05);
  for (let i = 0; i < 4; i++) { c.fillStyle = '#2d3238'; c.fillRect(lk[0] + i * sc * 0.04, lk[1], sc * 0.032, sc * 0.04); }
  c.fillStyle = 'rgba(225,230,235,.6)'; c.font = `italic ${Math.round(sc * 0.032)}px serif`; c.fillText('m', lk[0] + sc * 0.165, lk[1] + sc * 0.032);
  const s0 = P(ex0 + 0.12, 0.24, ez0 + 0.15), s1 = P(ex1 - 0.15, 0.02, ez0 + 0.15); HOT.vali = { x: s0[0], y: s0[1] - 10, w: s1[0] - s0[0], h: s1[1] - s0[1] + 20 };
  // tủ sắt cá nhân sát tường phải (vẽ trước giường em để thanh giường che lên)
  { const k = lit(2.25, 4.95), x0 = 1.95, x1 = 2.55, z0 = 4.6, z1 = 5.3, top = 1.8;
    box(c, x0, x1, 0, top, z0, z1, [62, 70, 76], k, true);
    const f = (x, y) => P(x, y, z0);
    for (let i = 0; i < 4; i++) seg(c, f(x0 + 0.12, 1.6 - i * 0.06), f(x1 - 0.12, 1.6 - i * 0.06), 1.4, 'rgba(0,0,0,.45)'); // khe thông gió
    seg(c, f(x0 + 0.02, 0.05), f(x0 + 0.02, top - 0.04), 1, 'rgba(170,200,220,.12)');
    const lk = f(x0 + 0.08, 0.98); c.fillStyle = '#20262b'; c.fillRect(lk[0] - 5, lk[1] - 4, 12, 16); c.strokeStyle = '#4a535a'; c.lineWidth = 2; c.beginPath(); c.arc(lk[0] + 1, lk[1] - 4, 4, Math.PI, 0); c.stroke();
    const n0 = f(x0 + 0.22, 1.36), n1 = f(x0 + 0.46, 1.16); c.save(); c.translate(n0[0], n0[1]); c.rotate(0.06); c.fillStyle = 'rgba(230,222,190,.75)'; c.fillRect(0, 0, n1[0] - n0[0], n1[1] - n0[1]); c.restore(); // mẩu giấy dán
    const a0 = f(x0, top), a1 = f(x1, 0); HOT.tu = { x: a0[0] - 14, y: a0[1], w: a1[0] - a0[0] + 28, h: a1[1] - a0[1] }; }
  bunk(c, ex0, ex1, ez0, ez1, null);
  // gối em (có mảnh giấy bên dưới), chăn gấp vuông
  const pw = P(ex1 - 0.33, 0.47, ez0 + 0.35); HOT.pillow = { x: pw[0] - 90, y: pw[1] - 40, w: 180, h: 80 };
  // bộ quân phục treo ở đầu giường (gần máy quay, cột bên trái giường em)
  const hk = P(ex1 + 0.02, 1.62, ez0); HOT.uniform = { x: hk[0] - 90, y: hk[1], w: 180, h: 260, at: hk }; // treo ở cột đầu giường gần máy quay
  // điện thoại em trên đệm
  const ph = P(ex0 + 0.5, 0.43, ez0 + 0.9); HOT.phone = { x: ph[0] - 60, y: ph[1] - 40, w: 120, h: 70, at: ph };
  HOT.win = { x: WR.x - 10, y: WR.y - 10, w: WR.w + 20, h: WR.h + 20 };
  for (let i = 0; i < 12000; i++) { c.fillStyle = `rgba(255,255,255,${rnd() * 0.022})`; c.fillRect(rnd() * W, rnd() * H, 1.2, 1.2); }
  vignette(c, 0.78);
  darkC.width = cv.width; darkC.height = cv.height;
}
// quân phục treo (vẽ động để lay nhẹ khi chạm)
function drawUniform(c, at, sway) {
  c.save(); c.translate(at[0], at[1]); c.rotate(sway);
  c.strokeStyle = '#2a2a26'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 14); c.moveTo(-60, 40); c.lineTo(0, 14); c.lineTo(60, 40); c.stroke();
  c.fillStyle = '#3d4a33'; c.beginPath(); c.moveTo(-62, 40); c.lineTo(62, 40); c.lineTo(78, 120); c.lineTo(58, 124); c.lineTo(54, 230); c.lineTo(-54, 230); c.lineTo(-58, 124); c.lineTo(-78, 120); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 40); c.lineTo(0, 230); c.stroke();
  c.fillStyle = '#35412c'; c.fillRect(-46, 86, 34, 30); c.fillRect(12, 86, 34, 30); // túi ngực
  c.strokeStyle = 'rgba(0,0,0,.4)'; c.strokeRect(-46, 86, 34, 30); c.strokeRect(12, 86, 34, 30);
  if (!P1.strip) { c.fillStyle = '#e9e4da'; c.fillRect(18, 80, 10, 10); } // mép dải ảnh ló khỏi túi
  c.restore();
}

// ---------- trạng thái phòng 1 ----------
const P1 = { unlocked: false, pin: '', pinBad: -9, tuCode: [0, 0, 0, 0], tuOpen: false, may: false, tai: false, bang: false, hintKey: '', torch: false, tp: [800, 520], noteSeen: false, strip: false, code: [0, 0, 0, 0], open: false, lid: 0, done: false, calm: false, calmT: 0, sway: 0, flash: -99, nextFlash: 9, wipeT: 0, drag: null, sleepT: {} };
let rainG = null, bedG = null, bedLP = null, sleepG = null;

SC.dorm = {
  bake: bakeRoom,
  enter() { roomHints(); nudge(); },
  draw(c, now, dt) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(roomC, 0, 0); setT(c);
    // mưa trên kính
    c.save(); c.beginPath(); c.rect(WR.x, WR.y, WR.w, WR.h); c.clip(); c.strokeStyle = 'rgba(170,200,225,.2)'; c.lineWidth = 0.7; c.beginPath();
    for (let i = 0; i < (P1.calm ? 12 : 40); i++) { const x = WR.x + Math.random() * WR.w, y = WR.y + Math.random() * WR.h; c.moveTo(x, y); c.lineTo(x - 2, y + 9); } c.stroke();
    c.fillStyle = 'rgba(150,170,185,.22)'; c.fillRect(WR.x, WR.y, WR.w, WR.h); c.restore();
    // các bạn đang ngủ: ụ chăn phồng xẹp theo hơi thở
    for (const s of SLEEPERS) { const br = 0.03 * Math.sin(now * 0.0011 + s.ph) + (P1.sleepT[s.ph] && now - P1.sleepT[s.ph] < 900 ? 0.05 * Math.sin((now - P1.sleepT[s.ph]) * 0.01) : 0); box(c, s.x0, s.x1, s.y, s.y + 0.18 + br, s.z0, s.z1, [44, 58, 46], s.k, false); }
    // quân phục, điện thoại
    if (P1.sway) P1.sway *= 0.94; drawUniform(c, HOT.uniform.at, Math.sin(now * 0.008) * P1.sway);
    const ph = HOT.phone.at; c.fillStyle = '#0c0d10'; c.fillRect(ph[0] - 34, ph[1] - 6, 68, 10);
    if (!P1.torch) { const k = 0.5 + 0.5 * Math.sin(now * 0.003); const gr = c.createRadialGradient(ph[0], ph[1], 2, ph[0], ph[1], 80); gr.addColorStop(0, `rgba(170,200,255,${0.4 * k})`); gr.addColorStop(1, 'rgba(170,200,255,0)'); c.fillStyle = gr; c.fillRect(ph[0] - 90, ph[1] - 90, 180, 180); }
    // cửa: khe sáng ấm sau khi nghe băng
    if (P1.calm && P1.calmT > 4) { const d = HOT.door, k = clamp((P1.calmT - 4) / 3, 0, 1) * (0.8 + 0.2 * Math.sin(now * 0.003)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,200,130,${0.7 * k})`; c.fillRect(d.x0, d.y0 - 4, d.x1 - d.x0, 4); const gr = c.createLinearGradient(0, d.y0, 0, d.y0 + 140); gr.addColorStop(0, `rgba(255,190,120,${0.22 * k})`); gr.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(d.x0, d.y0); c.lineTo(d.x1, d.y0); c.lineTo(d.x1 + 90, d.y0 + 140); c.lineTo(d.x0 - 60, d.y0 + 140); c.fill(); c.restore(); }
    // BÓNG TỐI: chỉ cửa sổ, chớp và đèn điện thoại soi được
    const dk = darkG; dk.setTransform(1, 0, 0, 1, 0, 0); dk.clearRect(0, 0, darkC.width, darkC.height); setT(dk);
    const fe = (now - P1.flash) / 1000, fl = fe >= 0 && fe < 0.6 ? (fe < 0.08 ? 1 : fe < 0.16 ? 0.25 : fe < 0.24 ? 0.8 : Math.max(0, 1 - (fe - 0.24) / 0.36) * 0.5) : 0;
    dk.fillStyle = `rgba(0,0,0,${(P1.calm ? 0.55 : 0.86) * (1 - 0.75 * fl)})`; dk.fillRect(-300, -300, W + 600, H + 600);
    dk.globalCompositeOperation = 'destination-out';
    let gr = dk.createRadialGradient(WR.x + WR.w / 2, WR.y + WR.h, 20, WR.x + WR.w / 2, WR.y + WR.h, 520); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dk.fillStyle = gr; dk.fillRect(-300, -300, W + 600, H + 600);
    if (P1.torch) { const [tx, ty] = P1.tp; gr = dk.createRadialGradient(tx, ty, 10, tx, ty, 190); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dk.fillStyle = gr; dk.fillRect(tx - 200, ty - 200, 400, 400); }
    if (P1.calm) { const at = P(BED.x0 + 0.4, 1.0, BED.z0 + 1); gr = dk.createRadialGradient(at[0], at[1], 10, at[0], at[1], 520); gr.addColorStop(0, `rgba(0,0,0,${0.6 * clamp(P1.calmT / 5, 0, 1)})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); dk.fillStyle = gr; dk.fillRect(-300, -300, W + 600, H + 600); }
    dk.globalCompositeOperation = 'source-over';
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(darkC, 0, 0); setT(c);
    if (fl > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(200,220,255,${0.5 * fl})`; c.fillRect(WR.x, WR.y, WR.w, WR.h); c.restore(); }
    if (P1.torch) { const [tx, ty] = P1.tp; c.save(); c.globalCompositeOperation = 'lighter'; gr = c.createRadialGradient(tx, ty, 5, tx, ty, 170); gr.addColorStop(0, 'rgba(255,240,215,.13)'); gr.addColorStop(1, 'rgba(255,240,215,0)'); c.fillStyle = gr; c.fillRect(tx - 180, ty - 180, 360, 360); c.restore(); }
    if (P1.calm) { const at = P(BED.x0 + 0.4, 1.0, BED.z0 + 1), k = clamp(P1.calmT / 5, 0, 1); c.save(); c.globalCompositeOperation = 'lighter'; gr = c.createRadialGradient(at[0], at[1], 10, at[0], at[1], 700); gr.addColorStop(0, `rgba(255,190,120,${0.2 * k})`); gr.addColorStop(1, 'rgba(255,170,100,0)'); c.fillStyle = gr; c.fillRect(-300, -300, W + 600, H + 600); c.restore(); P1.calmT += dt; }
    stormTick(now, dt, V.cur === 'win1' ? 0.45 : 1);
  },
  down(p) { if (P1.torch) { P1.tp = p; P1.drag = true; } return false; },
  move(p, b) { if (P1.torch && b) P1.tp = p; },
  up() { P1.drag = false; return false; },
  tap(p) {
    const lit2 = (r) => P1.torch && Math.hypot(P1.tp[0] - (r.x + r.w / 2), P1.tp[1] - (r.y + r.h / 2)) < 230;
    if (!P1.torch) { if (inR(p, HOT.phone)) { FX.pick(); go('phone1'); } else if (inR(p, HOT.win)) go('win1'); return; }
    if (P1.calm && P1.calmT > 4 && inR(p, HOT.door)) { endRoom1(); return; }
    if (inR(p, HOT.win)) { go('win1'); return; }
    if (inR(p, HOT.pillow) && lit2(HOT.pillow)) { FX.cloth(); go('note1'); return; }
    if (inR(p, HOT.uniform) && lit2(HOT.uniform)) { FX.cloth(); P1.sway = 0.08; go('uni1'); return; }
    if (inR(p, HOT.tu) && lit2(HOT.tu)) { FX.click(ac.currentTime, 0.6, 0.4); go(P1.tuOpen ? 'tuopen' : 'tu1'); return; }
    if (inR(p, HOT.vali) && lit2(HOT.vali)) { FX.pick(); go(P1.open ? 'open1' : 'lock1'); return; }
    if (inR(p, HOT.phone)) { FX.pick(); go('phone1'); return; }
    for (const s of SLEEPERS) { const a = P(s.x0, s.y + 0.2, s.z1), b = P(s.x1, s.y, s.z0); if (p[0] > Math.min(a[0], b[0]) - 20 && p[0] < Math.max(a[0], b[0]) + 20 && p[1] > a[1] - 30 && p[1] < b[1] + 20 && lit2({ x: p[0], y: p[1], w: 0, h: 0 })) { P1.sleepT[s.ph] = performance.now(); FX.sleeper(clamp((p[0] - 800) / 800, -1, 1)); return; } }
  },
};
// mưa, sấm, chớp (ánh sáng đi trước tiếng sấm)
function stormTick(now, dt, rate) {
  if (!ac || P1.calm && P1.calmT > 20) return;
  P1.nextFlash -= dt * (V.cur === 'win1' ? 2.2 : 1) * rate * (P1.calm ? 0.4 : 1);
  if (P1.nextFlash < 0) { P1.flash = now; P1.nextFlash = 12 + Math.random() * 14; thunder(); }
}
function thunder() {
  const t = ac.currentTime + 1.0 + Math.random() * 1.8, dur = 4 + Math.random() * 3;
  const o = ac.createBufferSource(); o.buffer = noiseBuf; o.loop = true; o.playbackRate.value = 0.35;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(380, t); lp.frequency.exponentialRampToValueAtTime(90, t + dur);
  const e = ac.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.55, t + 0.25); for (let i = 1; i < 6; i++) e.gain.linearRampToValueAtTime(0.18 + Math.random() * 0.3, t + (dur * i) / 6); e.gain.linearRampToValueAtTime(0, t + dur);
  const pn = ac.createStereoPanner(); pn.pan.value = 0.3; o.connect(lp).connect(e).connect(pn).connect(rainG || master); o.start(t); o.stop(t + dur + 0.1);
}

// ---------- điện thoại của em: ba ghi chú + ghi chú của anh (luật chơi), bật đèn ----------
const PH = { x: 560, y: 110, w: 480, h: 690 };
const PREMISE = 'Anh đọc rồi. Muộn, nhưng đủ từng dòng.\n\nMỗi lá thư, anh trả lời bằng một cuộn băng, để ở đúng nơi em đã viết.\n\nBăng không tua nhanh được.\nEm nghe hết nhé.';
const PHS = { mode: 'lock', t: 0 };
function phoneFrame(c) { c.fillStyle = '#0e1013'; roundRect(c, PH.x - 18, PH.y - 18, PH.w + 36, PH.h + 36, 50); c.fill(); c.save(); roundRect(c, PH.x, PH.y, PH.w, PH.h, 36); c.clip(); c.fillStyle = '#121418'; c.fillRect(PH.x, PH.y, PH.w, PH.h); }
SC.phone1 = {
  back: 'dorm', hintY: 752,
  tapBelow: true,
  enter() { PHS.t = 0; if (PHS.mode === 'lock') hints(['Màn hình khoá có đếm ngày. Ô đó chạm vào được.', 'Mỗi ngày bên nhau có một chấm. Tìm ngày có chấm đầu tiên.', 'Ngày đầu tiên ấy: ngày rồi tháng, bốn số.']); },
  draw(c, now, dt) {
    PHS.t += dt; c.fillStyle = '#040506'; c.fillRect(-300, -300, W + 600, H + 600);
    phoneFrame(c);
    if (PHS.mode === 'lock') { drawLockScreen(c, now); c.restore(); return; }
    text(c, 'Ghi chú', PH.x + 36, PH.y + 70, 40, 0.9, 'left');
    if (PHS.mode === 'list') {
      const notes = [['11/11', 0.34], ['10/11', 0.3], ['9/11', 0.32]];
      const showNew = PHS.t > 1.4;
      const y0 = PH.y + 120 + (showNew ? 0 : -110);
      if (showNew) { const a = clamp((PHS.t - 1.4) / 0.8, 0, 1); c.fillStyle = `rgba(255,214,150,${0.12 * a})`; roundRect(c, PH.x + 20, PH.y + 100, PH.w - 40, 96, 14); c.fill(); text(c, 'Anh', PH.x + 40, PH.y + 140, 32, a, 'left', '255,226,190'); text(c, 'vừa xong', PH.x + PH.w - 40, PH.y + 140, 22, 0.5 * a, 'right'); c.fillStyle = `rgba(236,230,218,${0.35 * a})`; c.fillRect(PH.x + 40, PH.y + 160, 260, 8); }
      notes.forEach(([d, w], i) => { const y = y0 + 110 + i * 110; c.fillStyle = 'rgba(255,255,255,.04)'; roundRect(c, PH.x + 20, y - 10, PH.w - 40, 96, 14); c.fill(); text(c, d, PH.x + 40, y + 30, 30, 0.75, 'left'); c.filter = 'blur(3px)'; c.fillStyle = 'rgba(236,230,218,.35)'; c.fillRect(PH.x + 40, y + 50, (PH.w - 100) * (0.6 + w), 9); c.fillRect(PH.x + 40, y + 66, (PH.w - 100) * w * 2, 9); c.filter = 'none'; });
      HOT.note4 = { x: PH.x + 20, y: PH.y + 100, w: PH.w - 40, h: 96 };
    } else {
      const lines = wrap(c, PREMISE, PH.w - 90, 34); lines.forEach((ln, i) => text(c, ln, PH.x + 44, PH.y + 140 + i * 46, 34, clamp((PHS.t - i * 0.25) / 0.6, 0, 0.92), 'left', '255,236,210'));
      // nút đèn pin vẽ tay ở đáy màn
      const bx = PH.x + PH.w / 2, by = PH.y + PH.h - 90, on = P1.torch, a = clamp((PHS.t - 3) / 1, 0, 1);
      c.globalAlpha = a; c.strokeStyle = on ? 'rgba(255,230,180,.9)' : 'rgba(236,230,218,.7)'; c.lineWidth = 4; c.lineJoin = 'round';
      c.beginPath(); c.arc(bx, by, 42, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(bx - 12, by - 22); c.lineTo(bx + 12, by - 22); c.lineTo(bx + 8, by - 4); c.lineTo(bx + 8, by + 22); c.lineTo(bx - 8, by + 22); c.lineTo(bx - 8, by - 4); c.closePath(); c.stroke();
      if (on) { c.fillStyle = 'rgba(255,230,180,.5)'; c.beginPath(); c.arc(bx, by, 38, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1; HOT.torchBtn = { x: bx - 60, y: by - 60, w: 120, h: 120 };
    }
    c.restore();
  },
  tap(p) {
    if (PHS.mode === 'lock') { lockTap(p); return; }
    if (PHS.mode === 'list' && PHS.t > 1.6 && inR(p, HOT.note4)) { PHS.mode = 'note'; PHS.t = 0; FX.tap(); return; }
    if (PHS.mode === 'note' && PHS.t > 3 && inR(p, HOT.torchBtn)) { P1.torch = true; FX.torch(); P1.tp = [HOT.phone.at[0], HOT.phone.at[1] - 60]; setTimeout(() => go('dorm'), 500); }
  },
};
// ---------- mảnh giấy dưới gối: câu hỏi của em ----------
SC.note1 = {
  back: 'dorm',
  enter() { P1.noteSeen = true; FX.paper(); },
  draw(c) {
    c.fillStyle = '#050403'; c.fillRect(-300, -300, W + 600, H + 600);
    c.save(); c.translate(W / 2, 420); c.rotate(-0.03); c.fillStyle = '#f1ead8'; c.fillRect(-330, -170, 660, 340);
    c.strokeStyle = 'rgba(110,140,180,.25)'; for (let y = -120; y < 160; y += 46) { c.beginPath(); c.moveTo(-310, y); c.lineTo(310, y); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(-330, -2, 660, 3); // nếp gấp
    c.fillStyle = '#2a2018'; c.font = `26px ${HAND}`; c.fillText('9/11 · trời mưa', -290, -130);
    c.font = `48px ${HAND}`; c.textAlign = 'center'; c.fillText('Anh đặt em ở mức nào?', 0, 30); c.textAlign = 'left';
    c.restore();
  },
};
// ---------- bộ quân phục: dải ảnh Sa Pa trong túi áo ----------
const STRIP_DRAW = (c, s) => { c.save(); c.scale(s, s); c.rotate(-0.08); c.fillStyle = '#efeae0'; c.fillRect(-26, -70, 52, 140); for (let i = 0; i < 3; i++) { c.fillStyle = ['#6e8aa8', '#93a6b8', '#7d8f9f'][i]; c.fillRect(-21, -64 + i * 44, 42, 38); } c.restore(); };
const STRIP = { flip: false };
SC.uni1 = {
  back: 'dorm',
  draw(c, now) {
    c.fillStyle = '#0b0c0a'; c.fillRect(-300, -300, W + 600, H + 600);
    c.save(); c.translate(W / 2, 140); c.scale(2.6, 2.6); drawUniform(c, [0, 0], Math.sin(now * 0.002) * 0.01); c.restore();
    if (!P1.strip) { const a = 0.4 + 0.3 * Math.sin(now * 0.004); c.strokeStyle = `rgba(255,236,200,${a})`; c.lineWidth = 3; c.strokeRect(W / 2 + 22, 340, 110, 110); }
    else text(c, 'Túi áo trống.', W / 2, 690, 26, 0.45);
  },
  tap(p) { if (!P1.strip && p[0] > W / 2 && p[0] < W / 2 + 160 && p[1] > 320 && p[1] < 470) { P1.strip = true; bagAdd('strip', 'dải ảnh', STRIP_DRAW); go('strip1'); } },
};
// dải ảnh photobooth Sa Pa (20/10): mặt trước ba khung ảnh, mặt sau chữ viết tay. Chạm để lật.
BAG_VIEW.strip = 'strip1';
SC.strip1 = {
  back: 'dorm',
  enter() { STRIP.flip = false; FX.paper(); },
  draw(c) {
    c.fillStyle = '#060606'; c.fillRect(-300, -300, W + 600, H + 600);
    c.save(); c.translate(W / 2, 420); c.rotate(-0.04);
    c.fillStyle = '#f2eee6'; c.fillRect(-120, -300, 240, 600);
    if (!STRIP.flip) {
      c.fillStyle = '#2a2a2a'; c.font = `22px Georgia, serif`; c.textAlign = 'center'; c.fillText('SAPA · NƠI GẶP GỠ ĐẤT TRỜI', 0, -268); c.textAlign = 'left';
      for (let i = 0; i < 3; i++) { const y = -240 + i * 175; const gr = c.createLinearGradient(0, y, 0, y + 160); gr.addColorStop(0, '#c9d6e2'); gr.addColorStop(1, '#7f95ab'); c.fillStyle = gr; c.fillRect(-100, y, 200, 160);
        c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(0, y + 130, 100, 22, 0, 0, Math.PI * 2); c.fill(); // mây
        if (i === 1) { c.fillStyle = '#d7dadf'; c.beginPath(); c.moveTo(-30, y + 120); c.lineTo(0, y + 30); c.lineTo(30, y + 120); c.fill(); c.fillStyle = '#c8102e'; c.fillRect(38, y + 30, 26, 16); }
        c.fillStyle = '#2b2b2b'; c.fillRect(-16, y + 80, 12, 50); c.fillStyle = '#ece9e2'; c.fillRect(-4, y + 84, 12, 46); } // hai người (giản lược)
    } else {
      c.fillStyle = '#2a2018'; c.font = `40px ${HAND}`; c.fillText('20/10', -80, -120); c.font = `34px ${HAND}`; c.fillText('lên tới đỉnh rồi', -96, -60); c.fillText('lạnh mà vui', -84, -10);
      c.strokeStyle = 'rgba(42,32,24,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-60, 90); c.lineTo(0, -0 + 30); c.lineTo(60, 90); c.stroke(); // nét vẽ đỉnh núi nhỏ
    }
    c.restore();
    text(c, STRIP.flip ? '' : 'chạm để lật', W / 2, 760, 22, 0.35);
  },
  tap() { STRIP.flip = !STRIP.flip; FX.paper(); },
};
// ---------- cửa sổ: lau hơi nước, chờ chớp mới thấy cột mốc ----------
const WIN_C = { x: 260, y: 90, w: 1080, h: 720 };
let fogAcc = 0;
function resetFog() { fogC.width = cv.width; fogC.height = cv.height; setT(fogG); fogG.fillStyle = 'rgb(140,156,170)'; fogG.fillRect(WIN_C.x, WIN_C.y, WIN_C.w, WIN_C.h); for (let i = 0; i < 1600; i++) { fogG.fillStyle = `rgba(200,215,225,${0.05 + Math.random() * 0.1})`; fogG.beginPath(); fogG.arc(WIN_C.x + Math.random() * WIN_C.w, WIN_C.y + Math.random() * WIN_C.h, 1 + Math.random() * 3, 0, Math.PI * 2); fogG.fill(); } }
let lastWipe = 0;
function wipe(x, y) { P1.wipeAt = performance.now(); P1.wipeN = (P1.wipeN || 0) + 1; if (x < WIN_C.x || x > WIN_C.x + WIN_C.w || y < WIN_C.y || y > WIN_C.y + WIN_C.h) return; fogG.save(); fogG.globalCompositeOperation = 'destination-out'; const r = fogG.createRadialGradient(x, y, 10, x, y, 62); r.addColorStop(0, 'rgba(0,0,0,.97)'); r.addColorStop(0.6, 'rgba(0,0,0,.8)'); r.addColorStop(1, 'rgba(0,0,0,0)'); fogG.fillStyle = r; fogG.beginPath(); fogG.arc(x, y, 62, 0, Math.PI * 2); fogG.fill(); fogG.restore(); const n = performance.now(); if (n - lastWipe > 140) { FX.wipe(); lastWipe = n; } }
function star(c, x, y, R, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill(); }
SC.win1 = {
  back: 'dorm', bake: resetFog,
  draw(c, now, dt) {
    const fe = (now - P1.flash) / 1000 * 0.55, fl = fe >= 0 && fe < 0.7 ? (fe < 0.1 ? 1 : fe < 0.18 ? 0.3 : fe < 0.3 ? 0.9 : Math.max(0, 1 - (fe - 0.3) / 0.4) * 0.6) : 0;
    // bên kia kính là đêm đen; chỉ khi chớp mới hiện ra đỉnh núi trong mây (không giải thích vì sao)
    c.fillStyle = '#02040a'; c.fillRect(WIN_C.x, WIN_C.y, WIN_C.w, WIN_C.h);
    if (fl > 0) {
      c.save(); c.globalAlpha = fl;
      let gr = c.createLinearGradient(0, WIN_C.y, 0, WIN_C.y + WIN_C.h); gr.addColorStop(0, '#9fb2c8'); gr.addColorStop(1, '#e6edf3'); c.fillStyle = gr; c.fillRect(WIN_C.x, WIN_C.y, WIN_C.w, WIN_C.h);
      for (let i = 0; i < 7; i++) { c.fillStyle = `rgba(255,255,255,${0.25 + i * 0.07})`; c.beginPath(); for (let x = 0; x <= WIN_C.w; x += 40) { const y = WIN_C.y + WIN_C.h * (0.66 + i * 0.045) + Math.sin(x * 0.012 + i * 1.7) * 14; x ? c.lineTo(WIN_C.x + x, y) : c.moveTo(WIN_C.x, y); } c.lineTo(WIN_C.x + WIN_C.w, WIN_C.y + WIN_C.h); c.lineTo(WIN_C.x, WIN_C.y + WIN_C.h); c.fill(); }
      const mx = WIN_C.x + 430, my = WIN_C.y + 560;
      c.fillStyle = '#3a3f47'; c.fillRect(mx - 170, my, 340, 120);
      c.fillStyle = '#d5d8dc'; c.beginPath(); c.moveTo(mx, my - 360); c.lineTo(mx + 130, my); c.lineTo(mx - 130, my); c.closePath(); c.fill();
      c.fillStyle = '#7a6640'; c.beginPath(); c.moveTo(mx - 78, my - 150); c.lineTo(mx + 78, my - 150); c.lineTo(mx + 130, my); c.lineTo(mx - 130, my); c.closePath(); c.fill();
      c.strokeStyle = '#4a4a48'; c.lineWidth = 4; c.beginPath(); c.arc(mx, my - 215, 34, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#4a4a48'; star(c, mx, my - 215, 24, 10);
      c.fillStyle = '#efd49a'; c.textAlign = 'center'; c.font = `600 26px Georgia, serif`; c.fillText('F A N S I P A N', mx, my - 92);
      c.font = `600 40px Georgia, serif`; ['3', '.', '1', '4', '3', 'M'].forEach((ch, i) => c.fillText(ch, mx - 130 + i * 52, my - 40)); c.textAlign = 'left';
      c.strokeStyle = '#8c949c'; c.lineWidth = 6; c.beginPath(); c.moveTo(mx + 210, my + 20); c.lineTo(mx + 210, WIN_C.y + 60); c.stroke();
      c.fillStyle = '#c8102e'; c.fillRect(mx + 213, WIN_C.y + 70, 180, 120); c.fillStyle = '#ffcd00'; star(c, mx + 303, WIN_C.y + 130, 28, 11);
      c.restore();
    }
    // hơi nước (mờ lại sau ~2 giây) + giọt mưa ngoài kính
    if (!fogC.width) resetFog();
    fogAcc += dt; while (fogAcc > 0.15) { fogAcc -= 0.15; setT(fogG); fogG.fillStyle = 'rgba(140,156,170,.045)'; fogG.fillRect(WIN_C.x, WIN_C.y, WIN_C.w, WIN_C.h); }
    // chớp không làm tan hơi nước: vẫn phải lau mới đọc được
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha *= 1 - 0.03 * fl; c.drawImage(fogC, 0, 0); c.restore(); setT(c);
    c.strokeStyle = 'rgba(200,220,235,.35)'; c.lineWidth = 1.4; for (let i = 0; i < 30; i++) { const x = WIN_C.x + ((i * 97 + now * 0.02) % WIN_C.w), y = WIN_C.y + ((i * 173 + now * 0.08 * (1 + (i % 3))) % WIN_C.h); c.beginPath(); c.moveTo(x, y - 22); c.lineTo(x, y); c.stroke(); }
    c.fillStyle = '#141b20'; c.fillRect(WIN_C.x - 40, WIN_C.y - 40, WIN_C.w + 80, 40); c.fillRect(WIN_C.x - 40, WIN_C.y + WIN_C.h, WIN_C.w + 80, 50); c.fillRect(WIN_C.x - 40, WIN_C.y, 40, WIN_C.h); c.fillRect(WIN_C.x + WIN_C.w, WIN_C.y, 40, WIN_C.h);
    c.fillRect(WIN_C.x + WIN_C.w / 2 - 12, WIN_C.y, 24, WIN_C.h); c.fillRect(WIN_C.x, WIN_C.y + WIN_C.h / 2 - 12, WIN_C.w, 24);
    // lau xong khoảng nửa giây thì chớp tới (không bắt chờ hên xui)
    if (P1.wipeAt && now - P1.wipeAt > 500 && now - P1.wipeAt < 1500 && (P1.wipeN || 0) >= 8 && now - P1.flash > 2500) { P1.flash = now; P1.wipeN = 0; P1.nextFlash = 9 + Math.random() * 6; thunder(); }
    stormTick(now, dt, 1);
  },
  down(p) { wipe(p[0], p[1]); return false; },
  move(p, b) { if (b) { wipe(p[0], p[1]); nudge(); } },
};
// ---------- khoá vali: 4 bánh số + "m", không báo đúng sai ----------
const LOCK = { x: 520, y: 330, cw: 120, ch: 210, gap: 22 };
let wdrag = null;
const wheelX = (i) => LOCK.x + i * (LOCK.cw + LOCK.gap);
SC.lock1 = {
  back: 'dorm',
  draw(c) {
    let gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d2127'); gr.addColorStop(1, '#0d0f12'); c.fillStyle = gr; c.fillRect(-300, -300, W + 600, H + 600);
    for (let i = 0; i < 18; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.18)'; c.fillRect(i * 100 - 100, 0, 50, H); }
    c.fillStyle = '#0a0b0d'; roundRect(c, LOCK.x - 50, LOCK.y - 40, 4 * (LOCK.cw + LOCK.gap) + 110, LOCK.ch + 80, 18); c.fill();
    for (let i = 0; i < 4; i++) {
      const x = wheelX(i), off = wdrag && wdrag.i === i ? wdrag.off : 0;
      gr = c.createLinearGradient(0, LOCK.y, 0, LOCK.y + LOCK.ch); gr.addColorStop(0, '#0e1013'); gr.addColorStop(0.5, '#3a3f46'); gr.addColorStop(1, '#0e1013'); c.fillStyle = gr; c.fillRect(x, LOCK.y, LOCK.cw, LOCK.ch);
      c.save(); c.beginPath(); c.rect(x, LOCK.y, LOCK.cw, LOCK.ch); c.clip(); c.font = `600 78px Georgia, serif`; c.textAlign = 'center';
      for (let k = -2; k <= 2; k++) { const v = (P1.code[i] + k + 10) % 10, y = LOCK.y + LOCK.ch / 2 + 28 + k * 92 + off, d = Math.abs(y - 28 - (LOCK.y + LOCK.ch / 2)) / 160; c.fillStyle = `rgba(236,232,222,${clamp(1 - d, 0, 1) * 0.9})`; c.fillText(String(v), x + LOCK.cw / 2, y); }
      c.restore(); c.textAlign = 'left';
    }
    c.fillStyle = 'rgba(225,230,235,.75)'; c.font = `italic 64px Georgia, serif`; c.fillText('m', wheelX(4) - 6, LOCK.y + LOCK.ch / 2 + 22);
  },
  down(p) { for (let i = 0; i < 4; i++) { const x = wheelX(i); if (p[0] > x - 10 && p[0] < x + LOCK.cw + 10 && p[1] > LOCK.y - 60 && p[1] < LOCK.y + LOCK.ch + 60) { wdrag = { i, y0: p[1], off: 0, moved: false }; return true; } } return false; },
  move(p) { if (!wdrag) return; wdrag.off = p[1] - wdrag.y0; while (wdrag.off > 46) { P1.code[wdrag.i] = (P1.code[wdrag.i] + 9) % 10; wdrag.off -= 92; wdrag.y0 += 92; wdrag.moved = true; FX.wheel(); } while (wdrag.off < -46) { P1.code[wdrag.i] = (P1.code[wdrag.i] + 1) % 10; wdrag.off += 92; wdrag.y0 -= 92; wdrag.moved = true; FX.wheel(); } },
  up(p) {
    if (!wdrag) return false; if (!wdrag.moved) { const up = p[1] < LOCK.y + LOCK.ch / 2; P1.code[wdrag.i] = (P1.code[wdrag.i] + (up ? 9 : 1)) % 10; FX.wheel(); }
    wdrag = null; nudge(); if (P1.code.join('') !== '3143') missHint('vali', ['Sau ô cuối có chữ "m": đây là một độ cao.', 'Nơi cao nhất hai đứa từng đứng cùng nhau.', 'Lau kính cửa sổ, chờ chớp sáng, đọc tấm bia trên đỉnh núi.'], 30); if (P1.code.join('') === '3143' && !P1.open) setTimeout(() => { P1.open = true; FX.latch(); musicNear(); HINT.text = ''; HINT.off = true; setTimeout(() => go('open1'), 900); }, 380); return true;
  },
};
// ---------- vali mở: quần áo gấp vuông, cuộn băng ----------
SC.open1 = {
  back: 'dorm',
  enter() { P1.lid = 0; FX.cloth(); },
  draw(c, now, dt) {
    P1.lid = Math.min(1, P1.lid + dt / 1.2); const k = ease(P1.lid);
    c.fillStyle = '#0b0c0e'; c.fillRect(-300, -300, W + 600, H + 600);
    c.fillStyle = '#1a1d22'; roundRect(c, 300, 230 - 120 * k, 1000, 560, 24); c.fill();
    c.fillStyle = '#121418'; roundRect(c, 330, 260, 940, 500, 18); c.fill();
    // quần áo gấp vuông vức
    [[360, 290, '#cfd2cf'], [640, 290, '#5a6a50'], [360, 520, '#2f3a4a'], [920, 290, '#e8e2d6']].forEach(([x, y, col]) => { c.fillStyle = col; c.fillRect(x, y, 250, 200); c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 1; i < 4; i++) c.fillRect(x, y + i * 50, 250, 2); });
    if (!P1.bang) { c.globalAlpha = k; drawCassette(c, 1000, 600, 0.9, '9/11'); c.globalAlpha = 1; HOT.tape1 = { x: 840, y: 500, w: 320, h: 200 }; }
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(0,0,0,${0.5 * (1 - k)})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(-300, -300, W + 600, H + 600);
  },
  tap(p) { if (!P1.bang && P1.lid > 0.9 && inR(p, HOT.tape1)) { P1.bang = true; FX.pick(); bagAdd('bang', 'cuộn băng', (c, s) => drawCassette(c, 0, 0, s * 0.42, '9/11')); tryListen(); } },
};
// phụ đề băng 1: xem phu-de.js
function afterTape1() {
  P1.calm = true; P1.calmT = 0; go('dorm', 900);
  if (rainG) ramp(rainG.gain, 0.16, 6);
  musicOff(9);
  hints(['Có ánh sáng lọt qua khe cửa.', 'Cánh cửa ở cuối phòng, bên trái cửa sổ.', 'Chạm vào vệt sáng dưới cánh cửa.']);
}
function endRoom1() { const t = ac.currentTime; for (let i = 0; i < 5; i++) FX.step(t + 0.2 + i * 0.5, i % 2 ? 0.2 : -0.2); go('end1', 1400); }
SC.end1 = { draw(c, now) { c.fillStyle = '#000'; c.fillRect(-300, -300, W + 600, H + 600); text(c, '(hết phòng 1 bản mới · phòng 2 và 3 đang làm lại theo chuẩn này)', W / 2, H / 2, 28, 0.5); } };

// ---------- MỞ ĐẦU ----------
const INTRO = { t: -1 };
OVER.push((c, now, dt) => {
  if (INTRO.t < 0) { if (!ac) { text(c, 'Đeo tai nghe vào nhé.', W / 2, H / 2 - 10, 40, 0.85); text(c, 'chạm để bắt đầu', W / 2, H / 2 + 46, 24, 0.4 + 0.15 * Math.sin(now * 0.003)); } return; }
  INTRO.t += dt; const t = INTRO.t;
  if (t < 8) { c.fillStyle = `rgba(0,0,0,${t < 6 ? 1 : 1 - (t - 6) / 2})`; c.fillRect(-300, -300, W + 600, H + 600); }
  if (t > 2.2 && t < 7) text(c, '9 · 11', W / 2, H / 2 + 14, 68, Math.min(1, (t - 2.2) / 1.5, (7 - t) / 1.5) * 0.85);
  if (t > 1.5 && t < 6.5 && t - dt <= 1.5) FX.breath();
});
START = () => {
  INTRO.t = 0;
  rainG = ac.createGain(); rainG.gain.value = 0; rainG.connect(master); AMB.push(rainG);
  const r1 = loopNoise(0.55, 'bandpass', 3200, 0.5); r1.gain.connect(rainG); const r1b = loopNoise(0.25, 'highpass', 5200, 0.7); r1b.gain.connect(rainG);
  // mưa gió ngoài trời: lớp trầm lên xuống theo từng cơn gió (không kêu đều)
  const r2 = loopNoise(0.28, 'lowpass', 260, 0.7, 0.5); const gust = ac.createOscillator(); gust.frequency.value = 0.07; const gg = ac.createGain(); gg.gain.value = 0.14; gust.connect(gg).connect(r2.gain.gain); gust.start(); const gust2 = ac.createOscillator(); gust2.frequency.value = 0.19; const gg2 = ac.createGain(); gg2.gain.value = 0.05; gust2.connect(gg2).connect(r2.gain.gain); gust2.start(); r2.gain.connect(rainG);
  // hạt mưa lóc tóc quanh đầu (8D): 7 điểm đặt quanh người nghe, mỗi hạt rơi vào một điểm ngẫu nhiên
  const DROP = [[-2.2, 0.6, -0.6], [-1.6, 0.8, 1.4], [0, 1.4, 2.2], [1.7, 0.7, 1.2], [2.3, 0.5, -0.8], [0.8, 2.2, -1.6], [-0.9, 2.0, -1.8]].map(([x, y, z]) => { const pn = ac.createPanner(); pn.panningModel = 'HRTF'; pn.distanceModel = 'inverse'; pn.refDistance = 1.2; if (pn.positionX) { pn.positionX.value = x; pn.positionY.value = y; pn.positionZ.value = z; } else pn.setPosition(x, y, z); pn.connect(rainG); return pn; });
  const patter = () => { if (!P1.calm || Math.random() < 0.35) { const t = ac.currentTime, n = 2 + ((Math.random() * 4) | 0); for (let i = 0; i < n; i++) { const tt = t + Math.random() * 0.12, dest = DROP[(Math.random() * DROP.length) | 0]; nz(tt, 0.004 + Math.random() * 0.01, 'bandpass', 1800 + Math.random() * 4200, 2 + Math.random() * 3, 0.05 + Math.random() * 0.09, 0, 0, dest); } } setTimeout(patter, 60 + Math.random() * 90); }; patter();
  ramp(rainG.gain, 0.42, 4);
  const drip = () => { if (!P1.calm || Math.random() < 0.4) nz(ac.currentTime, 0.05, 'bandpass', 2200 + Math.random() * 3200, 7, 0.06 + Math.random() * 0.08, 0.1 + Math.random() * 0.45, 0, rainG); setTimeout(drip, 35 + Math.random() * 150); }; drip();
  // tiếng các bạn ngủ: thở rất khẽ, lệch trái
  sleepG = ac.createGain(); sleepG.gain.value = 1; sleepG.connect(master); AMB.push(sleepG);
  const SPOTS = [-0.75, -0.55, -0.3, 0.45]; const breathe = () => { if (!P1.calm || Math.random() < 0.5) { const t = ac.currentTime, pn = SPOTS[(Math.random() * SPOTS.length) | 0], d = 1.1 + Math.random() * 0.6; nz(t, d, 'bandpass', 500 + Math.random() * 250, 1.2, 0.012 + Math.random() * 0.01, pn, 0, sleepG); nz(t + d + 0.3, d * 1.3, 'bandpass', 420 + Math.random() * 200, 1.2, 0.009 + Math.random() * 0.008, pn, 0, sleepG); } setTimeout(breathe, 3500 + Math.random() * 5000); }; setTimeout(breathe, 3000);
  // "Yêu Được Không" không lời, rất xa và nghẹt
  bedG = ac.createGain(); bedG.gain.value = 0; bedLP = ac.createBiquadFilter(); bedLP.type = 'lowpass'; bedLP.frequency.value = 600; bedLP.connect(bedG).connect(master);
  TMUSIC = { g: bedG, lp: bedLP, far: [0, 500], near: [0.24, 5200], duck: 0.12 };
  buf('am/nen.mp3').then((b) => { const s = ac.createBufferSource(); s.buffer = b; s.loop = true; s.connect(bedLP); s.start(ac.currentTime + 1); }); // nhạc chạy ngầm ở mức 0: chỉ vang khi tới gần cuộn băng
  preload(['am/giong1.mp3']);
  setTimeout(() => { go('dorm', 1); hints(['Có thứ gì đang sáng trên giường.', 'Điện thoại của em.', 'Chạm vào ánh sáng xanh trên đệm.']); }, 10);
  P1.nextFlash = 14;
};

// ================= PHÒNG 1 · THÊM CÂU ĐỐ (v9) =================
// nói ngay một dòng ở chỗ dòng gợi ý (không phải gợi ý theo giờ)
function sayNow(s) { HINT.text = s; HINT.show = performance.now(); }
// gợi ý ba tầng theo đúng việc còn dang dở (chỉ đặt lại khi việc đổi)
function roomHints() {
  let k, L;
  if (!P1.noteSeen) { k = 'goi'; L = ['Có thứ gì đó dưới gối em.', 'Đèn soi tới đâu thấy tới đó. Gối ở đầu giường em.', 'Soi đèn vào chiếc gối rồi chạm vào.']; }
  else if (!P1.strip) { k = 'ao'; L = ['Bộ quân phục treo ở đầu giường.', 'Túi ngực có gì đó ló ra.', 'Soi vào áo rồi chạm vào túi áo.']; }
  else if (!P1.tuOpen) { k = 'tu'; L = ['Chiếc tủ sắt sát tường có khoá bốn số.', 'Mẩu giấy trên tủ nói về một ngày.', 'Chạm vào chiếc máy để mở túi, xem mặt sau dải ảnh.']; }
  else if (!P1.may || !P1.tai) { k = 'trongtu'; L = ['Trong tủ còn đồ chưa lấy.', 'Dây tai nghe rối: vòng nào đang bị đè thì chưa kéo ra được.', 'Gỡ vòng nằm trên cùng trước.']; }
  else if (!P1.open) { k = 'vali'; L = ['Chiếc vali dưới gầm giường có khoá bốn số, sau ô cuối có chữ "m".', 'Một con số đo bằng mét. Nơi cao nhất hai đứa từng đứng cùng nhau.', 'Lau kính cửa sổ, chờ chớp, đọc tấm bia trên đỉnh.']; }
  else if (!P1.bang) { k = 'bang'; L = ['Vali đã mở.', 'Trong vali có thứ không phải quần áo.', 'Chạm vào chiếc vali dưới gầm giường.']; }
  else return;
  if (P1.hintKey !== k) { P1.hintKey = k; hints(L); }
}

// ---------- màn khoá điện thoại em: ngày thứ 96 → ngày thứ nhất ----------
const KEYS = [['1', 0, 0], ['2', 1, 0], ['3', 2, 0], ['4', 0, 1], ['5', 1, 1], ['6', 2, 1], ['7', 0, 2], ['8', 1, 2], ['9', 2, 2], ['0', 1, 3], ['xoá', 2, 3]];
const keyAt = (cx, cy) => [PH.x + PH.w / 2 + (cx - 1) * 124, PH.y + 338 + cy * 68];
function drawLockScreen(c, now) {
  const sh = now - P1.pinBad < 450 ? Math.sin((now - P1.pinBad) * 0.09) * 14 * (1 - (now - P1.pinBad) / 450) : 0;
  let gr = c.createLinearGradient(0, PH.y, 0, PH.y + PH.h); gr.addColorStop(0, '#16202c'); gr.addColorStop(1, '#0b0e14'); c.fillStyle = gr; c.fillRect(PH.x, PH.y, PH.w, PH.h);
  c.strokeStyle = 'rgba(170,200,225,.08)'; c.lineWidth = 1; for (let i = 0; i < 26; i++) { const x = PH.x + ((i * 83 + now * 0.03) % PH.w), y = PH.y + ((i * 151 + now * 0.11) % PH.h); c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x, y); c.stroke(); } // mưa trên kính màn hình
  c.save(); c.translate(sh, 0);
  c.fillStyle = 'rgba(236,230,218,.92)'; c.font = `300 92px 'Be Vietnam Pro', sans-serif`; c.textAlign = 'center'; c.fillText('23:51', PH.x + PH.w / 2, PH.y + 128);
  c.font = `24px 'Be Vietnam Pro', sans-serif`; c.fillStyle = 'rgba(236,230,218,.6)'; c.fillText('Thứ Hai, 9 tháng 11', PH.x + PH.w / 2, PH.y + 166);
  c.fillStyle = 'rgba(255,214,160,.1)'; roundRect(c, PH.x + 120, PH.y + 188, PH.w - 240, 48, 16); c.fill(); c.strokeStyle = `rgba(255,214,160,${(P1.badN >= 2 ? 0.5 : 0.18) + (P1.badN >= 2 ? 0.35 : 0.12) * Math.sin(now * 0.004)})`; c.lineWidth = P1.badN >= 2 ? 2.5 : 1.5; c.stroke();
  text(c, 'ngày thứ 96', PH.x + PH.w / 2, PH.y + 222, 28, 0.85, 'center', '255,224,186');
  if (!PHS.cal) { const cx = PH.x + PH.w / 2, y = PH.y + 256;
    for (let i = 0; i < 4; i++) { const x = cx + (i < 2 ? -78 + i * 34 : 44 + (i - 2) * 34); c.strokeStyle = 'rgba(236,230,218,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 12, y + 14); c.lineTo(x + 12, y + 14); c.stroke(); if (i < P1.pin.length) text(c, P1.pin[i], x, y + 8, 30, 0.95); }
    text(c, '/', cx, y + 10, 34, 0.6); text(c, 'ngày', cx - 61, y + 34, 16, 0.45); text(c, 'tháng', cx + 61, y + 34, 16, 0.45); }
  if (PHS.cal) { drawCal(c); c.restore(); c.textAlign = 'left'; return; }
  for (const [k, cx, cy] of KEYS) { const [x, y] = keyAt(cx, cy); if (k !== 'xoá') { c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.arc(x, y, 30, 0, Math.PI * 2); c.fill(); } text(c, k, x, y + (k === "xoá" ? 8 : 12), k === "xoá" ? 24 : 36, 0.85); }
  c.restore(); c.textAlign = 'left';
}
function lockTap(p) {
  if (PHS.cal) { calTap(p); return; }
  if (p[0] > PH.x + 120 && p[0] < PH.x + PH.w - 120 && p[1] > PH.y + 180 && p[1] < PH.y + 244) { PHS.cal = { m: 10 }; FX.tap(); nudge(); hints(['Mỗi ngày bên nhau có một chấm nhỏ.', 'Lật lùi từng tháng, tìm ngày có chấm đầu tiên.', 'Ngày đầu tiên có chấm: ngày rồi tháng, bốn số.']); return; }
  for (const [k, cx, cy] of KEYS) { const [x, y] = keyAt(cx, cy); if (Math.hypot(p[0] - x, p[1] - y) > 35) continue;
    FX.tap(); nudge();
    if (k === 'xoá') { P1.pin = P1.pin.slice(0, -1); return; }
    P1.pin += k;
    if (P1.pin.length === 4) {
      if (P1.pin === '0608') { setTimeout(() => { PHS.mode = 'list'; PHS.t = 0; P1.unlocked = true; FX.latch(); HINT.text = ''; hints(['Có một ghi chú mới.', 'Ghi chú trên cùng.', 'Chạm vào ghi chú tên "Anh".']); }, 250); }
      else { const t = ac.currentTime; for (let i = 0; i < 2; i++) nz(t + i * 0.13, 0.09, 'bandpass', 160, 2, 1.4); P1.pinBad = performance.now(); setTimeout(() => (P1.pin = ''), 380); P1.badN = (P1.badN || 0) + 1; if (P1.badN === 2) sayNow('Ô "ngày thứ 96" chạm vào được.'); else if (P1.badN === 4) sayNow('Mỗi ngày bên nhau có một chấm. Tìm ngày có chấm đầu tiên.'); else if (P1.badN >= 6) sayNow('Lùi lịch về tháng Tám, tìm ô được khoanh. Nhập ngày trước, tháng sau.'); }
    }
    return; }
}

// ---------- tủ sắt: "ngày mình chạm mây" = 20/10 ----------
let tdrag = null;
const TL = { x: 520, y: 400, cw: 120, ch: 200, gap: 22 };
const twx = (i) => TL.x + i * (TL.cw + TL.gap);
function steelBg(c) {
  let gr = c.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#2a3036'); gr.addColorStop(0.5, '#39424a'); gr.addColorStop(1, '#262b30'); c.fillStyle = gr; c.fillRect(-300, -300, W + 600, H + 600);
  for (let i = 0; i < 7; i++) { c.fillStyle = 'rgba(0,0,0,.4)'; roundRect(c, 600, 120 + i * 16, 400, 6, 3); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.03)'; for (let i = 0; i < 60; i++) c.fillRect((i * 271) % W, (i * 137) % H, 120, 1);
}
SC.tu1 = {
  back: 'dorm',
  enter() { FX.cloth(); },
  draw(c) {
    steelBg(c);
    // mẩu giấy dán trên tủ, chữ tay anh
    c.save(); c.translate(W / 2, 290); c.rotate(-0.03); c.fillStyle = '#ece3c4'; c.fillRect(-230, -62, 460, 112); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(-230, 44, 460, 6);
    c.fillStyle = 'rgba(220,210,170,.6)'; c.fillRect(-60, -74, 120, 22); // băng dính
    c.fillStyle = '#2a2018'; c.font = `40px ${HAND}`; c.textAlign = 'center'; c.fillText('mã: ngày mình chạm mây', 0, 10); c.restore(); c.textAlign = 'left';
    c.fillStyle = '#0a0b0d'; roundRect(c, TL.x - 40, TL.y - 30, 4 * (TL.cw + TL.gap) + 60, TL.ch + 60, 16); c.fill();
    for (let i = 0; i < 4; i++) {
      const x = twx(i), off = tdrag && tdrag.i === i ? tdrag.off : 0;
      const gr = c.createLinearGradient(0, TL.y, 0, TL.y + TL.ch); gr.addColorStop(0, '#0e1013'); gr.addColorStop(0.5, '#4a4f55'); gr.addColorStop(1, '#0e1013'); c.fillStyle = gr; c.fillRect(x, TL.y, TL.cw, TL.ch);
      c.save(); c.beginPath(); c.rect(x, TL.y, TL.cw, TL.ch); c.clip(); c.font = `600 74px Georgia, serif`; c.textAlign = 'center';
      for (let k = -2; k <= 2; k++) { const v = (P1.tuCode[i] + k + 10) % 10, y = TL.y + TL.ch / 2 + 26 + k * 88 + off, d = Math.abs(y - 26 - (TL.y + TL.ch / 2)) / 150; c.fillStyle = `rgba(236,232,222,${clamp(1 - d, 0, 1) * 0.9})`; c.fillText(String(v), x + TL.cw / 2, y); }
      c.restore(); c.textAlign = 'left';
    }
  },
  down(p) { for (let i = 0; i < 4; i++) { const x = twx(i); if (p[0] > x - 10 && p[0] < x + TL.cw + 10 && p[1] > TL.y - 50 && p[1] < TL.y + TL.ch + 50) { tdrag = { i, y0: p[1], off: 0, moved: false }; return true; } } return false; },
  move(p) { if (!tdrag) return; tdrag.off = p[1] - tdrag.y0; while (tdrag.off > 44) { P1.tuCode[tdrag.i] = (P1.tuCode[tdrag.i] + 9) % 10; tdrag.off -= 88; tdrag.y0 += 88; tdrag.moved = true; FX.wheel(); } while (tdrag.off < -44) { P1.tuCode[tdrag.i] = (P1.tuCode[tdrag.i] + 1) % 10; tdrag.off += 88; tdrag.y0 -= 88; tdrag.moved = true; FX.wheel(); } },
  up(p) {
    if (!tdrag) return false; if (!tdrag.moved) { const up = p[1] < TL.y + TL.ch / 2; P1.tuCode[tdrag.i] = (P1.tuCode[tdrag.i] + (up ? 9 : 1)) % 10; FX.wheel(); }
    tdrag = null; nudge(); if (P1.tuCode.join('') !== '2010') missHint('tu', ['Bốn số là một ngày: hai số ngày, hai số tháng.', 'Dải ảnh Sa Pa có ghi một ngày ở mặt sau.', 'Chạm vào chiếc máy để mở túi, chạm dải ảnh rồi lật lại.'], 30); if (P1.tuCode.join('') === '2010' && !P1.tuOpen) setTimeout(() => { P1.tuOpen = true; FX.latch(); HINT.text = ''; const t = ac.currentTime; nz(t + 0.3, 0.5, 'bandpass', 700, 4, 0.5); tone(t + 0.3, 210, 160, 0.06, 0.6, 'triangle'); setTimeout(() => go('tuopen'), 900); }, 380); return true;
  },
};
// máy cát-sét nhỏ (trong tủ, trong túi đồ): nhãn "HỒI ỨC" cùng nét với biển đình Băng 1
function drawMiniWalkman(c, s) {
  c.save(); c.scale(s, s); c.rotate(-0.05);
  const gr = c.createLinearGradient(-110, -80, 110, 80); gr.addColorStop(0, '#454b52'); gr.addColorStop(1, '#1d2024'); c.fillStyle = gr; roundRect(c, -110, -80, 220, 160, 18); c.fill();
  c.fillStyle = '#0d0f12'; roundRect(c, -86, -62, 172, 70, 8); c.fill();
  c.fillStyle = '#3a2a20'; c.beginPath(); c.arc(-36, -27, 15, 0, Math.PI * 2); c.arc(36, -27, 15, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 4; i++) { c.fillStyle = '#5a6068'; roundRect(c, -86 + i * 45, 26, 38, 24, 5); c.fill(); }
  c.fillStyle = '#7a1c1c'; c.fillRect(-46, 58, 92, 16); c.fillStyle = '#e9c98a'; c.font = `600 11px 'Fraunces', Georgia, serif`; c.textAlign = 'center'; c.fillText('HỒI ỨC', 0, 70); c.textAlign = 'left';
  c.restore();
}
function drawEarbuds(c, s) {
  c.save(); c.scale(s, s); c.strokeStyle = '#ece8e0'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-60, -40); c.bezierCurveTo(-40, 20, 0, 30, 0, 60); c.moveTo(60, -40); c.bezierCurveTo(40, 20, 0, 30, 0, 60); c.stroke();
  c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(-60, -46, 13, 0, Math.PI * 2); c.arc(60, -46, 13, 0, Math.PI * 2); c.fill(); c.restore();
}
SC.tuopen = {
  back: 'dorm',
  enter() { FX.cloth(); roomHints(); },
  draw(c, now) {
    c.fillStyle = '#111417'; c.fillRect(-300, -300, W + 600, H + 600);
    c.fillStyle = '#1c2126'; c.fillRect(420, 110, 760, 640); c.fillStyle = '#2a3036'; c.fillRect(420, 410, 760, 16); c.fillRect(420, 640, 760, 14); // hai ngăn
    { const gl = c.createRadialGradient(820, 360, 20, 820, 360, 520); gl.addColorStop(0, 'rgba(255,236,205,.16)'); gl.addColorStop(1, 'rgba(255,236,205,0)'); c.fillStyle = gl; c.fillRect(820 - 520, 360 - 520, 520 * 2, 520 * 2); }
    // khăn gấp, mũ (đồ của trại, giản lược)
    c.fillStyle = '#556048'; c.fillRect(470, 330, 220, 80); c.fillStyle = 'rgba(0,0,0,.15)'; for (let i = 1; i < 4; i++) c.fillRect(470, 330 + i * 20, 220, 2);
    if (!P1.may) { c.save(); c.translate(900, 330); drawMiniWalkman(c, 0.95); c.restore(); HOT.may = { x: 780, y: 240, w: 240, h: 180 }; } else HOT.may = null;
    if (!P1.tai) { c.save(); c.translate(800, 545); c.scale(0.36, 0.36); c.translate(-800, -440); for (const L of LOOPS) { c.save(); c.translate(L.x, L.y); c.rotate(L.r); c.lineWidth = 16; c.strokeStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.ellipse(0, 0, L.rx, L.ry, 0, 0, Math.PI * 2); c.stroke(); c.lineWidth = 9; c.strokeStyle = '#e6e2da'; c.stroke(); c.restore(); } c.restore(); HOT.tai = { x: 650, y: 480, w: 300, h: 150 }; } else HOT.tai = null;
  },
  tap(p) {
    if (HOT.may && inR(p, HOT.may)) { P1.may = true; FX.pick(); bagAdd('may', 'máy cát-sét', (c, s) => drawMiniWalkman(c, s * 0.72)); roomHints(); tryListen(); return; }
    if (HOT.tai && inR(p, HOT.tai)) { FX.cloth(); go('tai1'); }
  },
};

// ---------- gỡ dây tai nghe: chỉ kéo được vòng không bị vòng nào đè ----------
const LOOPS = [
  [800, 430, 200, 112, 0.2], [690, 380, 150, 92, -0.5], [905, 480, 158, 84, 0.6],
  [760, 510, 124, 72, 0.1], [880, 350, 118, 78, -0.3], [640, 480, 104, 62, 0.4],
].map(([x, y, rx, ry, r], z) => ({ x, y, rx, ry, r, z, gone: 0, wig: -9 }));
const inEll = (L, p) => { const dx = p[0] - L.x, dy = p[1] - L.y, c = Math.cos(-L.r), s = Math.sin(-L.r), u = dx * c - dy * s, v = dx * s + dy * c; return (u * u) / ((L.rx + 18) ** 2) + (v * v) / ((L.ry + 18) ** 2) <= 1; };
const overlap = (A, B) => Math.hypot(A.x - B.x, A.y - B.y) < (Math.max(A.rx, A.ry) + Math.max(B.rx, B.ry)) * 0.72;
SC.tai1 = {
  back: 'tuopen',
  enter() { nudge(); hints(['Kéo vòng dây nào ra trước?', 'Vòng đang bị vòng khác đè lên thì chưa kéo ra được.', 'Nhìn chỗ hai vòng bắt chéo: vòng nào nằm trên?']); },
  draw(c, now, dt) {
    c.fillStyle = '#0e1012'; c.fillRect(-300, -300, W + 600, H + 600);
    { const gl = c.createRadialGradient(W / 2, 440, 20, W / 2, 440, 620); gl.addColorStop(0, 'rgba(255,236,205,.13)'); gl.addColorStop(1, 'rgba(255,236,205,0)'); c.fillStyle = gl; c.fillRect(W / 2 - 620, 440 - 620, 620 * 2, 620 * 2); }
    const left = LOOPS.filter((L) => L.gone < 1);
    for (const L of LOOPS) if (L.gone > 0 && L.gone < 1) L.gone = Math.min(1, L.gone + dt * 1.6);
    for (const L of left) {
      const w = now - L.wig < 350 ? Math.sin((now - L.wig) * 0.08) * 6 * (1 - (now - L.wig) / 350) : 0;
      c.save(); c.globalAlpha = 1 - L.gone; c.translate(L.x + w + L.gone * 260 * (L.x < 800 ? -1 : 1), L.y - L.gone * 120); c.rotate(L.r);
      c.lineWidth = 11; c.strokeStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.ellipse(0, 0, L.rx, L.ry, 0, 0, Math.PI * 2); c.stroke(); // viền tối để thấy vòng nào nằm trên
      c.lineWidth = 5.5; c.strokeStyle = '#ece8e0'; c.beginPath(); c.ellipse(0, 0, L.rx, L.ry, 0, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(0, -1.5, L.rx, L.ry, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      c.restore();
    }
    // hai đầu tai nghe ló ra
    c.save(); c.translate(560, 300); drawEarbuds(c, 0.7); c.restore();
    if (!left.length && !P1.tai) { P1.tai = true; setTimeout(() => { FX.pocket(); bagAdd('tai', 'tai nghe', drawEarbuds); go('tuopen'); tryListen(); }, 900); }
    if (P1.tai) { c.save(); c.translate(W / 2, 430); drawEarbuds(c, 2.2); c.restore(); }
  },
  tap(p) {
    const cand = LOOPS.filter((L) => L.gone === 0 && inEll(L, p)).sort((a, b) => b.z - a.z)[0]; if (!cand) return;
    nudge(); const t = ac.currentTime;
    const blocked = LOOPS.some((L) => L.gone === 0 && L.z > cand.z && overlap(L, cand));
    if (blocked) { cand.wig = performance.now(); tone(t, 420, 300, 0.07, 0.12, 'triangle'); nz(t, 0.04, 'highpass', 3000, 1, 0.3); }
    else { cand.gone = 0.001; nz(t, 0.35, 'bandpass', 2400, 1.2, 0.35); nz(t + 0.1, 0.2, 'highpass', 4000, 1, 0.2); }
  },
};

// đủ băng + máy + tai nghe thì mới nghe được
function tryListen() {
  if (P1.done) return;
  if (P1.bang && P1.may && P1.tai) { P1.done = true; HINT.off = true; HINT.text = ''; setTimeout(() => tapeStart('9/11', 'am/giong1.mp3', SUB1, rainG, afterTape1, flipToAnh), 900); return; }
  if (P1.bang && !P1.may) sayNow('Cuộn băng đây rồi. Nhưng lấy gì mà nghe?');
  else if (P1.bang && !P1.tai) sayNow('Có máy rồi. Nghe thế này sẽ đánh thức cả phòng.');
}

// ---------- lịch trong ô "ngày thứ 96": mỗi ngày bên nhau một chấm, lật lùi về ngày đầu tiên ----------
const CAL_MON = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
const calDot = (m, d) => (m === 7 && d >= 6) || m === 8 || m === 9 || (m === 10 && d <= 9); // 6/8 → 9/11 (năm 2026)
function drawCal(c) {
  const m = PHS.cal.m, first = (new Date(2026, m, 1).getDay() + 6) % 7, days = new Date(2026, m + 1, 0).getDate();
  const x0 = PH.x + 30, y0 = PH.y + 290, cw = (PH.w - 60) / 7, ch = 62;
  c.fillStyle = 'rgba(255,255,255,.04)'; roundRect(c, PH.x + 16, PH.y + 250, PH.w - 32, 420, 20); c.fill();
  text(c, CAL_MON[m], PH.x + PH.w / 2, PH.y + 284, 30, 0.9);
  if (m > 7) text(c, '‹', PH.x + 52, PH.y + 286, 44, 0.8); if (m < 10) text(c, '›', PH.x + PH.w - 52, PH.y + 286, 44, 0.8);
  ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach((d, i) => text(c, d, x0 + cw * (i + 0.5), y0 + 26, 18, 0.45));
  for (let d = 1; d <= days; d++) { const k = first + d - 1, cx = x0 + cw * ((k % 7) + 0.5), cy = y0 + 66 + Math.floor(k / 7) * ch * 0.92;
    const dot = calDot(m, d); text(c, String(d), cx, cy, 22, dot ? 0.9 : 0.35, 'center', dot ? '255,236,210' : '236,230,218');
    if (dot) { c.fillStyle = 'rgba(255,200,150,.85)'; c.beginPath(); c.arc(cx, cy + 12, 3, 0, Math.PI * 2); c.fill(); }
    if (m === 7 && d === 6) { c.strokeStyle = 'rgba(255,200,150,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy - 6, 20, 0, Math.PI * 2); c.stroke(); text(c, 'ngày đầu tiên', cx, cy - 34, 16, 0.75, 'center', '255,214,170'); }
    if (m === 10 && d === 9) { c.fillStyle = 'rgba(255,214,160,.14)'; roundRect(c, cx - 22, cy - 28, 44, 50, 10); c.fill(); } }
  text(c, 'về bàn phím', PH.x + PH.w / 2, PH.y + PH.h - 22, 22, 0.55);
}
function calTap(p) {
  const m = PHS.cal.m; nudge();
  if (p[1] > PH.y + PH.h - 60) { PHS.cal = null; FX.tap(); return; }
  if (p[1] > PH.y + 250 && p[1] < PH.y + 320) { if (p[0] < PH.x + 120 && m > 7) { PHS.cal.m--; FX.paper(); } else if (p[0] > PH.x + PH.w - 120 && m < 10) { PHS.cal.m++; FX.paper(); } }
}
