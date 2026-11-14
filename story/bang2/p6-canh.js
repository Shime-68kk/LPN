'use strict';
// NGÁCH ĐÌNH LÀNG & NGÕ SÂU HÀ NỘI LÚC 22 GIỜ (chỉ hình & vùng chạm HOT_NGO, chưa có câu đố).
// Dùng chung lõi từ core.js: W, H, cv, setT, layer, roundRect, vignette, grain, clamp, lerp, SC, nudge.
// Tương thích nạp độc lập (thu-ngo.html) và nạp chung với p1.js / p2-canh.js / p-nha-tro.js / p-cau-thang.js:
// - Bọc toàn bộ logic nội bộ trong IIFE, dùng PRNG riêng (arnd) để không lệch seed của p1.js.
// - Không khai báo lại const HOT của p1.js; xuất NG, NGO và HOT_NGO[0..3] = { thang, trai, phai }.
// - Vùng an toàn y 100..800; góc trên trái (x<200,y<240) trống cho drawBack; dải y 680..780 trống cho gợi ý/phụ đề.
// - Tuyệt đối không viết tên đường, số nhà, biển số, tên ngõ hay bất kỳ địa chỉ nào; không người, không emoji/icon sẵn.

var NG = { soi: null, khe: null };
var NGO = { canh: 0 };
var HOT_NGO = { 0: {}, 1: {}, 2: {}, 3: {} };
var LN = { t: 0, xong: null, auto: true };

