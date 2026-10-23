// Tiệm Sâu: dùng đốt cây mua skin, hiệu ứng ăn lá, cánh bướm; mở hộp quà (một hoặc nhiều hộp cùng lúc);
// quay vòng quay sự kiện; xem lại kỷ niệm.
'use strict';
(() => {
  const BOX_PRICE = 120;
  const DUP_REFUND = 50;
  const PITY_EPIC = 10;   // tối đa 10 hộp là có Sử thi trở lên
  const PITY_LEGEND = 40; // tối đa 40 hộp là có Huyền thoại
  const MAX_QTY = 20;     // mở nhiều nhất 20 hộp một lần
  const RARITY_ORDER = ['thuong', 'hiem', 'suthi', 'huyenthoai']; // các bậc có trong Hộp quà thường
  const RANK = ['thuong', 'hiem', 'suthi', 'huyenthoai', 'dinhmenh']; // xếp hạng, gồm cả bậc độc quyền
  const TOP = (r) => r === 'huyenthoai' || r === 'dinhmenh';
  const BIG = (r) => r === 'suthi' || TOP(r);
  const SLOT_NAME = { skin: 'Skin', fx: 'Hiệu ứng', wing: 'Cánh bướm', bg: 'Nền' };
  const HINT = {
    skin: 'Chạm để thử lên bé sâu. Mỗi skin có một kỹ năng riêng khi chơi (chạm đúp màn hình để dùng), skin càng hiếm kỹ năng càng mạnh.',
    fx: 'Hiện ra mỗi lần bé sâu đớp lá. Chạm để xem thử.',
    wing: 'Đôi cánh khi bé sâu hoá bướm cuối bài. Chạm để xem thử.',
    bg: 'Khung cảnh phía sau khi chơi Sâu Tím, đổi luôn màu lá và cành. Chạm để xem thử.',
  };
  const TAU = Math.PI * 2;
  const ITEMS = Skins.ITEMS;
  const isLive = (e) => !!e && Date.now() >= Skins.startOf(e) && Date.now() < e.end;
  const EV_LIST = Skins.visibleEvents(); // sự kiện đang diễn ra hoặc sắp mở
  const WAS_LIVE = {};
  for (const e of EV_LIST) WAS_LIVE[e.id] = isLive(e);
  let EV = null; // sự kiện đang xem trong tab Sự kiện (chọn lúc khởi động)
  // Món của sự kiện chưa bắt đầu thì chưa hiện ở đâu cả; phần thưởng vụ án chỉ hiện khi đã nhận.
  const shown = () => ITEMS.filter((i) => Skins.itemState(i) !== 'hidden' && (!i.reward || Wallet.owns(i.slot, i.id)));
  const exclusive = (i) => Skins.itemState(i) === 'event';
  const inBox = (i) => !i.free && !i.reward && Skins.itemState(i) === 'normal';
  const keyOf = (it) => it.slot + ':' + it.id;
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('vi-VN');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const params = new URLSearchParams(location.search);
  if (params.get('from') === 'game') $('btn-back').href = '../game/';

  // ================= Trời ngày / đêm (giống trang chủ) =================
  const sky = (() => {
    // Đã đoán sẵn trong <head> (cùng cách với mọi trang) thì dùng luôn.
    if (window.LPN_SKY) return window.LPN_NIGHT ? 'dem' : window.LPN_SKY;
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
      const steps = { thuong: [523, 659, 784], hiem: [523, 659, 784, 988], suthi: [523, 659, 784, 988, 1175], huyenthoai: [523, 659, 784, 1047, 1319, 1568], dinhmenh: [440, 554, 659, 880, 1109, 1319, 1760] }[r];
      steps.forEach((f, i) => tone(f, 0.4, 0.15, i * 0.08, 'triangle'));
      if (BIG(r)) steps.forEach((f, i) => tone(f * 2, 0.5, 0.05, 0.3 + i * 0.06));
    },
    no() { tone(200, 0.18, 0.12, 0, 'triangle'); },
    drop(n) { for (let i = 0; i < Math.min(n, 20); i++) tone(240 + i * 14, 0.06, 0.035, i * 0.045, 'triangle'); },
    // mỗi hộp mở cao dần lên một chút
    pop(i) { const f = 520 * Math.pow(2, Math.min(i, 20) / 24); tone(f, 0.12, 0.1, 0, 'triangle'); tone(f * 2, 0.09, 0.035, 0.02); },
    // hộp hiếm rung lên: tiếng ngân dồn dập dần
    charge(r) {
      const legend = TOP(r);
      const n = r === 'dinhmenh' ? 24 : legend ? 16 : 9, span = r === 'dinhmenh' ? 2.05 : legend ? 1.35 : 0.65;
      for (let i = 0; i < n; i++) tone(330 * Math.pow(2, i / (legend ? 8 : 6)), 0.14, 0.035 + i * 0.004, (i / n) * span, 'triangle');
    },
    epic() { [659, 831, 988, 1319].forEach((f, i) => tone(f, 0.55, 0.13, i * 0.06, 'triangle')); tone(1976, 0.9, 0.04, 0.28); },
    legend() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 0.14, i * 0.09, 'triangle'));
      [1047, 1319, 1568, 2093].forEach((f) => tone(f, 1.4, 0.06, 0.4, 'triangle'));
      for (let i = 0; i < 8; i++) tone(2093 + i * 180, 0.18, 0.025, 0.55 + i * 0.07);
    },
    // Định mệnh: hợp âm la trưởng ngân dài, lấp lánh như chuông gió rồi một nốt tim cao.
    destiny() {
      [440, 554, 659, 880].forEach((f, i) => tone(f, 0.5, 0.13, i * 0.1, 'triangle'));
      [880, 1109, 1319, 1760].forEach((f) => tone(f, 1.8, 0.05, 0.45, 'triangle'));
      for (let i = 0; i < 12; i++) tone(1760 + ((i * 7) % 12) * 120, 0.2, 0.025, 0.6 + i * 0.065);
      tone(2637, 1.2, 0.04, 1.3);
    },
    // hoạt cảnh Nàng Thơ: tiếng đàn tranh ngũ cung nhẹ
    poem() { [587, 659, 784, 880, 1047, 880, 784, 1175].forEach((f, i) => tone(f, 0.9, 0.07, 0.2 + i * 0.32, 'sine')); },
    // hoạt cảnh Vi Mạch: tiếng dò sóng lách tách rồi chuông kết nối
    signal() {
      for (let i = 0; i < 10; i++) tone(700 + ((i * 37) % 9) * 140, 0.05, 0.03, 0.15 + i * 0.09, 'square');
      [784, 1175, 1568].forEach((f, i) => tone(f, 0.45, 0.1, 1.6 + i * 0.09, 'triangle'));
      tone(2093, 0.9, 0.05, 2.45);
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
  const UI = { tab: 'box', trying: null, sheet: null, reveal: null, revealCtx: 'single', confirmBuy: 0, confirmUp: 0, qty: 1 };
  try { UI.qty = Math.max(1, Math.min(MAX_QTY, parseInt(sessionStorage.getItem('lpn:boxQty'), 10) || 1)); } catch (e) { /* bỏ qua */ }
  const look = () => {
    const eq = Wallet.equipped();
    const pick = (slot) => (UI.trying && UI.trying.slot === slot ? UI.trying : Skins.get(slot, eq[slot]));
    return { skin: pick('skin'), fx: pick('fx'), wing: pick('wing'), bg: pick('bg') };
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
    dinhmenh: ['#FF6FAE', '#B983FF', '#5FFFE0', '#FFFFFF', '#FFE27A', '#FF9FD0'],
  };
  // Bung hạt sáng từ (cx, cy) theo độ hiếm: Sử thi tím, Huyền thoại vàng và nhiều hơn hẳn.
  function fxBurst(cx, cy, rar, power) {
    const p = power || 1;
    const cols = RCOL[rar];
    const big = BIG(rar), legend = TOP(rar), destiny = rar === 'dinhmenh';
    const n = Math.round({ thuong: 8, hiem: 12, suthi: 46, huyenthoai: 100, dinhmenh: 150 }[rar] * p);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = (big ? 140 + Math.random() * (destiny ? 560 : legend ? 480 : 320) : 70 + Math.random() * 180) * Math.sqrt(p);
      const kind = legend ? [6, 8, 2, 1][i % 4] : rar === 'suthi' ? [6, 2, 2][i % 3] : 2;
      const life = (big ? 0.9 : 0.5) + Math.random() * (big ? 0.9 : 0.35);
      fxParts.push({
        kind, x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (big ? 80 : 30), life, max: life,
        size: kind === 6 ? 4 + Math.random() * 4 : kind === 8 ? 3 + Math.random() * 2.5 : kind === 1 ? 5 + Math.random() * 3 : 2 + Math.random() * 2.5,
        color: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, s: 1,
      });
    }
    const rings = { thuong: 0, hiem: 1, suthi: 2, huyenthoai: 3, dinhmenh: 4 }[rar];
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
    el.style.setProperty('--flash', rar === 'dinhmenh' ? '#FFB3DA' : rar === 'huyenthoai' ? '#FFD86B' : rar === 'suthi' ? '#B57CFF' : '#FFFFFF');
    el.classList.add(rar === 'dinhmenh' ? 'fl-destiny' : rar === 'huyenthoai' ? 'fl-big' : 'fl-on');
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

  const STAGE_BG = {}; // nền vẽ sẵn của sân khấu
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

    // Nền riêng (Sa Pa, Lâu Đài Bí Ngô) thì vẽ cả khung cảnh; nền "Trời hôm nay" giữ trời của trang.
    const scenic = Skins.drawBackdrop(x, L.bg, { W: SW, H: SH, t, dt, speed: 0, dpr: DPR, night: NIGHT, st: STAGE_BG });
    // mây nhẹ
    x.fillStyle = NIGHT ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 3 && !scenic; i++) {
      const cx = ((t * 8 + i * 140) % (SW + 120)) - 60, cy = 30 + i * 26;
      x.beginPath(); x.arc(cx, cy, 12, 0, TAU); x.arc(cx + 16, cy - 6, 15, 0, TAU); x.arc(cx + 32, cy, 12, 0, TAU); x.fill();
    }
    if (NIGHT && !scenic) {
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
      // skin có tính cách: chạm, vuốt, giữ lâu thì bé phản ứng (xem Skins.makePet)
      const pet = petFor(L.skin);
      if (pet) { pet.update(dt); for (const e of pet.takeEvents()) petSound(e); }
      STAGE_HEAD = { hx, hy, r };
      x.save();
      x.translate(hx, hy);
      x.save();
      x.rotate(Math.cos(t * 1.4) * 0.08);
      if (pet) pet.apply(x, r);
      Skins.drawHead(x, r, L.skin, Object.assign({ t, ant: Math.sin(t * 2) * 3 * S, bob: Math.abs(Math.sin(t * 3)) * 0.6, happy: eat.happy, blink: eat.blink, sad: 0, chew: eat.chew, mouthOpen: eat.phase > 0.8 && eat.phase < 1.05 ? 0.7 : 0 }, pet ? pet.face() : {}), S);
      x.restore();
      if (pet) pet.drawFx(x, r, S);
      x.restore();
    }
    stepParts(parts, dt, S);
    for (const p of parts) Skins.drawParticle(x, p, S);
  }

  // ================= Chạm & vuốt bé sâu có tính cách =================
  let PET = null, PET_ITEM = null, STAGE_HEAD = null;
  function petFor(skin) {
    if (PET_ITEM !== skin) { PET_ITEM = skin; PET = Skins.makePet(skin, (window.Sync && window.Sync.who) || null); }
    return PET;
  }
  function petSound(e) {
    if (e === 'squish' || e === 'heart' || e === 'pet') tone(784 + Math.random() * 260, 0.12, 0.05, 0, 'sine');
    else if (e === 'pout' || e === 'grumpy') { tone(300, 0.12, 0.07, 0, 'triangle'); tone(240, 0.16, 0.06, 0.08, 'triangle'); }
    else if (e === 'teary') { tone(587, 0.22, 0.05); tone(494, 0.3, 0.05, 0.16); }
    else if (e === 'shy' || e === 'blush') { tone(660, 0.1, 0.05); tone(880, 0.14, 0.04, 0.08); }
    else { tone(988, 0.08, 0.07, 0, 'triangle'); tone(1319, 0.12, 0.05, 0.07); }
    buzz(8);
  }
  const petPos = (e) => { const b = stage.getBoundingClientRect(); return [e.clientX - b.left - STAGE_HEAD.hx, e.clientY - b.top - STAGE_HEAD.hy]; };
  stage.addEventListener('pointerdown', (e) => {
    if (!PET || !STAGE_HEAD) return;
    const [px, py] = petPos(e);
    if (PET.pointer('down', px, py, STAGE_HEAD.r)) { try { stage.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ } }
  });
  stage.addEventListener('pointermove', (e) => { if (PET && PET.g) { const [px, py] = petPos(e); PET.pointer('move', px, py, STAGE_HEAD.r); } });
  const petUp = (e) => { if (PET && PET.g) { const [px, py] = petPos(e); PET.pointer('up', px, py, STAGE_HEAD.r); } };
  stage.addEventListener('pointerup', petUp);
  stage.addEventListener('pointercancel', petUp);
  // Chạm trúng bé thì không cho trang cuộn, để vuốt được; chạm chỗ khác vẫn cuộn bình thường.
  stage.addEventListener('touchstart', (e) => {
    if (!PET || !STAGE_HEAD) return;
    const b = stage.getBoundingClientRect(), t0 = e.touches[0];
    if (Math.hypot(t0.clientX - b.left - STAGE_HEAD.hx, t0.clientY - b.top - STAGE_HEAD.hy + STAGE_HEAD.r * 0.35) < STAGE_HEAD.r * 1.9) e.preventDefault();
  }, { passive: false });

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
    el.classList.toggle('destiny', item.rarity === 'dinhmenh');
    el.textContent = item.rarity === 'dinhmenh' ? r.name + ' · Độc quyền' : r.name;
    el.style.setProperty('--r', r.color);
  }
  // Đang dùng lên đầu, rồi đến đồ đã có, cuối cùng là đồ chưa có (rẻ trước, hiếm sau).
  const rank = (item, w) => (w.equip[item.slot] === item.id ? 0 : Wallet.owns(item.slot, item.id, w) ? 1 : 2);
  const sortItems = (list, w) => list.slice().sort((a, b) =>
    rank(a, w) - rank(b, w) || (b.free ? 1 : 0) - (a.free ? 1 : 0)
    || RANK.indexOf(a.rarity) - RANK.indexOf(b.rarity) || a.price - b.price);

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
      state.textContent = st.on ? 'Đang dùng' : st.owned ? 'Đã có' : evOnly ? evWhere(item) : fmt(item.price) + ' đốt';
      foot.append(rar, state);
      b.append(c, name, foot);
      if (item.ev && exclusive(item)) {
        const badge = document.createElement('span');
        badge.className = 'i-ev';
        badge.textContent = Skins.eventById(item.ev).short;
        b.appendChild(badge);
      }
      // Skin nào cũng có kỹ năng riêng: biểu tượng ở góc phải thẻ, đã nâng cấp thì ghi bậc.
      const skill = item.slot === 'skin' && Skins.skillOf ? Skins.skillOf(item, Wallet.skillLevel(item.id, w)) : null;
      if (skill) {
        const sk = document.createElement('span');
        sk.className = 'i-sk' + (skill.iconTier ? ' max' : '');
        sk.innerHTML = Skins.skillIcon(item.id, skill.iconTier ? 32 : 16, skill.iconTier);
        sk.style.color = skill.color;
        sk.title = 'Kỹ năng ' + skill.name + (skill.level ? ', bậc ' + skill.level : '');
        if (skill.level) {
          const lv = document.createElement('i');
          lv.className = 'lv';
          lv.textContent = skill.level;
          sk.appendChild(lv);
        }
        b.appendChild(sk);
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
    const skill = item.slot === 'skin' && Skins.skillOf ? Skins.skillOf(item, Wallet.skillLevel(item.id)) : null;
    $('sheet-skill').hidden = !skill;
    if (skill) {
      // Thẻ kỹ năng: biểu tượng, tên và hạng, câu giới thiệu, từng tác dụng, cách dùng.
      const box = $('sheet-skill');
      box.style.setProperty('--sk', skill.color);
      const ic = document.createElement('span');
      ic.className = 'ss-ic';
      ic.innerHTML = Skins.skillIcon(item.id, skill.iconTier ? 36 : 22, skill.iconTier);
      const head = document.createElement('b');
      head.textContent = 'Kỹ năng ' + skill.name;
      const body = document.createElement('span');
      body.className = 'ss-body';
      const top = document.createElement('span');
      top.append(head, ' · ' + Skins.RARITY[item.rarity].name);
      body.append(top);
      const line = document.createElement('span');
      line.className = 'ss-line';
      line.textContent = skill.line + ' Trong ' + skill.time + ' giây: ' + skill.effects.join(', ') + '.';
      const how = document.createElement('span');
      how.className = 'ss-how';
      how.textContent = 'Ăn đủ ' + skill.need + ' lá để nạp, khi chơi chạm đúp màn hình để dùng.';
      body.append(line, how);
      box.replaceChildren(ic, body);
    }
    UI.confirmUp = 0;
    renderUpgrade(item);
    const ev = item.ev && exclusive(item) ? Skins.eventById(item.ev) : null;
    $('sheet-ch').textContent = (ev ? 'Sự kiện ' + ev.name + ' · ' : '') + (item.who ? 'Bộ của ' + (item.who === 'thuy' ? 'em' : 'anh') + ' · ' : '') + (item.reward ? 'Phần thưởng phá án · ' : '') + (item.ch ? 'Kỷ niệm ở chương ' + item.ch + ' · ' : '') + SLOT_NAME[item.slot];
    updateSheetAction();
    $('sheet').hidden = false;
    $('sheet-backdrop').hidden = false;
    updateStageTag();
  }
  // ----- Nâng cấp kỹ năng -----
  // Bậc tiếp theo: nạp, thời gian, và các tác dụng mới/đổi. Bậc đột phá (Định mệnh) cần xong thử thách.
  function questProgress(id, w) {
    const q = (w.quest || {})[id] || {};
    return Skins.BREAK_GOALS.map((gl) => {
      const v = gl.id === 'uses' ? q.uses || 0 : gl.id === 'combo' ? q.combo || 0 : Object.keys(q.hard || {}).length;
      return { goal: gl, v: Math.min(v, gl.need), done: v >= gl.need };
    });
  }
  function renderUpgrade(item) {
    const box = $('sheet-up');
    const max = item.slot === 'skin' && Skins.skillMax ? Skins.skillMax(item) : 0;
    box.hidden = !max;
    if (!max) return;
    const w = Wallet.get();
    const owned = Wallet.owns(item.slot, item.id, w);
    const lvl = Wallet.skillLevel(item.id, w);
    const cur = Skins.skillOf(item, lvl), next = lvl < max ? Skins.skillOf(item, lvl + 1) : null;
    box.style.setProperty('--sk', cur.color);
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
    const parts = [];
    // đầu mục: chấm bậc (bậc đột phá hình thoi)
    const head = el('div', 'su-head');
    const pips = el('span', 'su-pips');
    for (let i = 1; i <= max; i++) {
      const p = el('i', (i <= lvl ? 'on' : '') + (i === 4 && Skins.BREAK[item.id] ? ' brk' : ''));
      pips.appendChild(p);
    }
    pips.append(' bậc ' + lvl + '/' + max);
    head.append(el('b', '', 'Nâng cấp kỹ năng'), pips);
    parts.push(head);
    if (!next) {
      parts.push(el('p', 'su-max', cur.breakthrough ? 'Đã đột phá: ' + cur.breakthrough + ' ✓' : 'Đã nâng tối đa ✓'));
      box.replaceChildren(...parts);
      return;
    }
    const brk = next.breakthrough && Skins.BREAK[item.id];
    const title = el('p', 'su-title');
    if (brk) { title.append('Đột phá: '); title.appendChild(el('em', '', brk.name)); }
    else title.append('Bậc ' + (lvl + 1) + ' sẽ có:');
    parts.push(title);
    if (brk) parts.push(el('p', 'su-line', brk.line));
    const list = el('ul', 'su-list');
    const li = (label, a, b) => { const x = el('li'); x.append(label + ': ' + a + ' → '); x.appendChild(el('b', '', b)); return x; };
    if (next.need !== cur.need) list.appendChild(li('Nạp đầy', cur.need + ' lá', next.need + ' lá'));
    if (next.time !== cur.time) list.appendChild(li('Thời gian', cur.time + ' giây', next.time + ' giây'));
    for (const e of next.effects) if (!cur.effects.includes(e)) list.appendChild(el('li', '', e.charAt(0).toUpperCase() + e.slice(1)));
    parts.push(list);
    // bậc này đổi biểu tượng (nâng tối đa: đá quý; đột phá: siêu cấp) thì cho xem trước
    if (next.iconTier > cur.iconTier) {
      const pv = el('div', 'su-icon');
      const ic = el('span', 'su-icon-ic');
      ic.innerHTML = Skins.skillIcon(item.id, 44, next.iconTier);
      pv.append(ic, el('span', '', next.iconTier === 2 ? 'Biểu tượng đột phá siêu cấp' : 'Biểu tượng mới khi nâng tối đa'));
      parts.push(pv);
    }
    const cost = Skins.UP_COST[item.rarity][lvl];
    let ready = owned;
    if (brk) {
      const prog = questProgress(item.id, w);
      parts.push(el('p', 'su-note', 'Thử thách "' + brk.quest + '" (chỉ tính khi đang mặc skin này):'));
      for (const p of prog) {
        const row = el('div', 'su-goal' + (p.done ? ' done' : ''));
        row.append(el('span', 'ck', p.done ? '✓' : ''), el('span', '', p.goal.text), el('span', 'num', p.v + '/' + p.goal.need));
        const bar = el('span', 'bar');
        const fill = el('span');
        fill.style.width = Math.round((p.v / p.goal.need) * 100) + '%';
        bar.appendChild(fill);
        row.appendChild(bar);
        parts.push(row);
      }
      ready = ready && prog.every((p) => p.done);
    }
    const btn = el('button', 'btn primary su-btn');
    btn.type = 'button';
    if (!owned) { btn.disabled = true; btn.textContent = 'Có skin này rồi mới nâng cấp được'; }
    else if (brk && !ready) { btn.disabled = true; btn.textContent = 'Xong thử thách để đột phá · ' + fmt(cost) + ' đốt'; }
    else if (w.dot < cost) { btn.disabled = true; btn.textContent = 'Còn thiếu ' + fmt(cost - w.dot) + ' đốt'; }
    else btn.textContent = UI.confirmUp > Date.now()
      ? 'Bấm lần nữa để ' + (brk ? 'đột phá' : 'nâng') + ' · ' + fmt(cost) + ' đốt'
      : (brk ? 'Đột phá' : 'Nâng lên bậc ' + (lvl + 1)) + ' · ' + fmt(cost) + ' đốt';
    btn.addEventListener('click', () => upgradeSkill(item));
    parts.push(btn);
    box.replaceChildren(...parts);
  }
  function upgradeSkill(item) {
    const w = Wallet.get();
    const max = Skins.skillMax(item), lvl = Wallet.skillLevel(item.id, w);
    if (lvl >= max || !Wallet.owns(item.slot, item.id, w)) return;
    const cost = Skins.UP_COST[item.rarity][lvl];
    const brk = lvl + 1 === 4 && Skins.BREAK[item.id];
    if (brk && !questProgress(item.id, w).every((p) => p.done)) { SFX.no(); return; }
    if (w.dot < cost) { SFX.no(); return; }
    // Bấm hai lần mới nâng, tránh lỡ tay (phí không rẻ).
    if (UI.confirmUp < Date.now()) {
      UI.confirmUp = Date.now() + 3000;
      SFX.click();
      renderUpgrade(item);
      setTimeout(() => { if (UI.sheet === item) renderUpgrade(item); }, 3050);
      return;
    }
    UI.confirmUp = 0;
    const ok = Wallet.update((v) => {
      if (v.dot < cost || Wallet.skillLevel(item.id, v) !== lvl) return false;
      v.dot -= cost;
      v.up[item.id] = lvl + 1;
    });
    if (!ok) { SFX.no(); return; }
    const sk = Skins.skillOf(item, lvl + 1);
    if (brk) { SFX.destiny(); flash('dinhmenh'); buzz([40, 50, 40, 50, 120]); }
    else { SFX.legend(); flash(item.rarity); buzz([30, 40, 60]); }
    celebrate(item);
    const [cx, cy] = centerOf($('sheet-up'));
    fxBurst(cx, cy, brk ? 'dinhmenh' : item.rarity, brk ? 1.3 : 1);
    fxConfetti(cx, cy, brk ? 'dinhmenh' : item.rarity);
    toast(brk ? 'Đột phá: ' + sk.breakthrough + '!' : 'Kỹ năng ' + sk.name + ' lên bậc ' + sk.level + '!');
    bumpDot();
    renderAll();
    openSheet(item);
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
    else if (item.bonus) btn.textContent = 'Sưu tập đủ 6 món Định Mệnh để nhận';
    else if (exclusive(item)) btn.textContent = isBoxEv(Skins.eventById(item.ev)) ? 'Chỉ có ở Hộp ' + Skins.eventById(item.ev).short + ' · Đến mở' : 'Chỉ có ở Vòng quay ' + Skins.eventById(item.ev).short + ' · Đến quay';
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
      closeSheet();
      renderAll();
      if (!playCut(item)) toast('Đã dùng ' + item.name);
      return;
    }
    if (item.bonus) { SFX.no(); return; }
    if (exclusive(item)) { closeSheet(); switchTab('ev'); selectEvent(item.ev); scrollToPanel(); return; }
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
  // Mua n hộp một lần: trừ đốt (hoặc trừ hộp được tặng khi free), chốt hết kết quả (bảo đảm tính
  // lần lượt từng hộp) rồi mới chạy hiệu ứng, lỡ tắt app giữa chừng cũng không mất món.
  function buyBoxes(n, free) {
    const results = [];
    const ok = Wallet.update((v) => {
      if (free) {
        if (v.freeBoxes < n) return false;
        v.freeBoxes -= n;
      } else {
        if (v.dot < n * BOX_PRICE) return false;
        v.dot -= n * BOX_PRICE;
      }
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
    const fb = $('btn-free');
    fb.hidden = !w.freeBoxes;
    if (w.freeBoxes) {
      const k = Math.min(MAX_QTY, w.freeBoxes);
      fb.textContent = '🎁 Mở ' + (k === 1 ? 'hộp quà tặng' : k + ' hộp quà tặng') + ' · Miễn phí';
    }
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

  // Hộp được tặng (phần thưởng phá án…): mở luôn một lượt tối đa 20 hộp, không mất đốt.
  function openFree() {
    if (opening || PK.on) return;
    const n = Math.min(MAX_QTY, Wallet.get().freeBoxes);
    if (!n) return;
    const results = buyBoxes(n, true);
    if (!results) { SFX.no(); return; }
    openPack(results, {
      theme: 'box',
      title: n === 1 ? 'Hộp quà tặng' : n + ' hộp quà tặng',
      again: () => {
        const k = Math.min(MAX_QTY, Wallet.get().freeBoxes);
        return { label: 'Mở tiếp ' + k + ' hộp quà tặng', ok: k > 0, run: openFree };
      },
    });
  }

  // ================= Mở nhiều hộp cùng lúc =================
  const BOX_SVG = '<svg class="pb-svg" viewBox="0 0 160 150" aria-hidden="true">'
    + '<ellipse class="gb-shadow" cx="80" cy="140" rx="52" ry="7" />'
    + '<g class="gb-body"><rect x="26" y="64" width="108" height="72" rx="12" class="gb-box" /><rect x="72" y="64" width="16" height="72" class="gb-ribbon" /><path d="M26 92h108" class="gb-shade" /></g>'
    + '<g class="gb-lid"><rect x="18" y="46" width="124" height="24" rx="10" class="gb-box gb-top" /><rect x="72" y="46" width="16" height="24" class="gb-ribbon" />'
    + '<path d="M80 46c-8-20-34-26-34-10c0 10 18 10 34 10M80 46c8-20 34-26 34-10c0 10-18 10-34 10" class="gb-bow" /></g></svg>';
  const PK = { on: false, res: [], cells: [], opened: [], done: [], auto: false, waiting: false, busy: 0, timer: 0, opts: null };
  const resRank = (r) => (r.item ? RANK.indexOf(r.rar) * 2 + (r.dup ? 0 : 1) : -1);

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
    const legend = TOP(res.rar), destiny = res.rar === 'dinhmenh';
    cell.classList.add('tell');
    SFX.charge(res.rar);
    buzz(legend ? [20, 60, 20, 60, 20] : 40);
    if (legend) { $('pack').classList.add('dim'); cell.classList.add('focus'); }
    PK.busy++;
    const wait = destiny ? 2200 : legend ? 1500 : 760;
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
      if (res.rar === 'dinhmenh') { SFX.destiny(); flash('dinhmenh'); buzz([40, 50, 40, 50, 120]); }
      else if (res.rar === 'huyenthoai') { SFX.legend(); flash('huyenthoai'); buzz([30, 40, 80]); }
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
      if (TOP(best.rar)) { if (best.rar === 'dinhmenh') SFX.destiny(); else SFX.legend(); setTimeout(() => { if (PK.on) spotlight(best); }, 600); }
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
    if (PK.opts && PK.opts.after) PK.opts.after();
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
    card.classList.toggle('destiny', item.rarity === 'dinhmenh');
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
    else if (ctx === 'gift') { again.textContent = 'Đến Hộp ' + (EV ? EV.short : 'sự kiện'); again.hidden = false; }
    else again.hidden = true;
    $('reveal-close').textContent = ctx === 'pack' ? 'Tiếp tục' : 'Đóng';
    $('reveal').hidden = false;
    // lại hiện thẻ cho animation chạy lại
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
    if (!quiet || PK.waiting) {
      if (!quiet) SFX.reveal(item.rarity);
      buzz(TOP(item.rarity) ? [30, 40, 60] : 25);
      requestAnimationFrame(() => { const [cx, cy] = centerOf($('reveal-art')); fxConfetti(cx, cy, item.rarity); });
    }
  }
  function closeReveal() {
    $('reveal').hidden = true;
    const ctx = UI.revealCtx;
    UI.reveal = null;
    const after = UI.afterReveal;
    UI.afterReveal = null;
    if (after) after();
    if (ctx === 'pack' && PK.waiting) {
      PK.waiting = false;
      if (PK.auto) PK.timer = setTimeout(packStep, 250);
      checkPackDone();
    }
  }

  // ================= Sự kiện: vòng quay =================
  // Có thể có nhiều sự kiện cùng lúc (đang diễn ra hoặc sắp mở); EV là sự kiện đang xem trong tab.
  const SEEN_KEY = 'lpn:evSeen';
  const seenMap = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch (e) { return null; } };
  const seenEv = (ev) => { const m = seenMap(); return !ev || !m || !!m[ev.id]; };
  function markSeen(ev) {
    if (!ev || !isLive(ev)) return;
    try {
      const o = seenMap() || {};
      o[ev.id] = Date.now();
      localStorage.setItem(SEEN_KEY, JSON.stringify(o));
    } catch (e) { /* bỏ qua */ }
    $('ev-ping').hidden = !EV_LIST.some((e) => isLive(e) && !seenEv(e));
  }
  const isBoxEv = (e) => !!e && e.kind === 'box';
  const evAllKeys = (ev) => ev.sets.flatMap((s) => s.items);
  const evItems = (ev) => { ev = ev || EV; return !ev ? [] : isBoxEv(ev) ? evAllKeys(ev).map(Skins.byKey) : ev.wheel.filter((s) => s.item).map((s) => Skins.byKey(s.item)); };
  // Món độc quyền đang chỉ có ở sự kiện: ghi rõ ở đâu mới có.
  const evWhere = (item) => (item.bonus ? 'Quà trọn bộ' : isBoxEv(Skins.eventById(item.ev)) ? 'Hộp sự kiện' : 'Vòng quay');
  const evLegend = (ev) => evItems(ev).find((i) => i.rarity === 'huyenthoai') || null;
  const evState = (w, ev) => { ev = ev || EV; return (ev && w.ev[ev.id]) || { spins: 0, pity: 0 }; };
  const owns = (key, w) => { const it = Skins.byKey(key); return Wallet.owns(it.slot, it.id, w); };
  const dayText = (ms) => new Date(ms).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });

  // Quay một lượt của sự kiện ev trên ví v (đang sửa): chọn ô, cộng món hoặc đốt, tính bảo đảm.
  function rollWheel(v, ev) {
    const st = v.ev[ev.id] || (v.ev[ev.id] = { spins: 0, pity: 0 });
    const slices = ev.wheel;
    const legendIdx = slices.findIndex((s) => s.item && Skins.byKey(s.item).rarity === 'huyenthoai');
    let idx;
    if (legendIdx >= 0 && !owns(slices[legendIdx].item, v) && st.pity + 1 >= ev.pity) idx = legendIdx;
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
      if (owns(sl.item, v)) { res.dup = true; res.refund = ev.refund; v.dot += ev.refund; }
      else v.owned[sl.item] = Date.now();
    }
    st.spins += 1;
    st.pity = res.rar === 'huyenthoai' ? 0 : st.pity + 1;
    return res;
  }

  // Kiểu vòng quay: thổ cẩm (mặc định) và ma quái (Halloween: nền tối, mạng nhện, dơi bay quanh).
  const WHEEL_STYLE = {
    default: {
      rim: '#2F3B85', teeth: ['#D62F45', '#FFC93C'], sep: 'rgba(255,255,255,0.95)',
      fill: { thuong: '#E6F4EA', hiem: '#E2EDFB', suthi: '#EEE3FF' }, legend: ['#FFF6D2', '#FFCF5A'],
      dotFill: '#FFF6E6', dotText: '#2F7A49', bulbOn: '#FFF4C2', bulbOff: '#8C7FD6', pin: ['#D62F45', '#FFC93C'],
    },
    spooky: {
      rim: '#1E1230', teeth: ['#FF8A1F', '#7B4BC4'], sep: 'rgba(255,170,90,0.55)',
      fill: { thuong: '#3B2D57', hiem: '#2E3366', suthi: '#4B2C6E' }, legend: ['#FFE0A3', '#FF8A1F'],
      dotFill: '#2A2340', dotText: '#9FE0B2', bulbOn: '#FFB347', bulbOff: '#4A3A66', pin: ['#7B4BC4', '#FF8A1F'], web: true, bats: true,
    },
  };
  const wheelStyle = () => WHEEL_STYLE[(EV && EV.style) || 'default'] || WHEEL_STYLE.default;

  const WS = { angle: 0, from: 0, to: 0, t0: 0, dur: 0, spinning: false, last: -1, kick: 0, hl: -1, hlT: 0, face: null, faceKey: '', done: null, before: null };
  // Lúc kim đang quay thì vòng quay, bảo đảm và bộ đồ vẫn hiện như trước khi quay, để không lộ kết quả.
  const shownWallet = () => (WS.spinning && WS.before ? WS.before : Wallet.get());
  function wheelGeom() {
    const c = $('wheel');
    const side = c.clientWidth;
    return { side, R: side / 2 - 20, cx: side / 2, cy: side / 2 + 6 };
  }
  // Vẽ sẵn mặt vòng quay (chỉ vẽ lại khi đổi cỡ, đổi sự kiện hoặc có thêm món), mỗi khung chỉ việc xoay.
  function buildFace(R) {
    const pad = 12;
    const D = Math.ceil((R + pad) * 2 * DPR);
    const c = document.createElement('canvas');
    c.width = c.height = D;
    const x = c.getContext('2d');
    x.setTransform(DPR, 0, 0, DPR, D / 2, D / 2);
    const w = shownWallet();
    const ST = wheelStyle();
    const N = EV.wheel.length, seg = TAU / N;
    // viền có răng cưa hai màu
    x.fillStyle = ST.rim;
    x.beginPath(); x.arc(0, 0, R + 11, 0, TAU); x.fill();
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU, b = a + TAU / 40;
      x.fillStyle = ST.teeth[i % 2];
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
        g.addColorStop(0, ST.legend[0]); g.addColorStop(1, ST.legend[1]);
        x.fillStyle = g;
      } else x.fillStyle = it ? ST.fill[it.rarity] : ST.dotFill;
      x.fill();
      x.strokeStyle = ST.sep;
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
          const bx = box * 0.42, by = -R * 0.64 - box * 0.4;
          x.fillStyle = '#3D8A57';
          x.beginPath(); x.arc(bx, by, 7, 0, TAU); x.fill();
          x.strokeStyle = '#FFFFFF';
          x.lineWidth = 1.8;
          x.lineCap = 'round';
          x.beginPath(); x.moveTo(bx - 3.2, by); x.lineTo(bx - 0.8, by + 2.4); x.lineTo(bx + 3.4, by - 2.6); x.stroke();
        }
      } else {
        x.fillStyle = ST.dotText;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.font = '800 ' + Math.round(R * 0.15) + 'px "Be Vietnam Pro", system-ui, sans-serif';
        x.fillText('+' + s.dot, 0, -R * 0.68);
        x.font = '600 ' + Math.round(R * 0.085) + 'px "Be Vietnam Pro", system-ui, sans-serif';
        x.fillText('đốt cây', 0, -R * 0.53);
      }
      x.restore();
    }
    // mạng nhện mảnh giăng giữa các nan
    if (ST.web) {
      x.strokeStyle = 'rgba(255,255,255,0.22)';
      x.lineWidth = 1;
      for (const k of [0.3, 0.5, 0.92]) {
        x.beginPath();
        for (let i = 0; i <= N; i++) {
          const a = -Math.PI / 2 + i * seg, mid = a - seg / 2;
          if (i === 0) x.moveTo(Math.cos(a) * R * k, Math.sin(a) * R * k);
          else x.quadraticCurveTo(Math.cos(mid) * R * k * 0.86, Math.sin(mid) * R * k * 0.86, Math.cos(a) * R * k, Math.sin(a) * R * k);
        }
        x.stroke();
      }
    }
    return c;
  }
  function drawWheel(now, dt) {
    const c = $('wheel');
    const [side] = sizeCanvas(c);
    if (side < 10) return;
    const { R, cx, cy } = wheelGeom();
    const w = shownWallet();
    const ST = wheelStyle();
    const key = EV.id + '|' + side + '|' + EV.wheel.map((s) => (s.item ? (owns(s.item, w) ? 1 : 0) : '-')).join('');
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
      x.strokeStyle = ST.pin[1];
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
        x.fillStyle = ST.bulbOn;
        x.globalAlpha = 0.4;
        x.beginPath(); x.arc(bx, by, 6, 0, TAU); x.fill();
        x.globalAlpha = 1;
      }
      x.fillStyle = on ? ST.bulbOn : ST.bulbOff;
      x.beginPath(); x.arc(bx, by, 3, 0, TAU); x.fill();
    }
    // dơi bay vòng quanh vòng quay ma quái
    if (ST.bats) {
      x.fillStyle = '#2A1B3D';
      for (let i = 0; i < 3; i++) {
        const a = now / 1000 * (0.5 + i * 0.13) + i * 2.1;
        const rr = R + 16 + Math.sin(now / 700 + i) * 6;
        const bx = cx + Math.cos(a) * rr, by = cy + Math.sin(a) * rr * 0.92;
        x.save();
        x.translate(bx, by);
        Skins.drawParticle(x, { kind: 11, x: 0, y: 0, size: 6 + i, life: now / 1000 + i, max: now / 1000 + i, color: '#2A1B3D' }, 1);
        x.restore();
      }
    }
    // kim chỉ ở đỉnh, giật nhẹ mỗi lần lướt qua một ô
    x.save();
    x.translate(cx, cy - R - 8);
    x.rotate(-WS.kick * 0.45);
    x.fillStyle = ST.pin[0];
    x.strokeStyle = ST.pin[1];
    x.lineWidth = 2.5;
    x.lineJoin = 'round';
    x.beginPath(); x.moveTo(-11, -4); x.lineTo(11, -4); x.lineTo(0, 20); x.closePath();
    x.fill(); x.stroke();
    x.fillStyle = ST.pin[1];
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
    const ev = EV;
    if (!isLive(ev) || WS.spinning || PK.on || opening) return;
    const before = Wallet.get().dot;
    const cost = n * ev.price;
    if (before < cost) { SFX.no(); toast('Chưa đủ đốt, chơi Sâu Tím thêm nha'); return; }
    const results = [];
    WS.before = Wallet.get();
    const ok = Wallet.update((v) => {
      if (v.dot < cost) return false;
      v.dot -= cost;
      for (let i = 0; i < n; i++) results.push(rollWheel(v, ev));
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
          theme: ev.id,
          title: n + ' lượt quay · ' + ev.short,
          again: () => ({ label: 'Quay tiếp 10 lần · ' + fmt(10 * ev.price) + ' đốt', ok: Wallet.get().dot >= 10 * ev.price, run: () => spin(10) }),
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

  function leftText(ms) {
    const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
    return d >= 1 ? d + ' ngày ' + (h ? h + ' giờ' : '') : h >= 1 ? h + ' giờ ' + m + ' phút' : Math.max(1, m) + ' phút';
  }
  function evTimeText(ev) {
    ev = ev || EV;
    const now = Date.now();
    if (now < Skins.startOf(ev)) return 'Mở sau ' + leftText(ev.start - now).trim() + ' · ngày ' + dayText(ev.start);
    if (Skins.isPreview(ev)) return 'Thử trước · em mở ngày ' + dayText(ev.start);
    if (ev.forever) return boxLeft(ev, meWho(), Wallet.get()) ? 'Mở mãi, tới khi sưu tập trọn bộ' : 'Đã sưu tập trọn bộ ✓';
    if (now >= ev.end) return 'Đã kết thúc';
    const d = Math.floor((ev.end - now) / 864e5);
    return 'Còn ' + (d >= 1 ? d + ' ngày' : leftText(ev.end - now).trim()) + ' · đến hết ' + dayText(ev.end - 1);
  }
  function selectEvent(id) {
    const ev = EV_LIST.find((e) => e.id === id);
    if (!ev || ev === EV || WS.spinning) return;
    EV = ev;
    WS.faceKey = '';
    WS.hl = -1;
    WS.angle = 0;
    try { sessionStorage.setItem('lpn:shopEv', id); } catch (e) { /* bỏ qua */ }
    markSeen(ev);
    renderEvent();
  }
  // Bóng đen của món (để nhá hàng sự kiện sắp mở mà chưa lộ màu).
  function drawSilhouette(c, item) {
    drawThumb(c, item);
    const x = c.getContext('2d');
    x.save();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = NIGHT ? '#0E0A1C' : '#2A1B3D';
    x.fillRect(0, 0, c.width, c.height);
    x.restore();
  }
  function renderEvent() {
    if (!EV) return;
    const w = shownWallet();
    const live = isLive(EV);
    // chọn sự kiện khi có nhiều hơn một
    const sw = $('ev-switch');
    sw.hidden = EV_LIST.length < 2;
    sw.replaceChildren();
    for (const e of EV_LIST) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ev-chip ev-' + e.id;
      b.setAttribute('aria-pressed', String(e === EV));
      const name = document.createElement('b');
      name.textContent = e.short;
      const sub = document.createElement('small');
      sub.textContent = Skins.isPreview(e) ? 'Chơi thử trước' : e.forever ? 'Độc quyền' : isLive(e) ? 'Đang diễn ra' : 'Mở ' + dayText(e.start);
      b.append(name, sub);
      b.addEventListener('click', () => { SFX.click(); selectEvent(e.id); });
      sw.appendChild(b);
    }
    document.querySelectorAll('.ev-banner').forEach((el) => { el.hidden = el.dataset.ev !== EV.id; });
    const banner = document.querySelector('.ev-banner[data-ev="' + EV.id + '"]');
    banner.querySelector('.ev-kicker').textContent = Skins.isPreview(EV) ? 'Chơi thử trước' : EV.forever ? 'Độc quyền · Định mệnh' : live ? 'Sự kiện giới hạn' : 'Sắp diễn ra';
    banner.querySelector('h2').textContent = EV.name;
    banner.querySelector('.ev-tagline').textContent = live ? EV.tagline : EV.teaser || EV.tagline;
    banner.querySelector('.ev-time').textContent = evTimeText();
    const boxEv = isBoxEv(EV);
    $('ev-live').hidden = !live || boxEv;
    $('evb').hidden = !live || !boxEv;
    $('ev-odds').hidden = !live;
    if (boxEv) { renderBoxEvent(Wallet.get()); return; }
    $('wheel-wrap').classList.toggle('spooky', EV.style === 'spooky');
    if (live) {
      const st = evState(w);
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
    }
    // Bộ đồ (sắp mở thì chỉ hiện bóng đen)
    const sets = $('ev-sets');
    sets.replaceChildren();
    for (const set of EV.sets) {
      const items = set.items.map(Skins.byKey);
      const got = items.filter((i) => Wallet.owns(i.slot, i.id, w)).length;
      const wearing = items.every((i) => w.equip[i.slot] === i.id);
      const card = document.createElement('div');
      card.className = 'set' + (live && got === items.length ? ' full' : '') + (live ? '' : ' secret');
      const head = document.createElement('div');
      head.className = 'set-head';
      const name = document.createElement('b');
      name.textContent = set.name;
      const count = document.createElement('span');
      count.textContent = live ? got + '/' + items.length : items.length + ' món bí mật';
      head.append(name, count);
      const row = document.createElement('div');
      row.className = 'set-items';
      row.style.gridTemplateColumns = 'repeat(' + items.length + ', minmax(0, 1fr))';
      for (const it of items) {
        const have = Wallet.owns(it.slot, it.id, w);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'set-item' + (live && have ? ' have' : '');
        const cv = document.createElement('canvas');
        const lab = document.createElement('span');
        lab.textContent = SLOT_NAME[it.slot];
        b.append(cv, lab);
        if (live) {
          b.setAttribute('aria-label', it.name + (have ? ', đã có' : ', chưa có'));
          b.addEventListener('click', () => { SFX.click(); openSheet(it); });
          requestAnimationFrame(() => drawThumb(cv, it));
        } else {
          b.disabled = true;
          b.setAttribute('aria-label', SLOT_NAME[it.slot] + ' bí mật');
          requestAnimationFrame(() => drawSilhouette(cv, it));
        }
        row.appendChild(b);
      }
      card.append(head, row);
      if (live) {
        const act = document.createElement('button');
        act.type = 'button';
        act.className = 'btn set-wear';
        if (got === items.length) {
          act.textContent = wearing ? 'Đang mặc cả bộ' : 'Mặc cả bộ';
          act.disabled = wearing;
          act.addEventListener('click', () => wearSet(set, items));
        } else {
          act.textContent = 'Đủ bộ thì mặc cả bộ một chạm';
          act.disabled = true;
        }
        card.appendChild(act);
      }
      sets.appendChild(card);
    }
    if (!live) {
      $('ev-note').textContent = 'Vòng quay mở lúc 0 giờ ngày ' + dayText(EV.start) + '. Để dành đốt từ giờ nha, mỗi lượt quay ' + EV.price + ' đốt.';
      return;
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
    $('ev-note').textContent = 'Trúng món đã có thì kim dừng ở món cùng độ hiếm chưa có; có đủ rồi thì hoàn lại ' + EV.refund
      + ' đốt. Các món này chỉ có ở vòng quay đến hết ' + dayText(EV.end - 1) + ', sau đó sẽ vào Hộp quà và bán trong tiệm.';
  }
  function scrollToPanel() {
    requestAnimationFrame(() => document.querySelector('.tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // Mặc cả bộ một chạm; bộ có skin Định mệnh thì chạy luôn hoạt cảnh của skin đó.
  function wearSet(set, items) {
    Wallet.update((v) => { for (const it of items) v.equip[it.slot] = it.id; });
    SFX.buy();
    celebrate(items[0]);
    renderAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const skin = items.find((i) => i.slot === 'skin');
    if (!(skin && playCut(skin))) toast('Đã mặc ' + set.name + ' ✨');
  }

  // ================= Bộ phần thưởng: có skin là có cả bộ (wallet.js tự thêm) =================
  const REWARD_SET_NAME = { 'skin:tham-tu': 'Bộ Thám Tử' };
  function rewardSet(skinKey) {
    const items = [skinKey].concat((Wallet.REWARD_SETS || {})[skinKey] || []).map(Skins.byKey).filter(Boolean);
    return { set: { name: REWARD_SET_NAME[skinKey] || 'trọn bộ' }, items };
  }
  function showSetGift(skinKey) {
    const rs = rewardSet(skinKey);
    if (rs.items.length < 2) return;
    const extra = rs.items.slice(1);
    const wing = extra.find((i) => i.slot === 'wing') || extra[0];
    UI.setGift = rs;
    flash('huyenthoai');
    SFX.legend();
    buzz([30, 40, 80]);
    setTimeout(() => {
      showReveal({ item: wing, rar: wing.rarity }, 'set', true);
      $('reveal-name').textContent = 'Trọn ' + rs.set.name + '!';
      const names = extra.map((i) => (i.slot === 'fx' ? 'hiệu ứng ' : '') + i.name);
      $('reveal-memory').textContent = 'Quà phá án tặng thêm, đi cùng ' + rs.items[0].name + ': ' + names.slice(0, -1).join(', ') + ' và ' + names[names.length - 1] + '. Đã vào tủ đồ của em.';
      $('reveal-use').hidden = true;
      const again = $('reveal-again');
      again.textContent = 'Mặc cả bộ ✨';
      again.hidden = false;
      const [cx, cy] = centerOf($('reveal-art'));
      fxBurst(cx, cy, 'huyenthoai', 1.2);
      fxConfetti(cx, cy, 'huyenthoai');
    }, 380);
    renderAll();
  }

  // ================= Sự kiện mở hộp: Định Mệnh =================
  // Máy nào được tặng skin "của mình"; skin của người kia, hiệu ứng và cánh của cả hai bộ phải mở hộp.
  const meWho = () => (window.Sync && window.Sync.who) || null;
  const partnerSkinKey = (ev, who) => ev.sets.find((s) => s.who !== (who || 'thuy')).items[0];
  const boxKeys = (ev, who) => evAllKeys(ev).filter((k) => k !== ev.gift[who || 'thuy']);
  // Số món còn phải mở hộp mới có (0 = đã đủ, sự kiện khép lại trên máy này).
  const boxLeft = (ev, who, w) => (isBoxEv(ev) ? boxKeys(ev, who).filter((k) => !owns(k, w)).length : 1);
  // Bảng tỉ lệ hiện tại: món đã có bỏ ra, phần còn lại tự chia lại.
  function boxOdds(ev, who, w) {
    const out = [];
    const pk = partnerSkinKey(ev, who);
    for (const k of boxKeys(ev, who)) {
      if (owns(k, w)) continue;
      const it = Skins.byKey(k);
      out.push({ item: k, w: k === pk ? ev.odds.partnerSkin : it.slot === 'wing' ? ev.odds.wing : ev.odds.fx });
    }
    for (const d of ev.odds.dot) out.push({ dot: d.dot, w: d.w });
    return out;
  }
  function rollBox(v, ev, who) {
    const st = v.ev[ev.id] || (v.ev[ev.id] = { spins: 0, pity: 0 });
    const pk = partnerSkinKey(ev, who);
    const res = {};
    if (!boxLeft(ev, who, v)) {
      // đủ rồi mà còn hộp trong lượt mở nhiều: trả lại nguyên giá
      res.dot = ev.price; res.rar = 'thuong'; res.back = true; v.dot += ev.price;
      return res;
    }
    let pick;
    if (!owns(pk, v) && st.pity + 1 >= ev.pity) pick = { item: pk };
    else {
      const list = boxOdds(ev, who, v);
      let r = Math.random() * list.reduce((a, b) => a + b.w, 0);
      pick = list.find((o) => (r -= o.w) < 0) || list[list.length - 1];
    }
    if (pick.dot) { res.dot = pick.dot; res.rar = 'thuong'; v.dot += pick.dot; }
    else { const it = Skins.byKey(pick.item); res.item = it; res.rar = it.rarity; v.owned[pick.item] = Date.now(); }
    st.spins += 1;
    st.pity = res.rar === 'dinhmenh' ? 0 : st.pity + 1;
    // Trọn bộ sáu món: tặng thêm nền thưởng
    if (ev.bonus && !owns(ev.bonus, v) && evAllKeys(ev).every((k) => owns(k, v))) { v.owned[ev.bonus] = Date.now(); res.bonus = true; }
    return res;
  }
  function openEvBox(n) {
    const ev = EV;
    if (!isBoxEv(ev) || !isLive(ev) || PK.on || opening || WS.spinning) return;
    const who = meWho();
    if (!who) { toast('Chọn máy này của ai trước đã nha'); openWho(); return; }
    if (!boxLeft(ev, who, Wallet.get())) return;
    const cost = n * ev.price;
    const before = Wallet.get().dot;
    if (before < cost) { SFX.no(); toast('Chưa đủ đốt, chơi Sâu Tím thêm nha'); return; }
    const results = [];
    const ok = Wallet.update((v) => {
      if (v.dot < cost) return false;
      v.dot -= cost;
      for (let i = 0; i < n; i++) results.push(rollBox(v, ev, who));
    });
    if (!ok) { SFX.no(); return; }
    bumpDot();
    $('dot').textContent = fmt(before - cost);
    const bonus = results.some((r) => r.bonus);
    openPack(results, {
      theme: 'destiny',
      title: n === 1 ? 'Hộp ' + ev.short : n + ' Hộp ' + ev.short,
      again: () => ({
        label: 'Mở tiếp ' + n + ' hộp · ' + fmt(n * ev.price) + ' đốt',
        ok: Wallet.get().dot >= n * ev.price && !!boxLeft(ev, who, Wallet.get()),
        run: () => openEvBox(n),
      }),
      after: bonus ? () => setTimeout(() => celebrateFull(ev), 300) : null,
    });
    renderEvent();
  }
  // Đủ cả sáu món: màn chúc mừng trọn bộ, tặng nền Hai Tần Số.
  function celebrateFull(ev) {
    const bg = Skins.byKey(ev.bonus);
    flash('dinhmenh');
    SFX.destiny();
    const [cx, cy] = [window.innerWidth / 2, window.innerHeight * 0.4];
    fxBurst(cx, cy, 'dinhmenh', 1.3);
    fxConfetti(cx, cy, 'dinhmenh');
    showReveal({ item: bg, rar: bg.rarity }, 'pack', true);
    $('reveal-memory').textContent = 'Trọn bộ Định Mệnh! ' + bg.memory;
    renderAll();
  }
  // Quà tặng: skin "của mình" vào ví một lần (đồng bộ qua owned nên máy khác không tặng lại).
  function grantGift(ev) {
    const who = meWho();
    if (!isBoxEv(ev) || !isLive(ev) || !who || !ev.gift[who]) return null;
    const key = ev.gift[who];
    if (owns(key, Wallet.get())) return null;
    Wallet.update((v) => { if (!owns(key, v)) v.owned[key] = Date.now(); });
    return Skins.byKey(key);
  }
  function showGift(item) {
    flash('dinhmenh');
    SFX.destiny();
    buzz([40, 50, 40, 50, 120]);
    UI.afterReveal = () => { switchTab('ev'); selectEvent(SPL.ev ? SPL.ev.id : EV.id); scrollToPanel(); };
    setTimeout(() => {
      showReveal({ item, rar: item.rarity }, 'gift', true);
      const [cx, cy] = centerOf($('reveal-art'));
      fxBurst(cx, cy, 'dinhmenh', 1.2);
      fxConfetti(cx, cy, 'dinhmenh');
    }, 380);
  }
  function renderBoxEvent(w) {
    const ev = EV, who = meWho() || 'thuy';
    const st = evState(w, ev);
    const left = boxLeft(ev, who, w);
    const label = (el, n) => {
      const b = document.createElement('b');
      b.textContent = 'Mở ' + n + ' hộp';
      const s2 = document.createElement('small');
      s2.textContent = fmt(ev.price * n) + ' đốt';
      el.replaceChildren(b, s2);
    };
    label($('evb-1'), 1);
    label($('evb-10'), 10);
    $('evb-1').disabled = $('evb-10').disabled = $('evb-box').disabled = !left;
    $('evb').classList.toggle('done', !left);
    $('evb-done').hidden = !!left;
    const need = $('evb-need');
    if (left && w.dot < ev.price) {
      need.hidden = false;
      need.replaceChildren('Còn thiếu ' + fmt(ev.price - w.dot) + ' đốt để mở hộp. ');
      const a = document.createElement('a');
      a.href = '../game/';
      a.textContent = 'Chơi Sâu Tím kiếm thêm';
      need.appendChild(a);
    } else need.hidden = true;
    const pk = Skins.byKey(partnerSkinKey(ev, who));
    const havePk = Wallet.owns(pk.slot, pk.id, w);
    $('evb-pity-name').textContent = (havePk ? '' : 'Bảo đảm ') + pk.name;
    $('evb-pity').textContent = havePk ? 'Đã có ✓' : 'còn tối đa ' + (ev.pity - st.pity) + ' hộp';
    $('evb-pity-bar').style.width = (havePk ? 100 : (st.pity / ev.pity) * 100) + '%';
    $('evb-pity').parentElement.parentElement.hidden = !left && havePk;
    // Hai bộ đồ
    const sets = $('ev-sets');
    sets.replaceChildren();
    for (const set of ev.sets) {
      const items = set.items.map(Skins.byKey);
      const got = items.filter((i) => Wallet.owns(i.slot, i.id, w)).length;
      const wearing = items.every((i) => w.equip[i.slot] === i.id);
      const card = document.createElement('div');
      card.className = 'set destiny-set set-' + set.id + (got === items.length ? ' full' : '');
      const head = document.createElement('div');
      head.className = 'set-head';
      const nm = document.createElement('span');
      nm.className = 'set-name';
      const b = document.createElement('b');
      b.textContent = set.name;
      const sub = document.createElement('small');
      sub.textContent = set.sub + ' · bộ của ' + (set.who === 'thuy' ? 'em' : 'anh');
      nm.append(b, sub);
      const count = document.createElement('span');
      count.textContent = got + '/' + items.length;
      head.append(nm, count);
      const row = document.createElement('div');
      row.className = 'set-items';
      row.style.gridTemplateColumns = 'repeat(' + items.length + ', minmax(0, 1fr))';
      for (const it of items) {
        const have = Wallet.owns(it.slot, it.id, w);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'set-item' + (have ? ' have' : '') + (it.rarity === 'dinhmenh' ? ' r-dinhmenh' : '');
        const cv = document.createElement('canvas');
        const lab = document.createElement('span');
        lab.textContent = SLOT_NAME[it.slot];
        btn.append(cv, lab);
        if (keyOf(it) === ev.gift[who]) {
          const g = document.createElement('i');
          g.className = 'set-gift';
          g.textContent = 'Quà tặng';
          btn.appendChild(g);
        }
        btn.setAttribute('aria-label', it.name + (have ? ', đã có' : ', chưa có'));
        btn.addEventListener('click', () => { SFX.click(); openSheet(it); });
        requestAnimationFrame(() => drawThumb(cv, it));
        row.appendChild(btn);
      }
      const act = document.createElement('button');
      act.type = 'button';
      act.className = 'btn set-wear';
      if (got === items.length) {
        act.textContent = wearing ? 'Đang mặc cả bộ' : 'Mặc cả bộ';
        act.disabled = wearing;
        act.addEventListener('click', () => wearSet(set, items));
      } else {
        act.textContent = 'Đủ bộ thì mặc cả bộ một chạm';
        act.disabled = true;
      }
      card.append(head, row, act);
      sets.appendChild(card);
    }
    // Quà trọn bộ
    const bonus = Skins.byKey(ev.bonus);
    const all = evAllKeys(ev);
    const got = all.filter((k) => owns(k, w)).length;
    const haveBonus = owns(ev.bonus, w);
    const card = document.createElement('div');
    card.className = 'set destiny-bonus' + (haveBonus ? ' full' : '');
    const cv = document.createElement('canvas');
    cv.className = 'bonus-art';
    const txt = document.createElement('div');
    txt.className = 'bonus-text';
    const t1 = document.createElement('b');
    t1.textContent = haveBonus ? bonus.name + ' · đã nhận' : 'Trọn bộ ' + all.length + ' món: tặng ' + bonus.name;
    const t2 = document.createElement('small');
    t2.textContent = haveBonus ? 'Hai bộ đã về đủ một nhà.' : 'Đã có ' + got + '/' + all.length + ' món của cả hai bộ.';
    const bar = document.createElement('i');
    bar.className = 'bonus-bar';
    const fill = document.createElement('i');
    fill.style.width = (got / all.length) * 100 + '%';
    bar.appendChild(fill);
    txt.append(t1, t2, bar);
    card.append(cv, txt);
    card.addEventListener('click', () => { SFX.click(); openSheet(bonus); });
    requestAnimationFrame(() => drawThumb(cv, bonus));
    sets.appendChild(card);
    // Tỉ lệ hiện tại
    const odds = $('ev-odds');
    odds.replaceChildren();
    odds.hidden = !left;
    if (left) {
      const list = boxOdds(ev, who, w);
      const total = list.reduce((a, b2) => a + b2.w, 0);
      for (const o of list) {
        const li = document.createElement('li');
        const dot = document.createElement('span');
        dot.className = 'r-dot';
        const it = o.item ? Skins.byKey(o.item) : null;
        dot.style.background = it ? Skins.RARITY[it.rarity].color : '#62BC7C';
        const pct = document.createElement('b');
        pct.textContent = (Math.round((o.w / total) * 1000) / 10).toLocaleString('vi-VN') + '%';
        li.append(dot, it ? it.name : '+' + o.dot + ' đốt', pct);
        odds.appendChild(li);
      }
    }
    $('ev-note').textContent = left
      ? 'Mỗi hộp ' + ev.price + ' đốt. Món đã có sẽ không ra nữa, phần tỉ lệ đó chia lại cho các món còn lại. Tối đa ' + ev.pity
        + ' hộp chắc chắn có ' + pk.name + '. Sự kiện này mở mãi, tới khi sưu tập trọn bộ.'
      : 'Trọn bộ rồi! Cả sáu món và ' + bonus.name + ' đã nằm trong tủ đồ.';
  }

  // ================= Hoạt cảnh khi mặc skin Định mệnh =================
  const CUTS = { 'skin:nang-tho': 'poem', 'skin:vi-mach': 'signal' };
  const CUT = { on: false, kind: '', item: null, t0: 0, parts: [], acc: 0 };
  const POEM = ['Thuyền về có nhớ bến chăng,', 'Bến thì một dạ khăng khăng đợi thuyền.'];
  function playCut(item) {
    const kind = item && CUTS[keyOf(item)];
    if (!kind) return false;
    Object.assign(CUT, { on: true, kind, item, t0: performance.now(), parts: [], acc: 0 });
    const el = $('cut');
    el.className = 'cut cut-' + kind;
    $('cut-name').textContent = item.name;
    el.hidden = false;
    SFX[kind]();
    buzz(20);
    return true;
  }
  function closeCut() {
    if (!CUT.on) return;
    CUT.on = false;
    $('cut').hidden = true;
    toast('Đã mặc ' + CUT.item.name + ' ✨');
  }
  // Vẽ một bé sâu đứng (đầu trên, thân vòng xuống) với nét mặt tuỳ ý.
  function drawWormAt(x, item, size, t, face) {
    const S = size / 90, r = 21 * S, sr = 16.5 * S;
    for (let k = 3; k >= 1; k--) {
      x.save();
      x.translate(Math.sin(t * 2 + k) * 2 * S + k * sr * 0.55, k * sr * 1.05);
      Skins.drawSegment(x, sr, item, k === 3 ? 2 : k % 2, S);
      x.restore();
    }
    Skins.drawHead(x, r, item, Object.assign({ t, ant: Math.sin(t * 2) * 2 * S, bob: 0, happy: 0, blink: 0, sad: 0, chew: 0, mouthOpen: 0 }, face || {}), S);
  }
  const easeOut = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
  const easeBack = (k) => { k = Math.min(1, Math.max(0, k)); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  function drawCut(now, dt) {
    if (!CUT.on) return;
    const t = (now - CUT.t0) / 1000;
    const c = $('cut-art');
    const [W, H] = sizeCanvas(c);
    const x = c.getContext('2d');
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (CUT.kind === 'poem') drawPoem(x, W, H, t, dt); else drawSignal(x, W, H, t, dt);
    $('cut-tap').classList.toggle('on', t > 3.4);
    if (t > 6.5) closeCut();
  }
  function cutParticles(x, dt, S) {
    for (let i = CUT.parts.length - 1; i >= 0; i--) {
      const p = CUT.parts[i];
      p.life -= dt;
      if (p.life <= 0) { CUT.parts.splice(i, 1); continue; }
      Skins.stepParticle(p, dt, S);
      p.x += p.vx * dt; p.y += p.vy * dt;
      Skins.drawParticle(x, p, S);
    }
    x.globalAlpha = 1;
  }
  // Nàng Thơ: trang sách mở ra, bé sâu ngồi trên sách, câu ca dao hiện dần từng chữ, hoa đào rơi.
  function drawPoem(x, W, H, t, dt) {
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FDF6EA'); g.addColorStop(1, '#F3E1C4');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    const cx = W / 2, by = H * 0.44;
    const bw = Math.min(W * 0.86, 380), bh = bw * 0.46;
    const k = easeBack(t / 0.7);
    x.save();
    x.translate(cx, by);
    x.scale(k, k);
    x.fillStyle = 'rgba(122,82,48,0.18)';
    x.beginPath(); x.ellipse(0, bh * 0.58, bw * 0.52, bh * 0.12, 0, 0, TAU); x.fill();
    for (const side of [-1, 1]) {
      const open = easeOut((t - 0.15) / 0.8);
      x.save();
      x.scale(side, 1);
      x.fillStyle = '#C9A46A';
      x.beginPath(); x.moveTo(0, -bh * 0.42); x.quadraticCurveTo(bw * 0.25, -bh * 0.56, bw * 0.51, -bh * 0.46); x.lineTo(bw * 0.51, bh * 0.52); x.quadraticCurveTo(bw * 0.25, bh * 0.42, 0, bh * 0.56); x.closePath(); x.fill();
      x.fillStyle = '#FFFBF2';
      x.beginPath(); x.moveTo(0, -bh * 0.38); x.quadraticCurveTo(bw * 0.25 * open, -bh * 0.52, bw * 0.48 * open, -bh * 0.42); x.lineTo(bw * 0.48 * open, bh * 0.46); x.quadraticCurveTo(bw * 0.25 * open, bh * 0.36, 0, bh * 0.5); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(90,74,110,0.22)';
      x.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const yy = -bh * 0.22 + i * bh * 0.12; x.beginPath(); x.moveTo(bw * 0.07, yy); x.lineTo(bw * 0.42 * open, yy - bh * 0.03); x.stroke(); }
      x.restore();
    }
    const sp = x.createLinearGradient(-bw * 0.06, 0, bw * 0.06, 0);
    sp.addColorStop(0, 'rgba(90,60,40,0)'); sp.addColorStop(0.5, 'rgba(90,60,40,0.25)'); sp.addColorStop(1, 'rgba(90,60,40,0)');
    x.fillStyle = sp;
    x.fillRect(-bw * 0.06, -bh * 0.4, bw * 0.12, bh * 0.94);
    x.restore();
    // bé sâu ngồi trên trang sách
    const wk = easeBack((t - 0.5) / 0.6);
    if (wk > 0) {
      x.save();
      x.translate(cx - 12, by - bh * 0.62 + Math.sin(t * 2) * 3 - (1 - wk) * 30);
      x.scale(wk, wk);
      drawWormAt(x, CUT.item, Math.min(150, W * 0.36), t, t > 3.6 ? { happy: 1 } : {});
      x.restore();
    }
    // câu ca dao hiện dần từng chữ
    // cỡ chữ vừa khít câu dài nhất trong 88% bề ngang
    let fs = Math.min(30, W / 14);
    x.font = '700 ' + fs + 'px "Dancing Script", "Fraunces", serif';
    const widest = Math.max(...POEM.map((l) => x.measureText(l).width));
    if (widest > W * 0.88) { fs *= (W * 0.88) / widest; x.font = '700 ' + fs + 'px "Dancing Script", "Fraunces", serif'; }
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = '#7A3B52';
    POEM.forEach((line, i) => {
      const t0 = 1.0 + i * 1.25;
      const n = Math.floor(Math.max(0, t - t0) * 26);
      if (n <= 0) return;
      x.fillText([...line].slice(0, n).join(''), cx, H * 0.69 + i * fs * 1.45);
    });
    if (t > 3.7) {
      x.globalAlpha = Math.min(1, (t - 3.7) * 2);
      x.font = 'italic 500 13px Fraunces, serif';
      x.fillStyle = '#9A7B6A';
      x.fillText('· ca dao ·', cx, H * 0.69 + fs * 2.9);
      x.globalAlpha = 1;
    }
    // hoa đào rơi, chữ bay lên từ trang sách
    CUT.acc += dt;
    while (CUT.acc > 0.12) {
      CUT.acc -= 0.12;
      const petal = Skins.eatBurst(Skins.get('fx', 'canh-sen'), 1, 1.4, [])[0];
      Object.assign(petal, { x: Math.random() * W, y: -10, vx: 10 + Math.random() * 20, vy: 30 + Math.random() * 30, life: 6, max: 6, rot: Math.random() * 6, vr: 1.5, color: Math.random() < 0.5 ? '#FFB7C9' : '#FFD3DE' });
      CUT.parts.push(petal);
      if (t > 0.8 && t < 4.5 && Math.random() < 0.6) {
        const l = Skins.eatBurst(Skins.byKey('fx:trang-tho'), 2, 1.5, [])[1];
        Object.assign(l, { x: cx + (Math.random() - 0.5) * bw * 0.7, y: by - bh * 0.1, life: 1.6, max: 1.6 + Math.random(), vy: -(40 + Math.random() * 40) });
        CUT.parts.push(l);
      }
    }
    cutParticles(x, dt, 1);
  }
  // Vi Mạch: màn máy hiện sóng, sóng uốn thành trái tim; vạch sóng đầy dần; dòng chữ báo đã kết nối.
  function drawSignal(x, W, H, t, dt) {
    x.fillStyle = '#071219';
    x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(95,255,224,0.06)';
    x.lineWidth = 1;
    for (let gx = (t * 12) % 24; gx < W; gx += 24) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
    for (let gy = 0; gy < H; gy += 24) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
    const pw = Math.min(W * 0.86, 380), ph = pw * 0.62, px = (W - pw) / 2, py = H * 0.4 - ph / 2;
    const k = easeBack(t / 0.6);
    x.save();
    x.translate(W / 2, H * 0.4);
    x.scale(k, k);
    x.translate(-W / 2, -H * 0.4);
    x.fillStyle = '#0B2A2A';
    x.strokeStyle = '#2FD4B4';
    x.lineWidth = 2;
    x.beginPath();
    const rr = 14;
    x.moveTo(px + rr, py); x.arcTo(px + pw, py, px + pw, py + ph, rr); x.arcTo(px + pw, py + ph, px, py + ph, rr); x.arcTo(px, py + ph, px, py, rr); x.arcTo(px, py, px + pw, py, rr); x.closePath();
    x.fill(); x.stroke();
    x.strokeStyle = 'rgba(95,255,224,0.12)';
    for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(px + (pw * i) / 6, py + 6); x.lineTo(px + (pw * i) / 6, py + ph - 6); x.stroke(); }
    for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(px + 6, py + (ph * i) / 4); x.lineTo(px + pw - 6, py + (ph * i) / 4); x.stroke(); }
    // vạch sóng
    for (let i = 0; i < 4; i++) {
      const on = t > 0.4 + i * 0.32;
      x.fillStyle = on ? '#5FFFE0' : 'rgba(95,255,224,0.18)';
      const bh = 6 + i * 5;
      x.fillRect(px + pw - 54 + i * 11, py + 30 - bh, 7, bh);
    }
    // sóng sin uốn dần thành trái tim
    const N = 120, cx = px + pw / 2, cy = py + ph * 0.54;
    const m = easeOut((t - 1.3) / 1.2);
    const amp = ph * 0.22 * Math.min(1, t / 0.8);
    const hs = ph * 0.026;
    x.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const sx = px + 14 + u * (pw - 28), sy = cy + Math.sin(u * TAU * 2.5 - t * 7) * amp * (0.6 + 0.4 * Math.sin(t * 3 + u * 6));
      const a = u * TAU;
      const hx = cx + hs * 16 * Math.pow(Math.sin(a), 3);
      const hy = cy - hs * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) - ph * 0.04;
      const X = sx + (hx - sx) * m, Y = sy + (hy - sy) * m;
      if (i) x.lineTo(X, Y); else x.moveTo(X, Y);
    }
    const col = m > 0.5 ? '#FF6FAE' : '#5FFFE0';
    x.strokeStyle = col;
    x.globalAlpha = 0.25;
    x.lineWidth = 9;
    x.stroke();
    x.globalAlpha = 1;
    x.lineWidth = 2.6;
    x.stroke();
    if (m >= 1) {
      x.fillStyle = 'rgba(255,111,174,' + (0.18 + 0.12 * Math.sin(t * 6)) + ')';
      x.fill();
    }
    x.restore();
    // bé sâu kỹ sư bên trên màn máy
    const wk = easeBack((t - 0.3) / 0.6);
    if (wk > 0) {
      x.save();
      x.translate(px + 30, py - 24 + Math.sin(t * 2) * 2);
      x.scale(wk * 0.8, wk * 0.8);
      drawWormAt(x, CUT.item, Math.min(130, W * 0.3), t, t > 3 ? { happy: 1 } : {});
      x.restore();
    }
    // dòng chữ
    const who = meWho();
    const lines = [
      { t0: 0.3, text: '> Đang dò tần số…', col: '#5FFFE0' },
      { t0: 1.5, text: '> Kết nối thành công', col: '#5FFFE0' },
      { t0: 2.5, text: who === 'quang' ? '> Tần số: Lệ Thủy ♥' : '> Tín hiệu từ: anh Quang ♥', col: '#FF8FC0' },
    ];
    const fs = Math.max(14, Math.min(18, W / 24));
    x.font = '600 ' + fs + 'px "Be Vietnam Pro", system-ui, sans-serif';
    x.textAlign = 'left';
    x.textBaseline = 'middle';
    lines.forEach((l, i) => {
      const n = Math.floor(Math.max(0, t - l.t0) * 22);
      if (n <= 0) return;
      const s2 = [...l.text].slice(0, n).join('');
      x.fillStyle = l.col;
      x.fillText(s2 + (n < l.text.length && Math.floor(t * 6) % 2 ? '▌' : ''), px + 4, py + ph + 34 + i * fs * 1.7);
    });
    CUT.acc += dt;
    while (CUT.acc > 0.1) {
      CUT.acc -= 0.1;
      for (const p of Skins.eatBurst(Skins.byKey('fx:song-tin-hieu'), 3, 1.4, []).slice(1)) {
        Object.assign(p, { x: Math.random() * W, y: H + 10, vy: -(50 + Math.random() * 60), life: 3, max: 3 + Math.random() });
        if (p.kind === 15) { p.life = p.max = 0.5; p.y = Math.random() * H; p.vx *= 0.3; p.vy *= 0.3; }
        CUT.parts.push(p);
      }
    }
    cutParticles(x, dt, 1);
  }

  // ================= Thông báo sự kiện mới =================
  // pending: sự kiện đang diễn ra mà máy này chưa xem thông báo (chờ hộp "Máy này của ai?" đóng rồi mới hiện).
  const SPL = { on: false, ev: null, pending: EV_LIST.find((e) => isLive(e) && !seenEv(e)) || null, parts: [], acc: 0 };
  function openSplash() {
    const ev = SPL.pending;
    if (!ev || SPL.on) return;
    SPL.on = true;
    SPL.ev = ev;
    SPL.pending = null;
    SPL.parts.length = 0;
    $('splash-title').textContent = ev.name;
    const names = ev.sets.map((s) => s.name).join(' và ');
    if (isBoxEv(ev)) {
      const who = meWho();
      const gift = who ? Skins.byKey(ev.gift[who]) : null;
      if (gift) grantGift(ev);
      SPL.gift = gift;
      $('splash-kicker').textContent = 'Độc quyền · Định mệnh';
      $('splash-text').textContent = !gift
        ? ev.tagline + ' Chọn máy này của ai để nhận quà nha.'
        : who === 'thuy'
          ? 'Anh tặng em ' + gift.name + ': bậc Định mệnh, độc quyền cho cô giáo Văn tương lai. Còn Sâu Vi Mạch của anh thì… em tự mở Hộp Định Mệnh mà tìm nha.'
          : 'Quà tặng anh: ' + gift.name + ', bậc Định mệnh, độc quyền cho kỹ sư Điện tử Viễn thông. Muốn có Sâu Nàng Thơ của em thì phải tự mở Hộp Định Mệnh.';
      $('splash-go').textContent = gift ? 'Nhận quà 🎁' : 'Chọn máy';
    } else {
      SPL.gift = null;
      $('splash-kicker').textContent = 'Sự kiện mới';
      $('splash-go').textContent = 'Đến vòng quay';
      $('splash-text').textContent = ev.tagline + ' Có ' + names + ': skin, cánh, hiệu ứng và nền riêng của ' + ev.short + ', chỉ có đến hết ' + dayText(ev.end - 1) + '.';
    }
    $('splash').querySelector('.splash-card').className = 'splash-card ev-' + ev.id;
    $('splash').hidden = false;
    SFX.reveal('suthi');
    markSeen(ev);
  }
  function closeSplash(go) {
    SPL.on = false;
    $('splash').hidden = true;
    if (go && isBoxEv(SPL.ev)) {
      // chưa biết máy của ai: chọn xong thì màn chào hiện lại để nhận quà
      if (!SPL.gift) { SPL.pending = SPL.ev; openWho(); return; }
      showGift(SPL.gift);
      return;
    }
    if (go) { switchTab('ev'); selectEvent(SPL.ev.id); scrollToPanel(); }
  }
  function drawSplash(t, dt) {
    const c = $('splash-art');
    const [w, h] = sizeCanvas(c);
    const x = c.getContext('2d');
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    x.clearRect(0, 0, w, h);
    const items = evItems(SPL.ev);
    let skin, wing, fx;
    if (isBoxEv(SPL.ev)) {
      // món của chính máy này: quà tặng cùng cánh và hiệu ứng trong bộ đó
      const mine = SPL.ev.sets.find((s2) => s2.who === (meWho() || 'thuy')).items.map(Skins.byKey);
      [skin, fx, wing] = mine;
    } else {
      skin = items.find((i) => i.slot === 'skin' && i.rarity === 'huyenthoai') || items[0];
      wing = items.find((i) => i.slot === 'wing' && i.rarity === 'suthi') || items.find((i) => i.slot === 'wing');
      fx = items.find((i) => i.slot === 'fx' && i.rarity === 'suthi') || items.find((i) => i.slot === 'fx') || Skins.get('fx', 'sao-vang');
    }
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
    const withCh = all.filter((i) => i.ch).sort((a, b) => a.ch - b.ch || RANK.indexOf(a.rarity) - RANK.indexOf(b.rarity));
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
      tag.textContent = UI.tab === 'wing' ? 'Cánh đang dùng' : UI.tab === 'bg' ? 'Nền đang dùng' : 'Đang mặc';
      tag.classList.remove('trying');
    }
  }
  function switchTab(tab) {
    if (tab === 'ev' && !EV) tab = 'box';
    UI.tab = tab;
    try { sessionStorage.setItem('lpn:shopTab', tab); } catch (e) { /* bỏ qua */ }
    document.querySelectorAll('.tabs button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.tab === tab));
      if (b.dataset.tab === tab && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    $('tab-ev').hidden = tab !== 'ev';
    $('tab-box').hidden = tab !== 'box';
    $('tab-items').hidden = !SLOT_NAME[tab];
    $('tab-memo').hidden = tab !== 'memo';
    if (tab === 'ev') markSeen(EV);
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
  $('btn-free').addEventListener('click', openFree);
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
    if (ctx === 'gift') return;
    if (ctx === 'set') { if (UI.setGift) wearSet(UI.setGift.set, UI.setGift.items); return; }
    if (ctx === 'wheel') spin(1);
    else { UI.qty = 1; openBox(); }
  });
  $('reveal-use').addEventListener('click', () => {
    const res = UI.reveal, ctx = UI.revealCtx;
    if (res) {
      Wallet.equip(res.item.slot, res.item.id);
      SFX.click();
      if (!playCut(res.item)) toast('Đã dùng ' + res.item.name);
    }
    closeReveal();
    if (res && ctx === 'single') switchTab(res.item.slot);
    renderAll();
  });
  $('cut').addEventListener('click', () => { if (performance.now() - CUT.t0 > 500) closeCut(); });
  $('pack-all').addEventListener('click', packAll);
  $('pack-done').addEventListener('click', closePack);
  $('pack-again').addEventListener('click', () => {
    const again = PK.opts.again && PK.opts.again();
    closePack();
    if (again && again.ok) again.run();
  });
  if (EV_LIST.length) {
    $('tab-btn-ev').hidden = false;
    $('ev-ping').hidden = !EV_LIST.some((e) => isLive(e) && !seenEv(e));
    $('spin-1').addEventListener('click', () => spin(1));
    $('spin-10').addEventListener('click', () => spin(10));
    $('wheel-hub').addEventListener('click', () => spin(1));
    $('evb-1').addEventListener('click', () => openEvBox(1));
    $('evb-10').addEventListener('click', () => openEvBox(10));
    $('evb-box').addEventListener('click', () => openEvBox(1));
    $('splash-go').addEventListener('click', () => { SFX.click(); closeSplash(true); });
    $('splash-later').addEventListener('click', () => closeSplash(false));
    setInterval(() => {
      // Sự kiện đang chờ vừa tới giờ mở (hoặc vừa hết): tải lại để mọi món hiện đúng.
      if (EV_LIST.some((e) => isLive(e) !== WAS_LIVE[e.id] && Date.now() < e.end + 60e3)) { location.reload(); return; }
      if (UI.tab === 'ev' && EV) document.querySelector('.ev-banner[data-ev="' + EV.id + '"] .ev-time').textContent = evTimeText();
    }, 30000);
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
    if (CUT.on) closeCut();
    else if (!$('reveal').hidden) closeReveal();
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
    if (isLive(EV) && (UI.tab === 'ev' || WS.spinning)) drawWheel(now, dt);
    if (SPL.on) drawSplash(t, dt);
    if (CUT.on) drawCut(now, dt);
    drawFx(dt);
    requestAnimationFrame(frame);
  }

  // ================= Khởi động =================
  const hashTab = location.hash.slice(1);
  const firstLook = !!SPL.pending;
  let startTab = 'box', lastEv = null;
  try { startTab = sessionStorage.getItem('lpn:shopTab') || 'box'; lastEv = sessionStorage.getItem('lpn:shopEv'); } catch (e) { /* bỏ qua */ }
  // Sự kiện mở sẵn: cái chưa xem, rồi cái đã chọn lần trước, rồi cái đang diễn ra mới nhất, cuối cùng là cái sắp mở.
  EV = SPL.pending || EV_LIST.find((e) => e.id === lastEv)
    || EV_LIST.filter(isLive).sort((a, b) => b.start - a.start)[0] || EV_LIST[0] || null;
  if (firstLook) startTab = 'ev';
  if (['ev', 'box', 'skin', 'fx', 'wing', 'bg', 'memo'].includes(hashTab)) startTab = hashTab;
  // Từ trang vụ án bấm "Mở quà": vào thẳng tab Hộp quà và mở luôn các hộp được tặng.
  const autoFree = params.get('free') === '1' && Wallet.get().freeBoxes > 0;
  if (autoFree) startTab = 'box';
  switchTab(startTab);
  renderAll();
  requestAnimationFrame(frame);
  setTimeout(showGrant, 500);
  for (const e of EV_LIST) {
    if (!isBoxEv(e) || !isLive(e) || !seenEv(e)) continue;
    const g = grantGift(e);
    if (g) setTimeout(() => { toast('🎁 Quà Định Mệnh: ' + g.name + ' đã vào tủ đồ'); renderAll(); }, 900);
  }
  let later = false;
  try { later = !!sessionStorage.getItem('lpn:whoLater'); } catch (e) { /* bỏ qua */ }
  if (autoFree) {
    try { history.replaceState(null, '', location.pathname + '#box'); } catch (e) { /* bỏ qua */ }
    setTimeout(openFree, 650);
  } else if (window.Sync && !window.Sync.who && !later) setTimeout(openWho, 700);
  else if (firstLook) setTimeout(openSplash, 600);
  else {
    // Vừa nhận bộ phần thưởng (vd. Bộ Thám Tử) thì báo một lần.
    const sets = Wallet.takeSetNotice ? Wallet.takeSetNotice() : [];
    if (sets.length) setTimeout(() => showSetGift(sets[0]), 900);
  }
})();
