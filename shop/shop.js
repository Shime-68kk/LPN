// Tiệm Sâu: dùng đốt cây mua skin, hiệu ứng ăn lá, cánh bướm; mở hộp quà (một hoặc nhiều hộp cùng lúc);
// quay vòng quay sự kiện; xem lại kỷ niệm.
'use strict';
(() => {
  const BOX_PRICE = 120;
  const DUP_REFUND = 50;
  const PITY_EPIC = 10;   // tối đa 10 hộp là có Sử thi trở lên
  const PITY_LEGEND = 40; // tối đa 40 hộp là có Huyền thoại
  const MAX_QTY = 20;     // mở nhiều nhất 20 hộp một lần
  const RARITY_ORDER = ['thuong', 'hiem', 'suthi', 'huyenthoai'];
  const BIG = (r) => r === 'suthi' || r === 'huyenthoai';
  const SLOT_NAME = { skin: 'Skin', fx: 'Hiệu ứng', wing: 'Cánh bướm' };
  const HINT = {
    skin: 'Chạm để thử lên bé sâu. Skin chỉ để đẹp, không đổi cách chơi hay điểm.',
    fx: 'Hiện ra mỗi lần bé sâu đớp lá. Chạm để xem thử.',
    wing: 'Đôi cánh khi bé sâu hoá bướm cuối bài. Chạm để xem thử.',
  };
  const TAU = Math.PI * 2;
  const ITEMS = Skins.ITEMS;
  const EV = Skins.activeEvent();
  // Món của sự kiện chưa bắt đầu thì chưa hiện ở đâu cả.
  const shown = () => ITEMS.filter((i) => Skins.itemState(i) !== 'hidden');
  const exclusive = (i) => Skins.itemState(i) === 'event';
  const inBox = (i) => !i.free && Skins.itemState(i) === 'normal';
  const keyOf = (it) => it.slot + ':' + it.id;
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('vi-VN');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const params = new URLSearchParams(location.search);
  if (params.get('from') === 'game') $('btn-back').href = '../game/';

  // ================= Trời ngày / đêm (giống trang chủ) =================
  const sky = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('lpn:sky'));
      if (s && s.sky && Date.now() - s.at < 6 * 3600e3) return s.sky;
    } catch (e) { /* bỏ qua */ }
    const h = new Date().getHours();
    return h >= 18 || h < 5 ? 'dem' : 'nang';
  })();
  const NIGHT = sky === 'dem';
  document.body.classList.toggle('night', NIGHT);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', NIGHT ? '#1D1832' : '#FFF8EF');

  // ================= Âm thanh nhỏ =================
  let actx = null;
  function tone(f, dur, vol, delay, type) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state !== 'running') actx.resume();
      const t = actx.currentTime + (delay || 0);
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* bỏ qua */ }
  }
  const SFX = {
    click() { tone(660, 0.06, 0.08); },
    buy() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 0.14, i * 0.07, 'triangle')); },
    shake(n) { for (let i = 0; i < Math.round(6 * (n || 1)); i++) tone(180 + (i % 6) * 25 + i * 8, 0.08, 0.06, i * 0.14, 'triangle'); },
    reveal(r) {
      const steps = { thuong: [523, 659, 784], hiem: [523, 659, 784, 988], suthi: [523, 659, 784, 988, 1175], huyenthoai: [523, 659, 784, 1047, 1319, 1568] }[r];
      steps.forEach((f, i) => tone(f, 0.4, 0.15, i * 0.08, 'triangle'));
      if (BIG(r)) steps.forEach((f, i) => tone(f * 2, 0.5, 0.05, 0.3 + i * 0.06));
    },
    no() { tone(200, 0.18, 0.12, 0, 'triangle'); },
    drop(n) { for (let i = 0; i < Math.min(n, 20); i++) tone(240 + i * 14, 0.06, 0.035, i * 0.045, 'triangle'); },
    // mỗi hộp mở cao dần lên một chút
    pop(i) { const f = 520 * Math.pow(2, Math.min(i, 20) / 24); tone(f, 0.12, 0.1, 0, 'triangle'); tone(f * 2, 0.09, 0.035, 0.02); },
    // hộp hiếm rung lên: tiếng ngân dồn dập dần
    charge(r) {
      const legend = r === 'huyenthoai';
      const n = legend ? 16 : 9, span = legend ? 1.35 : 0.65;
      for (let i = 0; i < n; i++) tone(330 * Math.pow(2, i / (legend ? 8 : 6)), 0.14, 0.035 + i * 0.004, (i / n) * span, 'triangle');
    },
    epic() { [659, 831, 988, 1319].forEach((f, i) => tone(f, 0.55, 0.13, i * 0.06, 'triangle')); tone(1976, 0.9, 0.04, 0.28); },
    legend() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 0.14, i * 0.09, 'triangle'));
      [1047, 1319, 1568, 2093].forEach((f) => tone(f, 1.4, 0.06, 0.4, 'triangle'));
      for (let i = 0; i < 8; i++) tone(2093 + i * 180, 0.18, 0.025, 0.55 + i * 0.07);
    },
    tick() { tone(1500, 0.03, 0.045, 0, 'triangle'); },
    land() { tone(784, 0.3, 0.12, 0, 'triangle'); tone(1175, 0.4, 0.08, 0.05); },
    coin() { tone(988, 0.08, 0.1, 0, 'triangle'); tone(1319, 0.25, 0.1, 0.07, 'triangle'); },
  };
  const buzz = (ms) => { if (navigator.vibrate) navigator.vibrate(ms); };

  let toastTimer = 0;
  function toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ================= Trạng thái =================
  const UI = { tab: 'box', trying: null, sheet: null, reveal: null, revealCtx: 'single', confirmBuy: 0, qty: 1 };
  try { UI.qty = Math.max(1, Math.min(MAX_QTY, parseInt(sessionStorage.getItem('lpn:boxQty'), 10) || 1)); } catch (e) { /* bỏ qua */ }
  const look = () => {
    const eq = Wallet.equipped();
    const pick = (slot) => (UI.trying && UI.trying.slot === slot ? UI.trying : Skins.get(slot, eq[slot]));
    return { skin: pick('skin'), fx: pick('fx'), wing: pick('wing') };
  };

  // Kích thước canvas theo khung CSS (không bị ảnh hưởng bởi hiệu ứng phóng to thu nhỏ).
  function sizeCanvas(c) {
    const W = c.clientWidth, H = c.clientHeight;
    const w = Math.max(1, Math.round(W * DPR)), h = Math.max(1, Math.round(H * DPR));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return [W, H];
  }
  const centerOf = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  // ================= Lớp hiệu ứng phủ cả màn hình =================
  const fxCanvas = $('fx');
  const fxCtx = fxCanvas.getContext('2d');
  const fxParts = [];
  let fxDirty = false;
  const RCOL = {
    thuong: ['#8FD6A0', '#FFFFFF', '#62BC7C'],
    hiem: ['#7FB5F5', '#FFFFFF', '#4C8DE0'],
    suthi: ['#C9A0FF', '#9B5DE5', '#FFFFFF', '#E7D4FF'],
    huyenthoai: ['#FFE27A', '#FFC24B', '#FFFFFF', '#FF8FA3', '#FFB347'],
  };
  // Bung hạt sáng từ (cx, cy) theo độ hiếm: Sử thi tím, Huyền thoại vàng và nhiều hơn hẳn.
  function fxBurst(cx, cy, rar, power) {
    const p = power || 1;
    const cols = RCOL[rar];
    const big = BIG(rar), legend = rar === 'huyenthoai';
    const n = Math.round({ thuong: 8, hiem: 12, suthi: 46, huyenthoai: 100 }[rar] * p);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = (big ? 140 + Math.random() * (legend ? 480 : 320) : 70 + Math.random() * 180) * Math.sqrt(p);
      const kind = legend ? [6, 8, 2, 1][i % 4] : rar === 'suthi' ? [6, 2, 2][i % 3] : 2;
      const life = (big ? 0.9 : 0.5) + Math.random() * (big ? 0.9 : 0.35);
      fxParts.push({
        kind, x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (big ? 80 : 30), life, max: life,
        size: kind === 6 ? 4 + Math.random() * 4 : kind === 8 ? 3 + Math.random() * 2.5 : kind === 1 ? 5 + Math.random() * 3 : 2 + Math.random() * 2.5,
        color: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, s: 1,
      });
    }
    const rings = { thuong: 0, hiem: 1, suthi: 2, huyenthoai: 3 }[rar];
    for (let i = 0; i < rings; i++) {
      const life = 0.5 + i * 0.18;
      fxParts.push({ kind: 3, x: cx, y: cy, vx: 0, vy: 0, life, max: life, size: 12 + i * 8, color: cols[i % 2], rot: 0, vr: 0, s: big ? 2.6 + i : 1.4 });
    }
  }
  // Vụn lá xanh bay ra khi trúng đốt cây.
  function fxLeaves(cx, cy, n) {
    for (const p of Skins.eatBurst(Skins.get('fx', 'la'), n, 1.6, ['#62BC7C', '#8FD6A0', '#3D8A57'])) {
      p.x = cx; p.y = cy; p.max = p.life = p.life * 1.8; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 10; p.s = 0.6;
      p.vx *= 1.6; p.vy *= 1.8;
      fxParts.push(p);
    }
  }
  // Pháo giấy và sao quanh thẻ món vừa mở.
  function fxConfetti(cx, cy, rar) {
    const n = { thuong: 24, hiem: 34, suthi: 50, huyenthoai: 80 }[rar];
    const conf = Skins.get('fx', 'phao-giay'), star = Skins.get('fx', 'sao-vang');
    for (let i = 0; i < n; i++) {
      for (const p of Skins.eatBurst(i % 3 ? conf : star, 1, 1.6, [])) {
        const a = Math.random() * TAU, sp = 180 + Math.random() * 380;
        p.x = cx; p.y = cy;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 120;
        p.life = 1.2 + Math.random() * 0.8; p.max = p.life; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 12; p.s = 0.5;
        fxParts.push(p);
      }
    }
  }
  function drawFx(dt) {
    if (!fxParts.length && !fxDirty) return;
    const W = fxCanvas.clientWidth, H = fxCanvas.clientHeight;
    sizeCanvas(fxCanvas);
    fxCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    fxCtx.clearRect(0, 0, W, H);
    for (let i = fxParts.length - 1; i >= 0; i--) {
      const p = fxParts[i];
      p.life -= dt;
      if (p.life <= 0) { fxParts.splice(i, 1); continue; }
      Skins.stepParticle(p, dt, p.s);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (const p of fxParts) Skins.drawParticle(fxCtx, p, p.s);
    fxCtx.globalAlpha = 1;
    fxDirty = fxParts.length > 0;
  }
  // Loé sáng cả màn hình: tím cho Sử thi, vàng (lâu và mạnh hơn) cho Huyền thoại.
  function flash(rar) {
    const el = $('flash');
    el.className = 'flash';
    void el.offsetWidth;
    el.style.setProperty('--flash', rar === 'huyenthoai' ? '#FFD86B' : rar === 'suthi' ? '#B57CFF' : '#FFFFFF');
    el.classList.add(rar === 'huyenthoai' ? 'fl-big' : 'fl-on');
  }

  // ================= Sân khấu (canvas) =================
  const stage = $('stage');
  const sg = stage.getContext('2d');
  let SW = 0, SH = 0;
  const parts = [];
  function burst(fxItem, x, y, n, S, list) {
    for (const p of Skins.eatBurst(fxItem, n, S, ['#62BC7C', '#8FD6A0'])) {
      p.x = x; p.y = y; p.max = p.life; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 10;
      list.push(p);
    }
  }
  function stepParts(list, dt, S) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) { list.splice(i, 1); continue; }
      Skins.stepParticle(p, dt, S);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  // Một chiếc lá rơi xuống, bé sâu đớp, hiệu ứng nổ ra (lặp lại).
  const eat = { phase: 0, chew: 0, happy: 0, blink: 0, nextBlink: 2 };
  function leaf(ctx, x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = '#62BC7C';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.7, -s * 0.5, s * 0.7, s * 0.45, 0, s);
    ctx.bezierCurveTo(-s * 0.7, s * 0.45, -s * 0.7, -s * 0.5, 0, -s);
    ctx.fill();
    ctx.fillStyle = '#8FD6A0';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.7, -s * 0.5, s * 0.7, s * 0.45, 0, s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawStage(t, dt) {
    [SW, SH] = sizeCanvas(stage);
    const x = sg;
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    x.clearRect(0, 0, SW, SH);
    const S = Math.min(SH / 260, SW / 300) * 1.15;
    const L = look();
    const showWing = UI.tab === 'wing' || (UI.trying && UI.trying.slot === 'wing');

    // mây nhẹ
    x.fillStyle = NIGHT ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 3; i++) {
      const cx = ((t * 8 + i * 140) % (SW + 120)) - 60, cy = 30 + i * 26;
      x.beginPath(); x.arc(cx, cy, 12, 0, TAU); x.arc(cx + 16, cy - 6, 15, 0, TAU); x.arc(cx + 32, cy, 12, 0, TAU); x.fill();
    }
    if (NIGHT) {
      x.fillStyle = '#FFF4D6';
      for (let i = 0; i < 14; i++) {
        x.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i));
        x.fillRect((i * 73) % SW, (i * 37) % (SH * 0.6), 2, 2);
      }
      x.globalAlpha = 1;
    }

    if (showWing) {
      x.save();
      x.translate(SW / 2 + Math.sin(t * 1.1) * 18 * S, SH * 0.5 + Math.sin(t * 2.2) * 8 * S);
      x.scale(1.5, 1.5);
      Skins.drawButterfly(x, L.wing, S, t);
      x.restore();
      if (Math.random() < dt * 6) parts.push({ kind: 2, x: SW / 2 + (Math.random() - 0.5) * 120 * S, y: SH * 0.5 + (Math.random() - 0.5) * 60 * S, vx: 0, vy: -20 * S, life: 0.8, max: 0.8, size: 2.5 * S, color: L.wing.wing.spot, rot: 0, vr: 0 });
    } else {
      // chu kỳ đớp lá 1,7 giây
      eat.phase += dt;
      const P = 1.7;
      if (eat.phase > P) { eat.phase -= P; }
      const hx = SW / 2 + Math.sin(t * 1.4) * 14 * S;
      const hy = SH * 0.46;
      const r = 21 * S;
      const fall = Math.min(1, eat.phase / 1.05);
      if (eat.phase < 1.05) leaf(x, hx + Math.sin(t * 3) * 6 * S * (1 - fall), -20 + (hy - r * 0.9 + 20) * (fall * fall), 12 * S, Math.sin(t * 4) * 0.5);
      if (eat.phase >= 1.05 && eat.phase - dt < 1.05) {
        eat.chew = 0.3; eat.happy = 0.45;
        burst(L.fx, hx, hy - r * 0.6, 8, S, parts);
      }
      eat.chew = Math.max(0, eat.chew - dt);
      eat.happy = Math.max(0, eat.happy - dt);
      eat.nextBlink -= dt;
      if (eat.nextBlink <= 0) { eat.blink = 0.12; eat.nextBlink = 2 + Math.random() * 3; }
      eat.blink = Math.max(0, eat.blink - dt);

      // thân bò uốn lượn phía dưới đầu
      const seg = 16.5 * S, gap = 23 * S, n = 7;
      for (let k = n; k >= 1; k--) {
        const fromTail = n - k;
        const sc = fromTail >= 3 ? 1 : 0.64 + fromTail * 0.12;
        const sx = hx + Math.sin(t * 3 - k * 0.75) * 9 * S * Math.min(1, k / 2);
        const sy = hy + k * gap;
        x.save();
        x.translate(sx, sy);
        x.scale(sc, sc);
        Skins.drawSegment(x, seg, L.skin, k % 5 === 0 ? 2 : k % 2, S);
        x.restore();
      }
      x.save();
      x.translate(hx, hy);
      x.rotate(Math.cos(t * 1.4) * 0.08);
      Skins.drawHead(x, r, L.skin, { t, ant: Math.sin(t * 2) * 3 * S, bob: Math.abs(Math.sin(t * 3)) * 0.6, happy: eat.happy, blink: eat.blink, sad: 0, chew: eat.chew, mouthOpen: eat.phase > 0.8 && eat.phase < 1.05 ? 0.7 : 0 }, S);
      x.restore();
    }
    stepParts(parts, dt, S);
    for (const p of parts) Skins.drawParticle(x, p, S);
  }

  // ================= Thẻ món đồ =================
  function drawThumb(c, item, t) {
    const [w, h] = sizeCanvas(c);
    const x = c.getContext('2d');
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    x.clearRect(0, 0, w, h);
    Skins.drawPreview(x, item, w, h, t || 0.3);
  }
  function rarityTag(el, item) {
    const r = Skins.RARITY[item.rarity];
    el.textContent = r.name;
    el.style.setProperty('--r', r.color);
  }
  // Đang dùng lên đầu, rồi đến đồ đã có, cuối cùng là đồ chưa có (rẻ trước, hiếm sau).
  const rank = (item, w) => (w.equip[item.slot] === item.id ? 0 : Wallet.owns(item.slot, item.id, w) ? 1 : 2);
  const sortItems = (list, w) => list.slice().sort((a, b) =>
    rank(a, w) - rank(b, w) || (b.free ? 1 : 0) - (a.free ? 1 : 0)
    || RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.price - b.price);

  function stateOf(item, w) {
    const owned = Wallet.owns(item.slot, item.id, w);
    const on = w.equip[item.slot] === item.id;
    return { owned, on };
  }

  function renderGrid(slot) {
    const w = Wallet.get();
    const grid = $('grid');
    grid.replaceChildren();
    $('items-hint').textContent = HINT[slot];
    const list = sortItems(shown().filter((i) => i.slot === slot), w);
    let group = -1;
    for (const item of list) {
      const st = stateOf(item, w);
      // Tiêu đề nhóm: "Đã có" (gồm món đang dùng) và "Chưa có".
      const g = st.owned ? 0 : 1;
      if (g !== group) {
        group = g;
        const h = document.createElement('p');
        h.className = 'grid-head';
        const n = list.filter((i) => Wallet.owns(i.slot, i.id, w) === !g).length;
        h.textContent = (g ? 'Chưa có' : 'Đã có') + ' · ' + n;
        grid.appendChild(h);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'item' + (st.owned ? ' owned' : '') + (st.on ? ' equipped' : '');
      const c = document.createElement('canvas');
      const name = document.createElement('span');
      name.className = 'i-name';
      name.textContent = item.name;
      const foot = document.createElement('span');
      foot.className = 'i-foot';
      const rar = document.createElement('span');
      rar.className = 'rarity';
      rarityTag(rar, item);
      const state = document.createElement('span');
      const evOnly = !st.owned && exclusive(item);
      state.className = 'i-state' + (st.on ? ' on' : st.owned ? '' : evOnly ? ' ev' : ' price');
      state.textContent = st.on ? 'Đang dùng' : st.owned ? 'Đã có' : evOnly ? 'Vòng quay' : fmt(item.price) + ' đốt';
      foot.append(rar, state);
      b.append(c, name, foot);
      if (item.ev && exclusive(item)) {
        const badge = document.createElement('span');
        badge.className = 'i-ev';
        badge.textContent = Skins.eventById(item.ev).short;
        b.appendChild(badge);
      }
      b.setAttribute('aria-label', item.name + ', ' + Skins.RARITY[item.rarity].name + ', ' + state.textContent);
      b.addEventListener('click', () => { SFX.click(); openSheet(item); });
      grid.appendChild(b);
      requestAnimationFrame(() => drawThumb(c, item));
    }
  }

  // ================= Chi tiết món =================
  function openSheet(item) {
    UI.sheet = item;
    UI.trying = item;
    UI.confirmBuy = 0;
    $('sheet-name').textContent = item.name;
    rarityTag($('sheet-rarity'), item);
    $('sheet-memory').textContent = item.memory || '';
    const ev = item.ev && exclusive(item) ? Skins.eventById(item.ev) : null;
    $('sheet-ch').textContent = (ev ? 'Sự kiện ' + ev.name + ' · ' : '') + (item.ch ? 'Kỷ niệm ở chương ' + item.ch + ' · ' : '') + SLOT_NAME[item.slot];
    updateSheetAction();
    $('sheet').hidden = false;
    $('sheet-backdrop').hidden = false;
    updateStageTag();
  }
  function closeSheet() {
    UI.sheet = null;
    UI.trying = null;
    $('sheet').hidden = true;
    $('sheet-backdrop').hidden = true;
    updateStageTag();
  }
  function updateSheetAction() {
    const item = UI.sheet;
    if (!item) return;
    const w = Wallet.get();
    const st = stateOf(item, w);
    const btn = $('sheet-action');
    btn.disabled = false;
    if (st.on) { btn.textContent = 'Đang dùng'; btn.disabled = true; }
    else if (st.owned) btn.textContent = 'Dùng ' + item.name;
    else if (exclusive(item)) btn.textContent = 'Chỉ có ở Vòng quay ' + Skins.eventById(item.ev).short + ' · Đến quay';
    else if (w.dot >= item.price) btn.textContent = UI.confirmBuy > Date.now() ? 'Bấm lần nữa để mua · ' + fmt(item.price) + ' đốt' : 'Mua · ' + fmt(item.price) + ' đốt';
    else btn.textContent = 'Còn thiếu ' + fmt(item.price - w.dot) + ' đốt · Chơi Sâu Tím';
  }
  function sheetAction() {
    const item = UI.sheet;
    if (!item) return;
    const w = Wallet.get();
    const st = stateOf(item, w);
    if (st.on) return;
    if (st.owned) {
      Wallet.equip(item.slot, item.id);
      SFX.click();
      toast('Đã dùng ' + item.name);
      closeSheet();
      renderAll();
      return;
    }
    if (exclusive(item)) { closeSheet(); switchTab('ev'); scrollToPanel(); return; }
    if (w.dot < item.price) { SFX.no(); location.href = '../game/'; return; }
    // Bấm hai lần mới mua, tránh lỡ tay.
    if (UI.confirmBuy < Date.now()) {
      UI.confirmBuy = Date.now() + 3000;
      updateSheetAction();
      setTimeout(updateSheetAction, 3050);
      return;
    }
    const ok = Wallet.update((v) => {
      if (v.dot < item.price) return false;
      v.dot -= item.price;
      v.owned[keyOf(item)] = Date.now();
      v.equip[item.slot] = item.id;
    });
    if (!ok) { SFX.no(); return; }
    SFX.buy();
    buzz(20);
    celebrate(item);
    toast('Đã mua và dùng ' + item.name + ' 🎉');
    closeSheet();
    renderAll();
    bumpDot();
  }
  function celebrate(item) {
    const S = Math.min(SH / 260, SW / 300) * 1.15;
    burst(Skins.get('fx', 'phao-giay'), SW / 2, SH * 0.4, 18, S, parts);
    if (item.slot === 'fx') burst(item, SW / 2, SH * 0.4, 10, S, parts);
  }
  function bumpDot() {
    const el = document.querySelector('.dot-pill');
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  // ================= Hộp quà may mắn =================
  function rollRarity() {
    const total = RARITY_ORDER.reduce((s, r) => s + Skins.RARITY[r].weight, 0);
    let v = Math.random() * total;
    for (const r of RARITY_ORDER) { v -= Skins.RARITY[r].weight; if (v < 0) return r; }
    return 'thuong';
  }
  function pickFromBox(w) {
    let rar = rollRarity();
    if (w.pityLegend + 1 >= PITY_LEGEND) rar = 'huyenthoai';
    else if (w.pityEpic + 1 >= PITY_EPIC && !BIG(rar)) rar = 'suthi';
    let inR = ITEMS.filter((i) => inBox(i) && i.rarity === rar);
    if (!inR.length) inR = ITEMS.filter(inBox);
    const fresh = inR.filter((i) => !Wallet.owns(i.slot, i.id, w));
    const pool = fresh.length ? fresh : inR;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { item, dup: !fresh.length, rar: item.rarity };
  }
  // Mua n hộp một lần: trừ đốt, chốt hết kết quả (bảo đảm tính lần lượt từng hộp) rồi mới chạy hiệu ứng,
  // lỡ tắt app giữa chừng cũng không mất món.
  function buyBoxes(n) {
    const results = [];
    const ok = Wallet.update((v) => {
      if (v.dot < n * BOX_PRICE) return false;
      v.dot -= n * BOX_PRICE;
      for (let i = 0; i < n; i++) {
        const r = pickFromBox(v);
        v.boxes += 1;
        v.pityEpic = BIG(r.rar) ? 0 : v.pityEpic + 1;
        v.pityLegend = r.rar === 'huyenthoai' ? 0 : v.pityLegend + 1;
        if (r.dup) { v.dot += DUP_REFUND; r.refund = DUP_REFUND; } else v.owned[keyOf(r.item)] = Date.now();
        results.push(r);
      }
    });
    return ok ? results : null;
  }
  function setQty(n) {
    UI.qty = Math.max(1, Math.min(MAX_QTY, n));
    try { sessionStorage.setItem('lpn:boxQty', String(UI.qty)); } catch (e) { /* bỏ qua */ }
    renderBox();
  }
  function renderBox() {
    const w = Wallet.get();
    const n = UI.qty, cost = n * BOX_PRICE;
    $('qty').textContent = n;
    $('qty-minus').disabled = n <= 1;
    $('qty-plus').disabled = n >= MAX_QTY;
    document.querySelectorAll('#qty-chips button').forEach((b) => {
      const q = +b.dataset.q;
      b.setAttribute('aria-pressed', String(q === n));
      b.classList.toggle('short', q * BOX_PRICE > w.dot);
    });
    const btn = $('btn-open');
    btn.textContent = (n === 1 ? 'Mở hộp' : 'Mở ' + n + ' hộp') + ' · ' + fmt(cost) + ' đốt';
    const need = $('box-need');
    if (w.dot < cost) {
      need.hidden = false;
      need.replaceChildren('Còn thiếu ' + fmt(cost - w.dot) + ' đốt. ');
      const can = Math.min(MAX_QTY, Math.floor(w.dot / BOX_PRICE));
      if (can >= 1) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'link-btn';
        b.textContent = 'Mở ' + can + ' hộp thôi';
        b.addEventListener('click', () => { SFX.click(); setQty(can); });
        need.appendChild(b);
      } else {
        const a = document.createElement('a');
        a.href = '../game/';
        a.textContent = 'Chơi Sâu Tím kiếm thêm';
        need.appendChild(a);
      }
    } else need.hidden = true;
    const leftE = PITY_EPIC - w.pityEpic, leftL = PITY_LEGEND - w.pityLegend;
    $('pity-epic').textContent = 'còn tối đa ' + leftE + ' hộp';
    $('pity-legend').textContent = 'còn tối đa ' + leftL + ' hộp';
    $('pity-epic-bar').style.width = (w.pityEpic / PITY_EPIC) * 100 + '%';
    $('pity-legend-bar').style.width = (w.pityLegend / PITY_LEGEND) * 100 + '%';
    $('refund').textContent = DUP_REFUND;
    const odds = $('odds');
    odds.replaceChildren();
    const total = RARITY_ORDER.reduce((s, r) => s + Skins.RARITY[r].weight, 0);
    for (const r of RARITY_ORDER) {
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'r-dot';
      dot.style.background = Skins.RARITY[r].color;
      const have = ITEMS.filter((i) => inBox(i) && i.rarity === r);
      const got = have.filter((i) => Wallet.owns(i.slot, i.id, w)).length;
      const b = document.createElement('b');
      b.textContent = Math.round((Skins.RARITY[r].weight / total) * 100) + '%';
      li.append(dot, Skins.RARITY[r].name + ' ' + got + '/' + have.length, b);
      odds.appendChild(li);
    }
  }
  let opening = false;
  function openBox() {
    if (opening || PK.on) return;
    const n = UI.qty;
    const before = Wallet.get().dot;
    if (before < n * BOX_PRICE) { SFX.no(); toast('Chưa đủ đốt, chơi Sâu Tím thêm nha'); return; }
    const results = buyBoxes(n);
    if (!results) { SFX.no(); return; }
    bumpDot();
    // Đốt hoàn lại khi trùng chỉ cộng vào số hiện trên màn hình sau khi mở xong.
    $('dot').textContent = fmt(before - n * BOX_PRICE);
    if (n > 1) {
      openPack(results, {
        theme: 'box',
        title: n + ' hộp quà',
        again: () => ({ label: 'Mở tiếp ' + n + ' hộp · ' + fmt(n * BOX_PRICE) + ' đốt', ok: Wallet.get().dot >= n * BOX_PRICE, run: openBox }),
      });
      return;
    }
    // Một hộp: lắc ngay trên trang. Hộp Sử thi / Huyền thoại đổi màu giữa chừng và lắc lâu hơn.
    opening = true;
    const res = results[0];
    const box = $('giftbox');
    const big = BIG(res.rar), legend = res.rar === 'huyenthoai';
    const shakes = legend ? 2 : big ? 1.5 : 1; // số vòng lắc, mỗi vòng 0,9 giây
    box.style.setProperty('--n', shakes);
    box.classList.add('opening');
    SFX.shake(shakes);
    buzz(30);
    if (big) {
      setTimeout(() => {
        box.classList.add('tell', 'tell-' + res.rar);
        SFX.charge(res.rar);
        buzz(legend ? [20, 60, 20, 60, 20] : 40);
      }, 420);
    }
    setTimeout(() => {
      box.classList.remove('opening', 'tell', 'tell-suthi', 'tell-huyenthoai');
      opening = false;
      if (big) { flash(res.rar); const [cx, cy] = centerOf(box); fxBurst(cx, cy, res.rar); }
      showReveal(res, 'single');
      renderAll();
    }, shakes * 900 + 350);
  }

  // ================= Mở nhiều hộp cùng lúc =================
  const BOX_SVG = '<svg class="pb-svg" viewBox="0 0 160 150" aria-hidden="true">'
    + '<ellipse class="gb-shadow" cx="80" cy="140" rx="52" ry="7" />'
    + '<g class="gb-body"><rect x="26" y="64" width="108" height="72" rx="12" class="gb-box" /><rect x="72" y="64" width="16" height="72" class="gb-ribbon" /><path d="M26 92h108" class="gb-shade" /></g>'
    + '<g class="gb-lid"><rect x="18" y="46" width="124" height="24" rx="10" class="gb-box gb-top" /><rect x="72" y="46" width="16" height="24" class="gb-ribbon" />'
    + '<path d="M80 46c-8-20-34-26-34-10c0 10 18 10 34 10M80 46c8-20 34-26 34-10c0 10-18 10-34 10" class="gb-bow" /></g></svg>';
  const PK = { on: false, res: [], cells: [], opened: [], done: [], auto: false, waiting: false, busy: 0, timer: 0, opts: null };
  const resRank = (r) => (r.item ? RARITY_ORDER.indexOf(r.rar) * 2 + (r.dup ? 0 : 1) : -1);

  function openPack(results, opts) {
    Object.assign(PK, { on: true, res: results, opts, opened: results.map(() => false), done: results.map(() => false), auto: false, waiting: false, busy: 0 });
    clearTimeout(PK.timer);
    const pack = $('pack');
    pack.className = 'pack theme-' + opts.theme;
    $('pack-title').textContent = opts.title;
    const grid = $('pack-grid');
    grid.replaceChildren();
    const n = results.length;
    const cols = n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : n <= 8 ? 4 : 5;
    grid.style.setProperty('--cols', cols);
    grid.style.maxWidth = Math.min(440, cols * (n <= 4 ? 132 : 96)) + 'px';
    PK.cells = results.map((res, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pbox r-' + res.rar;
      b.style.setProperty('--d', i * 45 + 'ms');
      b.style.setProperty('--r', Skins.RARITY[res.rar].color);
      b.innerHTML = '<span class="pb-rays"></span><span class="pb-glow"></span>' + BOX_SVG + '<canvas class="pb-art"></canvas><span class="pb-dot"></span><span class="pb-tag"></span>';
      b.setAttribute('aria-label', 'Hộp ' + (i + 1) + ', chưa mở');
      b.addEventListener('click', () => tapCell(i));
      grid.appendChild(b);
      return b;
    });
    $('pack-sum').hidden = true;
    $('pack-again').hidden = true;
    $('pack-all').hidden = false;
    $('pack-all').textContent = 'Mở hết';
    $('pack-hint').style.visibility = '';
    $('pack-banner').className = 'pack-banner';
    $('pack-banner').textContent = '';
    updatePackCount();
    pack.hidden = false;
    SFX.drop(n);
  }
  function updatePackCount() {
    const k = PK.done.filter(Boolean).length;
    $('pack-count').textContent = 'Đã mở ' + k + '/' + PK.res.length;
  }
  function tapCell(i) {
    const res = PK.res[i];
    if (PK.done[i]) { if (res.item) { SFX.click(); showReveal(res, 'pack', true); } return; }
    if (PK.auto || PK.opened[i]) return;
    $('pack-hint').style.visibility = 'hidden';
    openCell(i);
  }
  // Mở một hộp; trả về số mili giây nên chờ trước khi mở hộp kế tiếp.
  function openCell(i, quick) {
    if (PK.opened[i]) return 0;
    PK.opened[i] = true;
    const res = PK.res[i], cell = PK.cells[i];
    if (quick || !BIG(res.rar)) { revealCell(i, quick); return quick ? 0 : 190; }
    // Hộp hiếm: đổi màu, toả sáng, rung mạnh dần rồi mới bung.
    const legend = res.rar === 'huyenthoai';
    cell.classList.add('tell');
    SFX.charge(res.rar);
    buzz(legend ? [20, 60, 20, 60, 20] : 40);
    if (legend) { $('pack').classList.add('dim'); cell.classList.add('focus'); }
    PK.busy++;
    const wait = legend ? 1500 : 760;
    setTimeout(() => {
      PK.busy--;
      if (!PK.on) return;
      $('pack').classList.remove('dim');
      revealCell(i);
      if (legend) { quake(); setTimeout(() => { if (PK.on) spotlight(res); }, 800); }
      else bannerFor(res);
      checkPackDone();
    }, wait);
    return wait + (legend ? 900 : 700);
  }
  function revealCell(i, quick) {
    const res = PK.res[i], cell = PK.cells[i];
    PK.done[i] = true;
    cell.classList.remove('tell', 'focus');
    cell.classList.add('open');
    if (quick) cell.classList.add('instant');
    const tag = cell.querySelector('.pb-tag');
    if (res.item) {
      drawThumb(cell.querySelector('.pb-art'), res.item);
      tag.textContent = res.dup ? '+' + res.refund + ' đốt' : 'Mới';
      tag.classList.toggle('dup', !!res.dup);
      cell.setAttribute('aria-label', res.item.name + ', ' + Skins.RARITY[res.rar].name + (res.dup ? ', trùng, hoàn ' + res.refund + ' đốt' : ', món mới'));
    } else {
      const d = cell.querySelector('.pb-dot');
      d.replaceChildren();
      const b = document.createElement('b');
      b.textContent = '+' + res.dot;
      d.append(b, 'đốt');
      cell.classList.add('is-dot');
      cell.setAttribute('aria-label', 'Được ' + res.dot + ' đốt cây');
    }
    if (!quick) {
      const [cx, cy] = centerOf(cell);
      if (res.dot) fxLeaves(cx, cy, 10);
      fxBurst(cx, cy, res.rar, BIG(res.rar) ? 1 : 0.8);
      if (res.rar === 'huyenthoai') { SFX.legend(); flash('huyenthoai'); buzz([30, 40, 80]); }
      else if (res.rar === 'suthi') { SFX.epic(); flash('suthi'); buzz(40); }
      else SFX.pop(PK.done.filter(Boolean).length);
    }
    updatePackCount();
  }
  function quake() {
    const g = $('pack-grid');
    g.classList.remove('quake');
    void g.offsetWidth;
    g.classList.add('quake');
  }
  function bannerFor(res) {
    const el = $('pack-banner');
    el.className = 'pack-banner';
    void el.offsetWidth;
    el.style.setProperty('--r', Skins.RARITY[res.rar].color);
    el.textContent = Skins.RARITY[res.rar].name + ' · ' + res.item.name + (res.dup ? ' (đã có)' : '');
    el.classList.add('show');
  }
  // Huyền thoại: dừng lại, hiện thẻ lớn giữa màn hình.
  function spotlight(res) {
    PK.waiting = true;
    showReveal(res, 'pack', true);
  }
  function packStep() {
    clearTimeout(PK.timer);
    if (!PK.on || !PK.auto || PK.waiting) return;
    const i = PK.opened.indexOf(false);
    if (i < 0) { PK.auto = false; checkPackDone(); return; }
    PK.timer = setTimeout(packStep, openCell(i));
  }
  function packAll() {
    if (!PK.auto) {
      PK.auto = true;
      $('pack-all').textContent = 'Mở nhanh';
      $('pack-hint').style.visibility = 'hidden';
      packStep();
      return;
    }
    // Mở nhanh: bung hết hộp còn lại một lúc, chỉ loé một lần theo món hiếm nhất.
    clearTimeout(PK.timer);
    PK.auto = false;
    let best = null;
    PK.opened.forEach((o, i) => {
      if (o) return;
      openCell(i, true);
      if (!best || resRank(PK.res[i]) > resRank(best)) best = PK.res[i];
    });
    if (best) {
      const [cx, cy] = centerOf($('pack-grid'));
      fxBurst(cx, cy, best.rar, BIG(best.rar) ? 1 : 1.5);
      if (BIG(best.rar)) flash(best.rar);
      if (best.rar === 'huyenthoai') { SFX.legend(); setTimeout(() => { if (PK.on) spotlight(best); }, 600); }
      else if (best.rar === 'suthi') { SFX.epic(); bannerFor(best); }
      else SFX.pop(12);
    }
    checkPackDone();
  }
  function checkPackDone() {
    if (!PK.on || PK.busy || PK.done.some((d) => !d) || !$('pack-sum').hidden) return;
    PK.auto = false;
    $('pack-all').hidden = true;
    $('pack-hint').style.visibility = 'hidden';
    const fresh = PK.res.filter((r) => r.item && !r.dup).sort((a, b) => resRank(b) - resRank(a));
    const dups = PK.res.filter((r) => r.dup).length;
    const back = PK.res.reduce((s, r) => s + (r.refund || 0) + (r.dot || 0), 0);
    let text = fresh.length ? 'Có ' + fresh.length + ' món mới' : 'Không có món mới';
    if (dups) text += ' · ' + dups + ' món trùng';
    if (back) text += ' · nhận ' + fmt(back) + ' đốt';
    $('pack-sum-text').textContent = text;
    const box = $('pack-new');
    box.replaceChildren();
    // Nhiều món quá thì chỉ ghi tên vài món hiếm nhất.
    const SHOW = 6;
    for (const r of fresh.slice(0, SHOW)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.style.setProperty('--r', Skins.RARITY[r.rar].color);
      b.textContent = r.item.name;
      b.addEventListener('click', () => { SFX.click(); showReveal(r, 'pack', true); });
      box.appendChild(b);
    }
    if (fresh.length > SHOW) {
      const more = document.createElement('span');
      more.className = 'chip more';
      more.textContent = 'và ' + (fresh.length - SHOW) + ' món khác';
      box.appendChild(more);
    }
    const again = PK.opts.again && PK.opts.again();
    const btn = $('pack-again');
    btn.hidden = !again || !again.ok;
    if (again) btn.textContent = again.label;
    $('pack-sum').hidden = false;
    $('dot').textContent = fmt(Wallet.get().dot);
    if (back) bumpDot();
  }
  function closePack() {
    if (!PK.on) return;
    PK.on = false;
    PK.auto = false;
    clearTimeout(PK.timer);
    $('pack').hidden = true;
    $('pack').classList.remove('dim');
    renderAll();
  }

  // ================= Thẻ món vừa nhận =================
  function showReveal(res, ctx, quiet) {
    const item = res.item;
    UI.reveal = res;
    UI.revealCtx = ctx;
    const r = Skins.RARITY[item.rarity];
    const card = $('reveal-card');
    card.style.setProperty('--r', r.color);
    card.classList.toggle('epic', item.rarity === 'suthi');
    card.classList.toggle('legend', item.rarity === 'huyenthoai');
    rarityTag($('reveal-rarity'), item);
    $('reveal-name').textContent = item.name;
    $('reveal-memory').textContent = item.memory || '';
    $('reveal-dup').hidden = !res.dup;
    $('reveal-dup').textContent = 'Món này em có rồi · hoàn lại ' + (res.refund || DUP_REFUND) + ' đốt';
    const w = Wallet.get();
    $('reveal-use').hidden = !Wallet.owns(item.slot, item.id, w) || w.equip[item.slot] === item.id;
    const again = $('reveal-again');
    if (ctx === 'single') { again.textContent = 'Mở tiếp · ' + BOX_PRICE + ' đốt'; again.hidden = w.dot < BOX_PRICE; }
    else if (ctx === 'wheel' && EV) { again.textContent = 'Quay tiếp · ' + fmt(EV.price) + ' đốt'; again.hidden = w.dot < EV.price; }
    else again.hidden = true;
    $('reveal-close').textContent = ctx === 'pack' ? 'Tiếp tục' : 'Đóng';
    $('reveal').hidden = false;
    // lại hiện thẻ cho animation chạy lại
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
    if (!quiet || PK.waiting) {
      if (!quiet) SFX.reveal(item.rarity);
      buzz(item.rarity === 'huyenthoai' ? [30, 40, 60] : 25);
      requestAnimationFrame(() => { const [cx, cy] = centerOf($('reveal-art')); fxConfetti(cx, cy, item.rarity); });
    }
  }
  function closeReveal() {
    $('reveal').hidden = true;
    const ctx = UI.revealCtx;
    UI.reveal = null;
    if (ctx === 'pack' && PK.waiting) {
      PK.waiting = false;
      if (PK.auto) PK.timer = setTimeout(packStep, 250);
      checkPackDone();
    }
  }

  // ================= Sự kiện: vòng quay =================
  const SEEN_KEY = 'lpn:evSeen';
  const seenEv = () => {
    if (!EV) return true;
    try { return !!(JSON.parse(localStorage.getItem(SEEN_KEY)) || {})[EV.id]; } catch (e) { return true; }
  };
  function markSeen() {
    if (!EV) return;
    try {
      const o = JSON.parse(localStorage.getItem(SEEN_KEY)) || {};
      o[EV.id] = Date.now();
      localStorage.setItem(SEEN_KEY, JSON.stringify(o));
    } catch (e) { /* bỏ qua */ }
    $('ev-ping').hidden = true;
  }
  const evItems = () => (EV ? EV.wheel.filter((s) => s.item).map((s) => Skins.byKey(s.item)) : []);
  const evLegend = () => evItems().find((i) => i.rarity === 'huyenthoai') || null;
  const evState = (w) => (EV && w.ev[EV.id]) || { spins: 0, pity: 0 };
  const owns = (key, w) => { const it = Skins.byKey(key); return Wallet.owns(it.slot, it.id, w); };

  // Quay một lượt trên ví v (đang sửa): chọn ô, cộng món hoặc đốt, tính bảo đảm.
  function rollWheel(v) {
    const st = v.ev[EV.id] || (v.ev[EV.id] = { spins: 0, pity: 0 });
    const slices = EV.wheel;
    const legendIdx = slices.findIndex((s) => s.item && Skins.byKey(s.item).rarity === 'huyenthoai');
    let idx;
    if (legendIdx >= 0 && !owns(slices[legendIdx].item, v) && st.pity + 1 >= EV.pity) idx = legendIdx;
    else {
      let r = Math.random() * slices.reduce((s, x) => s + x.w, 0);
      idx = slices.findIndex((x) => (r -= x.w) < 0);
      if (idx < 0) idx = 0;
    }
    // Trúng món đã có mà còn món cùng độ hiếm chưa có thì kim dừng ở món chưa có.
    if (slices[idx].item && owns(slices[idx].item, v)) {
      const rar = Skins.byKey(slices[idx].item).rarity;
      const alt = [];
      slices.forEach((s, i) => { if (s.item && !owns(s.item, v) && Skins.byKey(s.item).rarity === rar) alt.push(i); });
      if (alt.length) idx = alt[Math.floor(Math.random() * alt.length)];
    }
    const sl = slices[idx];
    const res = { slice: idx };
    if (sl.dot) { res.dot = sl.dot; res.rar = 'thuong'; v.dot += sl.dot; }
    else {
      const it = Skins.byKey(sl.item);
      res.item = it;
      res.rar = it.rarity;
      if (owns(sl.item, v)) { res.dup = true; res.refund = EV.refund; v.dot += EV.refund; }
      else v.owned[sl.item] = Date.now();
    }
    st.spins += 1;
    st.pity = res.rar === 'huyenthoai' ? 0 : st.pity + 1;
    return res;
  }

  const WS = { angle: 0, from: 0, to: 0, t0: 0, dur: 0, spinning: false, last: -1, kick: 0, hl: -1, hlT: 0, face: null, faceKey: '', done: null };
  function wheelGeom() {
    const c = $('wheel');
    const side = c.clientWidth;
    return { side, R: side / 2 - 20, cx: side / 2, cy: side / 2 + 6 };
  }
  const SLICE_FILL = { thuong: '#E6F4EA', hiem: '#E2EDFB', suthi: '#EEE3FF' };
  // Vẽ sẵn mặt vòng quay (chỉ vẽ lại khi đổi cỡ hoặc có thêm món), mỗi khung chỉ việc xoay.
  function buildFace(R) {
    const pad = 12;
    const D = Math.ceil((R + pad) * 2 * DPR);
    const c = document.createElement('canvas');
    c.width = c.height = D;
    const x = c.getContext('2d');
    x.setTransform(DPR, 0, 0, DPR, D / 2, D / 2);
    const w = Wallet.get();
    const N = EV.wheel.length, seg = TAU / N;
    // viền chàm với răng cưa đỏ vàng như thổ cẩm
    x.fillStyle = '#2F3B85';
    x.beginPath(); x.arc(0, 0, R + 11, 0, TAU); x.fill();
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU, b = a + TAU / 40;
      x.fillStyle = i % 2 ? '#FFC93C' : '#D62F45';
      x.beginPath();
      x.moveTo(Math.cos(a) * (R + 1), Math.sin(a) * (R + 1));
      x.lineTo(Math.cos((a + b) / 2) * (R + 7), Math.sin((a + b) / 2) * (R + 7));
      x.lineTo(Math.cos(b) * (R + 1), Math.sin(b) * (R + 1));
      x.closePath();
      x.fill();
    }
    for (let i = 0; i < N; i++) {
      const s = EV.wheel[i];
      const a0 = -Math.PI / 2 + i * seg, a1 = a0 + seg;
      const it = s.item ? Skins.byKey(s.item) : null;
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R, a0, a1); x.closePath();
      if (it && it.rarity === 'huyenthoai') {
        const g = x.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
        g.addColorStop(0, '#FFF6D2'); g.addColorStop(1, '#FFCF5A');
        x.fillStyle = g;
      } else x.fillStyle = it ? SLICE_FILL[it.rarity] : '#FFF6E6';
      x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.95)';
      x.lineWidth = 2;
      x.stroke();
      x.save();
      x.rotate(a0 + seg / 2 + Math.PI / 2);
      if (it) {
        const box = R * 0.4;
        x.save();
        x.translate(-box / 2, -R * 0.64 - box / 2);
        Skins.drawPreview(x, it, box, box, 0.3);
        x.restore();
        x.fillStyle = Skins.RARITY[it.rarity].color;
        x.beginPath(); x.arc(0, -R * 0.36, 3.4, 0, TAU); x.fill();
        if (owns(s.item, w)) {
          x.fillStyle = '#3D8A57';
          x.beginPath(); x.arc(box * 0.42, -R * 0.64 - box * 0.4, 7, 0, TAU); x.fill();
          x.strokeStyle = '#FFFFFF';
          x.lineWidth = 1.8;
          x.lineCap = 'round';
          x.beginPath();
          x.moveTo(box * 0.42 - 3.2, -R * 0.64 - box * 0.4);
          x.lineTo(box * 0.42 - 0.8, -R * 0.64 - box * 0.4 + 2.4);
          x.lineTo(box * 0.42 + 3.4, -R * 0.64 - box * 0.4 - 2.6);
          x.stroke();
        }
      } else {
        x.fillStyle = '#2F7A49';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.font = '800 ' + Math.round(R * 0.15) + 'px "Be Vietnam Pro", system-ui, sans-serif';
        x.fillText('+' + s.dot, 0, -R * 0.68);
        x.font = '600 ' + Math.round(R * 0.085) + 'px "Be Vietnam Pro", system-ui, sans-serif';
        x.fillText('đốt cây', 0, -R * 0.53);
      }
      x.restore();
    }
    return c;
  }
  function drawWheel(now, dt) {
    const c = $('wheel');
    const [side] = sizeCanvas(c);
    if (side < 10) return;
    const { R, cx, cy } = wheelGeom();
    const w = Wallet.get();
    const key = side + '|' + EV.wheel.map((s) => (s.item ? (owns(s.item, w) ? 1 : 0) : '-')).join('');
    if (WS.faceKey !== key) {
      WS.face = buildFace(R);
      WS.faceKey = key;
      $('wheel-hub').style.top = cy + 'px';
    }
    const x = c.getContext('2d');
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    x.clearRect(0, 0, side, side + 12);
    const N = EV.wheel.length, seg = TAU / N;

    if (WS.spinning) {
      const u = Math.min(1, (now - WS.t0) / WS.dur);
      const e = 1 - Math.pow(1 - u, 4);
      WS.angle = WS.from + (WS.to - WS.from) * e;
      const under = Math.floor((((-WS.angle) % TAU + TAU) % TAU) / seg);
      if (under !== WS.last) { WS.last = under; WS.kick = 1; SFX.tick(); }
      if (u >= 1) {
        WS.spinning = false;
        WS.hl = under;
        WS.hlT = now;
        SFX.land();
        const done = WS.done;
        WS.done = null;
        if (done) done();
        renderEvent();
      }
    }
    WS.kick = Math.max(0, WS.kick - dt * 7);

    // bóng đổ
    x.fillStyle = 'rgba(30, 20, 60, 0.18)';
    x.beginPath(); x.ellipse(cx, cy + R + 14, R * 0.8, 7, 0, 0, TAU); x.fill();
    x.save();
    x.translate(cx, cy);
    x.rotate(WS.angle);
    const F = R + 12;
    x.drawImage(WS.face, -F, -F, F * 2, F * 2);
    // ô vừa trúng nhấp nháy sáng
    if (WS.hl >= 0 && !WS.spinning) {
      const k = Math.max(0, 1 - (now - WS.hlT) / 2600);
      const pulse = 0.5 + 0.5 * Math.sin((now - WS.hlT) / 110);
      const a0 = -Math.PI / 2 + WS.hl * seg;
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R, a0, a0 + seg); x.closePath();
      x.fillStyle = 'rgba(255,255,255,' + (0.1 + 0.3 * pulse * k) + ')';
      x.fill();
      x.strokeStyle = '#FFC93C';
      x.lineWidth = 3 + 2 * pulse * k;
      x.stroke();
    }
    x.restore();
    // bóng đèn quanh viền: đứng yên thì nháy chậm, đang quay thì chạy vòng
    const B = 18;
    for (let i = 0; i < B; i++) {
      const a = (i / B) * TAU - Math.PI / 2;
      let on;
      if (WS.spinning) on = (i + Math.floor(now / 70)) % 3 === 0;
      else if (WS.hl >= 0 && now - WS.hlT < 1600) on = Math.floor(now / 140) % 2 === 0;
      else on = (i + Math.floor(now / 600)) % 2 === 0;
      const bx = cx + Math.cos(a) * (R + 6), by = cy + Math.sin(a) * (R + 6);
      if (on) {
        x.fillStyle = 'rgba(255, 236, 160, 0.45)';
        x.beginPath(); x.arc(bx, by, 6, 0, TAU); x.fill();
      }
      x.fillStyle = on ? '#FFF4C2' : '#8C7FD6';
      x.beginPath(); x.arc(bx, by, 3, 0, TAU); x.fill();
    }
    // kim chỉ ở đỉnh, giật nhẹ mỗi lần lướt qua một ô
    x.save();
    x.translate(cx, cy - R - 8);
    x.rotate(-WS.kick * 0.45);
    x.fillStyle = '#D62F45';
    x.strokeStyle = '#FFC93C';
    x.lineWidth = 2.5;
    x.lineJoin = 'round';
    x.beginPath(); x.moveTo(-11, -4); x.lineTo(11, -4); x.lineTo(0, 20); x.closePath();
    x.fill(); x.stroke();
    x.fillStyle = '#FFC93C';
    x.beginPath(); x.arc(0, -4, 6.5, 0, TAU); x.fill();
    x.restore();
  }
  function spinTo(idx, dur, done) {
    const seg = TAU / EV.wheel.length;
    const jitter = (Math.random() - 0.5) * seg * 0.7;
    const target = (((-(idx + 0.5) * seg + jitter) % TAU) + TAU) % TAU;
    const cur = ((WS.angle % TAU) + TAU) % TAU;
    let delta = target - cur;
    if (delta < 0) delta += TAU;
    Object.assign(WS, { from: WS.angle, to: WS.angle + (dur > 4000 ? 6 : 4) * TAU + delta, t0: performance.now(), dur, spinning: true, hl: -1, done });
  }
  function spin(n) {
    if (!EV || WS.spinning || PK.on || opening) return;
    const before = Wallet.get().dot;
    const cost = n * EV.price;
    if (before < cost) { SFX.no(); toast('Chưa đủ đốt, chơi Sâu Tím thêm nha'); return; }
    const results = [];
    const ok = Wallet.update((v) => {
      if (v.dot < cost) return false;
      v.dot -= cost;
      for (let i = 0; i < n; i++) results.push(rollWheel(v));
    });
    if (!ok) { SFX.no(); return; }
    bumpDot();
    $('dot').textContent = fmt(before - cost);
    const best = results.reduce((a, b) => (resRank(b) > resRank(a) ? b : a));
    $('wheel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    spinTo(best.slice, n === 1 ? 5200 : 3600, () => {
      if (n === 1) landSingle(results[0]);
      else {
        setTimeout(() => openPack(results, {
          theme: 'ev',
          title: n + ' lượt quay · ' + EV.short,
          again: () => ({ label: 'Quay tiếp 10 lần · ' + fmt(10 * EV.price) + ' đốt', ok: Wallet.get().dot >= 10 * EV.price, run: () => spin(10) }),
        }), 450);
      }
    });
    renderEvent();
  }
  function landSingle(res) {
    const c = $('wheel').getBoundingClientRect();
    const { R, cx, cy } = wheelGeom();
    const px = c.left + cx, py = c.top + cy - R * 0.62;
    if (res.dot) {
      SFX.coin();
      fxLeaves(px, py, 14);
      fxBurst(px, py, 'thuong', 1.4);
      toast('+' + res.dot + ' đốt cây 🌿');
      renderAll();
      bumpDot();
      return;
    }
    if (BIG(res.rar)) { flash(res.rar); fxBurst(px, py, res.rar); }
    if (res.rar === 'huyenthoai') SFX.legend();
    else if (res.rar === 'suthi') SFX.epic();
    setTimeout(() => { showReveal(res, 'wheel', BIG(res.rar)); renderAll(); }, BIG(res.rar) ? 450 : 200);
  }

  function evTimeText() {
    const left = EV.end - Date.now();
    const endDay = new Date(EV.end - 1).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    if (left <= 0) return 'Đã kết thúc';
    const d = Math.floor(left / 864e5), h = Math.floor((left % 864e5) / 36e5), m = Math.floor((left % 36e5) / 6e4);
    return 'Còn ' + (d >= 1 ? d + ' ngày' : h >= 1 ? h + ' giờ ' + m + ' phút' : m + ' phút') + ' · đến hết ' + endDay;
  }
  function renderEvent() {
    if (!EV) return;
    const w = Wallet.get();
    const st = evState(w);
    $('ev-name').textContent = EV.name;
    $('ev-tag').textContent = EV.tagline;
    $('ev-time').textContent = evTimeText();
    const label = (el, n) => {
      const b = document.createElement('b');
      b.textContent = 'Quay ' + n + ' lần';
      const s = document.createElement('small');
      s.textContent = fmt(EV.price * n) + ' đốt';
      el.replaceChildren(b, s);
    };
    label($('spin-1'), 1);
    label($('spin-10'), 10);
    $('spin-1').disabled = $('spin-10').disabled = $('wheel-hub').disabled = WS.spinning;
    const need = $('ev-need');
    if (w.dot < EV.price) {
      need.hidden = false;
      need.replaceChildren('Còn thiếu ' + fmt(EV.price - w.dot) + ' đốt để quay. ');
      const a = document.createElement('a');
      a.href = '../game/';
      a.textContent = 'Chơi Sâu Tím kiếm thêm';
      need.appendChild(a);
    } else need.hidden = true;
    const L = evLegend();
    if (L) {
      const have = Wallet.owns(L.slot, L.id, w);
      $('ev-pity-name').textContent = (have ? '' : 'Bảo đảm ') + L.name;
      $('ev-pity').textContent = have ? 'Đã có ✓' : 'còn tối đa ' + (EV.pity - st.pity) + ' lượt';
      $('ev-pity-bar').style.width = (have ? 100 : (st.pity / EV.pity) * 100) + '%';
    }
    // Bộ đồ
    const sets = $('ev-sets');
    sets.replaceChildren();
    for (const set of EV.sets) {
      const items = set.items.map(Skins.byKey);
      const got = items.filter((i) => Wallet.owns(i.slot, i.id, w)).length;
      const wearing = items.every((i) => w.equip[i.slot] === i.id);
      const card = document.createElement('div');
      card.className = 'set' + (got === items.length ? ' full' : '');
      const head = document.createElement('div');
      head.className = 'set-head';
      const name = document.createElement('b');
      name.textContent = set.name;
      const count = document.createElement('span');
      count.textContent = got + '/' + items.length;
      head.append(name, count);
      const row = document.createElement('div');
      row.className = 'set-items';
      for (const it of items) {
        const have = Wallet.owns(it.slot, it.id, w);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'set-item' + (have ? ' have' : '');
        const cv = document.createElement('canvas');
        const label = document.createElement('span');
        label.textContent = SLOT_NAME[it.slot];
        b.append(cv, label);
        b.setAttribute('aria-label', it.name + (have ? ', đã có' : ', chưa có'));
        b.addEventListener('click', () => { SFX.click(); openSheet(it); });
        row.appendChild(b);
        requestAnimationFrame(() => drawThumb(cv, it));
      }
      card.append(head, row);
      const act = document.createElement('button');
      act.type = 'button';
      act.className = 'btn set-wear';
      if (got === items.length) {
        act.textContent = wearing ? 'Đang mặc cả bộ' : 'Mặc cả bộ';
        act.disabled = wearing;
        act.addEventListener('click', () => {
          Wallet.update((v) => { for (const it of items) v.equip[it.slot] = it.id; });
          SFX.buy();
          toast('Đã mặc ' + set.name + ' ✨');
          celebrate(items[0]);
          renderAll();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      } else {
        act.textContent = 'Đủ bộ thì mặc cả bộ một chạm';
        act.disabled = true;
      }
      card.appendChild(act);
      sets.appendChild(card);
    }
    // Tỉ lệ
    const odds = $('ev-odds');
    odds.replaceChildren();
    const total = EV.wheel.reduce((s, x) => s + x.w, 0);
    for (const s of EV.wheel) {
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'r-dot';
      const it = s.item ? Skins.byKey(s.item) : null;
      dot.style.background = it ? Skins.RARITY[it.rarity].color : '#62BC7C';
      const b = document.createElement('b');
      b.textContent = Math.round((s.w / total) * 100) + '%';
      li.append(dot, it ? it.name : '+' + s.dot + ' đốt', b);
      if (it && Wallet.owns(it.slot, it.id, w)) li.classList.add('have');
      odds.appendChild(li);
    }
    const endDay = new Date(EV.end - 1).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    $('ev-note').textContent = 'Trúng món đã có thì kim dừng ở món cùng độ hiếm chưa có; có đủ rồi thì hoàn lại ' + EV.refund
      + ' đốt. Các món này chỉ có ở vòng quay đến hết ' + endDay + ', sau đó sẽ vào Hộp quà và bán trong tiệm.';
  }
  function scrollToPanel() {
    requestAnimationFrame(() => document.querySelector('.tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // ================= Thông báo sự kiện mới =================
  // pending: máy này chưa xem thông báo (chờ hộp "Máy này của ai?" đóng rồi mới hiện).
  const SPL = { on: false, pending: !seenEv(), parts: [], acc: 0 };
  function openSplash() {
    if (!EV || SPL.on || !SPL.pending) return;
    SPL.on = true;
    SPL.pending = false;
    $('splash-title').textContent = EV.name;
    const names = EV.sets.map((s) => s.name).join(' và ');
    const endDay = new Date(EV.end - 1).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    $('splash-text').textContent = EV.tagline + ' Có ' + names + ': skin, cánh bướm và hiệu ứng ăn lá riêng của ' + EV.short + ', chỉ có đến hết ' + endDay + '.';
    $('splash').hidden = false;
    SFX.reveal('suthi');
    markSeen();
  }
  function closeSplash(go) {
    SPL.on = false;
    $('splash').hidden = true;
    if (go) { switchTab('ev'); scrollToPanel(); }
  }
  function drawSplash(t, dt) {
    const c = $('splash-art');
    const [w, h] = sizeCanvas(c);
    const x = c.getContext('2d');
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    x.clearRect(0, 0, w, h);
    const items = evItems();
    const skin = items.find((i) => i.slot === 'skin' && i.rarity === 'huyenthoai') || items[0];
    const wing = items.find((i) => i.slot === 'wing' && i.rarity === 'suthi') || items.find((i) => i.slot === 'wing');
    const fx = items.find((i) => i.slot === 'fx' && i.rarity === 'suthi') || Skins.get('fx', 'sao-vang');
    x.save();
    x.translate(w * 0.04, h * 0.1 + Math.sin(t * 2) * 3);
    Skins.drawPreview(x, skin, w * 0.6, h * 0.78, t);
    x.restore();
    if (wing) {
      const S = Math.min(w, h) / 150;
      x.save();
      x.translate(w * 0.76 + Math.sin(t * 1.3) * 10, h * 0.36 + Math.sin(t * 2.6) * 6);
      x.rotate(0.15);
      Skins.drawButterfly(x, wing, S, t);
      x.restore();
    }
    SPL.acc += dt;
    while (SPL.acc > 0.14) {
      SPL.acc -= 0.14;
      for (const p of Skins.eatBurst(fx, 1, 1.2, ['#FFC93C'])) {
        p.x = Math.random() * w; p.y = h + 6; p.vx = (Math.random() - 0.5) * 20; p.vy = -(30 + Math.random() * 40);
        p.life = p.max = 2.2; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 3;
        SPL.parts.push(p);
      }
    }
    for (let i = SPL.parts.length - 1; i >= 0; i--) {
      const p = SPL.parts[i];
      p.life -= dt;
      if (p.life <= 0) { SPL.parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      Skins.drawParticle(x, p, 1);
    }
    x.globalAlpha = 1;
  }

  // ================= Kỷ niệm =================
  function renderMemo() {
    const w = Wallet.get();
    const list = $('memo');
    list.replaceChildren();
    const all = shown();
    const owned = all.filter((i) => Wallet.owns(i.slot, i.id, w)).length;
    $('memo-count').textContent = 'Đã sưu tập ' + owned + '/' + all.length + ' món';
    $('memo-bar').style.width = (owned / all.length) * 100 + '%';
    const withCh = all.filter((i) => i.ch).sort((a, b) => a.ch - b.ch || RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    for (const item of withCh) {
      const have = Wallet.owns(item.slot, item.id, w);
      const li = document.createElement('li');
      li.className = have ? '' : 'locked';
      let art;
      if (have) {
        art = document.createElement('canvas');
        requestAnimationFrame(() => drawThumb(art, item));
      } else {
        art = document.createElement('span');
        art.className = 'm-lock';
        art.textContent = '?';
      }
      const text = document.createElement('span');
      text.className = 'm-text';
      const small = document.createElement('small');
      small.textContent = 'Chương ' + item.ch + ' · ' + SLOT_NAME[item.slot];
      const b = document.createElement('b');
      b.textContent = have ? item.name : 'Chưa mở';
      const p = document.createElement('p');
      p.textContent = have ? item.memory : 'Có món này để đọc lại kỷ niệm.';
      text.append(small, b, p);
      li.append(art, text);
      if (have) li.addEventListener('click', () => { switchTab(item.slot); openSheet(item); });
      list.appendChild(li);
    }
  }

  // ================= Sao lưu =================
  function renderSync() {
    const el = $('sync-line');
    const s = window.Sync;
    if (!s) { el.hidden = true; return; }
    const who = s.who ? 'Máy của ' + s.WHO[s.who] : '';
    let text, color;
    if (s.status === 'nowho') { text = 'Chưa sao lưu · chạm để chọn máy của ai'; color = '#E8962A'; }
    else if (s.status === 'syncing' || s.status === 'idle') { text = 'Đang sao lưu… · ' + who; color = '#4C8DE0'; }
    else if (s.status === 'ok') {
      const at = new Date(s.lastAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      text = 'Đã sao lưu lúc ' + at + ' · ' + who; color = '#62BC7C';
    } else if (s.status === 'denied') { text = 'Chưa sao lưu được: Firebase chưa cho phép · ' + who; color = '#E8554E'; }
    else { text = 'Chưa sao lưu được, có mạng sẽ thử lại · ' + who; color = '#E8962A'; }
    el.textContent = text;
    el.style.setProperty('--sync', color);
  }
  function openWho() {
    $('who').hidden = false;
    $('who-backdrop').hidden = false;
  }
  function closeWho() {
    $('who').hidden = true;
    $('who-backdrop').hidden = true;
    if (SPL.pending) setTimeout(openSplash, 400);
  }

  // ================= Chung =================
  function updateStageTag() {
    const tag = $('stage-tag');
    if (UI.trying) {
      const w = Wallet.get();
      const st = stateOf(UI.trying, w);
      tag.textContent = st.on ? 'Đang dùng' : 'Đang thử: ' + UI.trying.name;
      tag.classList.toggle('trying', !st.on);
    } else {
      tag.textContent = UI.tab === 'wing' ? 'Cánh đang dùng' : 'Đang mặc';
      tag.classList.remove('trying');
    }
  }
  function switchTab(tab) {
    if (tab === 'ev' && !EV) tab = 'box';
    UI.tab = tab;
    try { sessionStorage.setItem('lpn:shopTab', tab); } catch (e) { /* bỏ qua */ }
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    $('tab-ev').hidden = tab !== 'ev';
    $('tab-box').hidden = tab !== 'box';
    $('tab-items').hidden = !SLOT_NAME[tab];
    $('tab-memo').hidden = tab !== 'memo';
    if (tab === 'ev') markSeen();
    parts.length = 0;
    eat.phase = 0;
    renderTab();
    updateStageTag();
  }
  function renderTab() {
    if (UI.tab === 'ev') renderEvent();
    else if (UI.tab === 'box') renderBox();
    else if (SLOT_NAME[UI.tab]) renderGrid(UI.tab);
    else renderMemo();
  }
  function renderAll() {
    const w = Wallet.get();
    if (!PK.on && !WS.spinning) $('dot').textContent = fmt(w.dot);
    const all = shown();
    const owned = all.filter((i) => Wallet.owns(i.slot, i.id, w)).length;
    $('owned-count').textContent = owned + '/' + all.length + ' món';
    renderTab();
    updateSheetAction();
    updateStageTag();
    renderSync();
  }

  // ================= Sự kiện bấm =================
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { SFX.click(); switchTab(b.dataset.tab); }));
  $('btn-open').addEventListener('click', openBox);
  $('giftbox').addEventListener('click', openBox);
  $('qty-minus').addEventListener('click', () => { SFX.click(); setQty(UI.qty - 1); });
  $('qty-plus').addEventListener('click', () => { SFX.click(); setQty(UI.qty + 1); });
  document.querySelectorAll('#qty-chips button').forEach((b) => b.addEventListener('click', () => { SFX.click(); setQty(+b.dataset.q); }));
  $('sheet-close').addEventListener('click', closeSheet);
  $('sheet-backdrop').addEventListener('click', closeSheet);
  $('sheet-action').addEventListener('click', sheetAction);
  $('reveal-close').addEventListener('click', closeReveal);
  $('reveal-again').addEventListener('click', () => {
    const ctx = UI.revealCtx;
    closeReveal();
    if (ctx === 'wheel') spin(1);
    else { UI.qty = 1; openBox(); }
  });
  $('reveal-use').addEventListener('click', () => {
    const res = UI.reveal, ctx = UI.revealCtx;
    if (res) { Wallet.equip(res.item.slot, res.item.id); SFX.click(); toast('Đã dùng ' + res.item.name); }
    closeReveal();
    if (res && ctx === 'single') switchTab(res.item.slot);
    renderAll();
  });
  $('pack-all').addEventListener('click', packAll);
  $('pack-done').addEventListener('click', closePack);
  $('pack-again').addEventListener('click', () => {
    const again = PK.opts.again && PK.opts.again();
    closePack();
    if (again && again.ok) again.run();
  });
  if (EV) {
    $('tab-btn-ev').hidden = false;
    $('ev-ping').hidden = seenEv();
    $('spin-1').addEventListener('click', () => spin(1));
    $('spin-10').addEventListener('click', () => spin(10));
    $('wheel-hub').addEventListener('click', () => spin(1));
    $('splash-go').addEventListener('click', () => { SFX.click(); closeSplash(true); });
    $('splash-later').addEventListener('click', () => closeSplash(false));
    setInterval(() => { if (UI.tab === 'ev') $('ev-time').textContent = evTimeText(); }, 30000);
  }
  $('sync-line').addEventListener('click', () => {
    const s = window.Sync;
    if (!s) return;
    if (!s.who || s.status === 'nowho') openWho();
    else if (s.status === 'denied') toast('Anh cần mở quyền "lpn" trong Firebase');
    else s.pull();
  });
  document.querySelectorAll('.who-btn').forEach((b) => b.addEventListener('click', () => {
    closeWho();
    toast('Đang sao lưu cho ' + window.Sync.WHO[b.dataset.who] + '…');
    window.Sync.setWho(b.dataset.who);
  }));
  $('who-later').addEventListener('click', () => {
    try { sessionStorage.setItem('lpn:whoLater', '1'); } catch (e) { /* bỏ qua */ }
    closeWho();
  });
  $('who-backdrop').addEventListener('click', closeWho);
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('reveal').hidden) closeReveal();
    else if (PK.on) closePack();
    else if (SPL.on) closeSplash(false);
    else if (!$('sheet').hidden) closeSheet();
    else if (!$('who').hidden) closeWho();
  });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  window.addEventListener('resize', () => { if (SLOT_NAME[UI.tab]) renderGrid(UI.tab); });

  // Quà đốt vừa nhận qua sao lưu (sync.js ghi lại): báo một lần.
  function showGrant() {
    let g = null;
    try { g = JSON.parse(localStorage.getItem('lpn:grantNotice')); localStorage.removeItem('lpn:grantNotice'); } catch (e) { /* bỏ qua */ }
    if (!g || !g.dot) return;
    toast((g.notes && g.notes[0]) || '🎁 Được tặng ' + fmt(g.dot) + ' đốt cây');
    SFX.coin();
    bumpDot();
    const [cx, cy] = centerOf(document.querySelector('.dot-pill'));
    fxLeaves(cx, cy, 16);
  }

  // Bản sao lưu khác máy: vẽ lại theo dữ liệu mới, không cần tải lại trang.
  window.LPN_onSync = () => { renderAll(); showGrant(); };
  if (window.Sync) window.Sync.on(renderSync);

  // ================= Vòng vẽ =================
  let last = performance.now();
  const sheetArt = $('sheet-art'), revealArt = $('reveal-art');
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    drawStage(t, dt);
    if (UI.sheet && !$('sheet').hidden) drawThumb(sheetArt, UI.sheet, t);
    if (UI.reveal && !$('reveal').hidden) drawThumb(revealArt, UI.reveal.item, t);
    if (EV && (UI.tab === 'ev' || WS.spinning)) drawWheel(now, dt);
    if (SPL.on) drawSplash(t, dt);
    drawFx(dt);
    requestAnimationFrame(frame);
  }

  // ================= Khởi động =================
  const hashTab = location.hash.slice(1);
  const firstLook = SPL.pending;
  let startTab = 'box';
  try { startTab = sessionStorage.getItem('lpn:shopTab') || 'box'; } catch (e) { /* bỏ qua */ }
  if (firstLook) startTab = 'ev';
  if (['ev', 'box', 'skin', 'fx', 'wing', 'memo'].includes(hashTab)) startTab = hashTab;
  switchTab(startTab);
  renderAll();
  requestAnimationFrame(frame);
  setTimeout(showGrant, 500);
  let later = false;
  try { later = !!sessionStorage.getItem('lpn:whoLater'); } catch (e) { /* bỏ qua */ }
  if (window.Sync && !window.Sync.who && !later) setTimeout(openWho, 700);
  else if (firstLook) setTimeout(openSplash, 600);
})();