(() => {
  // ---------- PRNG riêng cho cảnh ngách & ngõ ----------
  let aseed = 79;
  const arnd = () => ((aseed = (aseed * 16807) % 2147483647) / 2147483647);

  function poly(c, pts, fill) {
    c.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i) c.lineTo(pts[i][0], pts[i][1]);
      else c.moveTo(pts[i][0], pts[i][1]);
    }
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }

  function strokePoly(c, pts, w, col, closed = true) {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const dx = (arnd() - 0.5) * 0.6;
      const dy = (arnd() - 0.5) * 0.6;
      if (i) c.lineTo(pts[i][0] + dx, pts[i][1] + dy);
      else c.moveTo(pts[i][0] + dx, pts[i][1] + dy);
    }
    if (closed) c.closePath();
    c.stroke();
  }

  function seg(c, a, b, w, col) {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(a[0] + (arnd() - 0.5) * 0.6, a[1] + (arnd() - 0.5) * 0.6);
    c.lineTo(b[0] + (arnd() - 0.5) * 0.6, b[1] + (arnd() - 0.5) * 0.6);
    c.stroke();
  }

  function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  // ---------- Sprite ánh sáng & mặt nạ dựng sẵn một lần (không tạo gradient trong draw) ----------
  const SP_A = {};
  function buildSprites() {
    if (SP_A.warm) return;
    const mk = (n, stops) => {
      const cv2 = document.createElement('canvas');
      cv2.width = cv2.height = n;
      const x = cv2.getContext('2d');
      const gr = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
      x.fillStyle = gr;
      x.fillRect(0, 0, n, n);
      return cv2;
    };
    SP_A.warm = mk(128, [
      [0, 'rgba(255,204,118,0.86)'],
      [0.24, 'rgba(255,168,78,0.40)'],
      [0.58, 'rgba(225,130,52,0.10)'],
      [1, 'rgba(195,105,40,0)'],
    ]);
    SP_A.glow = mk(96, [
      [0, 'rgba(255,246,216,1)'],
      [0.20, 'rgba(255,212,140,0.75)'],
      [0.55, 'rgba(255,162,82,0.20)'],
      [1, 'rgba(240,140,65,0)'],
    ]);
    SP_A.tube = mk(128, [
      [0, 'rgba(198,230,255,0.72)'],
      [0.26, 'rgba(155,198,242,0.32)'],
      [0.62, 'rgba(115,162,210,0.09)'],
      [1, 'rgba(90,135,190,0)'],
    ]);
    SP_A.torch = mk(128, [
      [0, 'rgba(255,244,210,0.88)'],
      [0.24, 'rgba(255,222,165,0.42)'],
      [0.58, 'rgba(225,186,128,0.12)'],
      [1, 'rgba(195,155,102,0)'],
    ]);
    SP_A.cut = mk(128, [
      [0, 'rgba(0,0,0,1)'],
      [0.34, 'rgba(0,0,0,0.92)'],
      [0.64, 'rgba(0,0,0,0.44)'],
      [1, 'rgba(0,0,0,0)'],
    ]);
    SP_A.cool = mk(128, [
      [0, 'rgba(216,242,255,0.88)'],
      [0.26, 'rgba(138,202,248,0.44)'],
      [0.58, 'rgba(84,154,218,0.14)'],
      [1, 'rgba(60,120,185,0)'],
    ]);
  }

  // ============================================================================
  // CẢNH 1 · SC.ngach · NGÁCH RẤT HẸP MEN BỨC TƯỜNG ĐÌNH LÀNG LỘ GẠCH ĐÊM SÂU
  // ============================================================================
  const NG_CAM = { y: 1.38 };
  const NG_F = 840;
  const NG_VX = 980;
  const NG_VY = 325;
  const PN = (x, y, z) => [NG_VX + (NG_F * x) / z, NG_VY + (NG_F * (NG_CAM.y - y)) / z];

  const [ngLitC, ngLitG] = layer();
  const [ngDarkMaskC, ngDarkMaskG] = layer();
  let ngBaked = false;
  let ngEndSlit = { x: 944, y: 290, w: 34, h: 120, cx: 960, cy: 355 };
  let ngMossGlowPts = [];

  // Khởi tạo toạ độ khe ngách NG.khe ngay khi nạp script (nằm trong y 100..675, tránh góc trên trái và dải 680..780)
  function initNgachGeom() {
    const cTL = PN(-0.68, 2.48, 3.7);
    const cBL = PN(-0.68, 0.0, 3.7);
    const rTR = PN(-0.04, 2.55, 4.1);
    const rBR = PN(-0.04, 0.0, 4.1);
    const minX = Math.min(cTL[0], cBL[0]) - 10;
    const maxX = Math.max(rTR[0], rBR[0]) + 10;
    const minY = Math.max(150, Math.min(cTL[1], rTR[1]));
    const maxY = Math.min(660, Math.max(cBL[1], rBR[1]));
    NG.khe = {
      x: Math.round(minX),
      y: Math.round(minY),
      w: Math.round(maxX - minX),
      h: Math.round(maxY - minY),
    };
    if (SC.ngach) SC.ngach.hot = { khe: NG.khe };
  }

  // Tạo viền đa giác nham nhở tự nhiên cho vết vữa bong (tránh hình lục giác đều)
  function jaggedRing(basePts, jitter) {
    const out = [];
    for (let i = 0; i < basePts.length; i++) {
      const a = basePts[i];
      const b = basePts[(i + 1) % basePts.length];
      out.push(a);
      const midX = (a[0] + b[0]) * 0.5 + (arnd() - 0.5) * jitter;
      const midY = (a[1] + b[1]) * 0.5 + (arnd() - 0.5) * jitter;
      out.push([midX, midY]);
    }
    return out;
  }

  // Vẽ mảng vữa bong lộ gạch cổ có viền vữa tróc hai tầng (nền ẩm -> vữa lót xám -> gạch xếp so le)
  function drawBrickCoursesFront(c, x0, x1, y0, y1, z, basePts) {
    const outerPts = jaggedRing(basePts, 14);
    const innerPts = jaggedRing(basePts, 8);

    // 1. Vết ẩm sẫm loang nhẹ quanh chỗ vữa mục
    c.save();
    c.globalAlpha = 0.28;
    poly(c, outerPts, '#16140f');
    c.restore();

    // 2. Viền lớp vữa lót xám vôi tróc nham nhở hơi nhô ra ở rìa
    strokePoly(c, innerPts, 4.5, '#3b352b', true);

    c.save();
    c.beginPath();
    for (let i = 0; i < innerPts.length; i++) {
      if (i) c.lineTo(innerPts[i][0], innerPts[i][1]);
      else c.moveTo(innerPts[i][0], innerPts[i][1]);
    }
    c.closePath();
    c.clip();

    // Lớp nền vữa cát cổ sâu bên dưới hàng gạch
    poly(c, innerPts, '#281c16');

    const rows = Math.max(4, Math.round((y1 - y0) / 0.068));
    const cols = Math.max(4, Math.round((x1 - x0) / 0.165));
    const dy = (y1 - y0) / rows;
    const dx = (x1 - x0) / cols;
    for (let r = 0; r < rows; r++) {
      const by0 = y0 + r * dy + 0.006;
      const by1 = y0 + (r + 1) * dy - 0.007;
      const stagger = (r % 2) * 0.5 * dx;
      for (let col = -1; col <= cols; col++) {
        const bx0 = Math.max(x0, x0 + col * dx + stagger + 0.007);
        const bx1 = Math.min(x1, x0 + (col + 1) * dx + stagger - 0.007);
        if (bx1 - bx0 < 0.018) continue;
        const tone = arnd();
        const damp = Math.max(0, 1 - by0 / 0.65) * 0.40;
        const soot = tone < 0.18 ? 0.72 : 1;
        const cr = Math.round((76 + tone * 38) * (1 - damp) * soot);
        const cg = Math.round((39 + tone * 20) * (1 - damp * 0.7) * soot);
        const cb = Math.round((27 + tone * 14) * (1 - damp * 0.5) * soot);
        const p0 = PN(bx0, by0, z);
        const p1 = PN(bx1, by0, z);
        const p2 = PN(bx1, by1, z);
        const p3 = PN(bx0, by1, z);
        poly(c, [p0, p1, p2, p3], `rgb(${cr},${cg},${cb})`);
        // Mạch vữa cát nhạt hở nhẹ & cạnh khuất tối dưới viên gạch
        seg(c, p3, p2, 0.9, 'rgba(182,158,132,0.16)');
        seg(c, p0, p1, 1.0, 'rgba(12,7,5,0.48)');
      }
    }
    // Bóng hắt từ gờ vữa trên hắt xuống hàng gạch trên cùng
    c.fillStyle = 'rgba(8,6,5,0.42)';
    c.fillRect(0, innerPts[0][1] - 18, W, 24);
    c.restore();

    // Chỉ nhấn cạnh rìa trên-trái khuất bóng & rìa sáng nhẹ phía dưới-phải, tránh viền đen khép kín
    strokePoly(c, innerPts.slice(0, Math.ceil(innerPts.length * 0.45)), 1.8, 'rgba(14,11,9,0.65)', false);
    strokePoly(c, innerPts.slice(Math.floor(innerPts.length * 0.45)), 1.1, 'rgba(165,152,126,0.26)', false);
  }

  function drawBrickCoursesSide(c, xWall, y0, y1, z0, z1, basePts) {
    const innerPts = jaggedRing(basePts, 6);
    strokePoly(c, innerPts, 3.0, '#302a22', true);

    c.save();
    c.beginPath();
    for (let i = 0; i < innerPts.length; i++) {
      if (i) c.lineTo(innerPts[i][0], innerPts[i][1]);
      else c.moveTo(innerPts[i][0], innerPts[i][1]);
    }
    c.closePath();
    c.clip();
    poly(c, innerPts, '#221712');

    const rows = Math.max(4, Math.round((y1 - y0) / 0.068));
    const cols = Math.max(5, Math.round((z1 - z0) / 0.19));
    const dy = (y1 - y0) / rows;
    const dz = (z1 - z0) / cols;
    for (let r = 0; r < rows; r++) {
      const by0 = y0 + r * dy + 0.006;
      const by1 = y0 + (r + 1) * dy - 0.007;
      const stag = (r % 2) * 0.5 * dz;
      for (let col = -1; col <= cols; col++) {
        const bz0 = Math.max(z0, z0 + col * dz + stag + 0.009);
        const bz1 = Math.min(z1, z0 + (col + 1) * dz + stag - 0.009);
        if (bz1 - bz0 < 0.025) continue;
        const depthFade = clamp(1 - (bz0 - z0) / (z1 - z0 + 2.2), 0.34, 1);
        const tone = arnd();
        const cr = Math.round((74 + tone * 32) * depthFade);
        const cg = Math.round((39 + tone * 17) * depthFade);
        const cb = Math.round((27 + tone * 13) * depthFade);
        const p0 = PN(xWall, by0, bz0);
        const p1 = PN(xWall, by0, bz1);
        const p2 = PN(xWall, by1, bz1);
        const p3 = PN(xWall, by1, bz0);
        poly(c, [p0, p1, p2, p3], `rgb(${cr},${cg},${cb})`);
        seg(c, p0, p1, 0.85, 'rgba(12,7,5,0.48)');
      }
    }
    c.restore();
    strokePoly(c, innerPts.slice(0, Math.ceil(innerPts.length * 0.5)), 1.5, 'rgba(10,8,6,0.62)', false);
  }

  // Vẽ đám rêu xù xì hữu cơ bám sát chân tường và kẽ đá (không dùng hình elip phẳng)
  function drawMossTuft(c, cx, cy, rx, ry, colDark, colMid, colTip) {
    const lobes = 7;
    const pts = [];
    for (let i = 0; i < lobes; i++) {
      const ang = (i / lobes) * Math.PI * 2;
      const rr = 0.62 + arnd() * 0.58;
      pts.push([cx + Math.cos(ang) * rx * rr, cy + Math.sin(ang) * ry * rr]);
    }
    poly(c, pts, colDark);
    const sub = [];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.3;
      const rr = 0.45 + arnd() * 0.42;
      sub.push([cx - rx * 0.14 + Math.cos(ang) * rx * 0.62 * rr, cy - ry * 0.18 + Math.sin(ang) * ry * 0.58 * rr]);
    }
    poly(c, sub, colMid);
    for (let k = 0; k < 2; k++) {
      const tx = cx + (arnd() - 0.5) * rx * 0.7;
      const ty = cy - ry * (0.1 + arnd() * 0.45);
      c.fillStyle = colTip;
      c.fillRect(tx, ty, 3.2, 2.2);
    }
  }

  function bakeNgach() {
    if (!cv.width || !cv.height) return;
    buildSprites();
    initNgachGeom();
    ngLitC.width = cv.width;
    ngLitC.height = cv.height;
    ngDarkMaskC.width = Math.max(2, cv.width >> 1);
    ngDarkMaskC.height = Math.max(2, cv.height >> 1);
    aseed = 79;
    ngMossGlowPts = [];

    const c = ngLitG;
    setT(c);

    const zFront = 3.7;
    const zRightCorner = 4.1;
    const zEnd = 16.0;
    const xLeftWall = -0.68;
    const xRightWall = -0.04;
    const wallTop = 2.12;

    // 1. Nền đêm sâu & khe trời hẹp trên đỉnh ngách
    c.fillStyle = '#030508';
    c.fillRect(-300, -300, W + 600, H + 600);

    let gr = c.createLinearGradient(0, 80, 0, 360);
    gr.addColorStop(0, '#04070e');
    gr.addColorStop(0.65, '#09101d');
    gr.addColorStop(1, '#0d1624');
    poly(c, [PN(xLeftWall - 0.08, wallTop - 0.12, zFront), PN(xRightWall + 0.08, wallTop - 0.12, zFront), PN(xRightWall + 0.08, 1.5, zEnd), PN(xLeftWall - 0.08, 1.5, zEnd)], gr);

    // 2. Mặt đường lát gạch/đá cổ ẩm tối trước & dọc khe ngách (giữ dải y 680..780 tối trầm sạch)
    gr = c.createLinearGradient(0, PN(0, 0, zEnd)[1], 0, 860);
    gr.addColorStop(0, '#221c13');
    gr.addColorStop(0.28, '#171916');
    gr.addColorStop(0.65, '#0f1210');
    gr.addColorStop(1, '#050607');
    poly(c, [PN(-3.6, 0, 1.8), PN(3.0, 0, 1.8), PN(3.0, 0, zEnd), PN(-3.6, 0, zEnd)], gr);

    for (let z = 3.85; z <= zEnd - 0.4; z += 0.52) {
      seg(c, PN(xLeftWall + 0.02, 0.004, z), PN(xRightWall - 0.02, 0.004, z), 1.0, 'rgba(6,7,9,0.68)');
    }
    seg(c, PN(-0.36, 0.004, zFront), PN(-0.36, 0.004, zEnd), 1.1, 'rgba(7,10,8,0.58)');

    // 3. Cuối ngách (z = zEnd): vệt sáng vàng hẹp xa xa lọt qua khe ngách
    const eTL = PN(xLeftWall - 0.01, 1.86, zEnd);
    const eTR = PN(xRightWall + 0.01, 1.86, zEnd);
    const eBR = PN(xRightWall + 0.01, 0.0, zEnd);
    const eBL = PN(xLeftWall - 0.01, 0.0, zEnd);
    ngEndSlit = {
      x: Math.min(eTL[0], eBL[0]),
      y: Math.min(eTL[1], eTR[1]),
      w: Math.max(8, Math.max(eTR[0], eBR[0]) - Math.min(eTL[0], eBL[0])),
      h: Math.max(30, Math.max(eBL[1], eBR[1]) - Math.min(eTL[1], eTR[1])),
      cx: (eTL[0] + eBR[0]) * 0.5,
      cy: (eTL[1] + eBR[1]) * 0.5,
    };
    gr = c.createLinearGradient(eTL[0], eTL[1], eBR[0], eBR[1]);
    gr.addColorStop(0, '#5a4324');
    gr.addColorStop(0.52, '#ad8245');
    gr.addColorStop(1, '#312516');
    poly(c, [eBL, eTL, eTR, eBR], gr);

    // Vệt ánh sáng vàng đổ ngược nhẹ trên phiến đá cuối khe ngách
    gr = c.createLinearGradient(0, PN(0, 0, zEnd)[1], 0, PN(0, 0, zEnd - 3.2)[1]);
    gr.addColorStop(0, 'rgba(218,162,82,0.55)');
    gr.addColorStop(1, 'rgba(85,62,32,0)');
    poly(c, [PN(xLeftWall, 0.005, zEnd), PN(xRightWall, 0.005, zEnd), PN(xRightWall, 0.005, zEnd - 3.2), PN(xLeftWall, 0.005, zEnd - 3.2)], gr);

    // 4. Tường đình làng cổ (màu vôi ve vàng xỉn lâu năm thấm rêu, giữ góc trên-trái tối sâu)
    gr = c.createLinearGradient(PN(-3.2, 0, zFront)[0], 0, PN(xLeftWall, 0, zFront)[0], 0);
    gr.addColorStop(0, '#0a0b0c');
    gr.addColorStop(0.30, '#2e2920');
    gr.addColorStop(0.75, '#473f31');
    gr.addColorStop(1, '#544a39');
    poly(c, [PN(-3.4, 0, zFront), PN(xLeftWall, 0, zFront), PN(xLeftWall, wallTop, zFront), PN(-3.4, wallTop, zFront)], gr);

    // Mặt tường hông đình chạy sâu vào khe ngách (tối dần rồi hơi ấm nhẹ gần cuối ngách)
    gr = c.createLinearGradient(PN(xLeftWall, 0, zFront)[0], 0, PN(xLeftWall, 0, zEnd)[0], 0);
    gr.addColorStop(0, '#3e372b');
    gr.addColorStop(0.55, '#1f1b15');
    gr.addColorStop(0.88, '#14110d');
    gr.addColorStop(1, '#282016');
    poly(c, [PN(xLeftWall, 0, zFront), PN(xLeftWall, wallTop, zFront), PN(xLeftWall, wallTop - 0.16, zEnd), PN(xLeftWall, 0, zEnd)], gr);

    // Khung ô vữa cổ chìm trên mặt tường đình (chi tiết kiến trúc tường đình làng, để trống sạch không chữ)
    const frPts = [PN(-2.12, 1.38, zFront), PN(-0.92, 1.38, zFront), PN(-0.92, 1.84, zFront), PN(-2.12, 1.84, zFront)];
    strokePoly(c, frPts, 3.2, 'rgba(22,19,15,0.52)', true);
    strokePoly(c, [PN(-2.06, 1.43, zFront), PN(-0.98, 1.43, zFront), PN(-0.98, 1.79, zFront), PN(-2.06, 1.79, zFront)], 1.4, 'rgba(175,158,125,0.16)', true);

    // Bờ mái ngói mũi hài cổ chạy dọc đỉnh tường đình + hàng ngói ống sẫm màu
    poly(c, [PN(-3.4, wallTop - 0.08, zFront), PN(xLeftWall + 0.05, wallTop - 0.08, zFront), PN(xLeftWall + 0.05, wallTop + 0.11, zFront), PN(-3.4, wallTop + 0.11, zFront)], '#1b1411');
    poly(c, [PN(-3.4, wallTop - 0.13, zFront), PN(xLeftWall + 0.05, wallTop - 0.13, zFront), PN(xLeftWall + 0.05, wallTop - 0.07, zFront), PN(-3.4, wallTop - 0.07, zFront)], '#2d251d');
    poly(c, [PN(xLeftWall - 0.02, wallTop - 0.08, zFront), PN(xLeftWall + 0.05, wallTop - 0.08, zFront), PN(xLeftWall + 0.05, wallTop - 0.22, zEnd), PN(xLeftWall - 0.02, wallTop - 0.22, zEnd)], '#120e0c');
    for (let xm = -2.3; xm <= xLeftWall; xm += 0.12) {
      const ta = PN(xm, wallTop - 0.08, zFront);
      const tb = PN(xm + 0.01, wallTop + 0.10, zFront);
      seg(c, ta, tb, 1.5, 'rgba(7,6,5,0.68)');
      c.fillStyle = '#291b16';
      c.beginPath();
      c.arc(ta[0], tb[1], 5, 0, Math.PI);
      c.fill();
    }

    // Trụ cột góc đầu tường đình (chi tiết trụ thấp cổ + chỉ gờ đầu cột)
    poly(c, [PN(xLeftWall - 0.20, 0, zFront - 0.03), PN(xLeftWall + 0.01, 0, zFront - 0.03), PN(xLeftWall + 0.01, wallTop - 0.08, zFront - 0.03), PN(xLeftWall - 0.20, wallTop - 0.08, zFront - 0.03)], '#433b2e');
    poly(c, [PN(xLeftWall - 0.22, wallTop - 0.20, zFront - 0.04), PN(xLeftWall + 0.02, wallTop - 0.20, zFront - 0.04), PN(xLeftWall + 0.02, wallTop - 0.09, zFront - 0.04), PN(xLeftWall - 0.22, wallTop - 0.09, zFront - 0.04)], '#332c22');
    seg(c, PN(xLeftWall - 0.20, 0, zFront - 0.03), PN(xLeftWall - 0.20, wallTop - 0.08, zFront - 0.03), 1.6, 'rgba(14,12,10,0.65)');
    seg(c, PN(xLeftWall, 0, zFront), PN(xLeftWall, wallTop - 0.08, zFront), 1.8, 'rgba(195,176,142,0.24)');

    // Bệ chân tường đình giật cấp (cao 0..0.34m)
    poly(c, [PN(-3.4, 0, zFront - 0.02), PN(xLeftWall, 0, zFront - 0.02), PN(xLeftWall, 0.34, zFront - 0.02), PN(-3.4, 0.34, zFront - 0.02)], '#25261e');
    poly(c, [PN(xLeftWall, 0, zFront), PN(xLeftWall, 0.34, zFront), PN(xLeftWall, 0.34, zEnd), PN(xLeftWall, 0, zEnd)], '#191b15');
    seg(c, PN(-3.0, 0.34, zFront - 0.02), PN(xLeftWall, 0.34, zFront - 0.02), 1.6, 'rgba(162,150,126,0.22)');

    // Vết loang ẩm sẫm chảy từ mái ngói xuống mặt vôi cổ
    const wallStains = [
      [-1.98, 1.50, 0.32, 0.85, 0.22],
      [-1.34, 1.18, 0.26, 0.82, 0.20],
      [-0.96, 0.78, 0.20, 0.58, 0.24],
    ];
    for (let i = 0; i < wallStains.length; i++) {
      const [sx, sy, rx, ry, al] = wallStains[i];
      const sc = PN(sx, sy, zFront);
      const sr = PN(sx + rx, sy + ry, zFront);
      c.fillStyle = `rgba(9,11,8,${al})`;
      c.beginPath();
      c.ellipse(sc[0], sc[1], Math.abs(sr[0] - sc[0]), Math.abs(sr[1] - sc[1]), 0.05, 0, Math.PI * 2);
      c.fill();
    }

    // Các mảng VỮA BONG LỘ GẠCH tự nhiên trên mặt trước & mặt tường men ngách
    const patchFront1 = [
      PN(-2.06, 1.40, zFront), PN(-1.72, 1.46, zFront), PN(-1.38, 1.34, zFront),
      PN(-1.24, 1.04, zFront), PN(-1.34, 0.70, zFront), PN(-1.64, 0.60, zFront),
      PN(-1.98, 0.68, zFront), PN(-2.14, 0.98, zFront),
    ];
    drawBrickCoursesFront(c, -2.18, -1.20, 0.56, 1.50, zFront, patchFront1);

    const patchFront2 = [
      PN(-1.30, 0.64, zFront), PN(-1.02, 0.68, zFront), PN(-0.84, 0.50, zFront),
      PN(-0.82, 0.16, zFront), PN(-1.08, 0.10, zFront), PN(-1.36, 0.16, zFront),
      PN(-1.42, 0.42, zFront),
    ];
    drawBrickCoursesFront(c, -1.45, -0.80, 0.08, 0.72, zFront, patchFront2);

    const patchFront3 = [
      PN(-1.12, 1.72, zFront), PN(-0.88, 1.76, zFront), PN(-0.82, 1.52, zFront),
      PN(-0.96, 1.42, zFront), PN(-1.18, 1.50, zFront),
    ];
    drawBrickCoursesFront(c, -1.22, -0.80, 1.38, 1.80, zFront, patchFront3);

    const patchSide1 = [
      PN(xLeftWall, 1.24, 4.10), PN(xLeftWall, 1.32, 5.25), PN(xLeftWall, 1.04, 6.20),
      PN(xLeftWall, 0.44, 6.00), PN(xLeftWall, 0.22, 4.82), PN(xLeftWall, 0.44, 4.00),
    ];
    drawBrickCoursesSide(c, xLeftWall, 0.18, 1.36, 3.95, 6.30, patchSide1);

    const patchSide2 = [
      PN(xLeftWall, 0.78, 6.75), PN(xLeftWall, 0.84, 8.20), PN(xLeftWall, 0.14, 8.30),
      PN(xLeftWall, 0.10, 6.65),
    ];
    drawBrickCoursesSide(c, xLeftWall, 0.08, 0.88, 6.55, 8.40, patchSide2);

    // Vết nứt vữa chạy nối giữa các mảng bong
    const crackPaths = [
      [PN(-2.22, 1.85, zFront), PN(-2.06, 1.54, zFront), PN(-2.12, 1.26, zFront)],
      [PN(-1.30, 1.28, zFront), PN(-1.12, 1.18, zFront), PN(-1.02, 0.88, zFront)],
      [PN(-1.58, 0.62, zFront), PN(-1.46, 0.36, zFront), PN(-1.54, 0.14, zFront)],
      [PN(xLeftWall, 1.58, 4.35), PN(xLeftWall, 1.34, 4.90), PN(xLeftWall, 1.22, 5.35)],
    ];
    for (let i = 0; i < crackPaths.length; i++) {
      strokePoly(c, crackPaths[i], 1.3, 'rgba(11,9,7,0.72)', false);
    }

    // 5. RÊU CHÂN TƯỜNG (mảng rêu xù xì trầm ẩm bám kẽ tường đình & phiến đá khe ngách)
    for (let i = 0; i < 48; i++) {
      const mx = lerp(-2.75, xLeftWall - 0.02, arnd());
      const my = Math.pow(arnd(), 1.8) * 0.42;
      const mp = PN(mx, my, zFront - 0.02);
      const rx = 12 + arnd() * 24;
      const ry = 6 + arnd() * 12;
      drawMossTuft(c, mp[0], mp[1], rx, ry, 'rgba(20,33,18,0.88)', 'rgba(42,66,30,0.72)', 'rgba(72,98,46,0.55)');
      ngMossGlowPts.push([mp[0], mp[1], rx]);
    }
    // Rêu ăn dọc theo mép trên gờ bệ chân tường
    for (let i = 0; i < 18; i++) {
      const mx = lerp(-2.3, xLeftWall - 0.05, arnd());
      const mp = PN(mx, 0.34, zFront - 0.02);
      drawMossTuft(c, mp[0], mp[1], 10 + arnd() * 16, 4 + arnd() * 6, 'rgba(18,30,16,0.82)', 'rgba(38,62,28,0.65)', 'rgba(65,90,42,0.48)');
    }
    // Rêu bám sâu vào khe ngách dọc chân tường trái (z: 3.75 .. 9.8)
    for (let i = 0; i < 36; i++) {
      const mz = lerp(3.75, 9.8, i / 35);
      const my = arnd() * 0.30;
      const mp = PN(xLeftWall + 0.02, my, mz);
      const sc = clamp(4.2 / mz, 0.28, 1);
      drawMossTuft(c, mp[0], mp[1], (9 + arnd() * 14) * sc, (5 + arnd() * 9) * sc, 'rgba(18,30,16,0.88)', 'rgba(38,60,26,0.70)', 'rgba(64,88,40,0.50)');
    }
    // Vệt rêu bò theo kẽ phiến đá dưới khe ngách
    for (let i = 0; i < 16; i++) {
      const mx = lerp(xLeftWall + 0.02, xLeftWall + 0.34, arnd());
      const mz = lerp(3.8, 7.8, arnd());
      const mp = PN(mx, 0.01, mz);
      drawMossTuft(c, mp[0], mp[1], 10 + arnd() * 12, 3.5 + arnd() * 4.5, 'rgba(16,28,15,0.78)', 'rgba(34,54,24,0.55)', 'rgba(58,82,36,0.40)');
    }

    // 6. Tường nhà sát vách bên phải ngách (tối mờ hoà vào đêm, KHÔNG có vạch sáng lạnh cạnh khe xa)
    gr = c.createLinearGradient(PN(xRightWall, 0, zRightCorner)[0], 0, PN(xRightWall, 0, zEnd)[0], 0);
    gr.addColorStop(0, '#0c0e12');
    gr.addColorStop(0.65, '#080a0e');
    gr.addColorStop(1, '#19140f');
    poly(c, [PN(xRightWall, 0, zRightCorner), PN(xRightWall, 2.85, zRightCorner), PN(xRightWall, 2.65, zEnd), PN(xRightWall, 0, zEnd)], gr);

    gr = c.createLinearGradient(PN(xRightWall, 0, zRightCorner)[0], 0, PN(2.6, 0, zRightCorner)[0], 0);
    gr.addColorStop(0, '#101318');
    gr.addColorStop(0.45, '#0b0e12');
    gr.addColorStop(1, '#06080b');
    poly(c, [PN(xRightWall, 0, zRightCorner), PN(3.2, 0, zRightCorner), PN(3.2, 2.85, zRightCorner), PN(xRightWall, 2.85, zRightCorner)], gr);
    // Mái tôn nhà phải tối sẫm + ống thoát nước nằm lùi vào trong tối
    poly(c, [PN(xRightWall - 0.02, 2.46, zRightCorner - 0.14), PN(3.0, 2.46, zRightCorner - 0.14), PN(3.0, 2.62, zRightCorner), PN(xRightWall - 0.02, 2.62, zRightCorner)], '#10141a');
    seg(c, PN(xRightWall + 0.16, 0, zRightCorner - 0.02), PN(xRightWall + 0.16, 2.46, zRightCorner - 0.02), 7, '#0d1015');
    poly(c, [PN(xRightWall, 0, zRightCorner - 0.01), PN(3.2, 0, zRightCorner - 0.01), PN(3.2, 0.25, zRightCorner - 0.01), PN(xRightWall, 0.25, zRightCorner - 0.01)], '#090b0b');

    // Hạt bụi ẩm & hạt phim + viền tối sâu
    for (let i = 0; i < 3200; i++) {
      c.fillStyle = `rgba(${arnd() < 0.5 ? '220,210,190' : '0,0,0'},${arnd() * 0.024})`;
      c.fillRect(arnd() * W, arnd() * H, 1.8, 1.8);
    }
    grain(c, 9500, 0.022);
    vignette(c, 0.80);

    ngBaked = true;
  }

  function ensureNgachBaked() {
    if (!ngBaked || ngLitC.width !== cv.width || ngLitC.height !== cv.height) bakeNgach();
  }

  function drawNgach(c, now, dt, opts) {
    ensureNgachBaked();
    const soi = opts && Object.prototype.hasOwnProperty.call(opts, 'soi') ? opts.soi : NG.soi;
    const hasTorch = Array.isArray(soi) && soi.length >= 2 && isFinite(soi[0]) && isFinite(soi[1]);
    const sx = hasTorch ? clamp(Number(soi[0]), -200, W + 200) : 0;
    const sy = hasTorch ? clamp(Number(soi[1]), -200, H + 200) : 0;

    // Tính độ gần chân tường / khe ngách để chỉ khi soi gần chân tường thì khe ngách mới hiện rõ
    const dWallBase = hasTorch ? distToSegment(sx, sy, 480, 585, 900, 535) : 9999;
    const reveal = hasTorch ? clamp(1 - dWallBase / 225, 0, 1) : 0;

    // 1. Nền ngách chi tiết đã bake
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(ngLitC, 0, 0);

    // 2. Lớp bóng tối đêm phủ kín phía trước (trước khi có đèn soi gần như hoà vào bóng tối)
    const dm = ngDarkMaskG;
    const dw = ngDarkMaskC.width;
    const dh = ngDarkMaskC.height;
    dm.setTransform(1, 0, 0, 1, 0, 0);
    dm.clearRect(0, 0, dw, dh);
    dm.fillStyle = 'rgba(2,3,6,0.955)';
    dm.fillRect(0, 0, dw, dh);

    dm.setTransform(0.5 * S * dpr, 0, 0, 0.5 * S * dpr, 0.5 * OX * dpr, 0.5 * OY * dpr);
    dm.globalCompositeOperation = 'destination-out';

    // Luôn để hở hẹp đúng vệt sáng vàng xa xa ở cuối ngách (không tràn sang tường phải)
    dm.globalAlpha = 0.96;
    dm.drawImage(SP_A.cut, ngEndSlit.cx - 22, ngEndSlit.cy - 68, 44, 136);
    dm.globalAlpha = 0.36;
    dm.drawImage(SP_A.cut, ngEndSlit.cx - 34, ngEndSlit.cy - 88, 68, 176);

    // Nếu có đèn pin NG.soi = [x,y]
    if (hasTorch) {
      dm.globalAlpha = 0.96;
      dm.drawImage(SP_A.cut, sx - 215, sy - 215, 430, 430);
      dm.globalAlpha = 0.55;
      dm.drawImage(SP_A.cut, sx - 320, sy - 320, 640, 640);

      // Khi soi gần chân tường: khe ngách, gạch bong và lớp rêu dài dọc khe hiện ra rõ rệt
      if (reveal > 0.02) {
        dm.globalAlpha = 0.90 * reveal;
        dm.drawImage(SP_A.cut, 720, 275, 320, 395);
        dm.globalAlpha = 0.78 * reveal;
        dm.drawImage(SP_A.cut, 500, 390, 360, 275);
      }
    }
    dm.globalAlpha = 1;
    dm.globalCompositeOperation = 'source-over';

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(ngDarkMaskC, 0, 0, cv.width, cv.height);
    setT(c);

    // 3. Ánh sáng động cộng thêm ('lighter'): vệt sáng vàng xa cuối ngách & quầng đèn pin
    const t = now * 0.001;
    const farFlick = 0.90 + 0.06 * Math.sin(t * 2.1) + 0.04 * Math.sin(t * 7.3);

    c.save();
    const baseA = c.globalAlpha;
    c.globalCompositeOperation = 'lighter';

    // Vệt sáng vàng xa xa ở cuối ngách (hẹp đứng theo khe tường)
    c.globalAlpha = baseA * 0.54 * farFlick;
    c.drawImage(SP_A.warm, ngEndSlit.cx - 26, ngEndSlit.cy - 68, 52, 136);
    c.globalAlpha = baseA * 0.44 * farFlick;
    c.drawImage(SP_A.glow, ngEndSlit.cx - 14, ngEndSlit.cy - 34, 28, 68);

    // Quầng đèn pin ấm dịu khi bật NG.soi
    if (hasTorch) {
      c.globalAlpha = baseA * 0.34;
      c.drawImage(SP_A.torch, sx - 210, sy - 210, 420, 420);
      c.globalAlpha = baseA * 0.24;
      c.drawImage(SP_A.torch, sx - 90, sy - 90, 180, 180);

      if (reveal > 0.02) {
        c.globalAlpha = baseA * 0.28 * reveal;
        c.drawImage(SP_A.torch, 775, 345, 220, 310);
        c.globalAlpha = baseA * 0.20 * reveal;
        c.drawImage(SP_A.warm, 690, 465, 260, 195);
      }
    }
    c.restore();
  }

  SC.ngach = {
    bake: bakeNgach,
    enter() {
      ensureNgachBaked();
      if (typeof nudge === 'function') nudge();
    },
    draw: drawNgach,
    down(p) {
      NG.soi = [clamp(p[0], 0, W), clamp(p[1], 0, H)];
      return false;
    },
    move(p, b) {
      if (b) NG.soi = [clamp(p[0], 0, W), clamp(p[1], 0, H)];
    },
    up() {
      return false;
    },
    hot: null,
  };

  // ============================================================================
  // CẢNH 2 · SC.ngo · CON NGÕ DÀI HÀ NỘI 22 GIỜ (4 ĐOẠN NGO.canh = 0..3)
  // ============================================================================
  const AL_CAM = { y: 1.56 };
  const AL_F = 800;
  const AL_VX = 800;
  const AL_VY = 380;
  const PA = (x, y, z) => [AL_VX + (AL_F * x) / z, AL_VY + (AL_F * (AL_CAM.y - y)) / z];
  const AL_L = -1.70;
  const AL_R = 1.70;
  const AL_NEAR = 1.65;
  const AL_END = 25.5;

  // Cấu hình 4 đoạn ngõ (0..3): lối rẽ thật đặt ở trung-cận cảnh (z ~ 4.8..7.5) để thấy rõ ngã rẽ,
  // vị trí đèn đường mốc nhận biết riêng từng đoạn, cuối ngõ đoạn 3 là cổng sắt kéo nhà trọ.
  const SEG_DEFS = [
    {
      // Đoạn 0: Ngã tư có đủ 3 lối (thẳng, trái, phải). Đèn đường: 1 đèn TRÁI-GIỮA (sau ngã tư) + 1 đèn RẤT XA BÊN PHẢI.
      id: 0,
      branchL: { z0: 4.85, z1: 7.45 },
      branchR: { z0: 5.05, z1: 7.65 },
      endGate: false,
      lamps: [
        { side: -1, z: 8.15, y: 3.12, power: 1.0 },
        { side: 1, z: 16.8, y: 3.05, power: 0.48 },
      ],
      leftNearH: [4.6, 3.15],
      leftFarH: [4.95, 3.25, 4.35, 3.6],
      rightNearH: [3.35, 5.05],
      rightFarH: [3.75, 5.25, 3.45, 4.4],
      gates: [
        { side: -1, z0: 2.55, z1: 3.65, h: 2.15, col: [28, 52, 42], plantZ: 4.55, potCol: '#5b3426', style: 0 },
        { side: 1, z0: 2.75, z1: 3.90, h: 2.12, col: [28, 42, 58], plantZ: 4.72, potCol: '#4c463d', style: 1 },
        { side: -1, z0: 9.05, z1: 10.35, h: 2.08, col: [58, 34, 30], plantZ: 8.75, potCol: '#4e3328', style: 0 },
        { side: 1, z0: 9.65, z1: 10.95, h: 2.10, col: [36, 44, 52], plantZ: 11.25, potCol: '#433d36', style: 1 },
      ],
      drains: [
        { type: 'side', side: 1, z0: 4.45, z1: 5.02 },
        { type: 'cross', z: 8.45 },
      ],
      puddles: [
        [0.44, 5.45, 0.54, 0.78, 0.6],
        [-0.36, 7.35, 0.62, 0.88, 2.2],
        [0.24, 11.8, 0.52, 0.78, 4.1],
      ],
    },
    {
      // Đoạn 1: Ngã ba rẽ phải (2 lối: thẳng, phải). Đèn đường: 2 ĐÈN ĐỀU BÊN PHẢI (gần + trung-xa).
      id: 1,
      branchL: null,
      branchR: { z0: 4.85, z1: 7.45 },
      endGate: false,
      lamps: [
        { side: 1, z: 4.05, y: 3.08, power: 1.0 },
        { side: 1, z: 11.3, y: 3.06, power: 0.78 },
      ],
      leftNearH: [3.25, 5.15],
      leftFarH: [4.2, 3.35, 5.1, 3.7],
      rightNearH: [4.85, 3.45],
      rightFarH: [3.55, 5.2, 4.1, 3.5],
      gates: [
        { side: -1, z0: 3.30, z1: 4.50, h: 2.16, col: [58, 30, 28], plantZ: 4.78, potCol: '#553226', style: 1 },
        { side: 1, z0: 2.55, z1: 3.70, h: 2.10, col: [32, 38, 46], plantZ: 4.55, potCol: '#48423a', style: 0 },
        { side: -1, z0: 6.35, z1: 7.55, h: 2.10, col: [32, 48, 40], plantZ: 6.02, potCol: '#54352a', style: 0 },
        { side: 1, z0: 9.20, z1: 10.45, h: 2.08, col: [44, 40, 34], plantZ: 8.88, potCol: '#4a433b', style: 1 },
      ],
      drains: [
        { type: 'side', side: -1, z0: 4.7, z1: 5.85 },
        { type: 'side', side: 1, z0: 8.6, z1: 9.6 },
      ],
      puddles: [
        [-0.38, 5.35, 0.56, 0.76, 1.3],
        [0.46, 7.25, 0.64, 0.84, 3.0],
        [-0.22, 11.4, 0.50, 0.80, 4.8],
      ],
    },
    {
      // Đoạn 2: Ngã ba rẽ trái (2 lối: thẳng, trái). Đèn đường: SO LE (1 đèn PHẢI gần + 1 đèn TRÁI trung).
      id: 2,
      branchL: { z0: 4.85, z1: 7.45 },
      branchR: null,
      endGate: false,
      lamps: [
        { side: 1, z: 4.15, y: 3.12, power: 1.0 },
        { side: -1, z: 10.2, y: 3.06, power: 0.82 },
      ],
      leftNearH: [3.35, 4.65],
      leftFarH: [4.25, 5.25, 3.45, 4.1],
      rightNearH: [4.35, 3.15],
      rightFarH: [5.35, 3.7, 4.6, 3.5],
      gates: [
        { side: -1, z0: 2.55, z1: 3.68, h: 2.12, col: [32, 36, 44], plantZ: 4.55, potCol: '#4f3328', style: 0 },
        { side: 1, z0: 3.25, z1: 4.45, h: 2.18, col: [26, 46, 48], plantZ: 4.75, potCol: '#56362b', style: 1 },
        { side: -1, z0: 9.25, z1: 10.45, h: 2.08, col: [36, 48, 38], plantZ: 8.95, potCol: '#47423a', style: 1 },
        { side: 1, z0: 6.45, z1: 7.70, h: 2.10, col: [54, 36, 30], plantZ: 6.15, potCol: '#4e3429', style: 0 },
      ],
      drains: [
        { type: 'cross', z: 5.20 },
        { type: 'side', side: 1, z0: 8.1, z1: 9.15 },
      ],
      puddles: [
        [0.20, 5.95, 0.58, 0.78, 0.9],
        [-0.44, 7.95, 0.56, 0.82, 2.7],
        [0.34, 11.4, 0.52, 0.76, 4.4],
      ],
    },
    {
      // Đoạn 3: Cuối ngõ — cổng sắt kéo khu nhà trọ (thấy lờ mờ sân để xe bên trong) + ngách rẽ trái (2 lối: thẳng, trái).
      // Đèn đường: CHỈ 1 ĐÈN VÀNG GẮN SÁT CỔNG CUỐI NGÕ BÊN TRÁI (z = 9.25), đối lập với ánh đèn tuýp lạnh trong sân xe.
      id: 3,
      branchL: { z0: 4.55, z1: 6.95 },
      branchR: null,
      endGate: true,
      gateZ: 10.0,
      lamps: [
        { side: -1, z: 9.25, y: 2.86, power: 0.96 },
      ],
      leftNearH: [3.85, 4.85],
      leftFarH: [3.55, 4.15],
      rightNearH: [4.65, 3.30],
      rightFarH: [4.35, 3.60],
      gates: [
        { side: -1, z0: 2.50, z1: 3.55, h: 2.12, col: [28, 44, 35], plantZ: 4.45, potCol: '#4f3429', style: 0 },
        { side: 1, z0: 2.90, z1: 4.10, h: 2.15, col: [30, 38, 48], plantZ: 4.55, potCol: '#48413a', style: 1 },
        { side: 1, z0: 6.00, z1: 7.25, h: 2.08, col: [50, 34, 30], plantZ: 5.70, potCol: '#553429', style: 0 },
      ],
      drains: [
        { type: 'side', side: 1, z0: 4.6, z1: 5.75 },
        { type: 'cross', z: 9.25 },
      ],
      puddles: [
        [0.34, 5.45, 0.52, 0.72, 1.8],
        [-0.28, 7.65, 0.62, 0.84, 3.6],
      ],
    },
  ];

  const clampCanh = (v) => {
    const n = parseInt(v, 10);
    if (isNaN(n)) return 0;
    return n < 0 ? 0 : n > 3 ? 3 : n;
  };

  // Tính sẵn toàn bộ HOT_NGO[0..3] ngay khi nạp script (khớp khít miệng ngã rẽ / cổng, gọn trong y 100..670)
  function computeHotForSegment(def) {
    const map = {};
    if (def.endGate) {
      const gTL = PA(-1.26, 2.44, def.gateZ);
      const gBR = PA(1.26, 0.0, def.gateZ);
      const y0 = clamp(gTL[1] - 10, 120, 560);
      const y1 = clamp(gBR[1] + 10, y0 + 80, 666);
      map.thang = {
        x: Math.round(gTL[0] - 8),
        y: Math.round(y0),
        w: Math.round(gBR[0] - gTL[0] + 16),
        h: Math.round(y1 - y0),
      };
    } else {
      const tTL = PA(AL_L + 0.22, 2.85, 10.6);
      const tBR = PA(AL_R - 0.22, 0.0, 10.6);
      const y0 = clamp(tTL[1], 125, 500);
      const y1 = clamp(tBR[1] + 16, y0 + 80, 666);
      map.thang = {
        x: Math.round(tTL[0]),
        y: Math.round(y0),
        w: Math.round(tBR[0] - tTL[0]),
        h: Math.round(y1 - y0),
      };
    }

    if (def.branchL) {
      const { z0, z1 } = def.branchL;
      const farOut = PA(-3.25, 2.95, z1);
      const nearCornerTop = PA(AL_L, 3.05, z0);
      const nearCornerBot = PA(AL_L, 0.0, z0);
      const farCornerBot = PA(AL_L, 0.0, z1);
      const minX = Math.max(205, Math.round(farOut[0]));
      const maxX = Math.round(farCornerBot[0] + 8);
      const minY = Math.round(clamp(Math.max(nearCornerTop[1] + 10, farOut[1] - 20), 145, 500));
      const maxY = Math.round(clamp(Math.max(nearCornerBot[1], farCornerBot[1]), minY + 90, 666));
      map.trai = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    if (def.branchR) {
      const { z0, z1 } = def.branchR;
      const farOut = PA(3.25, 2.95, z1);
      const nearCornerTop = PA(AL_R, 3.05, z0);
      const nearCornerBot = PA(AL_R, 0.0, z0);
      const farCornerBot = PA(AL_R, 0.0, z1);
      const minX = Math.round(farCornerBot[0] - 8);
      const maxX = Math.min(1560, Math.round(farOut[0]));
      const minY = Math.round(clamp(Math.max(nearCornerTop[1] + 10, farOut[1] - 20), 145, 500));
      const maxY = Math.round(clamp(Math.max(nearCornerBot[1], farCornerBot[1]), minY + 90, 666));
      map.phai = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    return map;
  }

  function initAllHotNgo() {
    for (let i = 0; i < SEG_DEFS.length; i++) {
      HOT_NGO[i] = computeHotForSegment(SEG_DEFS[i]);
    }
  }

  const [ngoC, ngoG] = layer();
  let ngoBakedCanh = -1;
  let ngoLampScreens = [];
  let ngoPuddles = [];
  let ngoTubeGlow = null;

  // Độ rọi ấm từ các ngọn đèn đường trong đoạn ngõ
  function alleyLit(lamps, x, y, z) {
    let best = 0.14;
    for (let i = 0; i < lamps.length; i++) {
      const lm = lamps[i];
      const lx = lm.side < 0 ? AL_L + 0.35 : AL_R - 0.35;
      const d = Math.hypot((x - lx) * 0.72, (y - lm.y) * 0.45, (z - lm.z) * 0.42);
      const k = Math.max(0.14, (1 - d / 7.2) * lm.power);
      if (k > best) best = k;
    }
    return best;
  }

  // Vẽ bầu trời đêm, dãy mái nhà xa cuối ngõ & mặt đường bê tông ngõ (có khe co giãn, mảng vá, quầng hắt đèn)
  function drawAlleySky(c, def) {
    const lamps = def.lamps;
    let gr = c.createLinearGradient(0, 0, 0, AL_VY + 45);
    gr.addColorStop(0, '#040710');
    gr.addColorStop(0.55, '#081020');
    gr.addColorStop(1, '#0d1627');
    c.fillStyle = gr;
    c.fillRect(-300, -300, W + 600, AL_VY + 360);

    for (let i = 0; i < 20; i++) {
      const sx = 460 + arnd() * 680;
      const sy = 85 + arnd() * 145;
      c.fillStyle = `rgba(185,208,242,${0.12 + arnd() * 0.22})`;
      c.fillRect(sx, sy, 1.4, 1.4);
    }

    // Dãy mái nhà thành phố xa mờ dần vào màn sương đêm (tránh vạch cắt xanh cứng ở chân trời)
    c.fillStyle = '#060a12';
    c.beginPath();
    c.moveTo(420, AL_VY + 45);
    for (let x = 420; x <= 1180; x += 26) {
      const stepH = ((Math.floor(x / 46) * 17) % 5) * 12;
      c.lineTo(x, AL_VY - 34 - stepH);
    }
    c.lineTo(1180, AL_VY + 45);
    c.closePath();
    c.fill();

    // Đường mở rộng ở rất xa (với các đoạn thông thẳng) tạo cảm giác ngõ dài sâu hun hút
    if (!def.endGate) {
      const haz = c.createLinearGradient(0, AL_VY - 16, 0, PA(0, 0, 21.5)[1]);
      haz.addColorStop(0, '#070a12');
      haz.addColorStop(0.55, '#12151c');
      haz.addColorStop(1, '#0c0f15');
      c.fillStyle = haz;
      c.fillRect(580, AL_VY - 16, 440, 82);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.20;
      c.drawImage(SP_A.warm, AL_VX - 95, AL_VY - 40, 190, 95);
      c.restore();
    }

    // Nền mặt đường bê tông ngõ (giữ tối sâu về phía y>680 để phụ đề/gợi ý nổi rõ)
    gr = c.createLinearGradient(0, PA(0, 0, AL_END)[1], 0, 860);
    gr.addColorStop(0, '#0c1016');
    gr.addColorStop(0.42, '#141922');
    gr.addColorStop(0.74, '#10141c');
    gr.addColorStop(1, '#06080b');
    poly(c, [PA(AL_L, 0, AL_NEAR), PA(AL_R, 0, AL_NEAR), PA(AL_R, 0, AL_END), PA(AL_L, 0, AL_END)], gr);

    // Mảng bê tông vá sẫm & khe co giãn ngang trên mặt đường ngõ
    poly(c, [PA(-0.55, 0.002, 4.9), PA(0.28, 0.002, 4.9), PA(0.32, 0.002, 6.2), PA(-0.50, 0.002, 6.2)], 'rgba(8,10,14,0.34)');
    poly(c, [PA(-0.20, 0.002, 8.8), PA(0.75, 0.002, 8.8), PA(0.70, 0.002, 10.4), PA(-0.24, 0.002, 10.4)], 'rgba(9,12,17,0.32)');
    for (let z = 3.2; z <= 18.0; z += 2.2) {
      seg(c, PA(AL_L + 0.14, 0.003, z), PA(AL_R - 0.14, 0.003, z), 0.9, 'rgba(5,7,10,0.48)');
    }
    // Rãnh thoát nước dọc sát mép tường hai bên
    poly(c, [PA(AL_L, 0.002, AL_NEAR), PA(AL_L + 0.14, 0.002, AL_NEAR), PA(AL_L + 0.14, 0.002, AL_END), PA(AL_L, 0.002, AL_END)], 'rgba(5,7,9,0.52)');
    poly(c, [PA(AL_R - 0.14, 0.002, AL_NEAR), PA(AL_R, 0.002, AL_NEAR), PA(AL_R, 0.002, AL_END), PA(AL_R - 0.14, 0.002, AL_END)], 'rgba(5,7,9,0.52)');

    // Quầng hắt vàng nhẹ xuống mặt đường ngay dưới từng bóng đèn
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < lamps.length; i++) {
      const lm = lamps[i];
      if (lm.z > 16) continue;
      const gp = PA(lm.side * 0.90, 0.01, lm.z);
      const rad = (AL_F * 1.55) / lm.z;
      c.globalAlpha = 0.22 * lm.power;
      c.drawImage(SP_A.warm, gp[0] - rad, gp[1] - rad * 0.40, rad * 2, rad * 0.80);
    }
    c.restore();
  }

  // Vẽ dãy tường nhà hai bên cao thấp khác nhau (tường vôi xỉn màu đa sắc độ, chân tường ẩm, ban công, mái tôn gân sóng)
  function drawHouseRun(c, side, zStart, zEnd, heights, lamps, hasTinAwning) {
    const xW = side < 0 ? AL_L : AL_R;
    const xOut = side < 0 ? AL_L - 4.2 : AL_R + 4.2;
    const n = heights.length;
    const dz = (zEnd - zStart) / n;
    const plasterPal = [
      [1.04, 0.98, 0.88],
      [0.86, 0.90, 0.96],
      [0.98, 0.88, 0.80],
      [0.82, 0.84, 0.86],
    ];

    for (let i = n - 1; i >= 0; i--) {
      const z0 = zStart + i * dz;
      const z1 = z0 + dz;
      const h = heights[i];
      const k = alleyLit(lamps, xW, h * 0.45, (z0 + z1) * 0.5);

      const nextH = i < n - 1 ? heights[i + 1] : h * 0.82;
      if (h > nextH + 0.08 && z1 < 18) {
        const g1 = PA(xW, nextH, z1);
        const g2 = PA(xOut, nextH, z1);
        const g3 = PA(xOut, h, z1);
        const g4 = PA(xW, h, z1);
        poly(c, [g1, g2, g3, g4], `rgb(${(11 + 12 * k) | 0},${(13 + 10 * k) | 0},${(17 + 8 * k) | 0})`);
      }

      const pBL = PA(xW, 0, z0);
      const pTL = PA(xW, h, z0);
      const pTR = PA(xW, h, z1);
      const pBR = PA(xW, 0, z1);
      const tint = plasterPal[(i + (side > 0 ? 1 : 0)) % plasterPal.length];
      const r = Math.round((21 + 38 * k) * tint[0]);
      const g = Math.round((23 + 33 * k) * tint[1]);
      const b = Math.round((27 + 23 * k) * tint[2]);
      poly(c, [pBL, pTL, pTR, pBR], `rgb(${r},${g},${b})`);

      // Chân tường tối ẩm + khe rêu sát nền đường
      poly(c, [PA(xW, 0, z0), PA(xW, 0.28, z0), PA(xW, 0.28, z1), PA(xW, 0, z1)], `rgb(${(11 + 11 * k) | 0},${(14 + 10 * k) | 0},${(14 + 7 * k) | 0})`);

      // Mảng loang vữa cũ trên mặt tường
      if (i % 2 === 0 && z0 < 12) {
        poly(c, [PA(xW, 0.55, lerp(z0, z1, 0.15)), PA(xW, 1.45, lerp(z0, z1, 0.35)), PA(xW, 1.15, lerp(z0, z1, 0.72)), PA(xW, 0.45, lerp(z0, z1, 0.65))], 'rgba(8,10,9,0.18)');
      }

      seg(c, pTL, pTR, 1.2, `rgba(120,145,175,${0.06 + 0.10 * k})`);
      seg(c, pBL, pTL, 1.3, 'rgba(4,6,9,0.58)');

      // Ống nước nhựa PVC dọc góc tường nối nhà (chi tiết đặc trưng nhà ống ngõ Hà Nội)
      if (i > 0 && z0 < 13) {
        seg(c, PA(xW - side * 0.03, 0, z0 + 0.04), PA(xW - side * 0.03, Math.min(h - 0.15, 3.6), z0 + 0.04), Math.max(2, 12 / z0), 'rgba(26,31,38,0.85)');
      }

      // Ban công bê tông đua nhẹ & lan can sắt ở nhà cao tầng (h > 4.2)
      if (h > 4.25 && z0 < 14) {
        const by = 2.95;
        const bx = xW - side * 0.26;
        poly(c, [PA(xW, by, z0 + 0.12), PA(bx, by, z0 + 0.12), PA(bx, by, z1 - 0.12), PA(xW, by, z1 - 0.12)], `rgb(${(17 + 16 * k) | 0},${(20 + 14 * k) | 0},${(24 + 12 * k) | 0})`);
        seg(c, PA(bx, by + 0.55, z0 + 0.12), PA(bx, by + 0.55, z1 - 0.12), 1.4, 'rgba(18,22,28,0.88)');
        for (let u = 0; u <= 4; u++) {
          const rz = lerp(z0 + 0.14, z1 - 0.14, u / 4);
          seg(c, PA(bx, by, rz), PA(bx, by + 0.55, rz), 1.1, 'rgba(15,18,24,0.85)');
        }
      }

      // Cửa sổ tầng trên tối om hoặc ánh hắt rất yếu
      if (h >= 3.9 && z0 < 16) {
        const wz0 = lerp(z0, z1, 0.28);
        const wz1 = lerp(z0, z1, 0.68);
        const wy0 = h > 4.25 ? 3.55 : 2.92;
        const wy1 = Math.min(h - 0.30, wy0 + 0.72);
        if (wy1 - wy0 > 0.36) {
          const wPts = [PA(xW, wy0, wz0), PA(xW, wy1, wz0), PA(xW, wy1, wz1), PA(xW, wy0, wz1)];
          const litWin = ((i + side + Math.round(zStart)) % 3 === 0);
          poly(c, wPts, litWin ? 'rgba(135,98,48,0.28)' : '#070a10');
          strokePoly(c, wPts, 1.3, 'rgba(18,22,28,0.85)', true);
        }
      }

      // Mái tôn đua ra che cửa (bắt đầu từ z >= 2.50 tránh vướng góc trên-trái, thanh sắt chống dưới mái tôn)
      const awZ0 = Math.max(z0 + 0.14, 2.50);
      const awZ1 = z1 - 0.14;
      if (hasTinAwning && (i % 2 === 0 || z0 < 5.0) && awZ1 - awZ0 > 0.32) {
        const awY1 = 2.26 + (i % 3) * 0.10;
        const awY0 = awY1 - 0.22;
        const awX = xW - side * (0.34 + (i % 2) * 0.12);
        const tinPalette = [
          [22, 30, 40],
          [34, 23, 20],
          [24, 28, 32],
        ][(i + (side > 0 ? 1 : 0)) % 3];
        const tCol = `rgb(${(tinPalette[0] + 22 * k) | 0},${(tinPalette[1] + 20 * k) | 0},${(tinPalette[2] + 16 * k) | 0})`;
        poly(c, [PA(xW, awY1, awZ0), PA(awX, awY0, awZ0), PA(awX, awY0, awZ1), PA(xW, awY1, awZ1)], tCol);
        const ribs = 5;
        for (let u = 1; u < ribs; u++) {
          const rz = lerp(awZ0, awZ1, u / ribs);
          seg(c, PA(xW, awY1, rz), PA(awX, awY0, rz), 0.85, `rgba(165,185,205,${0.05 + 0.08 * k})`);
        }
        seg(c, PA(xW, awY1 - 0.34, awZ0 + 0.08), PA(awX + side * 0.04, awY0, awZ0 + 0.08), 1.4, 'rgba(14,17,22,0.88)');
        seg(c, PA(awX, awY0, awZ0), PA(awX, awY0, awZ1), 1.3, `rgba(165,182,200,${0.06 + 0.10 * k})`);
      }
    }
  }

  // Vẽ ngã rẽ thực sự rõ nét: góc tường có vệt sơn vôi, mặt đường rẽ vào sâu, vách nhà bên kia rẽ & hắt sáng xa
  function drawSideBranch(c, side, z0, z1, lamps) {
    const xW = side < 0 ? AL_L : AL_R;
    const xDeep = side < 0 ? -7.4 : 7.4;
    const xCornerOut = side < 0 ? -6.4 : 6.4;
    const k = alleyLit(lamps, xW, 1.2, (z0 + z1) * 0.5);

    // 1. Mặt đường bê tông rẽ hẳn sang trái/phải vào sâu trong ngách (xW + side * ...)
    const roadGr = c.createLinearGradient(PA(xW, 0, z0)[0], 0, PA(xDeep, 0, z0)[0], 0);
    roadGr.addColorStop(0, '#141922');
    roadGr.addColorStop(0.50, '#0c1018');
    roadGr.addColorStop(1, '#05070b');
    poly(c, [PA(xW, 0, z0), PA(xDeep, 0, z0), PA(xDeep, 0, z1), PA(xW, 0, z1)], roadGr);
    seg(c, PA(xW, 0.004, z0 + 0.25), PA(xW + side * 2.8, 0.004, z0 + 0.25), 1.2, 'rgba(6,8,12,0.58)');
    seg(c, PA(xW, 0.004, z1 - 0.25), PA(xW + side * 2.8, 0.004, z1 - 0.25), 1.2, 'rgba(6,8,12,0.58)');

    // 2. Dãy nhà vách xa của ngõ rẽ (tại z = z1, chạy sang ngang vào sâu ngoài xW!)
    const hFar = 3.85;
    const wGr = c.createLinearGradient(PA(xW, 0, z1)[0], 0, PA(xDeep, 0, z1)[0], 0);
    wGr.addColorStop(0, `rgb(${(24 + 34 * k) | 0},${(26 + 29 * k) | 0},${(30 + 21 * k) | 0})`);
    wGr.addColorStop(0.55, '#131720');
    wGr.addColorStop(1, '#07090f');
    poly(c, [PA(xW, 0, z1), PA(xDeep, 0, z1), PA(xDeep, hFar, z1), PA(xW, hFar, z1)], wGr);
    // Chân tường ẩm, cổng phụ & mái tôn nhỏ ở vách nhà SÂU TRONG ngách rẽ (xW + side * ...)
    poly(c, [PA(xW, 0, z1), PA(xDeep, 0, z1), PA(xDeep, 0.26, z1), PA(xW, 0.26, z1)], '#090b0f');
    poly(c, [PA(xW + side * 0.45, 0.02, z1), PA(xW + side * 1.45, 0.02, z1), PA(xW + side * 1.45, 2.02, z1), PA(xW + side * 0.45, 2.02, z1)], '#111820');
    poly(c, [PA(xW + side * 0.15, 2.38, z1), PA(xW + side * 1.85, 2.38, z1), PA(xW + side * 1.85, 2.15, z1 - 0.34), PA(xW + side * 0.15, 2.15, z1 - 0.34)], '#19202a');
    seg(c, PA(xW + side * 0.15, 2.15, z1 - 0.34), PA(xW + side * 1.85, 2.15, z1 - 0.34), 1.3, 'rgba(180,200,220,0.14)');

    // Quầng đèn đường vàng hắt ra từ sâu bên trong ngách rẽ giúp nhận ra ngay có lối thông!
    const deepGlow = PA(side < 0 ? -3.35 : 3.35, 1.05, (z0 + z1) * 0.5);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.24;
    c.drawImage(SP_A.warm, deepGlow[0] - 95, deepGlow[1] - 80, 190, 160);
    c.restore();

    // 3. Tường hông dãy nhà phía gần (tại z = z0) che mép trước tạo góc rẽ 3D rõ ràng + mảng vữa ở góc tường
    const hNear = 3.95;
    poly(c, [PA(xW, 0, z0), PA(xCornerOut, 0, z0), PA(xCornerOut, hNear, z0), PA(xW, hNear, z0)], '#0a0d13');
    seg(c, PA(xW, 0, z0), PA(xW, hNear, z0), 2.2, `rgba(185,200,218,${0.14 + 0.20 * k})`);
    seg(c, PA(xW, 0, z1), PA(xW, hFar, z1), 1.8, `rgba(190,205,222,${0.14 + 0.18 * k})`);
  }

  // Vẽ chậu cây / thùng xốp trồng cây đa dạng trước cửa nhà (không giống nhau, không đối xứng)
  function drawPottedPlant(c, px, plantZ, potCol, pk, variant) {
    const bL = PA(px - 0.12, 0.01, plantZ);
    const bR = PA(px + 0.12, 0.01, plantZ);
    const tL = PA(px - 0.16, 0.29, plantZ);
    const tR = PA(px + 0.16, 0.29, plantZ);
    const sc = Math.max(8, (AL_F * 0.22) / plantZ);

    if (variant === 2) {
      // Thùng xốp cũ trồng cây sát tường (chi tiết quen thuộc ngõ Hà Nội)
      poly(c, [PA(px - 0.16, 0.01, plantZ), PA(px - 0.16, 0.24, plantZ), PA(px + 0.16, 0.24, plantZ), PA(px + 0.16, 0.01, plantZ)], `rgb(${(72 + 45 * pk) | 0},${(74 + 44 * pk) | 0},${(76 + 40 * pk) | 0})`);
      seg(c, PA(px - 0.16, 0.24, plantZ), PA(px + 0.16, 0.24, plantZ), 1.4, 'rgba(185,190,195,0.28)');
      const base = PA(px, 0.24, plantZ);
      for (let j = -3; j <= 3; j++) {
        const ang = -Math.PI * 0.5 + j * 0.22 + (arnd() - 0.5) * 0.12;
        const len = sc * (0.7 + arnd() * 0.5);
        seg(c, [base[0] + j * sc * 0.12, base[1]], [base[0] + Math.cos(ang) * len, base[1] + Math.sin(ang) * len], 2.0, `rgb(${(18 + 20 * pk) | 0},${(42 + 34 * pk) | 0},${(20 + 18 * pk) | 0})`);
      }
      return;
    }

    poly(c, [bL, tL, tR, bR], potCol);
    seg(c, tL, tR, 1.6, `rgba(190,165,140,${0.18 + 0.22 * pk})`);
    const top = PA(px, 0.29, plantZ);

    if (variant === 0) {
      // Cây lưỡi hổ / thiết mộc lan vươn lá nhọn thẳng
      for (let j = -2; j <= 2; j++) {
        const lean = j * 0.18 + (arnd() - 0.5) * 0.10;
        const hL = sc * (0.85 + (2 - Math.abs(j)) * 0.22);
        const wL = sc * 0.14;
        const p0 = [top[0] + j * sc * 0.08 - wL, top[1]];
        const p1 = [top[0] + j * sc * 0.08 + wL, top[1]];
        const tip = [top[0] + lean * hL, top[1] - hL];
        poly(c, [p0, tip, p1], j % 2 ? `rgb(${(18 + 22 * pk) | 0},${(42 + 36 * pk) | 0},${(22 + 18 * pk) | 0})` : `rgb(${(14 + 16 * pk) | 0},${(32 + 28 * pk) | 0},${(18 + 14 * pk) | 0})`);
      }
    } else {
      // Bụi cây tán xù xì với thân mảnh & chùm lá bất đối xứng
      seg(c, top, [top[0] - sc * 0.12, top[1] - sc * 0.85], 1.6, '#231b15');
      seg(c, top, [top[0] + sc * 0.22, top[1] - sc * 0.72], 1.4, '#231b15');
      for (let j = 0; j < 9; j++) {
        const lx = top[0] + (arnd() - 0.45) * sc * 1.15;
        const ly = top[1] - sc * (0.28 + arnd() * 0.85);
        const r = sc * (0.16 + arnd() * 0.18);
        poly(c, [[lx - r, ly], [lx - r * 0.3, ly - r * 0.75], [lx + r * 0.8, ly - r * 0.3], [lx + r * 0.4, ly + r * 0.65]], j % 2 ? `rgb(${(16 + 20 * pk) | 0},${(36 + 32 * pk) | 0},${(18 + 16 * pk) | 0})` : `rgb(${(22 + 24 * pk) | 0},${(46 + 36 * pk) | 0},${(24 + 18 * pk) | 0})`);
      }
    }
  }

  // Vẽ cổng sắt sơn của một nhà + chậu cây trước cửa (KHÔNG số nhà, KHÔNG chữ)
  function drawHouseGate(c, gDef, lamps) {
    const xW = gDef.side < 0 ? AL_L : AL_R;
    const { z0, z1, h, col, plantZ, potCol, style } = gDef;
    const k = alleyLit(lamps, xW, h * 0.5, (z0 + z1) * 0.5);

    const pBL = PA(xW, 0.02, z0);
    const pTL = PA(xW, h, z0);
    const pTR = PA(xW, h, z1);
    const pBR = PA(xW, 0.02, z1);
    poly(c, [PA(xW, 0, z0 - 0.06), PA(xW, h + 0.06, z0 - 0.06), PA(xW, h + 0.06, z1 + 0.06), PA(xW, 0, z1 + 0.06)], '#10141a');

    const lowerH = style ? 0.52 : 0.88;
    const r = Math.round(col[0] * (0.55 + 0.65 * k));
    const g = Math.round(col[1] * (0.55 + 0.65 * k));
    const b = Math.round(col[2] * (0.55 + 0.65 * k));
    const gateCol = `rgb(${r},${g},${b})`;

    poly(c, [PA(xW, lowerH, z0), pTL, pTR, PA(xW, lowerH, z1)], '#05070b');
    poly(c, [pBL, PA(xW, lowerH, z0), PA(xW, lowerH, z1), pBR], gateCol);

    strokePoly(c, [pBL, pTL, pTR, pBR], 2.2, gateCol, true);
    const zMid = (z0 + z1) * 0.5;
    seg(c, PA(xW, 0.02, zMid), PA(xW, h, zMid), 1.8, '#090c10');
    seg(c, PA(xW, lowerH, z0), PA(xW, lowerH, z1), 1.6, gateCol);

    if (style) {
      // Cổng song ngang xen đứng (nhiều kiểu cổng khác nhau)
      for (let i = 1; i <= 5; i++) {
        const hy = lerp(lowerH, h, i / 6);
        seg(c, PA(xW, hy, z0), PA(xW, hy, z1), 1.2, gateCol);
      }
      for (let i = 1; i < 4; i++) {
        const bz = lerp(z0, z1, i / 4);
        seg(c, PA(xW, lowerH, bz), PA(xW, h, bz), 1.0, gateCol);
      }
    } else {
      const bars = 6;
      for (let i = 1; i < bars; i++) {
        const bz = lerp(z0, z1, i / bars);
        seg(c, PA(xW, lowerH, bz), PA(xW, h, bz), Math.max(1.0, 9 / z0), gateCol);
        seg(c, PA(xW, lowerH, bz + 0.012), PA(xW, h, bz + 0.012), 0.7, `rgba(180,205,225,${0.08 + 0.14 * k})`);
      }
    }
    seg(c, PA(xW, 1.05, zMid - 0.10), PA(xW, 1.05, zMid + 0.10), 2.2, '#28303b');
    const lk = PA(xW, 0.99, zMid);
    c.fillStyle = '#3a3428';
    c.fillRect(lk[0] - 2.5, lk[1] - 2.5, 5, 6);

    if (plantZ) {
      const px = xW - gDef.side * 0.22;
      const pk = alleyLit(lamps, px, 0.4, plantZ);
      const variant = Math.abs(Math.round(z0 * 10 + (gDef.side > 0 ? 1 : 0))) % 3;
      drawPottedPlant(c, px, plantZ, potCol, pk, variant);
    }
  }

  // Vẽ cống thoát nước (nắp cống gang/rãnh khe thoát nước trên mặt đường ngõ)
  function drawDrain(c, dDef, lamps) {
    if (dDef.type === 'side') {
      const x0 = dDef.side < 0 ? AL_L + 0.08 : AL_R - 0.36;
      const x1 = x0 + 0.28;
      const k = alleyLit(lamps, (x0 + x1) * 0.5, 0, (dDef.z0 + dDef.z1) * 0.5);
      const pts = [PA(x0, 0.004, dDef.z0), PA(x1, 0.004, dDef.z0), PA(x1, 0.004, dDef.z1), PA(x0, 0.004, dDef.z1)];
      poly(c, pts, '#06080b');
      strokePoly(c, pts, 1.3, `rgba(120,140,165,${0.14 + 0.18 * k})`, true);
      for (let i = 1; i <= 5; i++) {
        const dz = lerp(dDef.z0, dDef.z1, i / 6);
        seg(c, PA(x0 + 0.04, 0.005, dz), PA(x1 - 0.04, 0.005, dz), 1.4, `rgba(60,72,88,${0.4 + 0.35 * k})`);
      }
    } else {
      const z0 = dDef.z;
      const z1 = z0 + 0.24;
      const k = alleyLit(lamps, 0, 0, z0);
      const pts = [PA(AL_L + 0.16, 0.004, z0), PA(AL_R - 0.16, 0.004, z0), PA(AL_R - 0.16, 0.004, z1), PA(AL_L + 0.16, 0.004, z1)];
      poly(c, pts, '#05070a');
      strokePoly(c, pts, 1.1, `rgba(110,130,155,${0.12 + 0.18 * k})`, true);
      for (let x = AL_L + 0.32; x <= AL_R - 0.32; x += 0.18) {
        seg(c, PA(x, 0.005, z0 + 0.03), PA(x, 0.005, z1 - 0.03), 1.2, `rgba(55,68,82,${0.45 + 0.3 * k})`);
      }
    }
  }

  // Vẽ đoạn 3 cuối ngõ: cổng sắt kéo khu nhà trọ (nhìn xuyên vào lờ mờ thấy sân để xe máy + ánh đèn tuýp lạnh)
  function drawEndBoardingGate(c, gateZ, lamps) {
    const gx0 = -1.25;
    const gx1 = 1.25;
    const gTop = 2.42;
    const k = alleyLit(lamps, -0.5, 1.2, gateZ);

    const pTL = PA(gx0, gTop, gateZ);
    const pTR = PA(gx1, gTop, gateZ);
    const pBR = PA(gx1, 0.04, gateZ);
    const pBL = PA(gx0, 0.04, gateZ);

    // 1. Bên trong sân để xe nhìn lờ mờ qua khe cổng sắt kéo (clip đúng khung cổng)
    c.save();
    c.beginPath();
    c.moveTo(pTL[0], pTL[1]);
    c.lineTo(pTR[0], pTR[1]);
    c.lineTo(pBR[0], pBR[1]);
    c.lineTo(pBL[0], pBL[1]);
    c.closePath();
    c.clip();

    const yardBack = 18.2;
    // Nền sân xe tối lạnh bên trong
    poly(c, [pBL, pTL, pTR, pBR], '#070a0f');
    // Sàn bê tông sân xe
    let gr = c.createLinearGradient(0, PA(0, 0, yardBack)[1], 0, PA(0, 0, gateZ)[1]);
    gr.addColorStop(0, '#0b1018');
    gr.addColorStop(0.55, '#121923');
    gr.addColorStop(1, '#0c1016');
    poly(c, [PA(-1.7, 0.04, gateZ), PA(1.7, 0.04, gateZ), PA(1.7, 0.04, yardBack), PA(-1.7, 0.04, yardBack)], gr);

    // Trần sân xe & bóng tuýp trắng-xanh mờ trên trần bên trong (z = 13.8)
    poly(c, [PA(-1.7, 2.85, gateZ), PA(1.7, 2.85, gateZ), PA(1.7, 2.85, yardBack), PA(-1.7, 2.85, yardBack)], '#090d13');
    const tA = PA(-0.48, 2.74, 13.6);
    const tB = PA(0.48, 2.74, 13.6);
    ngoTubeGlow = { a: tA, b: tB, mid: [(tA[0] + tB[0]) * 0.5, (tA[1] + tB[1]) * 0.5] };
    seg(c, tA, tB, 2.8, 'rgba(205,235,255,0.72)');

    // Quầng ánh sáng tuýp lạnh hắt mờ lên nền và xe máy trong sân
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.25;
    c.drawImage(SP_A.tube, ngoTubeGlow.mid[0] - 110, ngoTubeGlow.mid[1] - 45, 220, 145);
    c.restore();

    // Vài chiếc xe máy đỗ lờ mờ hai hàng trong sân để xe (yên, bánh trước, yếm cong, cặp gương — KHÔNG biển số)
    const bikeSlots = [
      [-1.08, 15.2, -1], [-1.08, 13.7, -1], [-1.08, 12.2, -1],
      [1.08, 14.8, 1], [1.08, 13.2, 1],
    ];
    for (let i = 0; i < bikeSlots.length; i++) {
      const [bx, bz, side] = bikeSlots[i];
      const dir = -side;
      const b0 = PA(bx, 0.06, bz);
      const b1 = PA(bx + dir * 0.72, 0.62, bz);
      const b2 = PA(bx + dir * 0.58, 0.92, bz);
      const b3 = PA(bx + dir * 0.12, 0.66, bz);
      poly(c, [b0, b3, b2, b1], '#171f29');
      const wP = PA(bx + dir * 0.74, 0.28, bz);
      c.fillStyle = '#0c1016';
      c.beginPath(); c.ellipse(wP[0], wP[1], 7, 11, 0, 0, Math.PI * 2); c.fill();
      const mL = PA(bx + dir * 0.62, 1.12, bz - 0.10);
      const mR = PA(bx + dir * 0.62, 1.12, bz + 0.10);
      const stem = PA(bx + dir * 0.60, 0.92, bz);
      seg(c, stem, mL, 1.0, '#242e3b');
      seg(c, stem, mR, 1.0, '#242e3b');
      c.fillStyle = 'rgba(175,212,245,0.26)';
      c.beginPath(); c.arc(mL[0], mL[1], 2.2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(mR[0], mR[1], 2.2, 0, Math.PI * 2); c.fill();
    }
    // Cột bê tông trong sân xe & cửa thang máy inox lờ mờ bên tường phải sân xe
    poly(c, [PA(-1.35, 0.04, 14.2), PA(-1.12, 0.04, 14.2), PA(-1.12, 2.85, 14.2), PA(-1.35, 2.85, 14.2)], '#141b24');
    poly(c, [PA(1.42, 0.04, 13.2), PA(1.42, 2.0, 13.2), PA(1.42, 2.0, 14.8), PA(1.42, 0.04, 14.8)], '#1d2632');
    c.restore();

    // Vệt sáng lạnh hắt rất nhẹ từ khe cổng ra bậc dốc lối vào sân xe
    poly(c, [PA(gx0 + 0.1, 0.01, gateZ), PA(gx1 - 0.1, 0.01, gateZ), PA(gx1 + 0.15, 0.01, gateZ - 1.1), PA(gx0 - 0.15, 0.01, gateZ - 1.1)], 'rgba(145,180,220,0.06)');

    // 2. Hai trụ tường cổng bê tông, mái dầm phía trên & bậc dốc cổng sắt kéo (KHÔNG có chữ/biển số)
    poly(c, [PA(AL_L, 0, gateZ), PA(gx0, 0, gateZ), PA(gx0, 3.35, gateZ), PA(AL_L, 3.35, gateZ)], `rgb(${(22 + 24 * k) | 0},${(24 + 22 * k) | 0},${(28 + 14 * k) | 0})`);
    poly(c, [PA(gx1, 0, gateZ), PA(AL_R, 0, gateZ), PA(AL_R, 3.35, gateZ), PA(gx1, 3.35, gateZ)], `rgb(${(18 + 18 * k) | 0},${(20 + 16 * k) | 0},${(24 + 12 * k) | 0})`);
    poly(c, [PA(gx0, gTop, gateZ), PA(gx1, gTop, gateZ), PA(gx1, 3.15, gateZ), PA(gx0, 3.15, gateZ)], `rgb(${(20 + 20 * k) | 0},${(22 + 18 * k) | 0},${(26 + 12 * k) | 0})`);
    // Mái tôn dốc nhỏ đua ra trên đầu cổng nhà trọ
    poly(c, [PA(AL_L, 2.75, gateZ), PA(AL_R, 2.75, gateZ), PA(AL_R, 2.52, gateZ - 0.42), PA(AL_L, 2.52, gateZ - 0.42)], '#191f28');
    seg(c, PA(AL_L, 2.52, gateZ - 0.42), PA(AL_R, 2.52, gateZ - 0.42), 1.6, 'rgba(185,205,225,0.20)');

    // 3. Cánh CỔNG SẮT KÉO (ray trên/dưới + xếp gọn bên mép trái + thanh đứng + nan chéo chữ X)
    seg(c, PA(gx0, gTop, gateZ), PA(gx1, gTop, gateZ), 3.4, '#1a212b');
    seg(c, PA(gx0, 0.04, gateZ), PA(gx1, 0.04, gateZ), 3.0, '#181e26');
    poly(c, [PA(gx0, 0.04, gateZ), PA(gx0 + 0.14, 0.04, gateZ), PA(gx0 + 0.14, gTop, gateZ), PA(gx0, gTop, gateZ)], '#1b222c');

    const nBars = 11;
    const barXs = [];
    for (let i = 0; i <= nBars; i++) {
      const bx = lerp(gx0 + 0.14, gx1 - 0.05, i / nBars);
      barXs.push(bx);
      seg(c, PA(bx, 0.05, gateZ), PA(bx, gTop - 0.02, gateZ), 2.0, '#27303c');
      seg(c, PA(bx + 0.015, 0.05, gateZ), PA(bx + 0.015, gTop - 0.02, gateZ), 0.7, `rgba(210,215,220,${0.12 + 0.14 * k})`);
    }
    const rows = [0.46, 1.20, 1.92];
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const ry = rows[rIdx];
      for (let i = 0; i < nBars; i++) {
        const xA = barXs[i];
        const xB = barXs[i + 1];
        seg(c, PA(xA, ry - 0.22, gateZ), PA(xB, ry + 0.22, gateZ), 1.25, '#1d2530');
        seg(c, PA(xA, ry + 0.22, gateZ), PA(xB, ry - 0.22, gateZ), 1.25, '#1d2530');
      }
    }
    // Thanh chốt cài giữa cổng & ổ khoá nhỏ
    seg(c, PA(-0.16, 1.05, gateZ - 0.02), PA(0.14, 1.05, gateZ - 0.02), 2.6, '#303945');
    const lkPos = PA(-0.02, 0.99, gateZ - 0.02);
    c.fillStyle = '#5a4d38';
    c.fillRect(lkPos[0] - 3.5, lkPos[1] - 3.5, 7, 8);
  }

  // Vẽ dây điện chằng chịt trên đầu giữa hai bên mái nhà
  function drawOverheadWires(c, canh, def) {
    // Hai dây bó chính chạy dọc hai bên tường (mỗi bên 2 sợi song song)
    for (const side of [-1, 1]) {
      const xBase = side < 0 ? AL_L + 0.16 : AL_R - 0.16;
      const zEnd = def.endGate ? def.gateZ : 22.0;
      for (let k = 0; k < 2; k++) {
        const yOff = 3.25 + k * 0.24;
        c.strokeStyle = k === 0 ? 'rgba(8,10,16,0.92)' : 'rgba(12,16,24,0.82)';
        c.lineWidth = k === 0 ? 2.4 : 1.4;
        c.beginPath();
        const a = PA(xBase, yOff, 2.4);
        const b = PA(xBase, yOff - 0.08, zEnd);
        c.moveTo(a[0], a[1]);
        c.lineTo(b[0], b[1]);
        c.stroke();
      }
    }

    // Dây điện & cáp viễn thông vắt ngang chéo chằng chịt trên đầu (mỗi đoạn có độ võng riêng)
    const maxZ = def.endGate ? def.gateZ - 0.4 : 17.5;
    const wireCount = 9;
    for (let i = 0; i < wireCount; i++) {
      const zA = lerp(2.8, maxZ, i / (wireCount - 1)) + (arnd() - 0.5) * 0.4;
      const zB = clamp(zA + (arnd() - 0.42) * 2.2, 2.5, maxZ + 0.5);
      const yA = 3.1 + arnd() * 1.15;
      const yB = 3.1 + arnd() * 1.15;
      const pA = PA(AL_L + 0.04, yA, zA);
      const pB = PA(AL_R - 0.04, yB, zB);
      const sag = (22 + arnd() * 44) * clamp(4.8 / ((zA + zB) * 0.5), 0.35, 1.2);
      const midX = (pA[0] + pB[0]) * 0.5 + (arnd() - 0.5) * 35;
      const midY = (pA[1] + pB[1]) * 0.5 + sag;
      c.strokeStyle = i % 3 === 0 ? 'rgba(6,8,13,0.95)' : 'rgba(10,13,20,0.82)';
      c.lineWidth = i % 4 === 0 ? 2.1 : 1.15;
      c.beginPath();
      c.moveTo(pA[0], pA[1]);
      c.quadraticCurveTo(midX, midY, pB[0], pB[1]);
      c.stroke();
    }

    // Nếu có ngã rẽ, thêm vài sợi dây rẽ tách vào ngách trái/phải
    if (def.branchL) {
      const zB = (def.branchL.z0 + def.branchL.z1) * 0.45;
      const p0 = PA(AL_L + 0.12, 3.45, zB);
      const p1 = PA(-4.2, 3.65, zB + 0.9);
      c.strokeStyle = 'rgba(8,10,15,0.88)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(p0[0], p0[1]);
      c.quadraticCurveTo((p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5 + 18, p1[0], p1[1]);
      c.stroke();
    }
    if (def.branchR) {
      const zB = (def.branchR.z0 + def.branchR.z1) * 0.45;
      const p0 = PA(AL_R - 0.12, 3.45, zB);
      const p1 = PA(4.2, 3.60, zB + 0.9);
      c.strokeStyle = 'rgba(8,10,15,0.88)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(p0[0], p0[1]);
      c.quadraticCurveTo((p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5 + 18, p1[0], p1[1]);
      c.stroke();
    }

    // Cuộn cáp viễn thông đen treo đặc trưng trên tường gần (thay đổi vị trí theo từng đoạn)
    const coilSide = canh % 2 === 0 ? -1 : 1;
    const coilZ = 4.9 + canh * 0.2;
    const cp = PA(coilSide < 0 ? AL_L + 0.08 : AL_R - 0.08, 3.22, coilZ);
    const cr = Math.max(6, (AL_F * 0.14) / coilZ);
    c.strokeStyle = '#080a0f';
    c.lineWidth = Math.max(2, cr * 0.25);
    c.beginPath();
    c.ellipse(cp[0], cp[1], cr * 0.55, cr, 0, 0, Math.PI * 2);
    c.stroke();
  }

  // Dựng các vũng nước trên mặt đường ngõ (mặt nước trong suốt phản chiếu trời & vị trí ánh sáng)
  function buildAndDrawAlleyPuddles(c, puddleDefs, lamps) {
    ngoPuddles = [];
    for (let i = 0; i < puddleDefs.length; i++) {
      const [cx, cz, rx, rz, ph] = puddleDefs[i];
      const pts = [];
      const n = 16;
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2;
        const wob = 1 + 0.16 * Math.sin(a * 2 + ph) + 0.08 * Math.cos(a * 3 - ph * 1.4);
        pts.push(PA(cx + Math.cos(a) * rx * wob, 0.004, cz + Math.sin(a) * rz * wob));
      }
      const center = PA(cx, 0.004, cz);
      const edgeL = PA(cx - rx * 0.65, 0.004, cz);
      const edgeR = PA(cx + rx * 0.65, 0.004, cz);
      const farP = PA(cx, 0.004, cz + rz * 0.72);
      const nearP = PA(cx, 0.004, cz - rz * 0.72);
      const width2d = Math.max(10, Math.abs(edgeR[0] - edgeL[0]) * 0.55);

      // Tìm ngọn đèn gần nhất cho hướng phản chiếu
      let nearestLamp = lamps[0];
      let bestD = 999;
      for (let li = 0; li < lamps.length; li++) {
        const lm = lamps[li];
        const d = Math.hypot(cx - lm.side * 1.4, cz - lm.z);
        if (d < bestD) { bestD = d; nearestLamp = lm; }
      }
      const lk = alleyLit(lamps, cx, 0, cz);
      const pd = { pts, center, farP, nearP, width2d, k: lk, ph, lampX: nearestLamp ? nearestLamp.side : 0 };
      ngoPuddles.push(pd);

      c.save();
      poly(c, pts, 'rgba(5,8,14,0.42)');
      c.clip();
      const gWater = c.createLinearGradient(0, farP[1], 0, nearP[1]);
      gWater.addColorStop(0, 'rgba(20,34,56,0.34)');
      gWater.addColorStop(1, 'rgba(8,14,24,0.12)');
      c.fillStyle = gWater;
      c.fillRect(0, farP[1] - 4, W, nearP[1] - farP[1] + 8);
      c.restore();

      c.strokeStyle = `rgba(145,175,210,${0.06 + 0.07 * lk})`;
      c.lineWidth = 0.85;
      c.beginPath();
      for (let j = 0; j < 7; j++) {
        if (j === 0) c.moveTo(pts[j][0], pts[j][1]);
        else c.lineTo(pts[j][0], pts[j][1]);
      }
      c.stroke();
    }
  }

  // Vẽ đèn đường vàng gắn tường (cần đèn cong + chao mở hướng vào giữa ngõ + quầng nền)
  function drawWallStreetLamps(c, lamps) {
    ngoLampScreens = [];
    for (let i = 0; i < lamps.length; i++) {
      const lm = lamps[i];
      const xWall = lm.side < 0 ? AL_L : AL_R;
      const xHead = lm.side < 0 ? AL_L + 0.42 : AL_R - 0.42;
      const pMount = PA(xWall, lm.y - 0.14, lm.z);
      const pBulb = PA(xHead, lm.y, lm.z);
      const sc = clamp(5.0 / lm.z, 0.22, 1.05);

      ngoLampScreens.push({
        at: pBulb,
        power: lm.power,
        sc,
        ph: i * 2.1 + lm.z * 0.4,
      });

      // Quầng nền dịu lên tường gắn đèn
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.24 * lm.power;
      const rHalo = 220 * sc;
      c.drawImage(SP_A.warm, pBulb[0] - rHalo, pBulb[1] - rHalo * 0.72, rHalo * 2, rHalo * 1.75);
      c.restore();

      // Cần sắt gắn tường cong nhẹ
      c.strokeStyle = '#1b2028';
      c.lineWidth = Math.max(1.4, 4.5 * sc);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(pMount[0], pMount[1]);
      c.quadraticCurveTo((pMount[0] + pBulb[0]) * 0.5, pBulb[1] - 12 * sc, pBulb[0], pBulb[1] - 4 * sc);
      c.stroke();

      // Chao đèn mở xuống dưới-giữa ngõ + bóng đèn vàng ấm
      const hoodW = Math.max(6, 17 * sc);
      const hoodH = Math.max(3, 7 * sc);
      c.fillStyle = '#20242c';
      c.beginPath();
      c.ellipse(pBulb[0], pBulb[1] - hoodH * 0.35, hoodW, hoodH, lm.side * -0.18, Math.PI, 0);
      c.closePath();
      c.fill();

      c.fillStyle = `rgba(255,216,138,${0.86 * lm.power + 0.1})`;
      c.beginPath();
      c.ellipse(pBulb[0], pBulb[1] + hoodH * 0.2, hoodW * 0.46, Math.max(2.2, hoodH * 0.68), 0, 0, Math.PI * 2);
      c.fill();
    }
  }

  function bakeNgo(canhOverride) {
    if (!cv.width || !cv.height) return;
    buildSprites();
    initAllHotNgo();

    const canh = clampCanh(canhOverride !== undefined ? canhOverride : NGO.canh);
    const def = SEG_DEFS[canh];

    ngoC.width = cv.width;
    ngoC.height = cv.height;
    aseed = 109 + canh * 31;
    ngoTubeGlow = null;

    const c = ngoG;
    setT(c);

    // 1. Nền bầu trời, đường ngõ & ánh đèn nền
    drawAlleySky(c, def);

    // 2. Dãy nhà phía sau (sau ngã rẽ, hoặc cổng sắt kéo nhà trọ ở đoạn 3)
    const zLAfter = def.branchL ? def.branchL.z1 : 4.85;
    const zRAfter = def.branchR ? def.branchR.z1 : 4.85;
    if (def.endGate) {
      drawHouseRun(c, -1, zLAfter, def.gateZ, def.leftFarH, def.lamps, false);
      drawHouseRun(c, 1, zRAfter, def.gateZ, def.rightFarH, def.lamps, true);
      drawEndBoardingGate(c, def.gateZ, def.lamps);
    } else {
      drawHouseRun(c, -1, zLAfter, 22.0, def.leftFarH, def.lamps, true);
      drawHouseRun(c, 1, zRAfter, 22.0, def.rightFarH, def.lamps, true);
    }

    // 3. Ngã rẽ thật bên trái / bên phải (nếu đoạn có lối đó)
    if (def.branchL) drawSideBranch(c, -1, def.branchL.z0, def.branchL.z1, def.lamps);
    if (def.branchR) drawSideBranch(c, 1, def.branchR.z0, def.branchR.z1, def.lamps);

    // 4. Dãy nhà phía gần hai bên (vẽ sau ngã rẽ để góc nhà gần che đúng phần ngõ rẽ!)
    const zLNearEnd = def.branchL ? def.branchL.z0 : 4.85;
    const zRNearEnd = def.branchR ? def.branchR.z0 : 4.85;
    drawHouseRun(c, -1, AL_NEAR, zLNearEnd, def.leftNearH, def.lamps, true);
    drawHouseRun(c, 1, AL_NEAR, zRNearEnd, def.rightNearH, def.lamps, true);

    // 5. Cổng sắt sơn các nhà & chậu cây trước cửa (vẽ từ xa tới gần)
    const sortedGates = def.gates.slice().sort((a, b) => b.z0 - a.z0);
    for (let i = 0; i < sortedGates.length; i++) {
      drawHouseGate(c, sortedGates[i], def.lamps);
    }

    // 6. Cống thoát nước & vài vũng nước trên mặt đường
    for (let i = 0; i < def.drains.length; i++) {
      drawDrain(c, def.drains[i], def.lamps);
    }
    buildAndDrawAlleyPuddles(c, def.puddles, def.lamps);

    // 7. Đèn đường vàng gắn tường (vị trí mỗi đoạn khác nhau rõ rệt)
    drawWallStreetLamps(c, def.lamps);

    // 8. Dây điện chằng chịt trên đầu
    drawOverheadWires(c, canh, def);

    // 9. Bụi mặt đường, hạt phim & viền tối 4 góc
    for (let i = 0; i < 2600; i++) {
      c.fillStyle = `rgba(${arnd() < 0.5 ? '210,220,235' : '0,0,0'},${arnd() * 0.022})`;
      c.fillRect(arnd() * W, arnd() * H, 1.8, 1.8);
    }
    grain(c, 9200, 0.022);
    vignette(c, 0.78);

    ngoBakedCanh = canh;
  }

  function ensureNgoBaked(canh) {
    if (ngoBakedCanh !== canh || ngoC.width !== cv.width || ngoC.height !== cv.height) {
      bakeNgo(canh);
    }
  }

  function drawNgo(c, now, dt, opts) {
    const canh = clampCanh(opts && Object.prototype.hasOwnProperty.call(opts, 'canh') ? opts.canh : NGO.canh);
    ensureNgoBaked(canh);

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(ngoC, 0, 0);
    setT(c);

    const t = now * 0.001;
    const baseAlpha = c.globalAlpha;

    // 1. Nhịp thở / chập chờn rất nhẹ của các đèn đường vàng gắn tường
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < ngoLampScreens.length; i++) {
      const lm = ngoLampScreens[i];
      const flick = 0.90 + 0.06 * Math.sin(t * 1.9 + lm.ph) + 0.03 * Math.sin(t * 9.4 + lm.ph);
      const rw = 215 * lm.sc;
      const cg = 58 * lm.sc;
      c.globalAlpha = baseAlpha * 0.42 * lm.power * flick;
      c.drawImage(SP_A.warm, lm.at[0] - rw, lm.at[1] - rw * 0.65, rw * 2, rw * 1.6);
      c.globalAlpha = baseAlpha * 0.76 * lm.power * flick;
      c.drawImage(SP_A.glow, lm.at[0] - cg, lm.at[1] - cg, cg * 2, cg * 2);
    }

    // Đoạn 3: ánh đèn tuýp sân để xe bên trong cổng sắt kéo hơi rung nhẹ
    if (ngoTubeGlow) {
      const tf = 0.88 + 0.07 * Math.sin(t * 4.2) + (Math.sin(t * 2.1 + 0.8) > 0.94 ? -0.25 : 0);
      c.globalAlpha = baseAlpha * 0.24 * tf;
      c.drawImage(SP_A.tube, ngoTubeGlow.mid[0] - 95, ngoTubeGlow.mid[1] - 35, 190, 125);
    }
    c.restore();

    // 2. Phản chiếu đèn vàng trên các vũng nước mặt đường ngõ
    for (let i = 0; i < ngoPuddles.length; i++) {
      const pd = ngoPuddles[i];
      const ripple = 0.86 + 0.14 * Math.sin(t * 2.2 + pd.ph);
      const rx = Math.sin(t * 1.4 + pd.ph) * 1.8;

      c.save();
      c.beginPath();
      for (let j = 0; j < pd.pts.length; j++) {
        if (j) c.lineTo(pd.pts[j][0], pd.pts[j][1]);
        else c.moveTo(pd.pts[j][0], pd.pts[j][1]);
      }
      c.closePath();
      c.clip();

      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = baseAlpha * (0.28 + 0.42 * pd.k) * ripple;
      const rw = pd.width2d * 1.35;
      const rh = Math.max(12, Math.abs(pd.nearP[1] - pd.farP[1]) * 0.95);
      c.drawImage(SP_A.warm, pd.center[0] + rx + pd.lampX * 10 - rw, pd.center[1] - rh * 0.5, rw * 2, rh);

      for (let gStep = 0; gStep < 3; gStep++) {
        const u = 0.25 + gStep * 0.25;
        const gy = lerp(pd.farP[1], pd.nearP[1], u);
        const gx = lerp(pd.farP[0], pd.nearP[0], u) + rx * (gStep - 1) * 0.65;
        const hw = pd.width2d * (0.26 + 0.10 * Math.sin(gStep * 1.7 + pd.ph));
        c.strokeStyle = `rgba(255,208,132,${0.26 + 0.36 * pd.k})`;
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(gx - hw, gy);
        c.lineTo(gx + hw, gy);
        c.stroke();
      }
      c.restore();
    }
  }

  // ============================================================================
  // CẢNH 3 · SC.luotngo · ĐOẠN CHUYỂN CẢNH 8 GIÂY LƯỚT QUA HỒ, GIẾNG, CỔNG & NGÕ XÓM RỘNG
  // ============================================================================
  // Bake sẵn bầu trời, đích cuối & 11 lát cắt không gian dọc hành trình rồi dịch chuyển /
  // phóng đại mỗi khung trong drawLuotNgo để giữ 60 fps mượt trên điện thoại.
  const [lnBgC, lnBgG] = layer();
  const [lnDestC, lnDestG] = layer();
  const [lnVigC, lnVigG] = layer();
  const [lnWaterC, lnWaterG] = layer();

  const LN_DUR = 8.0;
  const LN_CAM_Y = 1.52;
  const LN_F = 800;
  const LN_VX = 800;
  const LN_VY = 380;
  const LN_SLICE_Z0 = 5.4;
  const LN_SLICE_Z1 = 16.2;
  const SL_BX = -440;
  const SL_BY = -1140;
  const SL_BW = 2480;
  const SL_BH = 1800;
  const SL_SCALE = 0.44;
  const DEST_BX = -440;
  const DEST_BY = 20;
  const DEST_BW = 2480;
  const DEST_BH = 880;
  const DEST_SCALE = 0.68;
  const LN_Z_DEST = 56.0;
  const LN_Z_DEST_END = 11.2;
  const LN_TRAVEL = LN_Z_DEST - LN_Z_DEST_END; // 44.8m
  const LN_CURVE_START = 16.5;
  const LN_CURVE_END = 42.5;
  const LN_CURVE_SPAN = LN_CURVE_END - LN_CURVE_START;

  const LN_SLICE_META = [
    { kind: 'lakeWall', zPos: 1.8, endWall: false },
    { kind: 'lakeWall', zPos: 5.5, endWall: true },
    { kind: 'well', zPos: 10.6 },
    { kind: 'gate', zPos: 14.3 },
    { kind: 'alley', zPos: 16.6, idx: 0, tree: -1, flags: 6.2, lampSide: 1, bike: -1, car: false, umb: 0 },
    { kind: 'alley', zPos: 20.6, idx: 1, tree: 1, flags: 6.4, lampSide: -1, bike: 1, car: false, umb: -1 },
    { kind: 'alley', zPos: 24.7, idx: 2, tree: -1, flags: 0, lampSide: 1, bike: 0, car: true, umb: 0 },
    { kind: 'alley', zPos: 28.8, idx: 3, tree: 1, flags: 6.2, lampSide: -1, bike: -1, car: false, umb: 1 },
    { kind: 'alley', zPos: 32.9, idx: 4, tree: -1, flags: 0, lampSide: 1, bike: 1, car: false, umb: 0 },
    { kind: 'alley', zPos: 37.0, idx: 5, tree: 1, flags: 6.1, lampSide: -1, bike: 0, car: false, umb: 0 },
    { kind: 'alley', zPos: 41.1, idx: 6, tree: 0, flags: 0, lampSide: 1, bike: -1, car: false, umb: 1 },
  ];
  const lnSlices = LN_SLICE_META.map(() => {
    const [cvS, gS] = layer();
    return { cv: cvS, g: gS, lamps: [] };
  });

  // Pool dùng lại để không cấp phát mảng/object trong drawLuotNgo
  const LN_LIVE_LAMPS = [];
  for (let i = 0; i < 20; i++) LN_LIVE_LAMPS.push({ sx: 0, sy: 0, sc: 1, alpha: 1, ph: 0 });
  let lnLiveLampCount = 0;

  // Vệt gợn mặt hồ đêm bên phải đoạn đầu (cố định trước, chỉ dịch nhẹ theo sin trong draw)
  const LN_RIPPLES = [
    { x: 1.5, z: 3.1, w: 0.72, tone: 'moon', ph: 0.2 },
    { x: 2.8, z: 3.9, w: 0.94, tone: 'moon', ph: 1.4 },
    { x: 0.7, z: 4.8, w: 0.56, tone: 'warm', ph: 2.5 },
    { x: 2.2, z: 5.7, w: 0.86, tone: 'moon', ph: 0.9 },
    { x: 3.5, z: 6.6, w: 1.05, tone: 'moon', ph: 3.2 },
    { x: 1.1, z: 7.4, w: 0.68, tone: 'warm', ph: 1.9 },
    { x: 2.9, z: 8.4, w: 0.96, tone: 'moon', ph: 4.1 },
    { x: 0.4, z: 9.4, w: 0.60, tone: 'warm', ph: 2.8 },
    { x: 2.0, z: 10.6, w: 0.84, tone: 'warm', ph: 5.0 },
    { x: 3.3, z: 11.7, w: 0.98, tone: 'moon', ph: 3.7 },
    { x: 1.0, z: 12.8, w: 0.70, tone: 'warm', ph: 0.6 },
    { x: 2.3, z: 13.7, w: 0.82, tone: 'warm', ph: 4.6 },
  ];

  // Đệm toạ độ dựng đa giác mặt hồ & mặt ngõ (không cấp phát mỗi khung)
  const LN_WATER_X = new Float32Array(20);
  const LN_WATER_Y = new Float32Array(20);
  const LN_ROAD_LX = new Float32Array(24);
  const LN_ROAD_RX = new Float32Array(24);
  const LN_ROAD_Y = new Float32Array(24);
  const LN_SIDE_LX = new Float32Array(24);
  const LN_SIDE_RX = new Float32Array(24);
  const LN_SIDE_Y = new Float32Array(24);

  let lnWinPos = { cx: 840, cy: 249, w: 72, h: 38 };
  let lnGateLamp = { cx: 584, cy: 506 };
  let lnTubePos = { cx: 800, cy: 562 };
  let lnSeed = 313;
  let lnBaked = false;
  let lnBakedW = 0;
  let lnBakedH = 0;
  let lnDoneFired = false;

  function lrnd() {
    lnSeed = (lnSeed * 16807) % 2147483647;
    return lnSeed / 2147483647;
  }

  function smooth01(u) {
    const v = clamp(u, 0, 1);
    return v * v * (3 - 2 * v);
  }

  function alleyCurveX(s) {
    if (s <= LN_CURVE_START || s >= LN_CURVE_END) return 0;
    const u = (s - LN_CURVE_START) / LN_CURVE_SPAN;
    const sn = Math.sin(Math.PI * u);
    return 1.35 * sn * sn;
  }

  function camLateralX(camZ) {
    return alleyCurveX(camZ) - 0.28 * (1 - smooth01(camZ / 13.5));
  }

  function camHeading(camZ) {
    const lookZ = Math.min(LN_Z_DEST, camZ + 12.5);
    const lookX = alleyCurveX(lookZ) - 0.10 * (1 - smooth01(camZ / 12.0));
    const dz = Math.max(4.0, lookZ - camZ);
    return clamp(((lookX - camLateralX(camZ)) / dz) * 0.80, -0.14, 0.14);
  }

  function makeSliceProjector(zPos) {
    const baseCx = alleyCurveX(zPos);
    return (xLocal, y, zBake) => {
      const sWorld = zPos + (zBake - LN_SLICE_Z0);
      const dx = alleyCurveX(sWorld) - baseCx;
      return [LN_VX + (LN_F * (xLocal + dx)) / zBake, LN_VY + (LN_F * (LN_CAM_Y - y)) / zBake];
    };
  }

  // Vẽ ô cửa sổ mặt tiền khu nhà trọ cuối ngõ (ĐỘC NHẤT MỘT Ô TẦNG 5 SÁNG TRẮNG XANH)
  function drawLnBoardingWindow(c, x, y, w, h, mode) {
    c.fillStyle = '#0c1017';
    c.fillRect(x - 4, y - 4, w + 8, h + 8);
    if (mode === 'cool') {
      const gr = c.createLinearGradient(x, y, x + w, y + h);
      gr.addColorStop(0, '#72aad8');
      gr.addColorStop(0.45, '#b6dfff');
      gr.addColorStop(1, '#dcf2ff');
      c.fillStyle = gr;
      c.fillRect(x, y, w, h);

      // Bóng chao đèn bàn & mép bàn học bên trong
      c.fillStyle = 'rgba(22,36,54,0.34)';
      c.fillRect(x, y + h * 0.72, w * 0.45, h * 0.28);
      c.fillStyle = 'rgba(20,34,52,0.56)';
      c.beginPath();
      c.moveTo(x + w * 0.56, y + h * 0.30);
      c.lineTo(x + w * 0.78, y + h * 0.44);
      c.lineTo(x + w * 0.52, y + h * 0.48);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(20,34,52,0.52)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x + w * 0.72, y + h * 0.72);
      c.lineTo(x + w * 0.68, y + h * 0.36);
      c.stroke();

      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.52;
      c.drawImage(SP_A.cool, x + w * 0.22, y + h * 0.16, w * 0.78, h * 0.78);
      c.restore();

      c.strokeStyle = '#131b26';
      c.lineWidth = 1.4;
      for (let i = 1; i <= 4; i++) {
        const bx = x + (w * i) / 5;
        c.beginPath();
        c.moveTo(bx, y);
        c.lineTo(bx, y + h);
        c.stroke();
      }
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(x, y + h * 0.50);
      c.lineTo(x + w, y + h * 0.50);
      c.stroke();
      c.strokeStyle = '#182230';
      c.lineWidth = 2.2;
      c.strokeRect(x, y, w, h);
      c.fillStyle = 'rgba(182,226,255,0.56)';
      c.fillRect(x - 6, y + h + 2, w + 12, 4);
      lnWinPos = { cx: x + w * 0.5, cy: y + h * 0.5, w, h };
      return;
    }

    c.fillStyle = '#070a10';
    c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(20,27,38,0.48)';
    c.fillRect(x + 2, y + 2, w * 0.46, h - 4);
    c.strokeStyle = '#1a222f';
    c.lineWidth = 1.6;
    c.strokeRect(x, y, w, h);
    c.strokeStyle = '#151b26';
    c.lineWidth = 1.2;
    for (let i = 1; i <= 3; i++) {
      const bx = x + (w * i) / 4;
      c.beginPath();
      c.moveTo(bx, y + 1);
      c.lineTo(bx, y + h - 1);
      c.stroke();
    }
    c.fillStyle = '#18202c';
    c.fillRect(x - 6, y + h + 2, w + 12, 4);
  }

  function bakeLnBackground(c) {
    setT(c);
    let gr = c.createLinearGradient(0, 0, 0, LN_VY + 45);
    gr.addColorStop(0, '#060a14');
    gr.addColorStop(0.55, '#0d1528');
    gr.addColorStop(1, '#18243c');
    c.fillStyle = gr;
    c.fillRect(-300, -300, W + 600, LN_VY + 355);

    // Mặt trăng mềm phía trên-phải của đoạn bờ hồ
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.28;
    c.drawImage(SP_A.cool, 1085, 22, 230, 230);
    c.restore();
    c.fillStyle = 'rgba(232,240,252,0.88)';
    c.beginPath();
    c.arc(1200, 132, 16, 0, Math.PI * 2);
    c.fill();

    // Vài đốm sao nhỏ (chừa góc trên-trái x<200, y<240)
    for (let i = 0; i < 42; i++) {
      const sx = 230 + lrnd() * 1300;
      const sy = 18 + lrnd() * 215;
      c.fillStyle = `rgba(205,222,248,${(0.06 + lrnd() * 0.10).toFixed(3)})`;
      c.fillRect(sx, sy, 1.4, 1.4);
    }

    // Dải nền mặt đất đêm bên dưới chân trời (sáng hơn một chút để rõ hình khối ngõ)
    gr = c.createLinearGradient(0, LN_VY, 0, 880);
    gr.addColorStop(0, '#161e2e');
    gr.addColorStop(0.45, '#121826');
    gr.addColorStop(0.82, '#0d111a');
    gr.addColorStop(1, '#080b12');
    c.fillStyle = gr;
    c.fillRect(-300, LN_VY, W + 600, H + 300 - LN_VY);

    grain(c, 4200, 0.015);
  }

  function bakeLnWaterGradient() {
    lnWaterC.width = 32;
    lnWaterC.height = 540;
    const wg = lnWaterG;
    wg.setTransform(1, 0, 0, 1, 0, 0);
    const gr = wg.createLinearGradient(0, 0, 0, 540);
    gr.addColorStop(0, '#0f1c32');
    gr.addColorStop(0.32, '#0c1629');
    gr.addColorStop(0.68, '#091120');
    gr.addColorStop(1, '#060b16');
    wg.fillStyle = gr;
    wg.fillRect(0, 0, 32, 540);
  }

  function bakeLnDestination(c) {
    setT(c);
    const x0 = 636;
    const x1 = 964;
    const sideX = 1004;
    const topY = 148;
    const groundY = 664;

    // 1. Dãy nhà ống sạch sẽ hai bên khu nhà trọ (trải rộng -440..2040 để không hở mép)
    poly(c, [[-440, 290], [60, 290], [60, groundY], [-440, groundY]], '#111824');
    poly(c, [[52, 330], [348, 344], [348, groundY], [52, groundY]], '#131a27');
    poly(c, [[340, 344], [636, 326], [636, groundY], [340, groundY]], '#171f2e');
    poly(c, [[328, 344], [636, 324], [636, 336], [328, 356]], '#222d40');

    // Ô cửa sổ hàng xóm hai bên tối dịu (tránh thanh sọc gắt lộ sau tường ngõ, TUYỆT ĐỐI không chữ)
    c.fillStyle = '#0c1018';
    c.fillRect(140, 530, 146, 134);
    c.fillRect(398, 558, 114, 106);
    c.strokeStyle = '#192130';
    c.lineWidth = 1.2;
    c.strokeRect(140, 530, 146, 134);
    c.fillStyle = '#0a0e16';
    c.fillRect(160, 400, 52, 54);
    c.fillRect(240, 400, 52, 54);
    c.fillRect(425, 392, 48, 52);
    c.fillRect(522, 384, 52, 52);
    // 1 ô cửa sổ hàng xóm hắt ánh vàng ấm nhẹ
    c.fillStyle = 'rgba(232,184,112,0.56)';
    c.fillRect(428, 395, 42, 46);

    poly(c, [[sideX, 304], [1290, 326], [1290, groundY], [sideX, groundY]], '#141b28');
    poly(c, [[1280, 344], [1640, 330], [1640, groundY], [1280, groundY]], '#121825');
    poly(c, [[1632, 286], [2040, 286], [2040, groundY], [1632, groundY]], '#101622');
    poly(c, [[sideX, 301], [1292, 324], [1292, 336], [sideX, 313]], '#1f2838');
    c.fillStyle = '#090d15';
    c.fillRect(1078, 376, 52, 54);
    c.fillRect(1176, 386, 50, 54);
    c.fillRect(1078, 478, 52, 54);
    c.fillRect(1360, 392, 54, 56);
    c.fillRect(1465, 392, 54, 56);
    c.fillRect(1120, 550, 128, 114);
    c.fillRect(1375, 536, 150, 128);

    // Dây điện mảnh hai bên mái nhà (tránh góc trên-trái x<200, y<240)
    c.strokeStyle = 'rgba(8,10,16,0.92)';
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(328, 340);
    c.quadraticCurveTo(475, 372, 636, 318);
    c.moveTo(sideX, 294);
    c.quadraticCurveTo(1145, 338, 1288, 318);
    c.stroke();

    // 2. Đèn đường vàng gắn tường trái trước cổng nhà trọ
    const glX = 584;
    const glY = 506;
    lnGateLamp = { cx: glX, cy: glY };
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.34;
    c.drawImage(SP_A.warm, glX - 115, glY - 75, 230, 195);
    c.restore();
    c.strokeStyle = '#242c38';
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(554, 496);
    c.lineTo(glX, glY - 4);
    c.stroke();
    c.fillStyle = '#262e3c';
    c.beginPath();
    c.ellipse(glX, glY - 3, 12, 5, -0.15, Math.PI, 0);
    c.fill();
    c.fillStyle = '#ffd991';
    c.beginPath();
    c.ellipse(glX, glY + 2, 5.5, 3.8, 0, 0, Math.PI * 2);
    c.fill();

    // 3. Toà nhà trọ nhiều tầng (giữ nguyên kiến trúc & ô cửa sổ tầng 5 sáng trắng xanh, KHÔNG số nhà/địa chỉ)
    let gr = c.createLinearGradient(x1, topY, sideX, groundY);
    gr.addColorStop(0, '#131a26');
    gr.addColorStop(0.6, '#18202e');
    gr.addColorStop(1, '#101520');
    poly(c, [[x1, topY], [sideX, topY + 24], [sideX, groundY - 8], [x1, groundY]], gr);

    gr = c.createLinearGradient(x0, topY, x1, groundY);
    gr.addColorStop(0, '#1d2736');
    gr.addColorStop(0.55, '#242f40');
    gr.addColorStop(1, '#1a2230');
    c.fillStyle = gr;
    c.fillRect(x0, topY, x1 - x0, groundY - topY);

    const floorYs = [148, 214, 280, 346, 412, 478, 536];
    for (let i = 0; i < floorYs.length; i++) {
      const fy = floorYs[i];
      c.fillStyle = '#2d394b';
      c.fillRect(x0 - 6, fy - 4, x1 - x0 + 12, 7);
      c.fillStyle = 'rgba(0,0,0,0.42)';
      c.fillRect(x0 - 4, fy + 3, x1 - x0 + 8, 4);
      poly(c, [[x1 + 6, fy - 4], [sideX + 2, fy + 8], [sideX + 2, fy + 14], [x1 + 6, fy + 3]], '#1c2432');
    }
    c.fillStyle = '#151c28';
    c.fillRect(x1 - 14, topY, 8, groundY - topY);

    // Sân thượng + lan can (y 108..148)
    poly(c, [[816, 108], [926, 108], [926, 142], [816, 142]], '#111722');
    c.fillStyle = '#1c2432';
    roundRect(c, 760, 118, 34, 22, 5);
    c.fill();
    c.fillStyle = '#1a2230';
    c.fillRect(x0, 136, x1 - x0, 12);
    c.strokeStyle = '#2d394c';
    c.lineWidth = 3.0;
    c.beginPath();
    c.moveTo(x0 + 2, 116);
    c.lineTo(x1 - 2, 116);
    c.stroke();
    c.strokeStyle = '#222b3b';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x0 + 2, 128);
    c.lineTo(x1 - 2, 128);
    c.stroke();
    c.strokeStyle = '#283344';
    c.lineWidth = 1.6;
    for (let lx = x0 + 6; lx <= x1 - 4; lx += 16) {
      c.beginPath();
      c.moveTo(lx, 116);
      c.lineTo(lx, 140);
      c.stroke();
    }

    // Các ô cửa sổ tắt + ĐỘC NHẤT MỘT Ô CỬA SỔ TẦNG 5 SÁNG ĐÈN TRẮNG XANH
    drawLnBoardingWindow(c, 672, 164, 58, 36, 'off');
    drawLnBoardingWindow(c, 804, 164, 68, 36, 'off');
    drawLnBoardingWindow(c, 672, 230, 58, 38, 'off');
    drawLnBoardingWindow(c, 804, 230, 72, 38, 'cool');
    drawLnBoardingWindow(c, 672, 296, 58, 38, 'off');
    drawLnBoardingWindow(c, 804, 296, 68, 38, 'off');
    drawLnBoardingWindow(c, 672, 362, 58, 38, 'off');
    drawLnBoardingWindow(c, 804, 362, 68, 38, 'off');
    drawLnBoardingWindow(c, 672, 428, 60, 38, 'off');
    drawLnBoardingWindow(c, 804, 428, 68, 38, 'off');

    // Tầng trệt: mái hiên, cột cổng & cổng sắt xếp (ánh đèn tuýp trong sân xe)
    c.fillStyle = '#18202c';
    c.fillRect(x0, 536, 60, groundY - 536);
    c.fillRect(904, 536, x1 - 904, groundY - 536);
    poly(c, [[x0 - 12, 532], [x1 + 12, 532], [x1 + 20, 544], [x0 - 20, 544]], '#242e3e');

    const dx0 = 696;
    const dx1 = 904;
    const dy0 = 550;
    const dy1 = groundY;
    c.fillStyle = '#0b1018';
    c.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
    c.strokeStyle = 'rgba(208,236,255,0.78)';
    c.lineWidth = 3.0;
    c.beginPath();
    c.moveTo(766, 562);
    c.lineTo(834, 562);
    c.stroke();
    lnTubePos = { cx: 800, cy: 562 };
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.24;
    c.drawImage(SP_A.tube, 718, 538, 164, 90);
    c.restore();

    for (const bx of [728, 746, 856, 872]) {
      poly(c, [[bx - 12, 650], [bx - 4, 624], [bx + 10, 622], [bx + 12, 652]], '#1b2432');
    }

    c.strokeStyle = '#2b3646';
    c.lineWidth = 3;
    c.strokeRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
    const nBars = 11;
    c.strokeStyle = '#303b4d';
    c.lineWidth = 1.8;
    for (let i = 1; i < nBars; i++) {
      const bx = lerp(dx0 + 8, dx1 - 8, i / nBars);
      c.beginPath();
      c.moveTo(bx, dy0 + 2);
      c.lineTo(bx, dy1 - 2);
      c.stroke();
    }
    c.strokeStyle = '#232c3a';
    c.lineWidth = 1.2;
    for (const ry of [578, 612, 642]) {
      for (let i = 1; i < nBars; i++) {
        const xA = lerp(dx0 + 8, dx1 - 8, (i - 1) / nBars);
        const xB = lerp(dx0 + 8, dx1 - 8, i / nBars);
        c.beginPath();
        c.moveTo(xA, ry - 12);
        c.lineTo(xB, ry + 12);
        c.moveTo(xA, ry + 12);
        c.lineTo(xB, ry - 12);
        c.stroke();
      }
    }
    c.fillStyle = '#1e2836';
    c.fillRect(922, 594, 24, 34);
    c.fillStyle = '#4ad08a';
    c.beginPath();
    c.arc(934, 604, 3, 0, Math.PI * 2);
    c.fill();

    // Mảng bóng đổ mềm ngay chân cổng nhà trọ (hoà vào mặt ngõ động, KHÔNG cắt vạch ngang giữa ngõ)
    gr = c.createLinearGradient(0, groundY - 2, 0, groundY + 62);
    gr.addColorStop(0, 'rgba(14,18,28,0.88)');
    gr.addColorStop(0.35, 'rgba(14,18,28,0.48)');
    gr.addColorStop(1, 'rgba(14,18,28,0)');
    c.fillStyle = gr;
    c.fillRect(-160, groundY - 2, 1920, 64);
  }

  // Tường đình lộ gạch, rêu chân, mái ngói cong bên trái mép hồ (lát 0 & 1)
  function drawLnLakeWallSlice(c, P, z0, z1, endWall) {
    const zStop = endWall ? z0 + 3.0 : z1;
    const xW = -1.46;
    const hW = 1.84;

    // Má hồi che mép trái màn hình ở z0
    poly(c, [P(xW, 0, z0), P(-5.8, 0, z0), P(-5.8, hW + 0.5, z0), P(xW, hW, z0)], '#131822');

    // Mảng tường vữa cũ & chân rêu
    poly(c, [P(xW, 0, z0), P(xW, 0, zStop), P(xW, hW, zStop), P(xW, hW, z0)], '#232732');
    poly(c, [P(xW, 0, z0), P(xW, 0, zStop), P(xW, 0.34, zStop), P(xW, 0.34, z0)], '#18211b');

    // Gạch nung lộ vữa phong hoá trên mặt tường đình
    const brickStart = z0 + 0.32;
    const brickEnd = Math.min(zStop - 0.28, z0 + 3.2);
    if (brickEnd > brickStart) {
      for (let row = 0; row < 5; row++) {
        const yB = 0.42 + row * 0.14;
        const yT = yB + 0.11;
        const nCol = 5;
        for (let col = 0; col < nCol; col++) {
          const zA = lerp(brickStart, brickEnd, (col + (row % 2) * 0.25) / (nCol + 0.5));
          const zB = lerp(brickStart, brickEnd, (col + 0.85 + (row % 2) * 0.25) / (nCol + 0.5));
          if (zB >= zStop) continue;
          const tint = (row + col) % 3 === 0 ? '#4d2b24' : (row + col) % 3 === 1 ? '#3e231e' : '#5b3329';
          poly(c, [P(xW + 0.01, yB, zA), P(xW + 0.01, yB, zB), P(xW + 0.01, yT, zB), P(xW + 0.01, yT, zA)], tint);
        }
      }
    }

    // Mái ngói cong đình gọn bên trái tường (không vươn quá sát tâm camera để tránh loé ngang khi gần)
    poly(c, [P(-3.6, 2.75, z0), P(-3.6, 2.75, zStop), P(-1.12, 1.98, zStop), P(-1.12, 1.98, z0)], '#1d202b');
    poly(c, [P(-1.12, 1.98, z0), P(-1.12, 1.98, zStop), P(-1.12, 2.09, zStop), P(-1.12, 2.09, z0)], '#2c3140');
    c.strokeStyle = '#11151e';
    c.lineWidth = 1.6;
    for (let k = 1; k <= 6; k++) {
      const zRib = lerp(z0 + 0.2, zStop - 0.2, k / 7);
      const a = P(-3.2, 2.62, zRib);
      const b = P(-1.12, 1.98, zRib);
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
      c.stroke();
    }

    // Đuôi mái cong hếch lên & trụ góc ở cuối tường đình
    if (endWall) {
      poly(c, [P(xW - 0.35, 0, zStop), P(xW + 0.06, 0, zStop), P(xW + 0.06, hW + 0.14, zStop), P(xW - 0.35, hW + 0.14, zStop)], '#1e2432');
      poly(c, [P(xW - 0.38, hW + 0.14, zStop), P(xW + 0.10, hW + 0.14, zStop), P(xW + 0.04, hW + 0.24, zStop), P(xW - 0.34, hW + 0.24, zStop)], '#2b3244');
      poly(c, [P(-1.12, 1.98, zStop), P(-0.96, 2.19, zStop), P(-1.26, 2.26, zStop), P(-1.46, 2.10, zStop)], '#272c3a');
    }

    // Bờ kè đá ven hồ dọc bên trái (bên phải x > -0.42 giữ trong suốt cho nước hồ động)
    poly(c, [P(xW, 0, z0), P(-0.42, 0, z0), P(-0.42, 0, zStop), P(xW, 0, zStop)], '#1f2532');
    poly(c, [P(-0.42, -0.06, z0), P(-0.34, -0.06, z0), P(-0.34, 0.02, zStop), P(-0.42, 0.02, zStop)], '#283040');
  }

  // Cái giếng làng thành tròn xây gạch rõ nét bên trái lối vào (gần mặt trước lát để hiện RÕ, TO)
  function drawLnVillageWell(c, P, z0, z1) {
    const cx = -1.58;
    const zW = z0 + 0.42; // 5.82: ngay mặt trước lát cắt nên to rõ, không bị che
    const rad = 0.72;
    const wellH = 0.88;

    // Nền sân gạch quanh giếng bên trái mép hồ (bên phải x > -0.42 giữ trong suốt cho nước hồ)
    poly(c, [P(-5.6, 0, z0 - 0.4), P(-0.42, 0, z0 - 0.4), P(-0.42, 0, z1), P(-5.6, 0, z1)], '#1a202c');
    // Viền đá kè tiếp giáp mép hồ
    poly(c, [P(-0.44, -0.06, z0 - 0.4), P(-0.34, -0.06, z0 - 0.4), P(-0.34, 0.02, z1), P(-0.44, 0.02, z1)], '#2a3344');

    // Bệ đá bát giác / tròn rộng dưới chân giếng + viền sáng nhạt
    const padC = P(cx, 0.01, zW);
    const padL = P(cx - 1.04, 0.01, zW);
    const padR = P(cx + 1.04, 0.01, zW);
    const padRx = Math.abs(padR[0] - padL[0]) * 0.5;
    const padRy = padRx * 0.27;
    c.fillStyle = '#28303e';
    c.beginPath();
    c.ellipse(padC[0], padC[1] + 4, padRx, padRy, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(175,195,225,0.22)';
    c.lineWidth = 1.4;
    c.stroke();

    // Cụm cây nhỏ tối sau lưng giếng bên rìa trái (không che giếng)
    const bushP = P(-2.95, 1.45, zW + 1.4);
    const bushR = 76;
    c.fillStyle = '#0d141c';
    c.beginPath();
    c.arc(bushP[0], bushP[1], bushR, 0, Math.PI * 2);
    c.arc(bushP[0] - 38, bushP[1] + 20, bushR * 0.72, 0, Math.PI * 2);
    c.fill();

    // Thân giếng trụ tròn xây gạch nung so le (màu gạch đỏ ấm sáng dần về phía phải gần đèn cổng)
    const pBotL = P(cx - rad, 0.02, zW);
    const pBotR = P(cx + rad, 0.02, zW);
    const pTopL = P(cx - rad, wellH, zW);
    const pTopR = P(cx + rad, wellH, zW);
    const rx = Math.abs(pTopR[0] - pTopL[0]) * 0.5;
    const ry = rx * 0.30;
    const cTop = P(cx, wellH, zW);
    const cBot = P(cx, 0.02, zW);

    const wGr = c.createLinearGradient(pTopL[0], 0, pTopR[0], 0);
    wGr.addColorStop(0, '#36211c');
    wGr.addColorStop(0.45, '#593328');
    wGr.addColorStop(0.82, '#7c4734');
    wGr.addColorStop(1, '#683b2c');
    c.fillStyle = wGr;
    c.beginPath();
    c.moveTo(pBotL[0], pBotL[1]);
    c.lineTo(pTopL[0], pTopL[1]);
    c.ellipse(cTop[0], cTop[1], rx, ry, 0, Math.PI, 0, false);
    c.lineTo(pBotR[0], pBotR[1]);
    c.ellipse(cBot[0], cBot[1], rx, ry * 1.06, 0, 0, Math.PI, false);
    c.closePath();
    c.fill();

    // Từng viên gạch so le xây thành giếng tròn (tăng độ nhận diện giếng xây gạch)
    const nRows = 5;
    for (let row = 0; row < nRows; row++) {
      const yA = lerp(0.05, wellH - 0.04, row / nRows);
      const yB = lerp(0.05, wellH - 0.04, (row + 0.84) / nRows);
      const cols = 7;
      for (let col = 0; col < cols; col++) {
        const off = (row % 2) * 0.45;
        const f0 = clamp((col + off) / cols, 0.03, 0.97);
        const f1 = clamp((col + off + 0.82) / cols, 0.03, 0.97);
        if (f1 <= f0 + 0.03) continue;
        const a0 = Math.PI * (1 - f0);
        const a1 = Math.PI * (1 - f1);
        const xA0 = cx + Math.cos(a0) * (rad + 0.005);
        const zA0 = zW - Math.sin(a0) * (rad + 0.005) * 0.35;
        const xA1 = cx + Math.cos(a1) * (rad + 0.005);
        const zA1 = zW - Math.sin(a1) * (rad + 0.005) * 0.35;
        const brCol = f1 > 0.62
          ? ((row + col) % 2 === 0 ? '#8c523c' : '#7a4532')
          : f1 > 0.3
            ? ((row + col) % 2 === 0 ? '#683b2d' : '#573125')
            : '#462820';
        poly(c, [P(xA0, yA, zA0), P(xA1, yA, zA1), P(xA1, yB, zA1), P(xA0, yB, zA0)], brCol);
      }
    }

    // Mạch vữa vòng ngang rõ quanh thành giếng
    c.strokeStyle = 'rgba(20,12,10,0.72)';
    c.lineWidth = 1.5;
    for (let ring = 1; ring < nRows; ring++) {
      const yR = lerp(0.05, wellH - 0.04, ring / nRows);
      const rp = P(cx, yR, zW);
      c.beginPath();
      c.ellipse(rp[0], rp[1], rx, ry, 0, 0, Math.PI, false);
      c.stroke();
    }

    // Vệt rêu chân thành giếng
    c.fillStyle = 'rgba(34,48,30,0.72)';
    c.beginPath();
    c.ellipse(cBot[0] - rx * 0.25, cBot[1] + 2, rx * 0.62, ry * 0.45, 0, 0, Math.PI * 2);
    c.fill();

    // Vành miệng đá tròn dày sáng nhẹ trên miệng giếng + nửa nắp gỗ
    c.fillStyle = '#4c4944';
    c.beginPath();
    c.ellipse(cTop[0], cTop[1] + 4, rx + 5, ry + 3, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#686258';
    c.beginPath();
    c.ellipse(cTop[0], cTop[1] - 1, rx + 4, ry + 2.5, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(255,220,165,0.34)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(cTop[0], cTop[1] - 1, rx + 3, ry + 2, 0, -Math.PI * 0.45, Math.PI * 0.35);
    c.stroke();

    // Lòng giếng tối sâu bên trong
    c.fillStyle = '#07090e';
    c.beginPath();
    c.ellipse(cTop[0], cTop[1], rx * 0.78, ry * 0.72, 0, 0, Math.PI * 2);
    c.fill();

    // Nửa nắp gỗ đậy một bên miệng giếng
    c.fillStyle = '#4b3828';
    c.beginPath();
    c.ellipse(cTop[0], cTop[1], rx * 0.80, ry * 0.74, 0, Math.PI * 0.92, Math.PI * 2.02);
    c.closePath();
    c.fill();
    c.strokeStyle = '#2a1f16';
    c.lineWidth = 1.4;
    c.stroke();

    // Giá gỗ & bánh xe ròng rọc bên trên giếng (có viền sáng nhẹ để nổi trên nền trời đêm)
    const postL0 = P(cx - 0.68, wellH, zW);
    const postL1 = P(cx - 0.68, wellH + 1.24, zW);
    const postR0 = P(cx + 0.68, wellH, zW);
    const postR1 = P(cx + 0.68, wellH + 1.24, zW);
    const beamL = P(cx - 0.84, wellH + 1.24, zW);
    const beamR = P(cx + 0.84, wellH + 1.24, zW);
    c.lineCap = 'round';
    c.strokeStyle = '#3a2d24';
    c.lineWidth = 7.0;
    c.beginPath();
    c.moveTo(postL0[0], postL0[1]);
    c.lineTo(postL1[0], postL1[1]);
    c.moveTo(postR0[0], postR0[1]);
    c.lineTo(postR1[0], postR1[1]);
    c.moveTo(beamL[0], beamL[1]);
    c.lineTo(beamR[0], beamR[1]);
    c.stroke();
    // Viền sáng cạnh phải cột & đỉnh xà ngang
    c.strokeStyle = 'rgba(240,206,154,0.34)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(postR0[0] + 2, postR0[1]);
    c.lineTo(postR1[0] + 2, postR1[1]);
    c.moveTo(beamL[0], beamL[1] - 3);
    c.lineTo(beamR[0], beamR[1] - 3);
    c.stroke();

    const pulPt = P(cx, wellH + 1.04, zW);
    c.strokeStyle = '#586478';
    c.lineWidth = 3.2;
    c.beginPath();
    c.arc(pulPt[0], pulPt[1], 14, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(pulPt[0], pulPt[1] - 14);
    c.lineTo(pulPt[0], pulPt[1] - 23);
    c.moveTo(pulPt[0] - 10, pulPt[1] - 10);
    c.lineTo(pulPt[0] + 10, pulPt[1] + 10);
    c.moveTo(pulPt[0] + 10, pulPt[1] - 10);
    c.lineTo(pulPt[0] - 10, pulPt[1] + 10);
    c.stroke();

    // Dây gầu buông xuống miệng giếng
    c.strokeStyle = '#756854';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(pulPt[0] - 9, pulPt[1]);
    c.lineTo(pulPt[0] - 8, cTop[1] + 2);
    c.moveTo(pulPt[0] + 9, pulPt[1]);
    c.lineTo(pulPt[0] + 18, cTop[1] - 12);
    c.stroke();
  }

  // Cổng chào khung sắt to, rõ, tách độc lập ở đầu ngõ (tấm biển dài ĐỂ TRỐNG, không chữ)
  function drawLnWelcomeGateSlice(c, P, z0, z1, lampsOut) {
    const zGate = z0 + 0.16; // 5.56: ngay sát mặt trước lát để lướt to rõ qua trên đầu
    const pL = -2.62;
    const pR = 2.62;
    const pilW = 0.38;
    const botBeamY = 3.10;
    const topBeamY = 4.22;

    // Nền sân đầu ngõ phẳng bằng (y = 0) nối từ cuối hồ vào đầu ngõ (không dựng gờ chắn đường)
    poly(c, [P(-4.6, 0, z0), P(-0.42, 0, z0), P(-0.42, 0, zGate + 0.4), P(-4.6, 0, zGate + 0.4)], '#181e29');
    poly(c, [P(-0.42, 0, zGate - 0.12), P(4.8, 0, zGate - 0.12), P(4.8, 0, zGate + 0.6), P(-0.42, 0, zGate + 0.6)], '#191f2c');

    // Hai trụ khung sắt hàn ô lưới to, rõ hai bên lối vào ngõ
    for (const side of [-1, 1]) {
      const xIn = side < 0 ? pL : pR;
      const xOut = side < 0 ? pL - pilW : pR + pilW;
      const xA = Math.min(xIn, xOut);
      const xB = Math.max(xIn, xOut);

      // Chân trụ bê tông sơn xám nhẹ
      poly(c, [P(xA - 0.06, 0, zGate), P(xB + 0.06, 0, zGate), P(xB + 0.06, 0.46, zGate), P(xA - 0.06, 0.46, zGate)], '#2c3546');
      poly(c, [P(xA - 0.07, 0.46, zGate), P(xB + 0.07, 0.46, zGate), P(xB + 0.07, 0.52, zGate), P(xA - 0.07, 0.52, zGate)], '#3c485e');

      // Khung viền ngoài trụ thép
      c.strokeStyle = '#3c495e';
      c.lineWidth = 4.8;
      for (const px of [xA, xB]) {
        const a = P(px, 0.46, zGate);
        const b = P(px, topBeamY, zGate);
        c.beginPath();
        c.moveTo(a[0], a[1]);
        c.lineTo(b[0], b[1]);
        c.stroke();
      }
      // Viền sáng thép phía hướng vào lòng ngõ (bắt ánh đèn cổng)
      const innerX = side < 0 ? xB : xA;
      const ia = P(innerX, 0.46, zGate);
      const ib = P(innerX, topBeamY, zGate);
      c.strokeStyle = 'rgba(255,214,152,0.42)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(ia[0], ia[1]);
      c.lineTo(ib[0], ib[1]);
      c.stroke();

      // Ô lưới chéo hàn bên trong trụ sắt
      c.strokeStyle = '#2d3748';
      c.lineWidth = 2.2;
      const nCells = 10;
      for (let k = 0; k < nCells; k++) {
        const yA = lerp(0.50, topBeamY, k / nCells);
        const yB = lerp(0.50, topBeamY, (k + 1) / nCells);
        const p00 = P(xA, yA, zGate);
        const p10 = P(xB, yA, zGate);
        const p01 = P(xA, yB, zGate);
        const p11 = P(xB, yB, zGate);
        c.beginPath();
        c.moveTo(p00[0], p00[1]);
        c.lineTo(p10[0], p10[1]);
        c.moveTo(p00[0], p00[1]);
        c.lineTo(p11[0], p11[1]);
        c.moveTo(p10[0], p10[1]);
        c.lineTo(p01[0], p01[1]);
        c.stroke();
      }
    }

    // Dầm khung sắt ngang to, rõ bắc ngang qua trên đầu
    const spanX0 = pL - pilW;
    const spanX1 = pR + pilW;
    c.strokeStyle = '#404e66';
    c.lineWidth = 5.2;
    for (const ry of [botBeamY, topBeamY]) {
      const a = P(spanX0, ry, zGate);
      const b = P(spanX1, ry, zGate);
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
      c.stroke();
    }
    // Nét sáng mảnh trên thanh giằng dưới & trên để rõ khối sắt trong đêm
    c.strokeStyle = 'rgba(255,216,158,0.34)';
    c.lineWidth = 1.4;
    const botA = P(spanX0, botBeamY, zGate);
    const botB = P(spanX1, botBeamY, zGate);
    c.beginPath();
    c.moveTo(botA[0], botA[1] + 2);
    c.lineTo(botB[0], botB[1] + 2);
    c.stroke();

    const nSpan = 18;
    c.strokeStyle = '#2d384a';
    c.lineWidth = 2.4;
    for (let i = 0; i < nSpan; i++) {
      const xa = lerp(spanX0, spanX1, i / nSpan);
      const xb = lerp(spanX0, spanX1, (i + 1) / nSpan);
      const p00 = P(xa, botBeamY, zGate);
      const p10 = P(xb, botBeamY, zGate);
      const p01 = P(xa, topBeamY, zGate);
      const p11 = P(xb, topBeamY, zGate);
      c.beginPath();
      c.moveTo(p00[0], p00[1]);
      c.lineTo(p01[0], p01[1]);
      c.moveTo(p00[0], p00[1]);
      c.lineTo(p11[0], p11[1]);
      c.moveTo(p10[0], p10[1]);
      c.lineTo(p01[0], p01[1]);
      c.stroke();
    }

    // Tấm biển dài gắn giữa giàn sắt cổng chào — ĐỂ TRỐNG HOÀN TOÀN (không chữ, không ký hiệu)
    const sgn0 = P(-1.82, botBeamY + 0.14, zGate);
    const sgn1 = P(1.82, topBeamY - 0.14, zGate);
    const sx = Math.min(sgn0[0], sgn1[0]);
    const sy = Math.min(sgn0[1], sgn1[1]);
    const sw = Math.abs(sgn1[0] - sgn0[0]);
    const sh = Math.abs(sgn1[1] - sgn0[1]);
    c.fillStyle = '#242e3e';
    c.fillRect(sx - 4, sy - 4, sw + 8, sh + 8);
    const sGr = c.createLinearGradient(sx, sy, sx, sy + sh);
    sGr.addColorStop(0, '#3a465a');
    sGr.addColorStop(0.55, '#303b4d');
    sGr.addColorStop(1, '#262f3e');
    c.fillStyle = sGr;
    c.fillRect(sx, sy, sw, sh);
    c.strokeStyle = 'rgba(205,222,248,0.34)';
    c.lineWidth = 1.8;
    c.strokeRect(sx + 2, sy + 2, sw - 4, sh - 4);

    // Đèn đường vàng gắn ở hai góc trên cổng chào (chiếu sáng cổng, giếng & mép hồ)
    const lampPt = P(pL + 0.24, 2.98, zGate - 0.1);
    lampsOut.push({ bx: lampPt[0], by: lampPt[1], sc: 1.05, ph: 0.5 });
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.40;
    c.drawImage(SP_A.warm, lampPt[0] - 200, lampPt[1] - 135, 400, 340);
    c.restore();
    const mountPt = P(pL - 0.02, 3.10, zGate);
    c.strokeStyle = '#262f3e';
    c.lineWidth = 3.4;
    c.beginPath();
    c.moveTo(mountPt[0], mountPt[1]);
    c.lineTo(lampPt[0], lampPt[1] - 3);
    c.stroke();
    c.fillStyle = '#ffd991';
    c.beginPath();
    c.ellipse(lampPt[0], lampPt[1] + 2, 8, 4.8, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Dãy nhà ống 3-5 tầng hai bên ngõ rộng (sáng hơn một chút để rõ hình khối, vẫn là đêm)
  function drawLnHouseRun(c, P, side, z0, z1, heights, cols, withShutters, withWarmUp) {
    const xFace = side * 2.86;
    const xCurb = side * 2.45;
    const n = heights.length;
    const zMid = lerp(z0, z1, 0.52);

    // Vỉa hè & bó vỉa đồng bộ màu vỉa hè liên tục để không hở khớp giữa các khoang
    poly(c, [P(xCurb, 0.08, z0), P(xFace + side * 0.25, 0.08, z0), P(xFace + side * 0.25, 0.08, z1), P(xCurb, 0.08, z1)], '#202838');
    poly(c, [P(xCurb, 0, z0), P(xCurb, 0.08, z0), P(xCurb, 0.08, z1), P(xCurb, 0, z1)], '#2e384b');

    // Má hồi che mép ngoài đầu khoang ở z0 (chống hở nền trời/vỉa hè khi qua gần)
    poly(c, [P(xFace, -0.38, z0), P(xFace + side * 4.4, -0.38, z0), P(xFace + side * 4.4, heights[0], z0), P(xFace, heights[0], z0)], '#1a212f');

    for (let i = 0; i < n; i++) {
      const za = i === 0 ? z0 : zMid;
      const zb = i === n - 1 ? z1 : zMid;
      const h = heights[i];
      const wallCol = cols[i % cols.length];

      // Mặt tiền nhà ống
      poly(c, [P(xFace, 0, za), P(xFace, 0, zb), P(xFace, h, zb), P(xFace, h, za)], wallCol);
      // Khe phân tách ranh giới hai nhà sát vách
      const sBot = P(xFace, 0, zb);
      const sTop = P(xFace, h, zb);
      c.strokeStyle = '#0c1018';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(sBot[0], sBot[1]);
      c.lineTo(sTop[0], sTop[1]);
      c.stroke();

      // Đỉnh mái nhà ống có gờ sáng mảnh bắt ánh trăng
      const rA = P(xFace, h, za);
      const rB = P(xFace, h, zb);
      c.strokeStyle = 'rgba(170,192,226,0.22)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(rA[0], rA[1]);
      c.lineTo(rB[0], rB[1]);
      c.stroke();

      // Ban công các tầng trên & vài ô cửa sổ
      const nFloors = Math.round(h / 2.15);
      for (let fl = 1; fl < nFloors; fl++) {
        const fy = 2.55 + (fl - 1) * 1.95;
        if (fy + 1.4 > h) break;

        // Sàn ban công đua nhẹ ra ngõ (phân biệt rõ mặt dưới tối & mặt trước sáng hơn)
        const bA = P(xFace - side * 0.24, fy, za + 0.12);
        const bB = P(xFace - side * 0.24, fy, zb - 0.12);
        const bC = P(xFace - side * 0.24, fy + 0.16, zb - 0.12);
        const bD = P(xFace - side * 0.24, fy + 0.16, za + 0.12);
        poly(c, [bA, bB, bC, bD], '#323c4e');
        poly(c, [P(xFace, fy, za + 0.12), P(xFace, fy, zb - 0.12), bB, bA], '#141a25');

        // Lan can ban công
        const rTopA = P(xFace - side * 0.24, fy + 0.72, za + 0.15);
        const rTopB = P(xFace - side * 0.24, fy + 0.72, zb - 0.15);
        c.strokeStyle = '#252f40';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(rTopA[0], rTopA[1]);
        c.lineTo(rTopB[0], rTopB[1]);
        for (let k = 0; k <= 4; k++) {
          const zBar = lerp(za + 0.15, zb - 0.15, k / 4);
          const p0 = P(xFace - side * 0.24, fy + 0.16, zBar);
          const p1 = P(xFace - side * 0.24, fy + 0.72, zBar);
          c.moveTo(p0[0], p0[1]);
          c.lineTo(p1[0], p1[1]);
        }
        c.stroke();

        // Cửa sổ tầng trên (đa số tối, đôi khi 1 ô hắt ánh vàng ấm đời thường)
        const wZ0 = lerp(za, zb, 0.26);
        const wZ1 = lerp(za, zb, 0.74);
        const isWarmLit = withWarmUp && i === 0 && fl === 1;
        const winCol = isWarmLit ? '#eab86b' : '#0b1019';
        poly(c, [P(xFace - side * 0.02, fy + 0.36, wZ0), P(xFace - side * 0.02, fy + 0.36, wZ1), P(xFace - side * 0.02, fy + 1.38, wZ1), P(xFace - side * 0.02, fy + 1.38, wZ0)], winCol);
        if (isWarmLit) {
          const glowPt = P(xFace - side * 0.16, fy + 0.85, (wZ0 + wZ1) * 0.5);
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = 0.28;
          c.drawImage(SP_A.warm, glowPt[0] - 66, glowPt[1] - 48, 132, 108);
          c.restore();
        }
      }

      // Tầng trệt: cửa cuốn hàng quán đã đóng (nan ngang kín + hộp biển trống KHÔNG CHỮ)
      const gz0 = za + 0.24;
      const gz1 = zb - 0.24;
      if (withShutters && (i + (side > 0 ? 1 : 0)) % 2 === 0) {
        poly(c, [P(xFace - side * 0.02, 0.08, gz0), P(xFace - side * 0.02, 0.08, gz1), P(xFace - side * 0.02, 2.08, gz1), P(xFace - side * 0.02, 2.08, gz0)], '#2e3748');
        c.strokeStyle = '#1b222e';
        c.lineWidth = 1.4;
        for (let slY = 0.22; slY < 2.04; slY += 0.16) {
          const sa = P(xFace - side * 0.03, slY, gz0 + 0.04);
          const sb = P(xFace - side * 0.03, slY, gz1 - 0.04);
          c.beginPath();
          c.moveTo(sa[0], sa[1]);
          c.lineTo(sb[0], sb[1]);
          c.stroke();
        }
        // Hộp biển quán trống trơn phía trên cửa cuốn (TUYỆT ĐỐI KHÔNG CHỮ)
        poly(c, [P(xFace - side * 0.06, 2.12, gz0), P(xFace - side * 0.06, 2.12, gz1), P(xFace - side * 0.06, 2.48, gz1), P(xFace - side * 0.06, 2.48, gz0)], '#384254');
      } else {
        // Cửa sắt / cửa kính đóng sạch sẽ
        poly(c, [P(xFace - side * 0.02, 0.08, gz0), P(xFace - side * 0.02, 0.08, gz1), P(xFace - side * 0.02, 2.14, gz1), P(xFace - side * 0.02, 2.14, gz0)], '#171e2a');
        c.strokeStyle = '#323d50';
        c.lineWidth = 1.8;
        for (let b = 1; b <= 3; b++) {
          const bz = lerp(gz0, gz1, b / 4);
          const p0 = P(xFace - side * 0.03, 0.08, bz);
          const p1 = P(xFace - side * 0.03, 2.14, bz);
          c.beginPath();
          c.moveTo(p0[0], p0[1]);
          c.lineTo(p1[0], p1[1]);
          c.stroke();
        }
      }
    }
  }

  // Ô dù quán gập lại bên lề trước cửa cuốn đã đóng
  function drawLnFoldedUmbrella(c, P, side, zPos, fabricCol) {
    const xU = side * 2.54;
    const pFoot = P(xU, 0.08, zPos);
    const pTop = P(xU, 2.28, zPos);
    const pMid = P(xU, 1.50, zPos);
    const pSkirtL = P(xU - 0.14, 0.78, zPos - 0.08);
    const pSkirtR = P(xU + 0.14, 0.78, zPos + 0.08);

    // Chân đế dù
    poly(c, [P(xU - 0.16, 0.08, zPos), P(xU + 0.16, 0.08, zPos), P(xU + 0.14, 0.18, zPos), P(xU - 0.14, 0.18, zPos)], '#2b3342');
    // Cán dù kim loại
    c.strokeStyle = '#404a5c';
    c.lineWidth = 3.0;
    c.beginPath();
    c.moveTo(pFoot[0], pFoot[1]);
    c.lineTo(pTop[0], pTop[1] - 4);
    c.stroke();
    // Vải dù gập rũ thành chóp
    poly(c, [pTop, pSkirtR, pSkirtL], fabricCol);
    c.strokeStyle = 'rgba(0,0,0,0.42)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(pTop[0], pTop[1]);
    c.lineTo((pSkirtL[0] + pSkirtR[0]) * 0.5, (pSkirtL[1] + pSkirtR[1]) * 0.5);
    c.moveTo(pMid[0] - 8, pMid[1]);
    c.lineTo(pMid[0] + 8, pMid[1]);
    c.stroke();
  }

  // Xe máy dựng trên vỉa hè sát lề (z gần LN_SLICE_Z0 để không bị trôi lệch so với đường)
  function drawLnMotorbike(c, P, side, zPos, bodyCol) {
    const xB = side * 2.54;
    const zF = zPos + 0.44;
    const zR = zPos - 0.44;

    const wR = P(xB, 0.26, zR);
    const wF = P(xB - side * 0.08, 0.26, zF);
    const rPx = Math.max(8, Math.abs(wR[0] - wF[0]) * 0.24 + 13);

    // Bóng dưới bánh xe trên vỉa hè
    const gR = P(xB, 0.08, zR);
    const gF = P(xB - side * 0.08, 0.08, zF);
    c.strokeStyle = 'rgba(5,7,11,0.68)';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(gR[0], gR[1]);
    c.lineTo(gF[0], gF[1]);
    c.stroke();

    // Bánh sau & bánh trước
    c.strokeStyle = '#0d1017';
    c.lineWidth = 5.5;
    c.beginPath();
    c.arc(wR[0], wR[1], rPx * 0.56, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(wF[0], wF[1], rPx * 0.56, 0, Math.PI * 2);
    c.stroke();

    // Thân xe & yên
    const sA = P(xB, 0.70, zR - 0.04);
    const sB = P(xB - side * 0.02, 0.68, zPos + 0.10);
    const hStem = P(xB - side * 0.06, 0.98, zPos + 0.26);
    const fMud = P(xB - side * 0.08, 0.54, zF);
    poly(c, [wR, sA, sB, hStem, fMud, P(xB, 0.34, zPos)], bodyCol);
    poly(c, [P(xB, 0.70, zR - 0.06), P(xB, 0.77, zR + 0.05), P(xB - side * 0.02, 0.74, zPos + 0.14), sB], '#1b202a');

    // Tay lái & gương nhỏ
    const gL = P(xB - 0.24, 1.00, zPos + 0.26);
    const gR2 = P(xB + 0.18, 1.00, zPos + 0.26);
    c.strokeStyle = '#384354';
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(gL[0], gL[1]);
    c.lineTo(hStem[0], hStem[1]);
    c.lineTo(gR2[0], gR2[1]);
    c.stroke();
    c.fillStyle = '#3d495b';
    c.beginPath();
    c.arc(gL[0] - 2, gL[1] - 8, 3.2, 0, Math.PI * 2);
    c.arc(gR2[0] + 2, gR2[1] - 8, 3.2, 0, Math.PI * 2);
    c.fill();

    // Đèn hậu đỏ sẫm tắt + tấm biển trống
    const tail = P(xB, 0.70, zR - 0.05);
    c.fillStyle = '#7c282b';
    c.fillRect(tail[0] - 4, tail[1] - 2, 8, 4);
    c.fillStyle = '#3c4554';
    c.fillRect(tail[0] - 5, tail[1] + 5, 10, 6);
  }

  // Một chiếc ô tô nhỏ đỗ sát lề phải trong ngõ (góc nhìn 3/4 sau, KHÔNG số biển)
  function drawLnParkedCar(c, P, zRear) {
    const xIn = 0.78;
    const xOut = 2.24;
    const zFront = zRear + 2.60;
    const hBody = 0.84;
    const hRoof = 1.44;

    // Bóng gầm dưới xe
    poly(c, [P(xIn - 0.08, 0.01, zRear - 0.1), P(xOut + 0.06, 0.01, zRear - 0.1), P(xOut + 0.06, 0.01, zFront), P(xIn - 0.08, 0.01, zFront)], '#080b10');

    // Thân hông trái nhìn thấy từ góc 3/4
    poly(c, [P(xIn, 0.18, zRear), P(xIn, 0.18, zFront), P(xIn, hBody, zFront), P(xIn, hBody, zRear)], '#273242');
    poly(c, [P(xIn, hBody, zRear + 0.15), P(xIn, hBody, zFront - 0.25), P(xIn + 0.16, hRoof, zFront - 0.68), P(xIn + 0.16, hRoof, zRear + 0.55)], '#2e3a4c');
    // Kính hông tối
    poly(c, [P(xIn + 0.03, hBody + 0.06, zRear + 0.38), P(xIn + 0.03, hBody + 0.06, zFront - 0.48), P(xIn + 0.15, hRoof - 0.08, zFront - 0.76), P(xIn + 0.15, hRoof - 0.08, zRear + 0.60)], '#0f1622');

    // Bánh xe hông trái
    for (const wz of [zRear + 0.50, zFront - 0.52]) {
      const wp = P(xIn - 0.02, 0.25, wz);
      const wSc = 6.0 / wz;
      c.fillStyle = '#090c12';
      c.beginPath();
      c.ellipse(wp[0], wp[1], 9 * wSc, 18 * wSc, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#384356';
      c.beginPath();
      c.ellipse(wp[0], wp[1], 4.2 * wSc, 8.5 * wSc, 0, 0, Math.PI * 2);
      c.fill();
    }

    // Nóc xe bắt ánh đèn đường nhẹ
    poly(c, [P(xIn + 0.16, hRoof, zRear + 0.55), P(xOut - 0.16, hRoof, zRear + 0.55), P(xOut - 0.16, hRoof, zFront - 0.68), P(xIn + 0.16, hRoof, zFront - 0.68)], '#36445a');

    // Đuôi xe nhỏ (cốp sau, kính hậu & cản sau)
    poly(c, [P(xIn, 0.20, zRear), P(xOut, 0.20, zRear), P(xOut, hBody, zRear), P(xIn, hBody, zRear)], '#2d394b');
    poly(c, [P(xIn, hBody, zRear), P(xOut, hBody, zRear), P(xOut - 0.16, hRoof, zRear + 0.55), P(xIn + 0.16, hRoof, zRear + 0.55)], '#283344');
    // Kính sau xe
    poly(c, [P(xIn + 0.12, hBody + 0.06, zRear + 0.05), P(xOut - 0.12, hBody + 0.06, zRear + 0.05), P(xOut - 0.22, hRoof - 0.07, zRear + 0.48), P(xIn + 0.22, hRoof - 0.07, zRear + 0.48)], '#0f1622');

    // Cụm đèn hậu đỗ xe tắt nhẹ & khung biển số TRỐNG HOÀN TOÀN (KHÔNG số/chữ)
    poly(c, [P(xIn + 0.06, 0.56, zRear), P(xIn + 0.30, 0.56, zRear), P(xIn + 0.30, 0.70, zRear), P(xIn + 0.06, 0.70, zRear)], '#7a282c');
    poly(c, [P(xOut - 0.30, 0.56, zRear), P(xOut - 0.06, 0.56, zRear), P(xOut - 0.06, 0.70, zRear), P(xOut - 0.30, 0.70, zRear)], '#7a282c');
    poly(c, [P(xIn + 0.52, 0.42, zRear), P(xOut - 0.52, 0.42, zRear), P(xOut - 0.52, 0.54, zRear), P(xIn + 0.52, 0.54, zRear)], '#3c4658');
    // Gương chiếu hậu bên trái
    poly(c, [P(xIn - 0.12, 0.88, zFront - 0.78), P(xIn, 0.88, zFront - 0.78), P(xIn, 0.96, zFront - 0.78), P(xIn - 0.12, 0.96, zFront - 0.78)], '#303b4e');
  }

  // Cây to tán rộng phủ trên đầu qua ngõ: vòm lá tối tự nhiên có ánh đèn vàng xuyên qua
  function drawLnOverheadTree(c, P, side, zTrunk, lampSide) {
    const xBase = side * 2.58;
    const pBase = P(xBase, 0.09, zTrunk);
    const pFork = P(side * 2.18, 3.05, zTrunk);
    const pReach = P(-side * 1.15, 4.75, zTrunk + 0.3);
    const pOut = P(side * 1.45, 5.20, zTrunk - 0.15);
    const pMidBranch = P(side * 0.45, 4.35, zTrunk + 0.2);

    // Bồn gạch & gốc cây mọc vững từ trên vỉa hè
    poly(c, [P(xBase - 0.20, 0.09, zTrunk - 0.28), P(xBase + 0.20, 0.09, zTrunk - 0.28), P(xBase + 0.20, 0.09, zTrunk + 0.28), P(xBase - 0.20, 0.09, zTrunk + 0.28)], '#11161f');
    poly(c, [P(xBase - 0.16, 0.14, zTrunk - 0.22), P(xBase + 0.16, 0.14, zTrunk - 0.22), P(xBase + 0.16, 0.09, zTrunk - 0.22), P(xBase - 0.16, 0.09, zTrunk - 0.22)], '#384355');

    // Thân cây & cành to vươn qua ngõ (có cạnh hướng đèn bắt sáng ấm nhẹ)
    c.strokeStyle = '#1b1613';
    c.lineCap = 'round';
    c.lineWidth = 22;
    c.beginPath();
    c.moveTo(pBase[0], pBase[1]);
    c.lineTo(pFork[0], pFork[1]);
    c.stroke();

    c.strokeStyle = 'rgba(130,98,66,0.28)';
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(pBase[0] - side * 7, pBase[1]);
    c.lineTo(pFork[0] - side * 6, pFork[1]);
    c.stroke();

    c.strokeStyle = '#191512';
    c.lineWidth = 11;
    c.beginPath();
    c.moveTo(pFork[0], pFork[1]);
    c.lineTo(pReach[0], pReach[1]);
    c.moveTo(pFork[0], pFork[1]);
    c.lineTo(pOut[0], pOut[1]);
    c.moveTo(pFork[0], pFork[1]);
    c.lineTo(pMidBranch[0], pMidBranch[1]);
    c.stroke();

    // Tán lá lớn nhiều tầng hữu cơ phủ ngang trên đầu, rìa lá tơi tự nhiên có kẽ hở xuyên ánh đèn vàng
    const canP = P(-side * 0.18, 4.72, zTrunk);
    const cx = canP[0] + side * 24;
    const cy = canP[1];

    // Lớp tán sâu phía sau tối hơn
    c.fillStyle = '#0c1514';
    for (let i = 0; i < 24; i++) {
      const ang = lrnd() * Math.PI * 2;
      const distX = (lrnd() - 0.5) * 440;
      const distY = (lrnd() - 0.5) * 145 - 12;
      const rad = 24 + lrnd() * 38;
      c.beginPath();
      c.ellipse(cx + distX + Math.cos(ang) * 8, cy + distY, rad * 1.25, rad * 0.72, (lrnd() - 0.5) * 0.7, 0, Math.PI * 2);
      c.fill();
    }

    // Các chùm lá nhỏ rìa ngoài phá đường tròn để dáng tán cây tự nhiên
    c.fillStyle = '#0b1615';
    for (let i = 0; i < 24; i++) {
      const distX = (lrnd() - 0.5) * 470;
      const distY = -36 - lrnd() * 58;
      const rw = 10 + lrnd() * 18;
      const rh = 7 + lrnd() * 12;
      c.beginPath();
      c.ellipse(cx + distX, cy + distY, rw, rh, (lrnd() - 0.5) * 1.1, 0, Math.PI * 2);
      c.fill();
    }

    // Ánh đèn đường vàng lọt xuyên qua tán lá từ bên cột đèn
    const lGlowP = P(lampSide * 1.35, 3.85, zTrunk);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.42;
    c.drawImage(SP_A.warm, lGlowP[0] - 190, lGlowP[1] - 125, 380, 250);
    c.globalAlpha = 0.24;
    c.drawImage(SP_A.glow, cx - 135, cy - 85, 270, 175);
    c.restore();

    // Lớp tán lá trung gian & tán dưới lốm đốm lá bắt ánh đèn vàng xuyên qua
    for (let i = 0; i < 30; i++) {
      const distX = (lrnd() - 0.5) * 400;
      const distY = (lrnd() - 0.5) * 124;
      const rad = 16 + lrnd() * 28;
      const nearLight = Math.hypot((cx + distX) - lGlowP[0], (cy + distY) - lGlowP[1]) < 210;
      if (nearLight && distY > -18) {
        c.fillStyle = lrnd() > 0.45 ? 'rgba(68,66,34,0.72)' : 'rgba(42,50,32,0.76)';
      } else {
        c.fillStyle = lrnd() > 0.5 ? '#12201b' : '#162720';
      }
      c.beginPath();
      c.ellipse(cx + distX, cy + distY, rad * 1.25, rad * 0.72, (lrnd() - 0.5) * 0.8, 0, Math.PI * 2);
      c.fill();
    }

    // Những cụm lá rìa dưới nhận ánh vàng lọt qua vòm lá
    c.fillStyle = 'rgba(138,108,54,0.34)';
    for (let i = 0; i < 12; i++) {
      const distX = (lrnd() - 0.5) * 310 + lampSide * 38;
      const distY = 12 + lrnd() * 48;
      const rad = 11 + lrnd() * 18;
      c.beginPath();
      c.ellipse(cx + distX, cy + distY, rad * 1.25, rad * 0.65, 0, 0, Math.PI * 2);
      c.fill();
    }
  }

  // Dây cờ nhỏ hình tam giác đỏ giăng ngang qua ngõ
  function drawLnRedFlagString(c, P, zStr) {
    const pA = P(-2.82, 3.88, zStr);
    const pB = P(2.82, 3.92, zStr + 0.15);
    const sag = 36 * clamp(5.8 / zStr, 0.55, 1.15);
    const cX = (pA[0] + pB[0]) * 0.5;
    const cY = (pA[1] + pB[1]) * 0.5 + sag;

    c.strokeStyle = 'rgba(14,17,24,0.92)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(pA[0], pA[1]);
    c.quadraticCurveTo(cX, cY, pB[0], pB[1]);
    c.stroke();

    const nFlags = 10;
    const flagH = Math.max(9, 23 * clamp(5.8 / zStr, 0.5, 1.1));
    const flagW = flagH * 0.72;
    for (let i = 1; i <= nFlags; i++) {
      const u = i / (nFlags + 1);
      const omt = 1 - u;
      const fx = omt * omt * pA[0] + 2 * omt * u * cX + u * u * pB[0];
      const fy = omt * omt * pA[1] + 2 * omt * u * cY + u * u * pB[1];
      c.fillStyle = i % 3 === 0 ? '#b6352d' : i % 3 === 1 ? '#942822' : '#a43028';
      c.beginPath();
      c.moveTo(fx - flagW * 0.5, fy);
      c.lineTo(fx + flagW * 0.5, fy);
      c.lineTo(fx + (i % 2 === 0 ? 1.5 : -1.5), fy + flagH);
      c.closePath();
      c.fill();
    }
  }

  // Các bó dây điện võng nặng chằng chịt lướt qua phía trên & cuộn cáp tường
  function drawLnTangledWires(c, P, z0, z1) {
    // 1. Bó cáp dọc dày hai bên tường & cuộn cáp viễn thông tròn to
    for (const side of [-1, 1]) {
      const xb = side * 2.54;
      // Bó cáp dày chính dọc tường (gồm 4 sợi sát nhau)
      for (let k = 0; k < 4; k++) {
        c.strokeStyle = k === 0 ? '#06080e' : k === 1 ? '#0c101a' : '#131926';
        c.lineWidth = k === 0 ? 4.4 : 2.2;
        const a = P(xb, 3.24 + k * 0.11, z0);
        const mid = P(xb - side * 0.08, 3.12 + k * 0.11, (z0 + z1) * 0.5);
        const b = P(xb, 3.22 + k * 0.11, z1);
        c.beginPath();
        c.moveTo(a[0], a[1]);
        c.quadraticCurveTo(mid[0], mid[1], b[0], b[1]);
        c.stroke();
      }
      // Cuộn dây viễn thông to treo tường (có viền bắt sáng nhẹ để tách khỏi tường)
      const coilPt = P(xb - side * 0.04, 3.38, z0 + 0.95);
      c.strokeStyle = '#07090f';
      c.lineWidth = 4.8;
      c.beginPath();
      c.arc(coilPt[0], coilPt[1], 17, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = 'rgba(215,195,160,0.22)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(coilPt[0], coilPt[1], 19, Math.PI * 0.1, Math.PI * 0.85);
      c.stroke();
    }

    // 2. Các BÓ dây điện võng nặng vắt ngang / chéo qua ngõ trên đầu (3 bó chính, mỗi bó 4-5 sợi)
    const bundles = [
      { zA: z0 + 0.55, zB: z0 + 0.95, yA: 3.55, yB: 3.45, sag: 64, nStrands: 5 },
      { zA: z0 + 1.45, zB: z0 + 2.40, yA: 3.82, yB: 3.52, sag: 52, nStrands: 4 },
      { zA: z0 + 2.75, zB: z0 + 2.15, yA: 3.68, yB: 3.92, sag: 46, nStrands: 4 },
    ];
    for (let bi = 0; bi < bundles.length; bi++) {
      const bd = bundles[bi];
      const pA = P(-2.68, bd.yA, bd.zA);
      const pB = P(2.68, bd.yB, bd.zB);
      const zMid = (bd.zA + bd.zB) * 0.5;
      const baseSag = bd.sag * clamp(5.8 / zMid, 0.45, 1.25);

      for (let st = 0; st < bd.nStrands; st++) {
        const strandOff = (st - (bd.nStrands - 1) * 0.5) * 7.5;
        const sagPx = baseSag + strandOff;
        const ctrlX = (pA[0] + pB[0]) * 0.5 + (st - 1.5) * 6;
        const ctrlY = (pA[1] + pB[1]) * 0.5 + sagPx;
        const startY = pA[1] + (st - 1.5) * 2.2;
        const endY = pB[1] + (st - 1.5) * 2.2;

        // Thân bó cáp đậm
        c.strokeStyle = st === 0 ? 'rgba(4,6,11,0.96)' : 'rgba(9,13,20,0.92)';
        c.lineWidth = st === 0 ? 3.8 : 2.1;
        c.beginPath();
        c.moveTo(pA[0], startY);
        c.quadraticCurveTo(ctrlX, ctrlY, pB[0], endY);
        c.stroke();

        // Viền bắt ánh đèn đường vàng rất mảnh ở bụng võng sợi chính để rõ khối trên nền tối
        if (st === bd.nStrands - 1) {
          c.strokeStyle = 'rgba(235,196,142,0.20)';
          c.lineWidth = 1.0;
          c.beginPath();
          c.moveTo(pA[0], startY + 1.5);
          c.quadraticCurveTo(ctrlX, ctrlY + 1.5, pB[0], endY + 1.5);
          c.stroke();
        }
      }
    }
  }

  // Đèn đường vàng gắn tường hai bên ngõ + hắt quầng xuống mặt đường
  function drawLnStreetLamp(c, P, side, zLm, slotIdx, lampsOut) {
    const xMount = side * 2.84;
    const xBulb = side * 2.24;
    const yLm = 3.28;
    const pMount = P(xMount, yLm - 0.14, zLm);
    const pBulb = P(xBulb, yLm, zLm);
    const pFloor = P(side * 1.45, 0.02, zLm);
    const lsc = clamp(5.6 / zLm, 0.45, 1.15);
    lampsOut.push({ bx: pBulb[0], by: pBulb[1], sc: lsc, ph: slotIdx * 1.7 + 0.4 });

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.34;
    const rHalo = 215 * lsc;
    c.drawImage(SP_A.warm, pBulb[0] - rHalo, pBulb[1] - rHalo * 0.72, rHalo * 2, rHalo * 1.75);
    // Vũng sáng hắt xuống mặt đường ngõ phía dưới đèn
    c.globalAlpha = 0.22;
    c.drawImage(SP_A.warm, pFloor[0] - 180 * lsc, pFloor[1] - 42 * lsc, 360 * lsc, 96 * lsc);
    c.restore();

    c.strokeStyle = '#242b38';
    c.lineWidth = Math.max(1.8, 4.2 * lsc);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(pMount[0], pMount[1]);
    c.quadraticCurveTo((pMount[0] + pBulb[0]) * 0.5, pBulb[1] - 11 * lsc, pBulb[0], pBulb[1] - 4 * lsc);
    c.stroke();

    const hw = 15 * lsc;
    const hh = 6.5 * lsc;
    c.fillStyle = '#28303e';
    c.beginPath();
    c.ellipse(pBulb[0], pBulb[1] - hh * 0.35, hw, hh, side * -0.18, Math.PI, 0);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,222,148,0.96)';
    c.beginPath();
    c.ellipse(pBulb[0], pBulb[1] + hh * 0.2, hw * 0.46, Math.max(2.2, hh * 0.68), 0, 0, Math.PI * 2);
    c.fill();
  }

  function bakeLnSlice(slotIdx) {
    const meta = LN_SLICE_META[slotIdx];
    const sl = lnSlices[slotIdx];
    const c = sl.g;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, sl.cv.width, sl.cv.height);
    c.setTransform(SL_SCALE, 0, 0, SL_SCALE, -SL_BX * SL_SCALE, -SL_BY * SL_SCALE);
    sl.lamps.length = 0;

    const P = makeSliceProjector(meta.zPos);
    const z0 = LN_SLICE_Z0;
    const z1 = LN_SLICE_Z1;

    if (meta.kind === 'lakeWall') {
      drawLnLakeWallSlice(c, P, z0, z1, meta.endWall);
      return;
    }

    if (meta.kind === 'well') {
      drawLnVillageWell(c, P, z0, z1);
      return;
    }

    if (meta.kind === 'gate') {
      drawLnWelcomeGateSlice(c, P, z0, z1, sl.lamps);
      return;
    }

    // Các khoang ngõ xóm rộng (nhà 3-5 tầng, cửa cuốn đóng, ô dù gập, xe máy, ô tô đỗ, cây tán rộng, dây cờ đỏ, bó dây điện)
    const hL = [
      [7.4, 9.6], [9.4, 7.0], [7.2, 10.2], [8.8, 7.6], [9.6, 7.2], [8.0, 9.0], [7.8, 9.2],
    ][meta.idx];
    const hR = [
      [9.2, 7.2], [7.4, 9.8], [8.6, 7.4], [9.8, 7.0], [7.4, 9.4], [8.6, 7.2], [9.0, 7.4],
    ][meta.idx];
    const colPalL = [
      ['#242c3b', '#2b3241'], ['#29303f', '#202735'], ['#242d3a', '#2c3442'],
      ['#252c3b', '#1f2634'], ['#2a3140', '#212938'], ['#232a38', '#29303e'], ['#252d3c', '#202836'],
    ][meta.idx];
    const colPalR = [
      ['#28303f', '#212837'], ['#222a38', '#2b3241'], ['#252d3c', '#202736'],
      ['#282f3e', '#222938'], ['#202836', '#2a3240'], ['#252d3c', '#202634'], ['#27303e', '#1f2634'],
    ][meta.idx];

    drawLnHouseRun(c, P, -1, z0, z1, hL, colPalL, true, meta.idx % 2 === 0);
    drawLnHouseRun(c, P, 1, z0, z1, hR, colPalR, true, meta.idx % 2 === 1);

    if (meta.umb !== 0) {
      drawLnFoldedUmbrella(c, P, meta.umb, 5.75, meta.umb < 0 ? '#50292f' : '#284537');
    }
    if (meta.bike !== 0) {
      drawLnMotorbike(c, P, meta.bike, 5.82, meta.bike < 0 ? '#2f3a4c' : '#452c2f');
    }
    if (meta.car) {
      drawLnParkedCar(c, P, 5.65);
    }
    if (meta.tree !== 0) {
      drawLnOverheadTree(c, P, meta.tree, 5.75, meta.lampSide);
    }
    if (meta.flags > 0) {
      drawLnRedFlagString(c, P, meta.flags);
    }
    drawLnTangledWires(c, P, z0, z1);
    drawLnStreetLamp(c, P, meta.lampSide, 6.05, meta.idx + 1, sl.lamps);
  }

  function bakeLuotNgo() {
    if (!cv.width || !cv.height) return;
    buildSprites();
    lnSeed = 2027;

    lnBgC.width = cv.width;
    lnBgC.height = cv.height;
    bakeLnBackground(lnBgG);
    bakeLnWaterGradient();

    lnDestC.width = Math.round(DEST_BW * DEST_SCALE);
    lnDestC.height = Math.round(DEST_BH * DEST_SCALE);
    lnDestG.setTransform(1, 0, 0, 1, 0, 0);
    lnDestG.clearRect(0, 0, lnDestC.width, lnDestC.height);
    lnDestG.setTransform(DEST_SCALE, 0, 0, DEST_SCALE, -DEST_BX * DEST_SCALE, -DEST_BY * DEST_SCALE);
    bakeLnDestination(lnDestG);

    const slW = Math.round(SL_BW * SL_SCALE);
    const slH = Math.round(SL_BH * SL_SCALE);
    for (let i = 0; i < lnSlices.length; i++) {
      lnSlices[i].cv.width = slW;
      lnSlices[i].cv.height = slH;
      bakeLnSlice(i);
    }

    // Lớp viền tối dịu (giữ sạch góc trên-trái x<200, y<240 & dải y 680..780 nhưng không làm đen giếng/ngõ)
    lnVigC.width = Math.max(2, cv.width >> 1);
    lnVigC.height = Math.max(2, cv.height >> 1);
    const vg = lnVigG;
    vg.setTransform(1, 0, 0, 1, 0, 0);
    vg.clearRect(0, 0, lnVigC.width, lnVigC.height);
    vg.setTransform(0.5 * S * dpr, 0, 0, 0.5 * S * dpr, 0.5 * OX * dpr, 0.5 * OY * dpr);
    const tlMask = vg.createRadialGradient(88, 96, 18, 110, 120, 240);
    tlMask.addColorStop(0, 'rgba(3,5,11,0.72)');
    tlMask.addColorStop(0.58, 'rgba(3,5,11,0.34)');
    tlMask.addColorStop(1, 'rgba(3,5,11,0)');
    vg.fillStyle = tlMask;
    vg.fillRect(-300, -300, 680, 560);

    const botMask = vg.createLinearGradient(0, 672, 0, 860);
    botMask.addColorStop(0, 'rgba(3,5,10,0)');
    botMask.addColorStop(0.32, 'rgba(3,5,10,0.34)');
    botMask.addColorStop(0.68, 'rgba(3,5,10,0.56)');
    botMask.addColorStop(1, 'rgba(3,5,10,0.82)');
    vg.fillStyle = botMask;
    vg.fillRect(-300, 672, W + 600, 480);
    vignette(vg, 0.44);

    lnBakedW = cv.width;
    lnBakedH = cv.height;
    lnBaked = true;
  }

  function ensureLuotNgoBaked() {
    if (!lnBaked || lnBakedW !== cv.width || lnBakedH !== cv.height) {
      bakeLuotNgo();
    }
  }

  // Mặt hồ đêm bên phải đoạn đầu & đường nhựa ngõ cong nhẹ (chạy mỗi khung, KHÔNG cấp phát bộ nhớ)
  function drawLnGroundAndLake(c, camZ, camX, yawPx, lumTime, baseAlpha, sDest) {
    const yawRate = yawPx / LN_F;

    // 1. Mặt hồ đêm rộng bên phải đoạn bờ hồ (z thế giới từ camZ tới sShore = 14.3)
    const sShore = 14.3;
    if (camZ < sShore - 1.50) {
      const zMin = 0.55;
      const sStart = camZ + zMin;
      const nSteps = 9;
      for (let i = 0; i <= nSteps; i++) {
        const s = lerp(sStart, sShore, i / nSteps);
        const zr = s - camZ;
        LN_WATER_X[i] = LN_VX + (LN_F * (-0.42 - camX)) / zr - yawPx;
        LN_WATER_Y[i] = LN_VY + (LN_F * LN_CAM_Y) / zr;
      }
      const yFar = LN_WATER_Y[nSteps];
      const yNear = LN_WATER_Y[0];
      const waterH = H + 300 - yFar;

      if (waterH > 2) {
        c.save();
        c.beginPath();
        c.moveTo(LN_WATER_X[0], yNear);
        for (let i = 1; i <= nSteps; i++) {
          c.lineTo(LN_WATER_X[i], LN_WATER_Y[i]);
        }
        c.lineTo(W + 300, yFar);
        c.lineTo(W + 300, H + 300);
        c.lineTo(LN_WATER_X[0], H + 300);
        c.closePath();
        c.clip();
        c.globalAlpha = baseAlpha;
        c.drawImage(lnWaterC, -300, yFar, W + 600, waterH);

        // Vệt sáng trăng & đèn cổng chào lăn tăn nhẹ trên mặt hồ
        for (let i = 0; i < LN_RIPPLES.length; i++) {
          const rp = LN_RIPPLES[i];
          const zr = rp.z - camZ;
          if (zr <= 0.65) continue;
          const rx = LN_VX + (LN_F * (rp.x - camX)) / zr - yawPx + Math.sin(lumTime * 0.9 + rp.ph) * (9 / zr);
          const ry = LN_VY + (LN_F * LN_CAM_Y) / zr;
          const rw = (LN_F * rp.w) / zr;
          const rh = Math.max(1.2, 3.2 / zr);
          const tw = 0.58 + 0.42 * Math.sin(lumTime * 1.6 + rp.ph);
          c.fillStyle = rp.tone === 'warm'
            ? `rgba(255,214,142,${(0.22 * tw).toFixed(3)})`
            : `rgba(195,216,245,${(0.16 * tw).toFixed(3)})`;
          c.fillRect(rx - rw * 0.5, ry - rh * 0.5, rw, rh);
        }
        c.restore();
      }

      // Vệt sáng dọc mặt hồ dưới ánh trăng & đèn cổng chào
      c.save();
      c.globalCompositeOperation = 'lighter';
      const shorePt = LN_VX + (LN_F * (1.2 - camX)) / Math.max(1.2, sShore - camZ) - yawPx;
      c.globalAlpha = baseAlpha * 0.16 * clamp(1 - (camZ - 4) / 10, 0.25, 1);
      c.drawImage(SP_A.cool, 980, LN_VY + 4, 420, 260);
      c.globalAlpha = baseAlpha * 0.22;
      c.drawImage(SP_A.warm, shorePt - 130, yFar - 10, 260, 150);
      c.restore();

      // Đường đá lát ven chân tường đình đến trước cổng chào
      const xPathL = -1.46;
      const xPathR = -0.42;
      c.fillStyle = '#1e2432';
      c.beginPath();
      for (let i = 0; i <= nSteps; i++) {
        const s = lerp(sStart, sShore, i / nSteps);
        const zr = s - camZ;
        const px = LN_VX + (LN_F * (xPathL - camX)) / zr - yawPx;
        const py = LN_VY + (LN_F * LN_CAM_Y) / zr;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      for (let i = nSteps; i >= 0; i--) {
        const s = lerp(sStart, sShore, i / nSteps);
        const zr = s - camZ;
        const px = LN_VX + (LN_F * (xPathR - camX)) / zr - yawPx;
        const py = LN_VY + (LN_F * LN_CAM_Y) / zr;
        c.lineTo(px, py);
      }
      c.closePath();
      c.fill();

      // Các mạch phiến đá lát chạy ngang lướt qua dưới chân
      c.strokeStyle = 'rgba(9,12,18,0.75)';
      c.lineWidth = 1.6;
      for (let sStone = 1.2; sStone < sShore; sStone += 1.15) {
        const zr = sStone - camZ;
        if (zr <= 0.65) continue;
        const py = LN_VY + (LN_F * LN_CAM_Y) / zr;
        const ax = LN_VX + (LN_F * (xPathL - camX)) / zr - yawPx;
        const bx = LN_VX + (LN_F * (xPathR - camX)) / zr - yawPx;
        c.beginPath();
        c.moveTo(ax, py);
        c.lineTo(bx, py);
        c.stroke();
      }
    }

    // 2. Mặt đường nhựa ngõ xóm rộng + hai vỉa hè liên tục (nối liền từ cổng chào tới tận chân khu nhà trọ)
    const rStart = Math.max(14.3, camZ + 0.55);
    const rEnd = 52.8;
    const yDestFloor = LN_VY + (664 - LN_VY) * sDest;

    // Sân gạch trước khu nhà trọ vẽ TRƯỚC (phía dưới) rồi mặt ngõ & vỉa hè đè êm lên để không hở rãnh/gờ ngang
    if (camZ > 34) {
      const yardAlpha = smooth01((camZ - 34) / 9);
      c.save();
      c.globalAlpha = baseAlpha * yardAlpha;
      c.fillStyle = '#151c28';
      c.fillRect(-300, yDestFloor - 2, W + 600, H + 320 - yDestFloor);
      c.restore();
    }

    if (rStart < rEnd - 0.5) {
      const rSteps = 18;
      for (let i = 0; i <= rSteps; i++) {
        const s = lerp(rStart, rEnd, i / rSteps);
        const zr = s - camZ;
        const cx = alleyCurveX(s);
        LN_ROAD_LX[i] = LN_VX + LN_F * ((cx - 2.48 - camX) / zr - yawRate);
        LN_ROAD_RX[i] = LN_VX + LN_F * ((cx + 2.48 - camX) / zr - yawRate);
        LN_ROAD_Y[i] = LN_VY + (LN_F * LN_CAM_Y) / zr;
        LN_SIDE_LX[i] = LN_VX + LN_F * ((cx - 4.80 - camX) / zr - yawRate);
        LN_SIDE_RX[i] = LN_VX + LN_F * ((cx + 4.80 - camX) / zr - yawRate);
        LN_SIDE_Y[i] = LN_VY + (LN_F * (LN_CAM_Y - 0.08)) / zr;
      }

      const sideFade = clamp(1 - (camZ - 37) / 6.5, 0, 1);
      if (sideFade > 0.01) {
        c.save();
        c.globalAlpha = baseAlpha * sideFade;
        // Hai vỉa hè dọc liên tục bên dưới dãy nhà (không bao giờ hở vực tối dưới xe/gốc cây)
        c.fillStyle = '#202838';
        c.beginPath();
        c.moveTo(LN_SIDE_LX[0], LN_SIDE_Y[0]);
        for (let i = 1; i <= rSteps; i++) c.lineTo(LN_SIDE_LX[i], LN_SIDE_Y[i]);
        for (let i = rSteps; i >= 0; i--) c.lineTo(LN_ROAD_LX[i], LN_ROAD_Y[i]);
        c.closePath();
        c.fill();

        c.beginPath();
        c.moveTo(LN_ROAD_RX[0], LN_ROAD_Y[0]);
        for (let i = 1; i <= rSteps; i++) c.lineTo(LN_ROAD_RX[i], LN_ROAD_Y[i]);
        for (let i = rSteps; i >= 0; i--) c.lineTo(LN_SIDE_RX[i], LN_SIDE_Y[i]);
        c.closePath();
        c.fill();

        // Lòng đường nhựa chính ở giữa
        c.fillStyle = '#181f2c';
        c.beginPath();
        c.moveTo(LN_ROAD_LX[0], LN_ROAD_Y[0]);
        for (let i = 1; i <= rSteps; i++) c.lineTo(LN_ROAD_LX[i], LN_ROAD_Y[i]);
        for (let i = rSteps; i >= 0; i--) c.lineTo(LN_ROAD_RX[i], LN_ROAD_Y[i]);
        c.closePath();
        c.fill();
        c.restore();
      }

      // Đường mép vỉa hè dọc hai bên đường ngõ (fade êm trước sân nhà trọ cuối ngõ)
      const curbAlpha = clamp(1 - (camZ - 32) / 8, 0, 1);
      if (curbAlpha > 0.02) {
        c.save();
        c.globalAlpha = baseAlpha * curbAlpha;
        c.strokeStyle = '#344054';
        c.lineWidth = 2.0;
        c.beginPath();
        c.moveTo(LN_ROAD_LX[0], LN_ROAD_Y[0]);
        for (let i = 1; i <= rSteps; i++) c.lineTo(LN_ROAD_LX[i], LN_ROAD_Y[i]);
        c.moveTo(LN_ROAD_RX[0], LN_ROAD_Y[0]);
        for (let i = 1; i <= rSteps; i++) c.lineTo(LN_ROAD_RX[i], LN_ROAD_Y[i]);
        c.stroke();
        c.restore();
      }
    }
  }

  function drawLuotNgo(c, now, dt, opts) {
    ensureLuotNgoBaked();

    let tRaw = clamp(Number(LN.t) || 0, 0, 1);
    if (opts && typeof opts.t === 'number') {
      tRaw = clamp(opts.t, 0, 1);
    } else {
      const prevT = tRaw;
      if (LN.auto !== false && typeof dt === 'number' && isFinite(dt) && dt > 0 && tRaw < 1) {
        tRaw = clamp(tRaw + Math.min(dt, 0.05) / LN_DUR, 0, 1);
        LN.t = tRaw;
        if (prevT < 1 && tRaw >= 1 && !lnDoneFired) {
          lnDoneFired = true;
          const cb = LN.xong;
          if (typeof cb === 'function') cb();
        }
      } else {
        LN.t = tRaw;
      }
      if (tRaw < 1) lnDoneFired = false;
    }

    // Easing chậm - nhanh - chậm (quintic smootherstep, 8 giây)
    const t2 = tRaw * tRaw;
    const k = t2 * tRaw * (tRaw * (tRaw * 6 - 15) + 10);
    const camZ = k * LN_TRAVEL;
    const camX = camLateralX(camZ);
    const theta = camHeading(camZ);
    const yawPx = LN_F * theta;
    const lumTime = now * 0.001;
    const baseAlpha = c.globalAlpha;

    // 1. Nền trời đêm, mặt trăng nhẹ & mặt đất đã bake
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(lnBgC, 0, 0, cv.width, cv.height);

    // 2. Toà nhà trọ đích cuối ngõ
    const zDestRel = LN_Z_DEST - camZ;
    const sDest = LN_Z_DEST_END / zDestRel;
    const destShift = LN_F * ((0 - camX) / zDestRel) - yawPx;
    const destVis = smooth01((camZ - 14.0) / 14.0);

    // 3. Chuyển hệ trục 1600x900 & vẽ mặt hồ bên phải + mặt ngõ cong nhẹ + vỉa hè liên tục
    setT(c);
    drawLnGroundAndLake(c, camZ, camX, yawPx, lumTime, baseAlpha, sDest);

    if (destVis > 0.01) {
      c.globalAlpha = baseAlpha * destVis * clamp(0.50 + 0.50 * sDest, 0, 1);
      c.drawImage(
        lnDestC,
        LN_VX + destShift + (DEST_BX - LN_VX) * sDest,
        LN_VY + (DEST_BY - LN_VY) * sDest,
        DEST_BW * sDest,
        DEST_BH * sDest
      );
    }

    // 4. Các lát cắt hành trình từ xa tới gần (tường đình, giếng làng, cổng chào, nhà 3-5 tầng, cây, dây cờ, bó dây điện, xe cộ)
    lnLiveLampCount = 0;
    for (let i = LN_SLICE_META.length - 1; i >= 0; i--) {
      const meta = LN_SLICE_META[i];
      const zRel = meta.zPos - camZ;
      const minZ = meta.kind === 'alley' ? 0.72 : 0.62;
      const fadeW = meta.kind === 'alley' ? 0.72 : 0.68;
      if (zRel <= minZ || zRel > 36.0) continue;

      const sc = LN_SLICE_Z0 / zRel;
      const nearFade = clamp((zRel - minZ) / fadeW, 0, 1);
      const farFade = clamp((36.0 - zRel) / 4.5, 0, 1);
      const alpha = nearFade * farFade;
      if (alpha <= 0.01) continue;

      const sliceX = alleyCurveX(meta.zPos);
      const shiftX = (LN_F * (sliceX - camX)) / zRel - yawPx;
      const sl = lnSlices[i];

      c.globalAlpha = baseAlpha * alpha;
      c.drawImage(
        sl.cv,
        LN_VX + shiftX + (SL_BX - LN_VX) * sc,
        LN_VY + (SL_BY - LN_VY) * sc,
        SL_BW * sc,
        SL_BH * sc
      );

      for (let j = 0; j < sl.lamps.length; j++) {
        if (lnLiveLampCount >= LN_LIVE_LAMPS.length) break;
        const lm = sl.lamps[j];
        const sx = LN_VX + shiftX + (lm.bx - LN_VX) * sc;
        const sy = LN_VY + (lm.by - LN_VY) * sc;
        if (sx > -140 && sx < W + 140 && sy > -90 && sy < H + 90) {
          const out = LN_LIVE_LAMPS[lnLiveLampCount++];
          out.sx = sx;
          out.sy = sy;
          out.sc = sc * lm.sc;
          out.alpha = alpha;
          out.ph = lm.ph;
        }
      }
    }

    // 5. Viền tối dịu + sạch góc trên-trái (x<200, y<240) + dải y 680..780
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = baseAlpha;
    c.drawImage(lnVigC, 0, 0, cv.width, cv.height);

    // 6. Ánh sáng động nhẹ ('lighter'): đèn đường vàng lướt qua & ô cửa sổ tầng 5 trắng xanh cuối ngõ
    setT(c);
    c.save();
    c.globalCompositeOperation = 'lighter';

    if (destVis > 0.01) {
      const coolPulse = 0.92 + 0.08 * Math.sin(lumTime * 1.4);
      const wx = LN_VX + destShift + (lnWinPos.cx - LN_VX) * sDest;
      const wy = LN_VY + (lnWinPos.cy - LN_VY) * sDest;
      const wrx = lnWinPos.w * 1.35 * sDest;
      const wry = lnWinPos.h * 1.65 * sDest;
      c.globalAlpha = baseAlpha * destVis * (0.28 + 0.30 * sDest) * coolPulse;
      c.drawImage(SP_A.cool, wx - wrx, wy - wry, wrx * 2, wry * 2);

      const glx = LN_VX + destShift + (lnGateLamp.cx - LN_VX) * sDest;
      const gly = LN_VY + (lnGateLamp.cy - LN_VY) * sDest;
      const glr = 95 * sDest;
      c.globalAlpha = baseAlpha * destVis * 0.36 * sDest;
      c.drawImage(SP_A.warm, glx - glr, gly - glr * 0.72, glr * 2, glr * 1.65);

      const tx = LN_VX + destShift + (lnTubePos.cx - LN_VX) * sDest;
      const ty = LN_VY + (lnTubePos.cy - LN_VY) * sDest;
      c.globalAlpha = baseAlpha * destVis * 0.16 * sDest;
      c.drawImage(SP_A.tube, tx - 72 * sDest, ty - 24 * sDest, 144 * sDest, 78 * sDest);
    }

    for (let i = 0; i < lnLiveLampCount; i++) {
      const lm = LN_LIVE_LAMPS[i];
      const flick = 0.88 + 0.08 * Math.sin(lumTime * 2.1 + lm.ph) + 0.04 * Math.sin(lumTime * 6.8 + lm.ph);
      const rw = 88 * lm.sc;
      c.globalAlpha = baseAlpha * lm.alpha * 0.38 * flick;
      c.drawImage(SP_A.warm, lm.sx - rw, lm.sy - rw * 0.65, rw * 2, rw * 1.55);
    }
    c.restore();
  }

  SC.luotngo = {
    bake: bakeLuotNgo,
    enter() {
      LN.t = 0;
      LN.auto = true;
      lnDoneFired = false;
      ensureLuotNgoBaked();
      if (typeof nudge === 'function') nudge();
    },
    draw: drawLuotNgo,
    hot: {},
  };

  SC.ngo = {
    bake: () => bakeNgo(NGO.canh),
    enter() {
      const canh = clampCanh(NGO.canh);
      ensureNgoBaked(canh);
      if (typeof nudge === 'function') nudge();
    },
    draw: drawNgo,
    hot: HOT_NGO,
  };

  // Khởi tạo sẵn NG.khe và HOT_NGO[0..3] ngay khi nạp script
  initNgachGeom();
  initAllHotNgo();
})();
