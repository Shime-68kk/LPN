// Tiệm Sâu: dùng đốt cây mua skin, hiệu ứng ăn lá, cánh bướm; mở hộp quà may mắn; xem lại kỷ niệm.
'use strict';
(() => {
  const BOX_PRICE = 120;
  const DUP_REFUND = 50;
  const PITY_EPIC = 10;   // tối đa 10 hộp là có Sử thi trở lên
  const PITY_LEGEND = 40; // tối đa 40 hộp là có Huyền thoại
  const RARITY_ORDER = ['thuong', 'hiem', 'suthi', 'huyenthoai'];
  const SLOT_NAME = { skin: 'Skin', fx: 'Hiệu ứng', wing: 'Cánh bướm' };
  const HINT = {
    skin: 'Chạm để thử lên bé sâu. Skin chỉ để đẹp, không đổi cách chơi hay điểm.',
    fx: 'Hiện ra mỗi lần bé sâu đớp lá. Chạm để xem thử.',
    wing: 'Đôi cánh khi bé sâu hoá bướm cuối bài. Chạm để xem thử.',
  };
  const ITEMS = Skins.ITEMS;
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
    shake() { for (let i = 0; i < 6; i++) tone(180 + i * 25, 0.08, 0.06, i * 0.14, 'triangle'); },
    reveal(r) {
      const steps = { thuong: [523, 659, 784], hiem: [523, 659, 784, 988], suthi: [523, 659, 784, 988, 1175], huyenthoai: [523, 659, 784, 1047, 1319, 1568] }[r];
      steps.forEach((f, i) => tone(f, 0.4, 0.15, i * 0.08, 'triangle'));
      if (r === 'huyenthoai' || r === 'suthi') steps.forEach((f, i) => tone(f * 2, 0.5, 0.05, 0.3 + i * 0.06));
    },
    no() { tone(200, 0.18, 0.12, 0, 'triangle'); },
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
  const UI = { tab: 'box', trying: null, sheet: null, reveal: null, confirmBuy: 0 };
  const look = () => {
    const eq = Wallet.equipped();
    const pick = (slot) => (UI.trying && UI.trying.slot === slot ? UI.trying : Skins.get(slot, eq[slot]));
    return { skin: pick('skin'), fx: pick('fx'), wing: pick('wing') };
  };

  // ================= Sân khấu (canvas) =================
  const stage = $('stage');
  const sg = stage.getContext('2d');
  let SW = 0, SH = 0;
  function sizeCanvas(c) {
    const r = c.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * DPR)), h = Math.max(1, Math.round(r.height * DPR));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return [r.width, r.height];
  }
  const parts = [];
  function burst(ctx, fxItem, x, y, n, S, list) {
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

    // mặt đất và mây nhẹ
    x.fillStyle = NIGHT ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 3; i++) {
      const cx = ((t * 8 + i * 140) % (SW + 120)) - 60, cy = 30 + i * 26;
      x.beginPath(); x.arc(cx, cy, 12, 0, Math.PI * 2); x.arc(cx + 16, cy - 6, 15, 0, Math.PI * 2); x.arc(cx + 32, cy, 12, 0, Math.PI * 2); x.fill();
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
        burst(x, L.fx, hx, hy - r * 0.6, 8, S, parts);
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
    const list = sortItems(ITEMS.filter((i) => i.slot === slot), w);
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
      state.className = 'i-state' + (st.on ? ' on' : st.owned ? '' : ' price');
      state.textContent = st.on ? 'Đang dùng' : st.owned ? 'Đã có' : fmt(item.price) + ' đốt';
      foot.append(rar, state);
      b.append(c, name, foot);
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
    $('sheet-ch').textContent = (item.ch ? 'Kỷ niệm ở chương ' + item.ch + ' · ' : '') + SLOT_NAME[item.slot];
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
    const conf = Skins.get('fx', 'phao-giay');
    burst(sg, conf, SW / 2, SH * 0.4, 18, S, parts);
    if (item.slot === 'fx') burst(sg, item, SW / 2, SH * 0.4, 10, S, parts);
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
    else if (w.pityEpic + 1 >= PITY_EPIC && (rar === 'thuong' || rar === 'hiem')) rar = 'suthi';
    const inR = ITEMS.filter((i) => !i.free && i.rarity === rar);
    const fresh = inR.filter((i) => !Wallet.owns(i.slot, i.id, w));
    const pool = fresh.length ? fresh : inR;
    return { item: pool[Math.floor(Math.random() * pool.length)], dup: !fresh.length, rar };
  }
  function renderBox() {
    const w = Wallet.get();
    const btn = $('btn-open');
    btn.textContent = 'Mở hộp · ' + BOX_PRICE + ' đốt';
    btn.disabled = false;
    const need = $('box-need');
    if (w.dot < BOX_PRICE) {
      need.hidden = false;
      need.innerHTML = '';
      need.append('Còn thiếu ' + fmt(BOX_PRICE - w.dot) + ' đốt. ');
      const a = document.createElement('a');
      a.href = '../game/';
      a.textContent = 'Chơi Sâu Tím kiếm thêm';
      need.appendChild(a);
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
      const have = ITEMS.filter((i) => !i.free && i.rarity === r);
      const got = have.filter((i) => Wallet.owns(i.slot, i.id, w)).length;
      const b = document.createElement('b');
      b.textContent = Math.round((Skins.RARITY[r].weight / total) * 100) + '%';
      li.append(dot, Skins.RARITY[r].name + ' ' + got + '/' + have.length, b);
      odds.appendChild(li);
    }
  }
  let opening = false;
  function openBox() {
    if (opening) return;
    const w0 = Wallet.get();
    if (w0.dot < BOX_PRICE) { SFX.no(); toast('Chưa đủ đốt, chơi Sâu Tím thêm nha'); return; }
    // Chốt kết quả và trừ đốt trước khi chạy hiệu ứng, lỡ tắt app giữa chừng cũng không mất.
    let result = null;
    Wallet.update((v) => {
      if (v.dot < BOX_PRICE) return false;
      result = pickFromBox(v);
      v.dot -= BOX_PRICE;
      v.boxes += 1;
      const big = result.rar === 'suthi' || result.rar === 'huyenthoai';
      v.pityEpic = big ? 0 : v.pityEpic + 1;
      v.pityLegend = result.rar === 'huyenthoai' ? 0 : v.pityLegend + 1;
      if (result.dup) v.dot += DUP_REFUND;
      else v.owned[keyOf(result.item)] = Date.now();
    });
    if (!result) { SFX.no(); return; }
    opening = true;
    bumpDot();
    $('dot').textContent = fmt(Wallet.get().dot);
    const box = $('giftbox');
    box.classList.add('opening');
    SFX.shake();
    buzz(30);
    setTimeout(() => {
      box.classList.remove('opening');
      opening = false;
      showReveal(result);
      renderAll();
    }, 1250);
  }

  const revealParts = [];
  function showReveal(res) {
    const item = res.item;
    UI.reveal = res;
    const r = Skins.RARITY[item.rarity];
    $('reveal-card').style.setProperty('--r', r.color);
    rarityTag($('reveal-rarity'), item);
    $('reveal-name').textContent = item.name;
    $('reveal-memory').textContent = item.memory || '';
    $('reveal-dup').hidden = !res.dup;
    $('reveal-dup').textContent = 'Món này em có rồi · hoàn lại ' + DUP_REFUND + ' đốt';
    const w = Wallet.get();
    $('reveal-use').hidden = res.dup || w.equip[item.slot] === item.id;
    $('reveal-again').textContent = 'Mở tiếp · ' + BOX_PRICE + ' đốt';
    $('reveal-again').hidden = w.dot < BOX_PRICE;
    $('reveal').hidden = false;
    // lại hiện thẻ cho animation chạy lại
    const card = $('reveal-card');
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
    SFX.reveal(item.rarity);
    buzz(item.rarity === 'huyenthoai' ? [30, 40, 60] : 25);
    // pháo giấy
    const c = $('reveal-fx');
    const [fw, fh] = sizeCanvas(c);
    const S = Math.min(fw, fh) / 380;
    const n = { thuong: 24, hiem: 34, suthi: 50, huyenthoai: 80 }[item.rarity];
    const conf = Skins.get('fx', 'phao-giay');
    for (let i = 0; i < n; i++) {
      for (const p of Skins.eatBurst(i % 3 ? conf : Skins.get('fx', 'sao-vang'), 1, S * 1.6, [])) {
        p.x = fw / 2; p.y = fh * 0.42;
        const a = Math.random() * Math.PI * 2, sp = (180 + Math.random() * 380) * S;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 120 * S;
        p.life = 1.2 + Math.random() * 0.8; p.max = p.life; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 12;
        revealParts.push(p);
      }
    }
  }
  function closeReveal() {
    $('reveal').hidden = true;
    UI.reveal = null;
    revealParts.length = 0;
  }

  // ================= Kỷ niệm =================
  function renderMemo() {
    const w = Wallet.get();
    const list = $('memo');
    list.replaceChildren();
    const owned = ITEMS.filter((i) => Wallet.owns(i.slot, i.id, w)).length;
    $('memo-count').textContent = 'Đã sưu tập ' + owned + '/' + ITEMS.length + ' món';
    $('memo-bar').style.width = (owned / ITEMS.length) * 100 + '%';
    const withCh = ITEMS.filter((i) => i.ch).sort((a, b) => a.ch - b.ch || RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
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
    UI.tab = tab;
    try { sessionStorage.setItem('lpn:shopTab', tab); } catch (e) { /* bỏ qua */ }
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    $('tab-box').hidden = tab !== 'box';
    $('tab-items').hidden = !SLOT_NAME[tab];
    $('tab-memo').hidden = tab !== 'memo';
    parts.length = 0;
    eat.phase = 0;
    renderTab();
    updateStageTag();
  }
  function renderTab() {
    if (UI.tab === 'box') renderBox();
    else if (SLOT_NAME[UI.tab]) renderGrid(UI.tab);
    else renderMemo();
  }
  function renderAll() {
    const w = Wallet.get();
    $('dot').textContent = fmt(w.dot);
    const owned = ITEMS.filter((i) => Wallet.owns(i.slot, i.id, w)).length;
    $('owned-count').textContent = owned + '/' + ITEMS.length + ' món';
    renderTab();
    updateSheetAction();
    updateStageTag();
    renderSync();
  }

  // ================= Sự kiện =================
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { SFX.click(); switchTab(b.dataset.tab); }));
  $('btn-open').addEventListener('click', openBox);
  $('giftbox').addEventListener('click', openBox);
  $('sheet-close').addEventListener('click', closeSheet);
  $('sheet-backdrop').addEventListener('click', closeSheet);
  $('sheet-action').addEventListener('click', sheetAction);
  $('reveal-close').addEventListener('click', closeReveal);
  $('reveal-again').addEventListener('click', () => { closeReveal(); openBox(); });
  $('reveal-use').addEventListener('click', () => {
    const res = UI.reveal;
    if (res) { Wallet.equip(res.item.slot, res.item.id); toast('Đã dùng ' + res.item.name); }
    closeReveal();
    if (res) switchTab(res.item.slot);
    renderAll();
  });
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
    else if (!$('sheet').hidden) closeSheet();
    else if (!$('who').hidden) closeWho();
  });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  window.addEventListener('resize', () => { if (SLOT_NAME[UI.tab]) renderGrid(UI.tab); });

  // Bản sao lưu khác máy: vẽ lại theo dữ liệu mới, không cần tải lại trang.
  window.LPN_onSync = renderAll;
  if (window.Sync) window.Sync.on(renderSync);

  // ================= Vòng vẽ =================
  let last = performance.now();
  const sheetArt = $('sheet-art'), revealArt = $('reveal-art'), revealFx = $('reveal-fx');
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    drawStage(t, dt);
    if (UI.sheet && !$('sheet').hidden) drawThumb(sheetArt, UI.sheet, t);
    if (UI.reveal && !$('reveal').hidden) {
      drawThumb(revealArt, UI.reveal.item, t);
      const [fw, fh] = sizeCanvas(revealFx);
      const x = revealFx.getContext('2d');
      x.setTransform(DPR, 0, 0, DPR, 0, 0);
      x.clearRect(0, 0, fw, fh);
      const S = Math.min(fw, fh) / 380;
      stepParts(revealParts, dt, S * 0.5);
      for (const p of revealParts) Skins.drawParticle(x, p, S);
    }
    requestAnimationFrame(frame);
  }

  // ================= Khởi động =================
  const hashTab = location.hash.slice(1);
  let startTab = 'box';
  try { startTab = sessionStorage.getItem('lpn:shopTab') || 'box'; } catch (e) { /* bỏ qua */ }
  if (['box', 'skin', 'fx', 'wing', 'memo'].includes(hashTab)) startTab = hashTab;
  switchTab(startTab);
  renderAll();
  requestAnimationFrame(frame);
  let later = false;
  try { later = !!sessionStorage.getItem('lpn:whoLater'); } catch (e) { /* bỏ qua */ }
  if (window.Sync && !window.Sync.who && !later) setTimeout(openWho, 700);
})();
