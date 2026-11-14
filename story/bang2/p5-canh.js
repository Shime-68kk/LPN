'use strict';
// ĐÌNH LÀNG BĂNG 1 ĐƯA VÀO BẢN v7 & LỐI ĐI MEN BÊN PHẢI TƯỜNG ĐÌNH (chỉ hình & vùng chạm HOT_D, chưa có câu đố).
// Dùng chung lõi từ core.js: W, H, cv, setT, layer, roundRect, vignette, grain, clamp, lerp, SC, nudge.
// Tương thích nạp độc lập (thu-dinh.html) và nạp chung với p1.js / p2-canh.js / p-nha-tro.js / p-cau-thang.js / p-ngo.js:
// - Bọc logic nội bộ trong IIFE, dùng PRNG riêng (drnd) để không lệch seed của p1.js.
// - Không khai báo lại const HOT của p1.js; xuất BP và HOT_D = { cong, tuong_phai, ban_da, radio, den_long, loi }.
// - Vùng an toàn y 100..800; góc trên trái (x<200,y<240) trống; dải y 680..780 trống.
// - Không shadowBlur/filter mỗi khung; sprite ánh sáng dựng sẵn + 'lighter'; không emoji, không người, không địa chỉ.

var BP = { soi: null, reveal: 0 };
var HOT_D = {};

