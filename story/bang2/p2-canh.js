'use strict';
// PHÒNG 2 · HÀNH LANG KHU HỌC QUÂN SỰ TỐI 10/11 (chỉ cảnh & vùng chạm HOT2, chưa có câu đố).
// Dùng chung lõi từ core.js: W, H, cv, setT, layer, roundRect, vignette, grain, clamp, lerp, SC, nudge.
// Tách biệt phạm vi bằng IIFE để không đụng biến/hàm toàn cục của p1.js; chỉ xuất HOT2 và SC.hall.
var HOT2 = {};

(() => {
  // ---------- phối cảnh hành lang (mét, đồng nhất phong cách p1.js) ----------
  const CAM = { y: 1.32 };
  const F = 800;
  const VX = 735;
  const VY = 390;
  const P = (x, y, z) => [VX + (F * x) / z, VY + (F * (CAM.y - y)) / z];

  const HALL = { l: -1.85, r: 1.10, back: 12.2, near: 1.15, top: 2.85 };
  const LAMP = { x: -0.95, y: 2.18, z: 12.08 };
  const STAIR_X = -0.35; // ranh giới giữa mảng tường gắn đèn cuối hành lang và lối rẽ cầu thang
  const STAIR_Z = 11.60; // mép đầu hốc cầu thang rẽ xuống phía phải cuối hành lang
  const POSTS_Z = [2.6, 5.8, 9.0, 11.6];
  const DOORS_Z0 = [2.65, 4.20, 5.75, 7.30, 8.85, 10.40];
  const DOOR_W = 0.90;
  const DOOR_H = 2.08;
  const PHONE_POS = { x: 1.12, y: 1.04, z: 1.66 };
  const WIRE_A = [1.06, 1.96, 2.54];
  const WIRE_B = [1.05, 1.96, 5.74];

  // PRNG riêng cho bakeHall để không làm lệch seed của p1.js
  let lseed = 23;
  const lrnd = () => ((lseed = (lseed * 16807) % 2147483647) / 2147483647);

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

  function seg(c, a, b, w, col) {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(a[0] + (lrnd() - 0.5) * 0.6, a[1] + (lrnd() - 0.5) * 0.6);
    c.lineTo(b[0] + (lrnd() - 0.5) * 0.6, b[1] + (lrnd() - 0.5) * 0.6);
    c.stroke();
  }

  // Độ rọi theo khoảng cách 3D tới ngọn đèn vàng cuối hành lang
  const lit = (x, y, z) =>
    Math.max(0.14, 1 - Math.hypot((x - LAMP.x) * 0.85, (y - LAMP.y) * 0.65, (z - LAMP.z) * 0.42) / 5.5);

  function tube3(c, a, b, r, k, hiCol) {
    const A = P(a[0], a[1], a[2]);
    const B = P(b[0], b[1], b[2]);
    const z = (a[2] + b[2]) * 0.5;
    const w = Math.max(1.1, (F * r) / z);
    const rv = (18 + 14 * k) | 0;
    const gv = (22 + 12 * k) | 0;
    const bv = (24 + 8 * k) | 0;
    seg(c, A, B, w, `rgb(${rv},${gv},${bv})`);
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const vertical = Math.abs(dy) > Math.abs(dx);
    const ox = vertical ? w * 0.28 : 0;
    const oy = vertical ? 0 : -w * 0.24;
    seg(
      c,
      [A[0] + ox, A[1] + oy],
      [B[0] + ox, B[1] + oy],
      Math.max(0.6, w * 0.28),
      hiCol || `rgba(130,165,195,${0.12 + 0.26 * k})`
    );
  }

  function box(c, x0, x1, y0, y1, z0, z1, col, k, edge) {
    const r = col[0], gg = col[1], b = col[2];
    const sh = (m) => `rgb(${(r * m) | 0},${(gg * m) | 0},${(b * m) | 0})`;
    if (y1 <= CAM.y) {
      poly(c, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], sh(0.75 + 0.55 * k));
    } else if (y0 >= CAM.y) {
      poly(c, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], sh(0.45 + 0.4 * k));
    }
    poly(c, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], sh(0.5 + 0.35 * k));
    if (x1 < 0 || x0 > 0) {
      const sx = x1 < 0 ? x1 : x0;
      poly(c, [P(sx, y0, z0), P(sx, y0, z1), P(sx, y1, z1), P(sx, y1, z0)], sh(0.38 + 0.32 * k));
    }
    if (edge) {
      const ey = y1 <= CAM.y ? y1 : y0;
      seg(c, P(x0, ey, z0), P(x1, ey, z0), 1, `rgba(170,195,215,${0.1 + 0.24 * k})`);
    }
  }

  // ---------- Sprite ánh sáng dựng sẵn (không tạo radialGradient trong vòng vẽ 60fps) ----------
  const SP2 = {};
  function buildSprites() {
    if (SP2.warm) return;
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
    SP2.warm = mk(128, [
      [0, 'rgba(255,208,132,0.78)'],
      [0.24, 'rgba(255,178,96,0.38)'],
      [0.6, 'rgba(235,140,70,0.09)'],
      [1, 'rgba(220,120,55,0)'],
    ]);
    SP2.glow = mk(96, [
      [0, 'rgba(255,244,214,1)'],
      [0.22, 'rgba(255,214,145,0.74)'],
      [0.58, 'rgba(255,175,95,0.20)'],
      [1, 'rgba(255,150,70,0)'],
    ]);
    SP2.blue = mk(128, [
      [0, 'rgba(182,220,255,0.88)'],
      [0.28, 'rgba(148,196,255,0.44)'],
      [0.64, 'rgba(110,165,240,0.12)'],
      [1, 'rgba(90,145,225,0)'],
    ]);
  }

  // ---------- Dữ liệu vũng nước, áo phơi & điện thoại ----------
  const [hallC, hallG] = layer();
  let baked = false;
  const PUDDLES = [];
  const SHIRTS = [];
  let lampScreen = [0, 0];
  let phoneBot = null;
  let phoneTop = null;
  let phoneCam = null;
  let phoneRailEdgeA = null;
  let phoneRailEdgeB = null;

  function makePuddlePts(cx, cz, rx, rz, seedOffset) {
    const pts3 = [];
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 1 + 0.16 * Math.sin(a * 2 + seedOffset) + 0.09 * Math.cos(a * 3 - seedOffset * 1.7);
      pts3.push([cx + Math.cos(a) * rx * wob, 0, cz + Math.sin(a) * rz * wob]);
    }
    return pts3;
  }

  function buildPuddleData(cx, cz, rx, rz, seedOffset) {
    const pts3 = makePuddlePts(cx, cz, rx, rz, seedOffset);
    const pts2 = pts3.map((q) => P(q[0], q[1], q[2]));
    const center = P(cx, 0, cz);
    const dx = LAMP.x - cx;
    const dz = LAMP.z - cz;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    const aFar = P(cx + ux * rz * 0.78, 0, cz + uz * rz * 0.78);
    const aNear = P(cx - ux * rz * 0.68, 0, cz - uz * rz * 0.68);
    const edgeL = P(cx - rx * 0.65, 0, cz);
    const edgeR = P(cx + rx * 0.65, 0, cz);
    const width2d = Math.max(8, Math.abs(edgeR[0] - edgeL[0]) * 0.55);
    const k = lit(cx, 0, cz);
    return { pts2, center, aFar, aNear, width2d, k, ph: seedOffset };
  }

  // ---------- Phần tĩnh: bake toàn cảnh hành lang một lần vào canvas phụ ----------
  function bakeHall() {
    buildSprites();
    hallC.width = cv.width;
    hallC.height = cv.height;
    lseed = 23;
    PUDDLES.length = 0;
    SHIRTS.length = 0;

    const c = hallG;
    setT(c);
    const { l, r, back, near, top } = HALL;

    // 1. Nền & bầu trời đêm bên phải (mở ra ngoài lan can)
    c.fillStyle = '#05070b';
    c.fillRect(-300, -300, W + 600, H + 600);

    const skyX0 = P(r, top, back)[0] - 40;
    let gr = c.createLinearGradient(0, 0, 0, 560);
    gr.addColorStop(0, '#050912');
    gr.addColorStop(0.52, '#0c1627');
    gr.addColorStop(0.84, '#17283f');
    gr.addColorStop(1, '#080e18');
    c.fillStyle = gr;
    c.fillRect(skyX0, -300, W + 600 - skyX0, 960);

    // Vài ngôi sao mờ xa rất nhẹ trên cao
    for (let i = 0; i < 16; i++) {
      const sx = skyX0 + 80 + lrnd() * (W - skyX0 - 40);
      const sy = 95 + lrnd() * 170;
      c.fillStyle = `rgba(185,208,240,${0.12 + lrnd() * 0.22})`;
      c.fillRect(sx, sy, 1.4, 1.4);
    }

    // Hai lớp đồi tối ở xa (tạo chiều sâu phối cảnh không khí nhẹ)
    c.fillStyle = '#0c1624';
    c.beginPath();
    c.moveTo(skyX0, 480);
    for (let x = skyX0; x <= W + 220; x += 26) {
      const y = 382 + Math.sin(x * 0.0055 + 0.4) * 26 + Math.sin(x * 0.013 + 1.8) * 11;
      c.lineTo(x, y);
    }
    c.lineTo(W + 220, 680);
    c.lineTo(skyX0, 680);
    c.closePath();
    c.fill();

    c.fillStyle = '#050910';
    c.beginPath();
    c.moveTo(skyX0, 530);
    for (let x = skyX0; x <= W + 220; x += 24) {
      const y = 426 + Math.sin(x * 0.007 + 2.3) * 18 + Math.cos(x * 0.018 + 0.6) * 8;
      c.lineTo(x, y);
    }
    c.lineTo(W + 220, 760);
    c.lineTo(skyX0, 760);
    c.closePath();
    c.fill();

    // Vài đốm đèn vàng rất xa dưới chân đồi / khu nhà khác
    const hillLights = [
      [885, 440, 1.4, 0.45], [932, 450, 1.7, 0.58], [948, 452, 1.2, 0.35],
      [1045, 444, 1.6, 0.52], [1118, 454, 1.8, 0.62], [1132, 456, 1.2, 0.38],
      [1235, 437, 1.5, 0.48], [1340, 449, 1.7, 0.56], [1428, 443, 1.3, 0.40],
      [1515, 455, 1.6, 0.50],
    ];
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < hillLights.length; i++) {
      const [lx, ly, rad, al] = hillLights[i];
      c.globalAlpha = al * 0.45;
      c.drawImage(SP2.warm, lx - rad * 9, ly - rad * 9, rad * 18, rad * 18);
      c.globalAlpha = al;
      c.fillStyle = 'rgb(255,212,140)';
      c.beginPath();
      c.arc(lx, ly, rad, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // 2. Hốc cầu thang cuối hành lang (rẽ phải đi xuống, rõ bậc, tay vịn chéo và lan can chắn hốc)
    const stairBackZ = 13.35;
    // Khoảng hở tối sâu của ô cầu thang (chắn nền đằng sau từ y=-1.1 lên trần)
    poly(
      c,
      [P(STAIR_X, -1.1, STAIR_Z), P(r, -1.1, STAIR_Z), P(r, top, STAIR_Z), P(STAIR_X, top, STAIR_Z)],
      '#05070a'
    );
    // Tường hậu hốc cầu thang (lùi sâu hơn mảng tường đèn nên tối hơn nhẹ, tạo chiều sâu rõ nét)
    const stL = P(STAIR_X, top, stairBackZ);
    const stR = P(r, -0.8, stairBackZ);
    gr = c.createLinearGradient(stL[0], stL[1], stR[0], stR[1]);
    gr.addColorStop(0, '#191511');
    gr.addColorStop(0.45, '#0e0e10');
    gr.addColorStop(1, '#050609');
    poly(
      c,
      [P(STAIR_X, -1.1, stairBackZ), P(r, -1.1, stairBackZ), P(r, top, stairBackZ), P(STAIR_X, top, stairBackZ)],
      gr
    );
    // Tường hông trái hốc cầu thang (đoạn tường góc quay 11.6..12.2..13.35)
    gr = c.createLinearGradient(P(STAIR_X, 0, back)[0], 0, P(STAIR_X, 0, stairBackZ)[0] + 35, 0);
    gr.addColorStop(0, '#1f1a15');
    gr.addColorStop(1, '#0b0c0e');
    poly(
      c,
      [P(STAIR_X, -1.1, back), P(STAIR_X, top, back), P(STAIR_X, top, stairBackZ), P(STAIR_X, -1.1, stairBackZ)],
      gr
    );
    // Vệt bóng bậc thang đổ chéo xuống dọc tường hậu (nửa dưới tối hốc cầu thang)
    const stairShadowPts = [P(STAIR_X, -1.1, stairBackZ)];
    for (let s = 0; s < 6; s++) {
      const sx0 = -0.22 + s * 0.22;
      const sx1 = Math.min(r, sx0 + 0.22);
      const sy = 0.04 - s * 0.16;
      stairShadowPts.push(P(sx0, sy, stairBackZ));
      stairShadowPts.push(P(sx1, sy, stairBackZ));
    }
    stairShadowPts.push(P(r, -1.1, stairBackZ));
    poly(c, stairShadowPts, '#040508');

    // Các bậc thang rẽ ngang sang phải đi xuống (cổ bậc hướng trái đón ánh vàng từ đèn tường)
    for (let s = 0; s < 5; s++) {
      const sx0 = -0.24 + s * 0.25;
      const sx1 = Math.min(r - 0.02, sx0 + 0.25);
      const sy = -s * 0.14;
      const sk = Math.max(0.18, 0.94 - s * 0.17);
      // Mặt bậc
      poly(
        c,
        [P(sx0, sy, STAIR_Z + 0.04), P(sx1, sy, STAIR_Z + 0.04), P(sx1, sy, stairBackZ - 0.04), P(sx0, sy, stairBackZ - 0.04)],
        `rgb(${(54 * sk) | 0},${(45 * sk) | 0},${(36 * sk) | 0})`
      );
      // Cổ bậc hướng về đèn (bên trái bước xuống)
      if (s > 0) {
        poly(
          c,
          [P(sx0, sy, STAIR_Z + 0.04), P(sx0, sy + 0.14, STAIR_Z + 0.04), P(sx0, sy + 0.14, stairBackZ - 0.04), P(sx0, sy, stairBackZ - 0.04)],
          `rgb(${(64 * sk) | 0},${(52 * sk) | 0},${(40 * sk) | 0})`
        );
      }
      // Mũi bậc bắt ánh vàng
      seg(
        c,
        P(sx0, sy, STAIR_Z + 0.04),
        P(sx0, sy, stairBackZ - 0.04),
        1.3,
        `rgba(255,212,142,${0.48 * sk})`
      );
    }

    // 3. Trần, tường trái, mảng tường chắn cuối hành lang & sàn gạch (chừa hốc cầu thang bên phải)
    const pCeilNear = P(l, top, near);
    const pCeilBack = P(l, top, back);
    gr = c.createLinearGradient(0, pCeilNear[1], 0, pCeilBack[1]);
    gr.addColorStop(0, '#06080b');
    gr.addColorStop(0.75, '#0a0d12');
    gr.addColorStop(1, '#161513');
    poly(
      c,
      [pCeilNear, P(r, top, near), P(r, top, stairBackZ), P(STAIR_X, top, stairBackZ), P(STAIR_X, top, back), pCeilBack],
      gr
    );

    // Tường trái
    gr = c.createLinearGradient(P(l, 0, near)[0], 0, P(l, 0, back)[0], 0);
    gr.addColorStop(0, '#0a0e13');
    gr.addColorStop(0.68, '#0f1419');
    gr.addColorStop(1, '#1d1a16');
    poly(c, [P(l, 0, near), P(l, top, near), P(l, top, back), P(l, 0, back)], gr);

    // Mảng tường chắn cuối hành lang bên trái lối rẽ cầu thang
    gr = c.createLinearGradient(P(l, 0, back)[0], P(l, top, back)[1], P(STAIR_X, 0, back)[0], P(STAIR_X, 0, back)[1]);
    gr.addColorStop(0, '#221d17');
    gr.addColorStop(1, '#151415');
    poly(c, [P(l, 0, back), P(STAIR_X, 0, back), P(STAIR_X, top, back), P(l, top, back)], gr);

    // Chân tường trái (len tường tối)
    poly(c, [P(l, 0, near), P(l, 0.11, near), P(l, 0.11, back), P(l, 0, back)], '#07090b');
    poly(c, [P(l, 0, back), P(STAIR_X, 0, back), P(STAIR_X, 0.11, back), P(l, 0.11, back)], '#0b0c0d');

    // Sàn gạch hành lang hình chữ L (tới STAIR_Z ở phần bên phải để mở hốc cầu thang đi xuống)
    gr = c.createLinearGradient(0, P(0, 0, back)[1], 0, P(0, 0, near)[1]);
    gr.addColorStop(0, '#181614');
    gr.addColorStop(0.35, '#0d1014');
    gr.addColorStop(1, '#080a0e');
    poly(
      c,
      [P(l, 0, near), P(r, 0, near), P(r, 0, STAIR_Z), P(STAIR_X, 0, STAIR_Z), P(STAIR_X, 0, back), P(l, 0, back)],
      gr
    );

    // Mép gạch đầu cầu thang (dải sáng vàng mờ chỉ rõ bậc bước xuống)
    seg(c, P(STAIR_X, 0, STAIR_Z), P(r, 0, STAIR_Z), 1.6, 'rgba(235,195,138,0.28)');

    // Tay vịn chéo dọc lối cầu thang đi xuống (cắt theo miệng sàn STAIR_Z để thanh sắt khuất tự nhiên xuống dưới)
    c.save();
    c.beginPath();
    const cutTL = P(STAIR_X - 0.08, top, STAIR_Z);
    const cutTR = P(r + 0.05, top, STAIR_Z);
    const cutBR = P(r + 0.05, 0, STAIR_Z);
    const cutBL = P(STAIR_X - 0.08, 0, STAIR_Z);
    c.moveTo(cutTL[0], cutTL[1]);
    c.lineTo(cutTR[0], cutTR[1]);
    c.lineTo(cutBR[0], cutBR[1]);
    c.lineTo(cutBL[0], cutBL[1]);
    c.closePath();
    c.clip();
    tube3(c, [-0.26, 0.88, STAIR_Z + 0.35], [1.02, 0.04, stairBackZ - 0.35], 0.020, 0.64, 'rgba(255,212,145,0.34)');
    tube3(c, [-0.26, 0.0, STAIR_Z + 0.35], [-0.26, 0.88, STAIR_Z + 0.35], 0.016, 0.58);
    tube3(c, [0.16, -0.28, STAIR_Z + 0.68], [0.16, 0.60, STAIR_Z + 0.68], 0.015, 0.44);
    tube3(c, [0.58, -0.56, STAIR_Z + 1.02], [0.58, 0.32, STAIR_Z + 1.02], 0.014, 0.30);
    c.restore();

    // Lan can chắn ngang miệng hốc cầu thang (đặt ngay trên mép sàn STAIR_Z, chừa lối bước bên trái)
    tube3(c, [0.24, 0.0, STAIR_Z], [0.24, 0.88, STAIR_Z], 0.018, 0.56, 'rgba(255,212,145,0.30)');
    tube3(c, [0.24, 0.88, STAIR_Z], [r - 0.04, 0.88, STAIR_Z], 0.020, 0.56, 'rgba(255,212,145,0.30)');
    tube3(c, [0.24, 0.46, STAIR_Z], [r - 0.04, 0.46, STAIR_Z], 0.013, 0.42);
    for (let bx = 0.44; bx < r - 0.08; bx += 0.24) {
      tube3(c, [bx, 0.0, STAIR_Z], [bx, 0.88, STAIR_Z], 0.011, 0.44);
    }

    // Mạch gạch sàn phối cảnh
    for (let x = l; x <= r + 0.001; x += 0.49) {
      const zEnd = x >= STAIR_X ? STAIR_Z : back;
      seg(c, P(x, 0, near), P(x, 0, zEnd), 0.75, 'rgba(145,165,180,0.06)');
    }
    for (let z = 1.4; z <= back; z += 0.52) {
      const kFloor = lit(0, 0, z);
      const xEnd = z > STAIR_Z ? STAIR_X : r;
      seg(c, P(l, 0, z), P(xEnd, 0, z), 0.75, `rgba(${(145 + 65 * kFloor) | 0},${(160 + 20 * kFloor) | 0},${(175 - 20 * kFloor) | 0},${0.048 + 0.032 * kFloor})`);
    }

    // Vết bụi/ẩm nhẹ trên sàn và chân tường (giống p1.js:42)
    for (let i = 0; i < 2800; i++) {
      c.fillStyle = `rgba(${lrnd() < 0.5 ? '255,255,255' : '0,0,0'},${lrnd() * 0.026})`;
      c.fillRect(lrnd() * W, lrnd() * H, 1.8, 1.8);
    }

    // 4. Vài vũng nước mưa nhỏ còn đọng từ hôm qua trên sàn gạch (mỏng trong suốt, thấy mạch gạch bên dưới)
    const puddleDefs = [
      [0.34, 3.35, 0.34, 0.56, 0.8],
      [-0.24, 5.50, 0.38, 0.68, 2.1],
      [0.48, 7.60, 0.28, 0.52, 3.7],
      [-0.08, 9.75, 0.30, 0.48, 5.2],
    ];
    for (let i = 0; i < puddleDefs.length; i++) {
      const [cx, cz, rx, rz, ph] = puddleDefs[i];
      const pd = buildPuddleData(cx, cz, rx, rz, ph);
      PUDDLES.push(pd);
      // Quầng ẩm mỏng lan quanh mép nước (không kẻ viền cứng)
      c.save();
      poly(c, pd.pts2, 'rgba(5,9,16,0.38)');
      c.clip();
      // Phản chiếu mờ bầu trời đêm trên mặt nước
      const gWater = c.createLinearGradient(0, pd.aFar[1], 0, pd.aNear[1]);
      gWater.addColorStop(0, 'rgba(22,36,60,0.34)');
      gWater.addColorStop(1, 'rgba(10,16,28,0.10)');
      c.fillStyle = gWater;
      c.fillRect(0, pd.aFar[1] - 4, W, pd.aNear[1] - pd.aFar[1] + 8);
      c.restore();
      // Viền loáng rất mỏng phía mép nước đối diện người xem (nước bắt ánh mờ)
      c.save();
      c.strokeStyle = `rgba(145,175,210,${0.06 + 0.07 * pd.k})`;
      c.lineWidth = 0.9;
      c.beginPath();
      for (let j = 0; j < 8; j++) {
        const pt = pd.pts2[j];
        if (j === 0) c.moveTo(pt[0], pt[1]);
        else c.lineTo(pt[0], pt[1]);
      }
      c.stroke();
      c.restore();
    }

    // 5. Dầm trần & 3 bóng đèn tuýp đã tắt trên trần
    for (let i = 0; i < 3; i++) {
      const bz = POSTS_Z[i];
      box(c, l, r, top - 0.16, top, bz - 0.08, bz + 0.08, [16, 20, 25], lit(-0.3, top, bz), false);
    }
    const tubeZs = [4.40, 7.20, 10.00];
    for (let i = 0; i < tubeZs.length; i++) {
      const tz = tubeZs[i];
      const kt = lit(-0.35, top, tz);
      box(c, -0.92, 0.22, top - 0.05, top, tz - 0.05, tz + 0.05, [28, 34, 40], kt * 0.9, false);
      box(c, -0.92, -0.86, top - 0.10, top - 0.04, tz - 0.04, tz + 0.04, [38, 42, 46], kt, false);
      box(c, 0.16, 0.22, top - 0.10, top - 0.04, tz - 0.04, tz + 0.04, [38, 42, 46], kt, false);
      const tA = P(-0.86, top - 0.075, tz);
      const tB = P(0.16, top - 0.075, tz);
      const tw = Math.max(2.2, (F * 0.036) / tz);
      seg(c, tA, tB, tw, `rgb(${(24 + 14 * kt) | 0},${(30 + 14 * kt) | 0},${(36 + 10 * kt) | 0})`);
      seg(
        c,
        [tA[0], tA[1] + tw * 0.28],
        [tB[0], tB[1] + tw * 0.28],
        Math.max(0.7, tw * 0.24),
        `rgba(${(145 + 65 * kt) | 0},${(170 + 20 * kt) | 0},${(190 - 25 * kt) | 0},${0.10 + 0.18 * kt})`
      );
    }

    // 6. 6 cửa phòng đóng dọc tường trái (cửa gỗ sơn, ô kính nhỏ tối phía trên) & xuất HOT2.door1..door6
    const doorBounds = [];
    for (let i = 0; i < DOORS_Z0.length; i++) {
      const z0 = DOORS_Z0[i];
      const z1 = z0 + DOOR_W;
      const kd = lit(l, 1.0, (z0 + z1) * 0.5);
      poly(
        c,
        [P(l, 0, z0 - 0.05), P(l, DOOR_H + 0.06, z0 - 0.05), P(l, DOOR_H + 0.06, z1 + 0.05), P(l, 0, z1 + 0.05)],
        `rgb(${(11 + 12 * kd) | 0},${(14 + 10 * kd) | 0},${(16 + 8 * kd) | 0})`
      );
      const pBL = P(l, 0, z0);
      const pTL = P(l, DOOR_H, z0);
      const pTR = P(l, DOOR_H, z1);
      const pBR = P(l, 0, z1);
      const dr = (20 + 26 * kd) | 0;
      const dg = (27 + 23 * kd) | 0;
      const db = (25 + 16 * kd) | 0;
      poly(c, [pBL, pTL, pTR, pBR], `rgb(${dr},${dg},${db})`);
      seg(c, pTL, pTR, 1.2, `rgba(210,195,165,${0.08 + 0.2 * kd})`);
      seg(c, pTR, pBR, 1.3, `rgba(255,212,155,${0.07 + 0.24 * kd})`);
      seg(c, pBL, pTL, 1.0, 'rgba(0,0,0,0.45)');
      // Khe tối gầm cửa
      seg(c, pBL, pBR, 1.6, 'rgba(2,3,4,0.65)');
      seg(c, P(l, 0.92, z0 + 0.06), P(l, 0.92, z1 - 0.06), 1.0, 'rgba(0,0,0,0.32)');
      const hA = P(l, 0.98, z0 + 0.14);
      const hB = P(l, 0.98, z0 + 0.22);
      seg(c, hA, hB, Math.max(1.2, 6 / z0), `rgba(175,180,175,${0.25 + 0.35 * kd})`);

      // Ô kính nhỏ phía trên cánh cửa (tối om vì trong phòng đã tắt đèn)
      const gz0 = z0 + 0.16;
      const gz1 = z1 - 0.16;
      const gy0 = 1.56;
      const gy1 = 1.94;
      const gBL = P(l, gy0, gz0);
      const gTL = P(l, gy1, gz0);
      const gTR = P(l, gy1, gz1);
      const gBR = P(l, gy0, gz1);
      poly(c, [gBL, gTL, gTR, gBR], '#030507');
      c.strokeStyle = `rgba(${(48 + 38 * kd) | 0},${(55 + 32 * kd) | 0},${(52 + 22 * kd) | 0},0.85)`;
      c.lineWidth = Math.max(1, 3.8 / z0);
      c.beginPath();
      c.moveTo(gBL[0], gBL[1]);
      c.lineTo(gTL[0], gTL[1]);
      c.lineTo(gTR[0], gTR[1]);
      c.lineTo(gBR[0], gBR[1]);
      c.closePath();
      c.stroke();
      seg(
        c,
        [lerp(gBL[0], gTR[0], 0.22), lerp(gBL[1], gTR[1], 0.22)],
        [lerp(gBL[0], gTR[0], 0.72), lerp(gBL[1], gTR[1], 0.72)],
        0.8,
        `rgba(180,200,220,${0.06 + 0.1 * kd})`
      );

      const minX = Math.min(pBL[0], pTL[0]);
      const maxX = Math.max(pBR[0], pTR[0]);
      const minY = clamp(Math.min(pTL[1], pTR[1]), 100, 790);
      const maxY = clamp(Math.max(pBL[1], pBR[1]), 110, 800);
      doorBounds.push({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
    }
    for (let i = 0; i < doorBounds.length; i++) {
      const b = doorBounds[i];
      const padL = i === 0 ? 8 : Math.max(2, (b.x - (doorBounds[i - 1].x + doorBounds[i - 1].w)) * 0.45);
      const padR = i === doorBounds.length - 1 ? 14 : Math.max(2, (doorBounds[i + 1].x - (b.x + b.w)) * 0.45);
      HOT2['door' + (i + 1)] = {
        x: Math.round(b.x - padL),
        y: Math.round(b.y),
        w: Math.round(b.w + padL + padR),
        h: Math.round(b.h),
      };
    }

    // 7. Ngọn đèn vàng mờ trên tường cuối hành lang (đế gắn tường + chụp kính + quầng nền)
    lampScreen = P(LAMP.x, LAMP.y, LAMP.z);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.26;
    c.drawImage(SP2.warm, lampScreen[0] - 260, lampScreen[1] - 210, 520, 440);
    c.restore();
    // Đế đen và mũ chụp nhỏ phía trên bóng đèn (ánh sáng hắt xuống và toả ra trước)
    c.fillStyle = '#15120f';
    roundRect(c, lampScreen[0] - 13, lampScreen[1] - 15, 26, 30, 9);
    c.fill();
    c.fillStyle = '#25201a';
    c.fillRect(lampScreen[0] - 14, lampScreen[1] - 16, 28, 7);
    c.fillStyle = 'rgba(255,216,148,0.88)';
    c.beginPath();
    c.ellipse(lampScreen[0], lampScreen[1] + 2, 7.2, 8.8, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,248,225,0.92)';
    c.beginPath();
    c.ellipse(lampScreen[0], lampScreen[1] + 1, 3.6, 4.4, 0, 0, Math.PI * 2);
    c.fill();

    const eTL = P(STAIR_X, top - 0.15, back);
    const eBR = P(r, -0.35, back);
    const endY0 = clamp(eTL[1], 100, 760);
    const endY1 = clamp(eBR[1], endY0 + 60, 800);
    HOT2.end = {
      x: Math.round(eTL[0] - 8),
      y: Math.round(endY0),
      w: Math.round(eBR[0] - eTL[0] + 16),
      h: Math.round(endY1 - endY0),
    };

    // 8. Lan can sắt bên phải & các cột hiên nâng mái hành lang
    box(c, r - 0.05, r + 0.11, 0, 0.14, near, back, [24, 28, 34], 0.35, true);

    for (let z = 12.0; z >= 1.35; z -= 0.28) {
      let onPost = false;
      for (let i = 0; i < POSTS_Z.length; i++) {
        if (Math.abs(z - POSTS_Z[i]) < 0.16) onPost = true;
      }
      if (!onPost) {
        const kBar = lit(r, 0.6, z);
        const hi = kBar > 0.45 ? `rgba(220,190,155,${0.14 + 0.18 * kBar})` : `rgba(135,170,205,${0.16 + 0.14 * kBar})`;
        tube3(c, [r + 0.01, 0.14, z], [r + 0.01, 0.99, z], 0.012, kBar, hi);
      }
    }
    tube3(c, [r + 0.01, 0.56, near], [r + 0.01, 0.56, back], 0.014, 0.4, 'rgba(155,185,215,0.22)');
    // Tay vịn trên (mặt phẳng rộng x: r-0.07 .. r+0.11, y: 0.99 .. 1.04 để đặt điện thoại)
    poly(
      c,
      [P(r - 0.07, 1.04, near), P(r + 0.11, 1.04, near), P(r + 0.11, 1.04, back), P(r - 0.07, 1.04, back)],
      '#1a222c'
    );
    poly(
      c,
      [P(r - 0.07, 0.99, near), P(r - 0.07, 1.04, near), P(r - 0.07, 1.04, back), P(r - 0.07, 0.99, back)],
      '#10151b'
    );
    seg(c, P(r + 0.11, 1.04, near), P(r + 0.11, 1.04, back), 1.3, 'rgba(150,185,220,0.24)');
    seg(c, P(r - 0.07, 1.04, near), P(r - 0.07, 1.04, back), 1.0, 'rgba(200,210,220,0.12)');

    // 4 cột hiên vuông (vẽ từ xa tới gần)
    for (let i = POSTS_Z.length - 1; i >= 0; i--) {
      const pz = POSTS_Z[i];
      const kp = lit(r, 1.4, pz);
      box(c, r - 0.07, r + 0.11, 0, top, pz - 0.08, pz + 0.08, [26, 31, 38], kp, false);
      seg(c, P(r + 0.11, 0, pz - 0.08), P(r + 0.11, top, pz - 0.08), 1.1, 'rgba(140,175,210,0.16)');
    }

    // Vòng thắt nhỏ buộc dây phơi quanh cột hiên tại WIRE_A và WIRE_B
    const wA2 = P(WIRE_A[0], WIRE_A[1], WIRE_A[2]);
    const wA3 = P(r + 0.09, WIRE_A[1] - 0.005, WIRE_A[2] - 0.01);
    const wB2 = P(WIRE_B[0], WIRE_B[1], WIRE_B[2]);
    const wB3 = P(r + 0.09, WIRE_B[1] - 0.004, WIRE_B[2] - 0.01);
    seg(c, wA2, wA3, 2.0, 'rgba(92,108,126,0.42)');
    seg(c, wB2, wB3, 1.5, 'rgba(92,108,126,0.34)');

    // 9. Chuẩn bị tọa độ tĩnh của hai chiếc áo quân phục trên dây phơi & xuất HOT2.ao
    const shirtTs = [0.78, 0.22];
    let aoMinX = W;
    let aoMaxX = 0;
    let aoMinY = H;
    let aoMaxY = 0;
    for (let i = 0; i < shirtTs.length; i++) {
      const t = shirtTs[i];
      const sx = lerp(WIRE_A[0], WIRE_B[0], t);
      const sz = lerp(WIRE_A[2], WIRE_B[2], t);
      const sag = 0.09 * 4 * t * (1 - t);
      const sy = lerp(WIRE_A[1], WIRE_B[1], t) - sag;
      const at = P(sx, sy, sz);
      const sc = F / sz;
      const ks = lit(sx, sy - 0.35, sz);
      SHIRTS.push({
        at,
        sc,
        k: ks,
        ph: i * 1.9,
        freq: i === 0 ? 1.18 : 1.36,
        amp: i === 0 ? 0.024 : 0.030,
      });
      const halfW = sc * 0.28;
      const topY = at[1] - sc * 0.03;
      const botY = at[1] + sc * 0.72;
      if (at[0] - halfW < aoMinX) aoMinX = at[0] - halfW;
      if (at[0] + halfW > aoMaxX) aoMaxX = at[0] + halfW;
      if (topY < aoMinY) aoMinY = topY;
      if (botY > aoMaxY) aoMaxY = botY;
    }
    const aoY0 = clamp(aoMinY - 12, 100, 720);
    const aoY1 = clamp(aoMaxY + 12, aoY0 + 60, 800);
    HOT2.ao = {
      x: Math.round(aoMinX - 16),
      y: Math.round(aoY0),
      w: Math.round(aoMaxX - aoMinX + 32),
      h: Math.round(aoY1 - aoY0),
    };

    // 10. Chuẩn bị tọa độ khối 3D điện thoại úp trên lan can & xuất HOT2.phone
    const phAt = P(PHONE_POS.x, PHONE_POS.y, PHONE_POS.z);
    const phTopY = PHONE_POS.y + 0.011; // thân máy mỏng tự nhiên
    const corners = [
      [PHONE_POS.x - 0.056, PHONE_POS.z - 0.088],
      [PHONE_POS.x + 0.036, PHONE_POS.z - 0.098],
      [PHONE_POS.x + 0.058, PHONE_POS.z + 0.086],
      [PHONE_POS.x - 0.034, PHONE_POS.z + 0.096],
    ];
    phoneBot = corners.map((pt) => P(pt[0], PHONE_POS.y, pt[1]));
    phoneTop = corners.map((pt) => P(pt[0], phTopY, pt[1]));
    phoneCam = P(PHONE_POS.x - 0.022, phTopY + 0.001, PHONE_POS.z - 0.050);
    phoneRailEdgeA = P(r - 0.07, 1.038, 1.42);
    phoneRailEdgeB = P(r - 0.07, 1.038, 1.98);

    const phMinX = Math.min(phoneBot[0][0], phoneBot[1][0], phoneBot[2][0], phoneBot[3][0]);
    const phMaxX = Math.max(phoneBot[0][0], phoneBot[1][0], phoneBot[2][0], phoneBot[3][0]);
    const phMinY = Math.min(phoneTop[0][1], phoneTop[1][1], phoneTop[2][1], phoneTop[3][1]);
    const phMaxY = Math.max(phoneBot[0][1], phoneBot[1][1], phoneBot[2][1], phoneBot[3][1]);
    HOT2.phone = {
      x: Math.round(phMinX - 36),
      y: Math.round(clamp(phMinY - 40, 100, 720)),
      w: Math.round(Math.max(115, phMaxX - phMinX + 72)),
      h: Math.round(Math.max(88, phMaxY - phMinY + 76)),
      at: phAt,
    };

    // 11. Hạt phim & viền tối 4 góc (đúng phong cách p1.js:77-78)
    grain(c, 10500, 0.022);
    vignette(c, 0.78);
    baked = true;
  }

  // ---------- Vẽ một chiếc áo quân phục đang phơi (nằm trong draw động) ----------
  function drawShirt(c, s, sway, idx) {
    const u = s.sc * 0.0028;
    const k = s.k;
    c.save();
    c.translate(s.at[0], s.at[1]);
    c.rotate(sway);
    c.scale(u, u);

    c.strokeStyle = '#2a2d29';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, -4, 6, Math.PI, 0);
    c.moveTo(6, -4);
    c.lineTo(0, 14);
    c.moveTo(-64, 42);
    c.lineTo(0, 14);
    c.lineTo(64, 42);
    c.stroke();

    // Màu áo quân phục chìm vào bóng đêm hành lang (tương đồng độ tối với phần tĩnh sau vignette)
    const shade = idx === 0 ? 0.86 : 1.0;
    const rr = ((18 + 14 * k) * shade) | 0;
    const rg = ((25 + 16 * k) * shade) | 0;
    const rb = ((15 + 9 * k) * shade) | 0;
    c.fillStyle = `rgb(${rr},${rg},${rb})`;
    c.beginPath();
    c.moveTo(-22, 24);
    c.lineTo(22, 24);
    c.quadraticCurveTo(50, 32, 66, 44);
    c.lineTo(82, 122);
    c.lineTo(59, 126);
    c.lineTo(53, 102);
    c.lineTo(55, 232);
    c.quadraticCurveTo(0, 236, -55, 232);
    c.lineTo(-53, 102);
    c.lineTo(-59, 126);
    c.lineTo(-82, 122);
    c.lineTo(-66, 44);
    c.quadraticCurveTo(-50, 32, -22, 24);
    c.closePath();
    c.fill();

    // Cổ áo bẻ & nếp vải nhẹ
    c.fillStyle = `rgb(${(rr * 0.72) | 0},${(rg * 0.72) | 0},${(rb * 0.72) | 0})`;
    c.beginPath();
    c.moveTo(-22, 24);
    c.lineTo(0, 44);
    c.lineTo(22, 24);
    c.lineTo(13, 18);
    c.lineTo(0, 31);
    c.lineTo(-13, 18);
    c.closePath();
    c.fill();

    c.strokeStyle = 'rgba(0,0,0,0.42)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 42);
    c.lineTo(0, 233);
    c.stroke();

    // Hai nếp rủ dọc rất mờ trên vạt áo
    c.strokeStyle = 'rgba(0,0,0,0.16)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-24, 130);
    c.lineTo(-28, 228);
    c.moveTo(25, 130);
    c.lineTo(27, 228);
    c.stroke();

    // Hai túi ngực có nắp đặc trưng áo quân phục (đồng bộ p1.js:87-88)
    c.fillStyle = `rgb(${(rr * 0.84) | 0},${(rg * 0.84) | 0},${(rb * 0.84) | 0})`;
    c.fillRect(-44, 86, 32, 31);
    c.fillRect(12, 86, 32, 31);
    c.strokeStyle = 'rgba(0,0,0,0.45)';
    c.lineWidth = 1.8;
    c.strokeRect(-44, 86, 32, 31);
    c.strokeRect(12, 86, 32, 31);
    c.beginPath();
    c.moveTo(-44, 96);
    c.lineTo(-12, 96);
    c.moveTo(12, 96);
    c.lineTo(44, 96);
    c.stroke();

    // Viền sáng rất nhẹ: mép phải hướng ra đêm lạnh, mép trái hướng vào ánh đèn cuối hành lang
    c.strokeStyle = 'rgba(135,170,210,0.16)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(22, 24);
    c.quadraticCurveTo(50, 32, 66, 44);
    c.lineTo(82, 122);
    c.stroke();
    c.strokeStyle = `rgba(255,202,135,${0.05 + 0.09 * k})`;
    c.beginPath();
    c.moveTo(-22, 24);
    c.quadraticCurveTo(-50, 32, -66, 44);
    c.lineTo(-82, 122);
    c.stroke();

    c.restore();
  }

  function ensureBaked() {
    if (!baked || hallC.width !== cv.width || hallC.height !== cv.height) bakeHall();
  }

  // ---------- Phần động mỗi khung hình ----------
  function draw(c, now) {
    ensureBaked();

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(hallC, 0, 0);
    setT(c);

    const t = now * 0.001;

    // 1. Đèn vàng mờ cuối hành lang chập chờn rất nhẹ
    const flick =
      0.88 +
      0.06 * Math.sin(t * 1.7) +
      0.035 * Math.sin(t * 6.9) +
      0.018 * Math.sin(t * 18.4);

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.48 * flick;
    c.drawImage(SP2.warm, lampScreen[0] - 250, lampScreen[1] - 195, 500, 410);
    c.globalAlpha = 0.85 * flick;
    c.drawImage(SP2.glow, lampScreen[0] - 60, lampScreen[1] - 60, 120, 120);
    c.globalAlpha = 0.22 * flick;
    c.drawImage(SP2.warm, lampScreen[0] - 30, lampScreen[1] - 90, 280, 380); // ánh hắt sang bậc cầu thang
    c.restore();

    // 2. Phản chiếu đèn vàng trên các vũng nước sàn gạch (chập chờn đồng bộ với đèn)
    for (let i = 0; i < PUDDLES.length; i++) {
      const pd = PUDDLES[i];
      const ripple = 0.86 + 0.14 * Math.sin(t * 2.1 + pd.ph);
      const rx = Math.sin(t * 1.3 + pd.ph) * 1.8;
      c.save();
      c.beginPath();
      for (let j = 0; j < pd.pts2.length; j++) {
        if (j) c.lineTo(pd.pts2[j][0], pd.pts2[j][1]);
        else c.moveTo(pd.pts2[j][0], pd.pts2[j][1]);
      }
      c.closePath();
      c.clip();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = (0.34 + 0.50 * pd.k) * flick * ripple;
      const rw = pd.width2d * 1.45;
      const rh = Math.max(14, Math.abs(pd.aNear[1] - pd.aFar[1]) * 1.05);
      c.drawImage(SP2.warm, pd.center[0] + rx - rw, pd.center[1] - rh * 0.5, rw * 2, rh);

      // Các vệt gợn phản chiếu vàng kéo hướng về ngọn đèn cuối hành lang
      for (let gStep = 0; gStep < 3; gStep++) {
        const uStep = 0.26 + gStep * 0.24;
        const gy = lerp(pd.aFar[1], pd.aNear[1], uStep);
        const gx = lerp(pd.aFar[0], pd.aNear[0], uStep) + rx * (gStep - 1) * 0.7;
        const hw = pd.width2d * (0.28 + 0.12 * Math.sin(gStep * 1.8 + pd.ph));
        c.strokeStyle = `rgba(255,214,145,${(0.32 + 0.42 * pd.k) * flick})`;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(gx - hw, gy);
        c.lineTo(gx + hw, gy);
        c.stroke();
      }
      c.restore();
    }

    // 3. Dây phơi và hai chiếc áo quân phục khẽ lay theo gió đêm
    const wA = P(WIRE_A[0], WIRE_A[1], WIRE_A[2]);
    const wB = P(WIRE_B[0], WIRE_B[1], WIRE_B[2]);
    const s0 = SHIRTS[0];
    const s1 = SHIRTS[1];
    const sw0 = s0.amp * Math.sin(t * s0.freq + s0.ph) + 0.008 * Math.sin(t * 2.8 + s0.ph);
    const sw1 = s1.amp * Math.sin(t * s1.freq + s1.ph) + 0.009 * Math.sin(t * 3.1 + s1.ph);

    c.strokeStyle = 'rgba(96,112,130,0.34)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(wA[0], wA[1]);
    c.lineTo(s1.at[0], s1.at[1]);
    c.lineTo(s0.at[0], s0.at[1]);
    c.lineTo(wB[0], wB[1]);
    c.stroke();

    drawShirt(c, s0, sw0, 0);
    drawShirt(c, s1, sw1, 1);

    // 4. Chiếc điện thoại úp trên mặt lan can & ánh màn hình xanh nhạt thở
    const ph = HOT2.phone.at;
    const breath = 0.76 + 0.24 * Math.sin(t * 2.1);

    // Ánh xanh nhạt hắt dẹt lên mặt tay vịn lan can và lan nhẹ xuống mép lan can
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.78 * breath;
    c.drawImage(SP2.blue, ph[0] - 135, ph[1] - 44, 270, 96);
    c.globalAlpha = 0.45 * breath;
    c.drawImage(SP2.blue, ph[0] - 72, ph[1] - 20, 144, 48);
    // Viền sáng xanh hắt trên mép trong tay vịn lan can ngay dưới máy
    c.strokeStyle = `rgba(170,215,255,${0.55 * breath})`;
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(phoneRailEdgeA[0], phoneRailEdgeA[1]);
    c.lineTo(phoneRailEdgeB[0], phoneRailEdgeB[1]);
    c.stroke();
    c.restore();

    // Khe sáng màn hình hở dọc cạnh đáy thân máy tiếp xúc lan can
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = `rgba(188,226,255,${0.92 * breath})`;
    c.lineWidth = 3.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(phoneBot[0][0], phoneBot[0][1] + 0.8);
    c.lineTo(phoneBot[3][0], phoneBot[3][1] + 0.8);
    c.lineTo(phoneBot[2][0], phoneBot[2][1] + 0.8);
    c.stroke();
    c.restore();

    // Cạnh hông trái & gần của thân máy (mỏng gọn)
    poly(c, [phoneBot[0], phoneBot[3], phoneTop[3], phoneTop[0]], '#12171f');
    poly(c, [phoneBot[0], phoneBot[1], phoneTop[1], phoneTop[0]], '#0e1218');
    // Mặt lưng điện thoại úp lên trên
    poly(c, phoneTop, '#090c11');
    c.strokeStyle = `rgba(172,212,252,${0.32 + 0.24 * breath})`;
    c.lineWidth = 1.1;
    c.stroke();
    // Cụm camera nhỏ gọn ở góc mặt lưng
    c.fillStyle = '#040507';
    c.fillRect(phoneCam[0] - 4.5, phoneCam[1] - 2.5, 9, 5);
    c.strokeStyle = 'rgba(140,175,215,0.24)';
    c.lineWidth = 0.8;
    c.strokeRect(phoneCam[0] - 4.5, phoneCam[1] - 2.5, 9, 5);
  }

  // cho phần câu đố (p2.js) đọc vị trí vũng nước, ngọn đèn, phép chiếu
  window.HALLX = { PUDDLES, lamp: () => lampScreen, P };
  SC.hall = {
    bake: bakeHall,
    enter() {
      ensureBaked();
      if (typeof nudge === 'function') nudge();
    },
    draw,
  };
})();
