// ================= PHÍA ANH · căn phòng của anh lúc đêm =================
// Mặt thứ hai của cuộn băng: không có lời, chỉ có tiếng phòng anh đúng phút đó. Tiếng vào trước, hình hiện sau.
// Không vẽ người. Lưng ghế ở tiền cảnh: có ai đó đang ngồi làm việc, ngoài khung hình.
const [anhC, anhG2] = layer();
const ANH = { t: 0, on: false, buzz: [], k: 0, tap: -9, mode: 1 };
// Bố cục: nhìn vào góc phòng. Tường sau có lịch, khung ảnh Fansipan, đèn học; bàn trắng chạy dọc tường sau tới góc;
// góc trong là bể cá vuông ~10 lít có đèn nắp; bàn đen đặt vuông góc dọc tường phải thành chữ L, cây đàn nằm dọc bàn đen;
// tường phải treo 6 bức tranh Van Gogh.
const CX = 1060;                                   // đường góc tường
const VPX = -1100, EYE = 430;                      // điểm tụ của tường phải (để vẽ tranh nghiêng đúng phối cảnh)
const onRight = (x, y0) => EYE + (y0 - EYE) * (x - VPX) / (CX - VPX); // độ cao trên tường phải tại x, nếu ở góc là y0
function vgPaint(c, kind, w, h) { // tranh Van Gogh giản lược, vẽ trong khung w×h
  const R = (a, b2) => a + rnd() * (b2 - a), strokes = (n, cols, y0, y1, len = 9) => { c.lineCap = 'round'; for (let i = 0; i < n; i++) { c.strokeStyle = cols[i % cols.length]; c.lineWidth = R(1.2, 2.6); const x = R(0, w), y = R(y0, y1), a0 = R(0, 6.28); c.beginPath(); c.arc(x, y, R(3, len), a0, a0 + R(0.8, 1.8)); c.stroke(); } };
  if (kind === 'sao') { c.fillStyle = '#1d3f7a'; c.fillRect(0, 0, w, h); strokes(160, ['#3a66b0', '#6f97d6', '#24497f', '#a9c3e8'], 0, h * 0.75, 12); c.fillStyle = '#e8c64a'; c.beginPath(); c.arc(w * 0.82, h * 0.22, h * 0.12, 0, 7); c.fill(); for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(240,215,110,.9)'; c.beginPath(); c.arc(R(0.1, 0.7) * w, R(0.08, 0.5) * h, R(2, 4), 0, 7); c.fill(); } c.fillStyle = '#0f1a14'; c.beginPath(); c.moveTo(w * 0.12, h); c.quadraticCurveTo(w * 0.16, h * 0.3, w * 0.2, h * 0.05); c.quadraticCurveTo(w * 0.26, h * 0.5, w * 0.3, h); c.fill(); c.fillStyle = '#1b2a3a'; c.fillRect(w * 0.3, h * 0.82, w * 0.7, h * 0.18); }
  else if (kind === 'song') { c.fillStyle = '#152a52'; c.fillRect(0, 0, w, h); strokes(90, ['#28508f', '#1b3a6b', '#3d66a8'], 0, h * 0.55, 8); for (let i = 0; i < 10; i++) { c.fillStyle = '#e9cf63'; c.beginPath(); c.arc(R(0.05, 0.95) * w, R(0.08, 0.4) * h, R(1.5, 3.5), 0, 7); c.fill(); } c.fillStyle = '#0d1d36'; c.fillRect(0, h * 0.55, w, h * 0.45); c.strokeStyle = '#e7c35a'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { const x = R(0.05, 0.95) * w; c.beginPath(); c.moveTo(x, h * 0.58); c.lineTo(x + R(-2, 2), h * R(0.7, 0.85)); c.stroke(); } }
  else if (kind === 'quan') { c.fillStyle = '#1b2f63'; c.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { c.fillStyle = '#efe2a0'; c.beginPath(); c.arc(R(0.55, 0.95) * w, R(0.05, 0.35) * h, 2, 0, 7); c.fill(); } c.fillStyle = '#e1a933'; c.beginPath(); c.moveTo(0, h * 0.1); c.lineTo(w * 0.55, h * 0.25); c.lineTo(w * 0.5, h * 0.6); c.lineTo(0, h * 0.75); c.fill(); c.fillStyle = '#c4572e'; c.fillRect(0, h * 0.6, w * 0.6, h * 0.15); c.fillStyle = '#3f4a6a'; c.fillRect(0, h * 0.75, w, h * 0.25); strokes(40, ['#6a7aa0', '#8a8fa8'], h * 0.75, h, 4); }
  else if (kind === 'hoa') { c.fillStyle = '#1c2a4f'; c.fillRect(0, 0, w, h); strokes(80, ['#2b3d6d', '#16234a'], 0, h, 6); c.fillStyle = '#9a6a2a'; c.beginPath(); c.ellipse(w * 0.5, h * 0.78, w * 0.18, h * 0.14, 0, 0, 7); c.fill(); for (let i = 0; i < 14; i++) { c.fillStyle = ['#e08a2c', '#f0a640', '#c96b22'][i % 3]; c.beginPath(); c.arc(w * R(0.2, 0.8), h * R(0.12, 0.5), R(3, 6), 0, 7); c.fill(); } c.fillStyle = '#5a4a2a'; c.fillRect(0, h * 0.9, w, h * 0.1); }
  else if (kind === 'bach') { c.fillStyle = '#4a72b5'; c.fillRect(0, 0, w, h); strokes(60, ['#6f95cf', '#3a5e9c', '#a7c0e0'], 0, h * 0.55, 7); c.fillStyle = '#d8a83a'; c.fillRect(0, h * 0.55, w, h * 0.45); strokes(40, ['#c68f2a', '#e3c062', '#7a9a4a'], h * 0.55, h, 5); c.fillStyle = '#162a1c'; c.beginPath(); c.moveTo(w * 0.45, h * 0.95); c.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.56, h * 0.02); c.quadraticCurveTo(w * 0.66, h * 0.4, w * 0.68, h * 0.95); c.fill(); c.fillStyle = '#e9d36a'; c.beginPath(); c.arc(w * 0.82, h * 0.18, 4, 0, 7); c.fill(); }
  else { c.fillStyle = '#4f78c0'; c.fillRect(0, 0, w, h); strokes(40, ['#7aa0db', '#3d63a6'], 0, h * 0.6, 6); c.fillStyle = '#d7b84e'; c.fillRect(0, h * 0.62, w, h * 0.38); c.fillStyle = '#3b5a2e'; c.beginPath(); c.ellipse(w * 0.4, h * 0.3, w * 0.28, h * 0.22, 0, 0, 7); c.fill(); c.fillStyle = '#4a3a24'; c.fillRect(w * 0.37, h * 0.45, w * 0.06, h * 0.25); }
}
// Dựng bằng ĐÚNG bộ phối cảnh của phòng ngủ (P, box, seg, tube3 trong p1.js), mắt cao hơn một chút (đang ngồi/đứng ở cửa phòng).
// Toạ độ mét: tường sau z = 3.2, tường phải x = 1.4 (góc trong ở x 1.4, z 3.2). Ánh sáng: đèn học + bể cá; còn lại chìm trong tối.
const AL = { lamp: [-0.45, 1.25, 2.95], tank: [1.19, 0.92, 3.0] };
const kA = (x, y, z) => { const d1 = Math.hypot(x - AL.lamp[0], (y - AL.lamp[1]) * 0.8, z - AL.lamp[2]), d2 = Math.hypot(x - AL.tank[0], y - AL.tank[1], z - AL.tank[2]); return clamp(Math.max(1.1 - d1 / 1.9, 0.75 - d2 / 1.4), 0.07, 1); };
const [anhDkC, anhDkG] = layer();
function quadImg(c, q, w, h, fn) { // vẽ fn(c) trong khung w×h lên tứ giác q = [trênTrái, trênPhải, dướiTrái] (xấp xỉ affine, đủ cho tranh nhỏ)
  const [a, b2, d] = q; c.save(); c.transform((b2[0] - a[0]) / w, (b2[1] - a[1]) / w, (d[0] - a[0]) / h, (d[1] - a[1]) / h, a[0], a[1]); fn(c); c.restore(); }
