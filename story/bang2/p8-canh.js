'use strict';
// BĂNG SỐ 2 · v7 · TẤM BẢN ĐỒ VẼ TAY (var BD) + CẬN CẢNH CỬA KHU TRỌ (SC.cuatro, var CTR).
// Dùng chung từ core.js: cv, W, H, S, dpr, HAND, setT, layer, roundRect, vignette, clamp, lerp, ease, SC, nudge.
// - Bọc toàn bộ trong IIFE, PRNG riêng (bseed): không gọi rnd()/grain() của core để không lệch seed của p1.js.
// - Phần tĩnh bake vào canvas phụ (layer()), draw chỉ vẽ phần động. Không shadowBlur/filter trong khung hình
//   (shadowBlur chỉ dùng lúc bake một lần).
// - BD: toạ độ riêng của tấm bản đồ là 720×540 (4:3). BD.draw co giãn vào hình chữ nhật bất kỳ trong khung 1600×900.
// - SC.cuatro KHÔNG tự vẽ bản đồ; nơi gọi tự gọi BD.draw(c, CTR.khung.x, CTR.khung.y, CTR.khung.w, CTR.khung.h, o).

var BD = { home: [], slot: null, dim: [], n: 4 };
var CTR = {
  den: 'do',
  mo: 0,
  vantay: 0,
  khung: { x: 870, y: 152, w: 640, h: 480 },
  khay: { x: 950, y: 650, w: 470, h: 30 },
  hot: {
    vantay: { x: 696, y: 326, w: 98, h: 158 },
    cua: { x: 230, y: 100, w: 410, h: 590 },
  },
};

