'use strict';
// BỘ CÂY cho cảnh đồi chè đêm trăng (Chương 23). Không chạy trong game: tools/sinh-nhat/tao-cay.mjs chạy tệp này trên canvas rồi lưu story/sinh-nhat/anh/cay.png.
// Cành mọc bằng thuật toán "mọc về phía ánh sáng" (space colonization): rải điểm hút trong hình tán, cành mọc dần về phía chúng,
// nên rẽ nhánh tự nhiên và không tràn khỏi tán. Độ dày cành theo quy luật ống: r^2.5 của cành mẹ = tổng r^2.5 các cành con.
// Lá vẽ thành chùm ở đầu cành; lá sâu trong tán tối hơn (khuất sáng), lá phía trên bên trái sáng hơn (hướng trăng).
// Tấm ảnh 2048×1024, 8 ô 512×512: 0 keo · 1 keo 2 · 2 bạch đàn · 3 cây tán tròn · 4 tre · 5 tre 2 · 6 cây xa (bóng mờ) · 7 bụi thấp.
(() => {
  const CELL = 512;
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const LX = -0.45, LY = -0.89; // hướng trăng (lên trên, lệch trái)

  function sc(R, env, opt) {
    // env(x, y) -> true nếu trong tán; opt: { base:[x,y], crownY, N, D, di, dk, up, bbox:[x0,y0,x1,y1] }
    const pts = [];
    const [x0, y0, x1, y1] = opt.bbox;
    let guard = 0;
    while (pts.length < opt.N && guard++ < opt.N * 60) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); if (env(x, y)) pts.push([x, y, 1]); }
    const nodes = [{ x: opt.base[0], y: opt.base[1], p: -1, ch: [], r: 0 }];
    // thân: mọc thẳng lên tới chân tán (lắc nhẹ)
    let cx = opt.base[0], cy = opt.base[1], ang = -Math.PI / 2 + (opt.lean || 0);
    while (cy > opt.crownY) {
      ang += (R() - 0.5) * 0.06; cx += Math.cos(ang) * opt.D; cy += Math.sin(ang) * opt.D;
      const pi = nodes.length - 1; nodes.push({ x: cx, y: cy, p: pi, ch: [], r: 0 }); nodes[pi].ch.push(nodes.length - 1);
    }
    const G = opt.di;
    for (let it = 0; it < 420; it++) {
      // lưới tăng tốc
      const grid = new Map();
      nodes.forEach((n, i) => { const k = ((n.x / G) | 0) + ',' + ((n.y / G) | 0); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
      const acc = new Map();
      let alive = 0;
      for (const p of pts) {
        if (!p[2]) continue; alive++;
        const gx = (p[0] / G) | 0, gy = (p[1] / G) | 0;
        let best = -1, bd = G * G;
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          const L = grid.get((gx + dx) + ',' + (gy + dy)); if (!L) continue;
          for (const i of L) { const n = nodes[i]; const d = (n.x - p[0]) ** 2 + (n.y - p[1]) ** 2; if (d < bd) { bd = d; best = i; } }
        }
        if (best < 0) continue;
        if (bd < opt.dk * opt.dk) { p[2] = 0; continue; }
        const n = nodes[best], l = Math.sqrt(bd);
        const a = acc.get(best) || [0, 0, 0];
        a[0] += (p[0] - n.x) / l; a[1] += (p[1] - n.y) / l; a[2]++; acc.set(best, a);
      }
      if (!alive || !acc.size) break;
      for (const [i, a] of acc) {
        const n = nodes[i];
        let dx = a[0] / a[2], dy = a[1] / a[2] + (opt.up || 0);
        const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        const nx = n.x + dx * opt.D, ny = n.y + dy * opt.D;
        // tránh mọc chồng
        if (n.ch.some((c) => Math.hypot(nodes[c].x - nx, nodes[c].y - ny) < opt.D * 0.3)) continue;
        nodes.push({ x: nx, y: ny, p: i, ch: [], r: 0 }); n.ch.push(nodes.length - 1);
      }
    }
    // độ dày theo quy luật ống
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (!n.ch.length) n.r = opt.r0; else { let s = 0; for (const c of n.ch) s += Math.pow(nodes[c].r, 2.5); n.r = Math.pow(s, 1 / 2.5); }
    }
    return nodes;
  }
  function veCanh(c, nodes, col, rimK) {
    c.lineCap = 'round';
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i], p = nodes[n.p];
      c.strokeStyle = col; c.lineWidth = Math.max(0.55, n.r * 2);
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(n.x, n.y); c.stroke();
    }
    if (rimK) for (let i = 1; i < nodes.length; i++) { // viền trăng mảnh bên trái thân/cành lớn
      const n = nodes[i], p = nodes[n.p]; if (n.r < 1.4) continue;
      c.strokeStyle = `rgba(150,160,165,${rimK})`; c.lineWidth = Math.max(0.5, n.r * 0.45);
      c.beginPath(); c.moveTo(p.x - n.r * 0.55, p.y); c.lineTo(n.x - n.r * 0.55, n.y); c.stroke();
    }
  }
  // lá: hình dạng theo loài; độ sáng theo hướng trăng + độ sâu trong tán
  function veLa(c, x, y, w, h, rot, v, al, kieu) {
    const k = Math.max(0, Math.min(1, v));
    const r = 10 + 70 * k, g = 17 + 82 * k, b = 18 + 78 * k;
    c.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${al})`;
    c.save(); c.translate(x, y); c.rotate(rot); c.beginPath();
    if (kieu === 'thon') { c.moveTo(-w, 0); c.quadraticCurveTo(0, -h, w, 0); c.quadraticCurveTo(0, h, -w, 0); }
    else c.ellipse(0, 0, w, h, 0, 0, 6.2832);
    c.fill(); c.restore();
  }
  function tanLa(c, R, nodes, env, opt) {
    // độ sâu trong tán: khoảng cách tới mép tán (dò 12 hướng)
    const depth = (x, y) => { let m = 1e9; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; let d = 0; while (d < 160 && env(x + Math.cos(a) * d, y + Math.sin(a) * d)) d += 6; m = Math.min(m, d); } return m; };
    const items = [];
    for (const n of nodes) {
      if (n.r > opt.laMaxR) continue;
      const cnt = opt.laN * (n.ch.length ? 0.35 : 1);
      for (let i = 0; i < cnt; i++) {
        const rr = Math.pow(R(), 0.7) * opt.chum, aa = R() * 6.2832;
        const x = n.x + Math.cos(aa) * rr * 1.2, y = n.y + Math.sin(aa) * rr * 0.85 + (opt.ru || 0) * rr;
        items.push([x, y, R()]);
      }
    }
    items.sort((p, q) => p[2] - q[2]);
    const cx = opt.cx, cy = opt.cy, rad = opt.rad;
    for (const p of items) {
      const dx = (p[0] - cx) / rad, dy = (p[1] - cy) / rad;
      const huong = Math.max(0, -(dx * LX + dy * LY)) ;         // phía trăng
      const sau = Math.min(1, depth(p[0], p[1]) / opt.sauMax);  // 0 ở mép, 1 sâu trong tán
      const v = (0.06 + 0.62 * Math.pow(huong, 0.8)) * (1 - 0.75 * sau) * (0.55 + 0.45 * p[2]) + 0.03;
      const w = opt.laW * (0.6 + R() * 0.8), h = opt.laH * (0.6 + R() * 0.8);
      veLa(c, p[0], p[1], w, h, opt.rot != null ? opt.rot + (R() - 0.5) * 0.9 : R() * 3.14, v, 0.95, opt.kieu);
    }
  }
  function blob(cx, cy, rx, ry, R, k, lobes) { // hình tán không đều (nhiều thùy)
    const ph = [], am = [];
    for (let i = 0; i < lobes; i++) { ph.push(R() * 6.28); am.push((R() - 0.5) * k); }
    return (x, y) => {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, a = Math.atan2(dy, dx);
      let r = 1; for (let i = 0; i < lobes; i++) r += am[i] * Math.cos(a * (i + 2) + ph[i]);
      return dx * dx + dy * dy < r * r;
    };
  }
  function cayTan(c, R, ox, oy, kind) {
    const W = CELL, X = ox + W / 2, B = oy + W - 6;
    let env, opt, la, col = 'rgb(22,21,19)';
    if (kind === 'keo') { // keo: thân thẳng mảnh, tán xoè thưa nhiều chùm, hơi lệch
      const cx = X + (R() - 0.5) * 50, cy = oy + 150;
      const e1 = blob(cx, cy, 175, 105, R, 0.5, 5), e2 = blob(cx - 60, cy + 40, 90, 70, R, 0.5, 4), e3 = blob(cx + 80, cy + 30, 85, 60, R, 0.5, 4);
      env = (x, y) => (e1(x, y) || e2(x, y) || e3(x, y)) && y > oy + 18 && x > ox + 12 && x < ox + W - 12;
      opt = { base: [X, B], crownY: oy + 250, N: 760, D: 7, di: 70, dk: 12, up: -0.05, r0: 0.55, bbox: [ox, oy, ox + W, oy + 320], lean: (R() - 0.5) * 0.08 };
      la = { laN: 26, chum: 19, laW: 4.4, laH: 1.9, laMaxR: 1.5, sauMax: 55, kieu: 'thon', cx, cy, rad: 180 };
    } else if (kind === 'bachdan') { // bạch đàn: rất cao, thân thẳng, tán hẹp thưa, lá rủ
      const cx = X, cy = oy + 150;
      const e1 = blob(cx, cy, 80, 135, R, 0.6, 5);
      env = (x, y) => e1(x, y) && y > oy + 10;
      opt = { base: [X, B], crownY: oy + 260, N: 260, D: 7, di: 60, dk: 12, up: -0.15, r0: 0.5, bbox: [ox, oy, ox + W, oy + 300] };
      la = { laN: 16, chum: 14, laW: 5, laH: 1.15, laMaxR: 1.4, sauMax: 40, kieu: 'thon', rot: 1.35, ru: 0.6, cx, cy, rad: 140 };
      col = 'rgb(46,45,42)';
    } else if (kind === 'tron') { // cây bóng mát cạnh trại: tán tròn dày
      const cx = X, cy = oy + 210;
      const e1 = blob(cx, cy, 205, 160, R, 0.28, 6);
      env = (x, y) => e1(x, y) && y > oy + 14 && x > ox + 8 && x < ox + W - 8;
      opt = { base: [X, B], crownY: oy + 340, N: 900, D: 7, di: 60, dk: 11, up: -0.02, r0: 0.6, bbox: [ox, oy, ox + W, oy + 400] };
      la = { laN: 24, chum: 16, laW: 3.1, laH: 1.9, laMaxR: 1.6, sauMax: 70, kieu: 'tron', cx, cy, rad: 210 };
    } else if (kind === 'xa') { // hàng cây xa: bóng gần như đặc, mép lởm chởm
      const cx = X, cy = oy + 250;
      const e1 = blob(cx, cy, 220, 150, R, 0.45, 7);
      env = (x, y) => e1(x, y) && y > oy + 30;
      opt = { base: [X, B], crownY: oy + 380, N: 700, D: 8, di: 60, dk: 12, up: -0.04, r0: 0.6, bbox: [ox, oy, ox + W, oy + 420] };
      la = { laN: 10, chum: 18, laW: 4.5, laH: 3.2, laMaxR: 1.8, sauMax: 90, kieu: 'tron', cx, cy, rad: 220 };
    } else { // bụi thấp
      const cx = X, cy = oy + 400;
      const e1 = blob(cx, cy, 200, 95, R, 0.4, 6);
      env = (x, y) => e1(x, y) && y < B - 10;
      opt = { base: [X, B], crownY: oy + 470, N: 500, D: 6, di: 50, dk: 10, up: -0.02, r0: 0.5, bbox: [ox, oy + 250, ox + W, oy + W] };
      la = { laN: 10, chum: 14, laW: 4, laH: 2.5, laMaxR: 1.5, sauMax: 50, kieu: 'tron', cx, cy, rad: 200 };
    }
    const nodes = sc(R, env, opt);
    veCanh(c, nodes, col, 0.28);
    tanLa(c, R, nodes, env, la);
  }
  function tre(c, R, ox, oy, k2) {
    // bụi tre: nhiều thân từ một gốc, vồng ra như vòi phun, ngọn rủ; lá thon thành chùm dày dần về phía ngọn
    const W = CELL, gx = ox + W / 2, gy = oy + W - 4;
    const n = 34, culms = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), side = (t - 0.5) * 2;
      const L = (430 + R() * 90) * (1 - Math.abs(side) * 0.16) * k2;
      culms.push({ x0: gx + side * 22 + (R() - 0.5) * 8, a0: -Math.PI / 2 + side * 0.32 + (R() - 0.5) * 0.08, bend: side * (0.9 + R() * 0.5) + (R() - 0.5) * 0.3, L, w: 3.4 + R() * 1.5 });
    }
    const sprays = [];
    c.lineCap = 'round';
    for (const k of culms) {
      let x = k.x0, y = gy, a = k.a0;
      const seg = 40;
      for (let j = 0; j < seg; j++) {
        const t = j / seg;
        a += k.bend * 0.0024 * Math.pow(t * 2.4, 2.2) * 6;
        let nx = x + Math.cos(a) * k.L / seg, ny = y + Math.sin(a) * k.L / seg;
        nx = Math.max(ox + 6, Math.min(ox + W - 6, nx)); ny = Math.max(oy + 8, ny);
        c.strokeStyle = 'rgb(28,33,26)'; c.lineWidth = Math.max(0.55, k.w * (1 - t * 0.8));
        c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke();
        if (j % 6 === 0 && t < 0.6) { c.strokeStyle = 'rgba(60,66,52,0.8)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(nx - k.w, ny); c.lineTo(nx + k.w, ny); c.stroke(); } // đốt tre
        if (t > 0.34) sprays.push([nx, ny, a, t]);
        x = nx; y = ny;
      }
    }
    const cx = gx, cy = oy + 170, rad = 230;
    sprays.sort(() => R() - 0.5);
    for (const p of sprays) {
      const m = Math.floor(2 + p[3] * 5 * R());
      for (let i = 0; i < m; i++) {
        // nhánh nhỏ chĩa ngang rồi rủ, mỗi nhánh một quạt lá
        const ba = p[2] + (R() < 0.5 ? 1 : -1) * (0.9 + R() * 0.6);
        const bl = 8 + R() * 14;
        const bx = p[0] + Math.cos(ba) * bl, by = p[1] + Math.sin(ba) * bl + 4;
        const fan = 3 + Math.floor(R() * 4);
        for (let f = 0; f < fan; f++) {
          const la2 = Math.PI * 0.5 + (f - fan / 2) * 0.32 + (R() - 0.5) * 0.4 + (ba > 0 ? 0.25 : -0.25);
          const len = 9 + R() * 8;
          const x = bx + Math.cos(la2) * len * 0.55, y = by + Math.sin(la2) * len * 0.55;
          const dx = (x - cx) / rad, dy = (y - cy) / rad;
          const v = (0.06 + 0.58 * Math.max(0, -(dx * LX + dy * LY)) ) * (0.45 + 0.55 * R()) * (0.55 + 0.45 * p[3]) + 0.03;
          veLa(c, x, y, len * 0.5, 1.25, la2, v, 0.93, 'thon');
        }
      }
    }
  }
  function ve(cv) {
    cv.width = CELL * 4; cv.height = CELL * 2;
    const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    const plan = [['keo', 11], ['keo', 23], ['bachdan', 5], ['tron', 7], ['tre', 3], ['tre', 41], ['xa', 77], ['thap', 9]];
    plan.forEach((p, i) => {
      const ox = (i % 4) * CELL, oy = Math.floor(i / 4) * CELL;
      c.save(); c.beginPath(); c.rect(ox, oy, CELL, CELL); c.clip();
      const R = rng(p[1]);
      if (p[0] === 'tre') tre(c, R, ox, oy, p[1] === 3 ? 1 : 0.86); else cayTan(c, R, ox, oy, p[0]);
      c.restore();
    });
    return cv;
  }
  window.SN_CAY = { ve, CELL };
})();