(() => {
  // ---------- Xác định thư mục chứa script để nạp SVG dù trang HTML đặt ở đâu ----------
  const BASE_DIR =
    typeof document !== 'undefined' && document.currentScript && document.currentScript.src
      ? document.currentScript.src.replace(/[^/]*$/, '')
      : '';

  // ---------- PRNG riêng cho cảnh đình & lối bên phải ----------
  let dseed = 53;
  const drnd = () => ((dseed = (dseed * 16807) % 2147483647) / 2147483647);

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
      const dx = (drnd() - 0.5) * 0.6;
      const dy = (drnd() - 0.5) * 0.6;
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
    c.moveTo(a[0] + (drnd() - 0.5) * 0.6, a[1] + (drnd() - 0.5) * 0.6);
    c.lineTo(b[0] + (drnd() - 0.5) * 0.6, b[1] + (drnd() - 0.5) * 0.6);
    c.stroke();
  }

  function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  // ---------- Sprite ánh sáng, đom đóm & khói hương dựng sẵn một lần ----------
  const SP_D = {};
  function buildSprites() {
    if (SP_D.warm) return;
    const mk = (w, h, stops) => {
      const cv2 = document.createElement('canvas');
      cv2.width = w;
      cv2.height = h;
      const x = cv2.getContext('2d');
      const r = Math.min(w, h) / 2;
      const gr = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
      for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
      x.fillStyle = gr;
      x.fillRect(0, 0, w, h);
      return cv2;
    };
    SP_D.warm = mk(128, 128, [
      [0, 'rgba(255,204,118,0.88)'],
      [0.24, 'rgba(255,164,76,0.40)'],
      [0.58, 'rgba(220,124,48,0.10)'],
      [1, 'rgba(190,100,38,0)'],
    ]);
    SP_D.glow = mk(96, 96, [
      [0, 'rgba(255,246,216,1)'],
      [0.20, 'rgba(255,212,140,0.74)'],
      [0.55, 'rgba(255,160,80,0.20)'],
      [1, 'rgba(240,140,65,0)'],
    ]);
    SP_D.lantern = mk(96, 96, [
      [0, 'rgba(255,186,108,0.92)'],
      [0.28, 'rgba(242,102,48,0.46)'],
      [0.62, 'rgba(198,62,28,0.12)'],
      [1, 'rgba(160,40,18,0)'],
    ]);
    SP_D.ff = mk(48, 48, [
      [0, 'rgba(232,255,154,1)'],
      [0.24, 'rgba(200,255,120,0.56)'],
      [0.60, 'rgba(165,235,90,0.14)'],
      [1, 'rgba(140,210,70,0)'],
    ]);
    SP_D.torch = mk(128, 128, [
      [0, 'rgba(255,244,210,0.88)'],
      [0.24, 'rgba(255,222,165,0.42)'],
      [0.58, 'rgba(225,186,128,0.12)'],
      [1, 'rgba(195,155,102,0)'],
    ]);
    SP_D.cut = mk(128, 128, [
      [0, 'rgba(0,0,0,1)'],
      [0.34, 'rgba(0,0,0,0.92)'],
      [0.64, 'rgba(0,0,0,0.44)'],
      [1, 'rgba(0,0,0,0)'],
    ]);
    SP_D.smoke = mk(64, 64, [
      [0, 'rgba(225,226,240,0.42)'],
      [0.45, 'rgba(215,218,234,0.16)'],
      [1, 'rgba(205,210,228,0)'],
    ]);
  }

  // ---------- Nạp hai SVG gốc của Băng 1 làm Image ----------
  const imgTrong = new Image();
  const imgNgoai = new Image();
  const isImgReady = (im) => im.complete && im.naturalWidth > 0;

  // ---------- Dữ liệu đom đóm & khói hương cố định (không cấp phát mỗi khung) ----------
  // Giống phân bố đom đóm quanh cây đa (trái) và bụi tre (phải) ở Băng 1, chừa trống góc trên-trái (x<200, y<240)
  const FF_TRONG = [
    { x: 112, y: 360, dx: -36, dy: 14, d: 6.1, k: -2.5, r: 16 },
    { x: 224, y: 468, dx: -26, dy: 8, d: 3.5, k: -4.1, r: 14 },
    { x: 352, y: 324, dx: -25, dy: 12, d: 5.0, k: -1.8, r: 15 },
    { x: 160, y: 558, dx: 6, dy: 22, d: 5.1, k: -0.7, r: 14 },
    { x: 416, y: 522, dx: -30, dy: -30, d: 6.6, k: -1.1, r: 16 },
    { x: 1408, y: 342, dx: -44, dy: 18, d: 5.7, k: -2.8, r: 15 },
    { x: 1488, y: 450, dx: -52, dy: -6, d: 3.3, k: -5.4, r: 14 },
    { x: 1546, y: 270, dx: 10, dy: -28, d: 5.1, k: -2.5, r: 15 },
    { x: 1344, y: 540, dx: -34, dy: 8, d: 7.0, k: -1.1, r: 16 },
    { x: 288, y: 630, dx: -38, dy: 16, d: 3.1, k: -4.7, r: 14 },
  ];

  // Đom đóm lơ lửng phía trên tường cổng ngoài (khu cây đa & ngọn tre phía trên tường, tránh x<200, y<240)
  const FF_NGOAI = [
    { x: 242, y: 268, dx: -24, dy: 12, d: 5.8, k: -1.6, r: 14 },
    { x: 344, y: 204, dx: 20, dy: -16, d: 4.9, k: -3.2, r: 15 },
    { x: 428, y: 312, dx: -28, dy: 10, d: 6.4, k: -0.9, r: 14 },
    { x: 1368, y: 214, dx: -36, dy: 16, d: 5.3, k: -2.4, r: 15 },
    { x: 1472, y: 320, dx: -30, dy: -18, d: 4.2, k: -4.1, r: 14 },
  ];

  const SMOKE_WISPS = [
    { bx: 780, by: 696, ph: 0.0, dur: 5.4, amp: 12 },
    { bx: 800, by: 688, ph: 1.8, dur: 5.8, amp: 14 },
    { bx: 820, by: 700, ph: 3.6, dur: 5.1, amp: 11 },
    { bx: 794, by: 692, ph: 2.7, dur: 6.2, amp: 15 },
  ];

  function drawFireflies(c, list, t, baseAlpha) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const u = (((t - f.k) / f.d) % 1 + 1) % 1;
      const alpha =
        u < 0.30
          ? (u / 0.30) * 0.90
          : u < 0.50
            ? lerp(0.90, 0.25, (u - 0.30) / 0.20)
            : u < 0.72
              ? lerp(0.25, 0.85, (u - 0.50) / 0.22)
              : lerp(0.85, 0, (u - 0.72) / 0.28);
      if (alpha < 0.02) continue;
      const drift = Math.sin(u * Math.PI);
      const px = f.x + f.dx * drift;
      const py = f.y + f.dy * drift;
      const r = f.r * (0.85 + 0.25 * alpha);
      c.globalAlpha = baseAlpha * alpha * 0.88;
      c.drawImage(SP_D.ff, px - r, py - r, r * 2, r * 2);
    }
    c.restore();
  }

  // ---------- Phép chiếu phối cảnh cho SC.benphai ----------
  const BP_CAM = { y: 1.42 };
  const BP_F = 820;
  const BP_VX = 840;
  const BP_VY = 330;
  const PB = (x, y, z) => [BP_VX + (BP_F * x) / z, BP_VY + (BP_F * (BP_CAM.y - y)) / z];

  // Thông số hình học của lối đá men tường đình, mặt hồ bên phải, giếng & cổng chào xa
  const BP_Z_FRONT = 3.80;
  const BP_Z_WALL_END = 14.8;
  const BP_Z_WELL = 16.4;
  const BP_Z_GATE = 18.8;
  const BP_X_WALL = -1.35;
  const BP_X_CURB = -0.42;
  const BP_WALL_TOP = 1.76;

  // Hai đầu đoạn tâm lối đá trên màn hình (dùng chung cho tính BP.reveal)
  const BP_PATH_A = PB((BP_X_WALL + BP_X_CURB) * 0.5, 0.02, 4.05);
  const BP_PATH_B = PB((BP_X_WALL + BP_X_CURB) * 0.5, 0.02, 13.8);

  function calcBpReveal(soi) {
    if (!Array.isArray(soi) || soi.length < 2 || !isFinite(soi[0]) || !isFinite(soi[1])) return 0;
    const sx = clamp(Number(soi[0]), -200, W + 200);
    const sy = clamp(Number(soi[1]), -200, H + 200);
    const dPath = distToSegment(sx, sy, BP_PATH_A[0], BP_PATH_A[1], BP_PATH_B[0], BP_PATH_B[1]);
    return clamp(1 - dPath / 165, 0, 1);
  }

  // ---------- Khởi tạo toạ độ vùng chạm HOT_D ngay khi nạp script ----------
  function initHotD() {
    // 1. SC.dinhngoai: cổng đình (x 620..980, y 396..796) & mảng tường bên phải cổng (x 1100..1570, y 420..796)
    HOT_D.cong = { x: 620, y: 396, w: 360, h: 400 };
    HOT_D.tuong_phai = { x: 1100, y: 420, w: 470, h: 376 };

    // 2. SC.dinhtrong: đèn lồng treo giữa hiên, radio gỗ trên bàn đá, bàn đá + ghế đôn
    HOT_D.den_long = { x: 752, y: 352, w: 96, h: 120 };
    HOT_D.radio = { x: 1228, y: 616, w: 152, h: 90 };
    HOT_D.ban_da = { x: 1150, y: 708, w: 320, h: 92 };

    // 3. SC.benphai: lối đi lát đá men chân tường đình sát mép hồ (gọn trong y 300..670, tránh dải 680..780)
    const pFL = PB(BP_X_WALL, 0.0, BP_Z_FRONT);
    const pFR = PB(BP_X_CURB, 0.0, BP_Z_FRONT);
    const pBL = PB(BP_X_WALL, 0.0, BP_Z_WALL_END);
    const pBR = PB(BP_X_CURB, 0.08, BP_Z_WALL_END);
    const minX = Math.min(pFL[0], pBL[0]) - 12;
    const maxX = Math.max(pFR[0], pBR[0]) + 12;
    const minY = clamp(Math.min(pBL[1], pBR[1]) - 10, 300, 620);
    const maxY = clamp(Math.max(pFL[1], pFR[1]) + 14, minY + 60, 670);
    HOT_D.loi = {
      x: Math.round(minX),
      y: Math.round(minY),
      w: Math.round(maxX - minX),
      h: Math.round(maxY - minY),
    };
  }

  // ============================================================================
  // CẢNH 1 · SC.dinhngoai · CỔNG ĐÌNH NHÌN TỪ NGOÀI (dùng SVG Băng 1)
  // ============================================================================
  const [ngoaiC, ngoaiG] = layer();
  let ngoaiBaked = false;
  let ngoaiImgsReady = false;

  // Vẽ hai cánh cổng gỗ đinh đồng & ổ khoá khớp đúng .o-gate của Băng 1 (x: 620..980, y: 404..816)
  function drawWoodenGateDoors(c) {
    const gx = 620;
    const gy = 404;
    const gw = 360;
    const gh = 412;
    const halfW = gw * 0.5;
    const plankCols = ['#4A2A16', '#43260F', '#4D2C17', '#40240F'];

    for (let side = 0; side < 2; side++) {
      const wx = gx + side * halfW;
      const pw = halfW / 4;
      for (let i = 0; i < 4; i++) {
        c.fillStyle = plankCols[i];
        c.fillRect(wx + i * pw, gy, pw + 0.5, gh);
      }
      c.strokeStyle = '#1E1008';
      c.lineWidth = 2.6;
      for (let i = 1; i < 4; i++) {
        c.beginPath();
        c.moveTo(wx + i * pw, gy);
        c.lineTo(wx + i * pw, gy + gh);
        c.stroke();
      }

      // Ba thanh ngang gỗ sẫm + viền bắt sáng trên thanh
      const bars = [
        [0, 23],
        [gh * (49 / 106), 23],
        [gh * (97 / 106), gh * (9 / 106)],
      ];
      for (let b = 0; b < bars.length; b++) {
        c.fillStyle = '#33190B';
        c.fillRect(wx, gy + bars[b][0], halfW, bars[b][1]);
        c.fillStyle = 'rgba(106,68,40,0.6)';
        c.fillRect(wx, gy + bars[b][0], halfW, 3);
      }

      // Đinh đồng (7 hàng × 4 cột mỗi cánh)
      const studRows = [13, 23, 33, 42, 64, 74, 84];
      const studCols = [6, 17.5, 28.5, 40];
      c.fillStyle = '#B8944E';
      c.strokeStyle = '#5A4020';
      c.lineWidth = 1.4;
      for (let r = 0; r < studRows.length; r++) {
        const sy = gy + (studRows[r] / 106) * gh;
        for (let k = 0; k < studCols.length; k++) {
          const sx = wx + (studCols[k] / 46) * halfW;
          c.beginPath();
          c.arc(sx, sy, 5.5, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
      }

      // Tay nắm vòng đồng ở gần khe giữa hai cánh
      const kx = side === 0 ? wx + halfW * (40 / 46) : wx + halfW * (6 / 46);
      const ky = gy + gh * (56 / 106);
      c.fillStyle = '#7A5A30';
      c.strokeStyle = '#C9A35B';
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(kx, ky, 16, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      c.strokeStyle = '#D4B26A';
      c.lineWidth = 4;
      c.beginPath();
      c.arc(kx, ky + 16, 12.5, 0, Math.PI * 2);
      c.stroke();

      // Bóng tối dọc khe giữa hai cánh
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fillRect(side === 0 ? wx + halfW - 7 : wx, gy, 7, gh);
    }

    // Ổ khoá đồng giữa hai cánh cổng
    const lx = gx + halfW;
    const ly = gy + gh * 0.48;
    c.strokeStyle = '#9C8A6A';
    c.lineWidth = 4.2;
    c.beginPath();
    c.moveTo(lx - 9, ly);
    c.lineTo(lx - 9, ly - 8);
    c.arc(lx, ly - 8, 9, Math.PI, 0);
    c.lineTo(lx + 9, ly);
    c.stroke();

    c.fillStyle = '#B8944E';
    c.strokeStyle = '#6A5028';
    c.lineWidth = 1.6;
    roundRect(c, lx - 14, ly - 2, 28, 28, 5);
    c.fill();
    c.stroke();

    c.fillStyle = '#3A2A14';
    c.beginPath();
    c.arc(lx, ly + 10, 3.5, 0, Math.PI * 2);
    c.fill();
    c.fillRect(lx - 1.4, ly + 12, 2.8, 7);
  }

  function bakeDinhNgoai() {
    if (!cv.width || !cv.height) return;
    buildSprites();
    initHotD();
    ngoaiC.width = cv.width;
    ngoaiC.height = cv.height;
    dseed = 53;

    const c = ngoaiG;
    setT(c);
    c.fillStyle = '#05070F';
    c.fillRect(-300, -300, W + 600, H + 600);

    const readyTrong = isImgReady(imgTrong);
    const readyNgoai = isImgReady(imgNgoai);

    // 1. Lớp trong thu nhẹ 0.93 phía sau bầu trời & lỗ cổng (giống .v3 .inner trong Băng 1)
    if (readyTrong) {
      c.save();
      c.translate(W * 0.5, H * 0.64);
      c.scale(0.93, 0.93);
      c.translate(-W * 0.5, -H * 0.64);
      c.drawImage(imgTrong, 0, 0, W, H);
      c.restore();
      c.fillStyle = 'rgba(3,4,10,0.34)';
      c.fillRect(-300, -300, W + 600, H + 600);
    }

    // 2. Hai cánh cổng gỗ đóng kín + ổ khoá đồng nằm sau khung cổng đá
    drawWoodenGateDoors(c);

    // 3. Lớp tường & mái cổng "ĐÌNH LÀNG" lấy nguyên văn từ SVG Băng 1
    if (readyNgoai) {
      c.drawImage(imgNgoai, 0, 0, W, H);
    }

    // 4. Hạt phim & viền tối 4 góc đêm sâu (giữ góc trên trái tối sạch)
    grain(c, 5500, 0.018);
    vignette(c, 0.68);

    ngoaiBaked = true;
    ngoaiImgsReady = readyTrong && readyNgoai;
  }

  function ensureNgoaiBaked() {
    const imgsNow = isImgReady(imgTrong) && isImgReady(imgNgoai);
    if (!ngoaiBaked || ngoaiC.width !== cv.width || ngoaiC.height !== cv.height || (!ngoaiImgsReady && imgsNow)) {
      bakeDinhNgoai();
    }
  }

  function drawDinhNgoai(c, now) {
    ensureNgoaiBaked();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(ngoaiC, 0, 0);
    setT(c);

    const t = now * 0.001;
    const baseAlpha = c.globalAlpha;

    // 1. Đom đóm bay nhẹ phía trên tường (quanh tán đa trái và ngọn tre phải)
    drawFireflies(c, FF_NGOAI, t, baseAlpha);

    // 2. Ánh sáng đèn lồng hai bên mái cổng & viên ngọc trên nóc phập phồng ấm áp
    c.save();
    c.globalCompositeOperation = 'lighter';
    const fL = 0.84 + 0.10 * Math.sin(t * 2.1) + 0.06 * Math.sin(t * 6.3);
    const fR = 0.84 + 0.10 * Math.sin(t * 2.3 + 1.4) + 0.06 * Math.sin(t * 5.7 + 0.7);
    const pPulse = 0.35 + 0.25 * Math.sin(t * 1.3);

    c.globalAlpha = baseAlpha * 0.45 * fL;
    c.drawImage(SP_D.lantern, 584 - 46, 368 - 46, 92, 92);
    c.globalAlpha = baseAlpha * 0.24 * fL;
    c.drawImage(SP_D.warm, 584 - 92, 368 - 76, 184, 168);

    c.globalAlpha = baseAlpha * 0.45 * fR;
    c.drawImage(SP_D.lantern, 1016 - 46, 368 - 46, 92, 92);
    c.globalAlpha = baseAlpha * 0.24 * fR;
    c.drawImage(SP_D.warm, 1016 - 92, 368 - 76, 184, 168);

    c.globalAlpha = baseAlpha * 0.28 * pPulse;
    c.drawImage(SP_D.glow, 800 - 28, 217.6 - 28, 56, 56);
    c.restore();
  }

  // ============================================================================
  // CẢNH 2 · SC.dinhtrong · SÂN TRONG ĐÌNH (SVG Băng 1 + radio gỗ + đèn lồng)
  // ============================================================================
  const [trongC, trongG] = layer();
  let trongBaked = false;
  let trongImgReady = false;

  // Vẽ chiếc radio gỗ nhỏ đặt trên bàn đá (theo đúng thiết kế o-radio của Băng 1)
  function drawWoodenRadio(c) {
    // Tọa độ khớp bàn đá bên phải (cx = 1304, mặt bàn y ≈ 708)
    const rx = 1232;
    const ry = 622;
    const rw = 144;
    const rh = 86;

    c.save();
    // Bóng đổ nhẹ trên mặt bàn đá
    c.fillStyle = 'rgba(0,0,0,0.42)';
    c.beginPath();
    c.ellipse(rx + rw * 0.5, ry + rh - 2, rw * 0.48, 8, 0, 0, Math.PI * 2);
    c.fill();

    // Ăng-ten nghiêng lên
    c.strokeStyle = '#9BA7B4';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(rx + 36, ry + 8);
    c.lineTo(rx + 104, ry - 4);
    c.stroke();
    c.fillStyle = '#B8C2CE';
    c.beginPath();
    c.arc(rx + 104, ry - 4, 2.4, 0, Math.PI * 2);
    c.fill();

    // Thân gỗ radio bo góc + viền tối
    c.fillStyle = '#6B4426';
    roundRect(c, rx, ry + 8, rw, rh - 12, 11);
    c.fill();
    c.strokeStyle = '#3A2414';
    c.lineWidth = 3;
    c.stroke();
    // Viền sáng mảnh mép trên vỏ gỗ
    c.strokeStyle = 'rgba(218,176,132,0.22)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(rx + 12, ry + 10);
    c.lineTo(rx + rw - 12, ry + 10);
    c.stroke();

    // Mặt loa bên trái & 7 nan ngang
    c.fillStyle = '#2B1C12';
    roundRect(c, rx + 10, ry + 17, 68, 54, 6);
    c.fill();
    c.strokeStyle = '#5A4030';
    c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const ly = ry + 23.5 + i * 6.8;
      c.beginPath();
      c.moveTo(rx + 15, ly);
      c.lineTo(rx + 73, ly);
      c.stroke();
    }

    // Ô cửa số dò sóng (nền tối ấm + kim đỏ)
    c.fillStyle = '#3A2A16';
    roundRect(c, rx + 88, ry + 17, 42, 21, 3.5);
    c.fill();
    c.fillStyle = 'rgba(255,196,106,0.45)';
    roundRect(c, rx + 90, ry + 19, 38, 17, 2.5);
    c.fill();
    c.strokeStyle = '#4A3018';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(rx + 93, ry + 31);
    c.lineTo(rx + 125, ry + 31);
    c.stroke();
    c.strokeStyle = '#C23A3A';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(rx + 105, ry + 20);
    c.lineTo(rx + 105, ry + 35);
    c.stroke();

    // Hai núm vặn đồng kem bên dưới
    const knobs = [rx + 97, rx + 120];
    for (let i = 0; i < knobs.length; i++) {
      const kx = knobs[i];
      const ky = ry + 58;
      c.fillStyle = '#C9B48E';
      c.strokeStyle = '#6A5028';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(kx, ky, 8.2, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.strokeStyle = '#3A2A14';
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(kx, ky);
      c.lineTo(kx + (i === 0 ? 0 : 4), ky - 5.2);
      c.stroke();
    }
    c.restore();
  }

  function bakeDinhTrong() {
    if (!cv.width || !cv.height) return;
    buildSprites();
    initHotD();
    trongC.width = cv.width;
    trongC.height = cv.height;
    dseed = 71;

    const c = trongG;
    setT(c);
    c.fillStyle = '#05070F';
    c.fillRect(-300, -300, W + 600, H + 600);

    const ready = isImgReady(imgTrong);
    if (ready) {
      c.drawImage(imgTrong, 0, 0, W, H);

      // Giữ nguyên SVG gốc nhưng phủ bóng đêm dịu lên vùng .warmth & .spill (trong Băng 1 được CSS giảm opacity)
      const wGr = c.createRadialGradient(800, 412, 26, 800, 460, 165);
      wGr.addColorStop(0, 'rgba(30,16,7,0.14)');
      wGr.addColorStop(0.55, 'rgba(24,13,6,0.34)');
      wGr.addColorStop(1, 'rgba(16,9,5,0.52)');
      c.fillStyle = wGr;
      c.fillRect(676, 344, 248, 232);

      // Tam bậc thềm đình: dịu lớp #FFB36B xuống còn ánh hắt ấm nhẹ & hiện rõ nếp 3 bậc đá
      c.save();
      c.beginPath();
      c.moveTo(676, 576);
      c.lineTo(924, 576);
      c.lineTo(964, 668);
      c.lineTo(636, 668);
      c.closePath();
      c.clip();
      const sGr = c.createLinearGradient(0, 576, 0, 668);
      sGr.addColorStop(0, 'rgba(22,16,12,0.68)');
      sGr.addColorStop(0.5, 'rgba(17,13,11,0.78)');
      sGr.addColorStop(1, 'rgba(11,9,8,0.88)');
      c.fillStyle = sGr;
      c.fillRect(636, 576, 328, 92);
      c.fillStyle = 'rgba(10,8,7,0.45)';
      c.fillRect(636, 605, 328, 3);
      c.fillRect(636, 636, 328, 3);
      c.fillStyle = 'rgba(255,198,132,0.08)';
      c.fillRect(636, 608, 328, 2);
      c.fillRect(636, 639, 328, 2);
      c.restore();
    }

    // Dịu nhẹ toàn cảnh đêm sâu (tương đương .v3 .inner::after của Băng 1)
    c.fillStyle = 'rgba(3,4,10,0.20)';
    c.fillRect(-300, -300, W + 600, H + 600);

    // Đặt chiếc radio gỗ nhỏ trên bàn đá bên phải
    drawWoodenRadio(c);

    // Hạt phim & viền tối đêm sâu
    grain(c, 5500, 0.018);
    vignette(c, 0.68);

    trongBaked = true;
    trongImgReady = ready;
  }

  function ensureTrongBaked() {
    const readyNow = isImgReady(imgTrong);
    if (!trongBaked || trongC.width !== cv.width || trongC.height !== cv.height || (!trongImgReady && readyNow)) {
      bakeDinhTrong();
    }
  }

  // Vẽ đèn lồng đỏ treo giữa hiên (theo đúng o-lantern Băng 1), đung đưa & phập phồng ấm
  function drawCenterLantern(c, t, flick, baseAlpha) {
    const ax = 800;
    const ay = 360;
    const sway = Math.sin(t * 1.05) * 0.042;

    c.save();
    c.translate(ax, ay);
    c.rotate(sway);

    // Dây treo từ hiên đình
    c.strokeStyle = '#9BA7B4';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, 16);
    c.stroke();

    // Chụp đồng trên
    c.fillStyle = '#C9A35B';
    roundRect(c, -13, 14, 26, 7, 2);
    c.fill();

    // Thân đèn lồng đỏ ấm & nan tre cong
    c.fillStyle = '#C83B24';
    c.beginPath();
    c.ellipse(0, 45, 21, 25, 0, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = '#3A0E0A';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, 20.5);
    c.lineTo(0, 69.5);
    c.moveTo(-11, 24);
    c.quadraticCurveTo(-17, 45, -11, 66);
    c.moveTo(11, 24);
    c.quadraticCurveTo(17, 45, 11, 66);
    c.stroke();

    // Lõi sáng vàng phập phồng bên trong đèn lồng
    c.fillStyle = `rgba(255,192,102,${0.55 + 0.30 * flick})`;
    c.beginPath();
    c.ellipse(0, 45, 11, 14.5, 0, 0, Math.PI * 2);
    c.fill();

    // Chụp đồng dưới & tua rua
    c.fillStyle = '#C9A35B';
    roundRect(c, -13, 69, 26, 7, 2);
    c.fill();
    c.strokeStyle = '#C9A35B';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-5.5, 76);
    c.lineTo(-7, 96);
    c.moveTo(0, 76);
    c.lineTo(0, 100);
    c.moveTo(5.5, 76);
    c.lineTo(7, 96);
    c.stroke();

    // Quầng sáng ấm cộng thêm quanh đèn lồng
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = baseAlpha * (0.58 * flick);
    c.drawImage(SP_D.lantern, -62, 45 - 62, 124, 124);
    c.globalAlpha = baseAlpha * (0.30 * flick);
    c.drawImage(SP_D.warm, -135, 45 - 120, 270, 240);
    c.restore();
  }

  function drawIncenseSmoke(c, t, baseAlpha) {
    c.save();
    for (let i = 0; i < SMOKE_WISPS.length; i++) {
      const w = SMOKE_WISPS[i];
      const u = (((t + w.ph) / w.dur) % 1 + 1) % 1;
      const a = u < 0.22 ? u / 0.22 : 1 - (u - 0.22) / 0.78;
      if (a <= 0.01) continue;
      // 3 đoạn hạt khói nối mềm tạo vệt khói mỏng bay uốn lượn lên cao
      for (let k = 0; k < 4; k++) {
        const uk = clamp(u - k * 0.055, 0, 1);
        const y = w.by - uk * 96;
        const x = w.bx + Math.sin(uk * 5.2 + w.ph) * (w.amp * (0.3 + uk)) + uk * 10;
        const rx = 6 + uk * 13 + k * 1.4;
        const ry = 10 + uk * 18;
        c.globalAlpha = baseAlpha * a * 0.26 * (1 - k * 0.18);
        c.drawImage(SP_D.smoke, x - rx, y - ry, rx * 2, ry * 2);
      }
    }
    c.restore();
  }

  function drawDinhTrong(c, now) {
    ensureTrongBaked();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(trongC, 0, 0);
    setT(c);

    const t = now * 0.001;
    const baseAlpha = c.globalAlpha;

    // 1. Đom đóm bay quanh cây đa & bụi tre
    drawFireflies(c, FF_TRONG, t, baseAlpha);

    // 2. Đèn lồng phập phồng ấm (hai đèn hiên phụ + đèn chính giữa hiên + ánh nến gian thờ + ô radio)
    const flickMain = 0.86 + 0.09 * Math.sin(t * 2.2) + 0.05 * Math.sin(t * 6.8);
    const flickL = 0.82 + 0.11 * Math.sin(t * 2.5 + 0.8) + 0.07 * Math.sin(t * 7.4);
    const flickR = 0.82 + 0.11 * Math.sin(t * 2.1 + 2.1) + 0.07 * Math.sin(t * 6.1);

    c.save();
    c.globalCompositeOperation = 'lighter';
    // Hai đèn lồng phụ dưới mái hiên
    c.globalAlpha = baseAlpha * 0.42 * flickL;
    c.drawImage(SP_D.lantern, 432 - 58, 345.6 - 58, 116, 116);
    c.globalAlpha = baseAlpha * 0.18 * flickL;
    c.drawImage(SP_D.warm, 432 - 110, 345.6 - 95, 220, 195);

    c.globalAlpha = baseAlpha * 0.42 * flickR;
    c.drawImage(SP_D.lantern, 1168 - 58, 345.6 - 58, 116, 116);
    c.globalAlpha = baseAlpha * 0.18 * flickR;
    c.drawImage(SP_D.warm, 1168 - 110, 345.6 - 95, 220, 195);

    // Ánh nến gian thờ và ô số ấm nhẹ trên radio
    c.globalAlpha = baseAlpha * (0.16 + 0.05 * Math.sin(t * 1.9));
    c.drawImage(SP_D.warm, 800 - 165, 480 - 125, 330, 250);
    c.globalAlpha = baseAlpha * (0.14 + 0.04 * Math.sin(t * 1.6));
    c.drawImage(SP_D.glow, 1341 - 36, 650 - 26, 72, 52);

    // Đầu đốm lửa nhang (3 que hương trên lư đồng)
    const embers = [
      [780, 700, 0.0],
      [800, 692, 0.9],
      [820, 704, 1.7],
    ];
    for (let i = 0; i < embers.length; i++) {
      const eb = embers[i];
      const ep = 0.65 + 0.35 * Math.sin(t * 3.1 + eb[2]);
      c.globalAlpha = baseAlpha * ep;
      c.drawImage(SP_D.lantern, eb[0] - 9, eb[1] - 9, 18, 18);
      c.fillStyle = `rgba(255,148,78,${0.85 * ep})`;
      c.beginPath();
      c.arc(eb[0], eb[1], 2.8, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // Đèn lồng chính đung đưa giữa hiên đình
    drawCenterLantern(c, t, flickMain, baseAlpha);

    // 3. Khói hương mỏng bay lên từ lư đồng
    drawIncenseSmoke(c, t, baseAlpha);
  }

  // ============================================================================
  // CẢNH 3 · SC.benphai · GÓC PHẢI ĐÌNH · LỐI ĐÁ MÉP HỒ · GIẾNG & CỔNG CHÀO XA
  // ============================================================================
  const [bpLitC, bpLitG] = layer();
  const [bpDarkMaskC, bpDarkMaskG] = layer();
  const [bpAmbientC, bpAmbientG] = layer();
  let bpBaked = false;
  let bpMoonSprite = null;
  let bpGateLampPt = PB(0.63, 2.66, BP_Z_GATE - 0.35);
  const BP_MOON_POS = [1260, 118];

  // Dữ liệu gợn sóng lăn tăn cố định trên mặt hồ (không cấp phát mỗi khung)
  const BP_RIPPLES = [];
  (function initBpRipples() {
    let s = 313;
    const r0 = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    // Cột sóng phản chiếu ánh trăng bạc bên phải mặt hồ
    for (let i = 0; i < 12; i++) {
      const u = i / 11;
      const y = lerp(404, 650, Math.pow(u, 1.35));
      const w = lerp(18, 76, u) * (0.75 + 0.5 * r0());
      const x = BP_MOON_POS[0] + (r0() - 0.5) * lerp(28, 120, u);
      BP_RIPPLES.push({
        x, y, w, h: lerp(1.2, 2.5, u),
        amp: lerp(2.0, 6.5, u), spd: 1.1 + r0() * 1.1, ph: r0() * Math.PI * 2,
        col: '188,210,255', baseA: lerp(0.16, 0.34, 1 - Math.abs(u - 0.45)),
      });
    }
    // Cột sóng phản chiếu ánh đèn đường vàng từ cổng chào phía xa
    for (let i = 0; i < 10; i++) {
      const u = i / 9;
      const y = lerp(402, 595, Math.pow(u, 1.3));
      const w = lerp(14, 52, u) * (0.7 + 0.5 * r0());
      const x = bpGateLampPt[0] + 18 + (r0() - 0.5) * lerp(18, 64, u);
      BP_RIPPLES.push({
        x, y, w, h: lerp(1.2, 2.2, u),
        amp: lerp(1.6, 4.8, u), spd: 1.3 + r0() * 1.2, ph: r0() * Math.PI * 2,
        col: '255,204,116', baseA: lerp(0.20, 0.42, 1 - u * 0.65),
      });
    }
  })();

  function ensureBpMoonSprite() {
    if (bpMoonSprite) return;
    const cv2 = document.createElement('canvas');
    cv2.width = 160;
    cv2.height = 160;
    const x = cv2.getContext('2d');
    const gr = x.createRadialGradient(80, 80, 0, 80, 80, 80);
    gr.addColorStop(0, 'rgba(220,234,255,0.58)');
    gr.addColorStop(0.28, 'rgba(170,196,245,0.22)');
    gr.addColorStop(0.66, 'rgba(120,152,216,0.06)');
    gr.addColorStop(1, 'rgba(80,110,180,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 160, 160);
    bpMoonSprite = cv2;
  }

  // Tạo viền đa giác nham nhở cho mảng vữa tróc lộ gạch (giống nét tróc của tường đình Băng 1)
  function jaggedRing(basePts, jitter) {
    const out = [];
    for (let i = 0; i < basePts.length; i++) {
      const a = basePts[i];
      const b = basePts[(i + 1) % basePts.length];
      out.push(a);
      out.push([
        (a[0] + b[0]) * 0.5 + (drnd() - 0.5) * jitter,
        (a[1] + b[1]) * 0.5 + (drnd() - 0.5) * jitter,
      ]);
    }
    return out;
  }

  // Vẽ mảng gạch đỏ lộ ra trên mặt trước tường đình
  function drawDinhBrickFront(c, x0, x1, y0, y1, z, basePts) {
    const innerPts = jaggedRing(basePts, 6);
    c.save();
    c.beginPath();
    for (let i = 0; i < innerPts.length; i++) {
      if (i) c.lineTo(innerPts[i][0], innerPts[i][1]);
      else c.moveTo(innerPts[i][0], innerPts[i][1]);
    }
    c.closePath();
    c.clip();

    poly(c, innerPts, '#3A2218');
    const rows = Math.max(4, Math.round((y1 - y0) / 0.068));
    const cols = Math.max(4, Math.round((x1 - x0) / 0.165));
    const dy = (y1 - y0) / rows;
    const dx = (x1 - x0) / cols;
    for (let r = 0; r < rows; r++) {
      const by0 = y0 + r * dy + 0.005;
      const by1 = y0 + (r + 1) * dy - 0.006;
      const stagger = (r % 2) * 0.5 * dx;
      for (let col = -1; col <= cols; col++) {
        const bx0 = Math.max(x0, x0 + col * dx + stagger + 0.006);
        const bx1 = Math.min(x1, x0 + (col + 1) * dx + stagger - 0.006);
        if (bx1 - bx0 < 0.018) continue;
        const tone = (drnd() - 0.5) * 16;
        const damp = Math.max(0, 1 - by0 / 0.55) * 0.22;
        const cr = Math.round((124 + tone) * (1 - damp));
        const cg = Math.round((73 + tone * 0.55) * (1 - damp * 0.8));
        const cb = Math.round((52 + tone * 0.4) * (1 - damp * 0.6));
        const p0 = PB(bx0, by0, z);
        const p1 = PB(bx1, by0, z);
        const p2 = PB(bx1, by1, z);
        const p3 = PB(bx0, by1, z);
        poly(c, [p0, p1, p2, p3], `rgb(${cr},${cg},${cb})`);
        seg(c, p0, p1, 0.9, 'rgba(34,20,14,0.48)');
      }
    }
    c.restore();
    strokePoly(c, innerPts, 2.2, '#2E241D', true);
  }

  // Vẽ mảng gạch đỏ lộ ra trên mặt tường hông đình dọc lối đá
  function drawDinhBrickSide(c, xWall, y0, y1, z0, z1, basePts) {
    const innerPts = jaggedRing(basePts, 5);
    c.save();
    c.beginPath();
    for (let i = 0; i < innerPts.length; i++) {
      if (i) c.lineTo(innerPts[i][0], innerPts[i][1]);
      else c.moveTo(innerPts[i][0], innerPts[i][1]);
    }
    c.closePath();
    c.clip();

    poly(c, innerPts, '#2D1A13');
    const rows = Math.max(4, Math.round((y1 - y0) / 0.068));
    const cols = Math.max(5, Math.round((z1 - z0) / 0.19));
    const dy = (y1 - y0) / rows;
    const dz = (z1 - z0) / cols;
    for (let r = 0; r < rows; r++) {
      const by0 = y0 + r * dy + 0.005;
      const by1 = y0 + (r + 1) * dy - 0.006;
      const stag = (r % 2) * 0.5 * dz;
      for (let col = -1; col <= cols; col++) {
        const bz0 = Math.max(z0, z0 + col * dz + stag + 0.008);
        const bz1 = Math.min(z1, z0 + (col + 1) * dz + stag - 0.008);
        if (bz1 - bz0 < 0.025) continue;
        const depthFade = clamp(1 - (bz0 - z0) / (z1 - z0 + 2.4), 0.42, 1);
        const tone = (drnd() - 0.5) * 14;
        const cr = Math.round((118 + tone) * depthFade);
        const cg = Math.round((70 + tone * 0.5) * depthFade);
        const cb = Math.round((49 + tone * 0.4) * depthFade);
        const p0 = PB(xWall, by0, bz0);
        const p1 = PB(xWall, by0, bz1);
        const p2 = PB(xWall, by1, bz1);
        const p3 = PB(xWall, by1, bz0);
        poly(c, [p0, p1, p2, p3], `rgb(${cr},${cg},${cb})`);
        seg(c, p0, p1, 0.8, 'rgba(26,15,10,0.48)');
      }
    }
    c.restore();
    strokePoly(c, innerPts, 1.8, '#261E18', true);
  }

  // Vẽ đám rêu chân tường (#232C1D)
  function drawDinhMoss(c, cx, cy, rx, ry) {
    const pts = [];
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2;
      const rr = 0.65 + drnd() * 0.45;
      pts.push([cx + Math.cos(ang) * rx * rr, cy + Math.sin(ang) * ry * rr]);
    }
    poly(c, pts, 'rgba(35,44,29,0.88)');
    const sub = [];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.4;
      const rr = 0.48 + drnd() * 0.34;
      sub.push([cx - rx * 0.10 + Math.cos(ang) * rx * 0.56 * rr, cy - ry * 0.14 + Math.sin(ang) * ry * 0.50 * rr]);
    }
    poly(c, sub, 'rgba(48,61,38,0.58)');
  }

  // Vẽ ngói mũi hài trên đầu tường đình (mặt trước + chạy dọc tường hông)
  function drawDinhWallTiles(c) {
    const zF = BP_Z_FRONT;
    const zE = BP_Z_WALL_END;
    const xL = BP_X_WALL;
    const yT = BP_WALL_TOP;

    const fTopA = PB(-4.0, yT + 0.085, zF);
    const fTopB = PB(xL + 0.04, yT + 0.085, zF);
    const fBotB = PB(xL + 0.04, yT - 0.03, zF);
    const fBotA = PB(-4.0, yT - 0.03, zF);
    poly(c, [fTopA, fTopB, fBotB, fBotA], '#2D221D');
    poly(c, [PB(-4.0, yT + 0.115, zF), PB(xL + 0.04, yT + 0.115, zF), fTopB, fTopA], '#463730');
    poly(c, [fBotA, fBotB, PB(xL + 0.04, yT - 0.055, zF), PB(-4.0, yT - 0.055, zF)], '#16100D');
    seg(c, PB(-4.0, yT + 0.115, zF), PB(xL + 0.04, yT + 0.115, zF), 1.6, 'rgba(182,198,236,0.52)');

    const stepX = 0.072;
    for (let x = -3.85; x <= xL; x += stepX) {
      const pL = PB(x, yT - 0.025, zF);
      const pR = PB(x + stepX, yT - 0.025, zF);
      const pMid = PB(x + stepX * 0.5, yT + 0.07, zF);
      c.strokeStyle = '#150F0D';
      c.lineWidth = 2.1;
      c.beginPath();
      c.moveTo(pL[0], pL[1]);
      c.quadraticCurveTo(pMid[0], pMid[1], pR[0], pR[1]);
      c.stroke();

      c.strokeStyle = 'rgba(168,182,216,0.68)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(pL[0] + 1, pL[1] - 3);
      c.quadraticCurveTo(pMid[0], pMid[1] - 2.6, pR[0] - 1, pR[1] - 3);
      c.stroke();
    }

    const sTopA = PB(xL - 0.02, yT + 0.085, zF);
    const sTopB = PB(xL - 0.02, yT + 0.05, zE);
    const sBotB = PB(xL + 0.04, yT - 0.03, zE);
    const sBotA = PB(xL + 0.04, yT - 0.03, zF);
    poly(c, [sTopA, sTopB, sBotB, sBotA], '#241B17');
    poly(c, [PB(xL - 0.03, yT + 0.115, zF), PB(xL - 0.03, yT + 0.08, zE), sTopB, sTopA], '#382B25');
    poly(c, [sBotA, sBotB, PB(xL + 0.04, yT - 0.055, zE), PB(xL + 0.04, yT - 0.055, zF)], '#100b09');
    seg(c, PB(xL - 0.03, yT + 0.115, zF), PB(xL - 0.03, yT + 0.08, zE), 1.4, 'rgba(175,192,232,0.44)');

    for (let z = zF + 0.10; z < zE - 0.3; z += 0.24) {
      const a = PB(xL + 0.01, yT - 0.025, z);
      const b = PB(xL + 0.01, yT - 0.025, z + 0.22);
      const m = PB(xL, yT + 0.058, z + 0.11);
      c.strokeStyle = '#120d0b';
      c.lineWidth = clamp(6.5 / z, 0.9, 2.0);
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.quadraticCurveTo(m[0], m[1], b[0], b[1]);
      c.stroke();

      c.strokeStyle = 'rgba(116,94,82,0.68)';
      c.lineWidth = clamp(3.4 / z, 0.6, 1.1);
      c.beginPath();
      c.moveTo(a[0], a[1] - 2.2);
      c.quadraticCurveTo(m[0], m[1] - 2.0, b[0], b[1] - 2.0);
      c.stroke();
    }
  }

  // Vẽ mái ngói cong đầu đao của gian đình vươn lên phía trên tường bên trái (tránh góc x<200, y<240)
  function drawDinhCurvedRoof(c) {
    const zRoof = 4.45;
    const rPeak = PB(-2.85, 2.50, zRoof + 0.35);
    const rRidgeR = PB(-1.85, 2.50, zRoof + 0.35);
    const rEaveL = PB(-3.20, 1.82, zRoof);
    const rEaveM = PB(-2.10, 1.86, zRoof);
    const rEaveTip = PB(-1.26, 2.16, zRoof - 0.12);
    const rSideBack = PB(-1.42, 2.08, 7.6);
    const rRidgeBack = PB(-1.85, 2.48, 7.6);

    // Mảng tường đầu hồi tối dưới mái
    poly(c, [PB(-3.1, 1.72, zRoof + 0.1), PB(-1.52, 1.72, zRoof + 0.1), rRidgeR, rPeak], '#1a1513');
    poly(c, [PB(-1.52, 1.72, zRoof + 0.1), PB(-1.42, 1.72, 7.6), rSideBack, rRidgeR], '#14100f');

    // Mái ngói cong hông bên phải (hướng về phía mặt hồ)
    const sideGr = c.createLinearGradient(rRidgeR[0], rRidgeR[1], rEaveTip[0], rEaveTip[1]);
    sideGr.addColorStop(0, '#3e2f29');
    sideGr.addColorStop(0.65, '#2b201c');
    sideGr.addColorStop(1, '#18110f');
    c.fillStyle = sideGr;
    c.beginPath();
    c.moveTo(rRidgeR[0], rRidgeR[1]);
    c.lineTo(rRidgeBack[0], rRidgeBack[1]);
    c.quadraticCurveTo(rSideBack[0] + 6, rSideBack[1] + 6, rEaveTip[0], rEaveTip[1]);
    c.closePath();
    c.fill();

    // Mặt mái trước với đường tàu mái võng xuống rồi hất cong đầu đao sang phải
    const roofGr = c.createLinearGradient(rPeak[0], rPeak[1], rEaveM[0], rEaveM[1]);
    roofGr.addColorStop(0, '#44342d');
    roofGr.addColorStop(0.55, '#2e221e');
    roofGr.addColorStop(1, '#1a1311');
    c.fillStyle = roofGr;
    c.beginPath();
    c.moveTo(rPeak[0], rPeak[1]);
    c.lineTo(rRidgeR[0], rRidgeR[1]);
    c.quadraticCurveTo(rEaveM[0] + 55, rEaveM[1] + 10, rEaveTip[0], rEaveTip[1]);
    c.quadraticCurveTo(rEaveM[0], rEaveM[1] + 8, rEaveL[0], rEaveL[1]);
    c.closePath();
    c.fill();

    // Các hàng rãnh ngói cong chạy từ bờ nóc xuống diềm mái
    c.strokeStyle = 'rgba(15,10,9,0.72)';
    c.lineWidth = 1.5;
    for (let i = 1; i <= 9; i++) {
      const f = i / 10;
      const topPt = [lerp(rPeak[0], rRidgeR[0], f), lerp(rPeak[1], rRidgeR[1], f)];
      const botPt = [lerp(rEaveL[0], rEaveTip[0], f * 0.96), lerp(rEaveL[1], rEaveTip[1], f * 0.96) + Math.sin(f * Math.PI) * 5];
      c.beginPath();
      c.moveTo(topPt[0], topPt[1]);
      c.quadraticCurveTo(lerp(topPt[0], botPt[0], 0.52), lerp(topPt[1], botPt[1], 0.58), botPt[0], botPt[1]);
      c.stroke();
    }

    // Bờ nóc mái & đao cong vuốt lên dưới ánh trăng bạc
    c.strokeStyle = '#150f0d';
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(rEaveL[0], rEaveL[1]);
    c.quadraticCurveTo(rEaveM[0], rEaveM[1] + 8, rEaveTip[0], rEaveTip[1]);
    c.quadraticCurveTo(rEaveTip[0] + 10, rEaveTip[1] - 12, rEaveTip[0] + 5, rEaveTip[1] - 21);
    c.stroke();

    c.strokeStyle = 'rgba(176,196,242,0.44)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(rPeak[0], rPeak[1]);
    c.lineTo(rRidgeR[0], rRidgeR[1]);
    c.quadraticCurveTo(rEaveM[0] + 56, rEaveM[1] + 8, rEaveTip[0], rEaveTip[1] - 2);
    c.quadraticCurveTo(rEaveTip[0] + 9, rEaveTip[1] - 13, rEaveTip[0] + 4, rEaveTip[1] - 21);
    c.stroke();

    // Gờ nóc mái đình
    poly(c, [
      [rPeak[0] - 4, rPeak[1] - 4],
      [rRidgeR[0] + 4, rRidgeR[1] - 4],
      [rRidgeR[0] + 4, rRidgeR[1] + 4],
      [rPeak[0] - 4, rPeak[1] + 4],
    ], '#2c211d');
    seg(c, [rPeak[0] - 2, rPeak[1] - 4], [rRidgeR[0] + 2, rRidgeR[1] - 4], 1.2, 'rgba(182,202,246,0.48)');
  }

  // Vẽ cái giếng làng tròn xây gạch có nắp gỗ & giá ròng rọc ở cuối lối bên trái
  function drawFarVillageWell(c, xCenter, zCenter) {
    const r = 0.36;
    const h = 0.68;
    const pPadL = PB(xCenter - 0.56, 0.01, zCenter - 0.35);
    const pPadR = PB(xCenter + 0.56, 0.01, zCenter + 0.35);
    const padC = PB(xCenter, 0.01, zCenter);
    const rxPad = Math.max(22, (pPadR[0] - pPadL[0]) * 0.52);
    const ryPad = Math.max(6, rxPad * 0.25);

    // Bệ đá tròn quanh giếng
    c.fillStyle = '#2d2a26';
    c.beginPath();
    c.ellipse(padC[0], padC[1], rxPad, ryPad, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(205,180,140,0.18)';
    c.lineWidth = 1;
    c.stroke();

    // Thân giếng trụ tròn xây gạch
    const pBotL = PB(xCenter - r, 0.02, zCenter);
    const pBotR = PB(xCenter + r, 0.02, zCenter);
    const pTopL = PB(xCenter - r, h, zCenter);
    const pTopR = PB(xCenter + r, h, zCenter);
    const rx = (pTopR[0] - pTopL[0]) * 0.5;
    const ryTop = Math.max(4, rx * 0.28);

    const wGr = c.createLinearGradient(pTopL[0], 0, pTopR[0], 0);
    wGr.addColorStop(0, '#3a241b');
    wGr.addColorStop(0.55, '#593729');
    wGr.addColorStop(1, '#7a4d34');
    c.fillStyle = wGr;
    c.beginPath();
    c.moveTo(pBotL[0], pBotL[1]);
    c.lineTo(pTopL[0], pTopL[1]);
    c.ellipse(padC[0], pTopL[1], rx, ryTop, 0, Math.PI, 0, false);
    c.lineTo(pBotR[0], pBotR[1]);
    c.ellipse(padC[0], pBotL[1], rx, ryTop * 1.08, 0, 0, Math.PI, false);
    c.closePath();
    c.fill();

    // Mạch gạch vòng quanh thành giếng & rêu chân giếng
    c.strokeStyle = 'rgba(20,12,8,0.62)';
    c.lineWidth = 0.9;
    for (let row = 1; row <= 4; row++) {
      const yy = lerp(pTopL[1], pBotL[1], row / 5);
      c.beginPath();
      c.ellipse(padC[0], yy, rx, ryTop, 0, 0, Math.PI, false);
      c.stroke();
    }
    c.fillStyle = 'rgba(35,44,29,0.75)';
    c.beginPath();
    c.ellipse(padC[0] - rx * 0.35, pBotL[1] + 1, rx * 0.55, ryTop * 0.5, 0, 0, Math.PI * 2);
    c.fill();

    // Vành miệng giếng bằng đá/vữa + lòng giếng tối + nửa nắp gỗ
    c.fillStyle = '#5c5349';
    c.beginPath();
    c.ellipse(padC[0], pTopL[1], rx + 2, ryTop + 1.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#080b10';
    c.beginPath();
    c.ellipse(padC[0], pTopL[1], rx * 0.76, ryTop * 0.68, 0, 0, Math.PI * 2);
    c.fill();

    // Nửa nắp gỗ đậy miệng giếng bên trái
    c.fillStyle = '#38281c';
    c.beginPath();
    c.ellipse(padC[0], pTopL[1], rx * 0.78, ryTop * 0.70, 0, Math.PI * 0.45, Math.PI * 1.55);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(220,192,148,0.28)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.ellipse(padC[0], pTopL[1], rx + 1.5, ryTop + 1.0, 0, -Math.PI * 0.55, Math.PI * 0.35);
    c.stroke();

    // Giá ròng rọc (hai cột dựng hai bên miệng giếng + thanh ngang + bánh ròng rọc & dây thừng)
    const postL0 = PB(xCenter - r * 0.82, h, zCenter);
    const postL1 = PB(xCenter - r * 0.82, h + 0.86, zCenter);
    const postR0 = PB(xCenter + r * 0.82, h, zCenter);
    const postR1 = PB(xCenter + r * 0.82, h + 0.86, zCenter);
    const barM = PB(xCenter, h + 0.84, zCenter);
    seg(c, postL0, postL1, 2.6, '#271e18');
    seg(c, postR0, postR1, 2.6, '#3b2c20');
    seg(c, [postL1[0] - 2, postL1[1]], [postR1[0] + 2, postR1[1]], 2.8, '#36281e');
    // Bánh ròng rọc + dây treo xuống miệng giếng
    c.strokeStyle = '#5a4e40';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(barM[0], barM[1] + 5, 4.2, 0, Math.PI * 2);
    c.stroke();
    seg(c, [barM[0], barM[1] + 9], [padC[0], pTopL[1]], 1.0, 'rgba(182,162,130,0.68)');
  }

  // Vẽ cổng chào đầu ngõ: hai trụ sắt ô lưới, khung sắt hàn ô lưới bên trên, tấm biển dài TRỐNG (không chữ), đèn vàng
  function drawFarWelcomeGate(c, x0, x1, zGate) {
    const pilW = 0.24;
    const hBeam0 = 2.42;
    const hBeam1 = 2.86;
    const hSign0 = 2.88;
    const hSign1 = 3.28;

    const drawTrussColumn = (cx0, cx1) => {
      const bL = PB(cx0, 0.0, zGate);
      const bR = PB(cx1, 0.0, zGate);
      const tL = PB(cx0, hBeam1, zGate);
      const tR = PB(cx1, hBeam1, zGate);
      // Bệ xi măng chân trụ
      poly(c, [PB(cx0 - 0.06, 0, zGate), PB(cx1 + 0.06, 0, zGate), PB(cx1 + 0.06, 0.26, zGate), PB(cx0 - 0.06, 0.26, zGate)], '#2c313a');
      // Hai thanh thép đứng chính
      seg(c, bL, tL, 2.4, '#242e3b');
      seg(c, bR, tR, 2.4, '#364456');
      // Các ô lưới giằng ngang & chéo
      const segs = 7;
      for (let i = 0; i < segs; i++) {
        const yA = lerp(0.28, hBeam1, i / segs);
        const yB = lerp(0.28, hBeam1, (i + 1) / segs);
        const pLA = PB(cx0, yA, zGate);
        const pRA = PB(cx1, yA, zGate);
        const pLB = PB(cx0, yB, zGate);
        const pRB = PB(cx1, yB, zGate);
        seg(c, pLA, pRA, 1.2, '#3a485a');
        seg(c, pLA, pRB, 1.0, '#2a3544');
        seg(c, pRA, pLB, 1.0, '#2a3544');
      }
      seg(c, bR, tR, 0.9, 'rgba(255,212,140,0.34)');
    };

    drawTrussColumn(x0, x0 + pilW);
    drawTrussColumn(x1 - pilW, x1);

    // Khung sắt hàn hình ô lưới bắc ngang qua ngõ
    const gBL = PB(x0, hBeam0, zGate);
    const gBR = PB(x1, hBeam0, zGate);
    const gTL = PB(x0, hBeam1, zGate);
    const gTR = PB(x1, hBeam1, zGate);
    seg(c, gBL, gBR, 2.4, '#364456');
    seg(c, gTL, gTR, 2.4, '#3e4e62');
    const cols = 12;
    for (let i = 0; i <= cols; i++) {
      const gx = lerp(x0, x1, i / cols);
      seg(c, PB(gx, hBeam0, zGate), PB(gx, hBeam1, zGate), 1.3, '#334050');
      if (i < cols) {
        const gxNext = lerp(x0, x1, (i + 1) / cols);
        seg(c, PB(gx, hBeam0, zGate), PB(gxNext, hBeam1, zGate), 1.0, '#2a3544');
        seg(c, PB(gx, hBeam1, zGate), PB(gxNext, hBeam0, zGate), 1.0, '#2a3544');
      }
    }

    // Tấm biển dài trên đầu cổng (ĐỂ TRỐNG HOÀN TOÀN, KHÔNG CHỮ, KHÔNG KÝ HIỆU)
    const sBL = PB(x0 + 0.14, hSign0, zGate);
    const sBR = PB(x1 - 0.14, hSign0, zGate);
    const sTR = PB(x1 - 0.14, hSign1, zGate);
    const sTL = PB(x0 + 0.14, hSign1, zGate);
    const signGr = c.createLinearGradient(sTL[0], sTL[1], sBR[0], sBR[1]);
    signGr.addColorStop(0, '#182436');
    signGr.addColorStop(0.5, '#203048');
    signGr.addColorStop(1, '#162030');
    poly(c, [sBL, sTL, sTR, sBR], signGr);
    strokePoly(c, [sBL, sTL, sTR, sBR], 1.6, '#506278', true);
    seg(c, [sTL[0] + 2, sTL[1] + 2], [sTR[0] - 2, sTR[1] + 2], 0.9, 'rgba(195,215,245,0.28)');

    // Cần đèn & bóng đèn đường vàng gắn ngay cạnh trụ trái cổng chào
    const mountPt = PB(x0 + pilW, 2.52, zGate - 0.1);
    bpGateLampPt = PB(x0 + pilW + 0.24, 2.66, zGate - 0.35);
    c.strokeStyle = '#252e3a';
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(mountPt[0], mountPt[1]);
    c.quadraticCurveTo((mountPt[0] + bpGateLampPt[0]) * 0.5, bpGateLampPt[1] - 6, bpGateLampPt[0], bpGateLampPt[1] - 2);
    c.stroke();

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.42;
    c.drawImage(SP_D.warm, bpGateLampPt[0] - 78, bpGateLampPt[1] - 58, 156, 128);
    c.restore();

    c.fillStyle = '#ffe9b2';
    c.beginPath();
    c.ellipse(bpGateLampPt[0], bpGateLampPt[1], 4.6, 3.0, 0, 0, Math.PI * 2);
    c.fill();
  }

  function bakeBenPhai() {
    if (!cv.width || !cv.height) return;
    buildSprites();
    ensureBpMoonSprite();
    initHotD();
    bpLitC.width = cv.width;
    bpLitC.height = cv.height;
    bpDarkMaskC.width = Math.max(2, cv.width >> 1);
    bpDarkMaskC.height = Math.max(2, cv.height >> 1);
    bpAmbientC.width = bpDarkMaskC.width;
    bpAmbientC.height = bpDarkMaskC.height;
    dseed = 89;

    const c = bpLitG;
    setT(c);

    // 1. Nền trời đêm sâu + ánh trăng phía trên-phải (giữ góc trên-trái x<200, y<240 trống tối)
    let gr = c.createLinearGradient(0, 0, 0, BP_VY + 65);
    gr.addColorStop(0, '#040712');
    gr.addColorStop(0.55, '#091024');
    gr.addColorStop(1, '#141e38');
    c.fillStyle = gr;
    c.fillRect(-300, -300, W + 600, BP_VY + 390);

    // Vài ngôi sao rất mờ ở vùng trời cao bên phải
    for (let i = 0; i < 36; i++) {
      const sx = 320 + drnd() * 1240;
      const sy = 24 + drnd() * 230;
      if (Math.hypot(sx - BP_MOON_POS[0], sy - BP_MOON_POS[1]) < 95) continue;
      c.fillStyle = `rgba(205,222,255,${(0.10 + drnd() * 0.22).toFixed(3)})`;
      c.fillRect(sx, sy, 1.4, 1.4);
    }

    // Mặt trăng & vầng sáng xanh bạc trên bầu trời đêm bên phải
    const moonSky = c.createRadialGradient(BP_MOON_POS[0], BP_MOON_POS[1], 16, BP_MOON_POS[0], BP_MOON_POS[1], 560);
    moonSky.addColorStop(0, 'rgba(182,202,255,0.22)');
    moonSky.addColorStop(0.45, 'rgba(130,154,228,0.08)');
    moonSky.addColorStop(1, 'rgba(12,18,36,0)');
    c.fillStyle = moonSky;
    c.fillRect(500, -140, 1400, 560);

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.62;
    c.drawImage(bpMoonSprite, BP_MOON_POS[0] - 96, BP_MOON_POS[1] - 96, 192, 192);
    c.restore();

    c.fillStyle = '#dce7ff';
    c.beginPath();
    c.arc(BP_MOON_POS[0], BP_MOON_POS[1], 21, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(125,146,192,0.22)';
    c.beginPath();
    c.arc(BP_MOON_POS[0] - 5, BP_MOON_POS[1] - 3, 7, 0, Math.PI * 2);
    c.arc(BP_MOON_POS[0] + 6, BP_MOON_POS[1] + 5, 5, 0, Math.PI * 2);
    c.fill();

    // 2. Đường bờ xa bên kia hồ & rặng cây tối đêm phía sau cổng chào
    const farHorY = PB(0, 0, 21.5)[1];
    c.fillStyle = '#080c18';
    c.beginPath();
    c.moveTo(640, farHorY + 14);
    for (let sx = 640; sx <= 1680; sx += 34) {
      const hCanopy = 18 + Math.abs(Math.sin(sx * 0.017)) * 34 + drnd() * 14;
      c.lineTo(sx, farHorY - hCanopy);
    }
    c.lineTo(1680, farHorY + 14);
    c.closePath();
    c.fill();

    // Phía sau cổng chào đầu ngõ xa: thấp thoáng mái nhà xóm & quầng đèn ngõ ấm
    const gOpenL = PB(0.38, 0, BP_Z_GATE);
    const gOpenR = PB(3.32, 0, BP_Z_GATE);
    poly(c, [
      PB(0.30, 0, 22.5), PB(3.40, 0, 22.5),
      PB(3.40, 2.55, 22.5), PB(0.30, 2.55, 22.5),
    ], '#0b101b');
    const alleyGlow = PB(1.85, 0.9, 22.0);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.22;
    c.drawImage(SP_D.warm, alleyGlow[0] - 55, alleyGlow[1] - 42, 110, 84);
    c.restore();

    // 3. MẶT HỒ ĐÊM RỘNG ở giữa và bên phải (từ mép đường x = BP_X_CURB sang hết mép phải màn hình)
    const waterYTop = PB(0, -0.18, 20.5)[1];
    gr = c.createLinearGradient(0, waterYTop, 0, 900);
    gr.addColorStop(0, '#091120');
    gr.addColorStop(0.28, '#0c182c');
    gr.addColorStop(0.65, '#070f1d');
    gr.addColorStop(1, '#03060c');
    poly(c, [
      PB(BP_X_CURB - 0.04, -0.18, 2.0),
      PB(16.0, -0.18, 2.0),
      PB(16.0, -0.18, 20.5),
      PB(BP_X_CURB - 0.04, -0.18, 20.5),
    ], gr);

    // Bóng bờ cây & tường đình đổ sẫm sát mép nước bên trái & bờ xa
    poly(c, [
      PB(BP_X_CURB - 0.02, -0.175, 2.1),
      PB(BP_X_CURB + 0.55, -0.175, 2.1),
      PB(BP_X_CURB + 0.42, -0.175, 16.0),
      PB(BP_X_CURB - 0.02, -0.175, 16.0),
    ], 'rgba(3,5,10,0.68)');
    poly(c, [
      PB(0.2, -0.175, 18.8),
      PB(15.0, -0.175, 18.8),
      PB(15.0, -0.175, 20.5),
      PB(0.2, -0.175, 20.5),
    ], 'rgba(4,6,12,0.62)');

    // Bờ đất tối nhẹ dọc đường ven hồ phía xa (nối từ cuối lối đá sang cổng chào)
    poly(c, [
      PB(-0.2, 0.0, 18.5), PB(4.4, 0.0, 18.5),
      PB(4.4, -0.18, 19.2), PB(-0.2, -0.18, 19.2),
    ], '#1c1815');

    // Quầng sáng tĩnh nền của trăng và đèn cổng chào in xuống mặt hồ
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.18;
    c.drawImage(bpMoonSprite, BP_MOON_POS[0] - 115, 398, 230, 270);
    c.globalAlpha = 0.20;
    c.drawImage(SP_D.warm, bpGateLampPt[0] - 58, 392, 152, 210);
    c.restore();

    // Đường gợn nước tĩnh rất mờ tạo chiều sâu mặt hồ đêm
    for (let i = 0; i < 28; i++) {
      const gz = lerp(3.4, 17.5, drnd());
      const gx = lerp(0.1, 6.5, drnd());
      const gw = lerp(0.18, 0.55, drnd());
      const pA = PB(gx, -0.17, gz);
      const pB = PB(gx + gw, -0.17, gz);
      seg(c, pA, pB, 0.9, 'rgba(130,158,215,0.08)');
    }

    // 4. SÂN TRƯỚC (tối êm ở đáy, giữ dải y 680..780 sạch) & LỐI ĐI LÁT ĐÁ MEN CHÂN TƯỜNG ĐÌNH
    // Sân đá trước góc đình (x < BP_X_CURB, z < BP_Z_FRONT)
    gr = c.createLinearGradient(0, PB(0, 0, BP_Z_FRONT)[1], 0, 880);
    gr.addColorStop(0, '#27231e');
    gr.addColorStop(0.45, '#191613');
    gr.addColorStop(1, '#09090b');
    poly(c, [
      PB(-4.5, 0.0, 2.0), PB(BP_X_CURB, 0.0, 2.0),
      PB(BP_X_CURB, 0.0, BP_Z_FRONT), PB(-4.5, 0.0, BP_Z_FRONT),
    ], gr);

    // Thành kè đá đứng mép hồ (từ sân trước chạy dọc hết lối đá tới cuối tường đình)
    poly(c, [
      PB(BP_X_CURB, 0.0, 2.0), PB(BP_X_CURB, -0.18, 2.0),
      PB(BP_X_CURB, -0.18, BP_Z_WALL_END + 0.5), PB(BP_X_CURB, 0.0, BP_Z_WALL_END + 0.5),
    ], '#2a2621');
    // Mạch đá đứng của kè bờ hồ
    for (let z = 2.4; z < BP_Z_WALL_END; z += 0.65) {
      seg(c, PB(BP_X_CURB, 0.0, z), PB(BP_X_CURB, -0.18, z), 1.0, 'rgba(10,9,8,0.65)');
    }
    seg(c, PB(BP_X_CURB, -0.14, 2.0), PB(BP_X_CURB, -0.14, BP_Z_WALL_END + 0.5), 1.4, 'rgba(16,24,32,0.55)');

    // Nền bãi đá nối từ cuối tường đình qua giếng tới đầu ngõ (z = BP_Z_WALL_END .. BP_Z_GATE + 0.3)
    gr = c.createLinearGradient(PB(-1.4, 0, BP_Z_GATE)[0], 0, PB(3.6, 0, BP_Z_GATE)[0], 0);
    gr.addColorStop(0, '#3a3026');
    gr.addColorStop(0.52, '#5a452b');
    gr.addColorStop(1, '#26201a');
    poly(c, [
      PB(BP_X_WALL - 0.1, 0.0, BP_Z_WALL_END),
      PB(BP_X_CURB, 0.0, BP_Z_WALL_END),
      PB(3.6, 0.0, BP_Z_GATE + 0.3),
      PB(-1.4, 0.0, BP_Z_GATE + 0.3),
    ], gr);

    // LỐI ĐI LÁT ĐÁ HẸP MEN CHÂN TƯỜNG ĐÌNH (x = BP_X_WALL .. BP_X_CURB, z = BP_Z_FRONT .. BP_Z_WALL_END)
    poly(c, [
      PB(BP_X_WALL, 0.0, BP_Z_FRONT),
      PB(BP_X_CURB, 0.0, BP_Z_FRONT),
      PB(BP_X_CURB, 0.0, BP_Z_WALL_END),
      PB(BP_X_WALL, 0.0, BP_Z_WALL_END),
    ], '#1c1a17');

    // Từng phiến đá lát xếp so le rõ nét (hiện rực lên khi đèn pin soi đúng chân tường)
    const stoneCols = ['#575249', '#4c4840', '#635d52', '#444039'];
    const nRows = 22;
    const dzStone = (BP_Z_WALL_END - BP_Z_FRONT) / nRows;
    for (let r = 0; r < nRows; r++) {
      const z0 = BP_Z_FRONT + r * dzStone + 0.022;
      const z1 = BP_Z_FRONT + (r + 1) * dzStone - 0.022;
      const splits = r % 2 === 0
        ? [BP_X_WALL + 0.02, -0.88, BP_X_CURB - 0.02]
        : [BP_X_WALL + 0.02, -1.04, -0.71, BP_X_CURB - 0.02];
      for (let k = 0; k < splits.length - 1; k++) {
        const sx0 = splits[k] + 0.014;
        const sx1 = splits[k + 1] - 0.014;
        const col = stoneCols[(r + k) % stoneCols.length];
        const p0 = PB(sx0, 0.004, z0);
        const p1 = PB(sx1, 0.004, z0);
        const p2 = PB(sx1, 0.004, z1);
        const p3 = PB(sx0, 0.004, z1);
        poly(c, [p0, p1, p2, p3], col);
        seg(c, p0, p1, 0.9, 'rgba(210,202,186,0.22)');
        seg(c, p2, p3, 1.0, 'rgba(10,9,8,0.55)');
      }
    }
    // Viền đá bó vỉa sát mép hồ dọc lối đi
    seg(c, PB(BP_X_CURB - 0.02, 0.006, BP_Z_FRONT), PB(BP_X_CURB - 0.02, 0.006, BP_Z_WALL_END), 2.2, 'rgba(155,152,142,0.36)');

    // 5. CÁI GIẾNG LÀNG & CỔNG CHÀO KHUNG SẮT PHÍA XA
    drawFarVillageWell(c, -0.68, BP_Z_WELL);
    drawFarWelcomeGate(c, 0.15, 3.55, BP_Z_GATE);

    // 6. TƯỜNG ĐÌNH BÊN TRÁI + MÁI NGÓI CONG + MẢNG GẠCH LỘ RA
    drawDinhCurvedRoof(c);

    // Mặt trước tường đình (góc bên phải đình)
    gr = c.createLinearGradient(0, PB(0, BP_WALL_TOP, BP_Z_FRONT)[1], 0, PB(0, 0, BP_Z_FRONT)[1]);
    gr.addColorStop(0, '#6a584a');
    gr.addColorStop(1, '#453930');
    poly(c, [
      PB(-4.0, 0, BP_Z_FRONT),
      PB(BP_X_WALL, 0, BP_Z_FRONT),
      PB(BP_X_WALL, BP_WALL_TOP, BP_Z_FRONT),
      PB(-4.0, BP_WALL_TOP, BP_Z_FRONT),
    ], gr);

    // Ánh trăng lam nhạt hắt nghiêng từ trên-phải lên mặt trước tường đình
    const wallMoon = c.createLinearGradient(
      PB(BP_X_WALL, BP_WALL_TOP, BP_Z_FRONT)[0], PB(BP_X_WALL, BP_WALL_TOP, BP_Z_FRONT)[1],
      PB(-3.2, 0.1, BP_Z_FRONT)[0], PB(-3.2, 0.1, BP_Z_FRONT)[1]
    );
    wallMoon.addColorStop(0, 'rgba(175,192,255,0.16)');
    wallMoon.addColorStop(0.55, 'rgba(155,174,238,0.06)');
    wallMoon.addColorStop(1, 'rgba(20,24,38,0)');
    poly(c, [
      PB(-4.0, 0, BP_Z_FRONT),
      PB(BP_X_WALL, 0, BP_Z_FRONT),
      PB(BP_X_WALL, BP_WALL_TOP, BP_Z_FRONT),
      PB(-4.0, BP_WALL_TOP, BP_Z_FRONT),
    ], wallMoon);

    // Mặt tường hông đình chạy dọc bên trái lối đá ra xa
    gr = c.createLinearGradient(PB(BP_X_WALL, 0, BP_Z_FRONT)[0], 0, PB(BP_X_WALL, 0, BP_Z_WALL_END)[0], 0);
    gr.addColorStop(0, '#504237');
    gr.addColorStop(0.45, '#332922');
    gr.addColorStop(0.84, '#241d18');
    gr.addColorStop(1, '#4b3824');
    poly(c, [
      PB(BP_X_WALL, 0, BP_Z_FRONT),
      PB(BP_X_WALL, BP_WALL_TOP, BP_Z_FRONT),
      PB(BP_X_WALL, BP_WALL_TOP - 0.05, BP_Z_WALL_END),
      PB(BP_X_WALL, 0, BP_Z_WALL_END),
    ], gr);

    // Trụ góc đầu tường đình
    gr = c.createLinearGradient(PB(BP_X_WALL - 0.16, 0, BP_Z_FRONT)[0], 0, PB(BP_X_WALL, 0, BP_Z_FRONT)[0], 0);
    gr.addColorStop(0, '#584a3e');
    gr.addColorStop(0.40, '#7e6e5d');
    gr.addColorStop(0.78, '#6b5b4d');
    gr.addColorStop(1, '#44382f');
    poly(c, [
      PB(BP_X_WALL - 0.16, 0, BP_Z_FRONT - 0.02),
      PB(BP_X_WALL + 0.01, 0, BP_Z_FRONT - 0.02),
      PB(BP_X_WALL + 0.01, BP_WALL_TOP - 0.04, BP_Z_FRONT - 0.02),
      PB(BP_X_WALL - 0.16, BP_WALL_TOP - 0.04, BP_Z_FRONT - 0.02),
    ], gr);
    seg(c, PB(BP_X_WALL - 0.16, 0, BP_Z_FRONT - 0.02), PB(BP_X_WALL - 0.16, BP_WALL_TOP - 0.04, BP_Z_FRONT - 0.02), 1.4, 'rgba(18,14,11,0.65)');
    seg(c, PB(BP_X_WALL + 0.008, 0, BP_Z_FRONT - 0.02), PB(BP_X_WALL + 0.008, BP_WALL_TOP - 0.04, BP_Z_FRONT - 0.02), 1.8, 'rgba(188,204,242,0.34)');

    // Vết ẩm loang trên vữa tường đình
    const stains = [
      [-2.75, 1.18, 0.42],
      [-2.05, 0.72, 0.36],
      [-1.72, 1.34, 0.30],
    ];
    for (let i = 0; i < stains.length; i++) {
      const st = stains[i];
      const sc = PB(st[0], st[1], BP_Z_FRONT);
      const sr = PB(st[0] + st[2], st[1], BP_Z_FRONT);
      const rad = Math.max(12, Math.abs(sr[0] - sc[0]));
      const stGr = c.createRadialGradient(sc[0], sc[1], rad * 0.1, sc[0], sc[1], rad);
      stGr.addColorStop(0, 'rgba(26,19,14,0.44)');
      stGr.addColorStop(0.65, 'rgba(26,19,14,0.18)');
      stGr.addColorStop(1, 'rgba(26,19,14,0)');
      c.fillStyle = stGr;
      c.beginPath();
      c.arc(sc[0], sc[1], rad, 0, Math.PI * 2);
      c.fill();
    }

    // Mảng gạch đỏ lộ ra trên mặt trước tường & tường hông dọc lối đá
    drawDinhBrickFront(c, -2.72, -1.88, 0.64, 1.24, BP_Z_FRONT, [
      PB(-2.60, 1.16, BP_Z_FRONT), PB(-2.28, 1.22, BP_Z_FRONT), PB(-1.94, 1.14, BP_Z_FRONT),
      PB(-1.88, 0.88, BP_Z_FRONT), PB(-2.00, 0.68, BP_Z_FRONT), PB(-2.36, 0.66, BP_Z_FRONT),
      PB(-2.68, 0.76, BP_Z_FRONT), PB(-2.70, 0.98, BP_Z_FRONT),
    ]);
    drawDinhBrickFront(c, -1.92, -1.52, 0.24, 0.56, BP_Z_FRONT, [
      PB(-1.88, 0.52, BP_Z_FRONT), PB(-1.64, 0.54, BP_Z_FRONT), PB(-1.54, 0.40, BP_Z_FRONT),
      PB(-1.56, 0.26, BP_Z_FRONT), PB(-1.74, 0.24, BP_Z_FRONT), PB(-1.90, 0.32, BP_Z_FRONT),
    ]);
    drawDinhBrickSide(c, BP_X_WALL, 0.28, 1.16, 4.15, 6.75, [
      PB(BP_X_WALL, 1.08, 4.30), PB(BP_X_WALL, 1.14, 5.45), PB(BP_X_WALL, 0.88, 6.60),
      PB(BP_X_WALL, 0.36, 6.45), PB(BP_X_WALL, 0.28, 5.05), PB(BP_X_WALL, 0.44, 4.20),
    ]);
    drawDinhBrickSide(c, BP_X_WALL, 0.16, 0.74, 7.35, 9.60, [
      PB(BP_X_WALL, 0.70, 7.50), PB(BP_X_WALL, 0.72, 9.35),
      PB(BP_X_WALL, 0.18, 9.45), PB(BP_X_WALL, 0.16, 7.40),
    ]);

    const cracks = [
      [PB(-2.90, 1.48, BP_Z_FRONT), PB(-2.76, 1.24, BP_Z_FRONT), PB(-2.80, 1.02, BP_Z_FRONT)],
      [PB(-1.84, 1.38, BP_Z_FRONT), PB(-1.74, 1.12, BP_Z_FRONT), PB(-1.80, 0.86, BP_Z_FRONT)],
      [PB(BP_X_WALL, 1.42, 4.55), PB(BP_X_WALL, 1.20, 5.10), PB(BP_X_WALL, 1.12, 5.65)],
    ];
    for (let i = 0; i < cracks.length; i++) {
      strokePoly(c, cracks[i], 1.3, '#2A211B', false);
    }

    // Rêu chân tường đình dọc mặt trước & chạy men lối đá
    for (let i = 0; i < 36; i++) {
      const mx = lerp(-3.8, BP_X_WALL - 0.04, drnd());
      const my = Math.pow(drnd(), 2.2) * 0.11;
      const mp = PB(mx, my, BP_Z_FRONT - 0.01);
      drawDinhMoss(c, mp[0], mp[1], 10 + drnd() * 14, 4.5 + drnd() * 5.5);
    }
    for (let i = 0; i < 32; i++) {
      const mz = lerp(BP_Z_FRONT + 0.05, 11.4, i / 31);
      const my = Math.pow(drnd(), 1.8) * 0.09;
      const mp = PB(BP_X_WALL + 0.015, my, mz);
      const sc = clamp(4.2 / mz, 0.28, 1);
      drawDinhMoss(c, mp[0], mp[1], (8 + drnd() * 10) * sc, (3.5 + drnd() * 4.5) * sc);
    }

    drawDinhWallTiles(c);

    // Giữ rìa góc trên trái (x<200, y<240) sạch tối cho nút quay lại
    gr = c.createLinearGradient(0, 0, 260, 0);
    gr.addColorStop(0, 'rgba(4,6,12,0.88)');
    gr.addColorStop(1, 'rgba(4,6,12,0)');
    c.fillStyle = gr;
    c.fillRect(0, 0, 260, H);

    // 7. Hạt phim & viền tối đêm sâu
    grain(c, 7000, 0.018);
    vignette(c, 0.50);

    // 8. Bake mẫu bóng đêm ánh trăng vào bpAmbientC (chừa sáng dịu vùng mặt hồ & giữ tối góc trên-trái + dải 680..780)
    const am = bpAmbientG;
    am.setTransform(1, 0, 0, 1, 0, 0);
    am.clearRect(0, 0, bpAmbientC.width, bpAmbientC.height);
    am.fillStyle = 'rgba(3,5,13,0.34)';
    am.fillRect(0, 0, bpAmbientC.width, bpAmbientC.height);

    am.setTransform(0.5 * S * dpr, 0, 0, 0.5 * S * dpr, 0.5 * OX * dpr, 0.5 * OY * dpr);
    const tlGr = am.createRadialGradient(84, 92, 18, 112, 124, 285);
    tlGr.addColorStop(0, 'rgba(2,3,8,0.84)');
    tlGr.addColorStop(0.58, 'rgba(2,3,8,0.44)');
    tlGr.addColorStop(1, 'rgba(2,3,8,0)');
    am.fillStyle = tlGr;
    am.fillRect(-300, -300, 720, 620);

    const botGr = am.createLinearGradient(0, 665, 0, 860);
    botGr.addColorStop(0, 'rgba(2,3,8,0)');
    botGr.addColorStop(0.38, 'rgba(2,3,8,0.44)');
    botGr.addColorStop(1, 'rgba(2,3,8,0.74)');
    am.fillStyle = botGr;
    am.fillRect(-300, 665, W + 600, 500);

    bpBaked = true;
  }

  function ensureBenPhaiBaked() {
    if (!bpBaked || bpLitC.width !== cv.width || bpLitC.height !== cv.height) {
      bakeBenPhai();
    }
  }

  function drawBenPhai(c, now, dt, opts) {
    ensureBenPhaiBaked();
    const soi = opts && Object.prototype.hasOwnProperty.call(opts, 'soi') ? opts.soi : BP.soi;
    const hasTorch = Array.isArray(soi) && soi.length >= 2 && isFinite(soi[0]) && isFinite(soi[1]);
    const sx = hasTorch ? clamp(Number(soi[0]), -200, W + 200) : 0;
    const sy = hasTorch ? clamp(Number(soi[1]), -200, H + 200) : 0;

    // Tính mức lộ của lối đá khi soi xuống chân tường đình sát mép nước & ghi vào BP.reveal
    const reveal = BP.sang ? 1 : hasTorch ? calcBpReveal(soi) : 0; // BP.sang: cảnh tự sáng, lối đá hiện sẵn (anh Quang 14/11)
    BP.reveal = reveal;

    // 1. Nền chi tiết đã bake
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(bpLitC, 0, 0);

    // 2. Lớp bóng tối đêm + che giấu lối đá men chân tường khi chưa soi đúng
    const dm = bpDarkMaskG;
    const dw = bpDarkMaskC.width;
    const dh = bpDarkMaskC.height;
    dm.setTransform(1, 0, 0, 1, 0, 0);
    dm.clearRect(0, 0, dw, dh);
    dm.drawImage(bpAmbientC, 0, 0);

    dm.setTransform(0.5 * S * dpr, 0, 0, 0.5 * S * dpr, 0.5 * OX * dpr, 0.5 * OY * dpr);
    dm.globalCompositeOperation = 'destination-out';

    if (hasTorch) {
      dm.globalAlpha = 0.96;
      dm.drawImage(SP_D.cut, sx - 195, sy - 195, 390, 390);
      dm.globalAlpha = 0.60;
      dm.drawImage(SP_D.cut, sx - 305, sy - 305, 610, 610);
    }

    // Khi chưa soi xuống chân tường sát mép nước: phủ bóng sâu lên lối đá & kè mép nước
    // để nhìn như tường đình sát thẳng xuống mặt hồ tối, không lộ đường đi
    const pathHide = 1 - reveal;
    if (pathHide > 0.02) {
      dm.globalCompositeOperation = 'source-over';
      dm.globalAlpha = 1;
      const outerShadow = [
        PB(BP_X_WALL - 0.02, 0.36, BP_Z_FRONT - 0.15),
        PB(BP_X_WALL, 0.24, BP_Z_WALL_END + 0.3),
        PB(BP_X_CURB + 0.26, -0.18, BP_Z_WALL_END + 0.3),
        PB(BP_X_CURB + 0.32, -0.18, BP_Z_FRONT - 0.15),
      ];
      poly(dm, outerShadow, `rgba(3,5,11,${(0.76 * pathHide).toFixed(3)})`);

      const innerShadow = [
        PB(BP_X_WALL, 0.22, BP_Z_FRONT - 0.05),
        PB(BP_X_WALL, 0.14, BP_Z_WALL_END + 0.1),
        PB(BP_X_CURB + 0.12, -0.16, BP_Z_WALL_END + 0.1),
        PB(BP_X_CURB + 0.16, -0.16, BP_Z_FRONT - 0.05),
      ];
      poly(dm, innerShadow, `rgba(2,4,9,${(0.92 * pathHide).toFixed(3)})`);
    }

    // Khi soi đúng xuống chân tường sát mép nước: khoét sáng dọc theo các phiến đá lát dẫn ra xa
    dm.globalCompositeOperation = 'destination-out';
    if (hasTorch && reveal > 0.02) {
      const p1 = PB(-0.88, 0.04, 5.0);
      const p2 = PB(-0.88, 0.04, 8.2);
      const p3 = PB(-0.88, 0.04, 12.2);
      dm.globalAlpha = 0.96 * reveal;
      dm.drawImage(SP_D.cut, p1[0] - 180, p1[1] - 140, 360, 280);
      dm.globalAlpha = 0.90 * reveal;
      dm.drawImage(SP_D.cut, p2[0] - 140, p2[1] - 115, 280, 230);
      dm.globalAlpha = 0.82 * reveal;
      dm.drawImage(SP_D.cut, p3[0] - 110, p3[1] - 90, 220, 180);
    }

    // Luôn để thoáng nhẹ vệt sáng vàng đèn cổng chào & cột trăng trên hồ xa
    dm.globalAlpha = 0.85;
    dm.drawImage(SP_D.cut, bpGateLampPt[0] - 95, bpGateLampPt[1] - 75, 190, 175);
    dm.globalAlpha = 0.72;
    dm.drawImage(SP_D.cut, BP_MOON_POS[0] - 150, 390, 300, 280);

    dm.globalAlpha = 1;
    dm.globalCompositeOperation = 'source-over';

    c.setTransform(1, 0, 0, 1, 0, 0);
    { const ga = c.globalAlpha; if (BP.sang) c.globalAlpha = ga * 0.3; c.drawImage(bpDarkMaskC, 0, 0, cv.width, cv.height); c.globalAlpha = ga; } // tự sáng: bóng đêm chỉ còn mờ nhẹ
    setT(c);

    // 3. Phần động rẻ tiền: vệt sáng lăn tăn trên mặt hồ + đèn cổng chào xa + quầng đèn pin
    const t = now * 0.001;
    const farFlick = 0.92 + 0.05 * Math.sin(t * 2.0) + 0.03 * Math.sin(t * 7.1);
    const baseAlpha = c.globalAlpha;

    // Vài vệt sáng lăn tăn chuyển động nhẹ trên mặt hồ đêm (không tạo gradient, không cấp phát)
    for (let i = 0; i < BP_RIPPLES.length; i++) {
      const rp = BP_RIPPLES[i];
      const shimmer = 0.64 + 0.36 * Math.sin(t * (rp.spd * 1.4) + rp.ph);
      const rx = rp.x + Math.sin(t * rp.spd + rp.ph) * rp.amp;
      c.fillStyle = `rgba(${rp.col},${(rp.baseA * shimmer * baseAlpha).toFixed(3)})`;
      c.fillRect(rx - rp.w * 0.5, rp.y, rp.w, rp.h);
    }

    c.save();
    c.globalCompositeOperation = 'lighter';

    // Hào quang trăng nhẹ & đèn đường vàng cổng chào phía xa
    c.globalAlpha = baseAlpha * 0.34;
    c.drawImage(bpMoonSprite, BP_MOON_POS[0] - 88, BP_MOON_POS[1] - 88, 176, 176);

    c.globalAlpha = baseAlpha * 0.44 * farFlick;
    c.drawImage(SP_D.warm, bpGateLampPt[0] - 58, bpGateLampPt[1] - 46, 116, 98);
    c.globalAlpha = baseAlpha * 0.36 * farFlick;
    c.drawImage(SP_D.glow, bpGateLampPt[0] - 20, bpGateLampPt[1] - 18, 40, 36);

    if (hasTorch) {
      c.globalAlpha = baseAlpha * 0.38;
      c.drawImage(SP_D.torch, sx - 210, sy - 210, 420, 420);
      c.globalAlpha = baseAlpha * 0.22;
      c.drawImage(SP_D.torch, sx - 120, sy - 120, 240, 240);

      if (reveal > 0.02) {
        const pMid = PB(-0.88, 0.02, 6.8);
        c.globalAlpha = baseAlpha * 0.26 * reveal;
        c.drawImage(SP_D.torch, pMid[0] - 185, pMid[1] - 150, 370, 300);
        c.globalAlpha = baseAlpha * 0.16 * reveal;
        c.drawImage(SP_D.warm, pMid[0] - 165, pMid[1] - 95, 330, 220);
      }
    }
    c.restore();
  }

  // ---------- Đăng ký các cảnh vào SC ----------
  SC.dinhngoai = {
    bake: bakeDinhNgoai,
    enter() {
      ensureNgoaiBaked();
      if (typeof nudge === 'function') nudge();
    },
    draw: drawDinhNgoai,
    hot: null,
  };

  SC.dinhtrong = {
    bake: bakeDinhTrong,
    enter() {
      ensureTrongBaked();
      if (typeof nudge === 'function') nudge();
    },
    draw: drawDinhTrong,
    hot: null,
  };

  SC.benphai = {
    bake: bakeBenPhai,
    enter() {
      ensureBenPhaiBaked();
      BP.sang = true;
      BP.reveal = calcBpReveal(BP.soi);
      if (typeof nudge === 'function') nudge();
    },
    draw: drawBenPhai,
    down(p) {
      BP.soi = [clamp(p[0], 0, W), clamp(p[1], 0, H)];
      BP.reveal = calcBpReveal(BP.soi);
      return false;
    },
    move(p, b) {
      if (b) {
        BP.soi = [clamp(p[0], 0, W), clamp(p[1], 0, H)];
        BP.reveal = calcBpReveal(BP.soi);
      }
    },
    up() {
      return false;
    },
    hot: null,
  };

  initHotD();
  SC.dinhngoai.hot = { cong: HOT_D.cong, tuong_phai: HOT_D.tuong_phai };
  SC.dinhtrong.hot = { ban_da: HOT_D.ban_da, radio: HOT_D.radio, den_long: HOT_D.den_long };
  SC.benphai.hot = { loi: HOT_D.loi };

  // Nạp hai SVG ngay khi tải script và tự bake lại ngay khi ảnh sẵn sàng
  const onSvgLoad = () => {
    if (cv && cv.width) {
      bakeDinhNgoai();
      bakeDinhTrong();
    }
  };
  imgTrong.onload = onSvgLoad;
  imgNgoai.onload = onSvgLoad;
  imgTrong.src = BASE_DIR + 'dinh-trong.svg';
  imgNgoai.src = BASE_DIR + 'dinh-ngoai.svg';
})();
