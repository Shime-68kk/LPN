// Kết 2: hoạt cảnh 'Đường của năm phím' (bài 48)
// S trong [48, 166]: C (48-80) -> D (80-128, lan ấm 128-130) -> E (130-142) -> F (142-166).
(() => {
  'use strict';

  const SCRIPT = "'Dancing Script', cursive";
  const LINE_F = 'Đến ôm em bằng được.';
  const DESIGN_W = typeof W === 'number' ? W : 1600;
  const DESIGN_H = typeof H === 'number' ? H : 900;

  const CREAM = [244, 230, 204];
  const PIECE_IDS = ['Mi4', 'Si4', 'La4', 'Đô#5', 'Fa#5'];
  const DEFAULT_MAU = {
    'Mi4':  '218,158,58',
    'Si4':  '156,104,158',
    'La4':  '214,102,76',
    'Đô#5': '116,166,104',
    'Fa#5': '216,122,146',
  };

  // Bốn chặng của mục C (mỗi chặng 8 giây) + vị trí quầng sáng giữ lại trên cảnh mượn
  const C_STAGES = [
    { id: 'Si4',  ten: 'p502sau',   defPt: [325, 465],  startX: 760,  c1x: 610, c1y: 170, c2x: 420, c2y: 260, amb: [[140, 540, 170, 0.12, 1], [820, 740, 240, 0.09, 1]] },
    { id: 'La4',  ten: 'gac',       defPt: [844, 425],  startX: 520,  c1x: 630, c1y: 170, c2x: 780, c2y: 255, amb: [[844, 340, 220, 0.14, 1]] },
    { id: 'Đô#5', ten: 'sanxe',     defPt: [838, 474],  startX: 1080, c1x: 960, c1y: 180, c2x: 865, c2y: 280, amb: [[800, 128, 260, 0.14, 0], [830, 435, 190, 0.11, 1]] },
    { id: 'Fa#5', ten: 'santhuong', defPt: [1042, 616], startX: 650,  c1x: 820, c1y: 195, c2x: 985, c2y: 380, amb: [[560, 220, 260, 0.10, 0], [800, 435, 210, 0.08, 1]] },
  ];

  // Khung cửa sổ phòng trại tỷ lệ 3:2 (giống WIN_C 1080x720 của p1.js), tâm tại (800, 442)
  const WIN = { x: 305, y: 112, w: 990, h: 660 };
  const WIN_CX = WIN.x + WIN.w * 0.5;
  const WIN_CY = WIN.y + WIN.h * 0.5;
  // Tâm chữ cuối nằm chính giữa ô trời phía trên thanh ngang (giữa mép khung trên WIN.y+14 và thanh ngang WIN_CY-8)
  const LINE_Y = Math.round((WIN.y + 14 + WIN_CY - 8) * 0.5);

  // Năm giọt sáng đậu trên mặt kính (tránh thanh chữ thập + tại x=800, y=442), sắp theo x tăng dần
  const DROPS = [
    { id: 'Mi4',  x: 595,  y: 315, r: 8.6, ph: 0.4, streak: 42 },
    { id: 'La4',  x: 675,  y: 535, r: 8.2, ph: 1.7, streak: 36 },
    { id: 'Đô#5', x: 885,  y: 495, r: 8.4, ph: 2.9, streak: 40 },
    { id: 'Si4',  x: 945,  y: 290, r: 8.2, ph: 4.1, streak: 34 },
    { id: 'Fa#5', x: 1055, y: 575, r: 8.6, ph: 5.3, streak: 38 },
  ];

  // ---------- Tiện ích toán học & màu sắc ----------
  const cl = (x, a, b) => (x < a ? a : x > b ? b : x);
  const lp = (a, b, k) => a + (b - a) * k;
  const es = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const esOut = (k) => 1 - Math.pow(1 - cl(k, 0, 1), 3);
  const smooth = (a, b, x) => {
    const k = cl((x - a) / (b - a), 0, 1);
    return k * k * (3 - 2 * k);
  };

  function makeLayer(w, h) {
    let c0, g0;
    if (typeof layer === 'function') {
      [c0, g0] = layer();
    } else {
      c0 = document.createElement('canvas');
      g0 = c0.getContext('2d');
    }
    c0.width = Math.max(1, Math.ceil(w));
    c0.height = Math.max(1, Math.ceil(h));
    return [c0, g0];
  }

  function parseRgb(str, fb) {
    if (typeof str === 'string') {
      const p = str.split(',');
      if (p.length >= 3) {
        const r = Number(p[0].trim());
        const g0 = Number(p[1].trim());
        const b = Number(p[2].trim());
        if (isFinite(r) && isFinite(g0) && isFinite(b)) {
          return [cl(Math.round(r), 0, 255), cl(Math.round(g0), 0, 255), cl(Math.round(b), 0, 255)];
        }
      }
    }
    return fb.slice();
  }

  function mixRgb(a, b, k) {
    return [
      Math.round(lp(a[0], b[0], k)),
      Math.round(lp(a[1], b[1], k)),
      Math.round(lp(a[2], b[2], k)),
    ];
  }

  function rgbCss(c, a) {
    return a === undefined ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }

  function keyedColor(keys, x) {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (x <= keys[i][0]) {
        const k = (x - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0] || 1);
        return mixRgb(keys[i - 1][1], keys[i][1], k);
      }
    }
    return keys[keys.length - 1][1];
  }

  let rngState = 4802;
  function seedRng(v) { rngState = (v | 0) || 1; }
  function nextRng() {
    rngState = (rngState * 16807) % 2147483647;
    return (rngState - 1) / 2147483646;
  }

  // ---------- Bảng màu động từ KET2_CANH ----------
  const pieceRgb = {};
  const pieceStr = {};
  let cachedMauSig = '';

  function syncPieceColors() {
    const mau = window.KET2_CANH && window.KET2_CANH.mau;
    let sig = '';
    for (let i = 0; i < PIECE_IDS.length; i++) {
      const id = PIECE_IDS[i];
      sig += (mau && mau[id]) || DEFAULT_MAU[id];
      sig += '|';
    }
    if (sig === cachedMauSig) return false;
    cachedMauSig = sig;
    for (let i = 0; i < PIECE_IDS.length; i++) {
      const id = PIECE_IDS[i];
      const fb = parseRgb(DEFAULT_MAU[id], [240, 210, 170]);
      const rgb = parseRgb(mau && mau[id], fb);
      pieceRgb[id] = rgb;
      pieceStr[id] = `${rgb[0]},${rgb[1]},${rgb[2]}`;
    }
    return true;
  }

  // ---------- Sprite ánh sáng dựng sẵn (không shadowBlur/filter) ----------
  const SP = {
    ready: false,
    core: null,
    warmPool: null,
    coldPool: null,
    darkHalo: null,
    partCream: null,
    cols: {},
    partCols: {},
  };

  function makeGlowSprite(size, stops) {
    const [cv0, g0] = makeLayer(size, size);
    const half = size * 0.5;
    const gr = g0.createRadialGradient(half, half, 0, half, half, half);
    for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    g0.fillStyle = gr;
    g0.fillRect(0, 0, size, size);
    return cv0;
  }

  function ensureSprites() {
    const colorChanged = syncPieceColors();
    if (SP.ready && !colorChanged) return;
    if (!SP.core) {
      SP.core = makeGlowSprite(64, [
        [0, 'rgba(255,252,242,1)'],
        [0.24, 'rgba(255,238,205,0.78)'],
        [0.58, 'rgba(255,212,154,0.22)'],
        [1, 'rgba(255,196,130,0)'],
      ]);
    }
    if (!SP.warmPool) {
      SP.warmPool = makeGlowSprite(160, [
        [0, 'rgba(255,232,188,0.82)'],
        [0.28, 'rgba(255,204,138,0.44)'],
        [0.64, 'rgba(246,168,104,0.12)'],
        [1, 'rgba(235,148,88,0)'],
      ]);
    }
    if (!SP.coldPool) {
      SP.coldPool = makeGlowSprite(128, [
        [0, 'rgba(155,190,238,0.52)'],
        [0.45, 'rgba(122,158,212,0.18)'],
        [1, 'rgba(95,130,190,0)'],
      ]);
    }
    if (!SP.darkHalo) {
      SP.darkHalo = makeGlowSprite(128, [
        [0, 'rgba(18,14,20,0.85)'],
        [0.52, 'rgba(18,14,20,0.45)'],
        [1, 'rgba(18,14,20,0)'],
      ]);
    }
    if (!SP.partCream) {
      SP.partCream = makeGlowSprite(32, [
        [0, 'rgba(255,248,232,0.98)'],
        [0.32, 'rgba(244,230,204,0.62)'],
        [0.7, 'rgba(244,230,204,0.14)'],
        [1, 'rgba(244,230,204,0)'],
      ]);
    }
    for (let i = 0; i < PIECE_IDS.length; i++) {
      const id = PIECE_IDS[i];
      const rgb = pieceRgb[id];
      const hot = mixRgb(rgb, [255, 248, 232], 0.45);
      const mid = mixRgb(rgb, CREAM, 0.16);
      SP.cols[id] = makeGlowSprite(128, [
        [0, rgbCss(hot, 0.92)],
        [0.26, rgbCss(mid, 0.56)],
        [0.62, rgbCss(rgb, 0.18)],
        [1, rgbCss(rgb, 0)],
      ]);
      SP.partCols[id] = makeGlowSprite(32, [
        [0, rgbCss(hot, 0.96)],
        [0.36, rgbCss(mid, 0.55)],
        [0.74, rgbCss(rgb, 0.14)],
        [1, rgbCss(rgb, 0)],
      ]);
    }
    SP.ready = true;
  }

  // ---------- Đệm cảnh mượn (mục C) & Đệm nền tĩnh (mục E/F) ----------
  let sceneBuf = null;
  let sceneG = null;
  let winNightC = null;
  let winNightG = null;
  let winDawnC = null;
  let winDawnG = null;
  let bakedW = 0;
  let bakedH = 0;

  let cachedNightGrad = null;
  let cachedNightX = -9999;
  let cachedNightY = -9999;
  let cachedNightStage = -1;

  function canvasSize(c) {
    const cw = (c && c.canvas && c.canvas.width) || (typeof cv !== 'undefined' && cv.width) || DESIGN_W;
    const ch = (c && c.canvas && c.canvas.height) || (typeof cv !== 'undefined' && cv.height) || DESIGN_H;
    return [cw, ch];
  }

  function ensureSceneBuf(cw, ch) {
    if (!sceneBuf || sceneBuf.width !== cw || sceneBuf.height !== ch) {
      [sceneBuf, sceneG] = makeLayer(cw, ch);
    }
  }

  function fillSolidFull(c, col) {
    const [cw, ch] = canvasSize(c);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = col;
    c.fillRect(0, 0, cw, ch);
    c.restore();
  }

  function applyDesignT(c) {
    if (typeof setT === 'function') {
      setT(c);
      return;
    }
    const [cw, ch] = canvasSize(c);
    const sc = Math.max(cw / DESIGN_W, ch / DESIGN_H);
    c.setTransform(sc, 0, 0, sc, (cw - DESIGN_W * sc) * 0.5, (ch - DESIGN_H * sc) * 0.5);
  }

  // ---------- MỤC C (S 48 -> 80): Bốn mảnh về chỗ cũ ----------
  function getStageTarget(idx) {
    const st = C_STAGES[idx];
    const canh = window.KET2_CANH;
    const diem = canh && canh.diem && canh.diem[st.id];
    if (Array.isArray(diem) && diem.length >= 3 && isFinite(diem[1]) && isFinite(diem[2])) {
      return { ten: diem[0] || st.ten, tx: diem[1], ty: diem[2], st };
    }
    return { ten: st.ten, tx: st.defPt[0], ty: st.defPt[1], st };
  }

  function cubicPt(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t) {
    const m = 1 - t;
    const m2 = m * m;
    const t2 = t * t;
    const a = m2 * m;
    const b = 3 * m2 * t;
    const d = 3 * m * t2;
    const e = t2 * t;
    return [
      a * p0x + b * p1x + d * p2x + e * p3x,
      a * p0y + b * p1y + d * p2y + e * p3y,
    ];
  }

  function drawStageOrb(c, id, x, y, scale, alpha, pulse, colGain) {
    if (alpha <= 0.004) return;
    const ba = c.globalAlpha;
    const cg = colGain || 1;
    c.save();
    c.globalCompositeOperation = 'lighter';

    const colSpr = SP.cols[id];
    if (colSpr) {
      const rCol = 66 * (cg > 1 ? 1.16 : 1) * scale * (0.94 + 0.06 * pulse);
      c.globalAlpha = ba * alpha * Math.min(1, 0.68 * cg);
      c.drawImage(colSpr, x - rCol, y - rCol, rCol * 2, rCol * 2);
    }

    const rWarm = 32 * scale * (0.92 + 0.08 * pulse);
    c.globalAlpha = ba * alpha * (cg > 1 ? 0.58 : 0.72);
    c.drawImage(SP.warmPool, x - rWarm, y - rWarm, rWarm * 2, rWarm * 2);

    const rCore = 17 * scale;
    c.globalAlpha = ba * alpha * 0.96;
    c.drawImage(SP.core, x - rCore, y - rCore, rCore * 2, rCore * 2);

    c.restore();
  }

  function drawSectionC(c, sec, now, dt) {
    const ba = c.globalAlpha;
    const idx = cl(Math.floor((sec - 48) / 8), 0, 3);
    const u = cl(sec - (48 + idx * 8), 0, 8);
    const { ten, tx, ty, st } = getStageTarget(idx);

    // Mờ qua đen ~0.8s giữa các chặng (0.4s cuối chặng + 0.4s đầu chặng kế); chặng 0 mở thẳng rất êm từ S=48
    const fadeIn = idx === 0 ? es(cl(u / 0.25, 0, 1)) : es(cl(u / 0.4, 0, 1));
    const fadeOut = u > 7.6 ? 1 - es(cl((u - 7.6) / 0.4, 0, 1)) : 1;
    const sceneVis = Math.min(fadeIn, fadeOut);

    const zoom = lp(1.0, 1.06, cl(u / 8, 0, 1));
    const [cw, ch] = canvasSize(c);

    applyDesignT(c);
    const tr = c.getTransform();
    const px = tr.a * tx + tr.e;
    const py = tr.d * ty + tr.f;

    // 1. Nền đục và cảnh mượn phóng chậm quanh điểm đích
    fillSolidFull(c, '#060504');
    if (sceneVis > 0.008) {
      const canh = window.KET2_CANH;
      let drewBorrowed = false;
      if (canh && typeof canh.ve === 'function') {
        ensureSceneBuf(cw, ch);
        const prevFlag = window.KET2_PHIM_DANG;
        window.KET2_PHIM_DANG = true;
        try {
          sceneG.setTransform(1, 0, 0, 1, 0, 0);
          sceneG.globalCompositeOperation = 'source-over';
          sceneG.globalAlpha = 1;
          sceneG.fillStyle = '#060504';
          sceneG.fillRect(0, 0, cw, ch);
          applyDesignT(sceneG);
          canh.ve(sceneG, ten, now, dt);
          drewBorrowed = true;
        } catch (_) {
          drewBorrowed = false;
        } finally {
          window.KET2_PHIM_DANG = prevFlag;
        }
      }

      if (drewBorrowed) {
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = ba * sceneVis;
        c.translate(px, py);
        c.scale(zoom, zoom);
        c.translate(-px, -py);
        c.drawImage(sceneBuf, 0, 0);
        c.restore();
      } else {
        applyDesignT(c);
        c.save();
        c.globalAlpha = ba * sceneVis;
        c.fillStyle = '#0d1320';
        c.fillRect(-300, -300, DESIGN_W + 600, DESIGN_H + 600);
        c.restore();
      }
    }

    // 2. Phủ tối kiểu đêm (~65% tối, riêng santhuong ~35% vì cảnh gốc vốn đã tối) & đốm sáng trong cùng hệ zoom
    applyDesignT(c);
    if (sceneVis > 0.008) {
      const isSanThuong = idx === 3 || ten === 'santhuong';
      const gradX = tx;
      const gradY = isSanThuong ? ty - 75 : ty;
      const stageFlag = isSanThuong ? 1 : 0;

      c.save();
      c.translate(tx, ty);
      c.scale(zoom, zoom);
      c.translate(-tx, -ty);

      if (!cachedNightGrad || cachedNightX !== gradX || cachedNightY !== gradY || cachedNightStage !== stageFlag) {
        cachedNightX = gradX;
        cachedNightY = gradY;
        cachedNightStage = stageFlag;
        if (isSanThuong) {
          cachedNightGrad = c.createRadialGradient(gradX, gradY, 75, gradX, gradY, 780);
          cachedNightGrad.addColorStop(0, 'rgba(5,8,17,0.14)');
          cachedNightGrad.addColorStop(0.45, 'rgba(4,7,15,0.34)');
          cachedNightGrad.addColorStop(1, 'rgba(3,5,11,0.44)');
        } else {
          cachedNightGrad = c.createRadialGradient(gradX, gradY, 45, gradX, gradY, 820);
          cachedNightGrad.addColorStop(0, 'rgba(5,8,17,0.48)');
          cachedNightGrad.addColorStop(0.45, 'rgba(4,7,15,0.65)');
          cachedNightGrad.addColorStop(1, 'rgba(3,5,11,0.76)');
        }
      }
      c.globalAlpha = ba * sceneVis;
      c.fillStyle = cachedNightGrad;
      c.fillRect(-350, -350, DESIGN_W + 700, DESIGN_H + 700);

      // Giữ lại quầng sáng ấm/lạnh tự nhiên của cảnh gốc (rất nhẹ)
      if (st.amb && st.amb.length) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < st.amb.length; i++) {
          const a = st.amb[i];
          c.globalAlpha = ba * sceneVis * a[3];
          c.drawImage(a[4] ? SP.warmPool : SP.coldPool, a[0] - a[2], a[1] - a[2], a[2] * 2, a[2] * 2);
        }
        c.restore();
      }

      // Đốm sáng bay vào từ mép trên (y = -15) theo đường cong mềm, chạm đúng điểm ở giây thứ 4
      const raw = u / 4.0;
      const flyProg = raw <= 0 ? 0 : raw >= 1 ? 1 : 1 - Math.pow(1 - raw, 2.15);
      const pos = cubicPt(st.startX, -15, st.c1x, st.c1y, st.c2x, st.c2y, tx, ty, flyProg);

      // Đuôi vệt sáng mờ dần: lấy mẫu ngược thuần theo thời gian
      if (raw > 0 && raw < 1.38) {
        const tailSteps = 22;
        const colSpr = SP.cols[st.id];
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let k = tailSteps; k >= 1; k--) {
          const sr = raw - k * 0.017;
          if (sr <= 0 || sr >= 1) continue;
          const sf = 1 - Math.pow(1 - sr, 2.15);
          const tp = cubicPt(st.startX, -15, st.c1x, st.c1y, st.c2x, st.c2y, tx, ty, sf);
          const w = 1 - k / tailSteps;
          const ta = w * w * 0.42 * sceneVis;
          if (colSpr) {
            const rad = (14 + w * 22) * (isSanThuong ? 1.18 : 1);
            c.globalAlpha = ba * ta * (isSanThuong ? 1.24 : 1);
            c.drawImage(colSpr, tp[0] - rad, tp[1] - rad, rad * 2, rad * 2);
          }
          const rW = 6 + w * 8;
          c.globalAlpha = ba * ta * 0.65;
          c.drawImage(SP.core, tp[0] - rW, tp[1] - rW, rW * 2, rW * 2);
        }
        c.restore();
      }

      // Chạm điểm ở giây thứ 4: bừng sáng ấm một nhịp (quầng tròn lan ra rồi lắng), rồi đậu phát sáng khẽ
      const hitAge = u - 4.0;
      const breath = 0.5 + 0.5 * Math.sin(now * 0.0028 + idx);
      const orbGain = isSanThuong ? 1.32 : 1;
      if (hitAge >= 0) {
        const flareDur = isSanThuong ? 2.4 : 1.7;
        if (hitAge < flareDur) {
          const flare = Math.exp(-hitAge * (isSanThuong ? 1.55 : 2.7)) * Math.min(1, hitAge / 0.1 + 0.25);
          const fProg = esOut(cl(hitAge / (isSanThuong ? 1.85 : 1.4), 0, 1));
          c.save();
          c.globalCompositeOperation = 'lighter';
          const rFlare = (isSanThuong ? 165 : 115) + fProg * (isSanThuong ? 185 : 95);
          c.globalAlpha = ba * sceneVis * flare * 0.72;
          c.drawImage(SP.warmPool, tx - rFlare, ty - rFlare, rFlare * 2, rFlare * 2);

          if (SP.cols[st.id]) {
            const rC = (isSanThuong ? 125 : 85) + fProg * (isSanThuong ? 135 : 65);
            c.globalAlpha = ba * sceneVis * flare * (isSanThuong ? 0.82 : 0.68);
            c.drawImage(SP.cols[st.id], tx - rC, ty - rC, rC * 2, rC * 2);
          }

          if (isSanThuong) {
            const rTank = 275 + fProg * 95;
            c.globalAlpha = ba * sceneVis * flare * 0.42;
            c.drawImage(SP.warmPool, tx - rTank, ty - 115 - rTank, rTank * 2, rTank * 2);
          }

          const p1 = cl(hitAge / (isSanThuong ? 1.75 : 1.45), 0, 1);
          const rad1 = 12 + esOut(p1) * (isSanThuong ? 195 : 145);
          c.globalAlpha = ba * Math.pow(1 - p1, 1.85) * 0.58 * sceneVis;
          c.strokeStyle = `rgb(${pieceStr[st.id]})`;
          c.lineWidth = 2.6 - p1 * 1.4;
          c.beginPath();
          c.arc(tx, ty, rad1, 0, Math.PI * 2);
          c.stroke();

          if (hitAge > 0.14) {
            const p2 = cl((hitAge - 0.14) / (isSanThuong ? 1.55 : 1.3), 0, 1);
            const rad2 = 10 + esOut(p2) * (isSanThuong ? 135 : 98);
            c.globalAlpha = ba * Math.pow(1 - p2, 1.75) * 0.42 * sceneVis;
            c.strokeStyle = 'rgb(255,242,216)';
            c.lineWidth = 1.8 - p2 * 0.9;
            c.beginPath();
            c.arc(tx, ty, rad2, 0, Math.PI * 2);
            c.stroke();
          }
          c.restore();
        }
        if (isSanThuong) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          const washIn = cl(hitAge / 0.35, 0, 1);
          const washPulse = 0.88 + 0.12 * breath;
          if (SP.cols[st.id]) {
            c.globalAlpha = ba * sceneVis * washIn * washPulse * 0.24;
            c.drawImage(SP.cols[st.id], tx - 245, ty - 105 - 245, 490, 490);
          }
          c.globalAlpha = ba * sceneVis * washIn * washPulse * 0.18;
          c.drawImage(SP.warmPool, tx - 220, ty - 95 - 220, 440, 440);
          c.restore();
        }
        const settleBoost = hitAge < 0.8 ? 1 + 0.35 * Math.exp(-hitAge * 4) : 1;
        drawStageOrb(c, st.id, tx, ty, 0.92 * settleBoost, sceneVis * (0.86 + 0.14 * breath), breath, orbGain);
      } else {
        drawStageOrb(c, st.id, pos[0], pos[1], 1.0, sceneVis, breath, orbGain);
      }

      c.restore();
    }

    if (sceneVis < 0.995) {
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = ba * (1 - sceneVis);
      c.fillStyle = '#060504';
      c.fillRect(0, 0, cw, ch);
      c.restore();
      applyDesignT(c);
    }
  }

  // ---------- MỤC D (S 80 -> 130): Điệp khúc 2 hướng Thái Nguyên ----------
  const LUT_N = 256;
  const CAM_LUT = new Float32Array(LUT_N + 1);
  (function buildCamLut() {
    let acc = 0;
    CAM_LUT[0] = 0;
    for (let i = 1; i <= LUT_N; i++) {
      const p = (i - 0.5) / LUT_N;
      const dampEnd = 1 - smooth(0.91, 1.0, p);
      const speed = (0.20 + 1.85 * Math.pow(p, 1.45)) * dampEnd;
      acc += speed / LUT_N;
      CAM_LUT[i] = acc;
    }
    const maxV = CAM_LUT[LUT_N] || 1;
    for (let i = 0; i <= LUT_N; i++) CAM_LUT[i] /= maxV;
  })();

  function sampleCamLut(p) {
    const u = cl(p, 0, 1) * LUT_N;
    const i = Math.floor(u);
    if (i >= LUT_N) return CAM_LUT[LUT_N];
    return lp(CAM_LUT[i], CAM_LUT[i + 1], u - i);
  }

  const D_CLOUDS = [];
  const D_BUILDINGS = [];
  const D_LAMPS = [];
  const D_FIELDS = [];
  const D_RAIN = [];

  function lerpDensity(t) {
    return t < 0.35 ? 0.42 : cl(0.42 * (1 - (t - 0.35) / 0.7), 0.04, 0.42);
  }

  (function initDAssets() {
    seedRng(48128);
    for (let i = 0; i < 18; i++) {
      D_CLOUDS.push({
        x: (i / 18) * 2400 + nextRng() * 110,
        y: 95 + nextRng() * 215,
        rx: 165 + nextRng() * 145,
        ry: 46 + nextRng() * 44,
        layer: i % 2,
        a: 0.34 + nextRng() * 0.28,
      });
    }

    let wx = 260;
    while (wx < 3150) {
      const t = (wx - 260) / (3150 - 260);
      const w = 68 + nextRng() * 96;
      const h = (1 - t * 0.48) * (74 + nextRng() * 118);
      const layerIdx = nextRng() < 0.42 ? 0 : 1;
      const wins = [];
      const cols = Math.max(1, Math.floor((w - 20) / 22));
      const rows = Math.max(1, Math.floor((h - 24) / 26));
      for (let r = 0; r < rows; r++) {
        for (let clIdx = 0; clIdx < cols; clIdx++) {
          if (nextRng() < lerpDensity(t)) {
            wins.push({
              dx: 12 + clIdx * 22 + nextRng() * 4,
              dy: 16 + r * 26,
              warm: nextRng() > 0.28,
              a: 0.32 + nextRng() * 0.46,
            });
          }
        }
      }
      D_BUILDINGS.push({
        wx,
        w,
        h,
        roof: nextRng() > 0.45 ? 1 : 0,
        roofH: 14 + nextRng() * 20,
        ant: nextRng() > 0.72,
        layer: layerIdx,
        wins,
      });
      wx += w * (0.72 + t * 1.45) + nextRng() * (35 + t * 185);
    }

    let lx = 420;
    while (lx < 3950) {
      const t = lx / 3950;
      D_LAMPS.push({ wx: lx, warm: nextRng() > 0.22, sc: 0.75 + nextRng() * 0.35 });
      lx += 160 + t * t * 620 + nextRng() * 140;
    }

    for (let i = 0; i < 22; i++) {
      D_FIELDS.push({
        wx: 3300 + i * 125 + nextRng() * 45,
        w: 180 + nextRng() * 170,
        row: i % 3,
        glint: nextRng() > 0.35,
      });
    }

    for (let i = 0; i < 105; i++) {
      D_RAIN.push({
        x: nextRng() * (DESIGN_W + 300) - 150,
        y: nextRng() * DESIGN_H,
        len: 18 + nextRng() * 26,
        spd: 760 + nextRng() * 340,
        a: 0.14 + nextRng() * 0.22,
      });
    }
  })();

  // Đội hình bay hơi so le (khoảng cách giữa mọi cặp >= 123px -> luôn >= 83px sau khi cộng dao động)
  const D_FLOCK = [
    [168, -22],   // Mi4: dẫn đầu
    [42, -104],   // Si4: trên giữa
    [22,  82],    // La4: dưới giữa
    [-108, -46],  // Đô#5: sau trên
    [-168,  62],  // Fa#5: cuối đàn
  ];
  const D_PHASES = [0.35, 1.85, 3.15, 4.55, 5.75];

  function orbPosD(i, tVal) {
    const tp = cl((tVal - 80) / 48, 0, 1);
    const tLoc = tVal - 80;
    const gK = smooth(0, 4.5, tLoc);
    const aK = smooth(43.5, 48.0, tLoc);
    const bx = lp(lp(430, 620, gK), lp(620, 740, tp), 0.7);
    const by = lp(395, 345, smooth(0, 20, tLoc));

    const form = D_FLOCK[i];
    const ph = D_PHASES[i];
    const formScale = (1 + (1 - gK) * 0.65) * (1 - aK);
    const bobAmp = 1 - aK;
    const bobX = Math.sin(tLoc * (0.62 + (i % 3) * 0.11) + ph * 1.15) * 10 * bobAmp;
    const bobY = (
      Math.sin(tLoc * (1.35 + i * 0.16) + ph) * 13 +
      Math.cos(tLoc * 0.58 + ph * 1.7) * 4.5
    ) * bobAmp;

    const ox = form[0] * formScale + bobX;
    const oy = form[1] * formScale + bobY;

    const x = lp(bx + ox, 1060, aK * aK);
    const y = lp(by + oy, 500, Math.pow(aK, 1.5)) - Math.sin(aK * Math.PI) * (36 - i * 6);
    return [x, y];
  }

  function drawDOrbGroup(c, sec, tD, p, now) {
    const ba = c.globalAlpha;
    const hitT = sec - 128;
    const gather = smooth(0, 4.5, tD);
    const approach = smooth(43.5, 48.0, tD);
    const cxBase = lp(lp(430, 620, gather), lp(620, 740, cl(p, 0, 1)), 0.7);
    const cyBase = lp(395, 345, smooth(0, 20, tD));

    const orbVis = hitT <= 0 ? 1 : Math.max(0, 1 - hitT / 0.65);
    if (orbVis <= 0.005) return;

    const boost = 0.85 + 0.35 * Math.pow(p, 1.2);
    const trailSteps = 16;

    c.save();
    c.globalCompositeOperation = 'lighter';

    if (gather > 0.25) {
      const gx = lp(cxBase, 1060, approach * approach);
      const gy = lp(cyBase, 500, approach * approach);
      const gRad = lp(230, 90, approach);
      c.globalAlpha = ba * orbVis * gather * (0.14 + 0.10 * p);
      c.drawImage(SP.warmPool, gx - gRad, gy - gRad, gRad * 2, gRad * 2);
    }

    for (let i = 0; i < PIECE_IDS.length; i++) {
      const id = PIECE_IDS[i];
      const colSpr = SP.cols[id];
      const pt = orbPosD(i, sec);

      for (let k = trailSteps; k >= 1; k--) {
        const dtTrail = k * 0.032;
        const ts = sec - dtTrail;
        if (ts < 80) continue;
        const tp = orbPosD(i, ts);
        const windLag = dtTrail * (105 + 55 * p) * (1 - approach);
        const txTrail = tp[0] - windLag;
        const tyTrail = tp[1] - windLag * 0.1;
        const w = 1 - k / trailSteps;
        const ta = w * w * 0.28 * orbVis * (0.65 + 0.45 * p);
        if (colSpr) {
          const rr = 11 + w * 18 * boost;
          c.globalAlpha = ba * ta;
          c.drawImage(colSpr, txTrail - rr, tyTrail - rr, rr * 2, rr * 2);
        }
        const rc = 4 + w * 6;
        c.globalAlpha = ba * ta * 0.55;
        c.drawImage(SP.core, txTrail - rc, tyTrail - rc, rc * 2, rc * 2);
      }

      const breath = 0.88 + 0.12 * Math.sin(now * 0.003 + i * 1.4);
      const sc = (0.72 + 0.22 * boost) * breath;
      if (colSpr) {
        const rC = 54 * sc;
        c.globalAlpha = ba * orbVis * 0.72;
        c.drawImage(colSpr, pt[0] - rC, pt[1] - rC, rC * 2, rC * 2);
      }
      const rW = 26 * sc;
      c.globalAlpha = ba * orbVis * 0.76;
      c.drawImage(SP.warmPool, pt[0] - rW, pt[1] - rW, rW * 2, rW * 2);
      const rK = 14 * sc;
      c.globalAlpha = ba * orbVis * 0.96;
      c.drawImage(SP.core, pt[0] - rK, pt[1] - rK, rK * 2, rK * 2);
    }

    c.restore();
  }

  function drawSectionD(c, sec, now, dt) {
    const ba = c.globalAlpha;
    const tD = cl(sec - 80, 0, 50);
    const p = cl(tD / 48, 0, 1);
    const hitT = sec - 128;

    const brightK = Math.pow(p, 1.35);
    const camDist = sampleCamLut(p) * 8200;
    const groundY = lp(620, 654, smooth(0.15, 0.75, p));
    const [cw, ch] = canvasSize(c);

    // Đẩy nhẹ máy quay về phía ô cửa sổ trong khoảnh khắc lan ấm 128 -> 130
    const endZoom = hitT > 0 ? 1 + 0.045 * es(cl(hitT / 2.0, 0, 1)) : 1;

    applyDesignT(c);
    fillSolidFull(c, '#060912');

    c.save();
    if (endZoom > 1.0005) {
      c.translate(1060, 500);
      c.scale(endZoom, endZoom);
      c.translate(-1060, -500);
    }

    // 1. Bầu trời đêm mưa tăng nhẹ độ sáng theo nhạc
    const skyTop = keyedColor([[0, [6, 9, 17]], [0.5, [10, 16, 30]], [1, [16, 26, 48]]], brightK);
    const skyMid = keyedColor([[0, [11, 17, 30]], [0.5, [18, 28, 48]], [1, [27, 42, 74]]], brightK);
    const skyLow = keyedColor([[0, [16, 25, 42]], [0.5, [26, 39, 64]], [1, [40, 60, 96]]], brightK);
    const skyG = c.createLinearGradient(0, -100, 0, groundY + 40);
    skyG.addColorStop(0, rgbCss(skyTop));
    skyG.addColorStop(0.58, rgbCss(skyMid));
    skyG.addColorStop(1, rgbCss(skyLow));
    c.fillStyle = skyG;
    c.fillRect(-350, -350, DESIGN_W + 700, groundY + 400);

    if (brightK > 0.05) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * brightK * 0.24;
      c.drawImage(SP.coldPool, 360, groundY - 260, 960, 420);
      c.restore();
    }

    // 2. Đám mây mưa nặng trôi dần sang phải (hướng Thái Nguyên)
    const cloudDrift = 14 * tD + 18 * 48 * Math.pow(p, 1.75) / 1.75;
    for (let i = 0; i < D_CLOUDS.length; i++) {
      const cld = D_CLOUDS[i];
      const spdMul = cld.layer === 0 ? 0.65 : 1.05;
      const cx = ((cld.x + cloudDrift * spdMul) % 2400) - 400;
      const cy = cld.y;
      if (cx + cld.rx < -320 || cx - cld.rx > DESIGN_W + 320) continue;

      if (cld.layer === 0) {
        const col = keyedColor([[0, [11, 17, 30]], [1, [24, 35, 58]]], brightK);
        c.fillStyle = rgbCss(col, cld.a * 0.72);
      } else {
        const col = keyedColor([[0, [6, 10, 18]], [1, [14, 21, 36]]], brightK);
        c.fillStyle = rgbCss(col, cld.a * 0.92);
      }
      c.beginPath();
      c.ellipse(cx, cy, cld.rx, cld.ry, 0, 0, Math.PI * 2);
      c.fill();
    }

    // 3. Lớp đồi xa (trùng điệp, 2 tầng sương)
    const hillFade = smooth(0.48, 0.80, p);
    if (hillFade > 0.01) {
      const hShift1 = camDist * 0.16;
      const hShift2 = camDist * 0.34;
      const hCol1 = mixRgb([12, 18, 32], [24, 36, 58], brightK);
      const hCol2 = mixRgb([8, 13, 24], [15, 23, 38], brightK);

      c.save();
      c.globalAlpha = ba * hillFade;
      c.fillStyle = rgbCss(hCol1);
      c.beginPath();
      c.moveTo(-320, groundY + 30);
      for (let x = -320; x <= DESIGN_W + 320; x += 36) {
        const u = (x + hShift1) * 0.0022;
        const h = 48 + Math.sin(u) * 38 + Math.sin(u * 2.1 + 1.4) * 20 + Math.cos(u * 0.65) * 22;
        c.lineTo(x, groundY - h);
      }
      c.lineTo(DESIGN_W + 320, groundY + 30);
      c.closePath();
      c.fill();

      const hillMidFade = smooth(0.62, 0.86, p);
      if (hillMidFade > 0.01) {
        c.globalAlpha = ba * hillMidFade;
        c.fillStyle = rgbCss(hCol2);
        c.beginPath();
        c.moveTo(-320, groundY + 40);
        for (let x = -320; x <= DESIGN_W + 320; x += 32) {
          const u = (x + hShift2) * 0.0031;
          const h = 22 + Math.sin(u + 2.1) * 24 + Math.cos(u * 1.8 + 0.7) * 14;
          c.lineTo(x, groundY - h);
        }
        c.lineTo(DESIGN_W + 320, groundY + 40);
        c.closePath();
        c.fill();
      }
      c.restore();
    }

    // 4. Mái nhà thành phố -> đèn thưa dần (thị sai 0.42 xa & 0.88 gần)
    for (let pass = 0; pass < 2; pass++) {
      const pFactor = pass === 0 ? 0.42 : 0.88;
      const bodyCol = pass === 0
        ? rgbCss(mixRgb([10, 14, 24], [19, 27, 44], brightK))
        : rgbCss(mixRgb([7, 10, 18], [13, 19, 32], brightK));

      for (let i = 0; i < D_BUILDINGS.length; i++) {
        const b = D_BUILDINGS[i];
        if (b.layer !== pass) continue;
        const sx = b.wx - camDist * pFactor;
        if (sx + b.w < -280 || sx > DESIGN_W + 280) continue;

        const baseY = groundY + (pass === 0 ? 6 : 22);
        const topY = baseY - b.h;
        c.fillStyle = bodyCol;
        c.fillRect(sx, topY, b.w, b.h + 120);

        if (b.roof) {
          c.beginPath();
          c.moveTo(sx - 4, topY + 2);
          c.lineTo(sx + b.w * 0.5, topY - b.roofH);
          c.lineTo(sx + b.w + 4, topY + 2);
          c.closePath();
          c.fill();
        }
        if (b.ant) {
          c.strokeStyle = bodyCol;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(sx + b.w * 0.75, topY);
          c.lineTo(sx + b.w * 0.75, topY - 26);
          c.moveTo(sx + b.w * 0.75 - 8, topY - 18);
          c.lineTo(sx + b.w * 0.75 + 8, topY - 18);
          c.stroke();
        }

        for (let j = 0; j < b.wins.length; j++) {
          const w = b.wins[j];
          c.fillStyle = w.warm
            ? `rgba(242,188,108,${w.a.toFixed(2)})`
            : `rgba(148,196,238,${(w.a * 0.85).toFixed(2)})`;
          c.fillRect(sx + w.dx, topY + w.dy, 7, 10);
        }
      }
    }

    // 5. Nền đất tối, đèn đường thưa dần & đồng ruộng tối
    c.fillStyle = '#050810';
    c.fillRect(-350, groundY, DESIGN_W + 700, DESIGN_H - groundY + 300);

    for (let i = 0; i < D_LAMPS.length; i++) {
      const lm = D_LAMPS[i];
      const sx = lm.wx - camDist * 0.96;
      if (sx < -220 || sx > DESIGN_W + 220) continue;
      const topY = groundY - 42 * lm.sc;
      c.strokeStyle = '#121824';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(sx, groundY + 10);
      c.lineTo(sx, topY);
      c.lineTo(sx + 10, topY + 2);
      c.stroke();

      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * 0.42;
      c.drawImage(lm.warm ? SP.warmPool : SP.coldPool, sx + 10 - 34, topY + 2 - 34, 68, 68);
      c.globalAlpha = ba * 0.85;
      c.drawImage(SP.core, sx + 10 - 7, topY + 2 - 7, 14, 14);
      c.restore();
    }

    const fieldFade = smooth(0.44, 0.56, p) * (1 - smooth(0.84, 0.94, p));
    if (fieldFade > 0.01) {
      c.save();
      c.globalAlpha = ba * fieldFade;
      const rCol = 28 + Math.round(brightK * 22);
      const gCol = 42 + Math.round(brightK * 26);
      const bCol = 66 + Math.round(brightK * 30);
      const glintFill = `rgba(${rCol},${gCol},${bCol},0.34)`;
      for (let i = 0; i < D_FIELDS.length; i++) {
        const fd = D_FIELDS[i];
        const pF = 0.95 + fd.row * 0.18;
        const sx = fd.wx - camDist * pF;
        if (sx + fd.w < -250 || sx > DESIGN_W + 250) continue;
        const fy = groundY + 22 + fd.row * 34;
        if (fd.glint) {
          c.fillStyle = glintFill;
          c.beginPath();
          c.moveTo(sx, fy);
          c.lineTo(sx + fd.w, fy);
          c.lineTo(sx + fd.w - 28, fy + 16);
          c.lineTo(sx - 28, fy + 16);
          c.closePath();
          c.fill();
        }
        c.strokeStyle = 'rgba(8,12,20,0.88)';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(sx - 30, fy + 16);
        c.lineTo(sx + fd.w, fy + 16);
        c.stroke();
      }
      c.restore();
    }

    // 6. Rìa sân thượng ở 6 giây đầu (80 -> 86) nối liền chặng santhuong rồi lùi khỏi góc nhìn
    if (tD < 7.0) {
      const stShift = camDist * 1.18;
      if (stShift < 1950) {
        c.save();
        c.translate(-stShift, tD * 44);
        // Cột ăng-ten mảnh bên phải & dáng bồn nước inox mờ rìa trái
        c.fillStyle = '#0d121b';
        c.fillRect(190, 405, 130, 155);
        c.strokeStyle = '#141a25';
        c.lineWidth = 3.2;
        c.beginPath();
        c.moveTo(1312, 220);
        c.lineTo(1312, 560);
        c.moveTo(1272, 260);
        c.lineTo(1352, 260);
        c.moveTo(1284, 296);
        c.lineTo(1340, 296);
        c.stroke();

        // Bờ tường lan can & thanh sắt ngang của sân thượng
        c.fillStyle = '#0f1420';
        c.fillRect(-350, 560, DESIGN_W + 700, 380);
        c.fillStyle = '#182030';
        c.fillRect(-350, 554, DESIGN_W + 700, 8);
        c.strokeStyle = '#1a2232';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(-350, 514);
        c.lineTo(DESIGN_W + 350, 514);
        for (let px = -120; px < DESIGN_W + 200; px += 195) {
          c.moveTo(px, 514);
          c.lineTo(px, 560);
        }
        c.stroke();
        c.restore();
      }
    }

    // 7. Dãy nhà doanh trại thấp & MỘT ô cửa sổ (tiến vào ở 124-128, dừng tại 128)
    const campX = 9260 - camDist;
    if (campX < DESIGN_W + 520) {
      const winX = campX;
      const winY = 500;
      const winW = 108;
      const winH = 72; // 3:2
      const bLeft = winX - 360;
      const bW = 780;
      const bTop = 436;
      const bBot = groundY + 34;

      c.fillStyle = '#090d16';
      c.beginPath();
      c.moveTo(bLeft - 18, bTop);
      c.lineTo(bLeft + 26, bTop - 42);
      c.lineTo(bLeft + bW - 26, bTop - 42);
      c.lineTo(bLeft + bW + 18, bTop);
      c.closePath();
      c.fill();

      c.fillStyle = '#0d131e';
      c.fillRect(bLeft, bTop, bW, bBot - bTop);
      c.fillStyle = '#070a12';
      c.fillRect(bLeft - 10, bTop, bW + 20, 12);
      for (let cx = bLeft + 38; cx <= bLeft + bW - 38; cx += 135) {
        c.fillRect(cx, bTop + 10, 14, bBot - bTop - 10);
      }

      for (const ox of [winX - 245, winX - 125, winX + 125, winX + 245]) {
        c.fillStyle = '#060910';
        c.fillRect(ox - 42, winY - 28, 84, 56);
      }

      const wx0 = winX - winW * 0.5;
      const wy0 = winY - winH * 0.5;
      c.fillStyle = '#121c2a';
      c.fillRect(wx0 - 4, wy0 - 4, winW + 8, winH + 8);
      c.fillStyle = '#1c2b3d';
      c.fillRect(wx0, wy0, winW, winH);
      c.fillStyle = '#101824';
      c.fillRect(winX - 2, wy0, 4, winH);
      c.fillRect(wx0, winY - 2, winW, 4);

      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * 0.36;
      c.drawImage(SP.coldPool, winX - 90, winY - 70, 180, 140);
      c.restore();

      // Đúng S=128: nhịp sáng ấm lan ra từ ô cửa sổ (KHÔNG phải tia chớp - ấm, mềm)
      if (hitT >= 0) {
        const warmIn = smooth(0, 0.32, hitT);
        const warmHold = 1 - smooth(1.05, 1.95, hitT);
        const wAmp = warmIn * warmHold;
        const rad = 60 + esOut(cl(hitT / 1.5, 0, 1)) * 920;

        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = ba * wAmp * 0.92;
        c.drawImage(SP.warmPool, winX - rad, winY - rad, rad * 2, rad * 2);

        const rMid = rad * 0.42;
        c.globalAlpha = ba * wAmp * 0.85;
        c.drawImage(SP.core, winX - rMid, winY - rMid, rMid * 2, rMid * 2);

        c.globalAlpha = ba * warmIn * 0.78;
        c.fillStyle = 'rgba(255,224,174,0.82)';
        c.fillRect(wx0 + 2, wy0 + 2, winW - 4, winH - 4);
        c.fillStyle = '#241a14';
        c.fillRect(winX - 2, wy0, 4, winH);
        c.fillRect(wx0, winY - 2, winW, 4);
        c.restore();
      }
    }

    // 8. Năm đốm sáng bay theo cơn mưa xuyên đêm
    drawDOrbGroup(c, sec, tD, p, now);

    // 9. Mưa trang trí (tốc độ và mật độ tăng theo nhạc)
    const rainMul = 0.55 + 0.65 * p;
    const rainCount = Math.floor(55 + 50 * p);
    const windDx = 0.24 + 0.14 * p;
    const rainA = (hitT > 0 ? 1 - smooth(0.4, 1.5, hitT) : 1) * (0.72 + 0.28 * brightK);
    if (rainA > 0.02) {
      c.save();
      c.lineCap = 'round';
      c.lineWidth = 1.45;
      for (let i = 0; i < rainCount; i++) {
        const r = D_RAIN[i];
        r.y += r.spd * rainMul * dt;
        r.x += r.spd * rainMul * windDx * dt;
        if (r.y > DESIGN_H + 40) {
          r.y = -40 - ((i * 19) % 70);
          r.x = ((r.x + 1800) % (DESIGN_W + 400)) - 220;
        }
        if (r.x > DESIGN_W + 220) r.x -= DESIGN_W + 400;
        c.strokeStyle = `rgba(176,204,236,${(r.a * rainA).toFixed(3)})`;
        c.beginPath();
        c.moveTo(r.x, r.y);
        c.lineTo(r.x + r.len * windDx, r.y + r.len);
        c.stroke();
      }
      c.restore();
    }

    c.restore();

    const openDark = sec < 80.5 ? 1 - es(cl((sec - 80) / 0.5, 0, 1)) : 0;
    const closeDark = hitT > 1.15 ? es(cl((hitT - 1.15) / 0.85, 0, 1)) : 0;
    const coverDark = Math.max(openDark, closeDark);
    if (coverDark > 0.004) {
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = ba * coverDark;
      c.fillStyle = '#060504';
      c.fillRect(0, 0, cw, ch);
      c.restore();
      applyDesignT(c);
    }
  }

  // ---------- MỤC E & F (S 130 -> 166): Khung cửa sổ phòng trại -> Bình minh & Chữ ----------
  const EF_RAIN = [];
  const EF_STREAKS = [];
  (function initEFRain() {
    seedRng(48142);
    for (let i = 0; i < 90; i++) {
      EF_RAIN.push({
        x: WIN.x + nextRng() * WIN.w,
        y: WIN.y + nextRng() * WIN.h,
        len: 16 + nextRng() * 26,
        spd: 580 + nextRng() * 340,
        a: 0.16 + nextRng() * 0.24,
      });
    }
    for (let i = 0; i < 24; i++) {
      EF_STREAKS.push({
        x: WIN.x + 28 + nextRng() * (WIN.w - 56),
        y: WIN.y + 20 + nextRng() * (WIN.h - 40),
        spd: 24 + nextRng() * 34,
        len: 14 + nextRng() * 24,
        wob: nextRng() * 6.28,
      });
    }
  })();

  function paintWindowRoomLayer(c, isDawn) {
    const wallTop = isDawn ? '#1d1c23' : '#0b1016';
    const wallBot = isDawn ? '#282226' : '#10171f';
    const wallG = c.createLinearGradient(0, -100, 0, DESIGN_H + 100);
    wallG.addColorStop(0, wallTop);
    wallG.addColorStop(1, wallBot);

    c.save();
    c.beginPath();
    c.rect(-350, -350, DESIGN_W + 700, DESIGN_H + 700);
    c.rect(WIN.x, WIN.y, WIN.w, WIN.h);
    c.fillStyle = wallG;
    c.fill('evenodd');
    c.restore();

    // Vết thấm mưa loang nhẹ dưới bậu cửa sổ (vọng lại chi tiết p1.js:46)
    seedRng(48130);
    for (let i = 0; i < 7; i++) {
      c.fillStyle = isDawn ? 'rgba(14,10,12,0.14)' : 'rgba(0,0,0,0.18)';
      c.beginPath();
      c.ellipse(WIN.x + 150 + i * 112, WIN.y + WIN.h + 36 + (i % 3) * 14, 24, 48 + i * 4, 0, 0, Math.PI * 2);
      c.fill();
    }

    if (isDawn) {
      const dg = c.createRadialGradient(WIN_CX, WIN_CY + 90, WIN.w * 0.25, WIN_CX, WIN_CY + 90, WIN.w * 0.95);
      dg.addColorStop(0, 'rgba(242,158,108,0.22)');
      dg.addColorStop(0.55, 'rgba(182,114,98,0.08)');
      dg.addColorStop(1, 'rgba(0,0,0,0)');
      c.save();
      c.beginPath();
      c.rect(-350, -350, DESIGN_W + 700, DESIGN_H + 700);
      c.rect(WIN.x, WIN.y, WIN.w, WIN.h);
      c.clip('evenodd');
      c.fillStyle = dg;
      c.fillRect(-350, -350, DESIGN_W + 700, DESIGN_H + 700);
      c.restore();
    } else {
      const ng = c.createRadialGradient(WIN_CX, WIN_CY, WIN.w * 0.3, WIN_CX, WIN_CY, WIN.w * 0.95);
      ng.addColorStop(0, 'rgba(92,132,175,0.14)');
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      c.save();
      c.beginPath();
      c.rect(-350, -350, DESIGN_W + 700, DESIGN_H + 700);
      c.rect(WIN.x, WIN.y, WIN.w, WIN.h);
      c.clip('evenodd');
      c.fillStyle = ng;
      c.fillRect(-350, -350, DESIGN_W + 700, DESIGN_H + 700);
      c.restore();
    }

    const pad = 34;
    c.fillStyle = isDawn ? '#1b191e' : '#0b1015';
    c.beginPath();
    c.moveTo(WIN.x - pad, WIN.y - pad);
    c.lineTo(WIN.x + WIN.w + pad, WIN.y - pad);
    c.lineTo(WIN.x + WIN.w, WIN.y);
    c.lineTo(WIN.x, WIN.y);
    c.closePath();
    c.fill();

    const sillG = c.createLinearGradient(0, WIN.y + WIN.h, 0, WIN.y + WIN.h + pad + 8);
    if (isDawn) {
      sillG.addColorStop(0, '#5a4344');
      sillG.addColorStop(1, '#261e22');
    } else {
      sillG.addColorStop(0, '#223140');
      sillG.addColorStop(1, '#0f161e');
    }
    c.fillStyle = sillG;
    c.beginPath();
    c.moveTo(WIN.x, WIN.y + WIN.h);
    c.lineTo(WIN.x + WIN.w, WIN.y + WIN.h);
    c.lineTo(WIN.x + WIN.w + pad, WIN.y + WIN.h + pad);
    c.lineTo(WIN.x - pad, WIN.y + WIN.h + pad);
    c.closePath();
    c.fill();

    c.fillStyle = isDawn ? '#2f272b' : '#151f28';
    c.beginPath();
    c.moveTo(WIN.x - pad, WIN.y - pad);
    c.lineTo(WIN.x, WIN.y);
    c.lineTo(WIN.x, WIN.y + WIN.h);
    c.lineTo(WIN.x - pad, WIN.y + WIN.h + pad);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(WIN.x + WIN.w + pad, WIN.y - pad);
    c.lineTo(WIN.x + WIN.w, WIN.y);
    c.lineTo(WIN.x + WIN.w, WIN.y + WIN.h);
    c.lineTo(WIN.x + WIN.w + pad, WIN.y + WIN.h + pad);
    c.closePath();
    c.fill();

    const frameCol = isDawn ? '#241e22' : '#141b20';
    const rimCol = isDawn ? 'rgba(245,190,148,0.28)' : 'rgba(155,192,226,0.22)';
    const bw = 18;
    c.fillStyle = frameCol;
    c.fillRect(WIN.x - 4, WIN.y - 4, WIN.w + 8, bw);
    c.fillRect(WIN.x - 4, WIN.y + WIN.h - bw + 4, WIN.w + 8, bw);
    c.fillRect(WIN.x - 4, WIN.y, bw, WIN.h);
    c.fillRect(WIN.x + WIN.w - bw + 4, WIN.y, bw, WIN.h);

    // Thanh chữ thập (+) chia 4 ô kính đúng dáng p1.js
    const barW = 16;
    c.fillStyle = frameCol;
    c.fillRect(WIN_CX - barW * 0.5, WIN.y + 4, barW, WIN.h - 8);
    c.fillRect(WIN.x + 4, WIN_CY - barW * 0.5, WIN.w - 8, barW);

    c.strokeStyle = rimCol;
    c.lineWidth = 1.4;
    c.strokeRect(WIN.x + bw - 4, WIN.y + bw - 4, WIN.w - bw * 2 + 8, WIN.h - bw * 2 + 8);
    c.beginPath();
    c.moveTo(WIN_CX - barW * 0.5, WIN.y + bw - 4);
    c.lineTo(WIN_CX - barW * 0.5, WIN.y + WIN.h - bw + 4);
    c.moveTo(WIN.x + bw - 4, WIN_CY - barW * 0.5);
    c.lineTo(WIN.x + WIN.w - bw + 4, WIN_CY - barW * 0.5);
    c.stroke();

    seedRng(48135);
    for (let i = 0; i < 5500; i++) {
      c.fillStyle = `rgba(255,255,255,${(nextRng() * 0.015).toFixed(4)})`;
      c.fillRect(nextRng() * DESIGN_W, nextRng() * DESIGN_H, 1.3, 1.3);
    }
    if (typeof vignette === 'function') vignette(c, isDawn ? 0.52 : 0.72);
  }

  function bakeWindowLayers(cw, ch) {
    if (winNightC && winDawnC && bakedW === cw && bakedH === ch) return;
    [winNightC, winNightG] = makeLayer(cw, ch);
    [winDawnC, winDawnG] = makeLayer(cw, ch);
    applyDesignT(winNightG);
    paintWindowRoomLayer(winNightG, false);
    applyDesignT(winDawnG);
    paintWindowRoomLayer(winDawnG, true);
    bakedW = cw;
    bakedH = ch;
  }

  // ---------- Hạt sáng bay xếp chữ mục F ----------
  const TEXT_PARTICLES = [];
  let textBuilt = false;
  let textBuiltWithFont = false;
  let textFontsAsked = false;
  let fontForceReady = false;
  let cachedLineFs = 0;
  let cachedLineFsFontOk = false;

  function askFonts() {
    if (textFontsAsked || typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
    textFontsAsked = true;
    document.fonts.load(`700 74px ${SCRIPT}`).then(() => {
      fontForceReady = true;
    }).catch(() => {});
  }

  function checkScriptFontReady() {
    if (fontForceReady) return true;
    try {
      return !!(typeof document !== 'undefined' && document.fonts && document.fonts.check && document.fonts.check(`700 74px ${SCRIPT}`));
    } catch (_) {
      return false;
    }
  }

  function getLineFontSize(ctx, maxW) {
    const fontOk = checkScriptFontReady();
    if (cachedLineFs && cachedLineFsFontOk === fontOk) return cachedLineFs;
    let fs = 74;
    ctx.font = `700 ${fs}px ${SCRIPT}`;
    while (fs > 46 && ctx.measureText(LINE_F).width > maxW) {
      fs -= 2;
      ctx.font = `700 ${fs}px ${SCRIPT}`;
    }
    cachedLineFs = fs;
    cachedLineFsFontOk = fontOk;
    return fs;
  }

  function buildTextParticles() {
    const fontOk = checkScriptFontReady();
    if (textBuilt && (textBuiltWithFont || !fontOk)) return;

    const tw = 1120;
    const th = 220;
    const [cvT, gT] = makeLayer(tw, th);
    gT.clearRect(0, 0, tw, th);

    const fs = getLineFontSize(gT, tw - 100);
    gT.font = `700 ${fs}px ${SCRIPT}`;
    gT.textAlign = 'center';
    gT.textBaseline = 'middle';
    gT.fillStyle = '#fff';
    gT.fillText(LINE_F, tw * 0.5, th * 0.5);

    const img = gT.getImageData(0, 0, tw, th).data;
    const cell = 5;
    const pts = [];
    seedRng(48150);

    for (let gy = 0; gy < th; gy += cell) {
      for (let gx = 0; gx < tw; gx += cell) {
        let sumX = 0;
        let sumY = 0;
        let cnt = 0;
        const my = Math.min(th, gy + cell);
        const mx = Math.min(tw, gx + cell);
        for (let py = gy; py < my; py++) {
          const rowOff = py * tw * 4;
          for (let px = gx; px < mx; px++) {
            if (img[rowOff + px * 4 + 3] > 95) {
              sumX += px;
              sumY += py;
              cnt++;
            }
          }
        }
        if (cnt > 0) {
          pts.push([
            WIN_CX - tw * 0.5 + sumX / cnt,
            LINE_Y - th * 0.5 + sumY / cnt,
          ]);
        }
      }
    }

    let picked = pts;
    if (pts.length > 520) {
      picked = [];
      const step = pts.length / 500;
      for (let i = 0; i < 500; i++) {
        picked.push(pts[Math.floor(i * step)]);
      }
    }

    picked.sort((a, b) => a[0] - b[0]);
    TEXT_PARTICLES.length = 0;
    const total = picked.length || 1;
    for (let i = 0; i < picked.length; i++) {
      const pt = picked[i];
      const uPos = i / total;
      const dropIdx = cl(Math.floor(uPos * DROPS.length), 0, DROPS.length - 1);
      const src = DROPS[dropIdx];
      const angle = nextRng() * Math.PI * 2;
      const radJ = nextRng() * 14;
      TEXT_PARTICLES.push({
        id: src.id,
        sx: src.x + Math.cos(angle) * radJ,
        sy: src.y + Math.sin(angle) * radJ,
        tx: pt[0],
        ty: pt[1],
        delay: (i % 7) * 0.11 + nextRng() * 0.35,
        dur: 3.1 + nextRng() * 0.9,
        swirl: (nextRng() - 0.5) * 170,
        size: 3.4 + nextRng() * 3.0,
        ph: nextRng() * 6.28,
      });
    }

    textBuilt = true;
    textBuiltWithFont = fontOk;
  }

  function drawGlassDrop(c, drop, alpha, breath) {
    if (alpha <= 0.005) return;
    const ba = c.globalAlpha;
    const x = drop.x;
    const y = drop.y;
    const r = drop.r;
    const rgbStr = pieceStr[drop.id];

    // Vệt nước rất mảnh phía trên giọt (2 đoạn nhạt -> đậm dần, không tạo gradient mỗi khung hình)
    c.save();
    c.lineCap = 'round';
    c.lineWidth = 1.4;
    c.strokeStyle = `rgba(${rgbStr},${(0.11 * alpha).toFixed(3)})`;
    c.beginPath();
    c.moveTo(x - 0.8, y - drop.streak - r);
    c.lineTo(x + 0.1, y - drop.streak * 0.5 - r * 0.7);
    c.stroke();
    c.strokeStyle = `rgba(${rgbStr},${(0.24 * alpha).toFixed(3)})`;
    c.beginPath();
    c.moveTo(x + 0.1, y - drop.streak * 0.5 - r * 0.7);
    c.lineTo(x, y - r * 0.4);
    c.stroke();

    c.globalCompositeOperation = 'lighter';
    if (SP.cols[drop.id]) {
      const rq = (46 + 8 * breath) * 1.05;
      c.globalAlpha = ba * alpha * (0.48 + 0.22 * breath);
      c.drawImage(SP.cols[drop.id], x - rq, y - rq, rq * 2, rq * 2);
    }
    const rw = 20 + 4 * breath;
    c.globalAlpha = ba * alpha * (0.42 + 0.18 * breath);
    c.drawImage(SP.warmPool, x - rw, y - rw, rw * 2, rw * 2);

    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = ba * alpha;
    c.fillStyle = `rgba(${rgbStr},${(0.76 + 0.18 * breath).toFixed(2)})`;
    c.beginPath();
    c.moveTo(x, y - r * 1.35);
    c.bezierCurveTo(x + r * 0.85, y - r * 0.35, x + r * 1.05, y + r * 0.6, x, y + r * 0.92);
    c.bezierCurveTo(x - r * 1.05, y + r * 0.6, x - r * 0.85, y - r * 0.35, x, y - r * 1.35);
    c.closePath();
    c.fill();

    c.fillStyle = `rgba(255,244,224,${(0.72 + 0.22 * breath).toFixed(2)})`;
    c.beginPath();
    c.arc(x, y + r * 0.22, r * 0.42, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = `rgba(255,255,255,${(0.82 * alpha).toFixed(2)})`;
    c.beginPath();
    c.arc(x - r * 0.26, y - r * 0.16, r * 0.17, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawSectionEF(c, sec, now, dt) {
    const ba = c.globalAlpha;
    const [cw, ch] = canvasSize(c);

    // Tại đúng 166.0 cảnh đã mờ kín sang #060504
    const endFade = sec > 161.0 ? es(cl((sec - 161.0) / 5.0, 0, 1)) : 0;
    if (endFade >= 0.999) {
      fillSolidFull(c, '#060504');
      applyDesignT(c);
      return;
    }

    bakeWindowLayers(cw, ch);
    askFonts();

    const dawn = sec <= 142 ? 0 : es(cl((sec - 142) / 14.5, 0, 1));
    const rainAmt = sec <= 142 ? 1 : cl(1 - (sec - 142) / 6.5, 0, 1);

    applyDesignT(c);
    fillSolidFull(c, '#060504');

    // 1. Bầu trời sau ô kính: từ đêm mưa (130-142) hửng dần sang bình minh hồng cam (142-166)
    const oSkyTop = keyedColor([
      [0, [6, 11, 20]],
      [0.32, [24, 34, 58]],
      [0.65, [54, 62, 102]],
      [1, [82, 92, 138]],
    ], dawn);
    const oSkyMid = keyedColor([
      [0, [13, 24, 40]],
      [0.32, [48, 49, 76]],
      [0.65, [128, 84, 102]],
      [1, [196, 116, 108]],
    ], dawn);
    const oSkyLow = keyedColor([
      [0, [20, 34, 54]],
      [0.32, [74, 66, 86]],
      [0.65, [198, 122, 98]],
      [1, [244, 174, 116]],
    ], dawn);

    c.save();
    c.beginPath();
    c.rect(WIN.x, WIN.y, WIN.w, WIN.h);
    c.clip();

    const skyG = c.createLinearGradient(0, WIN.y, 0, WIN.y + WIN.h);
    skyG.addColorStop(0, rgbCss(oSkyTop));
    skyG.addColorStop(0.56, rgbCss(oSkyMid));
    skyG.addColorStop(1, rgbCss(oSkyLow));
    c.fillStyle = skyG;
    c.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);

    if (dawn > 0.15) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * smooth(0.15, 0.9, dawn) * 0.42;
      c.drawImage(SP.warmPool, WIN_CX - 480, WIN.y + WIN.h - 320, 960, 440);
      c.restore();
    }

    const ridgeCol = keyedColor([[0, [4, 7, 11]], [0.5, [22, 20, 32]], [1, [48, 30, 38]]], dawn);
    c.fillStyle = rgbCss(ridgeCol);
    c.beginPath();
    c.moveTo(WIN.x, WIN.y + WIN.h * 0.87);
    for (let i = 0; i <= 20; i++) {
      const rx = WIN.x + (WIN.w * i) / 20;
      const ry = WIN.y + WIN.h * (0.81 + Math.sin(i * 0.72) * 0.032 + Math.cos(i * 1.4) * 0.015);
      c.lineTo(rx, ry);
    }
    c.lineTo(WIN.x + WIN.w, WIN.y + WIN.h);
    c.lineTo(WIN.x, WIN.y + WIN.h);
    c.closePath();
    c.fill();

    // 2. Mưa rơi & vệt nước chảy trên kính (ngớt rồi tạnh trong F)
    if (rainAmt > 0.01) {
      const rCount = Math.ceil(EF_RAIN.length * rainAmt);
      c.strokeStyle = `rgba(${dawn > 0.3 ? '230,210,212' : '178,206,236'},${(0.28 * rainAmt).toFixed(3)})`;
      c.lineWidth = 1.4;
      c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i < rCount; i++) {
        const r = EF_RAIN[i];
        r.y += r.spd * (0.55 + 0.45 * rainAmt) * dt;
        r.x -= r.spd * 0.14 * dt;
        if (r.y > WIN.y + WIN.h + 20) {
          r.y = WIN.y - 24;
          r.x = WIN.x + ((r.x - WIN.x + WIN.w) % WIN.w);
        }
        if (r.x < WIN.x) r.x += WIN.w;
        c.moveTo(r.x, r.y);
        c.lineTo(r.x + r.len * 0.14, r.y - r.len);
      }
      c.stroke();

      c.strokeStyle = `rgba(215,232,248,${(0.22 * rainAmt).toFixed(3)})`;
      c.lineWidth = 1.8;
      c.beginPath();
      for (let i = 0; i < EF_STREAKS.length; i++) {
        const s0 = EF_STREAKS[i];
        s0.y += s0.spd * (0.4 + 0.6 * rainAmt) * dt;
        if (s0.y > WIN.y + WIN.h + 30) s0.y = WIN.y - 10;
        const wob = Math.sin(s0.y * 0.04 + s0.wob) * 2.2;
        c.moveTo(s0.x, s0.y - s0.len);
        c.quadraticCurveTo(s0.x + wob, s0.y - s0.len * 0.4, s0.x, s0.y);
      }
      c.stroke();
    }

    c.fillStyle = `rgba(180,210,235,${(0.055 * (1 - dawn * 0.5)).toFixed(3)})`;
    c.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    c.restore();

    // 3. Khung cửa sổ & tường phòng trại (nướng tĩnh đêm -> bình minh)
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = ba;
    c.drawImage(winNightC, 0, 0);
    if (dawn > 0.005) {
      c.globalAlpha = ba * dawn;
      c.drawImage(winDawnC, 0, 0);
    }
    c.restore();
    applyDesignT(c);

    // 4. Năm giọt sáng đậu trên kính (khẽ thở tới ~145)
    const dropFade = sec < 144.8 ? 1 : Math.max(0, 1 - smooth(144.8, 146.1, sec));
    if (dropFade > 0.005) {
      for (let i = 0; i < DROPS.length; i++) {
        const breath = 0.5 + 0.5 * Math.sin(now * 0.0022 + DROPS[i].ph);
        drawGlassDrop(c, DROPS[i], dropFade, breath);
      }
    }

    // 5. ~145: năm giọt sáng tách thành hàng trăm hạt sáng nhỏ, tụ thành "Đến ôm em bằng được."
    if (sec >= 144.8) {
      buildTextParticles();

      const tF = sec - 144.8;
      const textReveal = smooth(4.3, 6.0, tF);
      const partStay = 1 - smooth(5.6, 8.6, tF);

      if (textReveal > 0.01) {
        c.save();
        c.globalAlpha = ba * textReveal * 0.38;
        c.drawImage(SP.darkHalo, WIN_CX - 500, LINE_Y - 125, 1000, 250);
        c.restore();
      }

      if (partStay > 0.005) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < TEXT_PARTICLES.length; i++) {
          const pt = TEXT_PARTICLES[i];
          const u = cl((tF - pt.delay) / pt.dur, 0, 1);
          if (u <= 0) continue;

          const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2.4) / 2;
          const dx = pt.tx - pt.sx;
          const dy = pt.ty - pt.sy;
          const dLen = Math.hypot(dx, dy) || 1;
          const nx = -dy / dLen;
          const ny = dx / dLen;

          const arc = Math.sin(u * Math.PI) * pt.swirl;
          const px = lp(pt.sx, pt.tx, e) + nx * arc;
          const py = lp(pt.sy, pt.ty, e) + ny * arc - Math.sin(u * Math.PI) * 32;

          const inVis = cl(u / 0.14, 0, 1);
          const creamMix = es(cl((u - 0.45) / 0.55, 0, 1));
          const twink = 0.82 + 0.18 * Math.sin(now * 0.005 + pt.ph);
          const pAlpha = inVis * partStay * twink;
          const rad = pt.size * lp(1.45, 0.72, e) * 2.2;

          const colSpr = SP.partCols[pt.id];
          if (colSpr && creamMix < 0.98) {
            c.globalAlpha = ba * pAlpha * (1 - creamMix) * 0.92;
            c.drawImage(colSpr, px - rad, py - rad, rad * 2, rad * 2);
          }
          c.globalAlpha = ba * pAlpha * (0.28 + 0.72 * creamMix);
          c.drawImage(SP.partCream, px - rad * 0.92, py - rad * 0.92, rad * 1.84, rad * 1.84);
        }
        c.restore();
      }

      if (textReveal > 0.005) {
        c.save();
        const fs = getLineFontSize(c, 1020);
        c.font = `700 ${fs}px ${SCRIPT}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';

        c.globalAlpha = ba * textReveal * 0.54;
        c.fillStyle = '#120d14';
        c.fillText(LINE_F, WIN_CX, LINE_Y + 3);
        c.globalAlpha = ba * textReveal * 0.34;
        c.fillText(LINE_F, WIN_CX - 1.5, LINE_Y + 1.5);
        c.fillText(LINE_F, WIN_CX + 1.5, LINE_Y + 1.5);

        c.globalAlpha = ba * textReveal * 0.98;
        c.fillStyle = '#f4e6cc';
        c.fillText(LINE_F, WIN_CX, LINE_Y);

        const glowBoost = Math.exp(-Math.max(0, tF - 5.2) * 0.7);
        if (glowBoost > 0.03) {
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = ba * textReveal * glowBoost * 0.22;
          c.fillText(LINE_F, WIN_CX, LINE_Y);
        }
        c.restore();
      }
    }

    const enterFade = sec < 130.7 ? 1 - es(cl((sec - 130) / 0.7, 0, 1)) : 0;
    const darkCover = Math.max(enterFade, endFade);
    if (darkCover > 0.004) {
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = ba * darkCover;
      c.fillStyle = '#060504';
      c.fillRect(0, 0, cw, ch);
      c.restore();
      applyDesignT(c);
    }
  }

  // ---------- API công khai ----------
  function reset() {
    seedRng(48142);
    for (let i = 0; i < D_RAIN.length; i++) {
      D_RAIN[i].x = nextRng() * (DESIGN_W + 300) - 150;
      D_RAIN[i].y = nextRng() * DESIGN_H;
    }
    for (let i = 0; i < EF_RAIN.length; i++) {
      EF_RAIN[i].x = WIN.x + nextRng() * WIN.w;
      EF_RAIN[i].y = WIN.y + nextRng() * WIN.h;
    }
    for (let i = 0; i < EF_STREAKS.length; i++) {
      EF_STREAKS[i].x = WIN.x + 28 + nextRng() * (WIN.w - 56);
      EF_STREAKS[i].y = WIN.y + 20 + nextRng() * (WIN.h - 40);
    }
    askFonts();
  }

  function draw(c, sec, now, dt) {
    if (!c) return;
    const ba = c.globalAlpha;
    try {
      ensureSprites();
      const sNow = typeof now === 'number' && isFinite(now) ? now : performance.now();
      const sDt = cl(typeof dt === 'number' && isFinite(dt) ? dt : 0.016, 0, 0.05);
      const sSec = cl(typeof sec === 'number' && isFinite(sec) ? sec : 48, 48, 166);

      if (sSec < 80) {
        drawSectionC(c, sSec, sNow, sDt);
      } else if (sSec < 130) {
        drawSectionD(c, sSec, sNow, sDt);
      } else {
        drawSectionEF(c, sSec, sNow, sDt);
      }
    } catch (_) {
      try {
        fillSolidFull(c, '#060504');
      } catch (__) {}
    } finally {
      try {
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = ba;
        applyDesignT(c);
      } catch (___) {}
    }
  }

  askFonts();
  window.KET2PHIM = { reset, draw };
})();
