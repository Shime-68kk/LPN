// Chương 19 · Sợi chỉ (bản 7, kịch bản: _kich-ban-chuong-19.md). Hai căn nhà, không vẽ người, không chia đôi màn hình.
// Gửi tin = kéo chỉ từ điện thoại ra cửa. Nhận tin = cuộn chỉ về (chờ càng lâu, búi chỉ càng to).
// Bản dựng thử hiện có: mở đầu (hành lang, cái kết bị cắt dở) → Lần 1 (phòng anh, đêm) → Lần 2 (phòng em, 5 giờ sáng).
// Xem thử từ giữa: ?canh=1 (Lần 1), ?canh=2 (Lần 2).
// Vẽ: soi-chi-ve.js. Âm thanh: soi-chi-am.js.
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const A = window.SoiChiAm, V = window.SoiChiVe;
  const Q = new URLSearchParams(location.search);
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;
  const lin = (t) => t;
  const near = (p, q, r) => Math.hypot(p.x - q.x, p.y - q.y) < r;

  // ---------- Ai được vào ----------
  // OPEN_AT: giờ mở cho mọi máy (null = chưa mở). Máy anh Quang, máy chủ thử trong nhà và link ?mo=q0608 vào trước.
  const OPEN_AT = '2026-11-05T23:15:00+07:00';
  const WHO = ls.get('lpn:who');
  const LIVE = location.hostname.endsWith('workers.dev');
  if (Q.get('mo') === 'q0608') { try { sessionStorage.setItem('lpn:soichi-mo', '1'); } catch (e) { /* bỏ qua */ } }
  const peek = (() => { try { return sessionStorage.getItem('lpn:soichi-mo') === '1'; } catch (e) { return false; } })();
  const OPEN = !LIVE || WHO === 'quang' || peek || (OPEN_AT && Date.now() >= Date.parse(OPEN_AT));

  const { W, H, X0, Y0, BW, BH } = V;

  // ================= Màn hình, camera =================
  const cv = $('cv'), cx = cv.getContext('2d');
  let cw = 1, ch = 1, dpr = 1, S = 1, caches = {}, cacheRes = 0, vig = null, grainPat = null;
  const view = { x: 500, y: 230, z: 1 };
  let VW = { x: 500, y: 230, z: 1 };
  function resize() {
    cw = innerWidth; ch = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    // Phủ kín màn hình, nhưng không cắt quá rộng (luôn thấy ít nhất ~860 đơn vị bề ngang: đủ cả hai cánh cửa)
    // và không lộ ra ngoài phần nền đã vẽ (cao tối đa BH).
    S = Math.max(ch / BH, Math.min(Math.max(cw / W, ch / H), cw / 860));
    // Thanh địa chỉ Safari hiện / ẩn làm đổi cỡ liên tục: chỉ vẽ lại ảnh nền khi độ nét đổi đáng kể
    const res = clamp(S * dpr * 1.2, 1, 2.1);
    if (!cacheRes || Math.abs(res - cacheRes) / cacheRes > 0.18) { caches = {}; cacheRes = res; }
    vig = null;
    $('rotate').hidden = !(innerHeight > innerWidth && matchMedia('(pointer: coarse)').matches);
  }
  addEventListener('resize', resize);
  function bgOf(room, v) {
    const k = room + ':' + v;
    if (caches[k]) return caches[k];
    const res = cacheRes || clamp(S * dpr * 1.2, 1, 2.1), c = document.createElement('canvas');
    c.width = Math.ceil(BW * res); c.height = Math.ceil(BH * res);
    const g = c.getContext('2d'); g.setTransform(res, 0, 0, res, -X0 * res, -Y0 * res);
    V.rooms[room].bg(g, v);
    return (caches[k] = c);
  }
  function makeVignette() {
    const c = document.createElement('canvas'); c.width = Math.ceil(cw); c.height = Math.ceil(ch);
    const g = c.getContext('2d'), r = Math.hypot(cw, ch) / 2;
    const gr = g.createRadialGradient(cw / 2, ch / 2, r * 0.35, cw / 2, ch / 2, r);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.7, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,.85)');
    g.fillStyle = gr; g.fillRect(0, 0, cw, ch); return c;
  }
  const grainCv = (() => {
    const n = 200, c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'), im = g.createImageData(n, n);
    for (let i = 0; i < n * n; i++) { const v = Math.random() * 255 | 0; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  })();

  // ================= Trạng thái =================
  const st = { room: 'H', v: 'n', v2: null, mix: 0, lamp: true, tube: false, sec: 0, fade: 1, bars: 0, vign: 0.6, doorGlow: { A: 0, B: 0 }, hint: null, fold: 0 };
  // Cửa giữa hai nhà: nhà anh cửa bên phải, nhà em cửa bên trái (đi sang phải là sang nhà em). Sợi chỉ luồn qua khe dưới cửa.
  const DOOR = {
    A: { x: 847, gy: 371, side: 1, col: [150, 190, 255], hit: { x: 847, y: 262, r: 78 } },
    B: { x: 152, gy: 371, side: -1, col: [196, 170, 255], hit: { x: 152, y: 262, r: 78 } },
    // Phố: lối sang nhà em là con ngõ tối bên phải. Phòng học bên em: cửa bên trái như phòng ngủ.
    P: { x: 848, gy: 371, side: 1, col: [255, 196, 140], hit: { x: 848, y: 280, r: 74 } },
    L: { x: 152, gy: 371, side: -1, col: [196, 170, 255], hit: { x: 152, y: 262, r: 78 } },
  };
  const BASE = { A: 420, B: 422, H: 420, P: 410, L: 420 };
  const SURF = { A: [{ x0: 464, x1: 662, y: 310 }, { x0: 398, x1: 472, y: 297 }], B: [{ x0: 306, x1: 586, y: 317 }, { x0: 316, x1: 376, y: 301 }], H: [], P: [{ x0: 578, x1: 652, y: 344 }], L: [{ x0: 344, x1: 786, y: 292 }] };
  const phones = {
    P: { x: 585, y: 344, ang: -0.15, mode: 'up', scr: 'chat', glow: 1, msgs: [{ me: true, col: 'q' }, { col: 't' }, { me: true, col: 'q' }, { col: 't' }, { col: 't' }] },
    L: { x: 482, y: 292, ang: -0.22, mode: 'up', scr: 'chat', glow: 1, msgs: [{ col: 'q' }, { me: true, col: 't' }, { col: 'q' }, { col: 'q' }], stash: { x: 260, y: 300 } },
    H: { x: 338, y: 289, ang: -0.2, mode: 'up', scr: 'call', glow: 1, lightCol: [255, 205, 222] },
    A: { x: 588, y: 310, ang: -0.28, mode: 'up', scr: 'chat', glow: 1, msgs: [{ col: 't' }, { col: 't' }, { me: true, col: 'q' }, { col: 't' }, { me: true, col: 'q' }, { me: true, col: 'q' }] },
    B: { x: 360, y: 300, ang: -0.32, mode: 'up', scr: 'chat', glow: 0, msgs: [{ me: true, col: 't' }, { col: 'q' }, { me: true, col: 't' }], stash: { x: 258, y: 316 } },
  };
  // Máy anh (phòng, phố) chung một khung chat; máy em (chỗ ngủ, phòng học, hành lang) chung một khung chat.
  phones.P.msgs = phones.A.msgs; phones.L.msgs = phones.B.msgs; phones.H.msgs = phones.B.msgs;
  const ropes = { A: [], B: [], H: [], P: [], L: [] };
  const extras = [];
  const under = { A: [], B: [], H: [], P: [], L: [] };
  function setRoom(r, v) {
    for (const k in caches) if (!k.startsWith(r + ':')) delete caches[k];
    st.room = r; st.v = v; st.v2 = null; st.mix = 0;
  }
  function laneY(room, x, base) {
    const d = DOOR[room]; if (!d) return base;
    const u = clamp((Math.abs(x - d.x) - 6) / 150, 0, 1), s = u * u * (3 - 2 * u);
    return lerp(d.gy, base, s);
  }
  function anchorOf(ph) {
    if (ph.hidden) return ph.stash;
    if (ph.mode === 'down') return { x: ph.x + 14, y: ph.y - 2 };
    return { x: ph.x, y: ph.y };
  }

  // ================= Tween, camera, mờ =================
  let NOW = performance.now() / 1000;
  const tws = [], waits = [];
  function tween(sec, fn, ease = easeIO, tag) {
    if (tag) for (const t of tws) if (t.tag === tag) t.dead = true;
    return new Promise((res) => tws.push({ t0: NOW, d: Math.max(0.001, sec), fn, ease, res, tag }));
  }
  const waitFor = (fn) => new Promise((res) => waits.push({ fn, res }));
  function camTo(x, y, z, sec, e = easeIO) { const a = { x: view.x, y: view.y, z: view.z }; return tween(sec, (k) => { view.x = lerp(a.x, x, k); view.y = lerp(a.y, y, k); view.z = lerp(a.z, z, k); }, e, 'cam'); }
  function fadeTo(v, sec) { const a = st.fade; return tween(sec, (k) => { st.fade = lerp(a, v, k); }, easeIO, 'fade'); }
  function setVariant(v, sec) { st.v2 = v; st.mix = 0; return tween(sec, (k) => { st.mix = k; }, lin, 'var').then(() => { if (st.v2 === v) { st.v = v; st.v2 = null; st.mix = 0; } }); }

  // ================= Sợi chỉ (dây Verlet) =================
  class Rope {
    constructor(o) { Object.assign(this, { col: 'q', seg: 9, room: st.room, base: 420, a: null, b: null, pts: [], beads: [], alpha: 1, coil: null, feed: null }, o); }
    static pt(x, y) { return { x, y, px: x, py: y }; }
    line(x0, y0, x1, y1, slack = 1.1) {
      const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(d * slack / this.seg) + 1);
      this.pts = [];
      for (let i = 0; i < n; i++) { const u = i / (n - 1); this.pts.push(Rope.pt(lerp(x0, x1, u), lerp(y0, y1, u) + Math.sin(u * Math.PI) * d * 0.12)); }
      return this;
    }
    len() { let L = 0; for (let i = 1; i < this.pts.length; i++) L += Math.hypot(this.pts[i].x - this.pts[i - 1].x, this.pts[i].y - this.pts[i - 1].y); return L; }
    at(u) {
      const P = this.pts, L = this.len() * clamp(u, 0, 1); let acc = 0;
      for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); if (acc + d >= L) { const k = d ? (L - acc) / d : 0; return { x: lerp(P[i - 1].x, P[i].x, k), y: lerp(P[i - 1].y, P[i].y, k) }; } acc += d; }
      return { x: P[P.length - 1].x, y: P[P.length - 1].y };
    }
    step(dt) {
      let P = this.pts; if (P.length < 2) return;
      const A1 = this.a && this.a(), B1 = this.b && this.b(), surf = SURF[this.room] || [];
      if (this.grow && A1 && B1 && (P.length - 1) * this.seg < Math.hypot(B1.x - A1.x, B1.y - A1.y) * 1.25 && P.length < 320) P.splice(1, 0, Rope.pt(P[0].x, P[0].y));
      const n = P.length;
      for (const p of P) { const vx = (p.x - p.px) * 0.965, vy = (p.y - p.py) * 0.965; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + 0.3; }
      for (let it = 0; it < 16; it++) {
        if (A1) { P[0].x = A1.x; P[0].y = A1.y; }
        if (B1) { P[n - 1].x = B1.x; P[n - 1].y = B1.y; }
        for (let i = 0; i < n - 1; i++) {
          const p = P[i], q = P[i + 1], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1e-6;
          const wp = i === 0 && A1 ? 0 : 1, wq = i + 1 === n - 1 && B1 ? 0 : 1, ws = wp + wq; if (!ws) continue;
          const m = (d - this.seg) / d / ws;
          p.x += dx * m * wp; p.y += dy * m * wp; q.x -= dx * m * wq; q.y -= dy * m * wq;
        }
        for (const p of P) {
          const ly = laneY(this.room, p.x, this.base);
          if (p.y > ly) p.y = ly;
          for (const s of surf) if (p.x > s.x0 && p.x < s.x1 && p.py <= s.y + 0.6 && p.y > s.y) p.y = s.y;
        }
      }
      for (const p of P) if (p.y >= laneY(this.room, p.x, this.base) - 0.4) p.px = lerp(p.px, p.x, 0.3);
      for (const b of this.beads) b.u += b.dir * b.speed * dt / Math.max(40, this.len());
      for (const b of this.beads.filter((x) => x.u > 1 || x.u < 0)) { this.beads.splice(this.beads.indexOf(b), 1); if (b.end) b.end(); }
    }
    bead(dir, col, speed, end) { this.beads.push({ u: dir > 0 ? 0 : 1, dir, col, speed, end }); }
    twang() { this.vt = NOW; }
    draw(c) {
      if (this.coil) {
        if (this.feed) V.strokeThread(c, [this.feed, { x: lerp(this.feed.x, this.coil.x, 0.5), y: this.feed.y + 6 }, this.coil], this.col, this.alpha, 0.9);
        V.coil(c, this.coil.x, this.coil.y, this.coil.frac, this.col, this.coil.seed, this.coil.max);
      }
      let P = this.pts;
      const age = NOW - (this.vt || -99), amp = age < 3 ? 5.5 * Math.exp(-age * 1.6) : 0;
      if (amp > 0.05 && P.length > 2) {
        const n = P.length;
        P = P.map((p, i) => {
          if (i === 0 || i === n - 1) return p;
          const a = P[i - 1], b = P[i + 1], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1, u = i / (n - 1);
          const o = amp * Math.sin(Math.PI * u) * Math.sin(age * Math.PI * 2 * 6.5);
          return { x: p.x - ty / l * o, y: p.y + tx / l * o };
        });
      }
      V.strokeThread(c, P, this.col, this.alpha * (1 - 0.72 * (this.dim || 0)), 1 - 0.35 * (this.dim || 0));
      // vừa bị chạm: loé sáng rồi tắt dần, để người chơi biết mình đã chạm trúng
      if (age < 1.6) { const k = Math.exp(-age * 2.4) * this.alpha; V.strokeThread(c, P, this.col, k, 2.8); V.strokeThread(c, P, [255, 245, 250], 0.55 * k, 0.9); }
      for (const b of this.beads) { const p = this.at(b.u); V.bead(c, p.x, p.y, b.col, this.alpha); }
    }
  }

  // ================= Chạm, kéo =================
  let handler = null, lastTap = 0, reelSeen = false;
  function toWorld(e) {
    const r = cv.getBoundingClientRect(), k = S * VW.z;
    return { x: (e.clientX - r.left - cw / 2) / k + VW.x, y: (e.clientY - r.top - ch / 2) / k + VW.y };
  }
  // Sợi chỉ gần chỗ chạm nhất (bán kính tính theo điểm ảnh trên màn hình, ngón tay hay chuột đều dễ trúng)
  function ropeNear(p, px = 34) {
    const r = px / (S * VW.z); let best = null, bd = r;
    for (const rope of ropes[st.room]) for (const q of rope.pts) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = rope; } }
    return best;
  }
  let lastPluck = 0;
  function pluckAt(p) {
    const r = ropeNear(p);
    if (!r || NOW - lastPluck < 0.12) return false;
    lastPluck = NOW; r.twang();
    const D = DOOR[st.room]; A.ks([587.3, 659.3, 740, 880][Math.floor(Math.random() * 4)], 0.06, D ? clamp((p.x - 500) / 500, -0.8, 0.8) : 0);
    return true;
  }
  // Vòng sáng nhỏ ở chỗ ngón tay chạm (toạ độ màn hình)
  const taps = [];
  function drawTaps(c) {
    for (const p of taps.slice()) {
      const a = NOW - p.t; if (a > 0.7) { taps.splice(taps.indexOf(p), 1); continue; }
      const k = a / 0.7, r = 8 + 26 * (1 - Math.pow(1 - k, 2));
      c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(255,190,212,' + (0.55 * (1 - k)) + ')'; c.lineWidth = 2 * (1 - k) + 0.5;
      c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.stroke();
      V.glow(c, p.x, p.y, 18, [255, 200, 220], 0.35 * (1 - k));
      c.restore();
    }
  }
  cv.addEventListener('pointerdown', (e) => {
    A.resume();
    { const r0 = cv.getBoundingClientRect(); taps.push({ x: e.clientX - r0.left, y: e.clientY - r0.top, t: NOW }); }
    try { cv.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ }
    const p = toWorld(e);
    if (!(handler && handler.reel) && !MAP.on) pluckAt(p);
    const r = cv.getBoundingClientRect();
    if (handler && handler.down) handler.down(p, { x: e.clientX - r.left, y: e.clientY - r.top });
  });
  cv.addEventListener('pointermove', (e) => {
    const p = toWorld(e);
    if (handler && handler.move) handler.move(p);
    if (e.pointerType === 'mouse' && !e.buttons && !cv.className) {
      const hp = st.hint && st.hint.on ? (typeof st.hint.at === 'function' ? st.hint.at() : st.hint.at) : null;
      cv.style.cursor = ropeNear(p) || (handler && handler.reel) || (hp && Math.hypot(hp.x - p.x, hp.y - p.y) < 50) ? 'pointer' : '';
    }
  });
  const upFn = (e) => { if (handler && handler.up) handler.up(toWorld(e)); };
  cv.addEventListener('pointerup', upFn); cv.addEventListener('pointercancel', upFn);
  // iPhone: chạm nhanh hai lần hay chụm hai ngón sẽ phóng to cả trang → chặn
  ['gesturestart', 'gesturechange', 'dblclick'].forEach((n) => document.addEventListener(n, (e) => e.preventDefault(), { passive: false }));

  // Gợi ý: vòng sáng hiện sau ring giây, dòng chữ nhỏ sau text giây (chỉ khi người chơi đứng lâu)
  const hintEl = $('hint');
  let hintId = null;
  function hint(at, text, o = {}) {
    clearHint();
    const id = (hintId = {});
    st.hint = { at, on: false, r: o.r || 22, text };
    setTimeout(() => { if (hintId === id && st.hint) st.hint.on = true; }, (o.ring == null ? 1.6 : o.ring) * 1000);
    if (text) setTimeout(() => { if (hintId === id) { hintEl.textContent = text; hintEl.classList.add('on'); } }, (o.text == null ? 7 : o.text) * 1000);
  }
  function clearHint() { hintId = null; st.hint = null; hintEl.classList.remove('on'); }

  // Chạm vào một chỗ (hit null: chạm đâu cũng được, vòng gợi ý đặt ở o.at)
  function tapOn(hit, text, o = {}) {
    return new Promise((res) => {
      hint(o.at || hit, text, o);
      handler = {
        down(p) {
          if (NOW - lastTap < 0.22) return;
          if (hit && !near(p, hit, hit.r)) return;
          lastTap = NOW; handler = null; clearHint(); res(p);
        },
      };
    });
  }
  // Kéo điện thoại tới một chỗ
  function dragPhone(ph, target, text) {
    return new Promise((res) => {
      const home = { x: ph.x, y: ph.y, ang: ph.ang }, grabAt = () => ({ x: ph.x, y: ph.y - 15 });
      hint(grabAt, text);
      let g = null;
      handler = {
        down(p) { if (!near(p, grabAt(), 44)) return; g = { dx: ph.x - p.x, dy: ph.y - p.y }; clearHint(); st.hint = { at: target, on: true, r: 28 }; cv.className = 'grabbing'; A.swish('c', 0.05); },
        move(p) { if (!g) return; ph.x = p.x + g.dx; ph.y = p.y + g.dy; ph.ang = lerp(ph.ang, -0.08, 0.15); },
        up() {
          if (!g) return; g = null; cv.className = ''; st.hint = null;
          if (near(ph, target, target.r)) {
            handler = null; const a = { x: ph.x, y: ph.y };
            tween(0.22, (k) => { ph.x = lerp(a.x, target.x, k); ph.y = lerp(a.y, target.y, k); }).then(res);
          } else {
            const a = { x: ph.x, y: ph.y, ang: ph.ang };
            tween(0.35, (k) => { ph.x = lerp(a.x, home.x, k); ph.y = lerp(a.y, home.y, k); ph.ang = lerp(a.ang, home.ang, k); }, easeOut);
            hint(grabAt, text, { ring: 0.4, text: 2 });
          }
        },
      };
    });
  }
  // Gửi tin: kéo đầu sợi chỉ từ điện thoại ra tới khe cửa. Thả ở cửa thì từng hạt tin chạy đi.
  function sendThread(ph, n, col, text) {
    const room = st.room, D = DOOR[room], pan = D.side * 0.55;
    return new Promise((res) => {
      const anc = () => anchorOf(ph);
      hint(anc, text, { text: 6 });
      let rope = null, finger = null;
      handler = {
        down(p) {
          const a = anc();
          if (!near(p, a, 50) && !near(p, { x: ph.x, y: ph.y - 15 }, 40)) return;
          clearHint(); cv.className = 'grabbing';
          finger = { x: p.x, y: p.y };
          rope = new Rope({ col, room, base: BASE[room], a: anc, b: () => finger });
          rope.pts = [Rope.pt(a.x, a.y), Rope.pt(p.x, p.y)];
          ropes[room].push(rope);
          st.hint = { at: { x: D.x, y: D.gy - 12 }, on: true, r: 30 };
          A.swish(D.side > 0 ? 'r' : 'l', 0.06);
        },
        move(p) {
          if (!rope) return;
          finger.x = p.x; finger.y = p.y;
          const P = rope.pts;
          while (P.length < 320) {
            const q = P[P.length - 2], d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d <= rope.seg) break;
            P.splice(P.length - 1, 0, Rope.pt(q.x + (p.x - q.x) / d * rope.seg, q.y + (p.y - q.y) / d * rope.seg));
          }
        },
        up(p) {
          if (!rope) return;
          cv.className = ''; st.hint = null;
          if (Math.abs(p.x - D.x) < 85 && p.y > 220) {
            handler = null; const r = rope;
            r.b = () => ({ x: D.x, y: D.gy }); r.grow = true;
            (async () => {
              for (let i = 0; i < n; i++) {
                ph.msgs = ph.msgs || []; ph.msgs.push({ me: true, col });
                A.vut(pan * 0.6, i);
                r.bead(1, col, 340, () => A.clockTick(pan, 0.012));
                await sleep(330);
              }
              ph.status = 'Đã gửi';
              await sleep(1500);
              r.old = true; tween(2.2, (k) => { r.dim = k; });
              res(r);
            })();
          } else {
            const r = rope; rope = null;
            tween(0.35, (k) => { r.alpha = 1 - k; }).then(() => { ropes[room] = ropes[room].filter((x) => x !== r); });
            hint(anc, text, { ring: 0.4, text: 2.5 });
          }
        },
      };
    });
  }
  // Nhận tin: cuộn chỉ về. Chỉ tính những cú kéo về phía điện thoại. pulls: số lượt (chờ càng lâu càng nhiều)
  function reelIn(rope, ph, pulls, n, col, text, o = {}) {
    const room = st.room, D = DOOR[room], pan = D.side * 0.4;
    return new Promise((res) => {
      const dir = Math.sign(ph.x - D.x) || 1;
      // Lần đầu nhận tin: hướng dẫn rõ ngay (đốm sáng tự chạy dọc sợi chỉ về phía điện thoại, chữ hiện sớm).
      // Những lần sau người chơi đã quen: chỉ gợi ý khi đứng lâu.
      const first = !reelSeen; reelSeen = true;
      hint(() => rope.at(0.66), text, { ring: first ? 0.8 : 1.6, text: first ? 4.6 : 6, r: 26 });
      let acc = 0, done = 0, last = null, idle = 0, moved = 0;
      // Ngón tay ma: một chấm sáng gõ nhẹ lên sợi chỉ hai cái liền, mỗi cái toả một vòng (như chạm mẫu), rồi nghỉ
      const demo = (c, t) => {
        if (last || done >= pulls || t - demoT0 < (first ? 0.8 : 4)) return;
        const p = rope.at(0.62), k = ((t - demoT0) * 0.7) % 1;
        for (const off of [0, 0.22]) {
          const u = (k - off) / 0.3; if (u < 0 || u > 1) continue;
          c.save(); c.strokeStyle = 'rgba(255,255,255,' + 0.7 * (1 - u) + ')'; c.lineWidth = 1.4; c.beginPath(); c.arc(p.x, p.y, 4 + u * 20, 0, 7); c.stroke(); c.restore();
          V.glow(c, p.x, p.y, 10, [255, 255, 255], 0.7 * (1 - u));
        }
      };
      const demoT0 = NOW; extras.push(demo);
      const nudge = () => { idle = NOW; setTimeout(() => { if (handler && handler.reel && !last && NOW - idle > 3.4 && done < pulls) { hintEl.textContent = 'Chạm tiếp, tới khi sợi chỉ căng'; hintEl.classList.add('on'); } }, 3500); };
      handler = {
        reel: true,
        down(p) { last = p; moved = 0; clearHint(); cv.className = 'grabbing'; },
        move(p) {
          if (!last) return;
          const d = Math.hypot(p.x - last.x, p.y - last.y); last = p; moved += d; acc += d;
          if (acc >= 55) { acc = 0; pull(); }
        },
        up() { if (last && moved < 14) pull(); last = null; cv.className = ''; if (done > 0 && done < pulls) nudge(); },
      };
      function pull() {
        if (done >= pulls) return;
        done++; rope.twang();
        rope.coil.frac = 1 - done / pulls;
        A.rasp(done, pan);
        for (const q of rope.pts) { q.px -= dir * 2.4; q.py += 0.6; }
        if (done >= pulls) { handler = null; cv.className = ''; extras.splice(extras.indexOf(demo), 1); clearHint(); finish(); }
      }
      async function finish() {
        if (o.before) o.before();
        rope.coil = null; rope.feed = null;
        const a0 = rope.a(); rope.a = () => ({ x: D.x, y: D.gy });
        rope.pts.unshift(Rope.pt(D.x, D.gy), Rope.pt(lerp(D.x, a0.x, 0.5), a0.y));
        await tween(0.9, () => {
          const a = rope.a(), b = rope.b();
          if (rope.pts.length > 3 && rope.len() > Math.hypot(b.x - a.x, b.y - a.y) * 1.05) rope.pts.splice(1, 1);
        }, lin);
        for (let i = 0; i < n; i++) {
          rope.bead(1, col, 420, () => { ph.msgs = ph.msgs || []; ph.msgs.push({ col }); A.pop(D.side * 0.9, i); });
          await sleep(240);
        }
        await sleep(1300);
        await tween(0.8, (k) => { rope.alpha = 1 - k; });
        ropes[room] = ropes[room].filter((x) => x !== rope);
        res();
      }
    });
  }

  // ================= Vẽ mỗi khung hình =================
  function drawDoorGlow(c, t) {
    const d = DOOR[st.room], a = d ? st.doorGlow[st.room] : 0;
    if (!d || a <= 0.01) return;
    const fl = 0.92 + 0.08 * Math.sin(t * 1.7);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = V.LG(c, d.x - 42, 0, d.x + 42, 0, [[0, V.rgba(d.col, 0)], [0.2, V.rgba(d.col, 0.55 * a * fl)], [0.8, V.rgba(d.col, 0.55 * a * fl)], [1, V.rgba(d.col, 0)]]); c.fillRect(d.x - 42, d.gy - 2.2, 84, 2.2); c.restore();
    V.glow(c, d.x, d.gy + 3, 110, d.col, 0.28 * a * fl, 0.2);
    V.glow(c, d.x, d.gy - 1, 46, d.col, 0.3 * a * fl, 0.12);
  }
  // ===== Khung chat cạnh điện thoại (toạ độ màn hình, cỡ cố định nên đọc được trên điện thoại) =====
  // Không có tên, không có giờ: chỉ bong bóng tin (nhoè), "Đã gửi / Đã xem", pin, và "đang nhập…" khi bên kia thật sự đang cầm máy.
  // Cú lừa: nhìn như đang nhắn qua lại liền tay. Manh mối công bằng: pin tụt rất nhiều giữa hai câu "trả lời ngay".
  const BATS = { q: null, t: null };
  function drawCard(c, t) {
    const ph = phones[st.room];
    if (!ph || ph.hidden || ph.mode !== 'up' || !ph.card || (ph.scr && ph.scr !== 'chat') || MAP.on) return;
    const a = clamp(ph.card * (ph.glow == null ? 1 : ph.glow), 0, 1) * (1 - st.fade);
    if (a < 0.02) return;
    const px = (ph.x - VW.x) * S * VW.z + cw / 2, py = (ph.y - 18 - VW.y) * S * VW.z + ch / 2;
    const msgs = (ph.msgs || []).slice(-5), W = 124, rowH = 12;
    const H = 24 + msgs.length * rowH + (ph.status ? 11 : 0) + (ph.typing ? 15 : 0);
    let x = px - W - 22 * S * VW.z, y = clamp(py - H * 0.7, 48, ch - H - 40);
    if (x < 14) x = px + 22 * S * VW.z;
    c.save(); c.globalAlpha = a;
    V.rr(c, x, y, W, H, 10); c.fillStyle = 'rgba(16,14,28,.84)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.stroke();
    // thanh trên: ba chấm thay cho tên (không lộ là ai), pin bên phải
    c.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + 11 + i * 5, y + 10, 1.6, 0, 7); c.fill(); }
    // Pin: máy anh màu tím, máy em màu hồng. Sang cảnh mới, số pin đếm lùi từ lần trước xuống (loé sáng lúc đang tụt):
    // "trả lời ngay" mà pin tụt cả chục phần trăm, đó là manh mối.
    const own = st.room === 'A' || st.room === 'P' ? 'q' : 't', OC = V.COL[own];
    const tgt = ph.bat == null ? 80 : ph.bat;
    let cur = BATS[own] == null ? tgt : BATS[own];
    const dt = Math.min(0.1, t - (BATS.t || t)); BATS.t = t;
    if (a > 0.6 && cur > tgt) cur = Math.max(tgt, cur - Math.max(6, (cur - tgt) * 1.3) * dt);
    if (cur < tgt) cur = tgt;
    BATS[own] = cur;
    const bat = Math.round(cur), dropping = cur > tgt + 0.01, bx = x + W - 34, low = bat <= 20;
    if (dropping) V.glow(c, bx + 10, y + 11, 26, OC, 0.55);
    c.strokeStyle = V.rgba(OC, 0.9); c.lineWidth = 1.2; V.rr(c, bx, y + 5.5, 21, 10, 2.5); c.stroke(); c.fillStyle = V.rgba(OC, 0.9); c.fillRect(bx + 21.5, y + 8.5, 1.8, 4);
    c.fillStyle = low ? '#FF6B6B' : V.rgba(OC, 0.95); c.fillRect(bx + 1.8, y + 7.3, 17.4 * bat / 100, 6.4);
    c.font = (dropping ? '600 10.5px' : '600 9.5px') + ' "Be Vietnam Pro", sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'right';
    c.fillStyle = dropping ? '#FFFFFF' : V.rgba(OC, 0.95); c.fillText(bat + '%', bx - 4, y + 11);
    // bong bóng tin (nhoè, không đọc được chữ)
    let yy = y + 24;
    msgs.forEach((m, i) => {
      const col = V.COL[m.col] || V.COL.q, n = (ph.msgs.length - msgs.length + i), bw = 34 + ((n * 37) % 5) * 11;
      const bx2 = m.me ? x + W - 8 - bw : x + 8;
      V.rr(c, bx2, yy, bw, 8.5, 4.25); c.fillStyle = V.rgba(col, 0.82); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(bx2 + 5, yy + 3.6, bw * 0.55, 1.3);
      yy += rowH;
    });
    if (ph.status) { c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '400 8px "Be Vietnam Pro", sans-serif'; c.fillText(ph.status, x + W - 9, yy + 2); yy += 11; }
    if (ph.typing) {
      const tx = x + 8, ty = yy + 1;
      V.rr(c, tx, ty, 30, 11, 5.5); c.fillStyle = 'rgba(255,255,255,.14)'; c.fill();
      for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(t * 7 - i * 0.9)); c.fillStyle = 'rgba(255,255,255,' + (0.45 + 0.5 * b) + ')'; c.beginPath(); c.arc(tx + 9 + i * 6, ty + 5.5 - b * 1.6, 1.7, 0, 7); c.fill(); }
      c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '400 8px "Be Vietnam Pro", sans-serif'; c.fillText('đang nhập…', tx + 35, ty + 6);
    }
    c.restore();
  }
  function render(t) {
    const c = cx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    VW = { x: view.x + Math.sin(t * 0.13) * 2.2, y: view.y + Math.cos(t * 0.11) * 1.4, z: view.z };
    { const hw = cw / (2 * S * VW.z), hh = ch / (2 * S * VW.z);
      VW.x = hw * 2 >= BW ? X0 + BW / 2 : clamp(VW.x, X0 + hw, X0 + BW - hw);
      VW.y = hh * 2 >= BH ? Y0 + BH / 2 : clamp(VW.y, Y0 + hh, Y0 + BH - hh); }
    const k = S * VW.z * dpr;
    c.setTransform(k, 0, 0, k, cv.width / 2 - VW.x * k, cv.height / 2 - VW.y * k);
    c.drawImage(bgOf(st.room, st.v), X0, Y0, BW, BH);
    if (st.v2) { c.globalAlpha = st.mix; c.drawImage(bgOf(st.room, st.v2), X0, Y0, BW, BH); c.globalAlpha = 1; }
    V.rooms[st.room].dyn(c, t, st);
    for (const f of under[st.room]) f(c, t);
    drawDoorGlow(c, t);
    for (const r of ropes[st.room]) r.draw(c, t);
    V.drawPhone(c, phones[st.room], t);
    for (const f of extras) f(c, t);
    if (st.hint && st.hint.on) { const p = typeof st.hint.at === 'function' ? st.hint.at() : st.hint.at; if (p) V.hintRing(c, p.x, p.y, t, 1, st.hint.r); }
    // Màn hình: viền tối, hạt phim, dải đen điện ảnh, mờ đen
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCard(c, t);
    drawMap(c, t);
    if (screenHint) { const p = screenHint(); if (p) { c.save(); c.translate(p.x, p.y); V.hintRing(c, 0, 0, t, 1, 22); c.restore(); } }
    if (!vig) vig = makeVignette();
    c.globalAlpha = st.vign; c.drawImage(vig, 0, 0, cw, ch); c.globalAlpha = 1;
    if (MAP.on && MAP.k > 0.999) drawLyrics(c, mapRects());
    drawTaps(c);
    if (!grainPat) grainPat = c.createPattern(grainCv, 'repeat');
    const gx = (Math.random() * 200) | 0, gy = (Math.random() * 200) | 0;
    c.save(); c.globalAlpha = 0.09; c.globalCompositeOperation = 'overlay'; c.translate(-gx, -gy); c.fillStyle = grainPat; c.fillRect(0, 0, cw + gx, ch + gy); c.restore();
    if (st.bars > 0.001) { const bh = ch * 0.085 * st.bars; c.fillStyle = '#000'; c.fillRect(0, 0, cw, bh); c.fillRect(0, ch - bh, cw, bh); }
    if (st.fade > 0.001) { c.fillStyle = 'rgba(0,0,0,' + st.fade + ')'; c.fillRect(0, 0, cw, ch); }
  }

  // ================= Vòng lặp =================
  let acc = 0, prev = performance.now() / 1000, clockOn = false, nextTick = 0;
  const beats = { on: false };
  function update(dt) {
    for (const tw of tws.slice()) {
      if (tw.dead) { tws.splice(tws.indexOf(tw), 1); continue; }
      const k = clamp((NOW - tw.t0) / tw.d, 0, 1); tw.fn(tw.ease(k));
      if (k >= 1) { tws.splice(tws.indexOf(tw), 1); tw.res(); }
    }
    for (const w of waits.slice()) if (w.fn()) { waits.splice(waits.indexOf(w), 1); w.res(); }
    acc += dt;
    let n = 0;
    while (acc >= 1 / 60 && n < 4) { for (const r of ropes[st.room]) r.step(1 / 60); acc -= 1 / 60; n++; }
    if (n === 4) acc = 0;
    if (clockOn && st.room === 'A' && NOW >= nextTick) { nextTick = NOW + 1; st.sec++; A.clockTick(0.08, st.lamp ? 0.03 : 0.024); }
    if (beats.on) beatTick();
  }
  function frame(ms) {
    NOW = ms / 1000;
    const dt = Math.min(0.05, NOW - prev); prev = NOW;
    update(dt); render(NOW);
    requestAnimationFrame(frame);
  }

  // ================= Câu thoại =================
  const lineEl = $('line');
  function lineSet(words) { lineEl.classList.remove('gone'); lineEl.innerHTML = ''; words.forEach((w, i) => { const s = document.createElement('span'); s.textContent = w + (i < words.length - 1 ? ' ' : ''); lineEl.appendChild(s); }); }
  function lineShow(k) { [...lineEl.children].forEach((s, i) => s.classList.toggle('on', i < k)); }
  function lineCut() { lineEl.classList.add('gone'); }
  // Ghi chú góc trên: giờ, nơi chốn, đôi khi một dòng tả cảnh (vì không vẽ người). Sang cảnh mới thì giờ cuộn tới giờ mới,
  // để người chơi thấy giữa hai lần nhắn đã trôi qua bao lâu.
  const noteEl = $('note'), noteT = $('note-t'), noteP = $('note-p'), noteD = $('note-d');
  let noteMin = null, noteRoll = 0, noteDescId = 0;
  const hm = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  function note(time, place, desc, descAt = 1.6) {
    const [h, m] = (time || '0:0').split(':').map(Number), to = time ? h * 60 + m : noteMin, from = time ? noteMin : null;
    noteMin = to; noteP.textContent = place; noteP.hidden = !place; noteT.hidden = !time; noteEl.classList.add('on');
    noteD.classList.remove('on'); const id = ++noteDescId;
    if (desc) setTimeout(() => { if (id === noteDescId) { noteD.textContent = desc; noteD.classList.add('on'); } }, descAt * 1000);
    clearInterval(noteRoll);
    if (from == null || from === to) { noteT.textContent = time || ''; return; }
    const d = (to - from + 1440) % 1440, t0 = performance.now(), dur = Math.min(2200, 900 + d * 4);
    noteRoll = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      noteT.textContent = hm(from + Math.round(d * e));
      if (k >= 1) clearInterval(noteRoll);
    }, 33);
  }
  function noteDesc(desc) { const id = ++noteDescId; noteD.classList.remove('on'); setTimeout(() => { if (id === noteDescId) { noteD.textContent = desc; noteD.classList.add('on'); } }, 500); }
  function noteOff(reset) { noteEl.classList.remove('on'); noteD.classList.remove('on'); noteDescId++; if (reset) noteMin = null; }

  // ================= Mở đầu · Hành lang (cái kết, bị cắt dở) =================
  // Sợi chỉ hồng căng từ điện thoại vào bóng tối. Hai nhịp: dế ở đây (hạt hồng chạy ra), tích tắc xa ở đầu kia (hạt tím chạy về).
  // Mỗi cú chạm gảy sợi chỉ, hai nhịp xích lại gần nhau. Đúng lúc hai hạt sắp gặp nhau giữa sợi chỉ thì cắt phụt.
  const TAUT_B = { x: 1215, y: 196 };
  // Sợi chỉ căng của cuộc gọi. Đầu a là điện thoại ở cảnh hiện tại (nhịp "gần" xuất phát từ đây), đầu b là phía bên kia (nhịp "xa").
  // Cảnh mở đầu (hành lang): gần = dế, hạt hồng; xa = tích tắc, hạt tím. Cao trào (phòng anh): gần = tích tắc, xa = dế qua điện thoại.
  const taut = { vib: 0, vt: 0, pulses: [], grow: 1,
    a: () => anchorOf(phones.H), b: () => TAUT_B,
    near: { col: 't', play: () => A.cricketAt(0.2, 0.022) }, far: { col: 'q', play: () => A.clockTick(0.8, 0.035, true) } };
  const tautEnds = () => { const a = taut.a(), b0 = taut.b(); return [a, { x: lerp(a.x, b0.x, taut.grow), y: lerp(a.y, b0.y, taut.grow) }]; };
  const tautAt = (u) => { const [a, b] = tautEnds(); return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) }; };
  function drawTaut(c, t) {
    const [a, b] = tautEnds(), N = 56, P = [];
    const age = t - taut.vt, amp = taut.vib * Math.exp(-age * 2.2) * 6.5;
    const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny);
    for (let i = 0; i <= N; i++) {
      const u = i / N, o = amp * Math.sin(Math.PI * u) * Math.sin(age * Math.PI * 2 * 5.5) + 0.25 * Math.sin(t * 2.3 + u * 18) * Math.sin(Math.PI * u);
      P.push({ x: lerp(a.x, b.x, u) + nx / nl * o, y: lerp(a.y, b.y, u) + ny / nl * o });
    }
    V.strokeThread(c, P, 't', 1, 1.15);
    for (const p of taut.pulses.slice()) {
      const u = (t - p.t0) / 1.15;
      if (u > 1) { taut.pulses.splice(taut.pulses.indexOf(p), 1); continue; }
      const q = tautAt(p.dir > 0 ? u : 1 - u);
      V.bead(c, q.x, q.y, p.col, 0.9);
    }
  }
  const BEAT = { pP: 0.84, pU: 1.07, nP: 0, nU: 0, final: false, meetAt: 0 };
  function beatTick() {
    if (NOW >= BEAT.nP) {
      const tl = BEAT.nP;
      BEAT.nP += BEAT.pP; taut.near.play(); taut.pulses.push({ dir: 1, col: taut.near.col, t0: NOW });
      if (BEAT.conv) BEAT.nU = tl + BEAT.conv(tl);
      if (BEAT.final && !BEAT.meetAt) { BEAT.meetAt = NOW + 1.15 * 0.455; }
    }
    if (NOW >= BEAT.nU) { BEAT.nU = BEAT.conv ? Infinity : BEAT.nU + BEAT.pU; taut.far.play(); taut.pulses.push({ dir: -1, col: taut.far.col, t0: NOW }); }
  }
  // ===== Bài hát "Dành Hết Xuân Thì Để Chờ Nhau" (Vũ. & Hà Anh Tuấn) =====
  // assets/sound/soi-chi-xt2.mp3 là đoạn cắt từ 3:00 (CUT0) của bài gốc (assets/sound/Dành Hết Xuân Thì Để Chờ Nhau.mp3) tới hết.
  // Mọi mốc dưới đây tính bằng giây của BÀI GỐC (đo bằng Whisper + phổ: tools nằm ở scratchpad, xem ghi chú trong kịch bản).
  //   3:19.1 "Chúng ta dành hết Xuân thì để chờ nhau" (điệp khúc Rê), 3:26 → 3:36 nhạc dạo, 3:36.61 lên một cung (Mi), điệp khúc cuối.
  // Cảnh mở đầu: hai ô nhịp nhạc dạo, nghe nghẹt như vọng qua sợi chỉ, cắt phụt đúng lúc sắp lên cung.
  // Cao trào: nhạc vào đúng đầu câu "Chúng ta dành hết Xuân thì để chờ nhau", nghẹt rồi mở dần, hai hạt gặp nhau đúng phách lên cung.
  // Từ đó bài chạy một mạch không ngắt: nửa đầu điệp khúc dưới cuộc gọi, nửa sau dưới bản đồ (mỗi búi chỉ căng đúng một câu "chờ").
  const SONG = '../assets/sound/soi-chi-xt2.mp3', CUT0 = 180, KEYT = 216.61, KEY = KEYT - CUT0, BL = 60 / 68;
  let song = null, sclk = null;
  // Giờ hiện tại của bài (giây bài gốc). Không tải được nhạc thì vẫn có đồng hồ ảo chạy đúng như bài, để cảnh không lệch.
  const T = () => (sclk ? CUT0 + sclk.at + NOW - sclk.start : -1);
  const waitT = (t) => waitFor(() => T() >= t);
  // ===== Nhạc lồng: chính bài này, nghẹt và nhỏ, âm ỉ suốt cả chuyện =====
  // Tệp soi-chi-xt-long.mp3 = 0:00 → 3:19 của bài (mono, nhẹ). Phát: dạo đầu → lời 1 → điệp khúc 1, rồi bỏ qua câu
  // "Chúng ta dành hết Xuân thì để chờ nhau", nhảy sang nhạc dạo giữa → lời 2 → điệp khúc 2, lại bỏ qua câu ấy, quay về nhạc dạo giữa, lặp mãi.
  // Cả bài đúng 68 nhịp/phút (đo lại: lệch < 0,04 s suốt 200 s), mọi chỗ nối đều đúng vạch nhịp (lưới GRID0 + n·BAR) nên nghe liền.
  // Câu "chờ nhau" chỉ được hát ở cao trào: nhạc lồng chuyển thẳng sang bài chính ngay một vạch nhịp, không ngắt.
  const BED = '../assets/sound/soi-chi-xt-long.mp3', BAR = BL * 4, GRID0 = KEYT - 61 * BAR;
  const bar = (n) => GRID0 + n * BAR;            // bar(31) = 110.73 "Chúng ta…" điệp khúc 1, bar(34) = 121.32 nhạc dạo giữa, bar(56) = 198.96 "Chúng ta…" điệp khúc 2
  // Tạm thời (chờ bản không lời): chỉ dùng các đoạn KHÔNG LỜI của bản gốc, dạo đầu (ô 0→3) và dạo giữa (ô 34→37), nối xen nhau.
  // Giọng hát chạy suốt sẽ đè mất tiếng phòng, tiếng dế, tiếng xe; nên lời chỉ vang ở cao trào.
  const BED_FULL = [[bar(0), bar(3)], [bar(34), bar(37)], [bar(1), bar(3)], [bar(34), bar(37)]];
  // Cảnh mở đầu: chỉ đoạn dạo đầu không lời (3 ô nhịp), lặp êm. Không bao giờ có giọng hát bị cắt ngang.
  const BED_INTRO = [[bar(0), bar(3)], [bar(1), bar(3)]];
  // mức: [âm lượng, lọc Hz]. Mức 0 vẫn còn nghe (âm ỉ), không bao giờ tắt hẳn giữa chuyện.
  const BEDL = [[0.085, 950], [0.12, 1300], [0.165, 1800], [0.22, 2500], [0.28, 3400]];
  let bed = null, bedLv = 0, bedGrow = 0;
  function bedLevel() { const [v, f] = BEDL[bedLv]; return [v * (0.75 + 0.5 * bedGrow), f * (0.85 + 0.4 * bedGrow)]; }
  // Thay cho nhạc piano tự tổng hợp: có nhạc lồng thì chỉnh nhạc lồng, không tải được thì dùng piano như cũ.
  // Chưa tới lúc có nhạc (Lần 1, 2: khoảng lặng sau màn đen) thì im, chỉ khi không tải được tệp nhạc mới dùng piano.
  let bedFile = true;
  function M(l) { bedLv = l; if (bed) { const [v, f] = bedLevel(); bed.set(v, f, 2.5); } else if (!bedFile) A.music.set(l); }
  let bedTok = 0, bedWait = false;
  async function bedOn(segs, fade = 3, lv = null) {
    if (bed || bedWait) return;
    const tok = ++bedTok; bedWait = true;
    const [v, f] = lv || bedLevel();
    const b = await A.long(BED, segs, { vol: v, lp: f, fade });
    bedWait = false;
    if (!b) return;
    if (tok !== bedTok) { b.stop(0.05); return; }  // đã bị tắt trong lúc đang tải
    bed = b; A.music.set(0);
    if (!lv) { const [v2, f2] = bedLevel(); bed.set(v2, f2, fade); }
  }
  function bedOff(fd = 2, at = 0) { bedTok++; bedWait = false; if (bed) { bed.stop(fd, at); bed = null; } }
  // Vào bài chính từ giây t (bài gốc, đúng một vạch nhịp). Đang có nhạc lồng thì chờ tới vạch nhịp kế tiếp rồi chuyển, liền một mạch.
  // breath > 0: nhạc lồng lắng dần xuống trong breath giây (như nín thở) rồi bài chính mới vào, ở vạch nhịp sau đó,
  // để không bao giờ cắt ngang một câu hát rồi chen giọng khác vào.
  async function playFrom(t, opts, breath = 0, xfade = 0) {
    const o = Object.assign({ at: t - CUT0 }, opts);
    let when = 0;
    if (bed) { when = bed.nextBar(GRID0, BAR, breath || 0.35); o.when = when; if (!xfade) o.fade = Math.min(o.fade || 0.05, 0.05); }
    if (bed && breath) bedOff(breath * 0.75);
    song = await A.track(SONG, o);
    if (bed) bedOff(xfade || 0.12, xfade ? when : when - 0.03);
    sclk = song ? { start: song.start, at: song.at } : { start: NOW + 0.08, at: t - CUT0 };
    return !!song;
  }
  // Phát nhạc từ giây t0 của bài (trước phách lên cung). Hai nhịp (hạt gần, hạt xa) khớp phách bài và xích dần lại, gặp nhau giữa sợi chỉ đúng phách lên cung.
  async function leadIn(t0, opts, breath = 0, xfade = 0) {
    await playFrom(t0, opts, breath, xfade);
    const sec = KEYT - t0, key = sclk.start + sec, last = key - 0.575;
    BEAT.pP = BEAT.pU = BL;
    BEAT.conv = (tl) => 0.34 * clamp((last - tl) / sec, 0, 1);
    let n = last; while (n - BL > NOW + 0.05) n -= BL;
    BEAT.nP = n; BEAT.nU = Infinity;
    return key;
  }
  let sobOn = false;
  let sobPan = -0.15;
  function sobLoop() { if (!sobOn) return; A.sob(0.055, sobPan); setTimeout(sobLoop, 5200 + Math.random() * 3200); }
  const NOTES = [587.3, 659.3, 740, 880, 987.8];

  async function coldOpen() {
    setRoom('H', 'n'); st.bars = 1; st.vign = 1; st.fade = 1;
    Object.assign(view, { x: 392, y: 262, z: 2.2 });
    setTimeout(() => note('', 'Một hành lang', 'Một cô gái đứng lặng ở hành lang, chỗ đầu cầu thang. Nước mắt rơi, vì nhớ.', 2.4), 1600);
    extras.push(drawTaut);
    A.setPlace('hanh-lang');
    await sleep(1300);
    camTo(436, 258, 1.9, 16, lin);
    // Một đoạn liền của bài (không nối ghép): từ "Chờ mùa mưa tới" (3:04,8) chạy thẳng tới ngay trước chỗ lên cung (3:36,6).
    // Vào ngay khi màn sáng, rất nhỏ và nghẹt như vọng qua sợi chỉ, dâng dần. Người chơi gảy lúc nào thì sợi chỉ sáng, rung lúc đó;
    // không gảy thì nhạc vẫn chạy, câu vẫn hiện. Cắt phụt đúng một lần, ngay trước phách lên cung. Cao trào sẽ phát lại y đoạn này.
    BEAT.final = false; BEAT.meetAt = 0; beats.on = true;
    const key0 = await leadIn(bar(52), { vol: 0.05, fade: 4, lp: 700 });
    if (song) {
      const t0 = sclk.start;
      waitFor(() => NOW >= t0 + 4.2).then(() => song && song.ramp(0.17, bar(56) - bar(52) - 4.2, 1200));
      waitT(bar(56)).then(() => song && song.ramp(0.27, KEYT - bar(56) - 0.3, 1600));
    }
    await fadeTo(0, 3.6);
    sobOn = true; setTimeout(sobLoop, 1800);
    lineSet(['Thật', 'ra', 'đi…']);
    let shown = 0;
    const show = (k) => { if (k > shown) { shown = k; lineShow(k); } };
    waitT(bar(56)).then(() => camTo(470, 254, 1.6, 14));
    // câu tự hiện theo nhạc nếu người chơi chưa gảy tới
    [[bar(57), 1], [bar(58), 2], [bar(59), 3]].forEach(([tt, k]) => waitT(tt).then(() => show(k)));
    await sleep(1200);
    let k = 0;
    hint(() => tautAt(0.3), 'Chạm để gảy sợi chỉ', { ring: 0.8, text: 3, r: 26 });
    handler = {
      down() {
        if (NOW - lastTap < 0.15) return;
        lastTap = NOW; k++;
        A.ks(NOTES[(k - 1) % 5], 0.11, 0.15); taut.vib = 1; taut.vt = NOW;
        show(Math.min(3, k));
        hint(() => tautAt(0.3), '', { ring: 3.5, r: 26 });
      },
    };
    await waitFor(() => NOW >= key0 - 0.04);
    // Cắt phụt: tắt hình, tắt tiếng, câu bỏ dở
    if (song) { song.stop(0.01); song = null; }
    sclk = null;
    BEAT.conv = null;
    st.fade = 1; A.cut(1700); lineCut(); noteOff(true); beats.on = false; sobOn = false; clearHint(); handler = null;
    extras.splice(extras.indexOf(drawTaut), 1); taut.pulses.length = 0;
    await sleep(2000);
  }

  // ================= Lần 1 · Phòng anh · đêm =================
  const noteA = { a: 0 };
  function drawNoteA(c) {
    if (noteA.a <= 0.01) return;
    const ph = phones.A, x = ph.x - 6, y = ph.y - 74;
    c.save(); c.globalAlpha = noteA.a;
    // Khung tự rộng theo chữ (đo chữ trước rồi mới vẽ khung), không bao giờ tràn
    const msg = 'nhớ ngủ sớm, bớt thức khuya';
    c.font = '500 8px "Be Vietnam Pro", sans-serif'; c.textBaseline = 'middle';
    const tw = c.measureText(msg).width, bw = tw + 34, x0 = x - bw / 2;
    V.rr(c, x0, y - 11, bw, 22, 7); c.fillStyle = 'rgba(28,24,42,.8)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 0.6; c.stroke();
    V.rr(c, x0 + 7, y - 5, 10, 10, 3); c.fillStyle = 'rgba(255,150,182,.85)'; c.fill();
    c.fillStyle = 'rgba(255,255,255,.8)';
    c.fillText(msg, x0 + 24, y + 0.5);
    c.restore();
  }
  async function walk(room) {
    clearHint(); handler = null;
    const D = DOOR[room];
    A.swish(D.side > 0 ? 'r' : 'l', 0.07);
    await camTo(D.x, 300, 1.5, 0.45, easeIn);
    await fadeTo(1, 0.14);
  }
  async function lan1() {
    setRoom('A', 'on'); st.day = false; st.lamp = true; st.doorGlow.A = 0.22; st.fade = 1; st.vign = 0.62;
    note('', '', 'Cùng ngày ấy. Sớm hơn.', 2.2);
    Object.assign(view, { x: 470, y: 252, z: 1.38 });
    clockOn = true; nextTick = NOW + 0.6;
    Object.assign(phones.A, { card: 1, bat: 92, status: '' });
    A.setPlace('phong-toi');
    camTo(510, 238, 1.12, 9, easeOut);
    tween(3.2, (k) => { st.bars = Math.min(st.bars, 1 - k); });
    await fadeTo(0, 2.6);
    setTimeout(() => M(1), 2600);
    await sleep(1200);
    await sendThread(phones.A, 7, 'q', 'Kéo sợi chỉ từ điện thoại ra cửa');
    await sleep(400);
    extras.push(drawNoteA);
    await camTo(phones.A.x - 12, phones.A.y - 48, 1.95, 1.8);
    await tween(1.4, (k) => { noteA.a = k; });
    await sleep(3000);
    tween(1.2, (k) => { noteA.a = 1 - k; });
    await camTo(505, 240, 1.12, 1.7);
    await dragPhone(phones.A, { x: 430, y: 297, r: 48 }, 'Úp điện thoại xuống gối');
    const ph = phones.A; ph.mode = 'down'; ph.ang = 0; ph.y = 297; ph.x = 424; A.soft('c');
    tween(1.6, (k) => { ph.glow = 1 - k; });
    await sleep(900);
    await tapOn({ x: 312, y: 270, r: 52 }, 'Tắt đèn', { ring: 1.4, text: 5 });
    A.sw(-0.4); st.lamp = false; setVariant('off', 0.14); M(0);
    tween(3, (k) => { st.doorGlow.A = lerp(0.22, 1, k); });
    await sleep(2600);
    await tapOn(DOOR.A.hit, '', { at: { x: DOOR.A.x, y: 330 }, ring: 2.5, r: 30 });
    await walk('A');
    clockOn = false;
  }

  // ================= Lần 2 · Phòng em · 5 giờ sáng =================
  // Chăn: ba hình (bung ra, gấp đôi, gấp gọn ở cuối giường), mỗi lần vuốt về phía cuối giường là một nấc
  const BLK = [
    [[378, 320], [420, 309], [470, 314], [520, 305], [575, 312], [588, 320], [591, 347], [545, 356], [480, 349], [410, 357], [375, 342]],
    [[468, 318], [498, 306], [528, 310], [558, 302], [580, 307], [588, 318], [590, 345], [562, 351], [530, 346], [500, 351], [466, 340]],
    [[520, 318], [521, 300], [540, 297], [562, 297], [584, 299], [587, 318], [586, 318], [570, 318], [552, 318], [536, 318], [520, 318]],
  ];
  function blanketPts() {
    const i = Math.floor(st.fold), f = st.fold - i, a = BLK[Math.min(2, i)], b = BLK[Math.min(2, i + 1)];
    return a.map((p, k) => ({ x: lerp(p[0], b[k][0], f), y: lerp(p[1], b[k][1], f) }));
  }
  function drawBlanket(c) {
    const P = blanketPts(), n = P.length;
    c.beginPath(); c.moveTo((P[0].x + P[1].x) / 2, (P[0].y + P[1].y) / 2);
    for (let i = 1; i <= n; i++) { const p = P[i % n], q = P[(i + 1) % n]; c.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2); }
    c.closePath();
    c.fillStyle = V.LG(c, 0, 296, 0, 366, [[0, '#7E8F77'], [0.5, '#62735C'], [1, '#46553F']]); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1.6;
    const top = (u) => ({ x: lerp(P[0].x, P[5].x, u), y: Math.min(P[1].y, P[3].y) + 4 });
    if (st.fold < 1.7) for (const u of [0.3, 0.55, 0.8]) { const p = top(u); c.beginPath(); c.moveTo(p.x, p.y + 4); c.quadraticCurveTo(p.x - 6, p.y + 20, p.x + 4, p.y + 40 - st.fold * 12); c.stroke(); }
    else { c.globalAlpha = (st.fold - 1.7) / 0.3; [304, 309, 313].forEach((y) => { c.beginPath(); c.moveTo(523, y); c.lineTo(584, y); c.stroke(); }); c.globalAlpha = 1; }
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.beginPath(); c.moveTo(P[0].x, P[0].y - 1); for (let i = 1; i <= 5; i++) c.lineTo(P[i].x, P[i].y - 1); c.stroke();
    const dk = st.room !== 'B' ? 0 : st.v === 'dem' ? 0.84 : st.v !== 'dark' ? 0 : st.v2 === 'tube' ? 0.76 * (1 - st.mix) : 0.76;
    if (dk > 0.01) {
      c.beginPath(); c.moveTo((P[0].x + P[1].x) / 2, (P[0].y + P[1].y) / 2);
      for (let i = 1; i <= n; i++) { const p = P[i % n], q = P[(i + 1) % n]; c.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2); }
      c.closePath(); c.fillStyle = 'rgba(8,16,36,' + dk + ')'; c.fill();
    }
  }
  // Gấp chăn: vuốt ngang (hướng nào cũng được) hoặc chạm vào chăn đều là một nấc. Lỡ vuốt khi chăn đang gấp dở thì để dành, gấp tiếp ngay sau.
  function foldBlanket() {
    return new Promise((res) => {
      const hit = (p) => p.x > 360 && p.x < 610 && p.y > 270 && p.y < 385;
      const center = () => { const P = blanketPts(); return { x: (P[0].x + P[5].x) / 2, y: 318 }; };
      hint(center, 'Vuốt hoặc chạm vào chăn để gấp', { text: 5 });
      let g = null, used = false, busy = false, queued = 0, target = 0;
      const fold = () => {
        if (target >= 2) return;
        if (busy) { if (target + queued < 2) queued++; return; }
        busy = true; target++; const a = st.fold, b = target;
        A.swish('c', 0.12); clearHint();
        tween(0.5, (k) => { st.fold = lerp(a, b, k); }, easeOut).then(() => {
          busy = false;
          if (b >= 2) { handler = null; res(); return; }
          if (queued > 0) { queued--; fold(); } else hint(center, 'Vuốt hoặc chạm vào chăn để gấp', { ring: 0.6, text: 3 });
        });
      };
      handler = {
        down(p) { if (hit(p)) { g = p; used = false; } },
        move(p) { if (g && !used && Math.abs(p.x - g.x) > 36) { used = true; fold(); } },
        up(p) { if (g && !used && Math.hypot(p.x - g.x, p.y - g.y) < 14) fold(); g = null; },
      };
    });
  }
  async function lan2() {
    setRoom('B', 'dark'); st.day = false; st.tube = false; st.doorGlow.B = 0.5; st.fade = 1; st.fold = 0; st.bars = 0;
    noteOff();
    under.B = [drawBlanket];
    const ph = phones.B; ph.glow = 0; ph.hidden = false; Object.assign(ph, { card: 1, bat: 100, status: 'Đã xem' });
    // Sợi chỉ tím từ nhà anh đã luồn qua khe cửa, búi lại một chút (mới chờ nửa tiếng)
    const coilPt = { x: 208, y: laneY('B', 208, BASE.B) };
    const a0 = anchorOf(ph);
    const rope = new Rope({ col: 'q', room: 'B', base: BASE.B, a: () => coilPt, b: () => anchorOf(ph) }).line(coilPt.x, coilPt.y, a0.x, a0.y, 1.25);
    rope.coil = { x: coilPt.x, y: coilPt.y, frac: 1, max: 4, seed: 8 };
    rope.feed = { x: DOOR.B.x, y: DOOR.B.gy };
    ropes.B = [rope];
    for (let i = 0; i < 160; i++) rope.step(1 / 60);
    Object.assign(view, { x: 210, y: 300, z: 1.75 });
    A.setPlace('phong-trai', 'c', 0.8);
    camTo(470, 240, 1.12, 2.4, easeOut);
    await fadeTo(0, 0.5);
    await sleep(900);
    A.coiXa();
    await sleep(2300);
    // Đèn tuýp bật: tách, chớp mấy lần rồi sáng hẳn
    A.tube('c'); st.v2 = 'tube';
    for (const m of [0.7, 0, 0.85, 0.12, 1]) { st.mix = m; await sleep(90 + Math.random() * 60); }
    st.v = 'tube'; st.v2 = null; st.mix = 0; st.tube = true; st.doorGlow.B = 0.22;
    tween(1, (k) => { ph.glow = k * 0.85; });
    await sleep(600);
    arrive(rope, -0.4);
    await reelIn(rope, ph, 2, 7, 'q', 'Chạm vào sợi chỉ nhiều lần để cuộn tin về. Chỉ căng thì tin tới');
    ph.glow = 1;
    await sleep(900);
    M(1);
    await sendThread(ph, 3, 't', 'Kéo sợi chỉ ra cửa');
    await sleep(300);
    // gấp chăn sau khi nhắn (manh mối: giường lúc nào cũng gọn)
    await foldBlanket();
    await tapOn({ x: ph.x, y: ph.y - 15, r: 40 }, 'Cất điện thoại', { ring: 1.2, text: 5 });
    A.soft('c');
    const p0 = { x: ph.x, y: ph.y };
    await tween(0.45, (k) => { ph.x = lerp(p0.x, ph.stash.x, k); ph.y = lerp(p0.y, ph.stash.y + 6, k); ph.s = 1 - k * 0.6; ph.glow = 1 - k; });
    ph.hidden = true; A.thud();
    await sleep(350);
    // "Ting" khẽ vọng từ phía cửa (nhà anh)
    A.ting(-0.8, 0.75);
    tween(1.2, (k) => { st.doorGlow.B = lerp(0.22, 1, k); });
    await sleep(500);
    await tapOn(DOOR.B.hit, '', { at: { x: DOOR.B.x, y: 330 }, ring: 1.2, r: 30 });
    M(0);
    await walk('B');
  }

  // Có tin tới: sợi chỉ tự rung lên hai lần như dây đàn ai gảy từ đầu bên kia. Người chơi không phải làm gì,
  // chỉ để nhận ra bên kia vừa gửi. Lần đầu có một dòng chú thích nhỏ.
  let arriveSeen = false;
  function say(text, ms) { hintEl.textContent = text; hintEl.classList.add('on'); const id = (sayId = {}); setTimeout(() => { if (sayId === id) hintEl.classList.remove('on'); }, ms); }
  let sayId = null;
  async function arrive(rope, pan) {
    const first = !arriveSeen; arriveSeen = true;
    if (first) say('Sợi chỉ khẽ rung: bên kia vừa gửi tin tới', 4200);
    for (let i = 0; i < 2; i++) { rope.twang(); A.ks(i ? 784 : 659, 0.1, pan); await sleep(1500); }
    if (first) await sleep(900);
  }

  // ================= Lần 3 · Phòng anh · 8 giờ 30 sáng =================
  // "Phòng này mình đi rồi mà." Nắng đã vào. Sợi chỉ hồng của em chờ ba tiếng rưỡi: búi to, cuộn mãi mới hết.
  // Trả lời 2 tin (người chơi tưởng là trả lời ngay). Mở tủ: một nửa trống, một móc áo không. Cầm chìa khoá, đi.
  function afterLan1() {
    const ph = phones.A; Object.assign(ph, { mode: 'down', x: 424, y: 297, ang: 0, glow: 0, hidden: false });
    if (!ropes.A.length) {
      const a = anchorOf(ph), r = new Rope({ col: 'q', room: 'A', base: BASE.A, a: () => anchorOf(ph), b: () => ({ x: DOOR.A.x, y: DOOR.A.gy }), grow: true }).line(a.x, a.y, DOOR.A.x, DOOR.A.gy, 1.3);
      r.old = true; r.dim = 1; ropes.A.push(r); for (let i = 0; i < 200; i++) r.step(1 / 60);
    }
  }
  const ward = { k: 0, t0: 0 }, keyState = { on: true };
  async function lan3() {
    afterLan1();
    setRoom('A', 'sang'); st.lamp = false; st.day = true; st.doorGlow.A = 0; st.fade = 1; st.vign = 0.5; st.bars = 0;
    noteOff();
    under.A = [(c, t) => V.wardrobeOpen(c, t, ward.k, ward.t0), (c, t) => { if (keyState.on) V.keys(c, t); }];
    const ph = phones.A; Object.assign(ph, { card: 1, bat: 81, status: 'Đã xem' });
    const coilPt = { x: 784, y: laneY('A', 784, BASE.A + 6) };
    const a0 = anchorOf(ph);
    const pink = new Rope({ col: 't', room: 'A', base: BASE.A + 6, a: () => coilPt, b: () => anchorOf(ph) }).line(coilPt.x, coilPt.y, a0.x, a0.y, 1.18);
    pink.coil = { x: coilPt.x, y: coilPt.y, frac: 1, max: 9, seed: 21 }; pink.feed = { x: DOOR.A.x, y: DOOR.A.gy };
    ropes.A.push(pink); for (let i = 0; i < 200; i++) pink.step(1 / 60);
    Object.assign(view, { x: 800, y: 300, z: 1.75 });
    clockOn = true; nextTick = NOW + 0.5;
    A.setPlace('phong-ngay', 'c', 0.7);
    camTo(505, 240, 1.12, 2.6, easeOut);
    await fadeTo(0, 0.5);
    await sleep(500);
    arrive(pink, 0.4);
    await reelIn(pink, ph, 3, 3, 't', 'Chạm vào sợi chỉ để cuộn tin về', {
      before: () => { A.soft('c'); Object.assign(ph, { mode: 'up', ang: -0.3, y: 298, x: 430 }); tween(0.8, (k) => { ph.glow = k; }); },
    });
    await sleep(900);
    M(1);
    await sendThread(ph, 2, 'q', 'Kéo sợi chỉ ra cửa');
    await sleep(500);
    A.ting(0.8, 0.75); tween(1.2, (k) => { st.doorGlow.A = k * 0.7; });
    await tapOn({ x: 734, y: 236, r: 64 }, 'Mở tủ áo', { ring: 1.4, text: 5 });
    A.swish('r', 0.07); A.thud(); ward.t0 = NOW;
    tween(0.9, (k) => { ward.k = k; }, easeOut);
    await camTo(734, 230, 1.75, 1.2);
    await sleep(2200);
    await camTo(560, 240, 1.15, 1.0);
    await tapOn({ x: 824, y: 280, r: 30 }, 'Cầm chìa khoá', { ring: 1.2, text: 5 });
    keyState.on = false; A.keys();
    await sleep(300);
    await tapOn(DOOR.A.hit, '', { at: { x: DOOR.A.x, y: 330 }, ring: 1.6, r: 30 });
    M(0);
    await walk('A');
    clockOn = false;
  }

  // ================= Lần 4 · Phòng em · giờ nghỉ trưa =================
  // Giường đã gọn. Chỉ có vài phút. Điện thoại đang nằm trong ngăn tủ, sợi chỉ tím (chờ 3 tiếng) luồn vào ngăn tủ.
  // Lấy máy, cuộn chỉ, gửi vội 4 tin, tiếng còi thổi ngắn ngoài sân, cất máy. "Ting" vọng từ cửa.
  function afterLan2() {
    const ph = phones.B; Object.assign(ph, { hidden: true, s: 1, glow: 0, mode: 'up', ang: -0.32 });
    if (!ropes.B.length) {
      const a = anchorOf(ph), r = new Rope({ col: 't', room: 'B', base: BASE.B, a: () => anchorOf(ph), b: () => ({ x: DOOR.B.x, y: DOOR.B.gy }), grow: true }).line(a.x, a.y, DOOR.B.x, DOOR.B.gy, 1.3);
      r.old = true; r.dim = 1; ropes.B.push(r); for (let i = 0; i < 200; i++) r.step(1 / 60);
    }
  }
  async function lan4() {
    afterLan2();
    setRoom('B', 'trua'); st.tube = false; st.day = true; st.fold = 2; st.doorGlow.B = 0; st.fade = 1; st.vign = 0.5; st.bars = 0;
    noteOff();
    under.B = [drawBlanket];
    const ph = phones.B; Object.assign(ph, { card: 1, bat: 86, status: 'Đã xem' });
    const coilPt = { x: 214, y: laneY('B', 214, BASE.B + 6) };
    const a0 = anchorOf(ph);
    const rope = new Rope({ col: 'q', room: 'B', base: BASE.B + 6, a: () => coilPt, b: () => anchorOf(ph) }).line(coilPt.x, coilPt.y, a0.x, a0.y, 1.2);
    rope.coil = { x: coilPt.x, y: coilPt.y, frac: 1, max: 8, seed: 33 }; rope.feed = { x: DOOR.B.x, y: DOOR.B.gy };
    ropes.B.push(rope); for (let i = 0; i < 200; i++) rope.step(1 / 60);
    Object.assign(view, { x: 210, y: 300, z: 1.75 });
    A.setPlace('trai-ngay', 'c', 0.6);
    camTo(470, 240, 1.12, 2.4, easeOut);
    await fadeTo(0, 0.5);
    await sleep(400);
    arrive(rope, -0.4);
    await tapOn({ x: 258, y: 316, r: 36 }, 'Mở ngăn tủ lấy điện thoại', { ring: 1.2, text: 4 });
    A.thud(); ph.hidden = false;
    const home = { x: 360, y: 300 };
    await tween(0.5, (k) => { ph.x = lerp(ph.stash.x, home.x, k); ph.y = lerp(ph.stash.y + 6, home.y, k) - Math.sin(k * Math.PI) * 16; ph.s = 0.4 + k * 0.6; ph.glow = k; }, easeOut);
    await reelIn(rope, ph, 3, 2, 'q', 'Chạm vào sợi chỉ để cuộn tin về');
    await sleep(700);
    await sendThread(ph, 4, 't', 'Kéo sợi chỉ ra cửa');
    A.huyt();
    await sleep(600);
    await tapOn({ x: ph.x, y: ph.y - 15, r: 40 }, 'Cất điện thoại', { ring: 0.8, text: 3 });
    A.soft('c');
    const p0 = { x: ph.x, y: ph.y };
    await tween(0.45, (k) => { ph.x = lerp(p0.x, ph.stash.x, k); ph.y = lerp(p0.y, ph.stash.y + 6, k); ph.s = 1 - k * 0.6; ph.glow = 1 - k; });
    ph.hidden = true; A.thud();
    await sleep(350);
    A.ting(-0.8, 0.75);
    tween(1.2, (k) => { st.doorGlow.B = k * 0.8; });
    await sleep(500);
    await tapOn(DOOR.B.hit, '', { at: { x: DOOR.B.x, y: 330 }, ring: 1.2, r: 30 });
    await walk('B');
  }

  // Sợi chỉ tin tới: luồn qua khe cửa (hay miệng ngõ), búi trên sàn trước cửa. max: độ to của búi (chờ càng lâu càng to)
  function incoming(room, col, ph, max, seed, at) {
    const D = DOOR[room], cx0 = D.x - D.side * 56, base = BASE[room] + 6;
    const coilPt = at || { x: cx0, y: laneY(room, cx0, base) }, a0 = anchorOf(ph);
    const r = new Rope({ col, room, base, a: () => coilPt, b: () => anchorOf(ph) }).line(coilPt.x, coilPt.y, a0.x, a0.y, 1.18);
    r.coil = { x: coilPt.x, y: coilPt.y, frac: 1, max, seed }; r.feed = { x: D.x, y: D.gy };
    ropes[room].push(r); for (let i = 0; i < 200; i++) r.step(1 / 60);
    return r;
  }
  async function readPhone(ph, ms) { await camTo(ph.x + 4, ph.y - 30, 2.2, 1.3); await sleep(ms); await camTo(500, 240, 1.12, 1.3); }
  async function goDoor(room, ring = 1.4) {
    tween(1.4, (k) => { st.doorGlow[room] = Math.max(st.doorGlow[room], k * 0.85); });
    await tapOn(DOOR[room].hit, '', { at: { x: DOOR[room].x, y: 330 }, ring, r: 30 });
    await walk(room);
  }
  function enter(room, v, from) {
    setRoom(room, v); st.fade = 1; st.bars = 0;
    Object.assign(view, { x: from === 'r' ? 800 : 210, y: 300, z: 1.75 });
    camTo(room === 'P' ? 520 : 500, room === 'P' ? 250 : 240, 1.12, 2.4, easeOut);
  }

  // ================= Lần 5 · Phố · 5 giờ chiều =================
  // Lần đầu ra khỏi phòng. Điện thoại để trên yên xe. Sợi chỉ hồng chờ năm tiếng: búi to nhất, cuộn mãi chưa hết (người chơi bắt đầu nghi).
  async function lan5() {
    enter('P', 'chieu', 'r'); st.day = true; st.doorGlow.P = 0; st.vign = 0.55;
    noteOff();
    const ph = phones.P; Object.assign(ph, { card: 1, bat: 47, status: 'Đã xem' });
    const pink = incoming('P', 't', ph, 12, 71);
    A.setPlace('pho', 'c', 0.7);
    await fadeTo(0, 0.5);
    await sleep(500);
    arrive(pink, 0.5);
    await reelIn(pink, ph, 4, 4, 't', 'Chạm vào sợi chỉ để cuộn tin về');
    await sleep(900);
    M(1);
    await sendThread(ph, 5, 'q', 'Kéo sợi chỉ vào ngõ');
    await sleep(500);
    A.ting(0.85, 0.8);
    await goDoor('P');
    M(0);
  }

  // ================= Lần 6 · Phòng học · 7 giờ tối =================
  // Trông như ngồi làm bài ở nhà. Nhận tin xong, định trả lời thì chiếc giỏ sáng lên: phải bỏ điện thoại vào giỏ (trong giỏ có nhiều điện thoại).
  // Làm bài: lật trang, gạch chân. Rồi "ting" nghẹt trong giỏ, một sợi chỉ tím bò vào quấn quanh giỏ. Lần đầu có tin mà không trả lời được.
  const nb = { flip: 0, line: 0 }, bk = { inside: false, glow: 0 };
  const drawL = (c, t) => { V.notebook(c, nb.flip, nb.line); V.basket(c, t, bk.inside, bk.glow); };
  function underline() {
    return new Promise((res) => {
      const x0 = 471, x1 = 505, y = 294.6;
      hint({ x: x0, y }, 'Kéo theo dòng chữ để gạch chân', { ring: 0.8, text: 4, r: 10 });
      let g = false, lastS = 0;
      const done = () => { handler = null; clearHint(); tween(0.25, (k) => { nb.line = lerp(nb.line, 1, k); }).then(res); };
      handler = {
        down(p) { if (Math.abs(p.y - y) < 14 && p.x > x0 - 14 && p.x < x1 + 8) { g = true; clearHint(); } },
        move(p) { if (!g) return; const v = clamp((p.x - x0) / (x1 - x0), 0, 1); if (v > nb.line) { nb.line = v; if (NOW - lastS > 0.09) { lastS = NOW; A.rasp(3, 0); } } if (nb.line > 0.92) done(); },
        up() { if (g && nb.line < 0.1) { done(); return; } g = false; },
      };
    });
  }
  async function lan6() {
    enter('L', 'toi', 'l'); st.day = false; st.doorGlow.L = 0.15; st.vign = 0.55;
    noteOff();
    under.L = [drawL]; nb.flip = 0; nb.line = 0; bk.inside = false; bk.glow = 0;
    const ph = phones.L; Object.assign(ph, { hidden: false, x: 482, y: 292, s: 1, glow: 1, card: 1, bat: 64, status: "Đã xem" });
    const rope = incoming('L', 'q', ph, 9, 81);
    A.setPlace('lop', 'c', 0.7);
    await fadeTo(0, 0.5);
    await sleep(1400);
    arrive(rope, -0.5);
    await reelIn(rope, ph, 4, 2, 'q', 'Chạm vào sợi chỉ để cuộn tin về');
    await readPhone(ph, 1400);
    // Định trả lời thì chiếc giỏ sáng lên
    tween(0.8, (k) => { bk.glow = 0; st.doorGlow.L = 0.15; });
    await dragPhone(ph, { x: 262, y: 300, r: 46 }, 'Bỏ điện thoại vào giỏ');
    ph.hidden = true; bk.inside = true; A.thud();
    await sleep(700);
    // Làm bài
    await camTo(470, 292, 2.6, 1.6);
    await tapOn({ x: 488, y: 292, r: 26 }, 'Lật trang', { ring: 0.8, text: 4, r: 12 });
    A.swish('c', 0.08); await tween(0.7, (k) => { nb.flip = k; }, easeIO); nb.flip = 1;
    await sleep(300);
    await underline();
    await sleep(900);
    await camTo(500, 240, 1.12, 1.6);
    await sleep(1600);
    // "Ting" nghẹt trong giỏ. Một sợi chỉ tím bò từ khe cửa vào, quấn quanh giỏ.
    A.ting(-0.25, 0.97);
    tween(2.6, (k) => { bk.glow = Math.sin(k * Math.PI); });
    const D = DOOR.L, tip = { x: D.x, y: D.gy };
    const crawl = new Rope({ col: 'q', room: 'L', base: BASE.L + 6, a: () => ({ x: D.x, y: D.gy }), b: () => tip, grow: true }).line(D.x, D.gy, D.x + 4, D.gy + 2, 1);
    ropes.L.push(crawl);
    await tween(2.2, (k) => { tip.x = lerp(D.x, 262, k); tip.y = lerp(D.gy, 300, k) + Math.sin(k * Math.PI) * 30; }, easeIO);
    crawl.coil = { x: 262, y: 304, frac: 0.6, max: 10, seed: 91 };
    await sleep(2600);
    await goDoor('L', 2.2);
  }

  // ================= Lần 7 · Phố · 8 giờ tối =================
  // Gửi 8 tin tím. Không có tiếng "ting" nào đáp lại, chỉ có xe máy. Sợi chỉ nằm chùng, không ai cuộn.
  async function lan7() {
    enter('P', 'toi', 'r'); st.day = false; st.doorGlow.P = 0.2; st.vign = 0.6;
    noteOff();
    const ph = phones.P; Object.assign(ph, { glow: 1, hidden: false, card: 1, bat: 30, status: "Đã xem" });
    A.setPlace('pho', 'c', 0.45);
    await fadeTo(0, 0.5);
    await sleep(1500);
    await sendThread(ph, 8, 'q', 'Kéo sợi chỉ vào ngõ');
    await sleep(4200);
    await goDoor('P', 2.4);
  }

  // ================= Lần 8 · Phòng học · 9 giờ tối, trả máy =================
  // Lấy điện thoại khỏi giỏ: cả một búi chỉ tím quấn quanh giỏ, cả tràng tin đổ về cùng lúc. Gửi 1 tin hồng.
  async function lan8() {
    enter('L', 'toi', 'l'); st.day = false; st.doorGlow.L = 0.15; st.vign = 0.55;
    noteOff();
    under.L = [drawL]; nb.flip = 1; nb.line = 1; bk.inside = true; bk.glow = 0;
    ropes.L = ropes.L.filter((r) => r.old);
    const ph = phones.L; Object.assign(ph, { hidden: true, s: 1, glow: 0, x: 482, y: 292, card: 1, bat: 58, status: "Đã xem" });
    const rope = incoming('L', 'q', ph, 18, 61, { x: 262, y: 304 });
    A.setPlace('lop', 'c', 0.7);
    await fadeTo(0, 0.5);
    await sleep(1300);
    await tapOn({ x: 262, y: 300, r: 44 }, 'Lấy điện thoại khỏi giỏ', { ring: 1, text: 4 });
    A.thud(); bk.inside = false; ph.hidden = false;
    await tween(0.55, (k) => { ph.x = lerp(262, 482, k); ph.y = lerp(300, 292, k) - Math.sin(k * Math.PI) * 24; ph.s = 0.5 + k * 0.5; ph.glow = k; }, easeOut);
    arrive(rope, -0.3);
    await reelIn(rope, ph, 7, 8, 'q', 'Chạm vào sợi chỉ để cuộn tin về');
    await readPhone(ph, 2400);
    await sendThread(ph, 1, 't', 'Kéo sợi chỉ ra cửa');
    await sleep(600);
    A.ting(-0.85, 0.75);
    await goDoor('L');
  }

  // ================= Lần 9 · Phòng anh · 9 giờ 40 tối · lần nhắn thật =================
  // Hai người cùng cầm máy: chỉ ngắn tũn, chạm một cái là xong, "ting" đáp lại ngay, tai này gửi tai kia đáp, nhịp nhanh dần.
  // Rồi bên kia "tách" một tiếng: tắt đèn. Không còn "ting" nữa.
  async function lan9() {
    afterLan1();
    enter('A', 'toi', 'r'); st.day = false; st.lamp = true; st.doorGlow.A = 0.3; st.vign = 0.6;
    noteOff();
    under.A = [(c, t) => V.wardrobeOpen(c, t, ward.k, ward.t0), (c, t) => { if (keyState.on) V.keys(c, t); }];
    ward.k = 0; keyState.on = true;
    for (const r of ropes.A) { r.old = true; r.dim = 1; }
    const ph = phones.A; Object.assign(ph, { mode: 'up', x: 588, y: 310, ang: -0.28, glow: 1, hidden: false, card: 1, bat: 18, status: 'Đã xem' });
    clockOn = true; nextTick = NOW + 0.5;
    A.setPlace('phong-toi');
    await fadeTo(0, 0.5);
    M(2);
    await sleep(900);
    const gaps = [900, 600, 380, 250];
    for (let r = 0; r < 4; r++) {
      // Lần duy nhất trong ngày hiện "đang nhập…": bên kia thật sự đang cầm máy, ngay lúc này
      ph.typing = true; await sleep(r === 0 ? 1600 : 1100 - r * 200); ph.typing = false;
      const pk = incoming('A', 't', ph, 2, 100 + r);
      A.ting(0.8, 0.3); arrive(pk, 0.7);
      await reelIn(pk, ph, 1, 1 + (r % 2), 't', '');
      await sendThread(ph, 1 + (r === 3 ? 1 : 0), 'q', r === 0 ? 'Kéo sợi chỉ ra cửa' : '');
      if (r === 1) M(3);
      await sleep(gaps[r]);
    }
    // Bên kia: một tiếng "tách" xa. Khe cửa tối lại.
    await sleep(1600);
    A.sw(0.95); M(1);
    tween(2.2, (k) => { st.doorGlow.A = 0.3 * (1 - k); });
    await sleep(2600);
    await sendThread(ph, 1, 'q', '');
    await sleep(3200);
    M(0);
    await goDoor('A', 2.6);
    clockOn = false;
  }

  // ================= Lần 10 · Phòng em · sau giờ tắt đèn → hành lang =================
  // Tối. Tiếng thở của nhiều người quanh tai (ngủ chung phòng). Điện thoại sáng: 91. Ở đây đông người, không gọi được.
  // Cầm máy ra hành lang, đặt lên lan can sát cột: khung hình trùng khít cảnh mở đầu. Bấm gọi: sợi chỉ căng ngay.
  async function lan10() {
    enter('B', 'dem', 'l'); st.day = false; st.tube = false; st.fold = 0; st.doorGlow.B = 0; st.vign = 0.7;
    noteOff();
    under.B = [drawBlanket];
    for (const r of ropes.B) { r.old = true; r.dim = 1; }
    const ph = phones.B; Object.assign(ph, { hidden: false, x: 360, y: 300, ang: -0.32, s: 1, glow: 0, mode: 'up', scr: 'num', num: '91' });
    A.setPlace('ngu', 'c', 0.9);
    await fadeTo(0, 0.8);
    await sleep(3200);
    noteOff();
    await tween(1.4, (k) => { ph.glow = k; });
    await readPhone(ph, 2600);
    await tapOn({ x: ph.x, y: ph.y - 15, r: 40 }, 'Cầm điện thoại', { ring: 1, text: 4 });
    A.soft('c');
    await tween(0.4, (k) => { ph.y = 300 - k * 30; ph.glow = 1 - k * 0.6; ph.s = 1 - k * 0.4; });
    ph.hidden = true; ph.s = 1;
    tween(1.6, (k) => { st.doorGlow.B = k * 0.5; });
    await tapOn(DOOR.B.hit, 'Ra hành lang', { at: { x: DOOR.B.x, y: 330 }, ring: 1, text: 4, r: 30 });
    await walk('B');
    // Hành lang: còn trống trơn, chưa có sợi chỉ nào
    setRoom('H', 'n'); st.fade = 1; st.vign = 0.8;
    note('', 'Một hành lang', 'Một cô gái đứng lặng ở hành lang, chỗ đầu cầu thang.', 2.4);
    const pH = phones.H; Object.assign(pH, { x: 430, y: 352, ang: 0.05, mode: 'up', scr: 'num', num: '91', glow: 0.9, hidden: false });
    Object.assign(view, { x: 520, y: 252, z: 1.12 });
    A.setPlace('hanh-lang');
    tween(3, (k) => { st.bars = k; });
    await fadeTo(0, 0.8);
    await sleep(1400);
    await dragPhone(pH, { x: 338, y: 289, r: 46 }, 'Đặt điện thoại lên lan can, sát cột');
    A.soft('c');
    await tween(0.3, (k) => { pH.ang = lerp(pH.ang, -0.2, k); pH.x = lerp(pH.x, 338, k); pH.y = lerp(pH.y, 289, k); });
    await sleep(500);
    await camTo(392, 262, 2.2, 2.6);
    st.vign = 1;
    await sleep(900);
    await tapOn({ x: 338, y: 274, r: 34 }, 'Bấm gọi', { ring: 0.8, text: 3, r: 14 });
    pH.scr = 'call'; pH.lightCol = [255, 205, 222];
    Object.assign(taut, { a: () => anchorOf(phones.H), b: () => TAUT_B, grow: 0, vib: 1, vt: NOW, pulses: [] });
    extras.push(drawTaut);
    A.vut(0.6, 2); A.ks(440, 0.12, 0.6);
    await tween(0.55, (k) => { taut.grow = k; }, easeOut);
    await sleep(1800);
    A.coiXa();
    await sleep(3200);
    A.chuong(0.95, 0.75);
    camTo(600, 248, 1.3, 2.6);
    await sleep(2800);
    A.chuong(0.95, 0.75);
    await tapOn(null, 'Đi theo sợi chỉ', { at: () => tautAt(0.48), ring: 0.6, text: 2, r: 26 });
    A.steps(0.6, 4);
    await camTo(1000, 220, 1.7, 1.4, easeIn);
    await fadeTo(1, 0.3);
    extras.splice(extras.indexOf(drawTaut), 1);
  }

  // ================= Lần 11 · Phòng anh · 23:50 · cuộc gọi · cao trào "Cùng một nhịp" =================
  // Người chơi giờ ở đầu bên kia sợi chỉ. Tiếng tích tắc chính là tiếng xa xa ở cảnh mở đầu. Qua điện thoại: dế, gió, tiếng thở run.
  // Lại chạm theo nhịp như lúc đầu. Câu lại hiện "Thật ra đi…", tới đúng chỗ bị cắt thì lần này không cắt.
  const CHUNKS = ['Thật', 'ra', 'đi', 'quân sự', 'cũng không tệ lắm.', 'Nhưng có một chỗ để về,', 'thì càng muốn về hơn.'];
  async function lan11() {
    afterLan1();
    enter('A', 'khuya', 'r'); st.day = false; st.lamp = true; st.doorGlow.A = 0.25; st.vign = 0.65;
    noteOff();
    under.A = [(c, t) => V.wardrobeOpen(c, t, ward.k, ward.t0), (c, t) => { if (keyState.on) V.keys(c, t); }];
    ward.k = 0; keyState.on = true;
    for (const r of ropes.A) { r.old = true; r.dim = 1; }
    const ph = phones.A; Object.assign(ph, { mode: 'up', x: 588, y: 310, ang: -0.28, glow: 1, hidden: false, scr: 'num', num: '91', buzz: true });
    Object.assign(taut, { a: () => anchorOf(phones.A), b: () => ({ x: DOOR.A.x, y: DOOR.A.gy }), grow: 1, vib: 0, pulses: [],
      near: { col: 'q', play: () => A.clockTick(-0.15, 0.04) }, far: { col: 't', play: () => A.cricketAt(0.8, 0.03, true) } });
    extras.push(drawTaut, drawFlash);
    clockOn = false; st.sec = 0;
    A.setPlace('phong-toi');
    await fadeTo(0, 0.6);
    let ringing = true;
    const ring = () => { if (!ringing) return; A.chuong(0.1, 0); setTimeout(ring, 2700); };
    ring();
    await sleep(1200);
    await tapOn({ x: ph.x, y: ph.y - 15, r: 42 }, 'Nghe máy', { ring: 0.6, text: 3 });
    ringing = false; ph.buzz = false; ph.scr = 'call';
    await camTo(690, 320, 1.45, 2.2);
    sobPan = 0.75; sobOn = true; setTimeout(sobLoop, 1400);
    note('', '', 'Đầu dây bên kia: cô ấy đứng lặng ở hành lang, chỗ đầu cầu thang, khóc vì nhớ anh.', 0.6);
    BEAT.final = false; BEAT.meetAt = 0; beats.on = true;
    // Vừa nhấc máy, bài hát đã khẽ vào (như vọng qua điện thoại), từ "Chờ mùa mưa tới" của điệp khúc 2, ngay một vạch nhịp,
    // nhạc lồng mờ dần đi cùng lúc. Rồi dâng đều suốt ~32 giây: nhỏ, nghẹt → "Chúng ta dành hết Xuân thì để chờ nhau" → đoạn dồn → lên cung.
    // Người chơi gảy theo nhịp để nghe hết câu; chậm quá thì câu tự hiện theo nhạc, bài không bao giờ phải đợi.
    if (!bed) A.music.set(0);
    const key1 = await leadIn(bar(52), { vol: 0.07, fade: 3.5, lp: 850 }, 0, 4);
    if (song) {
      const t0 = sclk.start;
      waitFor(() => NOW >= t0 + 3.6).then(() => song && song.ramp(0.4, bar(56) - bar(52) - 3.6, 1700));
      waitT(bar(56)).then(() => song && song.ramp(0.9, KEYT - bar(56), 16000));
    } else A.music.set(2);
    lineSet(CHUNKS);
    await sleep(1800);
    let shown = 0;
    const show = (k) => { if (k > shown) { shown = k; lineShow(k); } };
    const onTap = (k) => { A.ks(NOTES[(k - 1) % 5], 0.11, 0.4); taut.vib = 1; taut.vt = NOW; show(k); };
    await new Promise((res) => {
      let k = 0, done = false;
      const end = () => { if (done) return; done = true; handler = null; clearHint(); res(); };
      hint(() => tautAt(0.5), 'Chạm để gảy sợi chỉ, theo nhịp', { ring: 1.2, text: 4, r: 26 });
      handler = { down() { if (NOW - lastTap < 0.15) return; lastTap = NOW; k++; onTap(k); if (k >= 5) end(); else hint(() => tautAt(0.5), '', { ring: 3.5, r: 26 }); } };
      // không gảy kịp thì câu tự hiện dần theo nhạc, xong trước lúc lên cung
      [208.5, 210.3, 212.0, 213.8, 215.0].forEach((tt, i) => waitT(tt).then(() => { show(i + 1); if (i === 4) end(); }));
    });
    await waitFor(() => NOW >= key1);
    BEAT.conv = () => 0;
    flash.t0 = NOW; taut.vib = 1.4; taut.vt = NOW; if (!song) { A.chime(); A.music.set(4); }
    // Lời em, xen giữa các câu hát (không đè lên chữ "Chờ" nào)
    await waitT(216.9); lineShow(6);
    await waitT(220.4); lineShow(7);
    await waitT(223.5); lineCut();
    await waitT(224.3); lineSet(['Em nhớ anh nhiều lắm.', 'Em siêu nhớ anh đấy.']); lineShow(1);
    await waitT(228.1); lineShow(2);
    await waitT(230.6); sobOn = false;
    await waitT(232.2);
  }
  // Loé sáng ở giữa sợi chỉ lúc hai nhịp trùng nhau
  const flash = { t0: -99 };
  function drawFlash(c, t) {
    const a = t - flash.t0; if (a < 0 || a > 3) return;
    const p = tautAt(0.5), k = Math.exp(-a * 1.4);
    V.glow(c, p.x, p.y, 160 * (0.6 + a * 0.4), [255, 220, 235], 0.55 * k); V.glow(c, p.x, p.y, 26, [255, 255, 255], 0.9 * k);
  }

  // ================= Bản đồ cuối · "Hai múi giờ" =================
  // Khung hình kéo ra: hai căn nhà thu nhỏ đặt cạnh nhau. Mọi sợi chỉ trong ngày nối giữa hai nhà, rối thành búi.
  // Chạm từng búi: chỉ duỗi căng, hiện số giờ đã bị giấu. Hết búi thì hai mặt đồng hồ (lần đầu có số) xoay khớp vào nhau.
  // Chỉ có sợi của cuộc gọi là căng sẵn từ đầu.
  // t: giây (bài gốc) của câu "chờ" ứng với búi đó. Búi chỉ căng khi câu ấy vang lên; bấm sớm thì búi rung khẽ, giữ cú bấm, tới câu mới căng.
  const DAY = [
    { col: 'q', h: 0.5, lab: 'nửa tiếng', t: 237.7 }, { col: 't', h: 3.5, lab: 'ba tiếng rưỡi', t: 241.4 },
    { col: 'q', h: 3, lab: 'ba tiếng', t: 245.3 }, { col: 't', h: 5, lab: 'năm tiếng', t: 247.2 },
    { col: 'q', h: 2, lab: 'hai tiếng', t: 248.8 }, { col: 'q', h: 0.85, lab: 'năm mươi phút', t: 251.5 },
    { col: 't', h: 0.7, lab: 'bốn mươi phút', t: 263.2 },
  ];
  // Lời nửa sau điệp khúc cuối, chạy theo bài. Mỗi đoạn hai hàng, hiện trọn câu (mờ) rồi sáng dần đúng lúc hát.
  // [chữ, giây sáng, giây sáng lại (câu hát nhắc lại)]
  const LYR = [
    { t0: 237.0, t1: 245.0, rows: [[['Chờ mùa mưa tới,', 237.7]], [['chờ từng giấc chiêm bao ngày hè.', 241.4]]] },
    { t0: 245.0, t1: 251.2, rows: [[['Chờ những lời ru, ', 245.3], ['chờ những giai điệu,', 247.2]], [['chờ những vầng trăng.', 248.8]]] },
    { t0: 251.2, t1: 266.6, rows: [[['Chúng ta dành hết Xuân thì', 251.5, 255.0]], [['để ', 261.8], ['chờ nhau.', 263.2]]] },
  ];
  // Chữ "chờ" là chữ quan trọng nhất của bài và của chương: đậm hơn, to hơn, màu hồng; lúc được hát thì phóng to bật lên,
  // loé sáng rồi thu về. Các chữ khác sáng dịu theo lời hát.
  const isCho = (w) => /^chờ/i.test(w);
  function drawLyrics(c, R) {
    const tt = T(); if (tt < 0) return;
    const fs = clamp(ch * 0.046, 15, 27), cy = Math.max(R.A.y * 0.5, 30 + fs * 1.4);
    const F0 = '400 ' + fs.toFixed(1) + 'px Fraunces, serif', F1 = '600 ' + (fs * 1.14).toFixed(1) + 'px Fraunces, serif';
    c.save(); c.textBaseline = 'middle';
    for (const ph of LYR) {
      const al = Math.min(clamp((tt - ph.t0 + 0.9) / 0.6, 0, 1), clamp((ph.t1 - tt) / 0.7, 0, 1));
      if (al <= 0.01) continue;
      ph.rows.forEach((row, ri) => {
        // tách chữ, đo từng chữ theo đúng kiểu chữ của nó (chữ "chờ" đậm, to hơn)
        const toks = [];
        row.forEach((sg) => sg[0].split(/(\s+)/).forEach((w) => { if (w) toks.push({ w, sg, cho: isCho(w) }); }));
        // chữ "chờ" chừa thêm khoảng trống hai bên để lúc phóng to không đè chữ bên cạnh
        toks.forEach((o) => { c.font = o.cho ? F1 : F0; o.wd = c.measureText(o.w).width + (o.cho ? fs * 0.36 : 0); });
        const tw = toks.reduce((x, o) => x + o.wd, 0);
        let x = cw / 2 - tw / 2 + (ri ? fs * 0.9 : -fs * 0.9);
        const y = cy + (ri ? 0.78 : -0.78) * fs;
        for (const o of toks) {
          const sg = o.sg, lit = clamp((tt - sg[1] + 0.12) / 0.45, 0, 1);
          let pulse = tt >= sg[1] ? Math.exp(-(tt - sg[1]) * 1.6) : 0;
          if (sg[2] && tt >= sg[2]) pulse = Math.max(pulse, Math.exp(-(tt - sg[2]) * 1.6));
          const mx = x + o.wd / 2;
          if (o.cho) {
            const pop = tt >= sg[1] ? Math.exp(-(tt - sg[1]) * 2.6) : 0, sc = 1 + 0.55 * pop * lit;
            if (pop > 0.02) V.glow(c, mx, y, fs * 2.6 * (1 + pop), [255, 160, 195], 0.55 * pop * al);
            c.save(); c.translate(mx, y); c.scale(sc, sc); c.font = F1; c.textAlign = 'center';
            c.globalAlpha = al * 0.38; c.shadowBlur = 0; c.fillStyle = '#FFD3E0'; c.fillText(o.w, 0, 0);
            if (lit > 0) { c.globalAlpha = al * lit; c.shadowColor = 'rgba(255,120,165,' + (0.75 + 0.25 * pop) + ')'; c.shadowBlur = 18 + 26 * pop; c.fillStyle = '#FFB8CE'; c.fillText(o.w, 0, 0); }
            c.restore();
          } else {
            c.font = F0; c.textAlign = 'left';
            c.globalAlpha = al * 0.3; c.shadowBlur = 0; c.fillStyle = '#F6EEE2'; c.fillText(o.w, x, y);
            if (lit > 0) { c.globalAlpha = al * lit; c.shadowColor = 'rgba(255,157,184,' + (0.45 + 0.5 * pulse) + ')'; c.shadowBlur = 14 + 16 * pulse; c.fillStyle = '#FBEFF3'; c.fillText(o.w, x, y); }
          }
          x += o.wd;
        }
      });
    }
    c.restore();
  }
  const MAP = { on: false, k: 0, a: 0, tang: DAY.map(() => 1), lab: DAY.map(() => 0), shv: DAY.map(() => -9), gl: DAY.map(() => -9), clock: 0, turn: 1, cards: null, cf: -99, dim: 0, heart: 0, knit: 0 };
  const CARD = { x: 60, y: 20, w: 880, h: 420 };
  function makeCard(room, v) {
    const res = clamp(cw * 0.5 * dpr / CARD.w, 0.5, 1.6), c = document.createElement('canvas');
    c.width = Math.ceil(CARD.w * res); c.height = Math.ceil(CARD.h * res);
    const g = c.getContext('2d'); g.setTransform(res, 0, 0, res, -CARD.x * res, -CARD.y * res);
    V.rooms[room].bg(g, v);
    return c;
  }
  function mapRects() {
    let w = cw * 0.34, h = w * CARD.h / CARD.w;
    if (h > ch * 0.44) { h = ch * 0.44; w = h * CARD.w / CARD.h; }
    const y = ch * 0.53 - h / 2, gap = Math.max(cw * 0.22, 170);
    return { A: { x: cw / 2 - gap / 2 - w, y, w, h }, B: { x: cw / 2 + gap / 2, y, w, h }, gap };
  }
  const inCard = (r, wx, wy) => ({ x: r.x + (wx - CARD.x) / CARD.w * r.w, y: r.y + (wy - CARD.y) / CARD.h * r.h });
  function mapThread(i, R) {
    const n = DAY.length, f = i / (n - 1), y = R.A.y + R.A.h * (0.04 + f * 0.92);
    const a = { x: R.A.x + R.A.w, y }, b = { x: R.B.x, y };
    return { a, b, m: { x: (a.x + b.x) / 2 + (i % 2 ? 1 : -1) * R.gap * 0.17, y } };
  }
  function drawMap(c, t) {
    if (!MAP.on) return;
    const R0 = mapRects(), full = { x: 0, y: 0, w: cw, h: ch }, e = easeIO(MAP.k);
    const lr = (p, q) => ({ x: lerp(p.x, q.x, e), y: lerp(p.y, q.y, e), w: lerp(p.w, q.w, e), h: lerp(p.h, q.h, e) });
    const R = { A: lr(full, R0.A), B: R0.B, gap: R0.gap };
    c.fillStyle = 'rgba(0,0,0,' + MAP.a + ')'; c.fillRect(0, 0, cw, ch);
    const card = (img, r, al) => {
      if (al <= 0.01) return;
      c.save(); c.globalAlpha = al; V.rr(c, r.x, r.y, r.w, r.h, 10 * e); c.clip(); c.drawImage(img, r.x, r.y, r.w, r.h); c.restore();
      c.save(); c.globalAlpha = al * e; c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; V.rr(c, r.x, r.y, r.w, r.h, 10); c.stroke(); c.restore();
    };
    card(MAP.cards.A, R.A, MAP.a);
    card(MAP.cards.B, R.B, Math.max(0, (MAP.k - 0.4) / 0.6));
    if (MAP.k < 0.999) return;
    c.save(); c.globalAlpha = 1;
    // các sợi chỉ trong ngày (búi rối). Vừa chạm thì búi loé sáng.
    DAY.forEach((d, i) => {
      const { a, b, m } = mapThread(i, R), tg = MAP.tang[i], P = [a];
      const loops = Math.ceil(d.h * 3 * tg);
      const Rn = V.rand(200 + i), sv = Math.max(0, 1 - (t - MAP.shv[i]) / 0.5), jit = sv * 3 * Math.sin(t * 60);
      for (let k = 0; k <= 16; k++) P.push({ x: lerp(a.x, m.x, k / 16), y: lerp(a.y, m.y, k / 16) + Math.sin(k / 16 * Math.PI) * 10 * tg });
      for (let k = 0; k < loops; k++) { const an = Rn() * 6.28, r = (6 + Rn() * 10 + d.h * 2.6) * tg; P.push({ x: m.x + Math.cos(an) * r + jit, y: m.y + Math.sin(an) * r * 0.7 - jit * 0.6 }); }
      for (let k = 0; k <= 16; k++) P.push({ x: lerp(m.x, b.x, k / 16), y: lerp(m.y, b.y, k / 16) + Math.sin(k / 16 * Math.PI) * 10 * tg });
      const kp = clamp(MAP.knit * DAY.length - i, 0, 1), al = 0.9 * (1 - 0.6 * MAP.dim) * (1 - kp);
      V.strokeThread(c, P, d.col, al, 0.8);
      const g = Math.exp(-Math.max(0, t - MAP.gl[i]) * 2.6);
      if (g > 0.02) { V.strokeThread(c, P, d.col, g, 2.2); V.glow(c, m.x, m.y, 34 + d.h * 4, [255, 215, 232], 0.5 * g); }
    });
    if (MAP.knit > 0) drawScarf(c, t, R);
    // Sợi của cuộc gọi: căng thẳng tắp từ điện thoại anh sang điện thoại em, không rối, không phải chờ.
    // Sáng nhất bản đồ: quầng rộng, lõi trắng, hai hạt chạy hai chiều gặp nhau giữa sợi. Tới câu cuối thì loé lên, các sợi khác lùi tối.
    const pa = inCard(R.A, 588, 300), pb = inCard(R.B, 338, 282), pul = 0.82 + 0.18 * Math.sin(t * 2.2);
    const cf = Math.exp(-Math.max(0, t - MAP.cf) * 0.9) * (t >= MAP.cf ? 1 : 0), hi = 1 + 0.6 * MAP.dim + 0.8 * cf;
    const CP = callPath(R, pa, pb, easeIO(MAP.heart));
    if (MAP.heart > 0.6) { const hc = CP.hc; V.glow(c, hc.x, hc.y, CP.hs * 1.6, [255, 190, 215], 0.22 * (MAP.heart - 0.6) / 0.4 * pul); }
    V.strokeThread(c, CP.P, [255, 200, 222], 0.32 * pul * hi, 7);
    V.strokeThread(c, CP.P, 't', Math.min(1, pul * hi), 1.9);
    V.strokeThread(c, CP.P, [255, 250, 252], 0.7 * Math.min(1, pul * hi), 0.6);
    const u = (t * 0.32) % 1, N1 = CP.P.length - 1;
    for (const q of [u, 1 - u]) { const f = q * N1, j = Math.min(N1 - 1, Math.floor(f)), A0 = CP.P[j], B0 = CP.P[j + 1]; V.bead(c, lerp(A0.x, B0.x, f - j), lerp(A0.y, B0.y, f - j), 't', 0.9); }
    V.glow(c, pa.x, pa.y, 20 * hi, [255, 230, 240], 0.7); V.glow(c, pb.x, pb.y, 20 * hi, [255, 230, 240], 0.7);
    if (cf > 0.02) V.glow(c, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2, 120 * (1 + cf), [255, 215, 232], 0.45 * cf);
    // nhãn số giờ (vẽ sau cùng để không bị sợi nào đè)
    DAY.forEach((d, i) => {
      if (MAP.lab[i] <= 0.01) return;
      const { m } = mapThread(i, R);
      c.globalAlpha = MAP.lab[i] * (1 - 0.5 * MAP.dim) * clamp(1 - MAP.knit * 2.5, 0, 1); c.font = '500 10.5px "Be Vietnam Pro", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const tw = c.measureText(d.lab).width + 10; c.fillStyle = 'rgba(0,0,0,.72)'; V.rr(c, m.x - tw / 2, m.y - 7.5, tw, 15, 7.5); c.fill();
      c.fillStyle = 'rgba(255,240,245,.95)'; c.fillText(d.lab, m.x, m.y + 0.5); c.textAlign = 'start'; c.textBaseline = 'alphabetic'; c.globalAlpha = 1;
    });
    c.restore();
    // hai mặt đồng hồ, lần đầu có số; đồng hồ bên em lệch rồi xoay khớp
    if (MAP.clock > 0.01) {
      const r = Math.min(R.A.h * 0.2, 46);
      mapClock(c, R.A.x + R.A.w / 2, R.A.y - r - 12, r, 0, MAP.clock);
      mapClock(c, R.B.x + R.B.w / 2, R.B.y - r - 12, r, MAP.turn * 3.5 / 12 * Math.PI * 2, MAP.clock);
    }
  }
  // Đường đi của sợi cuộc gọi. k = 0: thẳng tắp từ máy anh sang máy em. k = 1: vươn lên phía trên, giữa hai mặt đồng hồ,
  // xoắn thành một trái tim (hai đầu sợi vắt chéo nhau ở mũi tim), rồi mới xuống máy em. Không đi qua vùng các búi chỉ.
  function callPath(R, pa, pb, k) {
    const N = 150, P = [];
    const cx = (R.A.x + R.A.w + R.B.x) / 2, ty = R.A.y - 24, top = 24;
    const hh = clamp(ty - top, 36, 130), uu = Math.min(hh / 1.78, R.gap * 0.33);
    const H = (tt) => { const sn = Math.sin(tt); return { x: cx + 16 * sn * sn * sn / 17 * uu * 1.05, y: ty - (1 + (13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt)) / 17) * uu }; };
    const bz = (p0, c1, c2, p1, f) => { const g = 1 - f; return { x: g * g * g * p0.x + 3 * g * g * f * c1.x + 3 * g * f * f * c2.x + f * f * f * p1.x, y: g * g * g * p0.y + 3 * g * g * f * c1.y + 3 * g * f * f * c2.y + f * f * f * p1.y }; };
    const T0 = { x: cx, y: ty }, lift = R.A.y - 16;
    const n1 = 36, n2 = 78, n3 = N - n1 - n2;
    const path = [];
    for (let i = 0; i < n1; i++) path.push(bz(pa, { x: pa.x, y: lift - 20 }, { x: cx - uu * 0.8, y: ty + uu * 0.32 }, T0, i / n1));
    for (let i = 0; i < n2; i++) path.push(H(Math.PI - (i / n2) * Math.PI * 2));
    for (let i = 0; i <= n3; i++) path.push(bz(T0, { x: cx + uu * 0.8, y: ty + uu * 0.32 }, { x: pb.x, y: lift - 20 }, pb, i / n3));
    for (let i = 0; i < path.length; i++) {
      const f = i / (path.length - 1), sx = lerp(pa.x, pb.x, f), sy = lerp(pa.y, pb.y, f);
      P.push(k <= 0 ? { x: sx, y: sy } : { x: lerp(sx, path[i].x, k), y: lerp(sy, path[i].y, k) });
    }
    return { P, hc: { x: cx, y: ty - uu * 0.85 }, hs: uu };
  }
  // Chiếc khăn: bảy sợi chờ được đan lại, mỗi sợi thành một vạch đúng màu của nó (tím: tin anh, hồng: tin em),
  // đan từng mũi từ trái sang phải, vạch này xong tới vạch kia. Xong thì có tua hai đầu và một quầng ấm.
  function drawScarf(c, t, R) {
    const n = DAY.length, gx0 = R.A.x + R.A.w, gx1 = R.B.x, cxm = (gx0 + gx1) / 2;
    const W = Math.min((gx1 - gx0) * 0.84, 420), H = Math.min(R.A.h * 0.8, W * 0.62), x0 = cxm - W / 2, y0 = R.A.y + R.A.h * 0.5 - H / 2;
    const band = H / n, sw = clamp(band * 0.62, 5, 11), cols = Math.max(6, Math.floor(W / sw)), rows = Math.max(1, Math.round(band / (sw * 0.78)));
    const done = clamp(MAP.knit * n - n + 1, 0, 1);
    if (done > 0) V.glow(c, cxm, y0 + H / 2, W * 0.9, [255, 196, 160], 0.26 * done);
    c.save(); c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const p = clamp(MAP.knit * n - i, 0, 1); if (p <= 0) break;
      const C = V.COL[DAY[i].col], hiC = [Math.min(255, C[0] + 50), Math.min(255, C[1] + 55), Math.min(255, C[2] + 40)], loC = [C[0] * 0.62, C[1] * 0.55, C[2] * 0.62];
      const total = cols * rows, shown = Math.floor(total * p);
      for (let k = 0; k < shown; k++) {
        const r = Math.floor(k / cols), cI = k % cols, x = x0 + cI * (W / cols), y = y0 + i * band + (r + 0.15) * (band / rows);
        const wv = Math.sin(cI * 0.22 + t * 0.9) * 0.9, sh = band / rows * 0.95, w2 = W / cols;
        // một mũi len hình chữ V: hai nét dày, viền tối, ánh sáng trên mép
        c.strokeStyle = V.rgba(loC, 0.95); c.lineWidth = w2 * 0.52;
        c.beginPath(); c.moveTo(x + w2 * 0.12, y + wv); c.lineTo(x + w2 * 0.5, y + sh + wv); c.lineTo(x + w2 * 0.88, y + wv); c.stroke();
        c.strokeStyle = V.rgba(C, 0.98); c.lineWidth = w2 * 0.36; c.stroke();
        c.strokeStyle = V.rgba(hiC, 0.55); c.lineWidth = w2 * 0.12;
        c.beginPath(); c.moveTo(x + w2 * 0.2, y + wv - 0.4); c.lineTo(x + w2 * 0.46, y + sh * 0.7 + wv); c.stroke();
      }
      // mũi đang đan: một đốm sáng nhỏ ở đầu kim
      if (p < 1) { const k = shown, r = Math.floor(k / cols), cI = k % cols; V.glow(c, x0 + (cI + 0.5) * (W / cols), y0 + i * band + (r + 0.6) * (band / rows), 10, [255, 240, 230], 0.8); }
    }
    // tua hai đầu khăn
    if (done > 0) {
      for (let i = 0; i < n; i++) {
        const C = V.COL[DAY[i].col], yy = y0 + (i + 0.5) * band;
        c.strokeStyle = V.rgba(C, 0.85 * done); c.lineWidth = 1.6;
        for (const side of [-1, 1]) {
          const xe = side < 0 ? x0 + 1 : x0 + W - 1;
          for (const dy of [-band * 0.22, band * 0.22]) { const sw2 = Math.sin(t * 1.3 + i + dy) * 1.5; c.beginPath(); c.moveTo(xe, yy + dy); c.quadraticCurveTo(xe + side * 6, yy + dy + sw2, xe + side * 12 * done, yy + dy + sw2 * 1.6); c.stroke(); }
        }
      }
    }
    c.restore();
  }
  function mapClock(c, x, y, r, off, al) {
    c.save(); c.globalAlpha = al;
    V.glow(c, x, y, r * 1.8, [255, 230, 200], 0.15);
    c.fillStyle = '#EDE6D8'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = '#3A2E2A'; c.lineWidth = 2.5; c.stroke();
    c.save(); c.translate(x, y); c.rotate(off);
    c.fillStyle = '#2A2222'; c.font = '600 ' + Math.round(r * 0.26) + 'px Fraunces, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; c.fillText(String(i), Math.sin(a) * r * 0.76, -Math.cos(a) * r * 0.76); }
    c.restore();
    const hand = (a, len, wd) => { c.strokeStyle = '#241C1C'; c.lineWidth = wd; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * len, y - Math.cos(a) * len); c.stroke(); };
    hand((11 + 50 / 60) / 12 * Math.PI * 2, r * 0.48, 3); hand(50 / 60 * Math.PI * 2, r * 0.72, 2);
    c.fillStyle = '#241C1C'; c.beginPath(); c.arc(x, y, 2.5, 0, 7); c.fill();
    c.restore();
  }
  async function banDo() {
    beats.on = false; noteOff();
    if (st.fade > 0.5) { setRoom('A', 'khuya'); afterLan1(); fadeTo(0, 0.6); }
    // Vào thẳng bản đồ (?canh=12): bài chưa chạy thì cho chạy từ đúng chỗ cuộc gọi vừa xong
    if (T() < 0) await playFrom(232.2, { vol: 0.9, fade: 1.2 });
    camTo(500, 240, 1.12, 1.8);
    MAP.cards = { A: makeCard('A', 'khuya'), B: makeCard('H', 'n') };
    MAP.on = true; MAP.k = 0; MAP.a = 1; MAP.clock = 0; MAP.turn = 1;
    MAP.tang = DAY.map(() => 1); MAP.lab = DAY.map(() => 0); MAP.shv = DAY.map(() => -9); MAP.gl = DAY.map(() => -9); MAP.cf = -99; MAP.dim = 0; MAP.heart = 0; MAP.knit = 0;
    st.vign = 0.5;
    setTimeout(lineCut, 1200);
    await tween(3.2, (k) => { MAP.k = k; }, lin);
    if (!song) A.music.set(2);
    // Chạm búi chỉ, theo lời hát. Búi căng lần lượt, mỗi búi đúng một câu "chờ"; bấm sớm thì giữ lại một cú, tới câu mới căng.
    await new Promise((res) => {
      // Mỗi búi một lần chạm. Chạm đúng lúc câu "chờ" của búi đó vang lên thì căng ngay; chạm sớm thì búi loé sáng, rung khẽ,
      // giữ cú chạm lại, tới câu của nó mới căng. Nhờ vậy ai chạm nhanh cũng thấy từng búi bung ra đúng theo lời hát.
      const NOTE = [659.3, 740, 830.6, 987.8, 1108.7, 1318.5, 1661.2];
      let q = 0, done = false;
      const next = () => DAY.findIndex((d, i) => MAP.tang[i] > 0.5);
      const ready = (i) => T() >= DAY[i].t - 0.2;
      const panOf = (i) => (mapThread(i, mapRects()).m.x / cw - 0.5) * 1.2;
      const pull = (i) => {
        MAP.tang[i] = 0.49; MAP.gl[i] = NOW; clearHint();
        A.ks(NOTE[i], 0.09, panOf(i)); A.ks(NOTE[i] / 2, 0.05, panOf(i));
        tween(0.8, (k) => { MAP.tang[i] = 0.49 * (1 - k); }, easeOut);
        tween(1, (k) => { MAP.lab[i] = k; });
        if (next() < 0) { done = true; handler = null; screenHint = null; clearInterval(iv); setTimeout(res, 1400); }
      };
      const iv = setInterval(() => { const i = next(); if (q > 0 && i >= 0 && ready(i)) { q = 0; pull(i); } }, 20);
      screenHint = () => { const i = next(); if (i < 0 || q) return null; const m = mapThread(i, mapRects()).m; return { x: m.x, y: m.y }; };
      hint(null, 'Chạm vào búi chỉ để gỡ, theo lời hát', { ring: 99, text: 1.5 });
      handler = {
        screen: true,
        down() {
          if (done) return;
          const i = next(); if (i < 0) return;
          MAP.gl[i] = NOW;
          if (ready(i) && !q) { pull(i); return; }
          // Sớm quá: búi rung khẽ, chờ tới câu của nó
          q = 1; MAP.shv[i] = NOW; A.ks(329.6, 0.035, 0);
        },
      };
    });
    // Đợi bài hát xong câu "để chờ nhau"
    await waitT(266.2);
    // Hai đồng hồ hiện ra, đồng hồ bên em xoay khớp
    await sleep(600);
    await tween(1.4, (k) => { MAP.clock = k; });
    await sleep(900);
    let tk = 0;
    await tween(3, (k) => { MAP.turn = 1 - k; const n = Math.floor(k * 14); if (n > tk) { tk = n; A.clockTick(0.3, 0.035); } }, easeIO);
    A.chime();
    await sleep(800);
    lineSet(['Cách nhau tám mươi cây số.', 'Lệch nhau như hai múi giờ.']);
    lineShow(1); await sleep(2200); lineShow(2); await sleep(4200);
    lineCut(); await sleep(400);
    lineSet(['Cả ngày, chỉ một lần không phải chờ.']); lineShow(1);
    MAP.cf = NOW; tween(2.4, (k) => { MAP.dim = k; });
    // Sợi chỉ duy nhất không phải chờ: vươn lên, xoắn thành trái tim
    tween(3.2, (k) => { MAP.heart = k; }, lin);
    [659.3, 830.6, 987.8, 1318.5].forEach((f, j) => setTimeout(() => A.ks(f, 0.07, (j - 1.5) * 0.3), j * 420));
    await sleep(5600);
    lineCut();
    // Bài chạy hết tới nốt cuối (4:48), không cắt. Bài dứt rồi giai điệu dạo đầu mới khẽ vào (bài cuối ở tông Mi, dạo đầu ở tông Rê,
    // không cho chồng lên nhau), nối qua lúc đan khăn sang sáng hôm sau.
    waitT(288.3).then(() => { if (song) { song.stop(1.5); song = null; } bedLv = 0; bedGrow = 0; bedOn(BED_FULL, 6, [0.13, 1500]); });
    // Như một câu chuyện ngụ ngôn: sợi chỉ hồng của ông Tơ bà Nguyệt. Những giờ chờ không mất đi, chúng được đan lại thành chiếc khăn.
    await sleep(500);
    lineSet(['Người xưa bảo, ông Tơ bà Nguyệt', 'buộc hai người bằng một sợi chỉ hồng.']); lineShow(1); await sleep(1800); lineShow(2); await sleep(3600);
    lineCut(); await sleep(300);
    lineSet(['Người xưa không kể,', 'sợi chỉ ấy có những đoạn phải chờ.']); lineShow(1); await sleep(1700); lineShow(2);
    // đan khăn: từng vạch một, tiếng kim đan khe khẽ, mỗi vạch xong ngân một nốt (Si, Fa thăng: có trong cả tông Rê lẫn tông Mi)
    let lastStripe = -1, lastStitch = 0;
    const KN = [493.9, 740, 987.8, 740, 493.9, 987.8, 1480];
    await tween(10, (k) => {
      MAP.knit = k;
      const st = Math.floor(k * DAY.length);
      if (st > lastStripe && st > 0) { lastStripe = st; A.ks(KN[Math.min(KN.length - 1, st - 1)], 0.07, 0); }
      if (NOW - lastStitch > 0.19) { lastStitch = NOW; A.clockTick((Math.random() - 0.5) * 0.4, 0.012); }
      if (k > 0.45 && lineEl.textContent.indexOf('không kể') >= 0) lineCut();
    }, lin);
    MAP.knit = 1; A.ks(1480, 0.06, 0); A.ks(740, 0.05, 0);
    await sleep(400);
    lineSet(['Những giờ chờ không mất đi. Chúng được đan lại,', 'thành một chiếc khăn, đủ ấm cho hai người.']); lineShow(1); await sleep(2600); lineShow(2);
    await sleep(5200);
    lineCut();
    await fadeTo(1, 3.2);
    if (song) { song.stop(1.5); song = null; }
    if (!bed) { bedLv = 0; bedGrow = 0; bedOn(BED_FULL, 4, [0.13, 1500]); }
    MAP.on = false;
  }
  let screenHint = null;

  // ================= Kết · Phòng em · 5 giờ sáng hôm sau =================
  // Chuông báo thức, mà giờ người chơi đã biết là còi. Đầu chỉ tím thò ra: 7 tin anh gửi lúc 4 giờ 30. Vòng lặp khép lại. 92.
  async function ket() {
    enter('B', 'dark', 'l'); st.day = false; st.tube = false; st.fold = 0; st.doorGlow.B = 0.4; st.vign = 0.6; st.bars = 0;
    note('05:00', 'Sáng hôm sau');
    under.B = [drawBlanket]; extras.length = 0;
    const ph = phones.B; Object.assign(ph, { hidden: false, x: 360, y: 300, ang: -0.32, s: 1, glow: 0, mode: 'up', scr: 'chat', num: null, msgs: [] });
    const rope = incoming('B', 'q', ph, 4, 8);
    A.setPlace('phong-trai', 'c', 0.8);
    // Ngày mới, lại bắt đầu chờ: bài hát vang lại từ đầu, rất khẽ
    bedOn(BED_FULL, 6, [0.13, 1500]);
    await fadeTo(0, 1.2);
    await sleep(2200);
    A.coiXa();
    await sleep(3800);
    A.tube('c'); st.v2 = 'tube';
    for (const m of [0.7, 0, 0.85, 0.12, 1]) { st.mix = m; await sleep(90 + Math.random() * 60); }
    st.v = 'tube'; st.v2 = null; st.mix = 0; st.tube = true;
    tween(1, (k) => { ph.glow = k; });
    arrive(rope, -0.4);
    await reelIn(rope, ph, 2, 7, 'q', '');
    ph.scr = 'num'; ph.num = '92';
    M(1);
    await readPhone(ph, 3600);
    await sleep(1200);
    await fadeTo(1, 3);
    M(0);
  }

  // ================= Kết bản dựng thử =================
  function hetChuong() {
    try { localStorage.setItem('soichi:xong', '1'); } catch (e) { /* bỏ qua */ }
    // Như cuối phim: chữ hiện lên trong lúc giai điệu còn ngân, rõ dần, rồi mới tắt hẳn
    A.setPlace(null); noteOff();
    if (bed) { bed.set(0.17, 2600, 4); setTimeout(() => bedOff(9), 14000); }
    $('tobe').querySelector('.st-title').textContent = 'Sợi chỉ';
    $('tobe').querySelector('small').textContent = 'Một ngày, hai nơi, một sợi chỉ.';
    if (!$('credit')) { const cr = document.createElement('small'); cr.id = 'credit'; cr.className = 'credit'; cr.textContent = 'Nhạc: Dành Hết Xuân Thì Để Chờ Nhau · Vũ. & Hà Anh Tuấn'; $('tobe').appendChild(cr); }
    $('tobe').hidden = false;
  }
  function tobe() {
    A.setPlace(null); bedOff(2); A.music.set(0);
    $('tobe').hidden = false;
  }
  $('btn-again').addEventListener('click', () => { location.href = location.pathname; });

  // ================= Giải đáp =================
  // Kể lại cả ngày theo đúng giờ thật: người chơi đã thấy gì, chuyện gì thật sự đang xảy ra, manh mối nào đã giấu.
  // Chỉ dùng chuyện có trong kịch bản đã duyệt và các chương trước. Hai giờ chưa chắc (trưa, chiều) chỉ ghi buổi, không ghi phút.
  const GIAI = [
    { t: '23:50', tag: 'Mở đầu', where: 'Hành lang doanh trại', room: 'H', v: 'n',
      saw: 'Một hành lang tối, một sợi chỉ căng, tiếng ai đó sụt sịt. Câu "Thật ra đi…" bị cắt ngang.',
      truth: 'Đây là <b>cảnh cuối cùng của ngày</b>, được chiếu trước. Em ra hành lang gọi cho anh, đứng sát cột, khóc vì nhớ. Chữ bị cắt mất là <b>"quân sự"</b>.' },
    { t: '04:30', tag: 'Lần 1', where: 'Phòng anh', room: 'A', v: 'on',
      saw: 'Anh gửi 7 tin tím, úp máy, tắt đèn.',
      truth: 'Anh thức gần trọn đêm, như "đơn vị gác đêm" ở chương 18, để <b>5 giờ còi thổi, em mở máy là có tin</b>. Dòng "nhớ ngủ sớm, bớt thức khuya" là lời em dặn sáng hôm 26, lúc sắp đi.',
      clue: 'Đồng hồ treo tường chỉ 4 giờ 30. Pin 92%.' },
    { t: '05:00', tag: 'Lần 2', where: 'Chỗ ngủ ở doanh trại', room: 'B', v: 'tube', wait: 'tin anh chờ nửa tiếng',
      saw: 'Một căn phòng, tiếng chuông xa, đèn bật, gấp chăn, đọc tin, trả lời rồi cất máy. Ngay sau đó có tiếng "ting".',
      truth: 'Tiếng "chuông" là <b>còi báo thức</b>. Tiếng "ting" ngay sau đó <b>không phải lúc em gửi</b>, mà là lúc anh cầm máy lên đọc: <b>8 giờ 30</b>.',
      clue: 'Cửa chớp, đèn tuýp, giường sắt có màn, giường bên cạnh giống hệt. Chăn phải gấp gọn.' },
    { t: '08:30', tag: 'Lần 3', where: 'Phòng anh', room: 'A', v: 'sang', wait: 'tin em chờ ba tiếng rưỡi',
      saw: 'Anh "trả lời ngay".',
      truth: 'Tin em đã nằm đó <b>ba tiếng rưỡi</b>. Búi chỉ to hơn hẳn lần trước.',
      clue: 'Nắng đã lên, đồng hồ 8 giờ 30. Pin 92% → 81%. Tủ áo trống một nửa vì thiếu đồ của em; cái móc em hay treo áo đung đưa, trống không.' },
    { t: 'Trưa', tag: 'Lần 4', where: 'Doanh trại · giờ nghỉ trưa', room: 'B', v: 'trua', wait: 'tin anh chờ khoảng ba tiếng',
      saw: 'Lấy máy trong ngăn tủ, đọc, gửi vội 4 tin, cất máy.',
      truth: 'Cả buổi sáng điện thoại nằm trong ngăn tủ. Em chỉ có <b>vài phút</b> nghỉ trưa. Có tiếng còi ngoài sân là phải cất máy.',
      clue: 'Giường đã gọn sẵn từ sáng. Tiếng còi ngắn. Pin 100% → 86%.' },
    { t: 'Chiều', tag: 'Lần 5', where: 'Ngoài phố', room: 'P', v: 'chieu', wait: 'tin em chờ khoảng năm tiếng',
      saw: 'Anh lấy máy trên yên xe, cuộn chỉ, trả lời.',
      truth: 'Tin em gửi lúc trưa, tới chiều anh mới đọc: <b>lần chờ lâu nhất trong ngày</b>.',
      clue: 'Pin chỉ còn 47%.' },
    { t: '19:00', tag: 'Lần 6', where: 'Phòng học tập trung', room: 'L', v: 'toi', wait: 'tin anh chờ hai tiếng',
      saw: 'Trông như ngồi làm bài ở nhà. Phải bỏ điện thoại vào giỏ. Rồi có tiếng "ting" nghẹt trong giỏ.',
      truth: 'Điện thoại phải <b>nộp vào giỏ chung</b>, trong giỏ có rất nhiều máy. Tin anh tới mà không lấy ra được: <b>lần đầu tiên có tin mà không trả lời được</b>.',
      clue: 'Chiếc giỏ có nhiều điện thoại. Bàn học dài, cuốn vở giống hệt nhau.' },
    { t: '20:10', tag: 'Lần 7', where: 'Ngoài phố, tối', room: 'P', v: 'toi',
      saw: 'Anh gửi 8 tin. Không có tiếng đáp.',
      truth: 'Máy em <b>đang nằm trong giỏ</b>. Sợi chỉ chùng xuống, không ai cuộn.',
      clue: 'Pin 30%.' },
    { t: '21:00', tag: 'Lần 8', where: 'Phòng học · trả máy', room: 'L', v: 'toi', wait: 'tin anh chờ năm mươi phút',
      saw: 'Lấy máy khỏi giỏ, một búi chỉ tím quấn quanh.',
      truth: 'Được trả máy, <b>cả tràng tin anh đổ về cùng lúc</b>. Em nhắn lại.' },
    { t: '21:40', tag: 'Lần 9', where: 'Phòng anh', room: 'A', v: 'toi', wait: 'tin em chờ bốn mươi phút, rồi không ai phải chờ',
      saw: 'Nhắn qua lại thật nhanh, có "đang nhập…".',
      truth: '<b>Lần duy nhất trong ngày hai người cùng cầm máy.</b> Đây mới là "trả lời ngay" thật. Rồi bên kia "tách" một tiếng: tắt đèn.',
      clue: '"Đang nhập…" chỉ xuất hiện đúng lần này. Pin 18%.' },
    { t: '22:00 → 23:50', tag: 'Lần 10', where: 'Doanh trại · tắt đèn', room: 'B', v: 'dem',
      saw: 'Phòng tối, điện thoại hiện số 91. Cầm máy ra hành lang, đặt lên lan can, bấm gọi.',
      truth: 'Cả phòng tắt đèn cùng lúc, nhiều người ngủ chung nên không gọi được. <b>Số 91</b> là số ngày anh đếm, từ đêm 23 giờ 38 phút ngày 6/8, đêm em nhận lời. Em đặt máy sát cột và gọi: khung hình <b>trùng khít cảnh mở đầu</b>.',
      clue: 'Tiếng thở của nhiều người, các giường giống hệt nhau, tiếng còi ngoài trời.' },
    { t: '23:50', tag: 'Lần 11', where: 'Phòng anh · cuộc gọi', room: 'A', v: 'khuya',
      saw: 'Gảy sợi chỉ như lúc đầu. Lần này câu không bị cắt.',
      truth: 'Đây là <b>đầu kia của cuộc gọi ở cảnh mở đầu</b>. Câu trọn vẹn: <b>"Thật ra đi quân sự cũng không tệ lắm. Nhưng có một chỗ để về, thì càng muốn về hơn."</b> Rồi: "Em nhớ anh nhiều lắm. Em siêu nhớ anh đấy."' },
    { t: 'Cả ngày', tag: 'Bản đồ', where: 'Hai nơi, tám mươi cây số', room: 'A', v: 'khuya', map: true,
      saw: 'Bảy búi chỉ, gỡ theo lời hát.',
      truth: 'Bảy lần chờ, <b>lúc thì em chờ anh, lúc thì anh chờ em</b>: nửa tiếng · ba tiếng rưỡi · ba tiếng · năm tiếng · hai tiếng · năm mươi phút · bốn mươi phút. Cả ngày, chỉ một lần không phải chờ: <b>cuộc gọi</b>, sợi chỉ thẳng tắp, sáng nhất.' },
    { t: '05:00', tag: 'Kết', where: 'Doanh trại · sáng hôm sau', room: 'B', v: 'tube',
      saw: 'Còi lại thổi, lại có 7 tin tím. Số 92.',
      truth: 'Còi thổi, 7 tin gửi lúc 4 giờ 30 đã nằm sẵn đó. Một ngày <b>thay nhau chờ nhau</b> lại bắt đầu.' },
  ];
  function thumb(room, v, wpx) {
    const c = document.createElement('canvas'), res = clamp(wpx * (window.devicePixelRatio || 1) / CARD.w, 0.25, 1.2);
    c.width = Math.ceil(CARD.w * res); c.height = Math.ceil(CARD.h * res);
    const g = c.getContext('2d'); g.setTransform(res, 0, 0, res, -CARD.x * res, -CARD.y * res);
    try { V.rooms[room].bg(g, v); } catch (e) { /* bỏ qua */ }
    return c;
  }
  let giaiBuilt = false, giaiBack = null;
  function buildGiai() {
    if (giaiBuilt) return; giaiBuilt = true;
    const el = $('giai-in'), esc = (x) => x.replace(/[<>&]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[m]);
    el.innerHTML = '<h2 class="gi-h">Giải đáp · Sợi chỉ</h2><p class="gi-sub">Một ngày, hai nơi, kể lại đúng theo giờ thật.</p>'
      + '<div class="gi-box"><h3>Cú lừa</h3><p>Lúc chơi, bạn tưởng hai người đang <b>nhắn qua lại liền tay</b>: gửi đi là có "ting" đáp lại ngay.</p>'
      + '<p>Thật ra <b>mỗi câu trả lời đi mất mấy tiếng</b>. Không phải một người chờ một người: <b>lúc em rảnh thì anh bận, lúc anh rảnh thì em không được cầm máy</b> (em đang đi quân sự, điện thoại cất trong tủ, nộp vào giỏ). Hai người thay nhau chờ nhau.</p></div>'
      + '<div class="gi-box"><h3>Cách đọc sợi chỉ</h3><ul class="gi-legend"><li><i style="background:#BEA0FF"></i>Chỉ tím: tin anh</li><li><i style="background:#FF96B6"></i>Chỉ hồng: tin em</li>'
      + '<li>Búi chỉ càng to, cuộn càng lâu: tin càng phải chờ lâu</li><li>"Ting": lúc người kia cầm máy lên, không phải lúc gửi</li><li>Pin tụt: thời gian đã trôi</li></ul></div>';
    for (const g of GIAI) {
      const d = document.createElement('div'); d.className = 'gi-step';
      const tc = thumb(g.room, g.v, 280);
      d.appendChild(tc);
      const tx = document.createElement('div');
      tx.innerHTML = '<p class="gi-time">' + esc(g.t) + '<small>' + esc(g.tag) + '</small></p><p class="gi-where">' + esc(g.where) + '</p>'
        + (g.wait ? '<span class="gi-wait">' + esc(g.wait) + '</span>' : '')
        + '<p>Bạn thấy: ' + esc(g.saw) + '</p><p>Thật ra: ' + g.truth + '</p>' + (g.clue ? '<p class="gi-clue">Manh mối: ' + esc(g.clue) + '</p>' : '');
      d.appendChild(tx); el.appendChild(d);
    }
    // Những chi tiết ẩn, giải thích ý nghĩa (chỉ dùng chuyện có trong các chương và kịch bản đã duyệt)
    const DET = [
      ['Chiếc móc áo đung đưa trong tủ nhà anh', 'Một nửa cái tủ trống là vì <b>thiếu đồ của em</b>. Trước hôm đi, áo em treo lẫn với áo anh, mở tủ ra là thấy cả hai đứa. Em gấp từng cái vào vali (chương "Nhẹ đi một người"). Cái móc em hay treo áo vẫn ở đó, trống không, khẽ đung đưa.'],
      ['Đồng hồ treo tường không có số', 'Để bạn khó đoán giờ mà tưởng hai nơi đang cùng một lúc. Nhưng kim vẫn đọc được nếu chịu nhìn: 4 giờ 30, rồi 8 giờ 30, rồi 9 giờ 40 tối.'],
      ['Hai mặt đồng hồ ở bản đồ', 'Lần đầu tiên có số. Đồng hồ bên em <b>lệch đi</b> so với bên anh rồi mới từ từ <b>xoay khớp</b>. Cả ngày hai người sống lệch nhau: người này rảnh thì người kia bận. Chỉ tới cuộc gọi cuối ngày, hai mặt đồng hồ mới chỉ cùng một giờ.'],
      ['Hai nhịp đập lệch nhau', 'Tiếng tích tắc bên anh và tiếng dế bên em, hai nhịp sống khác nhau. Ở cảnh mở đầu, hai nhịp sắp trùng thì bị cắt. Ở cuộc gọi, chúng trùng làm một, đúng phách bài hát lên một cung.'],
      ['Pin tụt', '"Trả lời ngay" mà pin tụt cả chục phần trăm: giữa hai câu nhắn đã trôi qua mấy tiếng. Pin tím là máy anh, pin hồng là máy em.'],
      ['Tiếng "ting" bên tai trái, tai phải', 'Đeo tai nghe sẽ nghe tin vọng sang từ phía cánh cửa của nhà kia. Tiếng "ting" là lúc người kia cầm máy lên, không phải lúc gửi.'],
      ['Căn phòng của em', 'Giường lúc nào cũng gọn, các giường giống hệt nhau, giỏ có rất nhiều điện thoại, đèn tắt cùng lúc, tiếng "chuông" thật ra là còi: không phải nhà, mà là <b>doanh trại</b>.'],
      ['"Nhớ ngủ sớm, bớt thức khuya"', 'Lời em dặn sáng hôm 26, lúc sắp đi. Dòng chữ hiện mờ trên máy anh lúc 4 giờ 30, khi anh vẫn còn thức.'],
      ['Số 91, rồi 92', 'Số ngày anh đếm, từ đêm 23 giờ 38 phút ngày 6/8, đêm em nhận lời. Sang hôm sau thì thêm một ngày.'],
      ['Sợi chỉ thẳng tắp của cuộc gọi', 'Không búi, không chùng, sáng nhất bản đồ: lần duy nhất trong ngày <b>không ai phải chờ ai</b>. Cuối cùng nó uốn thành một trái tim.'],
      ['Chiếc khăn', 'Bảy búi chờ được gỡ ra rồi đan lại, mỗi vạch là một lần chờ, tím và hồng xen nhau: <b>những giờ chờ của cả hai người</b>, đan thành một thứ để giữ ấm cho nhau.'],
    ];
    el.insertAdjacentHTML('beforeend', '<div class="gi-box gi-det"><h3>Những chi tiết có thể bạn đã bỏ qua</h3>' + DET.map(([h, t]) => '<p><b>' + esc(h) + '.</b> ' + t + '</p>').join('') + '</div>');
    el.insertAdjacentHTML('beforeend', '<p class="gi-end">Cách nhau tám mươi cây số. Cả ngày, chỉ một lần không phải chờ.</p>');
  }
  function openGiai(back) {
    buildGiai(); giaiBack = back || null;
    if (back) $(back).hidden = true;
    $('giai').hidden = false; $('giai').scrollTop = 0;
  }
  $('giai-close').addEventListener('click', () => { $('giai').hidden = true; if (giaiBack) $(giaiBack).hidden = false; });
  $('btn-giai').addEventListener('click', () => openGiai('tobe'));
  $('btn-giai0').addEventListener('click', () => openGiai('start'));
  const sb = $('btn-sound');
  sb.classList.toggle('off', A.muted);
  sb.addEventListener('click', () => { A.mute(!A.muted); sb.classList.toggle('off', A.muted); });

  async function run() {
    const from = +(Q.get('canh') || 0);
    $('top').hidden = false;
    if (from <= 0) await coldOpen();
    const LAN = [lan1, lan2, lan3, lan4, lan5, lan6, lan7, lan8, lan9, lan10, lan11];
    for (let i = Math.max(1, from); i <= 11; i++) {
      // Lần 1 → 9: không nhạc. Chỉ có âm thanh không gian (tiếng "ting" bên trái / phải cửa, tin bay qua đầu, tiếng phòng):
      // nhạc nền sẽ che mất cảm giác 8D. Nhạc không lời chỉ khẽ vào từ Lần 10 (tắt đèn, ra hành lang), âm ỉ dâng tới cao trào.
      bedGrow = i >= 10 ? (i - 10) : 0;
      if (i >= 10) { bedOn(BED_FULL, i === 10 ? 12 : 4); M(bedLv); }
      else if (bedFile) A.music.set(0);
      await LAN[i - 1]();
    }
    if (from <= 12) await banDo();
    await ket();
    hetChuong();
  }

  // Chỉ để thử tự động (?dbg): đổi toạ độ thế giới ra toạ độ màn hình
  if (Q.has('dbg')) window.__sc = { bats: BATS, h: () => !!handler, hk: () => handler && (handler.reel ? 'reel' : handler.screen ? 'screen' : 'x'), T, map: MAP, bed: () => bed && bed.pos(), song: () => song && { start: song.start, now: NOW }, beat: BEAT, scr: (x, y) => ({ x: (x - VW.x) * S * VW.z + cw / 2, y: (y - VW.y) * S * VW.z + ch / 2 }), st, phones, ropes, anchorOf, DOOR };

  // ================= Bắt đầu =================
  resize();
  if (!OPEN) { $('locked').hidden = false; return; }
  requestAnimationFrame(frame);
  $('start').hidden = false;
  try { if (localStorage.getItem('soichi:xong') || Q.has('giai')) $('btn-giai0').hidden = false; } catch (e) { /* bỏ qua */ }
  if (Q.has('giai')) openGiai('start');
  const fontsReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('500 10px "Be Vietnam Pro"'), document.fonts.load('400 20px "Fraunces"')]).catch(() => {}) : Promise.resolve();
  $('btn-go').addEventListener('click', async () => {
    A.init(); A.resume(); A.load(BED).then((b) => { bedFile = !!b; }); A.load(SONG);
    try { if (document.documentElement.requestFullscreen && !/iPhone|iPad/.test(navigator.userAgent)) document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* bỏ qua */ }
    $('start').classList.add('go');
    await fontsReady;
    setTimeout(() => { $('start').hidden = true; }, 1300);
    run();
  }, { once: true });
})();
