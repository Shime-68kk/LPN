/* exported KT */
// =============================================================================
// p-ket.js — Băng số 2 (Bài 24): Cảnh kết — 100 ngọn đèn & sân đình hai bóng
// API toàn cục:
//   KT = { den: 0..100, cam: 0..1, bong: 0..1, dom: 0..1, sang: 0..1, lampXY(i) }
//   SC.ketduong, SC.ketdinh
// =============================================================================

var KT = typeof KT === 'object' && KT ? KT : {};
if (KT.den === undefined) KT.den = 0;
if (KT.cam === undefined) KT.cam = 0;
if (KT.bong === undefined) KT.bong = 0;
if (KT.dom === undefined) KT.dom = 0;
if (KT.sang === undefined) KT.sang = 0;

(function () {
  'use strict';

  const BASE_DIR =
    typeof document !== 'undefined' && document.currentScript && document.currentScript.src
      ? document.currentScript.src.replace(/[^/]*$/, '')
      : '';

  const imgTrong = new Image();
  const isImgReady = (im) => im && im.complete && im.naturalWidth > 0;

  // Private deterministic PRNG (does not mutate core.js seed)
  let kseed = 241126;
  function krnd() {
    kseed = (kseed * 1664525 + 1013904223) >>> 0;
    return kseed / 4294967296;
  }

  function smooth01(k) {
    const t = clamp(k, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function kgrain(c, n, a) {
    c.save();
    for (let i = 0; i < n; i++) {
      const x = krnd() * (W + 240) - 120;
      const y = krnd() * (H + 180) - 90;
      c.fillStyle = krnd() > 0.5 ? `rgba(255,244,224,${a})` : `rgba(3,5,12,${a * 1.35})`;
      c.fillRect(x, y, 2, 2);
    }
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Prebuilt radial sprites (zero shadowBlur / filter per frame)
  // ---------------------------------------------------------------------------
  function makeGlow(size, stops) {
    const [c, cx] = layer();
    c.width = size;
    c.height = size;
    const h = size / 2;
    const g0 = cx.createRadialGradient(h, h, 0, h, h, h);
    for (let i = 0; i < stops.length; i++) {
      g0.addColorStop(stops[i][0], stops[i][1]);
    }
    cx.fillStyle = g0;
    cx.fillRect(0, 0, size, size);
    return c;
  }

  const SP = {
    warm: makeGlow(128, [
      [0, 'rgba(255,246,216,1)'],
      [0.14, 'rgba(255,204,122,0.85)'],
      [0.42, 'rgba(235,146,66,0.28)'],
      [1, 'rgba(235,146,66,0)'],
    ]),
    flare: makeGlow(160, [
      [0, 'rgba(255,253,242,1)'],
      [0.18, 'rgba(255,226,158,0.92)'],
      [0.46, 'rgba(248,176,84,0.38)'],
      [1, 'rgba(248,176,84,0)'],
    ]),
    glow: makeGlow(256, [
      [0, 'rgba(255,212,138,0.52)'],
      [0.36, 'rgba(232,148,68,0.20)'],
      [0.72, 'rgba(186,98,38,0.06)'],
      [1, 'rgba(186,98,38,0)'],
    ]),
    groundPool: makeGlow(160, [
      [0, 'rgba(255,208,128,0.55)'],
      [0.35, 'rgba(226,144,64,0.22)'],
      [0.72, 'rgba(176,96,38,0.06)'],
      [1, 'rgba(176,96,38,0)'],
    ]),
    cool: makeGlow(128, [
      [0, 'rgba(224,240,255,0.88)'],
      [0.24, 'rgba(146,188,236,0.42)'],
      [0.62, 'rgba(84,128,188,0.12)'],
      [1, 'rgba(84,128,188,0)'],
    ]),
    ff: makeGlow(64, [
      [0, 'rgba(255,250,206,1)'],
      [0.22, 'rgba(238,224,132,0.72)'],
      [0.58, 'rgba(196,176,78,0.18)'],
      [1, 'rgba(196,176,78,0)'],
    ]),
    moon: makeGlow(256, [
      [0, 'rgba(232,240,255,0.46)'],
      [0.32, 'rgba(170,196,236,0.18)'],
      [0.7, 'rgba(116,146,198,0.05)'],
      [1, 'rgba(116,146,198,0)'],
    ]),
  };

  function drawSprite(c, sp, x, y, rx, ry, alpha) {
    if (alpha <= 0.002 || rx <= 0 || ry <= 0) return;
    c.save();
    c.globalAlpha *= alpha;
    c.drawImage(sp, x - rx, y - ry, rx * 2, ry * 2);
    c.restore();
  }

  function fitOffscreen(oldC, painter) {
    if (!cv || !cv.width || !cv.height) return oldC;
    let c0 = oldC;
    if (!c0) c0 = layer()[0];
    if (c0.width !== cv.width || c0.height !== cv.height) {
      c0.width = cv.width;
      c0.height = cv.height;
    }
    const cx = c0.getContext('2d');
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, c0.width, c0.height);
    setT(cx);
    painter(cx);
    return c0;
  }

  function drawBakedScreenLayer(c, offC) {
    if (!offC || !offC.width || !offC.height) return;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(offC, 0, 0);
    c.restore();
  }

  // ===========================================================================
  // SCENE 1: SC.ketduong — Bản đồ đêm nhìn chếch từ trại tới sân đình (100 đèn)
  // ===========================================================================

  // Shared 3D oblique camera model (used by renderer AND KT.lampXY)
  function kdCamParams(rawCam) {
    const cam = clamp(Number(rawCam) || 0, 0, 1);
    const k = lerp(cam, smooth01(cam), 0.72);
    const tx = lerp(-30, 295, k);
    const ty = lerp(-60, 265, k);
    const dist = lerp(1350, 420, k);
    const height = lerp(400, 108, k);
    const anchorY = lerp(455, 540, k);
    const fl = 1320;
    const len = Math.hypot(dist, height);
    return {
      cam,
      k,
      tx,
      ty,
      dist,
      height,
      anchorY,
      fl,
      fy: -dist / len,
      fz: -height / len,
      uy: -height / len,
      uz: dist / len,
      syHorizon: anchorY - fl * (height / dist),
    };
  }

  function kdProject(wx, wy, wz, cp) {
    const px = wx - cp.tx;
    const py = wy - (cp.ty + cp.dist);
    const pz = wz - cp.height;
    const zc = Math.max(24, py * cp.fy + pz * cp.fz);
    const yc = py * cp.uy + pz * cp.uz;
    const sc = cp.fl / zc;
    return [W * 0.5 + px * sc, cp.anchorY - yc * sc, sc, zc];
  }

  // Winding road spline from Camp Gate (-720,-1300) to Dinh Courtyard (225,295)
  const ROAD_PTS = [
    [-720, -1300],
    [-450, -1060],
    [-630, -760],
    [-220, -480],
    [-350, -120],
    [-20, 120],
    [135, 255],
    [225, 295],
  ];

  function catmullPt(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return [
      0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
      0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
    ];
  }

  const ROAD_SAMPLES = [];
  const LAMPS = [];

  (function initRoadAndLamps() {
    const nSeg = ROAD_PTS.length - 1;
    const stepsPerSeg = 64;
    let totalLen = 0;
    let prev = ROAD_PTS[0];

    ROAD_SAMPLES.push({ x: prev[0], y: prev[1], s: 0, nx: 1, ny: 0 });
    for (let seg = 0; seg < nSeg; seg++) {
      const p0 = ROAD_PTS[Math.max(0, seg - 1)];
      const p1 = ROAD_PTS[seg];
      const p2 = ROAD_PTS[seg + 1];
      const p3 = ROAD_PTS[Math.min(nSeg, seg + 2)];
      for (let j = 1; j <= stepsPerSeg; j++) {
        const pt = catmullPt(p0, p1, p2, p3, j / stepsPerSeg);
        totalLen += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
        ROAD_SAMPLES.push({ x: pt[0], y: pt[1], s: totalLen, nx: 1, ny: 0 });
        prev = pt;
      }
    }

    for (let i = 0; i < ROAD_SAMPLES.length; i++) {
      const a = ROAD_SAMPLES[Math.max(0, i - 1)];
      const b = ROAD_SAMPLES[Math.min(ROAD_SAMPLES.length - 1, i + 1)];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      ROAD_SAMPLES[i].tx = dx / len;
      ROAD_SAMPLES[i].ty = dy / len;
      ROAD_SAMPLES[i].nx = -dy / len;
      ROAD_SAMPLES[i].ny = dx / len;
    }

    function sampleAtLen(targetS) {
      let lo = 0;
      let hi = ROAD_SAMPLES.length - 1;
      while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (ROAD_SAMPLES[mid].s < targetS) lo = mid;
        else hi = mid;
      }
      const a = ROAD_SAMPLES[lo];
      const b = ROAD_SAMPLES[hi];
      const span = b.s - a.s || 1;
      const f = clamp((targetS - a.s) / span, 0, 1);
      return {
        x: lerp(a.x, b.x, f),
        y: lerp(a.y, b.y, f),
        tx: lerp(a.tx, b.tx, f),
        ty: lerp(a.ty, b.ty, f),
        nx: lerp(a.nx, b.nx, f),
        ny: lerp(a.ny, b.ny, f),
      };
    }

    for (let i = 1; i <= 100; i++) {
      const frac = (i - 1) / 99;
      const pt = sampleAtLen(frac * totalLen);
      const shoulder = lerp(12, 8, smooth01(clamp((frac - 0.88) / 0.12, 0, 1)));
      LAMPS.push({
        idx: i,
        rx: pt.x,
        ry: pt.y,
        lx: pt.x + pt.nx * shoulder,
        ly: pt.y + pt.ny * shoulder,
        poleH: 38,
        headZ: 36,
        tx: pt.tx,
        ty: pt.ty,
      });
    }
  })();

  KT.lampXY = function (i) {
    const idx = clamp(Math.round(Number(i) || 1), 1, 100) - 1;
    const lamp = LAMPS[idx];
    const cp = kdCamParams(KT.cam);
    const p = kdProject(lamp.lx, lamp.ly, lamp.headZ, cp);
    return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
  };

  // Countryside static world data (fields, ponds, trees)
  const KD_FIELDS = [
    { pts: [[-1320, -1100], [-650, -1040], [-740, -680], [-1420, -760]], c: '#0a101d', rim: 'rgba(42,60,92,0.22)' },
    { pts: [[-540, -1240], [180, -1160], [100, -740], [-480, -820]], c: '#0b1220', rim: 'rgba(46,66,98,0.20)' },
    { pts: [[-1180, -620], [-420, -560], [-510, -190], [-1280, -250]], c: '#090f1c', rim: 'rgba(38,56,88,0.20)' },
    { pts: [[-120, -700], [560, -640], [490, -220], [-180, -280]], c: '#0a111f', rim: 'rgba(44,64,96,0.22)' },
    { pts: [[-920, -160], [-290, -110], [-360, 220], [-990, 170]], c: '#09101c', rim: 'rgba(40,58,90,0.22)' },
    { pts: [[-160, -190], [290, -140], [240, 140], [-190, 95]], c: '#0b1322', rim: 'rgba(48,70,104,0.24)' },
    { pts: [[500, -180], [1060, -120], [990, 320], [470, 260]], c: '#090e1a', rim: 'rgba(36,54,84,0.18)' },
  ];

  const KD_WATER = [
    [[-1080, -960], [-760, -920], [-810, -740], [-1130, -780]],
    [[-390, -980], [-80, -940], [-130, -790], [-430, -830]],
    [[-180, -580], [220, -540], [160, -340], [-210, -380]],
    [[-790, -120], [-420, -85], [-470, 120], [-840, 85]],
  ];

  const KD_TREES = [];
  (function initKdTrees() {
    const spots = [
      [-1080, -1560, 32], [-1030, -1310, 28], [-550, -1520, 30], [-610, -1280, 26],
      [-760, -1120, 24], [-420, -1190, 22], [-730, -820, 28], [-480, -680, 24],
      [-340, -570, 26], [-110, -490, 24], [-440, -250, 28], [-230, -40, 22],
      [-120, 210, 24], [55, 295, 22], [185, 195, 26], [228, 178, 30],
      [292, 160, 24], [544, 204, 26], [552, 292, 24], [150, 345, 20],
    ];
    for (let i = 0; i < spots.length; i++) {
      KD_TREES.push({
        x: spots[i][0],
        y: spots[i][1],
        h: spots[i][2],
        r: spots[i][2] * 0.56,
      });
    }
  })();

  const KD_STARS = [];
  for (let i = 0; i < 82; i++) {
    KD_STARS.push({
      x: krnd() * W,
      y: krnd() * 235,
      r: 0.55 + krnd() * 1.1,
      a: 0.22 + krnd() * 0.55,
      ph: krnd() * 6.28,
    });
  }

  let kdGrainVigC = null;
  let kdWorldC = null;
  let kdLastCam = -1;

  function bakeKdGrainVig() {
    kdGrainVigC = fitOffscreen(kdGrainVigC, (cx) => {
      kgrain(cx, 1500, 0.022);
      vignette(cx, 0.72);
    });
  }

  function polyProj(c, pts, wz, cp) {
    c.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = kdProject(pts[i][0], pts[i][1], wz, cp);
      if (i === 0) c.moveTo(p[0], p[1]);
      else c.lineTo(p[0], p[1]);
    }
    c.closePath();
  }

  function drawBox3D(c, cp, x0, y0, x1, y1, z0, z1, colFront, colSide, colRoof, colRim) {
    const f0 = kdProject(x0, y1, z0, cp);
    const f1 = kdProject(x1, y1, z0, cp);
    const f2 = kdProject(x1, y1, z1, cp);
    const f3 = kdProject(x0, y1, z1, cp);

    // Side wall facing camera
    if (cp.tx > x1 && colSide) {
      const s0 = kdProject(x1, y1, z0, cp);
      const s1 = kdProject(x1, y0, z0, cp);
      const s2 = kdProject(x1, y0, z1, cp);
      const s3 = kdProject(x1, y1, z1, cp);
      c.fillStyle = colSide;
      c.beginPath();
      c.moveTo(s0[0], s0[1]);
      c.lineTo(s1[0], s1[1]);
      c.lineTo(s2[0], s2[1]);
      c.lineTo(s3[0], s3[1]);
      c.closePath();
      c.fill();
    } else if (cp.tx < x0 && colSide) {
      const s0 = kdProject(x0, y0, z0, cp);
      const s1 = kdProject(x0, y1, z0, cp);
      const s2 = kdProject(x0, y1, z1, cp);
      const s3 = kdProject(x0, y0, z1, cp);
      c.fillStyle = colSide;
      c.beginPath();
      c.moveTo(s0[0], s0[1]);
      c.lineTo(s1[0], s1[1]);
      c.lineTo(s2[0], s2[1]);
      c.lineTo(s3[0], s3[1]);
      c.closePath();
      c.fill();
    }

    // Front wall (southern face y1)
    c.fillStyle = colFront;
    c.beginPath();
    c.moveTo(f0[0], f0[1]);
    c.lineTo(f1[0], f1[1]);
    c.lineTo(f2[0], f2[1]);
    c.lineTo(f3[0], f3[1]);
    c.closePath();
    c.fill();

    // Roof only visible when camera sits higher than roof z1
    if (cp.height > z1 && colRoof) {
      const r0 = kdProject(x0, y0, z1, cp);
      const r1 = kdProject(x1, y0, z1, cp);
      c.fillStyle = colRoof;
      c.beginPath();
      c.moveTo(f3[0], f3[1]);
      c.lineTo(f2[0], f2[1]);
      c.lineTo(r1[0], r1[1]);
      c.lineTo(r0[0], r0[1]);
      c.closePath();
      c.fill();

      if (colRim) {
        c.strokeStyle = colRim;
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(f3[0], f3[1]);
        c.lineTo(f2[0], f2[1]);
        c.stroke();
      }
    }
  }

  function drawGableBarrack(c, cp, x0, y0, x1, y1, zWall, zRidge) {
    drawBox3D(c, cp, x0, y0, x1, y1, 0, zWall, '#182131', '#111724', null, null);
    const ym = (y0 + y1) * 0.5;
    const efL = kdProject(x0 - 8, y1 + 6, zWall - 2, cp);
    const efR = kdProject(x1 + 8, y1 + 6, zWall - 2, cp);
    const ebL = kdProject(x0 - 8, y0 - 6, zWall - 2, cp);
    const ebR = kdProject(x1 + 8, y0 - 6, zWall - 2, cp);
    const rdL = kdProject(x0 - 5, ym, zRidge, cp);
    const rdR = kdProject(x1 + 5, ym, zRidge, cp);

    if (cp.height > zWall) {
      c.fillStyle = '#1b2436';
      c.beginPath();
      c.moveTo(ebL[0], ebL[1]);
      c.lineTo(ebR[0], ebR[1]);
      c.lineTo(rdR[0], rdR[1]);
      c.lineTo(rdL[0], rdL[1]);
      c.closePath();
      c.fill();
    }

    c.fillStyle = '#253149';
    c.beginPath();
    c.moveTo(efL[0], efL[1]);
    c.lineTo(efR[0], efR[1]);
    c.lineTo(rdR[0], rdR[1]);
    c.lineTo(rdL[0], rdL[1]);
    c.closePath();
    c.fill();

    // Subtle moonlight ridge rim
    c.strokeStyle = 'rgba(138,166,216,0.34)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(rdL[0], rdL[1]);
    c.lineTo(rdR[0], rdR[1]);
    c.stroke();
  }

  function drawKetDuongStaticWorld(c, cp) {
    const hor = clamp(cp.syHorizon, 10, 260);

    // 1. Deep midnight sky above horizon
    const skyGr = c.createLinearGradient(0, 0, 0, hor + 12);
    skyGr.addColorStop(0, '#04060d');
    skyGr.addColorStop(0.55, '#0a1020');
    skyGr.addColorStop(1, '#16223a');
    c.fillStyle = skyGr;
    c.fillRect(-160, -80, W + 320, hor + 100);

    // Moon glow upper right
    const moonX = lerp(1240, 1270, cp.k);
    const moonY = Math.max(24, hor * 0.42);
    drawSprite(c, SP.moon, moonX, moonY, 150, 110, 0.55);
    c.fillStyle = 'rgba(226,238,255,0.68)';
    c.beginPath();
    c.arc(moonX, moonY, lerp(9, 15, cp.k), 0, Math.PI * 2);
    c.fill();

    // Stars in upper sky strip
    for (let i = 0; i < KD_STARS.length; i++) {
      const st = KD_STARS[i];
      if (st.y > hor - 6) continue;
      c.fillStyle = `rgba(220,232,255,${st.a})`;
      c.beginPath();
      c.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      c.fill();
    }

    // Distant silhouette horizon ridge
    c.fillStyle = '#0c1322';
    c.beginPath();
    c.moveTo(-160, hor + 8);
    c.quadraticCurveTo(220, hor - 14, 520, hor + 2);
    c.quadraticCurveTo(860, hor - 16, 1180, hor);
    c.quadraticCurveTo(1440, hor - 12, W + 160, hor + 5);
    c.lineTo(W + 160, H + 120);
    c.lineTo(-160, H + 120);
    c.closePath();
    c.fill();

    // 2. Ground terrain base gradient
    const gGr = c.createLinearGradient(0, hor, 0, H);
    gGr.addColorStop(0, '#0c1322');
    gGr.addColorStop(0.28, '#080d18');
    gGr.addColorStop(1, '#060810');
    c.fillStyle = gGr;
    c.fillRect(-160, hor, W + 320, H - hor + 120);

    // Atmospheric fog band near horizon
    const mistGr = c.createLinearGradient(0, hor - 10, 0, hor + 95);
    mistGr.addColorStop(0, 'rgba(32,48,78,0.34)');
    mistGr.addColorStop(1, 'rgba(12,18,32,0)');
    c.fillStyle = mistGr;
    c.fillRect(-160, hor - 10, W + 320, 105);

    // 3. Dark paddy fields & embankments
    for (let i = 0; i < KD_FIELDS.length; i++) {
      const f = KD_FIELDS[i];
      polyProj(c, f.pts, 0, cp);
      c.fillStyle = f.c;
      c.fill();
      c.strokeStyle = f.rim;
      c.lineWidth = 1;
      c.stroke();
    }

    // Still moonlight reflection in flooded field / stream patches
    for (let i = 0; i < KD_WATER.length; i++) {
      polyProj(c, KD_WATER[i], 0, cp);
      c.fillStyle = '#0f1b2e';
      c.fill();
      c.strokeStyle = 'rgba(116,154,212,0.16)';
      c.lineWidth = 1;
      c.stroke();
    }

    // Gentle winding countryside stream crossing under middle curve
    c.save();
    c.beginPath();
    const streamPts = [[-1300, -490], [-720, -455], [-215, -475], [260, -420], [820, -350]];
    for (let i = 0; i < streamPts.length; i++) {
      const p = kdProject(streamPts[i][0], streamPts[i][1], 0, cp);
      if (i === 0) c.moveTo(p[0], p[1]);
      else c.lineTo(p[0], p[1]);
    }
    c.strokeStyle = '#112036';
    c.lineWidth = lerp(7, 16, cp.k);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();
    c.strokeStyle = 'rgba(130,168,224,0.18)';
    c.lineWidth = 1.4;
    c.stroke();
    c.restore();

    // 4. Dinh paved courtyard stone floor (at P7 = 225,295 .. Dinh front)
    const yard = [[195, 252], [326, 252], [326, 326], [195, 326]];
    polyProj(c, yard, 0, cp);
    c.fillStyle = '#141a28';
    c.fill();
    c.strokeStyle = 'rgba(116,142,188,0.18)';
    c.lineWidth = 1;
    c.stroke();

    // 5. Long winding road ribbon
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < ROAD_SAMPLES.length; i += 2) {
      const rp = ROAD_SAMPLES[i];
      const p = kdProject(rp.x, rp.y, 0, cp);
      if (i === 0) c.moveTo(p[0], p[1]);
      else c.lineTo(p[0], p[1]);
    }
    const lastR = ROAD_SAMPLES[ROAD_SAMPLES.length - 1];
    const lpLast = kdProject(lastR.x, lastR.y, 0, cp);
    c.lineTo(lpLast[0], lpLast[1]);

    c.strokeStyle = '#090d16';
    c.lineWidth = lerp(12, 34, cp.k);
    c.stroke();

    c.strokeStyle = '#171f31';
    c.lineWidth = lerp(7, 22, cp.k);
    c.stroke();

    c.strokeStyle = 'rgba(118,142,186,0.16)';
    c.lineWidth = lerp(1.5, 4.5, cp.k);
    c.stroke();
    c.restore();

    // 6. Camp area (upper corner: barracks + courtyard + 1 lit window)
    polyProj(c, [[-1050, -1620], [-560, -1620], [-560, -1300], [-1050, -1300]], 0, cp);
    c.fillStyle = '#0e1523';
    c.fill();
    c.strokeStyle = 'rgba(72,96,134,0.28)';
    c.lineWidth = 1;
    c.stroke();

    // Left wing, back barrack, front barrack
    drawGableBarrack(c, cp, -1030, -1515, -960, -1345, 34, 48);
    drawGableBarrack(c, cp, -945, -1585, -625, -1510, 36, 54);
    drawGableBarrack(c, cp, -915, -1440, -585, -1370, 38, 56);

    // Subtle dark unlit window slots on front barrack + ONE bright warm window
    for (let w = 0; w < 5; w++) {
      const wx0 = -885 + w * 56;
      const wx1 = wx0 + 24;
      const lit = w === 3;
      const a0 = kdProject(wx0, -1370, 14, cp);
      const a1 = kdProject(wx1, -1370, 14, cp);
      const a2 = kdProject(wx1, -1370, 26, cp);
      const a3 = kdProject(wx0, -1370, 26, cp);
      c.fillStyle = lit ? '#ffd996' : '#0c111c';
      c.beginPath();
      c.moveTo(a0[0], a0[1]);
      c.lineTo(a1[0], a1[1]);
      c.lineTo(a2[0], a2[1]);
      c.lineTo(a3[0], a3[1]);
      c.closePath();
      c.fill();
    }

    // Camp gate posts at (-738, -1302) & (-702, -1302)
    drawBox3D(c, cp, -746, -1306, -736, -1296, 0, 24, '#242e42', '#1a2232', '#323f58', null);
    drawBox3D(c, cp, -704, -1306, -694, -1296, 0, 24, '#242e42', '#1a2232', '#323f58', null);

    // 7. Tree silhouettes (behind village & beside fields)
    for (let i = 0; i < KD_TREES.length; i++) {
      const tr = KD_TREES[i];
      const base = kdProject(tr.x, tr.y, 0, cp);
      const top = kdProject(tr.x, tr.y, tr.h, cp);
      const rx = tr.r * base[2];
      const ry = tr.h * 0.44 * base[2];
      c.fillStyle = '#070b14';
      c.fillRect(base[0] - Math.max(0.8, rx * 0.14), top[1] + ry * 0.5, Math.max(1.6, rx * 0.28), base[1] - top[1] - ry * 0.4);
      c.fillStyle = '#0c1322';
      c.beginPath();
      c.ellipse(top[0], top[1] + ry * 0.15, Math.max(2, rx), Math.max(2, ry), 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(84,112,158,0.16)';
      c.lineWidth = 0.9;
      c.stroke();
    }

    // 8. Curved-roof Dinh (small curved-roof village temple beside the pond)
    // Stone stepped base
    drawBox3D(c, cp, 234, 196, 324, 256, 0, 7, '#272c38', '#1d222c', '#303645', null);
    // Recessed facade & sanctuary shadow
    drawBox3D(c, cp, 242, 204, 316, 248, 7, 34, '#2a1a1a', '#1e1315', null, null);
    // Warm sanctuary doorway center
    const d0 = kdProject(268, 248, 7, cp);
    const d1 = kdProject(290, 248, 7, cp);
    const d2 = kdProject(290, 248, 28, cp);
    const d3 = kdProject(268, 248, 28, cp);
    c.fillStyle = '#331d14';
    c.beginPath();
    c.moveTo(d0[0], d0[1]);
    c.lineTo(d1[0], d1[1]);
    c.lineTo(d2[0], d2[1]);
    c.lineTo(d3[0], d3[1]);
    c.closePath();
    c.fill();

    // Red timber facade pillars
    const cols = [249, 265, 293, 309];
    c.strokeStyle = '#4e2724';
    c.lineWidth = lerp(1.4, 3.9, cp.k);
    for (let i = 0; i < cols.length; i++) {
      const cb = kdProject(cols[i], 249, 7, cp);
      const ct = kdProject(cols[i], 249, 34, cp);
      c.beginPath();
      c.moveTo(cb[0], cb[1]);
      c.lineTo(ct[0], ct[1]);
      c.stroke();
    }

    // Curved upturned eaves roof of Dinh
    const reL = kdProject(227, 256, 36, cp); // upturned left tip
    const reM = kdProject(279, 254, 32, cp); // sagging center eave
    const reR = kdProject(331, 256, 36, cp); // upturned right tip
    const rrL = kdProject(243, 224, 56, cp); // ridge left
    const rrR = kdProject(315, 224, 56, cp); // ridge right
    const rbL = kdProject(232, 194, 35, cp);
    const rbR = kdProject(326, 194, 35, cp);

    if (cp.height > 40) {
      c.fillStyle = '#20181f';
      c.beginPath();
      c.moveTo(rbL[0], rbL[1]);
      c.lineTo(rbR[0], rbR[1]);
      c.lineTo(rrR[0], rrR[1]);
      c.lineTo(rrL[0], rrL[1]);
      c.closePath();
      c.fill();
    }

    c.fillStyle = '#33242b';
    c.beginPath();
    c.moveTo(reL[0], reL[1]);
    c.quadraticCurveTo(reM[0], reM[1] + 2, reR[0], reR[1]);
    c.lineTo(rrR[0], rrR[1]);
    c.lineTo(rrL[0], rrL[1]);
    c.closePath();
    c.fill();

    // Ridge & curved eave moonlight highlight
    c.strokeStyle = 'rgba(182,196,228,0.34)';
    c.lineWidth = lerp(1.1, 2.2, cp.k);
    c.beginPath();
    c.moveTo(rrL[0], rrL[1]);
    c.lineTo(rrR[0], rrR[1]);
    c.stroke();
    c.strokeStyle = 'rgba(148,166,204,0.26)';
    c.lineWidth = lerp(0.9, 1.6, cp.k);
    c.beginPath();
    c.moveTo(reL[0], reL[1]);
    c.quadraticCurveTo(reM[0], reM[1] + 2, reR[0], reR[1]);
    c.stroke();

    // 8b. Small pond/lake immediately right of the Dinh (reflecting lights)
    const pondOuter = [
      [330, 190], [344, 178], [372, 178], [391, 192],
      [393, 226], [388, 258], [368, 272], [340, 270], [329, 242],
    ];
    polyProj(c, pondOuter, 0, cp);
    c.fillStyle = '#141c2b';
    c.fill();
    c.strokeStyle = 'rgba(92,120,166,0.24)';
    c.lineWidth = lerp(0.9, 1.8, cp.k);
    c.stroke();

    const pondPts = [
      [333, 194], [346, 183], [370, 183], [387, 196],
      [389, 226], [384, 254], [366, 267], [343, 265], [333, 240],
    ];
    const pTop = kdProject(361, 184, 0, cp);
    const pBot = kdProject(361, 267, 0, cp);
    const pondGr = c.createLinearGradient(0, pTop[1], 0, pBot[1]);
    pondGr.addColorStop(0, '#0a162b');
    pondGr.addColorStop(0.55, '#102442');
    pondGr.addColorStop(1, '#0c1b33');
    polyProj(c, pondPts, 0, cp);
    c.fillStyle = pondGr;
    c.fill();
    c.strokeStyle = 'rgba(136,174,232,0.3)';
    c.lineWidth = lerp(0.8, 1.5, cp.k);
    c.stroke();

    // Moonlit & warm gate-lantern ripple reflections across the pond surface
    for (let i = 0; i < 6; i++) {
      const f = i / 5;
      const ry = lerp(196, 256, f);
      const halfW = lerp(7.5, 4.5, f);
      const rL = kdProject(376 - halfW, ry, 0, cp);
      const rR = kdProject(376 + halfW, ry, 0, cp);
      c.strokeStyle = `rgba(255,198,108,${lerp(0.28, 0.44, f).toFixed(2)})`;
      c.lineWidth = lerp(0.8, 2.0, cp.k);
      c.beginPath();
      c.moveTo(rL[0], rL[1]);
      c.lineTo(rR[0], rR[1]);
      c.stroke();

      const mL = kdProject(352 - halfW * 0.7, ry + 3, 0, cp);
      const mR = kdProject(352 + halfW * 0.7, ry + 3, 0, cp);
      c.strokeStyle = `rgba(176,208,248,${lerp(0.18, 0.28, f).toFixed(2)})`;
      c.lineWidth = lerp(0.6, 1.4, cp.k);
      c.beginPath();
      c.moveTo(mL[0], mL[1]);
      c.lineTo(mR[0], mR[1]);
      c.stroke();
    }

    // Lakeside path connecting Dinh courtyard (x=326) to wide alley mouth (x=400)
    polyProj(c, [[324, 274], [404, 274], [404, 304], [324, 304]], 0, cp);
    c.fillStyle = '#131a29';
    c.fill();
    c.strokeStyle = 'rgba(98,124,168,0.18)';
    c.lineWidth = 1;
    c.stroke();

    // 9. Wide alley (Con ngõ rộng hơn) with welcome gate, circular brick well & tree canopies
    polyProj(c, [[400, 158], [456, 158], [456, 314], [400, 314]], 0, cp);
    c.fillStyle = '#0f1626';
    c.fill();
    c.strokeStyle = 'rgba(92,120,166,0.26)';
    c.lineWidth = lerp(0.9, 1.5, cp.k);
    c.stroke();
    // Subtle brighter center lane so widened alley depth reads clearly
    polyProj(c, [[410, 166], [446, 166], [446, 310], [410, 310]], 0, cp);
    c.fillStyle = '#151f33';
    c.fill();

    // Circular brick village well (left side at alley entrance, between lake and gate)
    const wx = 396;
    const wy = 272;
    const wrOut = 8.4;
    const wrIn = 5.3;
    const wh = 10.5;
    const wSegs = 16;
    c.fillStyle = '#312328';
    c.beginPath();
    for (let i = 0; i <= wSegs; i++) {
      const a = Math.PI * (i / wSegs); // front half 0..PI (+y faces camera)
      const pt = kdProject(wx + Math.cos(a) * wrOut, wy + Math.sin(a) * wrOut * 0.88, wh, cp);
      if (i === 0) c.moveTo(pt[0], pt[1]);
      else c.lineTo(pt[0], pt[1]);
    }
    for (let i = wSegs; i >= 0; i--) {
      const a = Math.PI * (i / wSegs);
      const pb = kdProject(wx + Math.cos(a) * wrOut, wy + Math.sin(a) * wrOut * 0.88, 0, cp);
      c.lineTo(pb[0], pb[1]);
    }
    c.closePath();
    c.fill();
    // Vertical brick joint strokes on front wall
    c.strokeStyle = 'rgba(20,14,18,0.55)';
    c.lineWidth = lerp(0.6, 1.1, cp.k);
    for (let i = 1; i < 6; i++) {
      const a = Math.PI * (i / 6);
      const bx = wx + Math.cos(a) * wrOut;
      const by = wy + Math.sin(a) * wrOut * 0.88;
      const pTopW = kdProject(bx, by, wh, cp);
      const pBotW = kdProject(bx, by, 0, cp);
      c.beginPath();
      c.moveTo(pTopW[0], pTopW[1]);
      c.lineTo(pBotW[0], pBotW[1]);
      c.stroke();
    }
    // Well coping rim & dark water interior
    c.beginPath();
    for (let i = 0; i < wSegs; i++) {
      const a = (Math.PI * 2 * i) / wSegs;
      const pt = kdProject(wx + Math.cos(a) * wrOut, wy + Math.sin(a) * wrOut * 0.88, wh, cp);
      if (i === 0) c.moveTo(pt[0], pt[1]);
      else c.lineTo(pt[0], pt[1]);
    }
    c.closePath();
    c.fillStyle = '#474f64';
    c.fill();
    c.strokeStyle = 'rgba(176,198,232,0.42)';
    c.lineWidth = lerp(0.7, 1.4, cp.k);
    c.stroke();

    c.beginPath();
    for (let i = 0; i < wSegs; i++) {
      const a = (Math.PI * 2 * i) / wSegs;
      const pt = kdProject(wx + Math.cos(a) * wrIn, wy + Math.sin(a) * wrIn * 0.88, wh - 0.5, cp);
      if (i === 0) c.moveTo(pt[0], pt[1]);
      else c.lineTo(pt[0], pt[1]);
    }
    c.closePath();
    c.fillStyle = '#060a14';
    c.fill();

    // Broad-canopy alley trees arching over the wide alley & behind gate
    const alleyTrees = [
      { cx: 396, cy: 234, z: 26, rx: 14, ry: 10, tx: 399, ty: 242 },
      { cx: 416, cy: 224, z: 41, rx: 18, ry: 12, tx: 403, ty: 230 },
      { cx: 440, cy: 204, z: 43, rx: 19, ry: 13, tx: 451, ty: 212 },
      { cx: 425, cy: 178, z: 39, rx: 22, ry: 13, tx: 405, ty: 186 },
    ];
    for (let i = 0; i < alleyTrees.length; i++) {
      const at = alleyTrees[i];
      const tb = kdProject(at.tx, at.ty, 0, cp);
      const tt = kdProject(at.cx, at.cy, at.z, cp);
      c.strokeStyle = '#121928';
      c.lineWidth = lerp(1.4, 3.6, cp.k);
      c.beginPath();
      c.moveTo(tb[0], tb[1]);
      c.lineTo(tt[0], tt[1]);
      c.stroke();

      const tc = kdProject(at.cx, at.cy, at.z + 7, cp);
      const rxP = at.rx * tc[2];
      const ryP = at.ry * 0.72 * tc[2];
      // Multi-puff organic foliage crown matching nocturnal painting style
      const puffs = [
        [0, 0, 1.0, 0.92],
        [-0.45, 0.14, 0.68, 0.72],
        [0.46, 0.10, 0.66, 0.70],
        [-0.18, -0.24, 0.72, 0.68],
      ];
      c.fillStyle = '#0c1822';
      for (let p = 0; p < puffs.length; p++) {
        const pf = puffs[p];
        c.beginPath();
        c.ellipse(tc[0] + pf[0] * rxP, tc[1] + pf[1] * ryP, rxP * pf[2], ryP * pf[3], 0, 0, Math.PI * 2);
        c.fill();
      }
      c.strokeStyle = 'rgba(124,164,206,0.16)';
      c.lineWidth = lerp(0.6, 1.1, cp.k);
      c.beginPath();
      c.ellipse(tc[0], tc[1] - ryP * 0.08, rxP * 0.96, ryP * 0.84, 0, Math.PI * 1.08, Math.PI * 1.92);
      c.stroke();
      // Subtle warm golden glow from alley light filtering through underside leaves
      c.fillStyle = 'rgba(218,154,74,0.18)';
      c.beginPath();
      c.ellipse(tc[0], tc[1] + ryP * 0.24, rxP * 0.68, ryP * 0.42, 0, 0, Math.PI * 2);
      c.fill();
    }

    // Steel-truss welcome gate spanning the wide alley entrance (blank sign, NO text)
    const gy0 = 260;
    const gxL0 = 401, gxL1 = 405;
    const gxR0 = 445, gxR1 = 449;
    const gH = 38;
    const gArchBot = 30;
    const gateCol = '#5a6e91';
    const gateDark = '#1d2738';
    const drawGatePost = (px0, px1) => {
      const b0 = kdProject(px0, gy0, 0, cp);
      const t0 = kdProject(px0, gy0, gH, cp);
      const b1 = kdProject(px1, gy0, 0, cp);
      const t1 = kdProject(px1, gy0, gH, cp);
      c.fillStyle = gateDark;
      c.beginPath();
      c.moveTo(b0[0], b0[1]);
      c.lineTo(b1[0], b1[1]);
      c.lineTo(t1[0], t1[1]);
      c.lineTo(t0[0], t0[1]);
      c.closePath();
      c.fill();
      c.strokeStyle = gateCol;
      c.lineWidth = lerp(0.8, 1.8, cp.k);
      c.beginPath();
      c.moveTo(b0[0], b0[1]); c.lineTo(t0[0], t0[1]);
      c.moveTo(b1[0], b1[1]); c.lineTo(t1[0], t1[1]);
      for (let z = 6; z <= gH - 4; z += 8) {
        const l0 = kdProject(px0, gy0, z, cp);
        const l1 = kdProject(px1, gy0, z + 5, cp);
        c.moveTo(l0[0], l0[1]); c.lineTo(l1[0], l1[1]);
      }
      c.stroke();
    };
    drawGatePost(gxL0, gxL1);
    drawGatePost(gxR0, gxR1);
    // Arched overhead truss + blank sign rectangle
    const archPtsTop = [[gxL0, gH], [413, gH + 2.5], [425, gH + 3.5], [437, gH + 2.5], [gxR1, gH]];
    const archPtsBot = [[gxL1, gArchBot], [414, gArchBot + 2], [425, gArchBot + 2.8], [436, gArchBot + 2], [gxR0, gArchBot]];
    c.beginPath();
    for (let i = 0; i < archPtsTop.length; i++) {
      const pt = kdProject(archPtsTop[i][0], gy0, archPtsTop[i][1], cp);
      if (i === 0) c.moveTo(pt[0], pt[1]); else c.lineTo(pt[0], pt[1]);
    }
    for (let i = archPtsBot.length - 1; i >= 0; i--) {
      const pt = kdProject(archPtsBot[i][0], gy0, archPtsBot[i][1], cp);
      c.lineTo(pt[0], pt[1]);
    }
    c.closePath();
    c.fillStyle = '#192233';
    c.fill();
    c.strokeStyle = '#6f84ab';
    c.lineWidth = lerp(0.9, 1.9, cp.k);
    c.stroke();
    // Blank signboard plate (strictly NO letters/text)
    const sb0 = kdProject(414, gy0 + 0.3, gArchBot + 2.2, cp);
    const sb1 = kdProject(436, gy0 + 0.3, gArchBot + 2.2, cp);
    const sb2 = kdProject(436, gy0 + 0.3, gH + 0.5, cp);
    const sb3 = kdProject(414, gy0 + 0.3, gH + 0.5, cp);
    c.fillStyle = '#253147';
    c.beginPath();
    c.moveTo(sb0[0], sb0[1]); c.lineTo(sb1[0], sb1[1]); c.lineTo(sb2[0], sb2[1]); c.lineTo(sb3[0], sb3[1]);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(164,188,224,0.45)';
    c.lineWidth = lerp(0.6, 1.2, cp.k);
    c.stroke();

    // 10. Multi-story building right beside the wide alley (one bright window)
    drawBox3D(
      c,
      cp,
      458,
      186,
      524,
      268,
      0,
      112,
      '#1e2534',
      '#151b28',
      '#273044',
      'rgba(138,164,210,0.28)'
    );
    // Rooftop staircase bulkhead
    drawBox3D(c, cp, 478, 198, 506, 224, 112, 126, '#232c3e', '#192030', '#2d374e', null);

    // Horizontal floor ledges & recessed dark windows across 5 floors
    for (let fl = 0; fl < 5; fl++) {
      const zBase = 14 + fl * 20;
      const zTop = zBase + 11;
      // Balcony / floor line
      const b0 = kdProject(458, 268.5, zBase - 2, cp);
      const b1 = kdProject(524, 268.5, zBase - 2, cp);
      c.strokeStyle = 'rgba(12,16,26,0.68)';
      c.lineWidth = lerp(0.9, 1.8, cp.k);
      c.beginPath();
      c.moveTo(b0[0], b0[1]);
      c.lineTo(b1[0], b1[1]);
      c.stroke();

      // Two dark windows per floor; ONLY 1 bright lit study window on floor 4 (fl=3, col=0)
      for (let col = 0; col < 2; col++) {
        const wx0 = 468 + col * 28;
        const wx1 = wx0 + 16;
        const isLit = fl === 3 && col === 0;
        const w0 = kdProject(wx0, 268.6, zBase, cp);
        const w1 = kdProject(wx1, 268.6, zBase, cp);
        const w2 = kdProject(wx1, 268.6, zTop, cp);
        const w3 = kdProject(wx0, 268.6, zTop, cp);
        c.fillStyle = isLit ? '#ffe6b4' : '#0b101b';
        c.beginPath();
        c.moveTo(w0[0], w0[1]);
        c.lineTo(w1[0], w1[1]);
        c.lineTo(w2[0], w2[1]);
        c.lineTo(w3[0], w3[1]);
        c.closePath();
        c.fill();
      }
    }

    // 11. All 100 lamp poles (base to head)
    for (let i = 0; i < LAMPS.length; i++) {
      const lm = LAMPS[i];
      const pb = kdProject(lm.lx, lm.ly, 0, cp);
      const ph = kdProject(lm.lx, lm.ly, lm.headZ, cp);
      c.strokeStyle = 'rgba(66,78,104,0.62)';
      c.lineWidth = clamp(1.1 * pb[2], 0.9, 2.8);
      c.beginPath();
      c.moveTo(pb[0], pb[1]);
      c.lineTo(ph[0], ph[1]);
      c.stroke();

      c.fillStyle = 'rgba(84,98,128,0.45)';
      c.beginPath();
      c.arc(ph[0], ph[1], clamp(1.5 * ph[2], 1.1, 3.8), 0, Math.PI * 2);
      c.fill();
    }
  }

  function drawKetDuong(c, now) {
    const cam = clamp(Number(KT.cam) || 0, 0, 1);
    const den = clamp(Number(KT.den) || 0, 0, 100);
    const cp = kdCamParams(cam);

    if (!kdGrainVigC || kdGrainVigC.width !== cv.width || kdGrainVigC.height !== cv.height) {
      bakeKdGrainVig();
    }
    if (
      !kdWorldC ||
      kdWorldC.width !== cv.width ||
      kdWorldC.height !== cv.height ||
      Math.abs(kdLastCam - cam) > 0.0004
    ) {
      kdLastCam = cam;
      kdWorldC = fitOffscreen(kdWorldC, (cx) => drawKetDuongStaticWorld(cx, cp));
    }

    drawBakedScreenLayer(c, kdWorldC);

    // Dynamic glowing elements with additive 'lighter' blending
    c.save();
    c.globalCompositeOperation = 'lighter';

    // Camp single glowing window halo + warm courtyard spill
    const cw = kdProject(-705, -1370, 20, cp);
    const cg = kdProject(-705, -1342, 0, cp);
    const campPulse = 0.94 + 0.06 * Math.sin(now * 0.0021);
    drawSprite(c, SP.warm, cw[0], cw[1], 18 * cw[2], 14 * cw[2], 0.72 * campPulse);
    drawSprite(c, SP.groundPool, cg[0], cg[1], 48 * cg[2], 18 * cg[2], 0.34 * campPulse);

    // Multi-story building single glowing window halo (next to wide alley)
    const bw = kdProject(476, 268.8, 79, cp);
    const bPulse = 0.95 + 0.05 * Math.sin(now * 0.0017 + 1.2);
    drawSprite(c, SP.warm, bw[0], bw[1], 24 * bw[2], 20 * bw[2], 0.85 * bPulse);
    drawSprite(c, SP.glow, bw[0], bw[1], 56 * bw[2], 46 * bw[2], 0.34 * bPulse);

    // Subtle warm glow inside Dinh doorway when camera approaches or last lamps light
    const dinhNear = clamp((den - 85) / 15, 0, 1) * 0.45 + cam * 0.28;
    if (dinhNear > 0.01) {
      const dd = kdProject(279, 250, 18, cp);
      const ds = kdProject(279, 272, 0, cp);
      drawSprite(c, SP.warm, dd[0], dd[1], 22 * dd[2], 17 * dd[2], 0.55 * dinhNear);
      drawSprite(c, SP.groundPool, ds[0], ds[1], 54 * ds[2], 21 * ds[2], 0.38 * dinhNear);
    }

    // Gate lanterns, warm alley canopy glow, and pond reflection shimmer
    const gL = kdProject(408, 261, 28, cp);
    const gR = kdProject(442, 261, 28, cp);
    const pondR = kdProject(376, 232, 0, cp);
    const pondM = kdProject(354, 212, 0, cp);
    const alTree = kdProject(428, 212, 14, cp);
    const al = kdProject(428, 285, 0, cp);
    const gPulse = 0.94 + 0.06 * Math.sin(now * 0.002 + 0.5);
    drawSprite(c, SP.warm, gL[0], gL[1], 12 * gL[2], 11 * gL[2], 0.62 * gPulse);
    drawSprite(c, SP.warm, gR[0], gR[1], 12 * gR[2], 11 * gR[2], 0.62 * gPulse);
    drawSprite(c, SP.warm, pondR[0], pondR[1], 18 * pondR[2], 32 * pondR[2], (0.28 + cam * 0.16) * gPulse);
    drawSprite(c, SP.cool, pondM[0], pondM[1], 24 * pondM[2], 22 * pondM[2], 0.18 + cam * 0.08);
    drawSprite(c, SP.warm, alTree[0], alTree[1], 24 * alTree[2], 18 * alTree[2], 0.28 + cam * 0.14);
    drawSprite(c, SP.groundPool, al[0], al[1], 44 * al[2], 18 * al[2], 0.24 + cam * 0.14);

    // All lit lamps among the 100 along the road (sequentially from 1 at camp to 100 at dinh)
    const litCount = Math.min(100, Math.ceil(den));
    for (let i = 0; i < litCount; i++) {
      const p = clamp(den - i, 0, 1);
      if (p <= 0.001) continue;

      const lm = LAMPS[i];
      const pb = kdProject(lm.lx, lm.ly, 0, cp);
      const ph = kdProject(lm.lx, lm.ly, lm.headZ, cp);
      const pr = kdProject(lm.rx, lm.ry, 0, cp);

      const ignite = clamp(p / 0.16, 0, 1);
      const flare = p < 0.99 ? Math.sin(clamp((p - 0.02) / 0.92, 0, 1) * Math.PI) : 0;
      const breath = 0.94 + 0.06 * Math.sin(now * 0.0023 + i * 0.87);

      const headR = clamp((10 + 18 * flare) * ph[2], 4.2, 54);
      const poolRx = clamp((24 + 20 * flare) * pr[2], 7.5, 92);
      const poolRy = clamp((10 + 8 * flare) * pr[2], 3.2, 34);

      // Ground warm pool cast onto road surface
      drawSprite(c, SP.groundPool, pr[0], pr[1], poolRx, poolRy, (0.48 + 0.34 * flare) * ignite * breath);
      drawSprite(c, SP.warm, pb[0], pb[1], poolRx * 0.45, poolRy * 0.42, (0.28 + 0.26 * flare) * ignite);

      // Lamp head warm halo + ignition flare
      drawSprite(c, SP.glow, ph[0], ph[1], headR * 2.1, headR * 2.1, (0.34 + 0.44 * flare) * ignite * breath);
      drawSprite(
        c,
        flare > 0.1 ? SP.flare : SP.warm,
        ph[0],
        ph[1],
        headR,
        headR,
        (0.82 + 0.18 * flare) * ignite
      );

      // Crisp warm filament dot at center
      c.fillStyle = `rgba(255,248,224,${clamp((0.75 + 0.25 * flare) * ignite, 0, 1)})`;
      c.beginPath();
      c.arc(ph[0], ph[1], clamp((1.9 + 1.8 * flare) * ph[2], 1.4, 5.2), 0, Math.PI * 2);
      c.fill();
    }

    c.restore();

    // Film grain + dark edge vignette (preserves core.js transition globalAlpha)
    drawBakedScreenLayer(c, kdGrainVigC);
  }

  // ===========================================================================
  // SCENE 2: SC.ketdinh — Sân đình cận bàn đá + ghế đá dưới đèn lồng
  // ===========================================================================
  // Transform placing dinh-trong.svg (1600x900) slightly zoomed & framed right
  // so roof crest + sky stay clear (for fireflies & card x450..1150 y120..600)
  // while foreground courtyard, stone table, bench & right path fill safely.
  const KD_SCALE = 1.1;
  const KD_DX = -245;
  const KD_DY = -58;

  const dinX = (svgX4) => KD_DX + svgX4 * KD_SCALE;
  const dinY = (svgY4) => KD_DY + svgY4 * KD_SCALE;

  // Stone bench ("chiếc ghế đá") & right lantern focal coordinates
  // Bench sits beside SVG stone table (table center x=1189, span 1088..1291) without overlapping it
  const BENCH_CX = 985;
  const BENCH_Y = 718;
  const LANTERN_MAIN = [dinX(1168), dinY(345.6)];
  const LANTERN_LEFT = [dinX(432), dinY(345.6)];
  const LANTERN_CENTER = [dinX(800), dinY(382)];
  const INCENSE_POS = [dinX(800), dinY(752)];
  const EMBER_PTS = [
    [dinX(780), dinY(700)],
    [dinX(800), dinY(692)],
    [dinX(820), dinY(704)],
  ];

  let ketDinhDimC = null;
  let ketDinhWarmC = null;
  let kdImgBaked = false;

  function drawStoneBench(c, warmLevel) {
    // Ground shadow directly under stone bench
    c.save();
    c.fillStyle = warmLevel > 0.5 ? 'rgba(6,7,14,0.48)' : 'rgba(4,6,12,0.58)';
    c.beginPath();
    c.ellipse(BENCH_CX, BENCH_Y + 56, 92, 15, 0, 0, Math.PI * 2);
    c.fill();

    // Two carved stone legs
    const legs = [BENCH_CX - 54, BENCH_CX + 36];
    for (let i = 0; i < legs.length; i++) {
      const lx = legs[i];
      c.fillStyle = warmLevel > 0.5 ? '#5b5248' : '#3a383a';
      c.fillRect(lx, BENCH_Y + 12, 18, 42);
      c.fillStyle = warmLevel > 0.5 ? '#796d5e' : '#4a4748';
      c.fillRect(lx, BENCH_Y + 12, 6, 42);
    }

    // Bench stone slab seat + curved side edge (x: 905..1065, safely clear of table 1088..)
    const x0 = BENCH_CX - 80;
    const x1 = BENCH_CX + 80;
    const w = x1 - x0;

    // Thick edge lip under seat
    c.fillStyle = warmLevel > 0.5 ? '#4c443c' : '#2f2d31';
    roundRect(c, x0, BENCH_Y + 4, w, 14, 5);
    c.fill();

    // Top stone slab surface
    const slabGr = c.createLinearGradient(x0, BENCH_Y - 12, x1, BENCH_Y + 14);
    if (warmLevel > 0.5) {
      slabGr.addColorStop(0, '#857766');
      slabGr.addColorStop(0.5, '#9d8c77');
      slabGr.addColorStop(1, '#736657');
    } else {
      slabGr.addColorStop(0, '#4f4e54');
      slabGr.addColorStop(0.5, '#605e64');
      slabGr.addColorStop(1, '#444349');
    }
    c.fillStyle = slabGr;
    roundRect(c, x0 - 2, BENCH_Y - 8, w + 4, 18, 7);
    c.fill();

    // Subtle stone upper rim highlight catching lantern above
    c.strokeStyle =
      warmLevel > 0.5 ? 'rgba(255,214,152,0.44)' : 'rgba(176,196,232,0.22)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x0 + 8, BENCH_Y - 7);
    c.lineTo(x1 - 8, BENCH_Y - 7);
    c.stroke();

    c.restore();
  }

  function paintCourtyardStoneCover(c) {
    // Cover SVG left stool (dinX(1176), dinY(754..816)) softly with courtyard stone tone
    const sx = dinX(1176);
    const sy = dinY(786);
    const stGr = c.createRadialGradient(sx, sy, 6, sx, sy, 52);
    stGr.addColorStop(0, '#232c3d');
    stGr.addColorStop(0.65, '#1d2435');
    stGr.addColorStop(1, 'rgba(27,34,50,0)');
    c.fillStyle = stGr;
    c.beginPath();
    c.ellipse(sx, sy, 48, 52, 0, 0, Math.PI * 2);
    c.fill();
  }

  function drawRoofTileHighlights(c, alpha) {
    c.save();
    c.globalCompositeOperation = 'lighter';

    // Warm bounce along eaves & underside of curved roof
    const eaveGr = c.createRadialGradient(dinX(820), dinY(305), 30, dinX(820), dinY(280), 520);
    eaveGr.addColorStop(0, `rgba(255,190,108,${0.26 * alpha})`);
    eaveGr.addColorStop(0.55, `rgba(232,142,62,${0.12 * alpha})`);
    eaveGr.addColorStop(1, 'rgba(232,142,62,0)');
    c.fillStyle = eaveGr;
    c.fillRect(dinX(160), dinY(110), 1240, 260);

    // Subtle roof-tile rib catches along curved slope above lanterns
    c.strokeStyle = `rgba(255,208,136,${0.24 * alpha})`;
    c.lineWidth = 1.6;
    for (let i = 0; i < 16; i++) {
      const rx0 = dinX(465 + i * 44);
      const rx1 = dinX(410 + i * 52);
      c.beginPath();
      c.moveTo(rx0, dinY(134));
      c.quadraticCurveTo((rx0 + rx1) * 0.5, dinY(196), rx1, dinY(252));
      c.stroke();
    }

    c.restore();
  }

  function drawLanternAccent(c, lx, ly, warmLevel) {
    c.save();
    const bodyGr = c.createRadialGradient(lx, ly - 2, 2, lx, ly, 24);
    if (warmLevel > 0.5) {
      bodyGr.addColorStop(0, 'rgba(255,246,216,0.92)');
      bodyGr.addColorStop(0.52, 'rgba(244,158,76,0.72)');
      bodyGr.addColorStop(1, 'rgba(176,72,36,0)');
    } else {
      bodyGr.addColorStop(0, 'rgba(255,194,126,0.34)');
      bodyGr.addColorStop(0.6, 'rgba(156,74,42,0.22)');
      bodyGr.addColorStop(1, 'rgba(84,36,28,0)');
    }
    c.fillStyle = bodyGr;
    c.beginPath();
    c.ellipse(lx, ly, 20, 24, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawKetDinhBase(cx, warmLevel) {
    // Continuous night sky behind/around shifted SVG
    const sky = cx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050812');
    sky.addColorStop(0.55, '#0b1222');
    sky.addColorStop(1, '#101828');
    cx.fillStyle = sky;
    cx.fillRect(-120, -80, W + 240, H + 160);

    if (isImgReady(imgTrong)) {
      cx.drawImage(imgTrong, KD_DX, KD_DY, W * KD_SCALE, H * KD_SCALE);
    }

    paintCourtyardStoneCover(cx);

    if (warmLevel < 0.5) {
      // Dim quiet midnight state: tone down SVG orange door/steps spill & cool courtyard
      const sx0 = dinX(676);
      const sy0 = dinY(344);
      const wGr = cx.createLinearGradient(sx0, sy0, sx0, sy0 + 240 * KD_SCALE);
      wGr.addColorStop(0, 'rgba(6,8,16,0.72)');
      wGr.addColorStop(1, 'rgba(6,8,16,0.88)');
      cx.fillStyle = wGr;
      cx.fillRect(sx0, sy0, 248 * KD_SCALE, 236 * KD_SCALE);

      const stX = dinX(600);
      const stY = dinY(578);
      const sGr = cx.createLinearGradient(stX, stY, stX, stY + 120 * KD_SCALE);
      sGr.addColorStop(0, 'rgba(10,14,26,0.76)');
      sGr.addColorStop(1, 'rgba(10,14,26,0.18)');
      cx.fillStyle = sGr;
      cx.fillRect(stX, stY, 400 * KD_SCALE, 118 * KD_SCALE);

      cx.fillStyle = 'rgba(4,7,16,0.34)';
      cx.fillRect(-120, -80, W + 240, H + 160);
    } else {
      // Warm glowing courtyard state: warm doorway bounce, stone steps, incense bowl & roof tiles
      drawRoofTileHighlights(cx, 0.9);

      cx.save();
      cx.globalCompositeOperation = 'lighter';
      drawSprite(cx, SP.glow, dinX(800), dinY(490), 220, 175, 0.44);
      drawSprite(cx, SP.groundPool, dinX(800), dinY(670), 240, 75, 0.34);
      // Incense burner bowl warmth & right stone table/bench golden spill
      drawSprite(cx, SP.glow, INCENSE_POS[0], INCENSE_POS[1] - 12, 130, 88, 0.36);
      drawSprite(cx, SP.groundPool, (BENCH_CX + dinX(1304)) * 0.5, BENCH_Y + 34, 240, 82, 0.46);
      cx.restore();
    }

    // Shared curved stone bench beside stone table + enhanced SVG lantern warmth
    drawStoneBench(cx, warmLevel);
    drawLanternAccent(cx, LANTERN_MAIN[0], LANTERN_MAIN[1], warmLevel);
    drawLanternAccent(cx, LANTERN_LEFT[0], LANTERN_LEFT[1], warmLevel);

    // Center hanging lantern beneath plaque (mirrors p-dinh.js courtyard lantern)
    cx.save();
    cx.strokeStyle = warmLevel > 0.5 ? '#2d1c16' : '#181b28';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(LANTERN_CENTER[0], dinY(340));
    cx.lineTo(LANTERN_CENTER[0], LANTERN_CENTER[1] - 20);
    cx.stroke();
    cx.fillStyle = warmLevel > 0.5 ? '#3a2219' : '#221f28';
    roundRect(cx, LANTERN_CENTER[0] - 12, LANTERN_CENTER[1] - 21, 24, 5, 2);
    cx.fill();
    roundRect(cx, LANTERN_CENTER[0] - 10, LANTERN_CENTER[1] + 19, 20, 4, 2);
    cx.fill();
    cx.restore();
    drawLanternAccent(cx, LANTERN_CENTER[0], LANTERN_CENTER[1], warmLevel);

    kgrain(cx, 1250, 0.02);
    vignette(cx, warmLevel > 0.5 ? 0.56 : 0.72);
  }

  function bakeKetDinh() {
    if (!cv || !cv.width || !cv.height) return;
    kdImgBaked = isImgReady(imgTrong);
    ketDinhDimC = fitOffscreen(ketDinhDimC, (cx) => drawKetDinhBase(cx, 0));
    ketDinhWarmC = fitOffscreen(ketDinhWarmC, (cx) => drawKetDinhBase(cx, 1));
  }

  const onSvgLoad = () => {
    if (cv && cv.width && cv.height) bakeKetDinh();
  };
  imgTrong.onload = onSvgLoad;
  imgTrong.src = BASE_DIR + 'dinh-trong.svg';

  // Two soft dark human silhouettes (no faces, no details)
  function drawPersonPass(c, st, col, expand) {
    c.fillStyle = col;
    c.strokeStyle = col;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    const r = st.scale;
    const headR = (10.5 * r) + expand;
    const neckY = st.shY - 2 * r;
    const headX = st.headX;
    const headY = st.headY;

    // Legs (walking stride blends cleanly into seated bent knees)
    c.lineWidth = 9.5 * r + expand * 1.4;
    // Back/far leg
    c.beginPath();
    c.moveTo(st.hipX - st.dir * 3 * r, st.hipY);
    c.quadraticCurveTo(st.kneeBX, st.kneeBY, st.footBX, st.footBY);
    c.stroke();

    // Front/near leg
    c.beginPath();
    c.moveTo(st.hipX + st.dir * 3 * r, st.hipY);
    c.quadraticCurveTo(st.kneeFX, st.kneeFY, st.footFX, st.footFY);
    c.stroke();

    // Soft torso
    c.beginPath();
    c.moveTo(st.shX - 13 * r - expand, st.shY + 4 * r);
    c.quadraticCurveTo(st.shX, st.shY - 6 * r - expand, st.shX + 13 * r + expand, st.shY + 4 * r);
    c.lineTo(st.hipX + 11.5 * r + expand, st.hipY + 6 * r + expand);
    c.quadraticCurveTo(st.hipX, st.hipY + 11 * r + expand, st.hipX - 11.5 * r - expand, st.hipY + 6 * r + expand);
    c.closePath();
    c.fill();

    // Soft relaxed arm swing / resting lap silhouette
    c.lineWidth = 7.2 * r + expand * 1.2;
    c.beginPath();
    c.moveTo(st.shX + st.dir * 8 * r, st.shY + 5 * r);
    c.quadraticCurveTo(st.armMidX, st.armMidY, st.handX, st.handY);
    c.stroke();

    // Neck transition
    c.lineWidth = 7.5 * r + expand;
    c.beginPath();
    c.moveTo(st.shX, neckY + 3 * r);
    c.lineTo(headX * 0.45 + st.shX * 0.55, headY + 4 * r);
    c.stroke();

    // Soft faceless head ellipse
    c.beginPath();
    c.ellipse(headX, headY, headR * 0.88, headR * 1.04, st.tilt * 0.7, 0, Math.PI * 2);
    c.fill();
  }

  function computeSilhouettePose(bong, isRight, now) {
    const fadeIn = clamp(bong / 0.08, 0, 1);
    const dir = isRight ? -1 : 1; // +1 walks rightward, -1 walks leftward
    const startX = isRight ? 1515 : 275;
    const startY = isRight ? 748 : 756;
    const preSeatX = isRight ? BENCH_CX + 38 : BENCH_CX - 38;
    const seatX = isRight ? BENCH_CX + 23 : BENCH_CX - 23;
    const standGroundY = 762;

    const walkEnd = isRight ? 0.58 : 0.55;
    const walkK = smooth01(clamp(bong / walkEnd, 0, 1));
    const sitK = smooth01(clamp((bong - walkEnd) / (0.75 - walkEnd), 0, 1));
    const leanK = smooth01(clamp((bong - 0.75) / 0.25, 0, 1));

    const scale = isRight ? 0.97 : 1.04;
    const x = lerp(lerp(startX, preSeatX, walkK), seatX, sitK);
    // Curve gently forward along courtyard so right figure passes cleanly in front of stone table
    const midArc = Math.sin(walkK * Math.PI) * (isRight ? 26 : 10);
    const groundY = lerp(startY, standGroundY, walkK) + midArc * (1 - sitK);

    // Walk amplitude diminishes cleanly to 0 upon reaching bench
    const walkDist = Math.abs(x - startX);
    const strideAmp = (1 - sitK) * smooth01(clamp(bong / 0.06, 0, 1)) * smooth01(clamp((walkEnd - bong) / 0.08, 0, 1));
    const phase = walkDist * 0.075;
    const stepSin = Math.sin(phase) * strideAmp;
    const bob = Math.abs(Math.cos(phase)) * 2.4 * strideAmp;

    // Subtle calm breathing when seated together
    const sitBreath = sitK * Math.sin(now * 0.0018 + (isRight ? 1.1 : 0)) * 0.9;

    // Hip & shoulder vertical positions transitioning from standing walk to sitting on BENCH_Y
    const hipY = lerp(groundY - 46 * scale - bob, BENCH_Y - 1 * scale + sitBreath * 0.4, sitK);
    const torsoH = 38 * scale;
    // Lean inward cleanly during bong 0.75..1
    const leanDir = isRight ? -1 : 1;
    const tilt = leanDir * (isRight ? 0.17 : 0.12) * leanK;

    const hipX = x;
    const shX = hipX + Math.sin(tilt) * torsoH;
    const shY = hipY - Math.cos(tilt) * torsoH + sitBreath;

    const headOffset = 15 * scale;
    const headTilt = tilt * 1.18 + leanDir * 0.04 * leanK;
    const headX = shX + Math.sin(headTilt) * headOffset;
    const headY = shY - Math.cos(headTilt) * headOffset;

    // Leg endpoints: stride when walking -> seated forward knees/shins resting near ground
    const stride = stepSin * 14 * scale;
    const liftF = Math.max(0, -stepSin) * 5 * scale;
    const liftB = Math.max(0, stepSin) * 5 * scale;

    const walkFootFX = hipX + stride + dir * 3 * scale;
    const walkFootFY = groundY - liftF;
    const walkKneeFX = (hipX + walkFootFX) * 0.5 + dir * 2 * scale;
    const walkKneeFY = (hipY + walkFootFY) * 0.5;

    const walkFootBX = hipX - stride - dir * 3 * scale;
    const walkFootBY = groundY - liftB;
    const walkKneeBX = (hipX + walkFootBX) * 0.5 - dir * 1 * scale;
    const walkKneeBY = (hipY + walkFootBY) * 0.5;

    const sitKneeSpread = isRight ? 4 : -4;
    const sitKneeY = BENCH_Y + 8 * scale;
    const sitFootY = standGroundY + 9 * scale;

    const kneeFX = lerp(walkKneeFX, hipX + sitKneeSpread + 5 * scale, sitK);
    const kneeFY = lerp(walkKneeFY, sitKneeY, sitK);
    const footFX = lerp(walkFootFX, hipX + sitKneeSpread + 4 * scale, sitK);
    const footFY = lerp(walkFootFY, sitFootY, sitK);

    const kneeBX = lerp(walkKneeBX, hipX + sitKneeSpread - 5 * scale, sitK);
    const kneeBY = lerp(walkKneeBY, sitKneeY + 1, sitK);
    const footBX = lerp(walkFootBX, hipX + sitKneeSpread - 6 * scale, sitK);
    const footBY = lerp(walkFootBY, sitFootY, sitK);

    // Arm: gentle swing walking -> softly resting forward/together on lap & bench
    const walkHandX = hipX - stepSin * 12 * scale + dir * 4 * scale;
    const walkHandY = hipY + 2 * scale;
    const sitHandX = hipX + leanDir * (5 + 6 * leanK) * scale;
    const sitHandY = BENCH_Y - 3 * scale;

    return {
      fadeIn,
      scale,
      dir,
      x,
      groundY,
      sitK,
      leanK,
      tilt,
      hipX,
      hipY,
      shX,
      shY,
      headX,
      headY,
      kneeFX,
      kneeFY,
      footFX,
      footFY,
      kneeBX,
      kneeBY,
      footBX,
      footBY,
      armMidX: lerp(shX + dir * 4 * scale, (shX + sitHandX) * 0.5, sitK),
      armMidY: lerp((shY + walkHandY) * 0.5, (shY + sitHandY) * 0.5 + 3, sitK),
      handX: lerp(walkHandX, sitHandX, sitK),
      handY: lerp(walkHandY, sitHandY, sitK),
    };
  }

  function drawSilhouettes(c, bong, sang, now) {
    if (bong <= 0.002) return;
    const pLeft = computeSilhouettePose(bong, false, now);
    const pRight = computeSilhouettePose(bong, true, now);
    const list = [pLeft, pRight];

    // 1. Cast ground shadows onto courtyard away from LANTERN_MAIN
    c.save();
    const shadowBaseA = c.globalAlpha;
    for (let i = 0; i < list.length; i++) {
      const st = list[i];
      if (st.fadeIn <= 0.002) continue;
      const dxL = st.x - LANTERN_MAIN[0];
      const shOffX = clamp(dxL * 0.14, -78, 78) * (1 - 0.65 * st.sitK);
      const sx = st.x + shOffX;
      const sy = lerp(st.groundY + 2, BENCH_Y + 52, st.sitK);
      const rx = lerp(24, 28, Math.abs(shOffX) / 78) * st.scale;
      const ry = lerp(9, 12, st.sitK) * st.scale;

      c.globalAlpha = shadowBaseA * st.fadeIn * (0.28 + 0.14 * sang);
      c.fillStyle = 'rgba(3,5,11,0.72)';
      c.beginPath();
      c.ellipse(sx, sy, rx * 1.45, ry * 1.35, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(2,4,9,0.85)';
      c.beginPath();
      c.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // 2. Soft dark feathered silhouette forms (no face, no detail, zero shadowBlur)
    for (let i = 0; i < list.length; i++) {
      const st = list[i];
      if (st.fadeIn <= 0.002) continue;
      c.save();
      c.globalAlpha *= st.fadeIn;
      drawPersonPass(c, st, 'rgba(6,8,15,0.20)', 5.2);
      drawPersonPass(c, st, 'rgba(8,11,20,0.40)', 2.4);
      drawPersonPass(c, st, 'rgba(11,15,26,0.76)', 0);

      // Subtle warm top-edge lantern rim along crown/shoulders facing overhead lantern
      const rimA = 0.09 + 0.16 * sang;
      c.strokeStyle = `rgba(255,212,148,${rimA})`;
      c.lineWidth = 1.15;
      c.beginPath();
      c.arc(st.headX, st.headY, 10.2 * st.scale, Math.PI * 1.12, Math.PI * 1.88);
      c.stroke();
      c.restore();
    }
  }

  // Courtyard fireflies rising into sky around card region x 450..1150, y 120..600
  const KD_FIREFLIES = [];
  (function initFireflies() {
    for (let i = 0; i < 68; i++) {
      const startX = 160 + krnd() * 1280;
      const startY = 635 + krnd() * 150;
      let tx;
      let ty;

      // Arrange destination softly in the upper sky above the Dinh roof & framing card rim
      const band = i % 5;
      if (band < 2) {
        // Upper sky arc above roof & top card margin (x 380..1220, y 40..164)
        tx = 385 + krnd() * 830;
        ty = 40 + krnd() * 124;
      } else if (band === 2) {
        // Left flank of card (x 375..495, y 145..575)
        tx = 375 + krnd() * 125;
        ty = 145 + krnd() * 430;
      } else if (band === 3) {
        // Right flank of card (x 1105..1235, y 145..575)
        tx = 1105 + krnd() * 130;
        ty = 145 + krnd() * 430;
      } else {
        // Lower fringe & few gentle edge drifters (y 535..635, plus light scatter above eaves)
        tx = 430 + krnd() * 740;
        ty = krnd() > 0.45 ? 540 + krnd() * 92 : 165 + krnd() * 90;
      }

      KD_FIREFLIES.push({
        sx: startX,
        sy: startY,
        tx,
        ty,
        thr: (i / 68) * 0.55,
        r: 1.4 + krnd() * 1.8,
        glowR: 13 + krnd() * 16,
        spdX: 0.0007 + krnd() * 0.0009,
        spdY: 0.0008 + krnd() * 0.001,
        ampX: 10 + krnd() * 20,
        ampY: 7 + krnd() * 15,
        ph: krnd() * 6.28,
        blinkSpd: 0.002 + krnd() * 0.0028,
      });
    }
  })();

  function drawKetDinhFireflies(c, dom, now) {
    if (dom <= 0.002) return;
    c.save();
    c.globalCompositeOperation = 'lighter';

    for (let i = 0; i < KD_FIREFLIES.length; i++) {
      const f = KD_FIREFLIES[i];
      const localK = clamp((dom - f.thr) / (1 - f.thr), 0, 1);
      if (localK <= 0.002) continue;

      const fade = smooth01(clamp(localK / 0.25, 0, 1));
      const rise = smooth01(clamp((localK - 0.1) / 0.85, 0, 1));

      const px =
        lerp(f.sx, f.tx, rise) +
        Math.sin(now * f.spdX + f.ph) * f.ampX * (0.45 + 0.55 * rise);
      const py =
        lerp(f.sy, f.ty, rise) +
        Math.cos(now * f.spdY + f.ph * 1.3) * f.ampY * (0.45 + 0.55 * rise);

      const blink = 0.38 + 0.62 * (0.5 + 0.5 * Math.sin(now * f.blinkSpd + f.ph));
      const a = fade * blink;

      drawSprite(c, SP.ff, px, py, f.glowR, f.glowR, a * 0.82);
      c.fillStyle = `rgba(255,252,216,${clamp(a * 0.95, 0, 1)})`;
      c.beginPath();
      c.arc(px, py, f.r, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  function drawKetDinhDynamics(c, sang, now) {
    const breath1 = 0.93 + 0.07 * Math.sin(now * 0.0021);
    const breath2 = 0.93 + 0.07 * Math.sin(now * 0.0025 + 1.4);
    const breath3 = 0.93 + 0.07 * Math.sin(now * 0.0019 + 2.7);

    // Subtle rising incense smoke wisps from the burner (lư hương)
    c.save();
    for (let s = 0; s < 3; s++) {
      const ex = EMBER_PTS[s][0];
      const ey = EMBER_PTS[s][1];
      c.strokeStyle = `rgba(196,210,235,${0.08 + 0.1 * sang})`;
      c.lineWidth = 1.6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(ex, ey - 2);
      for (let step = 1; step <= 6; step++) {
        const yy = ey - 2 - step * 11;
        const xx = ex + Math.sin(now * 0.0014 + step * 0.75 + s * 1.9) * (3 + step * 1.4);
        c.lineTo(xx, yy);
      }
      c.stroke();
    }
    c.restore();

    // Warm bronze lip catch on incense burner bowl when KT.sang grows
    if (sang > 0.02) {
      c.save();
      c.strokeStyle = `rgba(255,204,132,${0.38 * sang})`;
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(INCENSE_POS[0], dinY(742), 54, 9, 0, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
      c.restore();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';

    // Three courtyard hanging lanterns glowing warmer with KT.sang
    const mainGlow = (0.38 + 0.62 * sang) * breath1;
    drawSprite(c, SP.warm, LANTERN_MAIN[0], LANTERN_MAIN[1], 44 + 34 * sang, 46 + 34 * sang, mainGlow * 0.92);
    drawSprite(c, SP.glow, LANTERN_MAIN[0], LANTERN_MAIN[1], 145 + 115 * sang, 145 + 115 * sang, (0.28 + 0.56 * sang) * breath1);
    drawSprite(c, SP.groundPool, BENCH_CX, BENCH_Y + 42, 130 + 120 * sang, 34 + 28 * sang, (0.22 + 0.50 * sang) * breath1);

    const sideGlow = (0.24 + 0.66 * sang) * breath2;
    drawSprite(c, SP.warm, LANTERN_LEFT[0], LANTERN_LEFT[1], 24 + 26 * sang, 26 + 26 * sang, sideGlow * 0.85);
    drawSprite(c, SP.glow, LANTERN_LEFT[0], LANTERN_LEFT[1], 74 + 80 * sang, 74 + 80 * sang, sideGlow * 0.42);

    const ctrGlow = (0.24 + 0.68 * sang) * breath3;
    drawSprite(c, SP.warm, LANTERN_CENTER[0], LANTERN_CENTER[1], 28 + 30 * sang, 30 + 30 * sang, ctrGlow * 0.88);
    drawSprite(c, SP.glow, LANTERN_CENTER[0], LANTERN_CENTER[1], 88 + 92 * sang, 88 + 92 * sang, ctrGlow * 0.44);

    // Three glowing incense stick embers (brighten gently with KT.sang)
    for (let i = 0; i < EMBER_PTS.length; i++) {
      const ep = EMBER_PTS[i];
      const flick = 0.72 + 0.28 * Math.sin(now * 0.006 + i * 2.1);
      const ea = (0.45 + 0.55 * sang) * flick;
      drawSprite(c, SP.warm, ep[0], ep[1], 7 + 7 * sang, 7 + 7 * sang, ea * 0.9);
      c.fillStyle = `rgba(255,224,160,${clamp(ea, 0, 1)})`;
      c.beginPath();
      c.arc(ep[0], ep[1], 1.7 + 0.8 * sang, 0, Math.PI * 2);
      c.fill();
    }

    // Extra subtle roof-tile shimmer as KT.sang approaches 1
    if (sang > 0.1) {
      const tilePulse = (0.92 + 0.08 * Math.sin(now * 0.0016)) * sang;
      drawSprite(c, SP.glow, dinX(560), dinY(275), 175, 58, 0.16 * tilePulse);
      drawSprite(c, SP.glow, dinX(1040), dinY(275), 185, 62, 0.20 * tilePulse);
    }

    c.restore();
  }

  function drawKetDinh(c, now) {
    const bong = clamp(Number(KT.bong) || 0, 0, 1);
    const dom = clamp(Number(KT.dom) || 0, 0, 1);
    const sang = clamp(Number(KT.sang) || 0, 0, 1);

    if (
      !ketDinhDimC ||
      !ketDinhWarmC ||
      (!kdImgBaked && isImgReady(imgTrong)) ||
      ketDinhDimC.width !== cv.width ||
      ketDinhDimC.height !== cv.height
    ) {
      bakeKetDinh();
    }

    const baseAlpha = c.globalAlpha;

    // Crossfade dim quiet courtyard -> warmly lit courtyard by KT.sang
    drawBakedScreenLayer(c, ketDinhDimC);
    if (sang > 0.002 && ketDinhWarmC) {
      c.save();
      c.globalAlpha = baseAlpha * sang;
      drawBakedScreenLayer(c, ketDinhWarmC);
      c.restore();
    }

    drawKetDinhDynamics(c, sang, now);
    drawSilhouettes(c, bong, sang, now);
    drawKetDinhFireflies(c, dom, now);
  }

  // ===========================================================================
  // SCENE REGISTRATION (compatible with core.js SC contract)
  // ===========================================================================
  SC.ketduong = {
    bake: function () {
      bakeKdGrainVig();
      kdLastCam = -1;
      kdWorldC = null;
    },
    enter: function () {
      if (!kdGrainVigC) bakeKdGrainVig();
    },
    draw: function (c, now) {
      drawKetDuong(c, now);
    },
  };

  SC.ketdinh = {
    bake: function () {
      bakeKetDinh();
    },
    enter: function () {
      if (!ketDinhDimC) bakeKetDinh();
    },
    draw: function (c, now) {
      drawKetDinh(c, now);
    },
  };
})();