(() => {
  // ---------- PRNG riêng ----------
  let bseed = 523;
  const R = () => ((bseed = (bseed * 16807) % 2147483647) / 2147483647);
  const TAU = Math.PI * 2;
  const MW = 720, MH = 540, MG = 12; // khổ bản đồ (đơn vị riêng) + lề canvas cho bóng/mép sờn
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

  // ---------- hình học dùng chung ----------
  function crDense(pts, step) {
    // đường cong Catmull-Rom qua các điểm điều khiển, chia dày theo bước step
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      const m = Math.max(2, Math.ceil(dist(p1, p2) / step));
      for (let k = 0; k < m; k++) {
        const t = k / m, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  function linDense(pts, step) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], m = Math.max(1, Math.ceil(dist(a, b) / step));
      for (let k = 0; k < m; k++) out.push([lerp(a[0], b[0], k / m), lerp(a[1], b[1], k / m)]);
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  function normAt(p, i) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  }

  function offsetLine(p, d) {
    return p.map((q, i) => {
      const n = normAt(p, i);
      return [q[0] + n[0] * d, q[1] + n[1] * d];
    });
  }

  function join() {
    // nối các đoạn biên; điểm đầu đoạn sau trùng điểm cuối đoạn trước nên bỏ
    const o = [];
    for (let k = 0; k < arguments.length; k++) {
      const a = arguments[k];
      for (let i = k ? 1 : 0; i < a.length; i++) o.push(a[i]);
    }
    return o;
  }

  const rev = (a) => a.slice().reverse();

  function toPath(pts) {
    const p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
    return p;
  }

  function poly(c, pts, fill) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }

  // ---------- nét bút bi run tay ----------
  let INK = '30,42,82';

  function tremble(pts, amp, step) {
    const d = linDense(pts, step || 3), ph1 = R() * TAU, ph2 = R() * TAU;
    let s = 0;
    return d.map((q, i) => {
      if (i) s += dist(d[i - 1], q);
      const n = normAt(d, i);
      const k = amp * (0.55 * Math.sin(s * 0.21 + ph1) + 0.3 * Math.sin(s * 0.63 + ph2) + 0.3 * (R() - 0.5));
      return [q[0] + n[0] * k, q[1] + n[1] * k];
    });
  }

  function strokeSmooth(c, p) {
    c.beginPath();
    c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) {
      c.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
    }
    const l = p[p.length - 1];
    c.lineTo(l[0], l[1]);
    c.stroke();
  }

  function strokeRaw(c, p) {
    c.beginPath();
    c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
    c.stroke();
  }

  function pen(c, pts, w, a, amp) {
    const lw = w || 1.3;
    const p = tremble(pts, amp === undefined ? 0.45 : amp);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = `rgba(${INK},${a === undefined ? 0.82 : a})`;
    c.lineWidth = lw;
    strokeSmooth(c, p);
    // lượt mực thứ hai lệch rất nhẹ: chỗ bút đè mực đậm hơn
    c.save();
    c.translate(0.35, 0.25);
    c.strokeStyle = `rgba(${INK},0.16)`;
    c.lineWidth = lw * 0.55;
    strokeSmooth(c, p);
    c.restore();
  }

  const penC = (c, ctrl, w, a, amp) => pen(c, crDense(ctrl, 4), w, a, amp);
  const rectP = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y + 0.4]];

  function ell(cx, cy, rx, ry, a0, a1, n) {
    const o = [], m = n || 28;
    for (let i = 0; i <= m; i++) {
      const t = a0 + ((a1 - a0) * i) / m;
      o.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
    }
    return o;
  }

  function hand(c, s, x, y, size, col, align, rot) {
    c.save();
    c.translate(x, y);
    if (rot) c.rotate(rot);
    c.font = `${size}px ${HAND}`;
    c.textAlign = align || 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = col;
    c.fillText(s, 0, 0);
    c.restore();
  }

  // ============================================================================
  // HÌNH HỌC 4 MẢNH (tính một lần lúc nạp, không phụ thuộc màn hình)
  // ============================================================================
  const C00 = [0, 0], C10 = [MW, 0], C11 = [MW, MH], C01 = [0, MH];
  const J1 = [300, 0], J2 = [0, 236], T1 = [312, 214], T2 = [528, 214], R13 = [MW, 196], B23 = [470, MH];

  function cut(ctrl, wave, teeth) {
    // nét cắt: lượn theo sóng dài + răng cưa ngắn; hai đầu khớp đúng điểm nối để các mảnh liền khít
    const d = crDense(ctrl, 5);
    let L = 0;
    for (let i = 1; i < d.length; i++) L += dist(d[i - 1], d[i]);
    const ph = R() * TAU;
    let s = 0;
    return d.map((q, i) => {
      if (i) s += dist(d[i - 1], q);
      if (i === 0 || i === d.length - 1) return q.slice();
      const taper = Math.sin((Math.PI * s) / (L || 1));
      const n = normAt(d, i);
      const k = taper * (wave * Math.sin(s * 0.045 + ph) + (i % 2 ? 1 : -1) * teeth * (0.45 + R() * 0.75));
      return [q[0] + n[0] * k, q[1] + n[1] * k];
    });
  }

  const E = {
    top0: cut([C00, J1], 0, 0.5),
    top1: cut([J1, C10], 0, 0.5),
    right1: cut([C10, R13], 0, 0.5),
    right3: cut([R13, C11], 0, 0.5),
    bottom3: cut([C11, B23], 0, 0.5),
    bottom2: cut([B23, C01], 0, 0.5),
    left2: cut([C01, J2], 0, 0.5),
    left0: cut([J2, C00], 0, 0.5),
    e01: cut([J1, [292, 62], [318, 122], [300, 172], T1], 4, 2.6),
    e02: cut([J2, [92, 226], [200, 242], T1], 4, 2.6),
    e12: cut([T1, [380, 238], [452, 200], T2], 4, 2.6),
    e13: cut([T2, [600, 188], [662, 212], R13], 4, 2.6),
    e23: cut([T2, [505, 280], [532, 350], [492, 420], [512, 480], B23], 4, 2.6),
  };

  // mảnh 0 trại · mảnh 1 đường dài · mảnh 2 đình + "Anh vẫn ___" · mảnh 3 ngõ + toà nhà (cùng chiều kim đồng hồ)
  const POLY = [
    join(E.top0, E.e01, rev(E.e02), E.left0),
    join(E.top1, E.right1, rev(E.e13), rev(E.e12), rev(E.e01)),
    join(E.e02, E.e12, E.e23, E.bottom2, E.left2),
    join(E.e13, E.right3, E.bottom3, rev(E.e23)),
  ];
  const OUTER = toPath(join(E.top0, E.top1, E.right1, E.right3, E.bottom3, E.bottom2, E.left2, E.left0));
  const PP = POLY.map(toPath);
  const PPM = POLY.map((pl) => toPath(pl.map((q) => [MW - q[0], q[1]]))); // đường cắt nhìn từ mặt sau
  const BB = POLY.map((pl) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < pl.length; i++) {
      x0 = Math.min(x0, pl[i][0]); y0 = Math.min(y0, pl[i][1]);
      x1 = Math.max(x1, pl[i][0]); y1 = Math.max(y1, pl[i][1]);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  });
  BD.home = BB.map((b) => [b.cx / MW, b.cy / MH]);
  BD.dim = BB.map((b) => [b.w, b.h]); // cỡ mảnh (đơn vị thiết kế) khi s = 1
  const SLOT = { x: 180, y: 298, w: 120, h: 42 };
  BD.slot = { u: SLOT.x / MW, v: SLOT.y / MH, w: SLOT.w / MW, h: SLOT.h / MH };

  // đường chấm chấm: giường (trại) → đường dài → cạnh đình → mép hồ → cổng chào → ngõ → ô cửa sổ sáng
  const PATH_CTRL = [
    [148, 126], [160, 146], [210, 152], [262, 150],
    [330, 140], [420, 104], [520, 92], [585, 126], [572, 172], [505, 196], [448, 228], [435, 272], [434, 318],
    [464, 330], [506, 338], [549, 360], [563, 390], [553, 424], [575, 446], [593, 428],
    [602, 404], [609, 388],
  ];
  const PATHD = crDense(PATH_CTRL, 3);
  const PCUM = [0];
  for (let i = 1; i < PATHD.length; i++) PCUM.push(PCUM[i - 1] + dist(PATHD[i - 1], PATHD[i]));
  const PLEN = PCUM[PCUM.length - 1];
  const LIT = { x: 600, y: 378, w: 18, h: 20, cx: 609, cy: 388 };

  // ============================================================================
  // VẼ GIẤY + NÉT MỰC
  // ============================================================================
  function paper(c, side) {
    c.save();
    c.clip(OUTER);
    let gr = c.createLinearGradient(0, 0, MW, MH);
    gr.addColorStop(0, side ? '#ece0c3' : '#f0e5c9');
    gr.addColorStop(0.55, side ? '#e0d0ab' : '#e6d7b4');
    gr.addColorStop(1, side ? '#cfba90' : '#d6c299');
    c.fillStyle = gr;
    c.fillRect(-MG, -MG, MW + 2 * MG, MH + 2 * MG);
    // vệt ố
    for (let i = 0; i < 9; i++) {
      const x = R() * MW, y = R() * MH, r = 30 + R() * 110;
      const sg = c.createRadialGradient(x, y, 0, x, y, r);
      sg.addColorStop(0, `rgba(150,105,45,${0.04 + R() * 0.07})`);
      sg.addColorStop(1, 'rgba(150,105,45,0)');
      c.fillStyle = sg;
      c.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    // hạt giấy + sợi giấy
    for (let i = 0; i < 3200; i++) {
      c.fillStyle = `rgba(95,70,35,${R() * 0.09})`;
      c.fillRect(R() * MW, R() * MH, 0.7, 0.7);
    }
    for (let i = 0; i < 1600; i++) {
      c.fillStyle = `rgba(255,251,238,${R() * 0.22})`;
      c.fillRect(R() * MW, R() * MH, 0.8, 0.8);
    }
    c.lineWidth = 0.4;
    for (let i = 0; i < 140; i++) {
      const x = R() * MW, y = R() * MH, a = R() * TAU, l = 2 + R() * 5;
      c.strokeStyle = `rgba(110,85,50,${0.05 + R() * 0.07})`;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.stroke();
    }
    // nếp gấp tư
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(115,88,52,0.16)';
    c.beginPath();
    c.moveTo(MW / 2, 0); c.lineTo(MW / 2 + 2, MH);
    c.moveTo(0, MH / 2); c.lineTo(MW, MH / 2 - 2);
    c.stroke();
    c.strokeStyle = 'rgba(255,250,236,0.32)';
    c.beginPath();
    c.moveTo(MW / 2 + 1.2, 0); c.lineTo(MW / 2 + 3.2, MH);
    c.moveTo(0, MH / 2 + 1.2); c.lineTo(MW, MH / 2 - 0.8);
    c.stroke();
    // ánh sáng có hướng: sáng phía trên trái, sậm phía dưới phải
    gr = c.createLinearGradient(0, 0, MW, MH);
    gr.addColorStop(0, 'rgba(255,246,222,0.10)');
    gr.addColorStop(0.6, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(60,38,15,0.14)');
    c.fillStyle = gr;
    c.fillRect(-MG, -MG, MW + 2 * MG, MH + 2 * MG);
    // mép giấy cũ ngả màu
    c.strokeStyle = 'rgba(140,98,48,0.22)';
    c.lineWidth = 14;
    c.stroke(OUTER);
    c.strokeStyle = 'rgba(120,80,36,0.25)';
    c.lineWidth = 4;
    c.stroke(OUTER);
    c.restore();
  }

  function drawFrontInk(c) {
    const ink = `rgba(${INK},0.86)`;

    // --- con đường dài (hai mép), lối ven hồ và con ngõ rộng quanh co ---
    const road = crDense(PATH_CTRL.slice(3, 13), 4);
    pen(c, offsetLine(road, 9), 1.4, 0.8, 0.5);
    pen(c, offsetLine(road, -9), 1.4, 0.8, 0.5);
    const lakeside = crDense(PATH_CTRL.slice(12, 16), 3);
    const lakeR = [], lakeL = [];
    for (let i = 0; i < lakeside.length; i++) {
      const u = i / Math.max(1, lakeside.length - 1);
      const hw = u < 0.5 ? lerp(9, 7.5, u * 2) : lerp(7.5, 10.5, (u - 0.5) * 2);
      const n = normAt(lakeside, i);
      lakeR.push([lakeside[i][0] + n[0] * hw, lakeside[i][1] + n[1] * hw]);
      lakeL.push([lakeside[i][0] - n[0] * hw, lakeside[i][1] - n[1] * hw]);
    }
    pen(c, lakeR, 1.25, 0.78, 0.4);
    pen(c, lakeL, 1.25, 0.78, 0.4);
    const ngo = crDense(PATH_CTRL.slice(15, 19), 3);
    pen(c, offsetLine(ngo, 10.5), 1.25, 0.8, 0.45);
    pen(c, offsetLine(ngo, -10.5), 1.25, 0.8, 0.45);

    // --- khu trại: hàng rào có lối ra, ba dãy nhà mái dài ---
    pen(c, [[258, 138], [258, 30], [20, 30], [20, 206], [258, 206], [258, 162]], 1.1, 0.55, 0.6);
    const bar = (x, y, w, h, skip0, skip1) => {
      pen(c, rectP(x, y, w, h), 1.3, 0.85);
      pen(c, [[x - 4, y], [x + 8, y - 14], [x + w - 8, y - 14], [x + w + 4, y]], 1.3, 0.85);
      for (let k = x + 14; k < x + w - 10; k += 9) pen(c, [[k, y - 12], [k - 5, y - 2]], 0.7, 0.42, 0.2);
      for (let k = x + 12; k < x + w - 12; k += 26) {
        if (k > skip0 && k < skip1) continue;
        pen(c, rectP(k, y + 7, 8, 8), 0.8, 0.6, 0.25);
      }
    };
    bar(30, 50, 200, 22, 0, 0);
    bar(40, 112, 210, 26, 118, 170);
    bar(30, 172, 170, 22, 0, 0);
    // ô cửa sổ có chiếc giường nhỏ
    pen(c, rectP(130, 114, 36, 22), 1.2, 0.9, 0.3);
    pen(c, rectP(134, 126, 28, 6), 1.0, 0.85, 0.2);
    pen(c, rectP(135, 122, 7, 4), 0.8, 0.8, 0.15);
    pen(c, [[136, 132], [136, 135]], 0.9, 0.8, 0.1);
    pen(c, [[160, 132], [160, 135]], 0.9, 0.8, 0.1);
    hand(c, 'trại', 214, 194, 28, ink, 'left', -0.05);

    // --- ngôi đình nhỏ mái cong, hai ghế đá ---
    const gy = 345;
    pen(c, [[324, gy], [400, gy]], 1.3);
    pen(c, [[320, gy + 6], [404, gy + 6]], 1.1, 0.7);
    pen(c, [[332, gy], [332, 308]], 1.2);
    pen(c, [[392, gy], [392, 308]], 1.2);
    pen(c, [[350, gy], [350, 312]], 0.9, 0.6);
    pen(c, [[374, gy], [374, 312]], 0.9, 0.6);
    penC(c, [[308, 296], [318, 306], [338, 308], [386, 308], [406, 306], [416, 296]], 1.4);
    penC(c, [[316, 304], [334, 290], [350, 282], [374, 282], [390, 290], [408, 304]], 1.3);
    pen(c, [[342, 282], [382, 282]], 1.6);
    penC(c, [[334, 279], [338, 284], [342, 282]], 1.1);
    penC(c, [[390, 279], [386, 284], [382, 282]], 1.1);
    for (let k = 328; k < 400; k += 7) pen(c, [[k, 300], [k + 4, 292]], 0.6, 0.4, 0.15);
    const bench = (x, y) => {
      pen(c, [[x - 13, y], [x + 13, y]], 1.6);
      pen(c, [[x - 13, y + 3], [x + 13, y + 3]], 0.9, 0.6);
      pen(c, [[x - 9, y + 3], [x - 9, y + 10]], 1.1);
      pen(c, [[x + 9, y + 3], [x + 9, y + 10]], 1.1);
    };
    bench(336, 372);
    bench(388, 372);
    hand(c, 'đình', 362, 412, 28, ink, 'center', 0.03);

    // --- hồ nhỏ bên phải ngôi đình ---
    const lakePts = [
      [452, 272], [468, 265], [488, 268], [496, 282],
      [492, 300], [472, 308], [450, 302], [444, 286], [452, 272],
    ];
    penC(c, lakePts, 1.3, 0.85, 0.5);
    pen(c, [[455, 278], [472, 277]], 0.75, 0.5, 0.25);
    pen(c, [[466, 286], [486, 285]], 0.75, 0.5, 0.25);
    pen(c, [[453, 294], [476, 293]], 0.75, 0.5, 0.25);
    pen(c, [[462, 301], [482, 300]], 0.7, 0.45, 0.2);
    hand(c, 'hồ', 474, 254, 25, ink, 'center', -0.02);

    // --- dòng "Anh vẫn" và ô trống gạch chân ---
    hand(c, 'Anh vẫn', 174, 332, 30, ink, 'right', -0.03);
    pen(c, [[SLOT.x + 2, SLOT.y + 38], [SLOT.x + SLOT.w - 2, SLOT.y + 36]], 1.3, 0.85, 0.5);

    // --- cây, đồi ---
    const tree = (x, y, r) => {
      pen(c, ell(x, y, r, r * 0.85, 0, TAU, 18), 1.1, 0.72, 0.9);
      pen(c, [[x, y + r * 0.8], [x + 0.5, y + r * 1.7]], 1.1, 0.72);
    };
    tree(60, 400, 13);
    tree(96, 456, 11);
    tree(150, 498, 12);
    tree(262, 470, 10);
    tree(440, 148, 9);
    tree(486, 140, 8);
    tree(655, 120, 9);
    penC(c, [[598, 78], [622, 46], [646, 70], [672, 34], [700, 66], [712, 76]], 1.2, 0.7);
    pen(c, [[624, 56], [618, 66]], 0.7, 0.4, 0.15);
    pen(c, [[674, 46], [668, 58]], 0.7, 0.4, 0.15);

    // --- toà nhà nhiều tầng, một ô cửa sổ được tô sáng ---
    c.fillStyle = 'rgba(242,186,64,0.78)';
    c.fillRect(LIT.x + 1, LIT.y + 1, LIT.w - 2, LIT.h - 2);
    c.strokeStyle = 'rgba(206,120,30,0.55)';
    c.lineWidth = 0.9;
    for (let k = 0; k < 7; k++) {
      c.beginPath();
      c.moveTo(LIT.x + 1 + k * 2.6, LIT.y + LIT.h - 1);
      c.lineTo(Math.min(LIT.x + LIT.w - 1, LIT.x + 6 + k * 2.6), LIT.y + 1);
      c.stroke();
    }
    pen(c, rectP(590, 240, 110, 265), 1.4);
    pen(c, [[586, 240], [704, 240]], 1.4);
    pen(c, rectP(640, 228, 22, 12), 1.0, 0.7);
    for (let r = 0; r < 6; r++) {
      for (let k = 0; k < 3; k++) {
        const wx = 600 + k * 32, wy = 258 + r * 40;
        if (r === 3 && k === 0) continue;
        pen(c, rectP(wx, wy, 18, 20), 0.9, 0.65, 0.3);
      }
    }
    pen(c, rectP(LIT.x, LIT.y, LIT.w, LIT.h), 1.3, 0.9, 0.3);
    pen(c, rectP(636, 485, 18, 20), 1.0, 0.75, 0.25);
    const house = (x, y, w, h) => {
      pen(c, rectP(x, y, w, h), 1.1, 0.72);
      pen(c, [[x - 3, y], [x + w / 2, y - 12], [x + w + 3, y]], 1.1, 0.72);
    };
    house(530, 478, 30, 22);

    // --- cái giếng tròn nhỏ bên trái đầu ngõ ---
    const wx = 548, wy = 316;
    pen(c, ell(wx, wy, 9.5, 4.8, 0, TAU, 18), 1.2, 0.85, 0.3);
    pen(c, ell(wx, wy + 0.3, 5.8, 2.8, 0, TAU, 14), 0.85, 0.7, 0.2);
    pen(c, [[wx - 9.0, wy + 1], [wx - 9.0, wy + 8.5]], 1.05, 0.8);
    pen(c, [[wx + 9.0, wy + 1], [wx + 9.0, wy + 8.5]], 1.05, 0.8);
    pen(c, ell(wx, wy + 8.5, 9.0, 4.0, 0.15, Math.PI - 0.15, 12), 1.05, 0.8, 0.2);
    pen(c, [[wx - 3.2, wy + 5.2], [wx - 3.2, wy + 11.5]], 0.6, 0.45, 0.15);
    pen(c, [[wx + 3.2, wy + 5.2], [wx + 3.2, wy + 11.5]], 0.6, 0.45, 0.15);

    // --- cổng chào nhỏ bắc qua đầu ngõ (biển để trống) ---
    pen(c, [[538, 369], [538, 343]], 1.25, 0.88, 0.2);
    pen(c, [[541, 367], [541, 343]], 1.0, 0.75, 0.2);
    pen(c, [[559, 351], [559, 325]], 1.25, 0.88, 0.2);
    pen(c, [[562, 349], [562, 325]], 1.0, 0.75, 0.2);
    pen(c, [[536, 344], [563, 326]], 1.2, 0.86, 0.2);
    pen(c, [[536, 338], [563, 320]], 1.2, 0.86, 0.2);
    pen(c, [[543, 340], [546, 333], [551, 335], [555, 327], [560, 329]], 0.7, 0.55, 0.15);
    hand(c, 'ngõ', 548, 282, 24, ink, 'center', -0.03);

    // --- đường chấm chấm liền một mạch ---
    c.save();
    c.setLineDash([0.1, 5.5]);
    c.lineCap = 'round';
    c.lineWidth = 2.4;
    c.strokeStyle = `rgba(${INK},0.78)`;
    strokeRaw(c, PATHD);
    c.restore();

    // --- chấm đỏ trên chiếc giường ---
    c.fillStyle = 'rgba(184,40,32,0.92)';
    c.beginPath();
    c.arc(150, 124, 3.2, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(184,40,32,0.5)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(150.4, 123.6, 4.8, 0.3, TAU - 0.4);
    c.stroke();
  }

  function drawBackInk(c) {
    // hai chiếc ghế đá quay mặt vào nhau dưới một chiếc đèn lồng (không có người)
    const VP = [360, 250];
    const far = (q) => [q[0] + (VP[0] - q[0]) * 0.36, q[1] + (VP[1] - q[1]) * 0.36];

    // nền lát hội tụ về xa
    for (let x = 40; x <= 680; x += 80) pen(c, [[x, 530], far([x, 530])], 0.8, 0.32, 0.3);
    [455, 485, 515].forEach((yy) => {
      const t = (530 - yy) / 280;
      pen(c, [[40 + 320 * t, yy], [680 - 320 * t, yy]], 0.8, 0.3, 0.3);
    });
    // vũng sáng dưới đèn: nét chấm
    c.save();
    c.setLineDash([2, 5]);
    pen(c, ell(360, 470, 104, 16, 0, TAU, 40), 0.9, 0.4, 0.3);
    c.restore();

    // mặt cắt ghế nhìn nghiêng (phía gần): mặt ngồi + tựa lưng
    const prof = [[300, 420], [212, 420], [198, 352], [186, 356], [198, 430], [300, 430]];
    const benchB = (mir) => {
      const T = (q) => (mir ? [MW - q[0], q[1]] : q);
      const P = prof.map(T);
      const Fp = P.map(far);
      pen(c, Fp.concat([Fp[0]]), 1.0, 0.5);
      for (let k = 0; k < 4; k++) pen(c, [P[k], Fp[k]], 1.1, 0.7);
      // chân ghế
      [[290, 278], [214, 202]].forEach((lg) => {
        const a = T([lg[0], 430]), b = T([lg[1], 430]), a2 = T([lg[0], 470]), b2 = T([lg[1], 470]);
        pen(c, [far(a), far(a2), far(b2), far(b)], 0.9, 0.42);
        pen(c, [a, a2, b2, b], 1.3, 0.85);
      });
      // mặt gần: tô màu đá nhạt che nét phía sau, gạch bóng, rồi viền
      c.beginPath();
      c.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]);
      c.closePath();
      c.fillStyle = 'rgba(226,212,180,0.9)';
      c.fill();
      c.save();
      c.clip();
      for (let k = -4; k < 22; k++) {
        const x0 = 180 + k * 7;
        pen(c, [T([x0, 436]), T([x0 + 24, 346])], 0.6, 0.28, 0.2);
      }
      c.restore();
      pen(c, P.concat([P[0]]), 1.5, 0.86);
      // bóng dưới ghế
      for (let k = 0; k < 9; k++) {
        const q = T([206 + k * 10, 474]);
        pen(c, [q, [q[0] + (mir ? 6 : -6), q[1] + 6]], 0.7, 0.4, 0.2);
      }
    };
    benchB(false);
    benchB(true);

    // đèn lồng treo giữa hai ghế
    pen(c, [[360, 0], [360, 92]], 0.9, 0.7, 0.3);
    pen(c, rectP(347, 92, 26, 8), 1.2, 0.85, 0.2);
    pen(c, ell(360, 136, 32, 37, 0, TAU, 30), 1.5, 0.86, 0.5);
    [0.32, 0.68].forEach((f) => {
      pen(c, ell(360, 136, 32 * f, 37, -Math.PI / 2, Math.PI / 2, 16), 0.9, 0.6, 0.3);
      pen(c, ell(360, 136, 32 * f, 37, Math.PI / 2, Math.PI * 1.5, 16), 0.9, 0.6, 0.3);
    });
    pen(c, [[360, 100], [360, 172]], 0.9, 0.6, 0.3);
    pen(c, rectP(349, 172, 22, 7), 1.2, 0.85, 0.2);
    for (let k = -2; k <= 2; k++) pen(c, [[360 + k * 2.5, 180], [361 + k * 4.5, 214]], 0.8, 0.65, 0.5);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU + 0.2, r0 = 50, r1 = 58 + (k % 2) * 6;
      pen(c, [[360 + Math.cos(a) * r0, 136 + Math.sin(a) * r0 * 1.05], [360 + Math.cos(a) * r1, 136 + Math.sin(a) * r1 * 1.05]], 0.8, 0.42, 0.2);
    }
  }

  function fray(c, i, mir) {
    // mép giấy sờn ở đường cắt: viền sáng phía trong, nét tối mảnh, xơ giấy lởm chởm
    const path = mir ? PPM[i] : PP[i];
    c.save();
    c.clip(path);
    c.strokeStyle = 'rgba(250,244,226,0.75)';
    c.lineWidth = 2.6;
    c.stroke(path);
    c.restore();
    c.strokeStyle = 'rgba(88,64,34,0.55)';
    c.lineWidth = 0.7;
    c.stroke(path);
    const pl = POLY[i];
    c.lineWidth = 0.5;
    for (let k = 0; k < pl.length; k += 2) {
      const x = mir ? MW - pl[k][0] : pl[k][0], y = pl[k][1], a = R() * TAU, l = 0.6 + R() * 1.4;
      c.strokeStyle = `rgba(245,236,214,${0.3 + R() * 0.4})`;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.stroke();
    }
  }

  // ---------- sprite ánh sáng dựng một lần ----------
  const SPR = {};
  function sprites() {
    if (SPR.warm) return;
    const mk = (n, stops) => {
      const c2 = document.createElement('canvas');
      c2.width = c2.height = n;
      const x = c2.getContext('2d');
      const gr = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
      x.fillStyle = gr;
      x.fillRect(0, 0, n, n);
      return c2;
    };
    SPR.warm = mk(128, [[0, 'rgba(255,214,140,0.85)'], [0.3, 'rgba(245,182,100,0.38)'], [0.65, 'rgba(220,140,70,0.10)'], [1, 'rgba(200,120,60,0)']]);
    SPR.red = mk(96, [[0, 'rgba(255,90,68,0.9)'], [0.28, 'rgba(225,52,38,0.42)'], [0.65, 'rgba(180,30,24,0.10)'], [1, 'rgba(140,20,18,0)']]);
    SPR.green = mk(64, [[0, 'rgba(115,255,186,0.94)'], [0.26, 'rgba(65,222,142,0.44)'], [0.62, 'rgba(35,165,102,0.11)'], [1, 'rgba(20,120,75,0)']]);
  }

  // ============================================================================
  // BAKE BẢN ĐỒ
  // ============================================================================
  let K = 1, bdW = -1, bdDirty = true, compMask = -1;
  const [F, fG] = layer();
  const [Bk, bG] = layer();
  const [CP, cG] = layer();
  const PS = [0, 1, 2, 3].map(() => layer());
  const PM = 18; // lề bóng đổ của mảnh rời

  function sizeMap(cnv, ctx) {
    cnv.width = Math.ceil((MW + 2 * MG) * K);
    cnv.height = Math.ceil((MH + 2 * MG) * K);
    ctx.setTransform(K, 0, 0, K, MG * K, MG * K);
  }

  function bakeBD() {
    K = clamp(S * dpr, 1, 2);
    bdW = cv.width;
    bdDirty = false;
    compMask = -1;
    INK = '30,42,82';
    // mặt trước
    sizeMap(F, fG);
    bseed = 911;
    paper(fG, 0);
    drawFrontInk(fG);
    // mặt sau: giấy, vết mực mặt trước thấm ngược rất mờ, hình ghế đá + đèn lồng, đường cắt (soi gương)
    sizeMap(Bk, bG);
    bseed = 1733;
    paper(bG, 1);
    bG.save();
    bG.clip(OUTER);
    bG.globalAlpha = 0.07;
    bG.translate(MW, 0);
    bG.scale(-1, 1);
    drawFrontInk(bG);
    bG.restore();
    drawBackInk(bG);
    for (let i = 0; i < 4; i++) fray(bG, i, true);
    // mảnh rời: bóng đổ bake sẵn + mép sờn
    for (let i = 0; i < 4; i++) {
      const b = BB[i], cnv = PS[i][0], x = PS[i][1];
      cnv.width = Math.ceil((b.w + 2 * PM) * K);
      cnv.height = Math.ceil((b.h + 2 * PM) * K);
      x.setTransform(K, 0, 0, K, (PM - b.x) * K, (PM - b.y) * K);
      x.save();
      x.shadowColor = 'rgba(0,0,0,0.55)';
      x.shadowBlur = 9 * K;
      x.shadowOffsetX = 3 * K;
      x.shadowOffsetY = 6 * K;
      x.fillStyle = 'rgb(40,30,20)';
      x.fill(PP[i]);
      x.restore();
      x.save();
      x.clip(PP[i]);
      x.drawImage(F, -MG, -MG, MW + 2 * MG, MH + 2 * MG);
      x.restore();
      fray(x, i, false);
    }
  }

  function compose(mask) {
    // ghép tấm hiện tại theo mảnh đã đặt; chỉ chạy lại khi tập mảnh đổi
    compMask = mask;
    sizeMap(CP, cG);
    for (let i = 0; i < 4; i++) {
      if (mask & (1 << i)) continue;
      cG.fillStyle = 'rgba(9,8,7,0.82)';
      cG.fill(PP[i]);
      cG.save();
      cG.clip(PP[i]);
      cG.strokeStyle = 'rgba(0,0,0,0.5)';
      cG.lineWidth = 8;
      cG.stroke(PP[i]);
      cG.restore();
      cG.strokeStyle = 'rgba(232,220,196,0.20)';
      cG.lineWidth = 1.1;
      cG.stroke(PP[i]);
    }
    for (let i = 0; i < 4; i++) {
      if (!(mask & (1 << i))) continue;
      cG.save();
      cG.shadowColor = 'rgba(0,0,0,0.45)';
      cG.shadowBlur = 5 * K;
      cG.shadowOffsetX = 1.5 * K;
      cG.shadowOffsetY = 2.5 * K;
      cG.fillStyle = '#2a2018';
      cG.fill(PP[i]);
      cG.restore();
    }
    for (let i = 0; i < 4; i++) {
      if (!(mask & (1 << i))) continue;
      cG.save();
      cG.clip(PP[i]);
      cG.drawImage(F, -MG, -MG, MW + 2 * MG, MH + 2 * MG);
      cG.restore();
      bseed = 4001 + i * 97;
      fray(cG, i, false);
    }
  }

  const PLACED = {};
  function placedPath(mask) {
    if (PLACED[mask]) return PLACED[mask];
    const p = new Path2D();
    for (let i = 0; i < 4; i++) {
      if (!(mask & (1 << i))) continue;
      const pl = POLY[i];
      p.moveTo(pl[0][0], pl[0][1]);
      for (let k = 1; k < pl.length; k++) p.lineTo(pl[k][0], pl[k][1]);
      p.closePath();
    }
    PLACED[mask] = p;
    return p;
  }

  function ensureBD() {
    if (bdDirty || bdW !== cv.width) bakeBD();
  }

  function maskOf(co) {
    const a = co || [1, 1, 1, 1];
    let m = 0;
    for (let i = 0; i < 4; i++) if (a[i]) m |= 1 << i;
    return m;
  }

  function strokeUpTo(c, len) {
    c.beginPath();
    c.moveTo(PATHD[0][0], PATHD[0][1]);
    let i = 1;
    for (; i < PATHD.length && PCUM[i] <= len; i++) c.lineTo(PATHD[i][0], PATHD[i][1]);
    let head = PATHD[i - 1];
    if (i < PATHD.length) {
      const k = (len - PCUM[i - 1]) / (PCUM[i] - PCUM[i - 1] || 1);
      head = [lerp(PATHD[i - 1][0], PATHD[i][0], k), lerp(PATHD[i - 1][1], PATHD[i][1], k)];
      c.lineTo(head[0], head[1]);
    }
    c.stroke();
    return head;
  }

  function glow(c, mask, sang, ba) {
    c.save();
    if (mask !== 15) c.clip(placedPath(mask));
    const e = ease(sang);
    // cả tấm hơi bừng lên
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = ba * 0.16 * e;
    c.drawImage(SPR.warm, -MW * 0.25, -MH * 0.35, MW * 1.5, MH * 1.7);
    // vệt sáng ấm chạy dọc đường chấm chấm, từ giường tới cửa sổ
    c.globalCompositeOperation = 'source-over';
    const len = PLEN * clamp(sang * 1.12, 0, 1);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.globalAlpha = ba * 0.3;
    c.strokeStyle = 'rgb(255,178,80)';
    c.lineWidth = 7;
    strokeUpTo(c, len);
    c.globalAlpha = ba;
    c.setLineDash([0.1, 5.5]);
    c.strokeStyle = 'rgba(222,112,28,0.95)';
    c.lineWidth = 3;
    const head = strokeUpTo(c, len);
    c.setLineDash([]);
    c.globalCompositeOperation = 'lighter';
    if (len < PLEN - 0.5) {
      c.globalAlpha = ba * 0.55;
      c.drawImage(SPR.warm, head[0] - 16, head[1] - 16, 32, 32);
    }
    // ô cửa sổ sáng hẳn khi vệt sáng tới nơi
    const win = clamp((sang - 0.82) / 0.18, 0, 1);
    c.globalAlpha = ba * (0.15 * e + 0.75 * win);
    c.drawImage(SPR.warm, LIT.cx - 40, LIT.cy - 40, 80, 80);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = ba * win;
    c.fillStyle = 'rgba(255,214,120,0.55)';
    c.fillRect(LIT.x + 1, LIT.y + 1, LIT.w - 2, LIT.h - 2);
    c.restore();
  }

  function writeChu(c, s) {
    let size = 34;
    c.font = `${size}px ${HAND}`;
    while (size > 14 && c.measureText(s).width > SLOT.w - 8) {
      size -= 2;
      c.font = `${size}px ${HAND}`;
    }
    c.save();
    c.translate(SLOT.x + SLOT.w / 2, SLOT.y + SLOT.h - 9);
    c.rotate(-0.035);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = 'rgba(176,36,28,0.92)';
    c.fillText(s, 0, 0);
    c.globalAlpha *= 0.35;
    c.fillText(s, 0.6, 0.4);
    c.restore();
  }

  // ---------- API ----------
  BD.draw = function (c, x, y, w, h, o) {
    if (!(w > 0 && h > 0)) return;
    ensureBD();
    sprites();
    const op = o || {};
    const mask = maskOf(op.co);
    const sang = clamp(Number(op.sang) || 0, 0, 1);
    const lat = clamp(Number(op.lat) || 0, 0, 1);
    const chu = op.chu ? String(op.chu) : '';
    const ang = lat * Math.PI, cs = Math.cos(ang), sx = Math.max(0.004, Math.abs(cs));
    const ba = c.globalAlpha;
    c.save();
    c.translate(x + w / 2, y + h / 2);
    c.scale(sx, 1 + 0.04 * Math.sin(ang));
    c.translate(-w / 2, -h / 2);
    c.scale(w / MW, h / MH);
    if (cs >= 0) {
      if (mask !== compMask) compose(mask);
      c.drawImage(CP, -MG, -MG, MW + 2 * MG, MH + 2 * MG);
      if (sang > 0.001) glow(c, mask, sang, ba);
      if (chu && (mask & 4)) writeChu(c, chu);
    } else {
      c.drawImage(Bk, -MG, -MG, MW + 2 * MG, MH + 2 * MG);
    }
    if (sx < 0.999) {
      // đang lật: mặt giấy nghiêng khỏi ánh sáng nên tối đi
      c.globalAlpha = ba * 0.55 * (1 - sx);
      c.fillStyle = '#000';
      c.fill(OUTER);
    }
    c.restore();
  };

  BD.piece = function (c, i, cx, cy, s, rot) {
    if (!(i >= 0 && i <= 3)) return;
    ensureBD();
    const b = BB[i], k = s || 1;
    c.save();
    c.translate(cx, cy);
    if (rot) c.rotate(rot);
    c.scale(k, k);
    c.drawImage(PS[i][0], -b.w / 2 - PM, -b.h / 2 - PM, b.w + 2 * PM, b.h + 2 * PM);
    c.restore();
  };

  const HC = document.createElement('canvas').getContext('2d');
  BD.hit = function (i, px, py, x, y, w, h) {
    if (!(i >= 0 && i <= 3) || !(w > 0 && h > 0)) return false;
    return HC.isPointInPath(PP[i], ((px - x) * MW) / w, ((py - y) * MH) / h);
  };

  // phông viết tay tải xong thì bake lại (chữ "trại", "đình", "ngõ", "Anh vẫn" nằm trong ảnh bake)
  try {
    if (document.fonts && document.fonts.load) {
      document.fonts.load(`30px 'Patrick Hand'`, 'Anh vẫn trại đình hồ ngõ Ở ĐÂY').then(() => { bdDirty = true; }, () => {});
    }
  } catch (err) { /* bỏ qua: vẫn vẽ bằng phông dự phòng */ }

  // ============================================================================
  // SC.cuatro · CẬN CẢNH CỬA KHU TRỌ (đêm, đèn đường vàng hắt từ bên trái)
  // ============================================================================
  const GROUND = 690;
  const OP = { x: 242, y: 148, w: 386, h: 540 }; // lòng cửa hai cánh (y 148..688)
  const LW = OP.w / 2;
  const RD = { x: 706, y: 334, w: 78, h: 140 }; // máy đọc vân tay
  const SCR = { x: 718, y: 352, w: 54, h: 34 };
  const PAD = { x: 727, y: 404, w: 36, h: 48 };
  const FR = { x: 858, y: 140, w: 664, h: 504 }; // khung gỗ ngoài (lòng khung = CTR.khung)
  const KH = CTR.khay;
  const [ctC, ctG] = layer();
  const LEAF = [layer(), layer()];
  let ctBaked = false;

  function drawInterior(c) {
    // sảnh bên trong ấm (nhìn qua lòng cửa), phối cảnh một điểm tụ
    const VPi = [435, 430], k = 0.42;
    const bk = (q) => [VPi[0] + (q[0] - VPi[0]) * k, VPi[1] + (q[1] - VPi[1]) * k];
    const TL = [OP.x, OP.y], TR = [OP.x + OP.w, OP.y], BR = [OP.x + OP.w, OP.y + OP.h], BL = [OP.x, OP.y + OP.h];
    const bTL = bk(TL), bTR = bk(TR), bBR = bk(BR), bBL = bk(BL);
    poly(c, [TL, TR, bTR, bTL], '#2e2012');
    poly(c, [TL, bTL, bBL, BL], '#553a20');
    poly(c, [TR, BR, bBR, bTR], '#47301b');
    let gr = c.createLinearGradient(0, bBL[1], 0, BL[1]);
    gr.addColorStop(0, '#5a4026');
    gr.addColorStop(1, '#2c1f12');
    poly(c, [bBL, bBR, BR, BL], gr);
    gr = c.createLinearGradient(0, bTL[1], 0, bBL[1]);
    gr.addColorStop(0, '#6e4c2a');
    gr.addColorStop(1, '#8a6136');
    poly(c, [bTL, bTR, bBR, bBL], gr);
    // gạch sàn hội tụ
    c.strokeStyle = 'rgba(30,18,8,0.45)';
    c.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const x = lerp(BL[0], BR[0], i / 6), b = bk([x, BL[1]]);
      c.beginPath();
      c.moveTo(x, BL[1]);
      c.lineTo(b[0], b[1]);
      c.stroke();
    }
    for (let i = 1; i < 5; i++) {
      const f = Math.pow(i / 5, 1.6), y = lerp(bBL[1], BL[1], f);
      c.beginPath();
      c.moveTo(lerp(bBL[0], BL[0], f), y);
      c.lineTo(lerp(bBR[0], BR[0], f), y);
      c.stroke();
    }
    // cửa gỗ cuối sảnh
    c.fillStyle = '#3a2614';
    c.fillRect(414, 452, 42, 86);
    c.strokeStyle = 'rgba(20,12,6,0.6)';
    c.lineWidth = 2;
    c.strokeRect(414, 452, 42, 86);
    c.fillStyle = 'rgba(255,220,160,0.5)';
    c.fillRect(448, 494, 3, 3);
    // cầu thang bộ men tường phải
    c.strokeStyle = 'rgba(30,18,8,0.55)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(520, 540);
    for (let s = 0; s < 8; s++) {
      const x0 = 520 + s * 13, y0 = 540 - s * 26;
      c.lineTo(x0, y0 - 26);
      c.lineTo(x0 + 13, y0 - 26);
    }
    c.stroke();
    c.strokeStyle = 'rgba(200,150,90,0.35)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(522, 500);
    c.lineTo(626, 292);
    c.stroke();
    // bóng đèn treo
    c.strokeStyle = 'rgba(20,12,6,0.8)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(435, 228);
    c.lineTo(435, 287);
    c.stroke();
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.85;
    c.drawImage(SPR.warm, 435 - 200, 292 - 170, 400, 340);
    c.globalAlpha = 0.35;
    c.drawImage(SPR.warm, 435 - 160, 560, 320, 140);
    c.restore();
    c.fillStyle = 'rgba(255,240,200,1)';
    c.beginPath();
    c.arc(435, 292, 5, 0, TAU);
    c.fill();
  }

  function bakeLeaf(i) {
    // cánh cửa kính: kính tối thấy lờ mờ bên trong, khung sắt, đố ngang, tấm chân, tay nắm dọc
    const cnv = LEAF[i][0], x = LEAF[i][1], kc = S * dpr;
    cnv.width = Math.max(1, Math.ceil(LW * kc));
    cnv.height = Math.max(1, Math.ceil(OP.h * kc));
    x.setTransform(kc, 0, 0, kc, 0, 0);
    x.fillStyle = 'rgba(9,14,22,0.8)';
    x.fillRect(0, 0, LW, OP.h);
    // vệt phản chiếu đèn đường (từ bên trái)
    const gr = x.createLinearGradient(0, 0, LW, OP.h * 0.6);
    gr.addColorStop(0, 'rgba(255,196,120,0)');
    gr.addColorStop(i ? 0.25 : 0.4, 'rgba(255,196,120,0.10)');
    gr.addColorStop(i ? 0.4 : 0.55, 'rgba(255,196,120,0)');
    gr.addColorStop(1, 'rgba(255,196,120,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, LW, OP.h);
    x.strokeStyle = '#1b222c';
    x.lineWidth = 10;
    x.strokeRect(5, 5, LW - 10, OP.h - 10);
    x.strokeStyle = i === 0 ? 'rgba(255,200,140,0.22)' : 'rgba(255,200,140,0.12)';
    x.lineWidth = 1.4;
    x.beginPath();
    x.moveTo(1, OP.h - 2);
    x.lineTo(1, 1);
    x.lineTo(LW - 2, 1);
    x.stroke();
    x.fillStyle = '#1b222c';
    x.fillRect(0, OP.h * 0.6, LW, 8);
    x.fillRect(0, OP.h - 46, LW, 46);
    x.fillStyle = 'rgba(255,200,140,0.10)';
    x.fillRect(0, OP.h * 0.6, LW, 1.2);
    x.fillRect(0, OP.h - 46, LW, 1.2);
    const hx = i === 0 ? LW - 22 : 18;
    x.fillStyle = '#0c1016';
    x.fillRect(hx - 1, 236, 6, 140);
    x.fillStyle = 'rgba(214,206,190,0.55)';
    x.fillRect(hx, 238, 4, 136);
    x.fillStyle = 'rgba(255,214,160,0.35)';
    x.fillRect(hx, 238, 1.2, 136);
  }

  function bakeCuaTro() {
    if (!cv.width || !cv.height) return;
    sprites();
    ctC.width = cv.width;
    ctC.height = cv.height;
    bseed = 2207;
    const c = ctG, kc = S * dpr;
    setT(c);

    // 1. tường mặt tiền (cùng tông sơn đêm với SC.cuangoai)
    let gr = c.createLinearGradient(0, 0, 0, GROUND);
    gr.addColorStop(0, '#141a24');
    gr.addColorStop(0.5, '#1c2432');
    gr.addColorStop(1, '#161c26');
    c.fillStyle = gr;
    c.fillRect(-300, -300, W + 600, GROUND + 300);
    for (let i = 0; i < 26; i++) {
      c.fillStyle = `rgba(0,0,0,${0.03 + R() * 0.05})`;
      c.fillRect(R() * W, R() * 200, 6 + R() * 30, 300 + R() * 400);
    }
    for (let i = 0; i < 5200; i++) {
      c.fillStyle = `rgba(${R() < 0.5 ? '210,225,245' : '0,0,0'},${R() * 0.03})`;
      c.fillRect(R() * W, R() * GROUND, 1.6, 1.6);
    }
    // vài vết nứt chân tóc
    c.strokeStyle = 'rgba(0,0,0,0.35)';
    c.lineWidth = 0.9;
    [[812, 520], [1548, 300], [690, 250]].forEach((q) => {
      let x = q[0], y = q[1];
      c.beginPath();
      c.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += (R() - 0.4) * 10; y += 6 + R() * 8; c.lineTo(x, y); }
      c.stroke();
    });
    // ánh đèn đường vàng hắt từ bên trái (đèn nằm ngoài khung hình)
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.3;
    c.drawImage(SPR.warm, -700, -250, 1500, 1300);
    c.restore();

    // 2. chân tường + vỉa hè (dải 680..780 để trống: chỉ màu nền)
    c.fillStyle = '#10151c';
    c.fillRect(-300, GROUND - 30, W + 600, 30);
    c.fillStyle = 'rgba(190,210,235,0.06)';
    c.fillRect(-300, GROUND - 30, W + 600, 1.5);
    gr = c.createLinearGradient(0, GROUND, 0, H);
    gr.addColorStop(0, '#0d1118');
    gr.addColorStop(1, '#05070a');
    c.fillStyle = gr;
    c.fillRect(-300, GROUND, W + 600, H - GROUND + 300);
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillRect(-300, GROUND, W + 600, 3);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.08;
    c.drawImage(SPR.warm, -400, GROUND - 40, 1300, 300);
    c.restore();

    // 3. cửa kính hai cánh: hõm cửa, khung sắt, sảnh ấm phía trong, ô kính trên
    c.fillStyle = '#0a0d12';
    c.fillRect(222, 32, 426, GROUND - 32);
    c.fillStyle = '#121821';
    c.fillRect(230, 40, 410, GROUND - 40);
    c.save();
    c.beginPath();
    c.rect(OP.x, OP.y, OP.w, OP.h);
    c.clip();
    drawInterior(c);
    c.restore();
    c.fillStyle = '#0b1018';
    c.fillRect(242, 52, 386, 84);
    gr = c.createLinearGradient(242, 52, 628, 136);
    gr.addColorStop(0, 'rgba(255,196,120,0.10)');
    gr.addColorStop(0.5, 'rgba(255,196,120,0)');
    c.fillStyle = gr;
    c.fillRect(242, 52, 386, 84);
    c.strokeStyle = '#1d2530';
    c.lineWidth = 4;
    c.strokeRect(242, 52, 386, 84);
    c.fillStyle = '#1a212b';
    c.fillRect(236, 136, 398, 12);
    c.fillStyle = 'rgba(255,205,150,0.16)';
    c.fillRect(236, 136, 398, 1.4);
    c.fillStyle = 'rgba(255,200,140,0.18)';
    c.fillRect(230, 40, 2, GROUND - 40);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(636, 40, 4, GROUND - 40);
    c.fillStyle = '#1e252e';
    c.fillRect(236, GROUND - 4, 398, 6);

    // 4. ống luồn dây từ máy vân tay lên khoá từ (bóng lệch sang phải vì đèn ở bên trái)
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(644, 168, 112, 8);
    c.fillRect(750, 168, 8, 166);
    c.fillStyle = '#222a35';
    c.fillRect(640, 162, 112, 8);
    c.fillRect(744, 162, 8, 172);
    c.fillStyle = 'rgba(255,200,140,0.18)';
    c.fillRect(640, 162, 112, 1.2);
    c.fillRect(744, 162, 1.2, 172);

    // 5. máy đọc vân tay gắn tường
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.6)';
    c.shadowBlur = 12 * kc;
    c.shadowOffsetX = 8 * kc;
    c.shadowOffsetY = 5 * kc;
    c.fillStyle = '#1b222b';
    roundRect(c, RD.x, RD.y, RD.w, RD.h, 10);
    c.fill();
    c.restore();
    gr = c.createLinearGradient(RD.x, 0, RD.x + RD.w, 0);
    gr.addColorStop(0, '#323b47');
    gr.addColorStop(0.4, '#232a34');
    gr.addColorStop(1, '#151a21');
    c.fillStyle = gr;
    roundRect(c, RD.x, RD.y, RD.w, RD.h, 10);
    c.fill();
    c.strokeStyle = 'rgba(255,205,150,0.22)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(RD.x + 1, RD.y + 10);
    c.lineTo(RD.x + 1, RD.y + RD.h - 10);
    c.stroke();
    c.fillStyle = '#071216';
    roundRect(c, SCR.x - 2, SCR.y - 2, SCR.w + 4, SCR.h + 4, 4);
    c.fill();
    c.fillStyle = '#0c2228';
    c.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    c.fillStyle = 'rgba(120,200,215,0.08)';
    for (let yy = SCR.y + 2; yy < SCR.y + SCR.h; yy += 3) c.fillRect(SCR.x, yy, SCR.w, 1);
    c.fillStyle = '#0d1217';
    roundRect(c, PAD.x, PAD.y, PAD.w, PAD.h, 10);
    c.fill();
    c.strokeStyle = 'rgba(130,175,200,0.18)';
    c.lineWidth = 1;
    for (let r = 4; r < 18; r += 3.2) {
      c.beginPath();
      c.ellipse(PAD.x + PAD.w / 2, PAD.y + PAD.h / 2 + 2, r * 0.8, r, 0, Math.PI * 1.1, Math.PI * 1.9 + 0.6);
      c.stroke();
    }
    [[RD.x + RD.w / 2, RD.y + 8], [RD.x + RD.w / 2, RD.y + RD.h - 8]].forEach((q) => {
      c.fillStyle = '#0c0f13';
      c.beginPath();
      c.arc(q[0], q[1], 2.4, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(255,210,160,0.25)';
      c.fillRect(q[0] - 2, q[1] - 0.4, 4, 0.8);
    });

    // 6. khung gỗ mỏng treo bằng đinh (dây treo, bóng đổ sang phải-dưới)
    c.strokeStyle = 'rgba(0,0,0,0.35)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(1196, 108); c.lineTo(1022, 146);
    c.moveTo(1196, 108); c.lineTo(1378, 146);
    c.stroke();
    c.strokeStyle = 'rgba(160,168,178,0.55)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(1190, 104); c.lineTo(1010, 142);
    c.moveTo(1190, 104); c.lineTo(1370, 142);
    c.stroke();
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.7)';
    c.shadowBlur = 18 * kc;
    c.shadowOffsetX = 16 * kc;
    c.shadowOffsetY = 10 * kc;
    c.fillStyle = '#2a1d12';
    c.fillRect(FR.x, FR.y, FR.w, FR.h);
    c.restore();
    const ix = FR.x + 12, iy = FR.y + 12, iw = FR.w - 24, ih = FR.h - 24;
    poly(c, [[FR.x, FR.y], [FR.x + FR.w, FR.y], [ix + iw, iy], [ix, iy]], '#8a6238');
    poly(c, [[FR.x, FR.y], [ix, iy], [ix, iy + ih], [FR.x, FR.y + FR.h]], '#94693c');
    poly(c, [[FR.x + FR.w, FR.y], [FR.x + FR.w, FR.y + FR.h], [ix + iw, iy + ih], [ix + iw, iy]], '#4e341d');
    poly(c, [[FR.x, FR.y + FR.h], [ix, iy + ih], [ix + iw, iy + ih], [FR.x + FR.w, FR.y + FR.h]], '#5e3f22');
    // vân gỗ
    c.lineWidth = 0.7;
    for (let k = 0; k < 6; k++) {
      c.strokeStyle = `rgba(40,24,10,${0.18 + R() * 0.15})`;
      const yT = FR.y + 2 + k * 1.7 + R(), yB = FR.y + FR.h - 2 - k * 1.7 - R();
      const xL = FR.x + 2 + k * 1.7 + R(), xR = FR.x + FR.w - 2 - k * 1.7 - R();
      c.beginPath();
      c.moveTo(FR.x + 10, yT);
      c.bezierCurveTo(FR.x + 200, yT + R() * 2 - 1, FR.x + 450, yT + R() * 2 - 1, FR.x + FR.w - 10, yT);
      c.moveTo(FR.x + 10, yB);
      c.bezierCurveTo(FR.x + 220, yB + R() * 2 - 1, FR.x + 430, yB + R() * 2 - 1, FR.x + FR.w - 10, yB);
      c.moveTo(xL, FR.y + 10);
      c.lineTo(xL + R() - 0.5, FR.y + FR.h - 10);
      c.moveTo(xR, FR.y + 10);
      c.lineTo(xR + R() - 0.5, FR.y + FR.h - 10);
      c.stroke();
    }
    // xa đèn dần về bên phải → gỗ tối dần
    gr = c.createLinearGradient(FR.x, 0, FR.x + FR.w, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0.38)');
    c.fillStyle = gr;
    c.beginPath();
    c.rect(FR.x, FR.y, FR.w, FR.h);
    c.rect(ix, iy, iw, ih);
    c.fill('evenodd');
    // mạch góc vát
    c.strokeStyle = 'rgba(30,18,8,0.55)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(FR.x, FR.y); c.lineTo(ix, iy);
    c.moveTo(FR.x + FR.w, FR.y); c.lineTo(ix + iw, iy);
    c.moveTo(FR.x, FR.y + FR.h); c.lineTo(ix, iy + ih);
    c.moveTo(FR.x + FR.w, FR.y + FR.h); c.lineTo(ix + iw, iy + ih);
    c.stroke();
    c.strokeStyle = 'rgba(255,215,160,0.32)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(FR.x + 1, FR.y + FR.h - 1);
    c.lineTo(FR.x + 1, FR.y + 1);
    c.lineTo(FR.x + FR.w - 1, FR.y + 1);
    c.stroke();
    // tấm lót trong lòng khung + bóng mép khung đổ lên tấm lót
    c.fillStyle = '#16100b';
    c.fillRect(ix, iy, iw, ih);
    for (let i = 0; i < 1800; i++) {
      c.fillStyle = `rgba(${R() < 0.5 ? '120,90,60' : '0,0,0'},${R() * 0.08})`;
      c.fillRect(ix + R() * iw, iy + R() * ih, 1.4, 1.4);
    }
    gr = c.createLinearGradient(ix, 0, ix + iw, 0);
    gr.addColorStop(0, 'rgba(255,190,120,0.05)');
    gr.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = gr;
    c.fillRect(ix, iy, iw, ih);
    gr = c.createLinearGradient(ix, 0, ix + 26, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0.6)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr;
    c.fillRect(ix, iy, 26, ih);
    gr = c.createLinearGradient(0, iy, 0, iy + 18);
    gr.addColorStop(0, 'rgba(0,0,0,0.5)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr;
    c.fillRect(ix, iy, iw, 18);
    c.strokeStyle = 'rgba(0,0,0,0.6)';
    c.lineWidth = 1.2;
    c.strokeRect(ix, iy, iw, ih);
    // đinh
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.beginPath();
    c.arc(1194, 107, 4.5, 0, TAU);
    c.fill();
    c.fillStyle = '#4a4740';
    c.beginPath();
    c.arc(1190, 104, 4.2, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,220,170,0.5)';
    c.beginPath();
    c.arc(1188.6, 102.8, 1.4, 0, TAU);
    c.fill();

    // 7. khay gỗ nhỏ dưới khung (y 650..680, không vượt 680)
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(KH.x + 10, KH.y + 10, KH.w, 20);
    poly(c, [[KH.x - 6, KH.y + 10], [KH.x + KH.w + 6, KH.y + 10], [KH.x + KH.w, KH.y], [KH.x, KH.y]], '#8c643a');
    gr = c.createLinearGradient(KH.x, 0, KH.x + KH.w, 0);
    gr.addColorStop(0, 'rgba(255,215,160,0.12)');
    gr.addColorStop(1, 'rgba(0,0,0,0.25)');
    poly(c, [[KH.x - 6, KH.y + 10], [KH.x + KH.w + 6, KH.y + 10], [KH.x + KH.w, KH.y], [KH.x, KH.y]], gr);
    gr = c.createLinearGradient(KH.x, 0, KH.x + KH.w, 0);
    gr.addColorStop(0, '#6a4828');
    gr.addColorStop(1, '#3e2915');
    c.fillStyle = gr;
    c.fillRect(KH.x - 6, KH.y + 10, KH.w + 12, 18);
    c.strokeStyle = 'rgba(40,24,10,0.3)';
    c.lineWidth = 0.6;
    for (let k = 0; k < 4; k++) {
      const yy = KH.y + 13 + k * 3.6 + R();
      c.beginPath();
      c.moveTo(KH.x - 4, yy);
      c.bezierCurveTo(KH.x + 150, yy + R() - 0.5, KH.x + 320, yy + R() - 0.5, KH.x + KH.w + 4, yy);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,215,160,0.30)';
    c.fillRect(KH.x - 6, KH.y + 10, KH.w + 12, 1.2);
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(KH.x - 6, KH.y + 27, KH.w + 12, 1);

    // 8. hạt phim + tối bốn góc (PRNG riêng, không dùng grain() của core)
    for (let i = 0; i < 9000; i++) {
      c.fillStyle = `rgba(255,255,255,${R() * 0.022})`;
      c.fillRect(R() * W, R() * H, 1.2, 1.2);
    }
    vignette(c, 0.72);

    bakeLeaf(0);
    bakeLeaf(1);
    ctBaked = true;
  }

  function ensureCT() {
    if (!ctBaked || ctC.width !== cv.width || ctC.height !== cv.height) bakeCuaTro();
  }

  function drawCuaTro(c, now) {
    ensureCT();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(ctC, 0, 0);
    setT(c);
    const ba = c.globalAlpha, t = now * 0.001;
    const mo = clamp(Number(CTR.mo) || 0, 0, 1);
    const v = clamp(Number(CTR.vantay) || 0, 0, 1);

    // đèn đường thở rất khẽ
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = ba * (0.05 + 0.015 * Math.sin(t * 2.3));
    c.drawImage(SPR.warm, -500, -100, 1100, 900);
    c.restore();

    // hai cánh kính trượt sang hai bên, khuất vào khung
    const slide = mo * LW * 0.94;
    c.save();
    c.beginPath();
    c.rect(OP.x, OP.y, OP.w, OP.h);
    c.clip();
    c.drawImage(LEAF[0][0], OP.x - slide, OP.y, LW, OP.h);
    c.drawImage(LEAF[1][0], OP.x + LW + slide, OP.y, LW, OP.h);
    c.restore();
    if (mo > 0.02) {
      const gap = slide * 2, mid = OP.x + LW;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * 0.22 * mo;
      c.drawImage(SPR.warm, mid - gap / 2 - 60, OP.y + 60, gap + 120, OP.h - 40);
      c.globalAlpha = ba * 0.38 * mo;
      c.drawImage(SPR.warm, mid - gap * 0.9 - 40, GROUND - 50, gap * 1.8 + 80, 110);
      c.restore();
    }

    // khoá từ trên đố ngang + đèn nhỏ đỏ/xanh
    c.fillStyle = '#232b35';
    c.fillRect(398, 148, 74, 13);
    c.fillStyle = 'rgba(255,205,150,0.18)';
    c.fillRect(398, 148, 74, 1.2);
    c.fillStyle = '#10151b';
    c.fillRect(398, 160, 74, 1.5);
    const green = CTR.den === 'xanh';
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = ba * (green ? 0.65 : 0.55 + 0.12 * Math.sin(t * 2.2));
    c.drawImage(green ? SPR.green : SPR.red, 452 - 22, 154 - 22, 44, 44);
    c.restore();
    c.fillStyle = green ? 'rgba(120,255,175,0.95)' : 'rgba(255,82,64,0.95)';
    c.beginPath();
    c.arc(452, 154, 2.8, 0, TAU);
    c.fill();

    // máy vân tay: ô quét thở xanh nhạt; chạm sai thì nháy đỏ theo CTR.vantay
    const idle = 0.5 + 0.5 * Math.sin(t * 1.6);
    c.strokeStyle = `rgba(110,190,210,${0.12 + 0.12 * idle})`;
    c.lineWidth = 1.4;
    roundRect(c, PAD.x + 1, PAD.y + 1, PAD.w - 2, PAD.h - 2, 9);
    c.stroke();
    if (v > 0.01) {
      c.fillStyle = `rgba(230,44,34,${0.78 * v})`;
      c.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
      c.strokeStyle = `rgba(255,70,52,${0.9 * v})`;
      c.lineWidth = 2;
      roundRect(c, PAD.x, PAD.y, PAD.w, PAD.h, 10);
      c.stroke();
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * 0.7 * v;
      c.drawImage(SPR.red, RD.x + RD.w / 2 - 90, RD.y + 66 - 90, 180, 180);
      c.restore();
    }
  }

  SC.cuatro = {
    bake: bakeCuaTro,
    enter() {
      ensureCT();
      if (typeof nudge === 'function') nudge();
    },
    draw: drawCuaTro,
    hot: CTR.hot,
  };
})();
