'use strict';
// PHẦN 3 · CẦU THANG 1 GIỜ SÁNG, BỨC TƯỜNG, HỘP SẮT & KẸT BĂNG (chỉ hình & xuất biến, chưa có luật chơi).
// Dùng chung lõi từ core.js: W, H, cv, setT, layer, roundRect, vignette, grain, clamp, lerp, ease, HAND, SC.
// Tránh đụng `const HOT = {}` của p1.js khi nạp chung: chỉ khởi tạo HOT nếu chưa có.
if (typeof HOT === 'undefined') globalThis.HOT = {};

var CT = {
  xe: { t: 0, chieu: 1 },
  dt: 0,
  _auto: false,
  quet(chieu) {
    CT.xe.chieu = chieu === -1 ? -1 : 1;
    CT.xe.t = 0.001;
    CT._auto = true;
  },
  // Dãy 4 chữ số 7 vạch (a, b, c, d, e, f, g): true nếu thuộc chữ số thật 0, 1, 0, 0
  vach: [
    [true, true, true, true, true, true, false],
    [false, true, true, false, false, false, false],
    [true, true, true, true, true, true, false],
    [true, true, true, true, true, true, false],
  ],
  // Trả về danh sách [chiSoChuSo, chiSoVach] đang được vệt đèn xe soi sáng tại tiến độ t (0..1)
  vachSang: null,
};

var BT = {
  vua: 0,
  am: 0,
  o: new Array(101),
  xoa: { x: 0, y: 0, w: 0, h: 0 },
};

var HS = {
  so: [0, 0, 0, 0],
  mo: 0,
  banh: [
    { x: 0, y: 0, w: 0, h: 0 },
    { x: 0, y: 0, w: 0, h: 0 },
    { x: 0, y: 0, w: 0, h: 0 },
    { x: 0, y: 0, w: 0, h: 0 },
  ],
  khe: { x: 0, y: 0, w: 0, h: 0 },
};

var KB = {
  goc: -2.35,
  chung: 1,
  nhan: 0,
  loi: [682, 330],
  r: 165,
};