function bakeAnh() {
  anhC.width = cv.width; anhC.height = cv.height; anhDkC.width = cv.width; anhDkC.height = cv.height;
  const c = anhG2; setT(c); seed = 502; const camY = CAM.y; CAM.y = 1.45;
  const BW = 3.2, RW = 1.4, L = -2.6, TOP = 2.6, NEAR = 0.7;
  // tường, trần, sàn (cùng tông tối của phòng ngủ, tường trắng ngả xám dưới đèn)
  poly(c, [P(L, TOP, NEAR), P(RW, TOP, NEAR), P(RW, TOP, BW), P(L, TOP, BW)], '#0b0c0e');
  poly(c, [P(L, 0, BW), P(RW, 0, BW), P(RW, TOP, BW), P(L, TOP, BW)], '#5b5d5f');
  poly(c, [P(RW, 0, NEAR), P(RW, TOP, NEAR), P(RW, TOP, BW), P(RW, 0, BW)], '#4b4d50');
  poly(c, [P(L, 0, NEAR), P(RW, 0, NEAR), P(RW, 0, BW), P(L, 0, BW)], '#16171a');
  for (let i = 0; i < 4500; i++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.03})`; c.fillRect(rnd() * W, rnd() * H, 2, 2); }
  seg(c, P(RW, 0, BW), P(RW, TOP, BW), 1.2, 'rgba(0,0,0,.35)');
  // đồng hồ dán tường số to (trang trí) trên tường sau, phía trái
  c.save(); c.fillStyle = 'rgba(14,14,16,.55)'; c.textAlign = 'center'; c.font = `600 ${Math.round(820 * 0.16 / BW)}px Georgia, serif`;
  [['12', -1.75, 2.25], ['9', -2.25, 1.8]].forEach(([t, x, y]) => { const q = P(x, y, BW); c.fillText(t, q[0], q[1]); });
  const hc = P(-1.75, 1.8, BW); c.strokeStyle = 'rgba(14,14,16,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(hc[0], hc[1]); c.lineTo(hc[0], hc[1] - 50); c.moveTo(hc[0], hc[1]); c.lineTo(hc[0] + 38, hc[1] + 12); c.stroke(); c.restore(); c.textAlign = 'left';
  // dải photobooth, lịch PTIT, khung Fansipan có chun buộc tóc, hai dây thẻ: tất cả nằm phẳng trên tường sau
  const onBack = (x0, x1, y0, y1, z = BW - 0.005) => [P(x0, y1, z), P(x1, y1, z), P(x1, y0, z), P(x0, y0, z)];
  poly(c, onBack(-1.32, -1.2, 1.38, 1.72), '#7f7c76'); for (let i = 0; i < 3; i++) poly(c, onBack(-1.31, -1.21, 1.62 - i * 0.11, 1.70 - i * 0.11), ['#6d8299', '#82949f', '#76889a'][i]);
  poly(c, onBack(-1.0, -0.42, 1.18, 1.98), '#7d8187'); poly(c, onBack(-1.0, -0.42, 1.6, 1.98), '#5f6d79'); for (let i = 0; i < 12; i++) { const q = P(-0.98 + i * 0.048, 1.985, BW - 0.006); c.strokeStyle = 'rgba(30,30,30,.7)'; c.lineWidth = 1.2; c.beginPath(); c.arc(q[0], q[1], 2.5, Math.PI, 0); c.stroke(); }
  { const q = P(-0.98, 1.3, BW); c.fillStyle = '#284c78'; c.font = `700 ${Math.round(820 * 0.07 / BW)}px 'Be Vietnam Pro', sans-serif`; c.fillText('11', q[0], q[1]); for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) poly(c, onBack(-0.95 + k * 0.07, -0.91 + k * 0.07, 1.22 + r * 0.035 - 0.12, 1.24 + r * 0.035 - 0.12), 'rgba(40,50,70,.4)'); }
  poly(c, onBack(-0.935, -0.495, 1.445, 1.955, BW - 0.02), 'rgba(0,0,0,.35)'); poly(c, onBack(-0.93, -0.5, 1.45, 1.95, BW - 0.03), '#9c9b96'); poly(c, onBack(-0.9, -0.53, 1.48, 1.92, BW - 0.031), '#151515');
  { const q = onBack(-0.885, -0.545, 1.495, 1.905, BW - 0.032), g = c.createLinearGradient(0, q[0][1], 0, q[3][1]); g.addColorStop(0, '#506478'); g.addColorStop(1, '#8a949c'); poly(c, q, g);
    poly(c, [P(-0.85, 1.52, BW - 0.033), P(-0.77, 1.72, BW - 0.033), P(-0.69, 1.52, BW - 0.033)], '#8d8f93'); poly(c, onBack(-0.66, -0.61, 1.8, 1.84, BW - 0.033), '#b0182c'); poly(c, onBack(-0.62, -0.6, 1.52, 1.62, BW - 0.033), '#2a2d36'); poly(c, onBack(-0.6, -0.575, 1.53, 1.6, BW - 0.033), '#d9d6cc'); }
  { const h = P(-0.68, 1.97, BW - 0.04); c.fillStyle = '#a9a69f'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(h[0] + Math.cos(i) * 13, h[1] + Math.sin(i * 1.7) * 7, 8, 0, Math.PI * 2); c.fill(); } }
  seg(c, P(-0.74, 1.45, BW - 0.04), P(-0.75, 1.15, BW - 0.04), 3, '#2f5fb5'); seg(c, P(-0.66, 1.45, BW - 0.04), P(-0.63, 1.12, BW - 0.04), 3, '#a52a2a'); poly(c, onBack(-0.67, -0.58, 1.06, 1.12, BW - 0.045), '#b84444');
  // 6 tranh Van Gogh trên tường phải, đúng phối cảnh (mặt phẳng x = 1.4)
  const onRight = (z0, z1, y0, y1) => [P(RW - 0.005, y1, z1), P(RW - 0.005, y1, z0), P(RW - 0.005, y0, z1)]; // trên-trái (xa), trên-phải (gần), dưới-trái
  [['cay', 2.85, 2.7, 1.42, 1.72], ['sao', 2.6, 2.15, 1.62, 1.95], ['hoa', 2.05, 1.8, 1.55, 1.95], ['quan', 2.55, 2.35, 1.3, 1.55], ['song', 2.25, 1.85, 1.28, 1.52], ['bach', 1.7, 1.5, 1.32, 1.68]].forEach(([k, z1, z0, y0, y1]) => {
    const fr = [P(RW - 0.004, y1 + 0.02, z1 + 0.02), P(RW - 0.004, y1 + 0.02, z0 - 0.02), P(RW - 0.004, y0 - 0.02, z0 - 0.02), P(RW - 0.004, y0 - 0.02, z1 + 0.02)]; poly(c, fr, '#0b0b0c');
    quadImg(c, onRight(z0, z1, y0, y1), 100, 70, (g) => vgPaint(g, k, 100, 70)); });
  // bàn trắng dọc tường sau, bàn đen vuông góc dọc tường phải (chữ L)
  const kd = (x, z) => kA(x, 0.75, z);
  poly(c, [P(-2.2, 0, BW), P(RW, 0, BW), P(RW, 0.72, BW), P(-2.2, 0.72, BW)], 'rgba(0,0,0,.55)'); poly(c, [P(-2.2, 0, 2.62), P(RW, 0, 2.62), P(RW, 0, BW), P(-2.2, 0, BW)], 'rgba(0,0,0,.5)');
  box(c, -2.2, RW, 0.72, 0.75, 2.62, BW, [205, 205, 200], kd(-0.3, 2.9), true);
  [[-2.15, 2.66], [-2.15, 3.15]].forEach(([x, z]) => box(c, x, x + 0.04, 0, 0.72, z, z + 0.04, [150, 150, 146], kd(x, z) * 0.6, false));
  box(c, 0.82, RW, 0.70, 0.73, 1.05, 2.62, [30, 30, 33], kd(1.1, 2.0), true);
  // đàn HUTADU nằm dọc bàn đen, sát tường phải
  box(c, 0.92, 1.32, 0.73, 0.80, 1.1, 2.56, [20, 20, 22], kd(1.1, 2.2), true);
  { const k = kd(1.1, 2.0); for (let i = 0; i <= 52; i++) { const z = 1.15 + i * 0.026; seg(c, P(0.95, 0.801, z), P(1.18, 0.801, z), 1, `rgba(${(200 * k + 40) | 0},${(200 * k + 40) | 0},${(195 * k + 40) | 0},.9)`); }
    poly(c, [P(0.95, 0.802, 1.15), P(1.18, 0.802, 1.15), P(1.18, 0.802, 2.5), P(0.95, 0.802, 2.5)], `rgba(${(215 * k + 30) | 0},${(214 * k + 30) | 0},${(208 * k + 30) | 0},.85)`);
    for (let i = 0; i < 52; i++) if ([1, 2, 4, 5, 6].includes(i % 7)) seg(c, P(1.06, 0.804, 1.16 + i * 0.026), P(1.18, 0.804, 1.16 + i * 0.026), Math.max(1.5, 820 * 0.012 / (1.16 + i * 0.026)), '#0d0d0f'); }
  // ---- đồ trên bàn: màu trầm, có bóng đổ, có chất liệu ----
  const DY = 0.751;
  const ellH = (cx, y, cz, rx, rz, n = 28) => { const pts = []; for (let i = 0; i < n; i++) { const a2 = (i / n) * Math.PI * 2; pts.push(P(cx + Math.cos(a2) * rx, y, cz + Math.sin(a2) * rz)); } return pts; };
  const shadow = (cx, cz, rx, rz, a2 = 0.45) => poly(c, ellH(cx, DY, cz, rx, rz), `rgba(0,0,0,${a2})`);
  const cyl = (cx, cz, r, y0, y1, col, k) => { // chậu/cốc tròn: thân + miệng
    const [R, G, B] = col, L0 = P(cx - r, y1, cz), R0 = P(cx + r, y1, cz), L1 = P(cx - r, y0, cz), R1 = P(cx + r, y0, cz);
    const g = c.createLinearGradient(L0[0], 0, R0[0], 0); g.addColorStop(0, `rgb(${R * k * 0.55 | 0},${G * k * 0.55 | 0},${B * k * 0.55 | 0})`); g.addColorStop(0.35, `rgb(${R * k | 0},${G * k | 0},${B * k | 0})`); g.addColorStop(1, `rgb(${R * k * 0.4 | 0},${G * k * 0.4 | 0},${B * k * 0.4 | 0})`);
    poly(c, [L0, R0, R1, ...ellH(cx, y0, cz, r, r * 0.5).slice(1, 14), L1], g); poly(c, ellH(cx, y1, cz, r, r * 0.5), `rgb(${R * k * 0.35 | 0},${G * k * 0.35 | 0},${B * k * 0.35 | 0})`); };
  // bể cá vuông ~10 lít ở góc trong: kính, nước, sỏi, cây thuỷ sinh, máy lọc, thanh đèn nắp
  { const x0 = 1.0, x1 = 1.37, z0 = 2.8, z1 = 3.17, y0 = DY, y1 = 1.06; shadow((x0 + x1) / 2, z0 + 0.02, 0.22, 0.06, 0.5);
    const fr = [P(x0, y1 - 0.03, z0), P(x1, y1 - 0.03, z0), P(x1, y0, z0), P(x0, y0, z0)], g = c.createLinearGradient(0, fr[0][1], 0, fr[3][1]); g.addColorStop(0, 'rgba(70,120,118,.55)'); g.addColorStop(0.7, 'rgba(36,70,66,.75)'); g.addColorStop(1, 'rgba(30,40,30,.85)'); poly(c, fr, g);
    poly(c, [P(x0, y1 - 0.03, z0), P(x0, y1 - 0.03, z1), P(x0, y0, z1), P(x0, y0, z0)], 'rgba(40,80,78,.45)');
    poly(c, [P(x0, y0 + 0.06, z0), P(x1, y0 + 0.06, z0), P(x1, y0, z0), P(x0, y0, z0)], '#4a3d2a'); for (let i = 0; i < 60; i++) { const q = P(x0 + rnd() * (x1 - x0), y0 + 0.005 + rnd() * 0.05, z0); c.fillStyle = `rgba(${150 + rnd() * 60 | 0},${120 + rnd() * 50 | 0},${80 + rnd() * 40 | 0},.6)`; c.fillRect(q[0], q[1], 2, 2); }
    c.lineCap = 'round'; for (let i = 0; i < 9; i++) { const bx = x0 + 0.04 + rnd() * 0.22, h = 0.08 + rnd() * 0.12, a0 = P(bx, y0 + 0.05, z0 + 0.06), a1 = P(bx + (rnd() - 0.5) * 0.05, y0 + 0.05 + h, z0 + 0.06); c.strokeStyle = `rgba(${60 + rnd() * 30 | 0},${110 + rnd() * 40 | 0},${70 + rnd() * 20 | 0},.75)`; c.lineWidth = 2 + rnd() * 2; c.beginPath(); c.moveTo(a0[0], a0[1]); c.quadraticCurveTo(a0[0] + (rnd() - 0.5) * 18, (a0[1] + a1[1]) / 2, a1[0], a1[1]); c.stroke(); }
    box(c, x1 - 0.1, x1 - 0.03, y0 + 0.06, y1 - 0.05, z0 + 0.02, z0 + 0.07, [34, 36, 38], 0.5, false); seg(c, P(x1 - 0.06, y1 - 0.05, z0 + 0.045), P(x1 - 0.06, y1 - 0.01, z0 + 0.045), 2, '#1c1d1f');
    box(c, x0 + 0.02, x1 - 0.02, y1 - 0.01, y1 + 0.015, z0 + 0.05, z0 + 0.13, [18, 18, 20], 0.5, false); // thanh đèn nắp
    seg(c, P(x0 + 0.03, y1 - 0.012, z0 + 0.05), P(x1 - 0.03, y1 - 0.012, z0 + 0.05), 2, 'rgba(220,250,245,.55)');
    for (const [aa, bb] of [[[x0, y0, z0], [x0, y1 - 0.03, z0]], [[x1, y0, z0], [x1, y1 - 0.03, z0]], [[x0, y1 - 0.03, z0], [x1, y1 - 0.03, z0]]]) seg(c, P(...aa), P(...bb), 1.4, 'rgba(210,235,235,.35)');
    seg(c, P(x0 + 0.03, y1 - 0.05, z0), P(x0 + 0.03, y0 + 0.08, z0), 3, 'rgba(255,255,255,.07)');
    ANH.tank = [P(x0, y1 - 0.03, z0), P(x1, y0, z0)]; }
  // xương rồng thật trong chậu men xanh xám, sỏi trắng; xương rồng đồ chơi xanh rêu có hoa hồng nhạt; cốc bút
  shadow(0.67, 3.05, 0.07, 0.035); cyl(0.67, 3.05, 0.055, DY, 0.83, [92, 108, 128], kd(0.67, 3.05));
  { const top = P(0.67, 0.83, 3.05), r = 13; for (let i = 0; i < 10; i++) { c.fillStyle = 'rgba(215,212,205,.55)'; c.fillRect(top[0] - 10 + rnd() * 20, top[1] - 3 + rnd() * 5, 2.5, 2.5); }
    const g = c.createRadialGradient(top[0] - 4, top[1] - 18, 2, top[0], top[1] - 12, 18); g.addColorStop(0, '#5d7a52'); g.addColorStop(1, '#2c3e2a'); c.fillStyle = g; c.beginPath(); c.ellipse(top[0], top[1] - 12, r * 0.8, r, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(20,30,18,.6)'; c.lineWidth = 1; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(top[0] + i * 4, top[1] - 22); c.quadraticCurveTo(top[0] + i * 5.5, top[1] - 12, top[0] + i * 4, top[1] - 2); c.stroke(); } }
  shadow(0.84, 3.04, 0.07, 0.035); cyl(0.84, 3.04, 0.055, DY, 0.835, [196, 192, 184], kd(0.84, 3.04));
  { const top = P(0.84, 0.835, 3.04), g = c.createLinearGradient(top[0] - 14, 0, top[0] + 14, 0); g.addColorStop(0, '#3f6a42'); g.addColorStop(0.5, '#5e8d5a'); g.addColorStop(1, '#33553a'); c.fillStyle = g;
    c.beginPath(); c.ellipse(top[0], top[1] - 18, 13, 19, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(top[0] + 15, top[1] - 24, 6, 10, 0.4, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(top[0] - 13, top[1] - 12, 5, 8, -0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(30,45,30,.5)'; for (let i = 0; i < 12; i++) c.fillRect(top[0] - 9 + rnd() * 18, top[1] - 32 + rnd() * 28, 1.4, 1.4); c.fillStyle = '#b8788b'; c.beginPath(); c.arc(top[0] + 4, top[1] - 36, 4, 0, Math.PI * 2); c.fill(); }
  shadow(0.42, 3.06, 0.05, 0.03); cyl(0.42, 3.06, 0.04, DY, 0.87, [64, 82, 112], kd(0.42, 3.06)); shadow(0.52, 3.06, 0.045, 0.03); cyl(0.52, 3.06, 0.035, DY, 0.85, [170, 172, 176], kd(0.52, 3.06));
  for (let i = 0; i < 5; i++) seg(c, P(0.405 + i * 0.008, 0.87, 3.06), P(0.39 + i * 0.012, 0.96 + (i % 2) * 0.02, 3.06), 1.6, ['#555', '#7a2a2a', '#2a4a7a', '#666', '#444'][i]);
  // tấm lót chuột xanh đen
  poly(c, [P(-1.45, DY + 0.001, 2.68), P(-0.95, DY + 0.001, 2.68), P(-0.95, DY + 0.001, 2.95), P(-1.45, DY + 0.001, 2.95)], '#0e1610');
  // laptop: bóng đổ, thân, bàn phím, màn hình ngả ra sau có viền
  shadow(-0.16, 2.86, 0.27, 0.14, 0.5);
  box(c, -0.4, 0.08, DY, 0.765, 2.72, 2.98, [52, 54, 58], kd(-0.16, 2.85), true);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 12; k++) { const x = -0.37 + k * 0.035, z = 2.8 + r * 0.035; poly(c, [P(x, 0.766, z), P(x + 0.028, 0.766, z), P(x + 0.028, 0.766, z + 0.026), P(x, 0.766, z + 0.026)], 'rgba(18,19,22,.85)'); }
  { const o = [P(-0.4, 1.05, 3.03), P(0.08, 1.05, 3.03), P(0.08, 0.765, 2.98), P(-0.4, 0.765, 2.98)]; poly(c, o, '#121316'); seg(c, o[0], o[1], 1.2, 'rgba(255,220,180,.18)');
    ANH.scr = [P(-0.38, 1.035, 3.027), P(0.06, 1.035, 3.027), P(0.06, 0.785, 2.984), P(-0.38, 0.785, 2.984)]; poly(c, ANH.scr, '#0b0d12'); }
  // đèn học đen tay gập: đế kẹp mép bàn sau, hai cánh tay có khớp, chao hình nón chúc xuống
  { const arm = (a2, b3, r) => { const A = P(...a2), B = P(...b3), z = (a2[2] + b3[2]) / 2, w = Math.max(2.5, (F * r) / z); seg(c, A, B, w, '#0e0e10'); seg(c, [A[0] - w * 0.25, A[1] - w * 0.3], [B[0] - w * 0.25, B[1] - w * 0.3], Math.max(0.8, w * 0.25), 'rgba(255,215,170,.22)'); };
    box(c, -0.83, -0.73, DY - 0.05, DY + 0.03, 3.08, 3.17, [22, 22, 24], 0.5, false);
    const J0 = [-0.78, 0.79, 3.12], J1 = [-0.72, 1.34, 3.06], J2 = [-0.47, 1.4, 2.94];
    arm(J0, J1, 0.014); arm(J1, J2, 0.012);
    seg(c, P(J0[0] + 0.02, J0[1] + 0.05, J0[2]), P(J1[0] + 0.02, J1[1] - 0.08, J1[2]), 1, 'rgba(120,120,120,.4)'); // lò xo
    for (const J of [J0, J1, J2]) { const q = P(...J); c.fillStyle = '#18181a'; c.beginPath(); c.arc(q[0], q[1], 5, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,215,170,.2)'; c.beginPath(); c.arc(q[0] - 1.5, q[1] - 1.5, 1.6, 0, Math.PI * 2); c.fill(); }
    const top = P(-0.45, 1.41, 2.93), op = ellH(-0.38, 1.25, 2.88, 0.085, 0.06, 24);
    const lft = op.reduce((m, q) => (q[0] < m[0] ? q : m)), rgt = op.reduce((m, q) => (q[0] > m[0] ? q : m));
    const sg = c.createLinearGradient(lft[0], 0, rgt[0], 0); sg.addColorStop(0, '#060607'); sg.addColorStop(0.4, '#202024'); sg.addColorStop(1, '#09090a'); poly(c, [top, rgt, ...op.filter((q) => q[1] >= (lft[1] + rgt[1]) / 2 - 1).sort((u, v) => v[0] - u[0]), lft], sg);
    seg(c, top, rgt, 1.2, 'rgba(255,215,170,.25)');
    ANH.shade = op; }
  // điện thoại úp cạnh laptop (chỗ để; rung vẽ ở lớp động)
  ANH.phone = P(0.24, 0.766, 2.8);
  // ghế ở tiền cảnh: lưng ghế (đêm 1, 3 có người ngồi ngoài khung) — vẽ ở lớp động
  ANH.chair = [P(-0.24, 0.98, 2.25), P(0.14, 0.98, 2.25), P(0.16, 0.45, 2.25), P(-0.26, 0.45, 2.25)];
  ANH.pool = P(-0.33, 0.75, 2.86); ANH.tankC = P(1.19, 0.9, 2.95);
  for (let i = 0; i < 12000; i++) { c.fillStyle = `rgba(255,255,255,${rnd() * 0.02})`; c.fillRect(rnd() * W, rnd() * H, 1.2, 1.2); }
  vignette(c, 0.78);
  CAM.y = camY;
}
function drawAnhDyn(c, now, dt) {
  const m2 = ANH.mode === 2, m3 = ANH.mode === 3, lampOn = ANH.mode === 1;
  // BÓNG TỐI như phòng ngủ: chỉ vùng đèn học và bể cá soi tới
  const dk = anhDkG; dk.setTransform(1, 0, 0, 1, 0, 0); dk.clearRect(0, 0, anhDkC.width, anhDkC.height); setT(dk);
  dk.fillStyle = `rgba(0,0,0,${m2 || m3 ? 0.9 : 0.8})`; dk.fillRect(-300, -300, W + 600, H + 600); dk.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => { const g = dk.createRadialGradient(x, y, 10, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)'); dk.fillStyle = g; dk.fillRect(x - r, y - r, r * 2, r * 2); };
  if (lampOn) hole(ANH.pool[0], ANH.pool[1] - 60, 560, 0.95); if (!m2) hole(ANH.scr[0][0] + 60, ANH.scr[0][1] + 40, m3 ? 340 : 260, m3 ? 0.75 : 0.6);
  if (m3 && ANH.callAt && now > ANH.callAt) hole(ANH.phone[0], ANH.phone[1], 160, 0.7);
  const fl = 0.9 + 0.1 * Math.sin(now * 0.002); hole(ANH.tankC[0], ANH.tankC[1], m2 ? 360 : 300, (m2 ? 0.85 : 0.7) * fl);
  dk.globalCompositeOperation = 'source-over'; c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(anhDkC, 0, 0); setT(c);
  c.save(); c.globalCompositeOperation = 'lighter';
  if (lampOn) { const g = c.createRadialGradient(ANH.pool[0], ANH.pool[1], 10, ANH.pool[0], ANH.pool[1], 300); g.addColorStop(0, 'rgba(255,205,140,.26)'); g.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = g; c.fillRect(ANH.pool[0] - 300, ANH.pool[1] - 300, 600, 600);
    if (ANH.shade) { const op = ANH.shade, cx2 = op.reduce((s3, q) => s3 + q[0], 0) / op.length, cy2 = op.reduce((s3, q) => s3 + q[1], 0) / op.length;
      const cone = c.createLinearGradient(0, cy2, 0, ANH.pool[1] + 20); cone.addColorStop(0, 'rgba(255,215,160,.09)'); cone.addColorStop(1, 'rgba(255,215,160,0)'); c.fillStyle = cone; c.beginPath(); c.moveTo(cx2 - 24, cy2); c.lineTo(cx2 + 24, cy2); c.lineTo(ANH.pool[0] + 200, ANH.pool[1] + 14); c.lineTo(ANH.pool[0] - 170, ANH.pool[1] + 14); c.fill();
      const bulb = c.createRadialGradient(cx2, cy2, 1, cx2, cy2, 30); bulb.addColorStop(0, 'rgba(255,245,215,.95)'); bulb.addColorStop(1, 'rgba(255,215,160,0)'); c.fillStyle = bulb; c.fillRect(cx2 - 30, cy2 - 30, 60, 60); }
  }
  if (!m2) {    const s2 = ANH.scr, g2 = c.createLinearGradient(0, s2[0][1], 0, s2[2][1]); g2.addColorStop(0, 'rgba(150,180,230,.55)'); g2.addColorStop(1, 'rgba(110,140,200,.4)'); poly(c, s2, g2); }
  const g3 = c.createRadialGradient(ANH.tankC[0], ANH.tankC[1], 6, ANH.tankC[0], ANH.tankC[1], 240); g3.addColorStop(0, `rgba(170,235,225,${0.3 * fl})`); g3.addColorStop(1, 'rgba(170,235,225,0)'); c.fillStyle = g3; c.fillRect(ANH.tankC[0] - 240, ANH.tankC[1] - 240, 480, 480);
  const t2 = ANH.tank; c.fillStyle = `rgba(190,245,235,${0.16 * fl})`; c.fillRect(t2[0][0], t2[0][1], t2[1][0] - t2[0][0], (t2[1][1] - t2[0][1]) * 0.6);
  c.restore();
  // mặt nước gợn, bọt máy lọc
  c.strokeStyle = 'rgba(230,255,250,.3)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { const y = t2[0][1] + 6 + i * 5, o = Math.sin(now * 0.003 + i) * 6; c.beginPath(); c.moveTo(t2[0][0] + 8 + o, y); c.lineTo(t2[1][0] - 20 + o, y); c.stroke(); }
  c.fillStyle = 'rgba(230,250,255,.55)'; for (let i = 0; i < 7; i++) { const y = t2[1][1] - 6 - ((now * 0.04 + i * 11) % ((t2[1][1] - t2[0][1]) * 0.85)); c.beginPath(); c.arc(t2[1][0] - 18 + Math.sin(now * 0.004 + i) * 2, y, 1.4, 0, Math.PI * 2); c.fill(); }
  if (!m2) { const s2 = ANH.scr; c.fillStyle = 'rgba(20,30,50,.5)'; for (let i = 0; i < 4; i++) c.fillRect(s2[0][0] + 12, s2[0][1] + 18 + i * 13, 50 + ((i * 29) % 40), 4); c.fillStyle = 'rgba(235,240,250,.85)'; c.font = `11px 'Be Vietnam Pro', sans-serif`; c.fillText('23:51', s2[1][0] - 36, s2[0][1] + 12);
    // điện thoại úp: rung từng hồi, mép hắt sáng
    const bz = ANH.buzz.some((b) => now > b && now < b + 450) || now - ANH.tap < 450 || (m3 && ANH.callAt && now > ANH.callAt), jx = bz && !(m3 && ANH.callAt && now > ANH.callAt) ? Math.sin(now * 0.9) * 2 : 0, ph = ANH.phone;
    if (bz) { c.save(); c.globalCompositeOperation = 'lighter'; const g4 = c.createRadialGradient(ph[0], ph[1], 3, ph[0], ph[1], 50); g4.addColorStop(0, 'rgba(160,190,255,.35)'); g4.addColorStop(1, 'rgba(160,190,255,0)'); c.fillStyle = g4; c.fillRect(ph[0] - 50, ph[1] - 50, 100, 100); c.restore(); }
    c.fillStyle = '#0a0a0c'; roundRect(c, ph[0] - 24 + jx, ph[1] - 5, 48, 11, 3); c.fill();
    // lưng ghế: có người đang ngồi làm việc, ngoài khung hình
    { const ch = ANH.chair, mx = (ch[0][0] + ch[1][0]) / 2; c.fillStyle = '#08080a'; c.beginPath(); c.moveTo(ch[3][0], ch[3][1]); c.lineTo(ch[0][0], ch[0][1] + 14); c.quadraticCurveTo(mx, ch[0][1] - 16, ch[1][0], ch[1][1] + 14); c.lineTo(ch[2][0], ch[2][1]); c.fill(); c.strokeStyle = 'rgba(255,200,140,.14)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(ch[0][0] + 4, ch[0][1] + 12); c.quadraticCurveTo(mx, ch[0][1] - 14, ch[1][0] - 4, ch[1][1] + 12); c.stroke(); }
  } else { const ch = ANH.chair, dy = 70; poly(c, [[ch[0][0] + 20, ch[0][1] + dy + 60], [ch[1][0] - 20, ch[1][1] + dy + 60], [ch[2][0] - 20, ch[2][1] + dy], [ch[3][0] + 20, ch[3][1] + dy]], '#060608'); }
  grain(c, 400, 0.025);
}
// tiếng phòng anh: quạt laptop, bể cá, gõ phím từng đợt, điện thoại rung trên gỗ, xe xa
function anhSound() {
  const bus = ac.createGain(); bus.gain.value = 0; bus.connect(master); ramp(bus.gain, 1, 1.2);
  const parts = []; const pan = (v) => { const p = ac.createStereoPanner(); p.pan.value = 0; p.connect(bus); parts.push([p, v]); return p; };
  const m2 = ANH.mode === 2;
  const fan = loopNoise(m2 ? 0 : 0.012, 'bandpass', 1400, 0.8); fan.gain.connect(pan(-0.35)); // quạt laptop: một làn gió mảnh, không ù
  const hum = ac.createOscillator(); hum.frequency.value = 118; const hg = ac.createGain(); hg.gain.value = 0; hum.connect(hg).connect(pan(-0.35)); hum.start();
  const city = loopNoise(0, 'lowpass', 240, 0.6, 0.6); city.gain.connect(pan(0.85)); // không còn ù nền; thỉnh thoảng một xe máy chạy qua xa
  const moto = () => { if (!ANH.on) return; const t = ac.currentTime, d = 3.5 + Math.random() * 2, mb = loopNoise(0, 'bandpass', 260, 1.5, 0.8), mp = ac.createStereoPanner(), dir = Math.random() < 0.5 ? 1 : -1; mp.pan.setValueAtTime(-0.9 * dir, t); mp.pan.linearRampToValueAtTime(0.9 * dir, t + d); mb.gain.connect(mp).connect(bus); mb.gain.gain.setValueAtTime(0, t); mb.gain.gain.linearRampToValueAtTime(0.03, t + d / 2); mb.gain.gain.linearRampToValueAtTime(0, t + d); setTimeout(() => mb.src.stop(), d * 1000 + 200); }; setTimeout(moto, 4000 + Math.random() * 5000);
  const bubP = pan(0.6), typP = pan(0.08), phP = pan(0.2);
  const bubble = setInterval(() => { const t = ac.currentTime; nz(t, 0.018, 'bandpass', 1400 + Math.random() * 2800, 9, 0.05 + Math.random() * 0.08, 0, 0, bubP); }, 85);
  const type = () => { if (!ANH.on) return; const t = ac.currentTime, n = 4 + ((Math.random() * 9) | 0); for (let i = 0; i < n; i++) { const tt = t + i * (0.09 + Math.random() * 0.07); nz(tt, 0.012, 'highpass', 2600, 0.7, 0.22, 0, 0, typP); nz(tt + 0.004, 0.03, 'bandpass', 950, 2, 0.12, 0, 0, typP); } ANH.typ = setTimeout(type, 1800 + Math.random() * 2600); };
  if (ANH.mode === 1) setTimeout(type, 1400); else if (m2) setTimeout(() => { const t = ac.currentTime; const mb = loopNoise(0, 'lowpass', 300, 0.8, 0.7); const mp = ac.createStereoPanner(); mp.pan.value = 0.9; mb.gain.connect(mp).connect(bus); mb.gain.gain.setValueAtTime(0, t); mb.gain.gain.linearRampToValueAtTime(0.05, t + 2.5); mb.gain.gain.linearRampToValueAtTime(0, t + 5); mp.pan.setValueAtTime(0.9, t); mp.pan.linearRampToValueAtTime(-0.6, t + 5); setTimeout(() => mb.src.stop(), 5500); }, 6000);
  const buzz = (t) => { for (let k = 0; k < 2; k++) { const t0 = t + k * 0.7, o = ac.createOscillator(); o.type = 'square'; o.frequency.value = 162; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 330; bp.Q.value = 3; const e = ac.createGain(); e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(0.05, t0 + 0.03); e.gain.setValueAtTime(0.05, t0 + 0.42); e.gain.linearRampToValueAtTime(0, t0 + 0.46); o.connect(bp).connect(e).connect(phP); o.start(t0); o.stop(t0 + 0.5); nz(t0, 0.45, 'bandpass', 2100, 5, 0.04, 0, 0, phP); } };
  // tiếng vào giữa trước (một kênh), rồi mới mở ra hai bên
  setTimeout(() => { for (const [p, v] of parts) ramp(p.pan, v, 3.5); }, 1500);
  return { bus, buzz, stop() { ANH.on = false; clearInterval(bubble); clearTimeout(ANH.typ); ramp(bus.gain, 0, 1.2); setTimeout(() => { fan.src.stop(); city.src.stop(); hum.stop(); }, 1400); } };
}
SC.anh1 = {
  bake: bakeAnh, noBag: true,
  enter() { ANH.t = 0; ANH.on = true; HINT.off = true; HINT.text = ''; ANH.snd = anhSound(); const n = performance.now(); ANH.callAt = 0;
    if (ANH.mode === 3) { // hai hồi rung không ai nghe, im, rồi anh gọi lại: tiếng chờ máy
      ANH.buzz = [3, 3.9, 4.8, 5.7, 6.6, 10.5, 11.4, 12.3, 13.2, 14.1].map((d) => n + d * 1000); ANH.callAt = n + 17500;
      setTimeout(() => { if (!ANH.on) return; const t = ac.currentTime; for (let i = 0; i < 2; i++) { tone(t + 0.4 + i * 3.2, 425, 425, 0.025, 1.0); } FX.tap(); }, 17500);
    } else ANH.buzz = ANH.mode === 2 ? [] : [5200, 10800, 16500].map((d) => n + d); ANH.buzz.forEach((b) => setTimeout(() => ANH.on && ANH.snd.buzz(ac.currentTime), b - n)); },
  draw(c, now, dt) {
    ANH.t += dt;
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(anhC, 0, 0); setT(c); drawAnhDyn(c, now, dt);
    // tiếng vào trước, hình hiện sau; cuối thì tối dần
    const a = ANH.t < 2.4 ? 1 : ANH.t < 5.4 ? 1 - (ANH.t - 2.4) / 3 : ANH.t > ANH.dur - 2.5 ? (ANH.t - (ANH.dur - 2.5)) / 2.5 : 0;
    if (a > 0) { c.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`; c.fillRect(-300, -300, W + 600, H + 600); }
    if (ANH.t > ANH.dur && ANH.done) { const f = ANH.done; ANH.done = null; ANH.snd.stop(); f(); }
  },
  tap(p) { if (ANH.phone && Math.hypot(p[0] - ANH.phone[0], p[1] - ANH.phone[1]) < 80) { ANH.tap = performance.now(); ANH.snd && ANH.snd.buzz(ac.currentTime); } },
};
ANH.dur = 22;
// gọi từ tapeStart(..., flip): phòng 1 dùng
function flipToAnh(done) { ANH.mode = 1; ANH.dur = 22; ANH.done = done; go('anh1', 1200); }