(() => {
  // ---------- Phép chiếu 3D & tiện ích vẽ (cùng phong cách p1.js, p2-canh.js) ----------
  const CAM = { y: 1.48 };
  const F = 780;
  const VX = 760;
  const VY = 365;
  const P = (x, y, z) => [VX + (F * x) / z, VY + (F * (CAM.y - y)) / z];

  let cseed = 41;
  const crnd = () => ((cseed = (cseed * 16807) % 2147483647) / 2147483647);

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
    c.moveTo(a[0] + (crnd() - 0.5) * 0.6, a[1] + (crnd() - 0.5) * 0.6);
    c.lineTo(b[0] + (crnd() - 0.5) * 0.6, b[1] + (crnd() - 0.5) * 0.6);
    c.stroke();
  }

  function tube3(c, a, b, r, k, hiCol) {
    const A = P(a[0], a[1], a[2]);
    const B = P(b[0], b[1], b[2]);
    const z = (a[2] + b[2]) * 0.5;
    const w = Math.max(1.1, (F * r) / z);
    const rv = (15 + 10 * k) | 0;
    const gv = (20 + 13 * k) | 0;
    const bv = (26 + 16 * k) | 0;
    seg(c, A, B, w, `rgb(${rv},${gv},${bv})`);
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const vert = Math.abs(dy) > Math.abs(dx);
    const ox = vert ? w * 0.28 : 0;
    const oy = vert ? 0 : -w * 0.24;
    seg(
      c,
      [A[0] + ox, A[1] + oy],
      [B[0] + ox, B[1] + oy],
      Math.max(0.6, w * 0.26),
      hiCol || `rgba(128,162,196,${0.10 + 0.24 * k})`
    );
  }

  function box(c, x0, x1, y0, y1, z0, z1, col, k, edge) {
    const r = col[0], gg = col[1], b = col[2];
    const sh = (m) => `rgb(${(r * m) | 0},${(gg * m) | 0},${(b * m) | 0})`;
    if (y1 <= CAM.y) {
      poly(c, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], sh(0.76 + 0.55 * k));
    } else if (y0 >= CAM.y) {
      poly(c, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], sh(0.45 + 0.35 * k));
    }
    poly(c, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], sh(0.50 + 0.34 * k));
    if (x1 < 0 || x0 > 0) {
      const sx = x1 < 0 ? x1 : x0;
      poly(c, [P(sx, y0, z0), P(sx, y0, z1), P(sx, y1, z1), P(sx, y1, z0)], sh(0.36 + 0.30 * k));
    }
    if (edge) {
      const ey = y1 <= CAM.y ? y1 : y0;
      seg(c, P(x0, ey, z0), P(x1, ey, z0), 1, `rgba(155,185,215,${0.09 + 0.24 * k})`);
    }
  }

  // ---------- Sprite ánh sáng dựng sẵn (không tạo radialGradient trong draw) ----------
  const SP3 = {};
  function buildSprites() {
    if (SP3.cold) return;
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
    SP3.cold = mk(128, [
      [0, 'rgba(170,210,255,0.82)'],
      [0.28, 'rgba(130,178,235,0.38)'],
      [0.64, 'rgba(90,138,200,0.10)'],
      [1, 'rgba(70,110,175,0)'],
    ]);
    SP3.beam = mk(128, [
      [0, 'rgba(222,236,255,0.72)'],
      [0.35, 'rgba(190,214,246,0.28)'],
      [0.72, 'rgba(150,182,220,0.07)'],
      [1, 'rgba(130,165,205,0)'],
    ]);
    SP3.amber = mk(128, [
      [0, 'rgba(255,198,118,0.80)'],
      [0.32, 'rgba(245,164,82,0.34)'],
      [0.68, 'rgba(210,122,52,0.09)'],
      [1, 'rgba(180,95,38,0)'],
    ]);
    SP3.dotWarm = mk(64, [
      [0, 'rgba(255,220,152,0.95)'],
      [0.35, 'rgba(255,180,100,0.32)'],
      [1, 'rgba(235,140,70,0)'],
    ]);
  }

  // =========================================================================
  // CẢNH 1 · SC.cauthang (cầu thang bê tông 1 giờ sáng, tối lạnh)
  // =========================================================================
  const [stairC, stairG] = layer();
  let stairBaked = false;

  // Hằng số kiến trúc cầu thang (mét)
  const WALL_Z = 5.80;
  const LAND_Y = 1.05;
  const S1_X0 = -1.65;
  const S1_X1 = 0.25;
  const S1_Z0 = 3.90;
  const S1_Z1 = 4.85;
  const S1_N = 7;
  const S2_X0 = 1.15;
  const S2_X1 = 2.45;
  const S2_Z0 = 4.95;
  const S2_Z1 = 6.95;
  const S2_Y1 = 2.25;
  const S2_N = 8;
  const WIN = { x0: -2.10, x1: -0.58, y0: 1.48, y1: 2.66, z: WALL_Z };
  const IRON_BOX = { x0: 0.64, x1: 1.06, y0: 0.0, y1: 0.24, z0: 4.35, z1: 4.72 };
  const PHONE_STEP = 3; // bậc thứ 4 (chỉ số 0..6)

  // Toạ độ sẵn tính một lần
  let phoneBot = [];
  let phoneTop = [];
  let phoneCenter = [0, 0];
  let phoneStepBounds = null;
  let winBox = null;
  let wallSweepPoly = [];
  let wallRightX = 916;
  let stair2ClipPoly = [];
  let landRect = null;
  let hwyLine = { a: [0, 0], b: [0, 0] };

  // Dãy 4 chữ số 7 vạch (0 1 : 0 0) mờ trên tường đối diện ô thoáng
  const CLOCK_BOX = { x: 708, y: 212, w: 168, h: 54 };
  const CLOCK_SEGS = [];
  const CLOCK_COLONS = [];
  const CLOCK_LIT_THRESHOLD = 0.24;

  function makeHexSegPts(x0, y0, x1, y1, ht, horiz) {
    if (horiz) {
      return [
        [x0, y0],
        [x0 + ht, y0 - ht],
        [x1 - ht, y0 - ht],
        [x1, y0],
        [x1 - ht, y0 + ht],
        [x0 + ht, y0 + ht],
      ];
    }
    return [
      [x0, y0],
      [x0 + ht, y0 + ht],
      [x0 + ht, y1 - ht],
      [x0, y1],
      [x0 - ht, y1 - ht],
      [x0 - ht, y0 + ht],
    ];
  }

  function initClockData() {
    if (CLOCK_SEGS.length) return;
    const xOffsets = [0, 42, 98, 140];
    const dw = 28;
    const dh = 54;
    const midY = CLOCK_BOX.y + dh * 0.5;
    const pad = 2.6;
    const ht = 2.2;
    for (let d = 0; d < 4; d++) {
      const dx = CLOCK_BOX.x + xOffsets[d];
      const dy = CLOCK_BOX.y;
      const defs = [
        makeHexSegPts(dx + pad, dy + 2, dx + dw - pad, dy + 2, ht, true),              // 0: a trên
        makeHexSegPts(dx + dw - 2, dy + pad, dx + dw - 2, midY - pad * 0.6, ht, false), // 1: b trên-phải
        makeHexSegPts(dx + dw - 2, midY + pad * 0.6, dx + dw - 2, dy + dh - pad, ht, false), // 2: c dưới-phải
        makeHexSegPts(dx + pad, dy + dh - 2, dx + dw - pad, dy + dh - 2, ht, true),    // 3: d dưới
        makeHexSegPts(dx + 2, midY + pad * 0.6, dx + 2, dy + dh - pad, ht, false),     // 4: e dưới-trái
        makeHexSegPts(dx + 2, dy + pad, dx + 2, midY - pad * 0.6, ht, false),          // 5: f trên-trái
        makeHexSegPts(dx + pad, midY, dx + dw - pad, midY, ht, true),                  // 6: g giữa
      ];
      for (let s = 0; s < 7; s++) {
        const pts = defs[s];
        let sx = 0;
        let sy = 0;
        for (let k = 0; k < pts.length; k++) {
          sx += pts[k][0];
          sy += pts[k][1];
        }
        CLOCK_SEGS.push({
          d,
          s,
          pts,
          cx: sx / pts.length,
          cy: sy / pts.length,
          lit: !!(CT.vach[d] && CT.vach[d][s]),
        });
      }
    }
    const colonX = CLOCK_BOX.x + 84;
    CLOCK_COLONS.push([colonX, CLOCK_BOX.y + 16], [colonX, CLOCK_BOX.y + 38]);
  }

  function initStairGeom() {
    // 1. Vùng ô cửa sổ trên tường chiếu nghỉ
    const wTL = P(WIN.x0, WIN.y1, WIN.z);
    const wBR = P(WIN.x1, WIN.y0, WIN.z);
    winBox = { x: wTL[0], y: wTL[1], w: wBR[0] - wTL[0], h: wBR[1] - wTL[1] };
    hwyLine.a = [winBox.x + 2, winBox.y + winBox.h * 0.72];
    hwyLine.b = [winBox.x + winBox.w - 2, winBox.y + winBox.h * 0.69];

    // 2. Vùng tường phẳng chiếu nghỉ để vệt đèn xe quét ngang (dừng đúng mép hốc cầu thang Vế 2)
    const wallRTop = P(S2_X0 + 0.01, 3.28, WALL_Z);
    wallRightX = wallRTop[0];
    wallSweepPoly = [
      P(WIN.x0 + 0.04, LAND_Y + 0.02, WALL_Z),
      P(S2_X0 + 0.01, LAND_Y + 0.02, WALL_Z),
      wallRTop,
      P(WIN.x0 + 0.04, 3.28, WALL_Z),
    ];
    initClockData();

    const lA = P(S1_X1, LAND_Y, S1_Z0);
    const lB = P(S2_X1, LAND_Y, WALL_Z);
    landRect = { x0: lA[0], y0: lB[1], x1: lB[0], y1: lA[1] };

    // 3. Đa giác phần hở đi lên Vế 2 bên phải (đầu cầu thang)
    const uTL = P(S2_X0 - 0.04, 3.28, S2_Z1);
    const uTR = P(S2_X1 + 0.04, 3.28, S2_Z1);
    const uBR = P(S2_X1 + 0.04, LAND_Y, S2_Z0);
    const uBL = P(S2_X0 - 0.04, LAND_Y, S2_Z0);
    stair2ClipPoly = [uTL, uTR, uBR, uBL];

    HOT.dau_cau_thang = {
      x: Math.round(Math.min(uTL[0], uBL[0]) - 8),
      y: Math.round(clamp(uTL[1], 100, 740)),
      w: Math.round(Math.max(uTR[0], uBR[0]) - Math.min(uTL[0], uBL[0]) + 16),
      h: Math.round(clamp(uBR[1], 160, 780) - clamp(uTL[1], 100, 740)),
    };

    // 4. Hộp sắt nhỏ dưới gầm cầu thang
    const bxA = P(IRON_BOX.x0, IRON_BOX.y1, IRON_BOX.z0);
    const bxB = P(IRON_BOX.x1, IRON_BOX.y0, IRON_BOX.z0);
    const bxC = P(IRON_BOX.x1, IRON_BOX.y1, IRON_BOX.z1);
    const bxMinX = Math.min(bxA[0], bxB[0], bxC[0]);
    const bxMaxX = Math.max(bxA[0], bxB[0], bxC[0]);
    const bxMinY = Math.min(bxA[1], bxC[1]);
    const bxMaxY = bxB[1];
    HOT.hop_sat = {
      x: Math.round(bxMinX - 24),
      y: Math.round(clamp(bxMinY - 22, 100, 740)),
      w: Math.round(Math.max(96, bxMaxX - bxMinX + 48)),
      h: Math.round(Math.max(82, bxMaxY - bxMinY + 42)),
    };

    // 5. Điện thoại úp trên bậc thang thứ 4
    const stepW = (S1_X1 - S1_X0) / S1_N;
    const stepH = LAND_Y / S1_N;
    const px0 = S1_X0 + PHONE_STEP * stepW;
    const px1 = px0 + stepW;
    const py = (PHONE_STEP + 1) * stepH;
    const pz0 = S1_Z0;
    const pz1 = S1_Z1;
    const phCX = (px0 + px1) * 0.52;
    const phCZ = (pz0 + pz1) * 0.45;
    const phThick = 0.012;
    const corners = [
      [phCX - 0.056, phCZ - 0.095],
      [phCX + 0.044, phCZ - 0.105],
      [phCX + 0.064, phCZ + 0.088],
      [phCX - 0.036, phCZ + 0.098],
    ];
    phoneBot = corners.map((q) => P(q[0], py, q[1]));
    phoneTop = corners.map((q) => P(q[0], py + phThick, q[1]));
    phoneCenter = P(phCX, py, phCZ);

    const pL = P(px0, py, pz1);
    const pR = P(px1, py, pz0);
    phoneStepBounds = {
      x: Math.min(pL[0], pR[0]) - 22,
      y: Math.min(pL[1], pR[1]) - 18,
      w: Math.abs(pR[0] - pL[0]) + 44,
      h: Math.abs(pR[1] - pL[1]) + 34,
    };

    const pmx0 = Math.min(phoneBot[0][0], phoneBot[1][0], phoneBot[2][0], phoneBot[3][0]);
    const pmx1 = Math.max(phoneBot[0][0], phoneBot[1][0], phoneBot[2][0], phoneBot[3][0]);
    const pmy0 = Math.min(phoneTop[0][1], phoneTop[1][1], phoneTop[2][1], phoneTop[3][1]);
    const pmy1 = Math.max(phoneBot[0][1], phoneBot[1][1], phoneBot[2][1], phoneBot[3][1]);
    HOT.dien_thoai = {
      x: Math.round(pmx0 - 32),
      y: Math.round(clamp(pmy0 - 32, 100, 740)),
      w: Math.round(Math.max(108, pmx1 - pmx0 + 64)),
      h: Math.round(Math.max(82, pmy1 - pmy0 + 64)),
      at: phoneCenter,
    };
  }

  function bakeStairs() {
    buildSprites();
    initStairGeom();
    stairC.width = Math.max(1, cv.width);
    stairC.height = Math.max(1, cv.height);
    cseed = 41;

    const c = stairG;
    setT(c);

    // 1. Nền rất tối, lạnh xanh xám (1 giờ sáng)
    c.fillStyle = '#05070b';
    c.fillRect(-300, -300, W + 600, H + 600);

    // Tường hậu tầng trệt + chiếu nghỉ (z = WALL_Z)
    let gr = c.createLinearGradient(0, 90, 0, 620);
    gr.addColorStop(0, '#090e15');
    gr.addColorStop(0.45, '#101822');
    gr.addColorStop(1, '#070a0f');
    poly(c, [P(-2.65, 0, WALL_Z), P(2.65, 0, WALL_Z), P(2.65, 3.40, WALL_Z), P(-2.65, 3.40, WALL_Z)], gr);

    // Trần bê tông
    poly(c, [P(-2.65, 3.40, 2.3), P(2.65, 3.40, 2.3), P(2.65, 3.40, WALL_Z), P(-2.65, 3.40, WALL_Z)], '#06080c');

    // Tường trái (bỏ trống góc trên-trái cho drawBack)
    gr = c.createLinearGradient(P(-2.55, 0, 2.3)[0], 0, P(-2.55, 0, WALL_Z)[0], 0);
    gr.addColorStop(0, '#05070b');
    gr.addColorStop(0.65, '#090e14');
    gr.addColorStop(1, '#0e1620');
    poly(c, [P(-2.55, 0, 2.3), P(-2.55, 3.40, 2.3), P(-2.55, 3.40, WALL_Z), P(-2.55, 0, WALL_Z)], gr);

    // Tường phải
    gr = c.createLinearGradient(P(2.55, 0, WALL_Z)[0], 0, P(2.55, 0, 2.3)[0], 0);
    gr.addColorStop(0, '#0d141d');
    gr.addColorStop(0.6, '#080c12');
    gr.addColorStop(1, '#05070a');
    poly(c, [P(2.55, 0, 2.3), P(2.55, 3.40, 2.3), P(2.55, 3.40, WALL_Z), P(2.55, 0, WALL_Z)], gr);

    // Sàn bê tông tầng trệt (giữ phần dưới y 680..780 tối trầm cho phụ đề)
    gr = c.createLinearGradient(0, P(0, 0, WALL_Z)[1], 0, P(0, 0, 2.5)[1]);
    gr.addColorStop(0, '#070a0f');
    gr.addColorStop(0.45, '#0a0f16');
    gr.addColorStop(1, '#05070a');
    poly(c, [P(-2.55, 0, 2.3), P(2.55, 0, 2.3), P(2.55, 0, WALL_Z), P(-2.55, 0, WALL_Z)], gr);

    // Mạch sàn bê tông rất mờ
    for (let x = -2.0; x <= 2.0; x += 0.65) {
      seg(c, P(x, 0, 2.4), P(x, 0, WALL_Z), 0.7, 'rgba(130,155,180,0.035)');
    }
    for (let z = 3.0; z <= WALL_Z; z += 0.7) {
      seg(c, P(-2.55, 0, z), P(2.55, 0, z), 0.7, 'rgba(130,155,180,0.03)');
    }

    // 2. Ô thoáng / ô cửa lớn trên tường nhìn ra đường cao tốc xa
    const wx = winBox.x, wy = winBox.y, ww = winBox.w, wh = winBox.h;
    c.save();
    c.beginPath();
    c.rect(wx, wy, ww, wh);
    c.clip();

    // Bầu trời đêm 1 giờ sáng lạnh
    gr = c.createLinearGradient(0, wy, 0, wy + wh);
    gr.addColorStop(0, '#050a14');
    gr.addColorStop(0.58, '#0c1829');
    gr.addColorStop(0.84, '#132438');
    gr.addColorStop(1, '#08101b');
    c.fillStyle = gr;
    c.fillRect(wx, wy, ww, wh);

    // Vài chấm sao mờ rất thưa
    for (let i = 0; i < 12; i++) {
      c.fillStyle = `rgba(180,208,242,${0.12 + crnd() * 0.2})`;
      c.fillRect(wx + 12 + crnd() * (ww - 24), wy + 10 + crnd() * (wh * 0.48), 1.3, 1.3);
    }

    // Dải đồi xa đen
    c.fillStyle = '#070c14';
    c.beginPath();
    c.moveTo(wx, wy + wh);
    for (let x = 0; x <= ww; x += 14) {
      const y = wy + wh * 0.62 + Math.sin(x * 0.032 + 0.5) * 6 + Math.cos(x * 0.07) * 3;
      c.lineTo(wx + x, y);
    }
    c.lineTo(wx + ww, wy + wh);
    c.closePath();
    c.fill();

    // Đường cao tốc xa hơi cong theo chân đồi + dải đèn cao áp thưa xa dần
    c.strokeStyle = 'rgba(72,96,125,0.24)';
    c.lineWidth = 1.8;
    const hwyMidX = (hwyLine.a[0] + hwyLine.b[0]) * 0.5;
    const hwyMidY = (hwyLine.a[1] + hwyLine.b[1]) * 0.5 - 3;
    c.beginPath();
    c.moveTo(hwyLine.a[0], hwyLine.a[1]);
    c.quadraticCurveTo(hwyMidX, hwyMidY, hwyLine.b[0], hwyLine.b[1]);
    c.stroke();

    c.globalCompositeOperation = 'lighter';
    const lampUs = [0.07, 0.19, 0.33, 0.49, 0.65, 0.79, 0.91];
    for (let i = 0; i < lampUs.length; i++) {
      const u = lampUs[i];
      const uInv = 1 - u;
      const lx = uInv * uInv * hwyLine.a[0] + 2 * uInv * u * hwyMidX + u * u * hwyLine.b[0];
      const ly = uInv * uInv * hwyLine.a[1] + 2 * uInv * u * hwyMidY + u * u * hwyLine.b[1] - 2.4;
      const d = 10 - i * 0.6;
      c.globalAlpha = 0.36 - i * 0.025;
      c.drawImage(SP3.dotWarm, lx - d * 0.5, ly - d * 0.5, d, d);
      c.globalAlpha = 0.68 - i * 0.04;
      c.fillStyle = i % 3 === 1 ? 'rgb(218,232,248)' : 'rgb(255,204,132)';
      c.fillRect(lx - 0.7, ly - 0.7, 1.4, 1.4);
    }
    // Một cặp đèn xe đứng rất xa ở mép phải đường cao tốc
    c.globalAlpha = 0.42;
    c.drawImage(SP3.dotWarm, hwyLine.b[0] - 28, hwyLine.b[1] - 6, 8, 8);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';

    // Bóng tường rào doanh trại & tán cây tối sát bậu cửa sổ
    c.fillStyle = '#04060a';
    c.beginPath();
    c.moveTo(wx, wy + wh);
    c.lineTo(wx, wy + wh * 0.84);
    c.lineTo(wx + ww * 0.42, wy + wh * 0.86);
    c.quadraticCurveTo(wx + ww * 0.68, wy + wh * 0.79, wx + ww, wy + wh * 0.85);
    c.lineTo(wx + ww, wy + wh);
    c.closePath();
    c.fill();
    c.restore();

    // Bậu sâu & khung xi măng của ô cửa sổ + 4 song sắt đứng
    const dIn = 0.16;
    const oTL = P(WIN.x0, WIN.y1, WIN.z);
    const oTR = P(WIN.x1, WIN.y1, WIN.z);
    const oBR = P(WIN.x1, WIN.y0, WIN.z);
    const oBL = P(WIN.x0, WIN.y0, WIN.z);
    const iTR = P(WIN.x1, WIN.y1, WIN.z + dIn);
    const iBR = P(WIN.x1, WIN.y0, WIN.z + dIn);
    const iBL = P(WIN.x0, WIN.y0, WIN.z + dIn);
    poly(c, [oTR, iTR, iBR, oBR], '#0b1118');
    poly(c, [oBL, iBL, iBR, oBR], '#141e29');
    seg(c, oBL, oBR, 1.5, 'rgba(130,165,205,0.22)');
    seg(c, oTL, oTR, 1.0, 'rgba(90,115,145,0.16)');

    for (let i = 1; i <= 4; i++) {
      const bx = lerp(WIN.x0, WIN.x1, i / 5);
      tube3(c, [bx, WIN.y0, WIN.z + 0.04], [bx, WIN.y1, WIN.z + 0.04], 0.012, 0.35, 'rgba(145,180,215,0.20)');
    }
    tube3(c, [WIN.x0, (WIN.y0 + WIN.y1) * 0.5, WIN.z + 0.04], [WIN.x1, (WIN.y0 + WIN.y1) * 0.5, WIN.z + 0.04], 0.010, 0.25);

    // Dãy 4 chữ số 7 vạch (88:88) hằn RẤT mờ trên tường đối diện ô thoáng, gần như không thấy
    initClockData();
    c.fillStyle = 'rgba(150,185,220,0.011)';
    for (let i = 0; i < CLOCK_SEGS.length; i++) {
      const pts = CLOCK_SEGS[i].pts;
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]);
      c.closePath();
      c.fill();
    }
    for (let i = 0; i < CLOCK_COLONS.length; i++) {
      const cp = CLOCK_COLONS[i];
      c.beginPath();
      c.arc(cp[0], cp[1], 2.2, 0, Math.PI * 2);
      c.fill();
    }

    // Ánh sáng đêm lạnh yếu từ ô cửa hắt xuống bức tường bên dưới ô cửa
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.22;
    c.drawImage(SP3.cold, wx - 40, wy + wh * 0.4, ww + 120, wh * 1.45);
    c.restore();

    // 3. Vế 2 cầu thang đi sâu lên đầu cầu thang bên phải (vẽ trước chiếu nghỉ & vế 1)
    const s2BackZ = S2_Z1 + 0.7;
    poly(
      c,
      [P(S2_X0, LAND_Y, S2_Z0), P(2.55, LAND_Y, S2_Z0), P(2.55, 3.40, S2_Z0), P(S2_X0, 3.40, S2_Z0)],
      '#05070b'
    );
    // Tường hậu hốc Vế 2 (ở đầu cầu thang tầng trên)
    gr = c.createLinearGradient(0, P(S2_X0, 3.40, s2BackZ)[1], 0, P(S2_X0, LAND_Y, s2BackZ)[1]);
    gr.addColorStop(0, '#131d28');
    gr.addColorStop(0.55, '#0b1118');
    gr.addColorStop(1, '#06080c');
    poly(
      c,
      [P(S2_X0, LAND_Y, s2BackZ), P(2.55, LAND_Y, s2BackZ), P(2.55, 3.40, s2BackZ), P(S2_X0, 3.40, s2BackZ)],
      gr
    );
    // Vách hông trái của hốc Vế 2
    gr = c.createLinearGradient(P(S2_X0, 0, WALL_Z)[0], 0, P(S2_X0, 0, s2BackZ)[0] + 40, 0);
    gr.addColorStop(0, '#121a24');
    gr.addColorStop(1, '#070a0f');
    poly(
      c,
      [P(S2_X0, LAND_Y, WALL_Z), P(S2_X0, 3.40, WALL_Z), P(S2_X0, 3.40, s2BackZ), P(S2_X0, LAND_Y, s2BackZ)],
      gr
    );

    // Bậc thang Vế 2 đi lên tầng trên (nguồn sáng lạnh yếu từ đầu cầu thang rọi nhẹ xuống mũi bậc trên)
    const s2dz = (S2_Z1 - S2_Z0) / S2_N;
    const s2dy = (S2_Y1 - LAND_Y) / S2_N;
    for (let i = S2_N - 1; i >= 0; i--) {
      const z0 = S2_Z0 + i * s2dz;
      const z1 = z0 + s2dz;
      const y0 = LAND_Y + i * s2dy;
      const y1 = y0 + s2dy;
      const kTop = 0.25 + (i / S2_N) * 0.55;
      // Cổ bậc hướng về phía trước
      poly(
        c,
        [P(S2_X0, y0, z0), P(S2_X1, y0, z0), P(S2_X1, y1, z0), P(S2_X0, y1, z0)],
        `rgb(${(15 + 14 * kTop) | 0},${(22 + 18 * kTop) | 0},${(30 + 24 * kTop) | 0})`
      );
      // Mặt bậc
      poly(
        c,
        [P(S2_X0, y1, z0), P(S2_X1, y1, z0), P(S2_X1, y1, z1), P(S2_X0, y1, z1)],
        `rgb(${(19 + 18 * kTop) | 0},${(27 + 22 * kTop) | 0},${(37 + 28 * kTop) | 0})`
      );
      seg(c, P(S2_X0, y1, z0), P(S2_X1, y1, z0), 1.1, `rgba(145,180,220,${0.12 + 0.24 * kTop})`);
    }
    // Sàn đầu cầu thang tầng trên & quầng sáng lạnh yếu hắt ra từ trên
    poly(c, [P(S2_X0, S2_Y1, S2_Z1), P(2.55, S2_Y1, S2_Z1), P(2.55, S2_Y1, s2BackZ), P(S2_X0, S2_Y1, s2BackZ)], '#172330');
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.34;
    const headPt = P((S2_X0 + S2_X1) * 0.5, S2_Y1 + 0.35, S2_Z1);
    c.drawImage(SP3.cold, headPt[0] - 170, headPt[1] - 140, 340, 280);
    c.restore();

    // Tay vịn sắt Vế 2 đi lên đầu cầu thang
    tube3(c, [S2_X0 + 0.04, LAND_Y + 0.84, S2_Z0], [S2_X0 + 0.04, S2_Y1 + 0.84, S2_Z1], 0.017, 0.52);
    for (let i = 0; i <= 4; i++) {
      const u = i / 4;
      const pz = lerp(S2_Z0, S2_Z1, u);
      const py = lerp(LAND_Y, S2_Y1, u);
      tube3(c, [S2_X0 + 0.04, py, pz], [S2_X0 + 0.04, py + 0.84, pz], 0.012, 0.42);
    }

    // 4. Hốc tối GẦM CẦU THANG dưới chiếu nghỉ & vế 1 (vùng tối sâu nhất)
    // Tường hậu sâu dưới chiếu nghỉ (z = WALL_Z, y = 0 .. LAND_Y - 0.16)
    gr = c.createLinearGradient(P(-0.2, 0, WALL_Z)[0], 0, P(2.5, 0, WALL_Z)[0], 0);
    gr.addColorStop(0, '#070a0f');
    gr.addColorStop(0.5, '#040508');
    gr.addColorStop(1, '#030406');
    poly(c, [P(-0.4, 0, WALL_Z), P(2.55, 0, WALL_Z), P(2.55, LAND_Y - 0.14, WALL_Z), P(-0.4, LAND_Y - 0.14, WALL_Z)], gr);

    // Mảng tường cột đỡ dưới mép chiếu nghỉ bên phải (tạo hốc gầm cầu thang rõ)
    poly(c, [P(2.15, 0, S1_Z0), P(2.55, 0, S1_Z0), P(2.55, LAND_Y, S1_Z0), P(2.15, LAND_Y, S1_Z0)], '#070a0e');
    poly(c, [P(2.15, 0, S1_Z0), P(2.15, 0, WALL_Z), P(2.15, LAND_Y, WALL_Z), P(2.15, LAND_Y, S1_Z0)], '#040608');

    // Mặt trần xiên dưới gầm cầu thang & gầm chiếu nghỉ
    poly(c, [P(S1_X1, LAND_Y - 0.16, S1_Z0), P(2.15, LAND_Y - 0.16, S1_Z0), P(2.15, LAND_Y - 0.16, WALL_Z), P(S1_X1, LAND_Y - 0.16, WALL_Z)], '#05070a');
    poly(c, [P(S1_X0, 0, S1_Z0), P(S1_X1, LAND_Y - 0.16, S1_Z0), P(S1_X1, LAND_Y - 0.16, S1_Z1), P(S1_X0, 0, S1_Z1)], '#05070a');

    // Hộp sắt nhỏ dưới gầm cầu thang (đặt trên sàn tối, có viền lạnh rất mảnh + quai + khoá nhỏ)
    const bx0 = IRON_BOX.x0, bx1 = IRON_BOX.x1, by0 = IRON_BOX.y0, by1 = IRON_BOX.y1, bz0 = IRON_BOX.z0, bz1 = IRON_BOX.z1;
    // Bóng tiếp xúc sát chân hộp trên sàn
    poly(
      c,
      [P(bx0 - 0.04, 0.002, bz0 - 0.03), P(bx1 + 0.06, 0.002, bz0 - 0.03), P(bx1 + 0.08, 0.002, bz1 + 0.04), P(bx0 - 0.02, 0.002, bz1 + 0.04)],
      'rgba(1,2,4,0.82)'
    );
    box(c, bx0, bx1, by0, by1, bz0, bz1, [34, 42, 50], 0.36, true);
    // Viền sáng lạnh mảnh ở mép trên nắp hộp & đường gờ nắp + chốt khoá kim loại nhỏ phía trước
    seg(c, P(bx0, by1, bz0), P(bx1, by1, bz0), 1.1, 'rgba(150,185,220,0.28)');
    const lidY = by1 - 0.055;
    seg(c, P(bx0, lidY, bz0), P(bx1, lidY, bz0), 1.3, 'rgba(6,8,12,0.85)');
    seg(c, P(bx0, lidY - 0.004, bz0), P(bx1, lidY - 0.004, bz0), 0.9, 'rgba(140,170,200,0.24)');
    const clA = P((bx0 + bx1) * 0.5 - 0.03, lidY - 0.025, bz0);
    const clB = P((bx0 + bx1) * 0.5 + 0.03, lidY + 0.025, bz0);
    c.fillStyle = '#2a333e';
    c.fillRect(clA[0], clB[1], clB[0] - clA[0], clA[1] - clB[1]);
    c.strokeStyle = 'rgba(155,185,215,0.32)';
    c.lineWidth = 1;
    c.strokeRect(clA[0], clB[1], clB[0] - clA[0], clA[1] - clB[1]);
    c.fillStyle = '#070a0e';
    c.fillRect((clA[0] + clB[0]) * 0.5 - 1.5, (clB[1] + clA[1]) * 0.5 - 3, 3, 6);
    // Tay xách dẹt trên nắp hộp
    seg(c, P(bx0 + 0.10, by1 + 0.014, (bz0 + bz1) * 0.5), P(bx1 - 0.10, by1 + 0.014, (bz0 + bz1) * 0.5), 1.8, 'rgba(130,158,188,0.32)');

    // 5. Chiếu nghỉ (mặt phẳng ngang y = LAND_Y, mép phải x = S1_X1 .. 2.55, z = S1_Z0 .. WALL_Z)
    poly(
      c,
      [P(S1_X1, LAND_Y, S1_Z0), P(2.55, LAND_Y, S1_Z0), P(2.55, LAND_Y, S2_Z0), P(S1_X1, LAND_Y, S2_Z0)],
      '#131b24'
    );
    poly(
      c,
      [P(S1_X1, LAND_Y, S2_Z0), P(S2_X0, LAND_Y, S2_Z0), P(S2_X0, LAND_Y, WALL_Z), P(S1_X1, LAND_Y, WALL_Z)],
      '#111821'
    );
    // Mặt gờ trước dày của bản chiếu nghỉ
    poly(
      c,
      [P(S1_X1, LAND_Y - 0.16, S1_Z0), P(2.55, LAND_Y - 0.16, S1_Z0), P(2.55, LAND_Y, S1_Z0), P(S1_X1, LAND_Y, S1_Z0)],
      '#0b1017'
    );
    seg(c, P(S1_X1, LAND_Y, S1_Z0), P(2.55, LAND_Y, S1_Z0), 1.4, 'rgba(145,178,215,0.20)');

    // 6. Vế 1 cầu thang (7 bậc đi lên từ trái-trước sang chiếu nghỉ)
    const dx1 = (S1_X1 - S1_X0) / S1_N;
    const dy1 = LAND_Y / S1_N;

    // Dầm thang nghiêng bên dưới các bậc (mặt z = S1_Z0)
    const beamPts = [];
    for (let i = 0; i < S1_N; i++) {
      const x0 = S1_X0 + i * dx1;
      const x1 = x0 + dx1;
      const y1 = (i + 1) * dy1;
      const y0 = i * dy1;
      beamPts.push(P(x0, y0, S1_Z0));
      beamPts.push(P(x0, y1, S1_Z0));
      beamPts.push(P(x1, y1, S1_Z0));
    }
    beamPts.push(P(S1_X1, LAND_Y - 0.16, S1_Z0));
    beamPts.push(P(S1_X0 + 0.18, 0, S1_Z0));
    beamPts.push(P(S1_X0, 0, S1_Z0));
    poly(c, beamPts, '#0c1118');

    // Mặt trên & cổ bậc của từng bậc trong Vế 1
    for (let i = 0; i < S1_N; i++) {
      const x0 = S1_X0 + i * dx1;
      const x1 = x0 + dx1;
      const y0 = i * dy1;
      const y1 = (i + 1) * dy1;
      const kStep = 0.34 + (i / S1_N) * 0.28;
      // Cổ bậc (hướng trái)
      poly(
        c,
        [P(x0, y0, S1_Z0), P(x0, y1, S1_Z0), P(x0, y1, S1_Z1), P(x0, y0, S1_Z1)],
        `rgb(${(15 + 12 * kStep) | 0},${(22 + 15 * kStep) | 0},${(30 + 18 * kStep) | 0})`
      );
      // Mặt bậc
      poly(
        c,
        [P(x0, y1, S1_Z0), P(x1, y1, S1_Z0), P(x1, y1, S1_Z1), P(x0, y1, S1_Z1)],
        `rgb(${(18 + 16 * kStep) | 0},${(26 + 20 * kStep) | 0},${(35 + 24 * kStep) | 0})`
      );
      // Mép mũi bậc bắt ánh sáng lạnh nhẹ
      seg(c, P(x0, y1, S1_Z0), P(x0, y1, S1_Z1), 1.3, `rgba(145,178,215,${0.12 + 0.16 * kStep})`);
      seg(c, P(x0, y1, S1_Z0), P(x1, y1, S1_Z0), 1.0, `rgba(125,155,190,${0.10 + 0.12 * kStep})`);
    }
    // Gờ chân tường men theo vế thang (phía tường sau S1_Z1)
    seg(c, P(S1_X0, 0.04, S1_Z1), P(S1_X1, LAND_Y + 0.04, S1_Z1), 2.0, 'rgba(8,12,18,0.85)');

    // Lan can sắt phía trước Vế 1 + chiếu nghỉ (đặt thưa để không che điện thoại ở bậc 4)
    const railH = 0.82;
    tube3(c, [S1_X0 + 0.08, 0, S1_Z0], [S1_X0 + 0.08, railH, S1_Z0], 0.015, 0.42);
    tube3(c, [S1_X1, LAND_Y, S1_Z0], [S1_X1, LAND_Y + railH, S1_Z0], 0.016, 0.48);
    tube3(c, [S2_X0, LAND_Y, S1_Z0], [S2_X0, LAND_Y + railH, S1_Z0], 0.016, 0.48);
    // Tay vịn chính chạy chéo lên chiếu nghỉ + nối sang mép lan can chiếu nghỉ
    tube3(c, [S1_X0 + 0.08, railH, S1_Z0], [S1_X1, LAND_Y + railH, S1_Z0], 0.018, 0.50);
    tube3(c, [S1_X1, LAND_Y + railH, S1_Z0], [S2_X0, LAND_Y + railH, S1_Z0], 0.018, 0.50);
    // Song ngang giữa
    tube3(c, [S1_X0 + 0.08, railH * 0.5, S1_Z0], [S1_X1, LAND_Y + railH * 0.5, S1_Z0], 0.010, 0.36);
    tube3(c, [S1_X1, LAND_Y + railH * 0.5, S1_Z0], [S2_X0, LAND_Y + railH * 0.5, S1_Z0], 0.010, 0.36);

    // Chấm bụi, vết ẩm bê tông rất nhẹ + hạt phim + viền tối 4 góc
    for (let i = 0; i < 2400; i++) {
      c.fillStyle = `rgba(${crnd() < 0.5 ? '200,220,245' : '0,0,0'},${crnd() * 0.025})`;
      c.fillRect(crnd() * W, crnd() * H, 1.8, 1.8);
    }
    grain(c, 10000, 0.022);
    vignette(c, 0.78);
    stairBaked = true;
  }

  function ensureStairBaked() {
    if (!stairBaked || stairC.width !== cv.width || stairC.height !== cv.height) bakeStairs();
  }

  // Vẽ chiếc điện thoại úp trên bậc thang khi CT.dt > 0
  function drawStairPhone(c, now, power) {
    const p = clamp(power, 0, 1);
    if (p <= 0.001) return;
    const t = now * 0.001;
    const breath = 0.82 + 0.18 * Math.sin(t * 2.2);
    const bodyAlpha = clamp(p * 3, 0, 1);
    const glow = p * breath;
    const ph = phoneCenter;

    c.save();
    // 1. Ánh sáng hắt lên mặt bậc thang và cổ bậc liền sau
    c.beginPath();
    c.rect(phoneStepBounds.x, phoneStepBounds.y - 30, phoneStepBounds.w, phoneStepBounds.h + 30);
    c.clip();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.72 * glow;
    c.drawImage(SP3.cold, ph[0] - 96, ph[1] - 34, 192, 72);
    c.globalAlpha = 0.42 * glow;
    c.drawImage(SP3.beam, ph[0] - 54, ph[1] - 18, 108, 38);
    c.restore();

    // 2. Khe sáng màn hình hở dọc cạnh thân máy
    c.save();
    c.globalAlpha = glow;
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = 'rgba(182,226,255,0.92)';
    c.lineWidth = 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(phoneBot[0][0], phoneBot[0][1] + 0.6);
    c.lineTo(phoneBot[3][0], phoneBot[3][1] + 0.6);
    c.lineTo(phoneBot[2][0], phoneBot[2][1] + 0.6);
    c.stroke();
    c.restore();

    // 3. Thân máy úp mặt xuống bậc thang
    c.save();
    c.globalAlpha = bodyAlpha;
    poly(c, [phoneBot[0], phoneBot[3], phoneTop[3], phoneTop[0]], '#10151d');
    poly(c, [phoneBot[0], phoneBot[1], phoneTop[1], phoneTop[0]], '#0c1017');
    poly(c, phoneTop, '#080b10');
    c.strokeStyle = `rgba(168,212,252,${0.25 + 0.25 * glow})`;
    c.lineWidth = 1.0;
    c.stroke();
    c.restore();
  }

  const _sweepDraw = { pTL: [0, 0], pTR: [0, 0], pBR: [0, 0], pBL: [0, 0], yTop: 0, yBot: 0, fade: 0, u: 0 };
  const _sweepQuery = { pTL: [0, 0], pTR: [0, 0], pBR: [0, 0], pBL: [0, 0], yTop: 0, yBot: 0, fade: 0, u: 0 };

  function evalHeadlightSweep(tRaw, chieu, out) {
    if (typeof tRaw !== 'number' || tRaw <= 0 || tRaw >= 1) return null;
    const t = clamp(tRaw, 0, 1);
    const ch = chieu === undefined ? (CT.xe ? CT.xe.chieu : 1) : chieu;
    const u = ch < 0 ? 1 - t : t;
    // Độ sáng vào mềm - giữ ổn định giữa tường - tan mềm ở mép phải
    const env = Math.sin(Math.PI * t);
    const fade = clamp(env * 1.35, 0, 1);
    if (fade <= 0.005) return null;

    // Vệt sáng hình thang (trượt ngang bức tường chiếu nghỉ từ trái sang phải, tan mềm hai mép trên/dưới)
    const xL = lerp(455, 760, u);
    const wTop = lerp(185, 295, u);
    const wBot = lerp(120, 205, u);
    const yTop = lerp(186, 152, u);
    const yBot = lerp(368, 404, u);

    out.pTL[0] = xL - 10; out.pTL[1] = yTop;
    out.pTR[0] = xL + wTop; out.pTR[1] = yTop - 14 * u;
    out.pBR[0] = xL + wBot; out.pBR[1] = yBot;
    out.pBL[0] = xL; out.pBL[1] = yBot - 6;
    out.yTop = yTop;
    out.yBot = yBot;
    out.fade = fade;
    out.u = u;
    return out;
  }

  function segSweepIntensity(px, py, sw) {
    if (!sw || sw.fade <= 0.005) return 0;
    if (px < winBox.x + winBox.w + 4 || px > wallRightX - 4) return 0;
    const fy = clamp((py - sw.yTop) / (sw.yBot - sw.yTop), 0, 1);
    const lx = lerp(sw.pTL[0], sw.pBL[0], fy);
    const rx = lerp(sw.pTR[0], sw.pBR[0], fy);
    const spanX = rx - lx;
    if (spanX <= 1) return 0;
    const ax = (px - lx) / spanX;
    if (ax <= 0.04 || ax >= 0.96) return 0;
    const ty = lerp(sw.pTL[1], sw.pTR[1], clamp(ax, 0, 1));
    const by = lerp(sw.pBL[1], sw.pBR[1], clamp(ax, 0, 1));
    const spanY = by - ty;
    if (spanY <= 1) return 0;
    const ay = (py - ty) / spanY;
    if (ay <= 0.04 || ay >= 0.96) return 0;

    let hProf = 0;
    if (ax < 0.18) hProf = (ax / 0.18) * 0.76;
    else if (ax < 0.54) hProf = lerp(0.76, 1.0, (ax - 0.18) / 0.36);
    else if (ax < 0.86) hProf = lerp(1.0, 0.59, (ax - 0.54) / 0.32);
    else hProf = lerp(0.59, 0.0, (ax - 0.86) / 0.14);

    const vProf = clamp(Math.min(ay, 1 - ay) / 0.12, 0, 1);
    return clamp(hProf * vProf * sw.fade, 0, 1);
  }

  window.CTX = { segs: () => { initClockData(); return CLOCK_SEGS; } };
  CT.vachSang = function vachSang(t, chieu) {
    initClockData();
    const tVal = t === undefined ? (CT.xe ? CT.xe.t : 0) : t;
    const chVal = chieu === undefined ? (CT.xe ? CT.xe.chieu : 1) : chieu;
    const sw = evalHeadlightSweep(tVal, chVal, _sweepQuery);
    const out = [];
    if (!sw) return out;
    for (let i = 0; i < CLOCK_SEGS.length; i++) {
      const seg = CLOCK_SEGS[i];
      if (!seg.lit) continue;
      if (segSweepIntensity(seg.cx, seg.cy, sw) >= CLOCK_LIT_THRESHOLD) {
        out.push([seg.d, seg.s]);
      }
    }
    return out;
  };

  // Hàm quét đèn xe: vệt sáng hình thang trượt ngang tường từ trái sang phải (CT.xe = { t: 0..1, chieu: 1 })
  function drawHeadlightSweep(c, tRaw, chieu) {
    const sw = evalHeadlightSweep(tRaw, chieu, _sweepDraw);
    if (!sw) return;
    const { pTL, pTR, pBR, pBL, yTop, yBot, fade, u } = sw;

    c.save();
    // Clip theo mặt tường chiếu nghỉ và TRỪ ô cửa sổ (tránh đè lên trời đêm ngoài cửa & không lơ lửng qua hốc cầu thang)
    c.beginPath();
    for (let i = 0; i < wallSweepPoly.length; i++) {
      const pt = wallSweepPoly[i];
      if (i) c.lineTo(pt[0], pt[1]);
      else c.moveTo(pt[0], pt[1]);
    }
    c.closePath();
    c.rect(winBox.x, winBox.y, winBox.w, winBox.h);
    c.clip('evenodd');

    c.globalCompositeOperation = 'lighter';

    // Vỏ sáng loang ngoài giúp biên hình thang mềm tự nhiên không cắt sắc cạnh
    for (let ring = 0; ring < 2; ring++) {
      const padX = ring === 0 ? 18 : 8;
      const padY = ring === 0 ? 14 : 6;
      c.fillStyle = `rgba(176,208,244,${(ring === 0 ? 0.055 : 0.09) * fade})`;
      c.beginPath();
      c.moveTo(pTL[0] - padX, pTL[1] - padY);
      c.lineTo(pTR[0] + padX, pTR[1] - padY);
      c.lineTo(pBR[0] + padX, pBR[1] + padY);
      c.lineTo(pBL[0] - padX, pBL[1] + padY);
      c.closePath();
      c.fill();
    }

    // 5 dải sáng lọt qua 5 ô kính (chỉ cộng sáng nhẹ theo từng khe song cửa, không tô đè xám tối lên tường)
    const gr = c.createLinearGradient(pTL[0], 0, pTR[0], 0);
    gr.addColorStop(0, 'rgba(182,214,248,0)');
    gr.addColorStop(0.18, `rgba(200,226,252,${0.26 * fade})`);
    gr.addColorStop(0.54, `rgba(222,238,255,${0.34 * fade})`);
    gr.addColorStop(0.86, `rgba(190,218,248,${0.20 * fade})`);
    gr.addColorStop(1, 'rgba(172,202,240,0)');
    c.fillStyle = gr;

    const gap = 0.014;
    for (let i = 0; i < 5; i++) {
      const a0 = i * 0.2 + (i > 0 ? gap : 0);
      const a1 = (i + 1) * 0.2 - (i < 4 ? gap : 0);
      const tx0 = lerp(pTL[0], pTR[0], a0);
      const ty0 = lerp(pTL[1], pTR[1], a0);
      const tx1 = lerp(pTL[0], pTR[0], a1);
      const ty1 = lerp(pTL[1], pTR[1], a1);
      const bx1 = lerp(pBL[0], pBR[0], a1);
      const by1 = lerp(pBL[1], pBR[1], a1);
      const bx0 = lerp(pBL[0], pBR[0], a0);
      const by0 = lerp(pBL[1], pBR[1], a0);
      c.beginPath();
      c.moveTo(tx0, ty0);
      c.lineTo(tx1, ty1);
      c.lineTo(bx1, by1);
      c.lineTo(bx0, by0);
      c.closePath();
      c.fill();
    }

    // Dải thanh ngang giữa khung cửa sổ lướt mờ cắt nhẹ qua giữa hình thang
    c.fillStyle = `rgba(188,216,246,${0.08 * fade})`;
    c.beginPath();
    c.moveTo(pTL[0], pTL[1]);
    c.lineTo(pTR[0], pTR[1]);
    c.lineTo(pBR[0], pBR[1]);
    c.lineTo(pBL[0], pBL[1]);
    c.closePath();
    c.fill();

    // Quầng ánh sáng hắt nhẹ lên mặt tường xung quanh hình thang
    c.globalAlpha = 0.26 * fade;
    c.drawImage(SP3.beam, (pTL[0] + pTR[0]) * 0.5 - 230, (yTop + yBot) * 0.5 - 160, 460, 320);

    // Làm sáng rõ CHỈ những vạch thuộc chữ số thật (0, 1, 0, 0) đang nằm trong vệt đèn xe
    for (let i = 0; i < CLOCK_SEGS.length; i++) {
      const seg = CLOCK_SEGS[i];
      if (!seg.lit) continue;
      const k = segSweepIntensity(seg.cx, seg.cy, sw);
      if (k < CLOCK_LIT_THRESHOLD) continue;
      const litK = clamp(((k - CLOCK_LIT_THRESHOLD) / (1 - CLOCK_LIT_THRESHOLD)) * 0.85 + 0.15, 0, 1);
      const pts = seg.pts;
      c.globalAlpha = 0.12 * litK;
      c.drawImage(SP3.beam, seg.cx - 18, seg.cy - 14, 36, 28);
      c.globalAlpha = 1;
      c.fillStyle = `rgba(208,234,255,${0.58 * litK})`;
      c.strokeStyle = `rgba(156,208,252,${0.22 * litK})`;
      c.lineWidth = 2.0;
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let m = 1; m < pts.length; m++) c.lineTo(pts[m][0], pts[m][1]);
      c.closePath();
      c.stroke();
      c.fill();
    }
    for (let i = 0; i < CLOCK_COLONS.length; i++) {
      const cp = CLOCK_COLONS[i];
      const k = segSweepIntensity(cp[0], cp[1], sw);
      if (k < CLOCK_LIT_THRESHOLD) continue;
      const litK = clamp(((k - CLOCK_LIT_THRESHOLD) / (1 - CLOCK_LIT_THRESHOLD)) * 0.85 + 0.15, 0, 1);
      c.globalAlpha = 0.12 * litK;
      c.drawImage(SP3.beam, cp[0] - 12, cp[1] - 12, 24, 24);
      c.globalAlpha = 1;
      c.fillStyle = `rgba(208,234,255,${0.58 * litK})`;
      c.beginPath();
      c.arc(cp[0], cp[1], 2.4, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // Hắt sáng nhẹ lên bậu ô cửa khi đèn xe đi ngang qua
    const winFlash = clamp(1 - Math.abs(u - 0.14) * 3.2, 0, 1) * fade;
    if (winFlash > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.26 * winFlash;
      c.drawImage(SP3.beam, winBox.x - 20, winBox.y + winBox.h * 0.2, winBox.w + 70, winBox.h);
      c.restore();
    }
  }

  function drawStairs(c, now, dt) {
    ensureStairBaked();

    if (CT._auto) {
      CT.xe.t += dt * 0.40;
      if (CT.xe.t >= 1) {
        CT.xe.t = 0;
        CT._auto = false;
      }
    }

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(stairC, 0, 0);
    setT(c);

    // 1. Đèn một chiếc xe nhỏ lướt rất chậm ngoài đường cao tốc xa (lớp tĩnh có hơi thở)
    const t = now * 0.001;
    const hwyProg = (t * 0.065) % 1;
    const hx = lerp(hwyLine.a[0], hwyLine.b[0], hwyProg);
    const hy = lerp(hwyLine.a[1], hwyLine.b[1], hwyProg) - 1;
    c.save();
    c.beginPath();
    c.rect(winBox.x, winBox.y, winBox.w, winBox.h);
    c.clip();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.45 * Math.sin(Math.PI * hwyProg);
    c.drawImage(SP3.beam, hx - 12, hy - 8, 24, 16);
    c.restore();

    // 2. Vệt sáng đèn pha xe quét ngang tường (hàm quét từ CT.xe)
    if (CT.xe && CT.xe.t > 0 && CT.xe.t < 1) {
      drawHeadlightSweep(c, CT.xe.t, CT.xe.chieu);
    }

    // 3. Ánh sáng lạnh rất yếu ở đầu cầu thang khẽ thở nhẹ
    const headBreath = 0.88 + 0.12 * Math.sin(t * 1.4);
    const headPt = P((S2_X0 + S2_X1) * 0.5, S2_Y1 + 0.3, S2_Z1);
    c.save();
    c.beginPath();
    for (let i = 0; i < stair2ClipPoly.length; i++) {
      const pt = stair2ClipPoly[i];
      if (i) c.lineTo(pt[0], pt[1]);
      else c.moveTo(pt[0], pt[1]);
    }
    c.closePath();
    c.clip();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.22 * headBreath;
    c.drawImage(SP3.cold, headPt[0] - 150, headPt[1] - 120, 300, 240);
    c.restore();

    // 4. Điện thoại úp trên bậc thang (bật bằng CT.dt 0..1)
    if (CT.dt > 0) {
      drawStairPhone(c, now, CT.dt);
    }
  }

  SC.cauthang = {
    bake: bakeStairs,
    enter() {
      ensureStairBaked();
      if (typeof nudge === 'function') nudge();
    },
    draw: drawStairs,
  };

  // =========================================================================
  // CẢNH 2 · SC.buctuong (cận cảnh bức tường 99 vạch phấn + lịch 10×10)
  // =========================================================================
  const [wallColdC, wallColdG] = layer();
  const [wallWarmC, wallWarmG] = layer();
  const [plasterColdC, plasterColdG] = layer();
  const [plasterWarmC, plasterWarmG] = layer();
  let wallBaked = false;
  let fontDirty = false;
  let plasterBox = { x: 0, y: 0, w: 0, h: 0 };

  try {
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(() => { fontDirty = true; });
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { fontDirty = true; });
    }
  } catch (e) {}

  // Lịch vẽ tay 10×10 (nằm gọn trong y 135..635, x 790..1320)
  const CAL = { x: 800, y: 140, w: 520, h: 490, cols: 10, rows: 10 };
  CAL.cw = CAL.w / CAL.cols;
  CAL.ch = CAL.h / CAL.rows;

  // Cấu hình 99 vạch phấn bên trái (4 hàng × 5 bó; 19 bó 5 + 1 bó 4 vạch = 99 vạch)
  const TALLY = { x0: 295, y0: 266, dx: 88, dy: 82 };
  // 3 bó bị nước mưa xoá mờ (hàng 2 từ trên xuống: chỉ số bó 11, 12, 13 -> bó thứ 12, 13, 14)
  const WASHED_INDICES = [11, 12, 13];

  function initWallGeom() {
    for (let i = 1; i <= 100; i++) {
      const idx = i - 1;
      const row = Math.floor(idx / 10);
      const col = idx % 10;
      const cx = CAL.x + (col + 0.5) * CAL.cw;
      const cy = CAL.y + (row + 0.5) * CAL.ch;
      BT.o[i] = { x: Math.round(cx * 10) / 10, y: Math.round(cy * 10) / 10, w: CAL.cw, h: CAL.ch };
    }

    // Vùng vạch bị nước mưa xoá mờ (3 bó: index 11, 12, 13 => hàng thứ 3, cột 1, 2, 3)
    const minCol = 1;
    const maxCol = 3;
    const rowW = 2;
    const gx0 = TALLY.x0 + minCol * TALLY.dx - 16;
    const gx1 = TALLY.x0 + maxCol * TALLY.dx + 58;
    const gy0 = TALLY.y0 + rowW * TALLY.dy - 14;
    const gy1 = gy0 + 66;
    BT.xoa = {
      x: Math.round(gx0),
      y: Math.round(gy0),
      w: Math.round(gx1 - gx0),
      h: Math.round(gy1 - gy0),
    };

    plasterBox = {
      x: CAL.x - 60,
      y: CAL.y - 34,
      w: CAL.w + 120,
      h: CAL.h + 62,
    };
  }

  let wseed = 97;
  const wrnd = () => ((wseed = (wseed * 16807) % 2147483647) / 2147483647);

  // Tập nét phấn được tạo một lần để bản lạnh và bản ấm giống hệt từng nét
  const TALLY_STROKES = [];
  const CRACKS = [];
  const CAL_JITTER = [];
  const PLASTER_POLY = [];
  let geomBuilt = false;

  function buildWallDataOnce() {
    if (geomBuilt) return;
    wseed = 97;

    // 1. 99 vạch phấn = 19 bó đủ (4 dọc + 1 chéo) + bó thứ 20 gồm 4 dọc
    for (let gIdx = 0; gIdx < 20; gIdx++) {
      const col = gIdx % 5;
      const row = Math.floor(gIdx / 5);
      const bx = TALLY.x0 + col * TALLY.dx + (wrnd() - 0.5) * 4;
      const by = TALLY.y0 + row * TALLY.dy + (wrnd() - 0.5) * 4;
      const washed = WASHED_INDICES.indexOf(gIdx) >= 0;
      const baseAlpha = washed ? 0.16 + wrnd() * 0.08 : 0.62 + wrnd() * 0.22;

      for (let v = 0; v < 4; v++) {
        const vx = bx + v * 11 + (wrnd() - 0.5) * 1.4;
        const vy0 = by + (wrnd() - 0.5) * 2.5;
        const vy1 = by + 39 + (wrnd() - 0.5) * 3.0;
        const tilt = (wrnd() - 0.5) * 2.8;
        TALLY_STROKES.push({
          x0: vx,
          y0: vy0,
          x1: vx + tilt,
          y1: vy1,
          w: washed ? 2.0 : 2.3 + wrnd() * 0.7,
          a: washed ? baseAlpha * (0.65 + wrnd() * 0.45) : baseAlpha,
          washed,
        });
      }
      // Bó 1..19 có thêm nét gạch chéo thứ 5; bó thứ 20 chỉ có 4 vạch dọc (tổng = 99!)
      if (gIdx < 19) {
        TALLY_STROKES.push({
          x0: bx - 5 + (wrnd() - 0.5) * 2,
          y0: by + 35 + (wrnd() - 0.5) * 2,
          x1: bx + 38 + (wrnd() - 0.5) * 2,
          y1: by + 5 + (wrnd() - 0.5) * 2,
          w: washed ? 2.1 : 2.5 + wrnd() * 0.6,
          a: washed ? baseAlpha * 0.75 : baseAlpha * 0.96,
          washed,
        });
      }
    }

    // 2. Các vết nứt nhỏ nhiều nhánh hữu cơ trên tường bê tông
    const crackDefs = [
      // Vết nứt mảnh chạy dọc vùng ẩm nước mưa
      { pts: [[472, 102], [469, 134], [474, 166], [467, 198], [477, 232], [473, 274], [483, 314], [492, 358], [488, 398], [496, 444], [504, 488], [499, 534], [507, 578], [514, 616]], w: 1.45 },
      { pts: [[477, 232], [456, 245], [438, 258], [418, 274], [404, 294]], w: 0.9 },
      { pts: [[492, 358], [514, 369], [541, 381], [568, 392], [591, 405]], w: 0.85 },
      { pts: [[504, 488], [486, 510], [472, 532]], w: 0.7 },
      // Vết nứt mảnh gần hốc vữa trên-giữa & mép phải
      { pts: [[684, 114], [699, 146], [718, 174], [731, 212], [744, 248], [759, 286]], w: 1.05 },
      { pts: [[718, 174], [746, 182], [768, 196]], w: 0.7 },
      { pts: [[1358, 186], [1374, 224], [1386, 266], [1379, 312], [1394, 356], [1406, 402]], w: 1.1 },
      { pts: [[1386, 266], [1408, 282], [1422, 304]], w: 0.65 },
      { pts: [[712, 566], [728, 594], [736, 622], [725, 650]], w: 0.95 },
    ];
    for (let i = 0; i < crackDefs.length; i++) CRACKS.push(crackDefs[i]);

    // 3. Độ run nhẹ của khung và chữ số lịch 1..100
    for (let i = 0; i <= 10; i++) {
      CAL_JITTER.push({
        dx: (wrnd() - 0.5) * 2.4,
        dy: (wrnd() - 0.5) * 2.4,
        rot: (wrnd() - 0.5) * 0.055,
      });
    }

    // 4. Đa giác rách lệch tự nhiên cho mảng vữa lớn (8 điểm mỗi cạnh = 32 đỉnh, luôn trùm kín 100% tờ lịch CAL)
    const padL = CAL.x - plasterBox.x;
    const padT = CAL.y - plasterBox.y;
    const minL = padL - 12;
    const maxR = padL + CAL.w + 12;
    const minT = padT - 10;
    const maxB = padT + CAL.h + 10;
    const stepsEdge = 8;
    const topBump = [-18, -22, -12, -8, -16, -24, -14, -10];
    const rightBump = [18, 34, 42, 26, 16, 30, 38, 22];
    const botBump = [14, 18, 10, 8, 16, 20, 12, 16];
    const leftBump = [-16, -34, -46, -38, -20, -32, -40, -22];

    for (let i = 0; i < stepsEdge; i++) {
      const t = i / stepsEdge;
      const px = lerp(minL + leftBump[7] * 0.4, maxR + rightBump[0] * 0.4, t);
      const py = clamp(minT + topBump[i] + (wrnd() - 0.5) * 4, 4, minT - 2);
      PLASTER_POLY.push([px, py]);
    }
    for (let i = 0; i < stepsEdge; i++) {
      const t = i / stepsEdge;
      const px = clamp(maxR + rightBump[i] + (wrnd() - 0.5) * 5, maxR + 4, plasterBox.w - 4);
      const py = lerp(minT + topBump[7] * 0.4, maxB + botBump[0] * 0.4, t);
      PLASTER_POLY.push([px, py]);
    }
    for (let i = 0; i < stepsEdge; i++) {
      const t = i / stepsEdge;
      const px = lerp(maxR + rightBump[7] * 0.4, minL + leftBump[0] * 0.4, t);
      const py = clamp(maxB + botBump[i] + (wrnd() - 0.5) * 4, maxB + 2, plasterBox.h - 4);
      PLASTER_POLY.push([px, py]);
    }
    for (let i = 0; i < stepsEdge; i++) {
      const t = i / stepsEdge;
      const px = clamp(minL + leftBump[i] + (wrnd() - 0.5) * 5, 4, minL - 4);
      const py = lerp(maxB + botBump[7] * 0.4, minT + topBump[0] * 0.4, t);
      PLASTER_POLY.push([px, py]);
    }

    geomBuilt = true;
  }

  function renderWallTheme(c, isWarm) {
    setT(c);
    cseed = 97;

    // 1. Khung tối rìa cầu thang & mảng tường bê tông lớn chiếm gần hết màn
    c.fillStyle = isWarm ? '#090604' : '#05070a';
    c.fillRect(-300, -300, W + 600, H + 600);

    // Mảng tường bê tông chính (trên 85% màn hình, rìa trái tối góc để chừa lối cầu thang đi xuống)
    const wallGr = c.createLinearGradient(0, 80, 0, 740);
    if (isWarm) {
      wallGr.addColorStop(0, '#18100a');
      wallGr.addColorStop(0.55, '#2b1c11');
      wallGr.addColorStop(1, '#3b2617');
    } else {
      wallGr.addColorStop(0, '#0a0f15');
      wallGr.addColorStop(0.55, '#121b25');
      wallGr.addColorStop(1, '#192431');
    }
    c.fillStyle = wallGr;
    c.fillRect(140, 60, 1340, 690);

    // Khe góc tường đầu cầu thang rất mờ ở rìa trái & mép dưới-trái (dấu hiệu từ cầu thang đi lên)
    const edgeGr = c.createLinearGradient(140, 0, 260, 0);
    edgeGr.addColorStop(0, isWarm ? 'rgba(6,4,2,0.9)' : 'rgba(3,5,8,0.9)');
    edgeGr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = edgeGr;
    c.fillRect(140, 60, 130, 690);

    // Chân gờ cầu thang tối thẫm ở đáy (y 675..790 sạch cho phụ đề)
    c.fillStyle = isWarm ? '#100a06' : '#080b10';
    c.fillRect(140, 672, 1340, 140);
    c.strokeStyle = isWarm ? 'rgba(255,196,120,0.16)' : 'rgba(135,170,210,0.14)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(140, 672);
    c.lineTo(1480, 672);
    c.stroke();

    // Nguồn sáng yếu từ dưới cầu thang hắt lên (dưới-giữa hắt lên tường)
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = isWarm ? 0.38 : 0.24;
    c.drawImage(isWarm ? SP3.amber : SP3.cold, 260, 220, 1080, 560);
    c.globalAlpha = isWarm ? 0.22 : 0.14;
    c.drawImage(isWarm ? SP3.amber : SP3.cold, 480, 360, 640, 380);
    c.restore();

    // 2. Loang ẩm loang mờ trên tường + vài mảng vữa bong nhiều lớp (viền vữa tróc -> lớp hồ xi măng -> lõi tối)
    const dampClusters = [
      [472, 240, 95, 110, 0.14],
      [505, 360, 115, 145, 0.16],
      [482, 475, 130, 105, 0.20],
      [1365, 290, 58, 95, 0.13],
      [705, 175, 48, 70, 0.12],
    ];
    for (let i = 0; i < dampClusters.length; i++) {
      const [px, py, rx, ry, al] = dampClusters[i];
      const dg = c.createRadialGradient(px, py, Math.min(rx, ry) * 0.12, px, py, Math.max(rx, ry));
      dg.addColorStop(0, isWarm ? `rgba(18,10,5,${al})` : `rgba(4,7,12,${al})`);
      dg.addColorStop(0.6, isWarm ? `rgba(18,10,5,${al * 0.45})` : `rgba(4,7,12,${al * 0.45})`);
      dg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = dg;
      c.fillRect(px - rx * 1.2, py - ry * 1.2, rx * 2.4, ry * 2.4);
    }

    // Mảng vữa bong nhỏ nhiều lớp có mép vỡ gãy tự nhiên
    const minorSpalls = [
      {
        outer: [[642, 152], [662, 141], [689, 138], [712, 153], [719, 173], [698, 192], [671, 198], [648, 184]],
        inner: [[655, 156], [676, 149], [698, 152], [707, 170], [692, 185], [668, 186], [653, 174]],
      },
      {
        outer: [[266, 594], [292, 581], [326, 577], [349, 595], [344, 616], [314, 629], [282, 624], [264, 610]],
        inner: [[278, 597], [304, 589], [332, 591], [336, 611], [309, 620], [283, 614]],
      },
      {
        outer: [[1344, 518], [1371, 509], [1394, 524], [1406, 549], [1390, 569], [1359, 575], [1338, 557], [1333, 536]],
        inner: [[1355, 527], [1379, 523], [1394, 541], [1382, 560], [1356, 562], [1345, 544]],
      },
    ];
    for (let i = 0; i < minorSpalls.length; i++) {
      const sp = minorSpalls[i];
      // Lớp vữa nền thô xám/nâu nhạt
      poly(c, sp.outer, isWarm ? '#2c1e14' : '#18212b');
      // Lõi âm xi măng sâu bên trong
      poly(c, sp.inner, isWarm ? '#160d07' : '#090d13');
      // Mép trên bắt nhẹ ánh sáng hắt từ dưới cầu thang lên
      c.strokeStyle = isWarm ? 'rgba(255,204,136,0.22)' : 'rgba(146,180,218,0.20)';
      c.lineWidth = 1.1;
      c.beginPath();
      for (let k = 0; k < 4; k++) {
        if (k) c.lineTo(sp.outer[k][0], sp.outer[k][1]);
        else c.moveTo(sp.outer[k][0], sp.outer[k][1]);
      }
      c.stroke();
    }

    // 3. Dòng nước mưa thấm dọc theo vết nứt trên xuống xoá mờ 3 bó vạch ở BT.xoa
    const xoa = BT.xoa;
    const seepCols = [
      [xoa.x + 32, 108, 42, xoa.y + xoa.h + 44, 0.34],
      [xoa.x + xoa.w * 0.5, 118, 56, xoa.y + xoa.h + 52, 0.38],
      [xoa.x + xoa.w - 34, 132, 40, xoa.y + xoa.h + 36, 0.30],
    ];
    for (let s = 0; s < seepCols.length; s++) {
      const [sx, sy0, sw, sy1, al] = seepCols[s];
      const sg = c.createLinearGradient(0, sy0, 0, sy1);
      sg.addColorStop(0, 'rgba(0,0,0,0)');
      sg.addColorStop(0.28, isWarm ? `rgba(18,10,5,${al * 0.55})` : `rgba(4,7,12,${al * 0.58})`);
      sg.addColorStop(0.76, isWarm ? `rgba(15,8,4,${al})` : `rgba(3,6,10,${al})`);
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = sg;
      c.beginPath();
      c.moveTo(sx - sw * 0.35, sy0);
      c.quadraticCurveTo(sx + sw * 0.4, (sy0 + sy1) * 0.35, sx + sw * 0.65, sy1 - 24);
      c.quadraticCurveTo(sx, sy1 + 12, sx - sw * 0.7, sy1 - 20);
      c.quadraticCurveTo(sx - sw * 0.9, (sy0 + sy1) * 0.55, sx - sw * 0.35, sy0);
      c.closePath();
      c.fill();
    }

    // Vệt phấn trôi nhòe chảy dọc ngay dưới 3 bó vạch bị xoá
    for (let s = 0; s < 6; s++) {
      const sx = xoa.x + 22 + s * (xoa.w * 0.16) + (s % 2) * 5;
      const dg = c.createLinearGradient(0, xoa.y - 12, 0, xoa.y + xoa.h + 32);
      dg.addColorStop(0, 'rgba(0,0,0,0)');
      dg.addColorStop(0.35, isWarm ? 'rgba(235,210,175,0.06)' : 'rgba(185,202,220,0.065)');
      dg.addColorStop(1, 'rgba(0,0,0,0)');
      c.strokeStyle = dg;
      c.lineWidth = 3 + (s % 2) * 2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(sx, xoa.y - 8);
      c.lineTo(sx + (s % 2 ? 2 : -2), xoa.y + xoa.h + 28);
      c.stroke();
    }

    // 4. Các vết nứt trên tường bê tông
    for (let i = 0; i < CRACKS.length; i++) {
      const cr = CRACKS[i];
      c.strokeStyle = isWarm ? 'rgba(8,4,2,0.88)' : 'rgba(3,4,7,0.90)';
      c.lineWidth = cr.w;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      for (let j = 0; j < cr.pts.length; j++) {
        if (j) c.lineTo(cr.pts[j][0], cr.pts[j][1]);
        else c.moveTo(cr.pts[j][0], cr.pts[j][1]);
      }
      c.stroke();

      // Mép bắt sáng rất mảnh ở cạnh trên vết nứt (ánh sáng hắt từ dưới lên)
      c.strokeStyle = isWarm ? 'rgba(255,198,125,0.14)' : 'rgba(145,180,218,0.13)';
      c.lineWidth = 0.8;
      c.beginPath();
      for (let j = 0; j < cr.pts.length; j++) {
        if (j) c.lineTo(cr.pts[j][0], cr.pts[j][1] - 1.2);
        else c.moveTo(cr.pts[j][0], cr.pts[j][1] - 1.2);
      }
      c.stroke();
    }

    // 5. Vẽ 99 vạch phấn đếm ngày (19 bó 5 + 1 bó 4; 3 bó bị nước mưa xoá mờ ở BT.xoa)
    for (let i = 0; i < TALLY_STROKES.length; i++) {
      const st = TALLY_STROKES[i];
      c.strokeStyle = isWarm
        ? `rgba(248,228,195,${st.a})`
        : `rgba(206,218,230,${st.a})`;
      c.lineWidth = st.w;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(st.x0, st.y0);
      c.lineTo(st.x1, st.y1);
      c.stroke();
    }

    // 6. Tờ lịch vẽ tay 10×10 ô đánh số 1→100 (nằm ẩn bên trong hốc vữa bị bong)
    c.fillStyle = isWarm ? '#23160d' : '#111923';
    c.beginPath();
    for (let i = 0; i < PLASTER_POLY.length; i++) {
      const pt = PLASTER_POLY[i];
      const wx = plasterBox.x + lerp(plasterBox.w * 0.5, pt[0], 0.94);
      const wy = plasterBox.y + lerp(plasterBox.h * 0.5, pt[1], 0.94);
      if (i) c.lineTo(wx, wy);
      else c.moveTo(wx, wy);
    }
    c.closePath();
    c.fill();
    c.fillStyle = isWarm ? '#160d07' : '#080c12';
    c.fillRect(CAL.x - 10, CAL.y - 10, CAL.w + 20, CAL.h + 20);

    // Tờ giấy lịch ngả màu thời gian
    const paperGr = c.createLinearGradient(CAL.x, CAL.y, CAL.x + CAL.w, CAL.y + CAL.h);
    if (isWarm) {
      paperGr.addColorStop(0, '#c8b28d');
      paperGr.addColorStop(0.6, '#d9c5a2');
      paperGr.addColorStop(1, '#baa078');
    } else {
      paperGr.addColorStop(0, '#626f7d');
      paperGr.addColorStop(0.6, '#768494');
      paperGr.addColorStop(1, '#586472');
    }
    c.fillStyle = paperGr;
    roundRect(c, CAL.x - 4, CAL.y - 4, CAL.w + 8, CAL.h + 8, 5);
    c.fill();

    // Đường kẻ lưới 10×10 vẽ tay hơi run
    c.strokeStyle = isWarm ? 'rgba(65,42,24,0.44)' : 'rgba(20,28,38,0.48)';
    c.lineWidth = 1.3;
    for (let col = 0; col <= 10; col++) {
      const x = CAL.x + col * CAL.cw;
      const jit = CAL_JITTER[col].dx;
      c.beginPath();
      c.moveTo(x + jit * 0.5, CAL.y);
      c.lineTo(x - jit * 0.5, CAL.y + CAL.h);
      c.stroke();
    }
    for (let row = 0; row <= 10; row++) {
      const y = CAL.y + row * CAL.ch;
      const jit = CAL_JITTER[row].dy;
      c.beginPath();
      c.moveTo(CAL.x, y + jit * 0.5);
      c.lineTo(CAL.x + CAL.w, y - jit * 0.5);
      c.stroke();
    }

    // Đánh số 1→100 đúng phông 'Patrick Hand' tại tâm từng ô BT.o[1..100]
    c.fillStyle = isWarm ? 'rgba(44,28,16,0.90)' : 'rgba(18,24,32,0.88)';
    c.font = `22px ${HAND}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 1; i <= 100; i++) {
      const cell = BT.o[i];
      const j = CAL_JITTER[(i * 7) % 10];
      c.fillText(String(i), cell.x + j.dx * 0.35, cell.y + j.dy * 0.35 + 1);
    }
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';

    // Hạt bụi bê tông & hạt phim + viền tối 4 góc
    for (let i = 0; i < 3200; i++) {
      c.fillStyle = `rgba(${wrnd() < 0.5 ? '255,245,230' : '0,0,0'},${wrnd() * 0.025})`;
      c.fillRect(wrnd() * W, wrnd() * H, 1.8, 1.8);
    }
    grain(c, 10000, 0.022);
    vignette(c, 0.72);
  }

  function renderPlasterTheme(canvas, x, scale, isWarm) {
    canvas.width = Math.max(1, Math.ceil(plasterBox.w * scale));
    canvas.height = Math.max(1, Math.ceil(plasterBox.h * scale));
    x.setTransform(scale, 0, 0, scale, 0, 0);

    // Bóng hở nhẹ dưới rìa mảng vữa đang chờ bong
    x.fillStyle = 'rgba(0,0,0,0.44)';
    x.beginPath();
    for (let i = 0; i < PLASTER_POLY.length; i++) {
      const pt = PLASTER_POLY[i];
      if (i) x.lineTo(pt[0] + 3, pt[1] + 4);
      else x.moveTo(pt[0] + 3, pt[1] + 4);
    }
    x.closePath();
    x.fill();

    // Bề mặt mảng vữa ăn tiệp độ chuyển sáng theo chiều đứng của bức tường phía sau
    const pGr = x.createLinearGradient(0, 80 - plasterBox.y, 0, 740 - plasterBox.y);
    if (isWarm) {
      pGr.addColorStop(0, '#1c120b');
      pGr.addColorStop(0.55, '#2f1f13');
      pGr.addColorStop(1, '#3f2919');
    } else {
      pGr.addColorStop(0, '#0d131b');
      pGr.addColorStop(0.55, '#15202b');
      pGr.addColorStop(1, '#1c2836');
    }
    x.fillStyle = pGr;
    x.beginPath();
    for (let i = 0; i < PLASTER_POLY.length; i++) {
      const pt = PLASTER_POLY[i];
      if (i) x.lineTo(pt[0], pt[1]);
      else x.moveTo(pt[0], pt[1]);
    }
    x.closePath();
    x.fill();

    x.save();
    x.clip();
    // Hắt sáng nhẹ từ dưới cầu thang lên mảng vữa để ăn nhập cùng tường nền
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = isWarm ? 0.14 : 0.09;
    x.drawImage(isWarm ? SP3.amber : SP3.cold, 260 - plasterBox.x, 220 - plasterBox.y, 1080, 560);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;

    // Đường nứt chân chim mảnh tự nhiên trên mảng vữa phồng
    const pCracks = [
      [[0.16, 0.05], [0.19, 0.15], [0.24, 0.26], [0.21, 0.37], [0.27, 0.49], [0.25, 0.60]],
      [[0.24, 0.26], [0.33, 0.30], [0.40, 0.35]],
      [[0.76, 0.12], [0.72, 0.23], [0.75, 0.34], [0.70, 0.44], [0.74, 0.54]],
      [[0.72, 0.23], [0.64, 0.26], [0.59, 0.30]],
      [[0.44, 0.78], [0.50, 0.85], [0.48, 0.94]],
    ];
    x.lineCap = 'round';
    x.lineJoin = 'round';
    for (let k = 0; k < pCracks.length; k++) {
      const pts = pCracks[k];
      x.strokeStyle = isWarm ? 'rgba(10,5,2,0.72)' : 'rgba(3,5,8,0.74)';
      x.lineWidth = k === 0 || k === 2 ? 1.15 : 0.75;
      x.beginPath();
      for (let j = 0; j < pts.length; j++) {
        const px = plasterBox.w * pts[j][0], py = plasterBox.h * pts[j][1];
        if (j) x.lineTo(px, py);
        else x.moveTo(px, py);
      }
      x.stroke();
      x.strokeStyle = isWarm ? 'rgba(255,196,120,0.12)' : 'rgba(145,180,218,0.12)';
      x.lineWidth = 0.6;
      x.beginPath();
      for (let j = 0; j < pts.length; j++) {
        const px = plasterBox.w * pts[j][0], py = plasterBox.h * pts[j][1] - 1;
        if (j) x.lineTo(px, py);
        else x.moveTo(px, py);
      }
      x.stroke();
    }

    for (let i = 0; i < 900; i++) {
      x.fillStyle = `rgba(${i % 2 ? '240,235,220' : '0,0,0'},0.025)`;
      x.fillRect(((i * 173) % plasterBox.w), ((i * 317) % plasterBox.h), 1.8, 1.8);
    }
    x.restore();

    // Đường rạn vỡ & lớp vôi xám rất mảnh dọc khe bong của mảng vữa lớn
    x.strokeStyle = isWarm ? 'rgba(185,152,118,0.18)' : 'rgba(128,150,174,0.18)';
    x.lineWidth = 2.6;
    x.beginPath();
    for (let i = 20; i <= 31; i++) {
      const pt = PLASTER_POLY[i];
      if (i === 20) x.moveTo(pt[0], pt[1]);
      else x.lineTo(pt[0], pt[1]);
    }
    x.stroke();

    x.strokeStyle = isWarm ? 'rgba(10,5,2,0.88)' : 'rgba(3,5,8,0.88)';
    x.lineWidth = 1.9;
    x.beginPath();
    for (let i = 0; i < PLASTER_POLY.length; i++) {
      const pt = PLASTER_POLY[i];
      if (i) x.lineTo(pt[0], pt[1]);
      else x.moveTo(pt[0], pt[1]);
    }
    x.closePath();
    x.stroke();

    x.strokeStyle = isWarm ? 'rgba(255,204,132,0.24)' : 'rgba(150,185,222,0.24)';
    x.lineWidth = 1.2;
    x.beginPath();
    for (let i = 16; i <= 24; i++) {
      const pt = PLASTER_POLY[i];
      if (i === 16) x.moveTo(pt[0], pt[1]);
      else x.lineTo(pt[0], pt[1]);
    }
    x.stroke();
  }

  function bakeWall() {
    buildSprites();
    initWallGeom();
    buildWallDataOnce();

    const cw = Math.max(1, cv.width);
    const ch = Math.max(1, cv.height);
    wallColdC.width = cw;
    wallColdC.height = ch;
    wallWarmC.width = cw;
    wallWarmC.height = ch;

    renderWallTheme(wallColdG, false);
    renderWallTheme(wallWarmG, true);

    const sc = Math.max(0.5, S * dpr);
    renderPlasterTheme(plasterColdC, plasterColdG, sc, false);
    renderPlasterTheme(plasterWarmC, plasterWarmG, sc, true);

    wallBaked = true;
    fontDirty = false;
  }

  function ensureWallBaked() {
    if (!wallBaked || fontDirty || wallColdC.width !== cv.width || wallColdC.height !== cv.height) {
      bakeWall();
    }
  }

  function drawWall(c, now) {
    ensureWallBaked();

    const am = clamp(BT.am || 0, 0, 1);
    const vua = clamp(BT.vua || 0, 0, 1);

    // 1. Nền tường (trộn giữa bản lạnh BT.am = 0 và bản hổ phách ấm BT.am = 1)
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (am < 0.999) c.drawImage(wallColdC, 0, 0);
    if (am > 0.001) {
      c.save();
      c.globalAlpha = am;
      c.drawImage(wallWarmC, 0, 0);
      c.restore();
    }
    setT(c);

    // 2. Nhịp thở nhẹ của nguồn sáng từ dưới cầu thang hắt lên
    const t = now * 0.001;
    const breath = 0.85 + 0.15 * Math.sin(t * 1.5);
    c.save();
    c.globalCompositeOperation = 'lighter';
    if (am < 0.999) {
      c.globalAlpha = 0.10 * (1 - am) * breath;
      c.drawImage(SP3.cold, 420, 320, 760, 440);
    }
    if (am > 0.001) {
      c.globalAlpha = 0.16 * am * breath;
      c.drawImage(SP3.amber, 420, 300, 760, 460);
    }
    c.restore();

    // 3. Mảng vữa lớn che tờ lịch 10×10 (kéo bong dần theo BT.vua 0..1)
    if (vua < 0.999) {
      const k = ease(vua);
      const dx = k * 210;
      const dy = k * 145;
      const rot = k * 0.22;
      const alpha = vua < 0.72 ? 1 : clamp(1 - (vua - 0.72) / 0.28, 0, 1);
      const cx = plasterBox.x + plasterBox.w * 0.5;
      const cy = plasterBox.y + plasterBox.h * 0.5;

      c.save();
      c.translate(cx + dx, cy + dy);
      c.rotate(rot);
      c.globalAlpha = alpha;
      if (am < 0.999) {
        c.drawImage(plasterColdC, -plasterBox.w * 0.5, -plasterBox.h * 0.5, plasterBox.w, plasterBox.h);
      }
      if (am > 0.001) {
        c.globalAlpha = alpha * am;
        c.drawImage(plasterWarmC, -plasterBox.w * 0.5, -plasterBox.h * 0.5, plasterBox.w, plasterBox.h);
      }
      c.restore();
    }
  }

  SC.buctuong = {
    bake: bakeWall,
    enter() {
      ensureWallBaked();
      if (typeof nudge === 'function') nudge();
    },
    draw: drawWall,
  };

  // =====================================================================
  // CẢNH 3: SC.hopsat — Cận cảnh hộp sắt cũ dưới gầm cầu thang
  // =====================================================================
  const BOX = {
    x: 500,
    y: 264,
    w: 600,
    h: 378,
    pad: 22,
    hingeY: 264,
  };
  let boxBgC = null;
  let boxBgX = null;
  let boxLidC = null;
  let boxLidX = null;
  let boxBaked = false;

  const CHALK_PIECES = [
    { x: 882, y: 472, len: 68, r: 9.5, ang: 0.42 },
    { x: 966, y: 528, len: 34, r: 9.0, ang: -0.78 },
    { x: 754, y: 544, len: 26, r: 8.5, ang: 1.15 },
    { x: 836, y: 560, len: 16, r: 6.5, ang: -0.24 },
  ];
  const CHALK_CRUMBS = [
    [734, 526, 2.4], [768, 566, 1.8], [808, 540, 2.1], [858, 514, 2.5],
    [905, 504, 1.9], [938, 548, 2.8], [982, 512, 1.7], [822, 578, 1.6],
    [784, 518, 1.5], [916, 562, 2.2], [872, 444, 1.8], [948, 492, 1.5],
  ];

  function initBoxGeom() {
    if (HS.banh && HS.banh.length === 4 && HS.banh[0].w > 0) return;
    HS.banh = [
      { x: 614, y: 406, w: 78, h: 136 },
      { x: 712, y: 406, w: 78, h: 136 },
      { x: 810, y: 406, w: 78, h: 136 },
      { x: 908, y: 406, w: 78, h: 136 },
    ];
    HS.khe = { x: 664, y: 292, w: 272, h: 52 };
  }

  function bakeIronBox() {
    buildSprites();
    initBoxGeom();
    const lidOx = BOX.x - 12;
    const lidOy = BOX.y - 6;
    const lidW = BOX.w + 24;
    const lidH = BOX.h + 16;
    if (!boxBgC) {
      [boxBgC, boxBgX] = layer();
      boxLidC = document.createElement('canvas');
      boxLidC.width = lidW * 2;
      boxLidC.height = lidH * 2;
      boxLidX = boxLidC.getContext('2d');
    } else {
      boxBgC.width = Math.max(1, cv.width);
      boxBgC.height = Math.max(1, cv.height);
    }

    // --- 1. LỚP NỀN + THÂN HỘP RỖNG + BỤI & PHẤN VỤN (boxBgC) ---
    const c = boxBgX;
    setT(c);

    // Nền bê tông ẩm tối dưới gầm cầu thang (góc trên trái x<200,y<240 và dải y 680..780 giữ trống tối)
    let gr = c.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, '#040609');
    gr.addColorStop(0.55, '#090e15');
    gr.addColorStop(1, '#040608');
    c.fillStyle = gr;
    c.fillRect(-320, -200, W + 640, H + 400);

    // Vệt nứt mảnh & loang ẩm nền xi măng ở vùng phải/dưới ngoài vùng chữ
    c.strokeStyle = 'rgba(130,160,195,0.035)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(1160, 120);
    c.lineTo(1225, 215);
    c.lineTo(1210, 310);
    c.lineTo(1290, 415);
    c.stroke();

    // Ánh sáng lạnh rất yếu rọi xiên từ phải-trên cửa gầm vào mặt hộp
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.24;
    c.drawImage(SP3.cold, 440, 120, 820, 560);
    c.restore();

    // Bóng đổ tiếp xúc dày dưới đáy hộp
    c.fillStyle = 'rgba(1,2,4,0.78)';
    roundRect(c, BOX.x - 16, BOX.y + 18, BOX.w + 46, BOX.h + 26, 18);
    c.fill();
    c.fillStyle = 'rgba(1,2,4,0.48)';
    roundRect(c, BOX.x - 28, BOX.y + 28, BOX.w + 70, BOX.h + 38, 22);
    c.fill();

    // Vỏ ngoài thân hộp sắt gỉ sét tối
    gr = c.createLinearGradient(BOX.x, BOX.y, BOX.x + BOX.w, BOX.y + BOX.h);
    gr.addColorStop(0, '#232c36');
    gr.addColorStop(0.55, '#192028');
    gr.addColorStop(1, '#11161d');
    c.fillStyle = gr;
    roundRect(c, BOX.x, BOX.y, BOX.w, BOX.h, 14);
    c.fill();
    c.strokeStyle = 'rgba(150,185,220,0.16)';
    c.lineWidth = 1.8;
    c.stroke();

    // Thành hộp gập mép (vành kim loại dày quanh miệng hộp)
    const ix = BOX.x + BOX.pad;
    const iy = BOX.y + BOX.pad;
    const iw = BOX.w - BOX.pad * 2;
    const ih = BOX.h - BOX.pad * 2;
    c.fillStyle = '#0e131a';
    roundRect(c, ix - 4, iy - 4, iw + 8, ih + 8, 8);
    c.fill();
    c.strokeStyle = 'rgba(170,202,235,0.22)';
    c.lineWidth = 1.4;
    c.stroke();

    // 4 vách trong lòng hộp (tạo độ sâu 3D khi nắp mở)
    c.fillStyle = '#151b23';
    c.beginPath();
    c.moveTo(ix, iy);
    c.lineTo(ix + iw, iy);
    c.lineTo(ix + iw - 18, iy + 26);
    c.lineTo(ix + 18, iy + 26);
    c.closePath();
    c.fill();

    c.fillStyle = '#0a0e14';
    c.beginPath();
    c.moveTo(ix, iy);
    c.lineTo(ix + 18, iy + 26);
    c.lineTo(ix + 18, iy + ih - 14);
    c.lineTo(ix, iy + ih);
    c.closePath();
    c.fill();

    c.fillStyle = '#080b10';
    c.beginPath();
    c.moveTo(ix + iw, iy);
    c.lineTo(ix + iw - 18, iy + 26);
    c.lineTo(ix + iw - 18, iy + ih - 14);
    c.lineTo(ix + iw, iy + ih);
    c.closePath();
    c.fill();

    // Đáy lòng hộp trống (thép tối phủ lớp bụi mịn)
    const fx = ix + 18;
    const fy = iy + 26;
    const fw = iw - 36;
    const fh = ih - 40;
    gr = c.createLinearGradient(fx, fy, fx + fw, fy + fh);
    gr.addColorStop(0, '#0f141b');
    gr.addColorStop(0.5, '#131921');
    gr.addColorStop(1, '#0c1016');
    c.fillStyle = gr;
    c.fillRect(fx, fy, fw, fh);

    // Vệt gỉ cũ nhẹ dọc mép đáy
    const rSpots = [[fx + 46, fy + 44, 52], [fx + fw - 72, fy + fh - 38, 66], [fx + 140, fy + fh - 32, 48]];
    for (let i = 0; i < rSpots.length; i++) {
      const sp = rSpots[i];
      const rg = c.createRadialGradient(sp[0], sp[1], 2, sp[0], sp[1], sp[2]);
      rg.addColorStop(0, 'rgba(72,42,28,0.22)');
      rg.addColorStop(1, 'rgba(72,42,28,0)');
      c.fillStyle = rg;
      c.fillRect(sp[0] - sp[2], sp[1] - sp[2], sp[2] * 2, sp[2] * 2);
    }

    // Lớp bụi mịn lắng đọng góc và đáy hộp
    const dPatches = [
      [fx + 110, fy + 95, 130, 0.08],
      [fx + fw - 120, fy + 165, 160, 0.11],
      [fx + fw * 0.45, fy + fh - 75, 185, 0.09],
    ];
    for (let i = 0; i < dPatches.length; i++) {
      const dp = dPatches[i];
      const dg = c.createRadialGradient(dp[0], dp[1], 6, dp[0], dp[1], dp[2]);
      dg.addColorStop(0, `rgba(175,186,198,${dp[3]})`);
      dg.addColorStop(0.6, `rgba(145,156,170,${dp[3] * 0.45})`);
      dg.addColorStop(1, 'rgba(120,130,145,0)');
      c.fillStyle = dg;
      c.beginPath();
      c.arc(dp[0], dp[1], dp[2], 0, Math.PI * 2);
      c.fill();
    }
    // Hạt bụi li ti rải khắp lòng hộp
    for (let i = 0; i < 240; i++) {
      const dx = fx + 8 + ((i * 73 + 19) % (fw - 16));
      const dy = fy + 8 + ((i * 137 + 41) % (fh - 16));
      const a = 0.04 + ((i * 29) % 10) * 0.011;
      c.fillStyle = `rgba(195,204,214,${a})`;
      c.fillRect(dx, dy, 1.4, 1.4);
    }

    // Vệt phấn trắng tán mờ dưới đáy hộp
    const cg1 = c.createRadialGradient(890, 515, 4, 890, 515, 92);
    cg1.addColorStop(0, 'rgba(232,236,242,0.16)');
    cg1.addColorStop(0.55, 'rgba(215,222,230,0.06)');
    cg1.addColorStop(1, 'rgba(215,222,230,0)');
    c.fillStyle = cg1;
    c.beginPath();
    c.arc(890, 515, 92, 0, Math.PI * 2);
    c.fill();

    // Vài viên phấn trắng gãy vụn nằm trơ ở đáy hộp trống
    for (let i = 0; i < CHALK_PIECES.length; i++) {
      const p = CHALK_PIECES[i];
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.ang);
      c.fillStyle = 'rgba(2,4,8,0.52)';
      roundRect(c, -p.len * 0.5 + 3, -p.r + 4, p.len, p.r * 2, p.r * 0.55);
      c.fill();
      const chG = c.createLinearGradient(0, -p.r, 0, p.r);
      chG.addColorStop(0, '#dfe4ea');
      chG.addColorStop(0.55, '#c2cad3');
      chG.addColorStop(1, '#86909c');
      c.fillStyle = chG;
      c.beginPath();
      c.moveTo(-p.len * 0.5, -p.r * 0.72);
      c.lineTo(p.len * 0.45, -p.r * 0.92);
      c.lineTo(p.len * 0.5, -p.r * 0.25);
      c.lineTo(p.len * 0.46, p.r * 0.85);
      c.lineTo(-p.len * 0.48, p.r * 0.78);
      c.lineTo(-p.len * 0.52, 0);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.28)';
      c.fillRect(-p.len * 0.35, -p.r * 0.58, p.len * 0.7, p.r * 0.30);
      c.restore();
    }
    for (let i = 0; i < CHALK_CRUMBS.length; i++) {
      const cr = CHALK_CRUMBS[i];
      c.fillStyle = 'rgba(216,224,232,0.72)';
      c.beginPath();
      c.arc(cr[0], cr[1], cr[2], 0, Math.PI * 2);
      c.fill();
    }

    // 2 bản lề sau tại mép trên (y = BOX.hingeY) & ngàm chốt trước
    for (let i = 0; i < 2; i++) {
      const hx = i === 0 ? BOX.x + 115 : BOX.x + BOX.w - 165;
      c.fillStyle = '#1b222b';
      roundRect(c, hx, BOX.hingeY - 8, 50, 14, 3);
      c.fill();
      c.strokeStyle = 'rgba(165,195,225,0.22)';
      c.lineWidth = 1;
      c.stroke();
    }
    c.fillStyle = '#252c34';
    roundRect(c, 770, BOX.y + BOX.h - 4, 60, 10, 3);
    c.fill();

    grain(c, 7500, 0.020);
    vignette(c, 0.74);

    // --- 2. LỚP NẮP HỘP TĨNH (boxLidC ở không gian nắp 2x để xoay mượt quanh bản lề) ---
    const lc = boxLidX;
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.clearRect(0, 0, boxLidC.width, boxLidC.height);
    lc.setTransform(2, 0, 0, 2, -lidOx * 2, -lidOy * 2);

    const lx = BOX.x - 8;
    const ly = BOX.y - 2;
    const lw = BOX.w + 16;
    const lh = BOX.h + 8;

    gr = lc.createLinearGradient(lx, ly, lx + lw * 0.85, ly + lh);
    gr.addColorStop(0, '#2a3441');
    gr.addColorStop(0.45, '#1f2833');
    gr.addColorStop(1, '#141b23');
    lc.fillStyle = gr;
    roundRect(lc, lx, ly, lw, lh, 14);
    lc.fill();
    lc.strokeStyle = 'rgba(175,208,240,0.24)';
    lc.lineWidth = 1.6;
    lc.stroke();

    // Đường gờ dập nổi quanh nắp hộp & vết xước mờ
    roundRect(lc, lx + 18, ly + 18, lw - 36, lh - 36, 9);
    lc.strokeStyle = 'rgba(165,196,228,0.14)';
    lc.lineWidth = 1.5;
    lc.stroke();

    // Đinh tán ở 4 góc nắp
    const rivets = [[lx + 32, ly + 32], [lx + lw - 32, ly + 32], [lx + 32, ly + lh - 32], [lx + lw - 32, ly + lh - 32]];
    for (let i = 0; i < rivets.length; i++) {
      const rv = rivets[i];
      lc.fillStyle = '#0f141a';
      lc.beginPath();
      lc.arc(rv[0], rv[1], 5, 0, Math.PI * 2);
      lc.fill();
      lc.strokeStyle = 'rgba(160,192,225,0.22)';
      lc.lineWidth = 1;
      lc.stroke();
    }

    // Vệt trầy thép & mảng gỉ cũ tự nhiên trên nắp
    const lidRust = [[lx + 85, ly + 62, 54], [lx + lw - 95, ly + lh - 72, 62]];
    for (let i = 0; i < lidRust.length; i++) {
      const sp = lidRust[i];
      const rg = lc.createRadialGradient(sp[0], sp[1], 4, sp[0], sp[1], sp[2]);
      rg.addColorStop(0, 'rgba(84,48,30,0.20)');
      rg.addColorStop(1, 'rgba(84,48,30,0)');
      lc.fillStyle = rg;
      lc.beginPath();
      lc.arc(sp[0], sp[1], sp[2], 0, Math.PI * 2);
      lc.fill();
    }
    lc.strokeStyle = 'rgba(190,214,238,0.08)';
    lc.lineWidth = 1.1;
    lc.beginPath();
    lc.moveTo(lx + 110, ly + 96);
    lc.lineTo(lx + 158, ly + 114);
    lc.moveTo(lx + lw - 145, ly + 210);
    lc.lineTo(lx + lw - 92, ly + 196);
    lc.stroke();

    // Khe hẹp vừa một mẩu giấy gấp (HS.khe) trên nửa trên nắp
    const kh = HS.khe;
    lc.fillStyle = '#182029';
    roundRect(lc, kh.x, kh.y + 4, kh.w, kh.h - 8, 6);
    lc.fill();
    lc.strokeStyle = 'rgba(170,204,236,0.20)';
    lc.lineWidth = 1.2;
    lc.stroke();
    // Lòng khe tối sâu (11px bề dày vừa mẩu giấy)
    lc.fillStyle = '#040609';
    roundRect(lc, kh.x + 22, kh.y + 20, kh.w - 44, 12, 4);
    lc.fill();
    lc.strokeStyle = 'rgba(182,216,246,0.26)';
    lc.lineWidth = 1.2;
    lc.beginPath();
    lc.moveTo(kh.x + 24, kh.y + 32);
    lc.lineTo(kh.x + kh.w - 24, kh.y + 32);
    lc.stroke();

    // Tấm ốp kim loại giữ ổ khoá 4 bánh số
    const lpX = 592;
    const lpY = 392;
    const lpW = 416;
    const lpH = 164;
    gr = lc.createLinearGradient(lpX, lpY, lpX, lpY + lpH);
    gr.addColorStop(0, '#202934');
    gr.addColorStop(1, '#121820');
    lc.fillStyle = gr;
    roundRect(lc, lpX, lpY, lpW, lpH, 10);
    lc.fill();
    lc.strokeStyle = 'rgba(170,202,235,0.22)';
    lc.lineWidth = 1.4;
    lc.stroke();

    // Mũi tam giác chỉ vạch đọc số ở hai bên hàng bánh số
    lc.fillStyle = 'rgba(218,176,112,0.68)';
    lc.beginPath();
    lc.moveTo(lpX + 8, lpY + lpH * 0.5 - 5);
    lc.lineTo(lpX + 18, lpY + lpH * 0.5);
    lc.lineTo(lpX + 8, lpY + lpH * 0.5 + 5);
    lc.closePath();
    lc.fill();
    lc.beginPath();
    lc.moveTo(lpX + lpW - 8, lpY + lpH * 0.5 - 5);
    lc.lineTo(lpX + lpW - 18, lpY + lpH * 0.5);
    lc.lineTo(lpX + lpW - 8, lpY + lpH * 0.5 + 5);
    lc.closePath();
    lc.fill();

    // Hốc tối cho từng bánh số (đồng bộ HS.banh[0..3])
    for (let i = 0; i < HS.banh.length; i++) {
      const b = HS.banh[i];
      lc.fillStyle = '#05070a';
      roundRect(lc, b.x - 4, b.y - 4, b.w + 8, b.h + 8, 7);
      lc.fill();
      lc.strokeStyle = 'rgba(162,196,228,0.18)';
      lc.lineWidth = 1.1;
      lc.stroke();
    }

    // Tay khoá móc đồng xỉn ở mép dưới nắp
    lc.fillStyle = '#3a3228';
    roundRect(lc, 774, ly + lh - 18, 52, 22, 4);
    lc.fill();
    lc.strokeStyle = 'rgba(212,186,142,0.32)';
    lc.lineWidth = 1.2;
    lc.stroke();

    boxBaked = true;
  }

  function ensureBoxBaked() {
    if (!boxBaked || boxBgC.width !== cv.width || boxBgC.height !== cv.height) bakeIronBox();
  }

  function drawLockWheelsDynamic(c) {
    const so = Array.isArray(HS.so) ? HS.so : [0, 0, 0, 0];
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const step = 36;

    for (let i = 0; i < HS.banh.length; i++) {
      const b = HS.banh[i];
      const raw = Number(so[i]);
      const val = isFinite(raw) ? raw : 0;
      const wrapped = ((val % 10) + 10) % 10;
      const midDigit = Math.floor(wrapped) % 10;
      const frac = wrapped - Math.floor(wrapped);
      const topDigit = (midDigit + 9) % 10;
      const botDigit = (midDigit + 1) % 10;
      const nextBotDigit = (midDigit + 2) % 10;
      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.5;

      c.save();
      roundRect(c, b.x, b.y, b.w, b.h, 5);
      c.clip();

      // Thân trụ bánh số ánh kim xám-đồng tối (cong theo chiều dọc)
      const gr = c.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      gr.addColorStop(0, '#0c1016');
      gr.addColorStop(0.18, '#232c37');
      gr.addColorStop(0.48, '#384554');
      gr.addColorStop(0.56, '#2d3744');
      gr.addColorStop(0.84, '#1b232c');
      gr.addColorStop(1, '#0a0e13');
      c.fillStyle = gr;
      c.fillRect(b.x, b.y, b.w, b.h);

      // Rãnh khứa hai mép bánh xe giúp cảm giác vặn tay rõ ràng
      c.fillStyle = 'rgba(205,222,240,0.14)';
      for (let ry = b.y + 8 - frac * 12; ry < b.y + b.h; ry += 12) {
        c.fillRect(b.x + 2, ry, 7, 2);
        c.fillRect(b.x + b.w - 9, ry, 7, 2);
      }

      // 3 số (trên - giữa - dưới), chuyển động mượt nếu HS.so[i] là số thực
      const rows = [
        [topDigit, -1 - frac],
        [midDigit, -frac],
        [botDigit, 1 - frac],
        [nextBotDigit, 2 - frac],
      ];
      for (let r = 0; r < rows.length; r++) {
        const dNum = rows[r][0];
        const off = rows[r][1];
        if (Math.abs(off) > 1.35) continue;
        const yPos = cy + off * step;
        const dist = clamp(Math.abs(off), 0, 1.35);
        const alpha = clamp(1 - dist * 0.62, 0.14, 0.96);
        const syScale = clamp(1 - dist * 0.24, 0.58, 1);
        c.save();
        c.translate(cx, yPos);
        c.scale(1, syScale);
        c.font = `700 28px "Courier New", monospace`;
        c.fillStyle = `rgba(232,238,246,${alpha})`;
        c.fillText(String(dNum), 0, 1);
        c.restore();
      }

      // Vệt tối phủ nhẹ mép trên/dưới tạo độ cong trống quay
      c.fillStyle = 'rgba(4,6,10,0.45)';
      c.fillRect(b.x, b.y, b.w, 16);
      c.fillRect(b.x, b.y + b.h - 16, b.w, 16);
      c.restore();

      // Khung viền cửa sổ hàng số giữa (nhấn rõ chữ số đang chọn)
      c.strokeStyle = 'rgba(218,176,112,0.34)';
      c.lineWidth = 1.1;
      c.strokeRect(b.x + 9, cy - 17, b.w - 18, 34);
    }
  }

  function drawIronBox(c) {
    ensureBoxBaked();
    const openK = ease(clamp(Number(HS.mo) || 0, 0, 1));
    const ang = openK * 1.98;
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);

    // 1. Nền & thân hộp rỗng (chứa bụi & phấn vụn)
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(boxBgC, 0, 0);
    setT(c);

    // 2. Bóng tối trong lòng hộp tan dần khi nắp mở lên
    const innerDark = clamp(1 - openK * 1.35, 0, 1);
    if (innerDark > 0.01) {
      c.fillStyle = `rgba(3,5,8,${0.86 * innerDark})`;
      c.fillRect(BOX.x + 18, BOX.y + 18, BOX.w - 36, BOX.h - 36);
    }
    if (openK > 0.03 && openK < 0.98) {
      const shH = clamp((1 - openK) * 180 + 28, 28, 220);
      const sg = c.createLinearGradient(0, BOX.y + 20, 0, BOX.y + 20 + shH);
      sg.addColorStop(0, `rgba(2,4,7,${0.64 * (1 - openK * 0.4)})`);
      sg.addColorStop(1, 'rgba(2,4,7,0)');
      c.fillStyle = sg;
      c.fillRect(BOX.x + 22, BOX.y + 20, BOX.w - 44, shH);
    }

    // 3. Nắp hộp quay mượt quanh bản lề y = BOX.hingeY (264)
    if (cosA > 0.035) {
      const rimThick = sinA * 14;
      const frontY = BOX.hingeY + (BOX.h + 6) * cosA;
      const lidOx = BOX.x - 12;
      const lidOy = BOX.y - 6;
      const lidW = BOX.w + 24;
      const lidH = BOX.h + 16;

      c.save();
      setT(c);
      c.translate(W * 0.5, BOX.hingeY);
      c.scale(lerp(1, 0.982, 1 - cosA), cosA);
      c.translate(-W * 0.5, -BOX.hingeY);

      c.drawImage(boxLidC, lidOx, lidOy, lidW, lidH);
      drawLockWheelsDynamic(c);
      c.restore();

      // Gờ dày mặt trước của nắp lộ ra khi nghiêng lên
      if (rimThick > 1.2) {
        const wBot = (BOX.w + 16) * lerp(1, 0.982, 1 - cosA);
        const rx0 = W * 0.5 - wBot * 0.5;
        c.fillStyle = '#0e1319';
        roundRect(c, rx0, frontY - 2, wBot, rimThick + 2, 4);
        c.fill();
        c.strokeStyle = 'rgba(165,198,230,0.22)';
        c.lineWidth = 1.1;
        c.stroke();
      }
    } else {
      // Nắp đã lật dựng quá 90 độ: thấy mặt trong nắp tối vươn lên trên bản lề (trong vùng an toàn y >= 118)
      const backH = clamp(-cosA * 330, 10, 142);
      const topY = BOX.hingeY - backH;
      const topHalf = (BOX.w + 16) * lerp(0.5, 0.45, backH / 142);
      const botHalf = (BOX.w + 16) * 0.5;

      c.fillStyle = '#121820';
      c.beginPath();
      c.moveTo(W * 0.5 - topHalf, topY);
      c.lineTo(W * 0.5 + topHalf, topY);
      c.lineTo(W * 0.5 + botHalf, BOX.hingeY + 2);
      c.lineTo(W * 0.5 - botHalf, BOX.hingeY + 2);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(162,196,228,0.20)';
      c.lineWidth = 1.4;
      c.stroke();

      // Tấm lưng ổ khoá mặt trong nắp & mép khe giấy
      c.fillStyle = '#0c1016';
      c.fillRect(W * 0.5 - 190, topY + backH * 0.28, 380, backH * 0.34);
      c.fillStyle = '#040609';
      c.fillRect(W * 0.5 - 110, topY + backH * 0.72, 220, Math.max(3, backH * 0.05));
    }
  }

  SC.hopsat = {
    bake: bakeIronBox,
    enter() {
      initBoxGeom();
      ensureBoxBaked();
      if (typeof nudge === 'function') nudge();
    },
    draw: drawIronBox,
  };

  // =====================================================================
  // CẢNH 4: SC.kenbang — Cận cảnh cuộn băng cát-sét kẹt + bút bi xoay lõi
  // =====================================================================
  const CAS = { cx: 800, cy: 330, w: 560, h: 352 };
  let kbBgC = null;
  let kbBgX = null;
  let kbShellC = null;
  let kbShellX = null;
  let kbHubC = null;
  let kbHubX = null;
  let kbPenC = null;
  let kbPenX = null;
  let kbBaked = false;

  const TAPE_SEG = 56;
  const _tapeMidX = new Float64Array(TAPE_SEG + 1);
  const _tapeMidY = new Float64Array(TAPE_SEG + 1);
  const _tapeTopX = new Float64Array(TAPE_SEG + 1);
  const _tapeTopY = new Float64Array(TAPE_SEG + 1);
  const _tapeBotX = new Float64Array(TAPE_SEG + 1);
  const _tapeBotY = new Float64Array(TAPE_SEG + 1);

  function initKenBangGeom() {
    KB.loi = [682, CAS.cy];
    KB.r = 165;
  }

  function triWave(p) {
    const f = p - Math.floor(p);
    return 1 - 4 * Math.abs(f - 0.5);
  }

  function bakeKenBang() {
    buildSprites();
    initKenBangGeom();
    if (!kbBgC) {
      [kbBgC, kbBgX] = layer();
      [kbShellC, kbShellX] = layer();
      kbHubC = document.createElement('canvas');
      kbHubC.width = 96;
      kbHubC.height = 96;
      kbHubX = kbHubC.getContext('2d');
      kbPenC = document.createElement('canvas');
      kbPenC.width = 270;
      kbPenC.height = 64;
      kbPenX = kbPenC.getContext('2d');
    } else {
      kbBgC.width = kbShellC.width = Math.max(1, cv.width);
      kbBgC.height = kbShellC.height = Math.max(1, cv.height);
    }

    // --- 1. MẶT BÀN TỐI + ÁNH SÁNG ĐÊM + HẠT PHIM (kbBgC) ---
    const bg = kbBgX;
    setT(bg);
    let gr = bg.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, '#05070b');
    gr.addColorStop(0.5, '#0b1017');
    gr.addColorStop(1, '#040609');
    bg.fillStyle = gr;
    bg.fillRect(-320, -200, W + 640, H + 400);

    // Vân gỗ mờ trên mặt bàn (né vùng trên trái x<200,y<240 và dải chữ dưới)
    bg.strokeStyle = 'rgba(130,158,192,0.03)';
    bg.lineWidth = 1.4;
    for (let i = 0; i < 8; i++) {
      const yy = 120 + i * 94;
      bg.beginPath();
      bg.moveTo(yy < 260 ? 240 : -240, yy);
      bg.quadraticCurveTo(800, yy + (i % 2 ? 12 : -10), 1840, yy + 4);
      bg.stroke();
    }

    // Ánh sáng lạnh xiên từ phía trên bên phải dịu xuống bàn
    bg.save();
    bg.globalCompositeOperation = 'lighter';
    bg.globalAlpha = 0.25;
    bg.drawImage(SP3.cold, 440, 70, 860, 560);
    bg.restore();

    const cx = CAS.cx;
    const cy = CAS.cy;
    const sx = cx - CAS.w * 0.5;
    const sy = cy - CAS.h * 0.5;

    // Bóng đổ mềm dưới vỏ cuộn băng
    bg.fillStyle = 'rgba(1,2,4,0.74)';
    roundRect(bg, sx + 10, sy + 18, CAS.w + 8, CAS.h + 8, 18);
    bg.fill();
    bg.fillStyle = 'rgba(1,2,4,0.42)';
    roundRect(bg, sx + 18, sy + 28, CAS.w + 18, CAS.h + 18, 22);
    bg.fill();

    // Tấm nền tối phía sau hai bánh băng cuốn bên trong vỏ (nằm sau lõi & băng từ bên trong)
    bg.fillStyle = '#0b0e14';
    roundRect(bg, sx + 22, sy + 22, CAS.w - 44, CAS.h - 44, 10);
    bg.fill();

    // Hai cuộn dây từ tối bên trong vỏ băng (trái dày hơn, phải mỏng hơn)
    const rL = 82;
    const rR = 54;
    const spools = [[KB.loi[0], KB.loi[1], rL], [918, CAS.cy, rR]];
    for (let i = 0; i < spools.length; i++) {
      const sp = spools[i];
      const sg = bg.createRadialGradient(sp[0], sp[1], 28, sp[0], sp[1], sp[2]);
      sg.addColorStop(0, '#2a160c');
      sg.addColorStop(0.65, '#3b1f11');
      sg.addColorStop(1, '#1d0f08');
      bg.fillStyle = sg;
      bg.beginPath();
      bg.arc(sp[0], sp[1], sp[2], 0, Math.PI * 2);
      bg.fill();
      bg.strokeStyle = 'rgba(155,95,55,0.22)';
      bg.lineWidth = 1.0;
      for (let rad = 36; rad < sp[2]; rad += 9) {
        bg.beginPath();
        bg.arc(sp[0], sp[1], rad, 0, Math.PI * 2);
        bg.stroke();
      }
    }

    grain(bg, 7500, 0.020);
    vignette(bg, 0.74);

    // --- 2. VỎ NHỰA BĂNG CÁT-SÉT (kbShellC, khoét cửa sổ trong suốt) ---
    const sc = kbShellX;
    setT(sc);
    sc.clearRect(0, 0, W, H);

    gr = sc.createLinearGradient(sx, sy, sx + CAS.w, sy + CAS.h);
    gr.addColorStop(0, '#262b34');
    gr.addColorStop(0.5, '#1a1e26');
    gr.addColorStop(1, '#12151b');
    sc.fillStyle = gr;
    roundRect(sc, sx, sy, CAS.w, CAS.h, 16);
    sc.fill();
    sc.strokeStyle = 'rgba(182,210,240,0.22)';
    sc.lineWidth = 1.6;
    sc.stroke();

    // Tem giấy kẻ dòng để trống (không tự bịa chữ lên cuộn băng)
    const labX = sx + 48;
    const labY = sy + 36;
    const labW = CAS.w - 96;
    const labH = 228;
    const lg = sc.createLinearGradient(labX, labY, labX, labY + labH);
    lg.addColorStop(0, '#d8ceb9');
    lg.addColorStop(0.65, '#c6baa2');
    lg.addColorStop(1, '#afa38b');
    sc.fillStyle = lg;
    roundRect(sc, labX, labY, labW, labH, 8);
    sc.fill();

    // Đường kẻ dòng mờ trên tem giấy
    sc.strokeStyle = 'rgba(72,96,128,0.32)';
    sc.lineWidth = 1.2;
    for (let li = 0; li < 2; li++) {
      const ly = labY + 26 + li * 22;
      sc.beginPath();
      sc.moveTo(labX + 24, ly);
      sc.lineTo(labX + labW - 24, ly);
      sc.stroke();
    }
    // Dải màu đậm giữa tem quanh hai ổ trục
    sc.fillStyle = '#2c3c52';
    sc.fillRect(labX, labY + 76, labW, 102);

    // Khoét thủng 2 lỗ trục & cửa sổ xem lượng băng ở giữa
    sc.save();
    sc.globalCompositeOperation = 'destination-out';
    sc.fillStyle = '#000';
    roundRect(sc, 738, cy - 36, 124, 72, 8);
    sc.fill();
    sc.beginPath();
    sc.arc(KB.loi[0], KB.loi[1], 34, 0, Math.PI * 2);
    sc.arc(918, cy, 34, 0, Math.PI * 2);
    sc.fill();
    sc.restore();

    // Viền kính cửa sổ trong hơi ám khói
    roundRect(sc, 738, cy - 36, 124, 72, 8);
    sc.fillStyle = 'rgba(180,210,240,0.06)';
    sc.fill();
    sc.strokeStyle = 'rgba(195,215,235,0.28)';
    sc.lineWidth = 1.4;
    sc.stroke();

    // Phần cầu lồi phía dưới cuộn băng (cửa ra dây băng, khe đọc & miếng nỉ)
    const brX = sx + 82;
    const brY = sy + CAS.h - 68;
    const brW = CAS.w - 164;
    const brH = 68;
    sc.fillStyle = '#181c24';
    sc.beginPath();
    sc.moveTo(brX + 18, brY);
    sc.lineTo(brX + brW - 18, brY);
    sc.lineTo(brX + brW, brY + brH);
    sc.lineTo(brX, brY + brH);
    sc.closePath();
    sc.fill();
    sc.strokeStyle = 'rgba(165,195,230,0.20)';
    sc.lineWidth = 1.2;
    sc.stroke();

    // Các hốc khe dưới đáy + miếng nỉ áp băng màu nâu vàng + 2 con lăn trắng
    const cutouts = [
      [brX + 54, brY + 34, 48, 34],
      [cx - 32, brY + 34, 64, 34],
      [brX + brW - 102, brY + 34, 48, 34],
    ];
    for (let i = 0; i < cutouts.length; i++) {
      const ct = cutouts[i];
      sc.fillStyle = '#07090d';
      roundRect(sc, ct[0], ct[1], ct[2], ct[3], 4);
      sc.fill();
    }
    // Miếng nỉ & lá đồng giữa đáy băng
    sc.fillStyle = '#8b6e44';
    sc.fillRect(cx - 12, brY + 46, 24, 9);
    // Hai chốt dẫn hướng trắng hai bên
    sc.fillStyle = '#c8ced6';
    sc.beginPath();
    sc.arc(brX + 34, brY + 50, 7.5, 0, Math.PI * 2);
    sc.arc(brX + brW - 34, brY + 50, 7.5, 0, Math.PI * 2);
    sc.fill();

    // 5 con ốc nhỏ giữ vỏ nhựa
    const screws = [
      [sx + 20, sy + 20],
      [sx + CAS.w - 20, sy + 20],
      [sx + 20, sy + CAS.h - 20],
      [sx + CAS.w - 20, sy + CAS.h - 20],
      [cx, brY + 14],
    ];
    for (let i = 0; i < screws.length; i++) {
      const sw = screws[i];
      sc.fillStyle = '#3c4450';
      sc.beginPath();
      sc.arc(sw[0], sw[1], 5.5, 0, Math.PI * 2);
      sc.fill();
      sc.strokeStyle = '#0c0f14';
      sc.lineWidth = 1.2;
      sc.beginPath();
      sc.moveTo(sw[0] - 3, sw[1]);
      sc.lineTo(sw[0] + 3, sw[1]);
      sc.moveTo(sw[0], sw[1] - 3);
      sc.lineTo(sw[0], sw[1] + 3);
      sc.stroke();
    }

    // --- 3. SPRITE LÕI BĂNG 6 RĂNG (kbHubC, tâm 48,48) ---
    const hc = kbHubX;
    hc.clearRect(0, 0, 96, 96);
    hc.fillStyle = '#d4dae2';
    hc.beginPath();
    hc.arc(48, 48, 34, 0, Math.PI * 2);
    hc.fill();
    hc.fillStyle = '#0a0d12';
    hc.beginPath();
    hc.arc(48, 48, 22, 0, Math.PI * 2);
    hc.fill();
    // 6 răng nhọn ăn khớp vào thân bút (răng thứ 0 hướng trục +X khớp KB.goc)
    hc.fillStyle = '#e5ebf2';
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      hc.save();
      hc.translate(48, 48);
      hc.rotate(a);
      hc.fillRect(14, -3.4, 9, 6.8);
      hc.restore();
    }

    // --- 4. SPRITE CÂY BÚT BI (kbPenC, mũi ở (28,32), thân dọc +X tới 260) ---
    const pc = kbPenX;
    pc.clearRect(0, 0, 270, 64);
    const px0 = 28;
    const py0 = 32;

    // Đầu bi đồng thau & ngòi kim loại (nằm cắm vào lõi ở px0)
    pc.fillStyle = '#b49254';
    pc.beginPath();
    pc.moveTo(px0 - 10, py0);
    pc.lineTo(px0 + 4, py0 - 5.2);
    pc.lineTo(px0 + 4, py0 + 5.2);
    pc.closePath();
    pc.fill();

    // Cổ côn trắng trong suốt
    pc.fillStyle = 'rgba(218,228,240,0.72)';
    pc.beginPath();
    pc.moveTo(px0 + 3, py0 - 5.2);
    pc.lineTo(px0 + 34, py0 - 9.5);
    pc.lineTo(px0 + 34, py0 + 9.5);
    pc.lineTo(px0 + 3, py0 + 5.2);
    pc.closePath();
    pc.fill();

    // Ruột mực xanh lam bên trong thân nhựa trong
    pc.fillStyle = '#184488';
    pc.fillRect(px0 + 18, py0 - 2.6, 178, 5.2);

    // Thân bút nhựa lục giác hơi trong suốt + vệt sáng dọc thân
    const pG = pc.createLinearGradient(0, py0 - 10, 0, py0 + 10);
    pG.addColorStop(0, 'rgba(210,224,242,0.52)');
    pG.addColorStop(0.28, 'rgba(240,248,255,0.68)');
    pG.addColorStop(0.58, 'rgba(130,152,182,0.34)');
    pG.addColorStop(1, 'rgba(84,104,130,0.44)');
    pc.fillStyle = pG;
    roundRect(pc, px0 + 34, py0 - 9.5, 166, 19, 3);
    pc.fill();
    pc.strokeStyle = 'rgba(220,235,250,0.38)';
    pc.lineWidth = 1.0;
    pc.stroke();

    // Đệm cao su xanh sẫm vùng tay cầm (quanh bán kính kéo tay KB.r = 165)
    const gripX = px0 + 105;
    pc.fillStyle = '#162842';
    roundRect(pc, gripX, py0 - 10.5, 58, 21, 3);
    pc.fill();
    pc.fillStyle = 'rgba(120,165,220,0.22)';
    for (let gx = gripX + 6; gx < gripX + 54; gx += 6) {
      pc.fillRect(gx, py0 - 9, 2, 18);
    }

    // Đầu nắp xanh bấm đuôi bút & kẹp túi thép mảnh
    pc.fillStyle = '#1a3664';
    roundRect(pc, px0 + 196, py0 - 9.5, 22, 19, 4);
    pc.fill();
    pc.fillStyle = '#cfd8e4';
    roundRect(pc, px0 + 216, py0 - 5.5, 10, 11, 2);
    pc.fill();
    pc.fillStyle = '#b8c4d4';
    roundRect(pc, px0 + 150, py0 - 13, 56, 4.5, 2);
    pc.fill();

    kbBaked = true;
  }

  function ensureKenBangBaked() {
    if (!kbBaked || kbBgC.width !== cv.width || kbBgC.height !== cv.height) bakeKenBang();
  }

  function drawTapeSpillLoop(c, chungRaw, nhanRaw) {
    const chung = clamp(Number(chungRaw) || 0, 0, 1);
    const nhan = clamp(Number(nhanRaw) || 0, 0, 1);

    const xOutL = CAS.cx - 116;
    const xOutR = CAS.cx + 116;
    const yExit = CAS.cy + CAS.h * 0.5 - 10;

    // Khi đã cuốn sát (chung = 0), dải băng kéo căng thẳng ngang khe đáy bên trong vỏ băng
    const sag = 148 * Math.pow(chung, 0.92);
    const flare = 52 * Math.pow(chung, 0.85);
    const n = TAPE_SEG;

    // 1. Đường cong giữa vòng băng + độ nhăn răng cưa sắc (khi KB.nhan > 0)
    const wrinkleAmp = nhan * (4 + 14 * Math.max(0.28, chung));
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const env = Math.sin(Math.PI * s);
      const cx0 = lerp(xOutL, xOutR, s) - flare * Math.sin(Math.PI * s * 2) * 0.45 + (s - 0.5) * flare * 1.15;
      const cy0 = yExit + sag * Math.pow(env, 0.78);
      _tapeMidX[i] = cx0;
      _tapeMidY[i] = cy0;
    }

    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const i0 = i > 0 ? i - 1 : 0;
      const i1 = i < n ? i + 1 : n;
      const tx = _tapeMidX[i1] - _tapeMidX[i0];
      const ty = _tapeMidY[i1] - _tapeMidY[i0];
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;

      const env = Math.sin(Math.PI * s);
      const kink = wrinkleAmp > 0.05 ? wrinkleAmp * env * (triWave(s * 12.5) * 0.75 + triWave(s * 25.0 + 0.35) * 0.28) : 0;
      const px = _tapeMidX[i] + nx * kink;
      const py = _tapeMidY[i] + ny * kink;

      // Bề rộng băng nâu (hơi xoắn nhẹ ở hai bên khi thõng dài)
      const twist = 0.55 + 0.45 * Math.abs(Math.cos(s * Math.PI * 1.65 + chung * 1.1));
      const halfW = chung > 0.02
        ? (2.8 + 3.8 * twist) * (0.45 + 0.55 * env + 0.45 * (1 - chung))
        : 3.1;

      _tapeTopX[i] = px - nx * halfW;
      _tapeTopY[i] = py - ny * halfW;
      _tapeBotX[i] = px + nx * halfW;
      _tapeBotY[i] = py + ny * halfW;
    }

    // 2. Bóng đổ mềm của vòng băng lên mặt bàn (chỉ khi băng lòi ra ngoài)
    if (chung > 0.04) {
      c.save();
      c.strokeStyle = `rgba(1,2,4,${0.54 * chung})`;
      c.lineWidth = 13;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      for (let i = 0; i <= n; i++) {
        const mx = (_tapeTopX[i] + _tapeBotX[i]) * 0.5 + 5;
        const my = (_tapeTopY[i] + _tapeBotY[i]) * 0.5 + 9;
        if (i) c.lineTo(mx, my);
        else c.moveTo(mx, my);
      }
      c.stroke();
      c.restore();
    }

    // 3. Thân dải băng nâu bóng từng đốt (thêm nếp gãy sáng-tối xen kẽ khi nhăn)
    for (let i = 0; i < n; i++) {
      const s = i / n;
      let k = 0.5 + 0.5 * Math.sin(s * Math.PI * 3.1 + 0.7);
      if (nhan > 0.15) {
        const fold = i % 2 === 0 ? 0.24 : -0.22;
        k = clamp(k + fold * nhan, 0, 1);
      }
      const r = Math.round(lerp(36, 108, k));
      const gCol = Math.round(lerp(19, 60, k));
      const b = Math.round(lerp(11, 34, k));
      c.fillStyle = `rgb(${r},${gCol},${b})`;
      c.beginPath();
      c.moveTo(_tapeTopX[i], _tapeTopY[i]);
      c.lineTo(_tapeTopX[i + 1], _tapeTopY[i + 1]);
      c.lineTo(_tapeBotX[i + 1], _tapeBotY[i + 1]);
      c.lineTo(_tapeBotX[i], _tapeBotY[i]);
      c.closePath();
      c.fill();
    }

    // 4. Vệt bóng cạnh dải băng + ánh gãy răng cưa khi băng nhăn
    c.strokeStyle = nhan > 0.25 ? 'rgba(205,148,96,0.58)' : 'rgba(175,118,74,0.42)';
    c.lineWidth = nhan > 0.25 ? 1.5 : 1.2;
    c.lineJoin = 'miter';
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      if (i) c.lineTo(_tapeTopX[i], _tapeTopY[i]);
      else c.moveTo(_tapeTopX[i], _tapeTopY[i]);
    }
    c.stroke();

    c.strokeStyle = 'rgba(24,12,6,0.75)';
    c.lineWidth = 1.1;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      if (i) c.lineTo(_tapeBotX[i], _tapeBotY[i]);
      else c.moveTo(_tapeBotX[i], _tapeBotY[i]);
    }
    c.stroke();
  }

  function drawKenBang(c) {
    ensureKenBangBaked();
    const goc = isFinite(KB.goc) ? Number(KB.goc) : -2.35;

    // 1. Nền bàn & hai bánh băng bên trong
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(kbBgC, 0, 0);
    setT(c);

    // 2. Hai lõi 6 răng (lõi trái xoay chính xác theo KB.goc, lõi phải xoay chậm theo nhịp)
    c.save();
    c.translate(KB.loi[0], KB.loi[1]);
    c.rotate(goc);
    c.drawImage(kbHubC, -48, -48);
    c.restore();

    c.save();
    c.translate(918, CAS.cy);
    c.rotate(goc * 0.42 + 0.5);
    c.drawImage(kbHubC, -48, -48);
    c.restore();

    // 3. Vỏ cuộn băng (phủ lên ngoài trừ hai lỗ lõi và cửa sổ xem băng)
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(kbShellC, 0, 0);
    setT(c);

    // 4. Dải băng nâu bóng lòi ra ở khe dưới (KB.chung 0..1, KB.nhan 0..1)
    drawTapeSpillLoop(c, KB.chung, KB.nhan);

    // 5. Cây bút bi xỏ vào lỗ lõi bên trái KB.loi = [682, 330], xoay theo KB.goc
    // Bóng đổ cây bút lên vỏ băng & mặt bàn
    c.save();
    c.translate(KB.loi[0] + 10, KB.loi[1] + 15);
    c.rotate(goc);
    c.fillStyle = 'rgba(1,2,4,0.46)';
    roundRect(c, 8, -9, 224, 18, 8);
    c.fill();
    c.restore();

    // Thân bút thật
    c.save();
    c.translate(KB.loi[0], KB.loi[1]);
    c.rotate(goc);
    c.drawImage(kbPenC, -28, -32);
    c.restore();
  }

  SC.kenbang = {
    bake: bakeKenBang,
    enter() {
      initKenBangGeom();
      ensureKenBangBaked();
      if (typeof nudge === 'function') nudge();
    },
    draw: drawKenBang,
  };

  // Khởi tạo sẵn toạ độ HOT, BT.o[1..100], BT.xoa, HS.banh/khe, KB.loi/r ngay khi nạp script
  initStairGeom();
  initWallGeom();
  buildWallDataOnce();
  initBoxGeom();
  initKenBangGeom();
})();
