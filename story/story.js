// Cốt truyện: bản đồ chương mở bằng đốt cây (đổi từ điểm Sâu Tím) + cảnh hội thoại có lựa chọn.
'use strict';
(() => {
  const NAMES = { quang: 'Quang', thuy: 'Thủy', ke: 'Lời kể' };
  const SAVE_KEY = 'lpn:story';
  const SPACING = 128;
  const CPS = 42; // số chữ hiện mỗi giây
  const SKY_COLOR = { binhminh: '#FFE3D3', nang: '#BFE4FF', may: '#D5DBE9', mua: '#8D9AB5', hoanghon: '#FFB996', dem: '#29224E' };
  const ICON = {
    done: 'M5 12.5l4.5 4.5L19 7.5',
    play: 'M8 5v14l11-7z',
    lock: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3',
    stalk: 'M8 3h6v18H8zM8 9h6M8 15h6M14 12c1.5-3 4-4.5 7-4.5c-.5 3-3 5-7 4.5',
  };

  const $ = (id) => document.getElementById(id);
  const svg = (d) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
    return s;
  };
  const save = (() => {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { /* bỏ qua */ }
    v = v && v.done ? v : { done: {}, flags: {} };
    v.open = v.open || {};
    return v;
  })();
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ } };

  // Trời thật do trang chủ lưu (Open-Meteo); không có thì đoán theo giờ.
  const liveSky = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('lpn:sky'));
      if (s && SKY_COLOR[s.sky] && Date.now() - s.at < 6 * 3600e3) return s.sky;
    } catch (e) { /* bỏ qua */ }
    const h = new Date().getHours();
    return h >= 18 || h < 5 ? 'dem' : h < 7 ? 'binhminh' : h >= 17 ? 'hoanghon' : 'nang';
  })();
  function setSky(sky, page) {
    document.body.dataset.weather = sky;
    document.body.classList.toggle('night', sky === 'dem');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', page ? (sky === 'dem' ? '#1D1832' : '#FFF8EF') : SKY_COLOR[sky]);
  }

  let CHAPTERS = [];

  // ================= Bản đồ =================
  // TẠM THỜI mở hết chương để đọc thử. Nhớ đổi lại false trước khi đưa lên GitHub.
  const OPEN_ALL = true;
  const isOpen = (i) => OPEN_ALL || !CHAPTERS[i].cost || !!save.open[CHAPTERS[i].id];
  // Chương mở lần lượt: xong chương trước mới được dùng đốt cây mở chương sau.
  function status(i) {
    const ch = CHAPTERS[i];
    if (save.done[ch.id]) return { state: 'done', note: 'Đã xong' };
    if (OPEN_ALL) return { state: 'current', note: 'Đọc thử' };
    const ready = i === 0 || save.done[CHAPTERS[i - 1].id];
    if (!isOpen(i)) return { state: ready ? 'buy' : 'locked', note: 'Cần ' + ch.cost + ' đốt cây' };
    if (!ready) return { state: 'locked', note: 'Chờ chương trước' };
    return { state: 'current', note: 'Đang chờ em' };
  }

  // ================= Ví đốt cây =================
  const fmt = (n) => n.toLocaleString('vi-VN');
  function renderWallet() {
    const w = Wallet.get();
    $('w-dot').textContent = w.dot;
    $('w-points').textContent = fmt(w.points) + ' điểm';
  }

  // Một hộp thoại dùng chung: đổi điểm, mở chương, thiếu đốt.
  let dialogOk = null;
  function dialog(title, text, okLabel, onOk) {
    $('shop-title').textContent = title;
    $('shop-text').textContent = text;
    $('shop-ok').textContent = okLabel;
    dialogOk = onOk;
    $('shop').hidden = false;
    $('shop-ok').focus({ preventScroll: true });
  }
  const closeDialog = () => { $('shop').hidden = true; dialogOk = null; };
  const goPlay = () => { location.href = '../game/'; };
  const rateText = fmt(Wallet.PACK_POINTS * 10) + ' điểm = ' + Wallet.PACK_DOT * 10 + ' đốt cây';

  function openExchange() {
    const w = Wallet.get();
    const can = Wallet.canExchange(w);
    if (can) {
      dialog('Đổi điểm lấy đốt cây', rateText + '. Ví đang có ' + fmt(w.points) + ' điểm, đổi được ' + can + ' đốt cây.',
        'Đổi lấy ' + can + ' đốt', () => { Wallet.exchangeAll(); closeDialog(); renderMap(); });
    } else {
      const need = Wallet.PACK_POINTS - w.points;
      dialog('Chưa đủ điểm để đổi', rateText + '. Chơi Sâu Tím thêm ' + fmt(need) + ' điểm nữa là đổi được ' + Wallet.PACK_DOT + ' đốt.',
        'Chơi Sâu Tím', goPlay);
    }
  }

  function unlock(i) {
    save.open[CHAPTERS[i].id] = true;
    persist();
    closeDialog();
    renderMap();
    play(i);
  }

  function openBuy(i) {
    const ch = CHAPTERS[i];
    const w = Wallet.get();
    const title = 'Mở chương ' + (i + 1) + '?';
    if (w.dot >= ch.cost) {
      dialog(title, 'Dùng ' + ch.cost + ' đốt cây để mở chương này. Em đang có ' + w.dot + ' đốt.',
        'Mở bằng ' + ch.cost + ' đốt', () => { if (Wallet.spend(ch.cost)) unlock(i); });
      return;
    }
    const short = ch.cost - w.dot;
    const can = Wallet.canExchange(w);
    if (can >= short) {
      dialog(title, 'Em có ' + w.dot + ' đốt, còn thiếu ' + short + '. Ví có ' + fmt(w.points) + ' điểm, đổi ra được ' + can + ' đốt.',
        'Đổi điểm rồi mở', () => { Wallet.exchangeAll(); if (Wallet.spend(ch.cost)) unlock(i); });
      return;
    }
    const packs = Math.ceil(short / Wallet.PACK_DOT);
    const morePts = packs * Wallet.PACK_POINTS - w.points;
    dialog('Chưa đủ đốt cây', 'Chương này cần ' + ch.cost + ' đốt, em có ' + w.dot + '. Chơi Sâu Tím thêm khoảng '
      + fmt(morePts) + ' điểm nữa là đủ nha (' + rateText + ').', 'Chơi Sâu Tím', goPlay);
  }

  function renderMap() {
    setSky(liveSky, true);
    const path = $('path');
    path.querySelectorAll('.stop').forEach((n) => n.remove());
    path.style.height = CHAPTERS.length * SPACING + 'px';
    const done = CHAPTERS.filter((c) => save.done[c.id]).length;
    $('map-count').textContent = done + '/' + CHAPTERS.length + ' chương';
    renderWallet();

    CHAPTERS.forEach((ch, i) => {
      const st = status(i);
      const stop = document.createElement('button');
      stop.type = 'button';
      stop.className = 'stop ' + st.state + (i % 2 ? ' right' : '');
      stop.style.top = i * SPACING + 'px';
      stop.disabled = st.state === 'locked';
      const node = document.createElement('span');
      node.className = 'node';
      node.appendChild(svg(st.state === 'done' ? ICON.done : st.state === 'current' ? ICON.play : st.state === 'buy' ? ICON.stalk : ICON.lock));
      const label = document.createElement('span');
      label.className = 'label';
      const small = document.createElement('small');
      small.textContent = 'Chương ' + (i + 1) + ' · ' + st.note;
      const b = document.createElement('b');
      // Chưa mở thì giấu tên chương, mở rồi mới biết.
      b.textContent = isOpen(i) ? ch.title : 'Bí mật';
      label.append(small, b);
      stop.append(node, label);
      stop.setAttribute('aria-label', 'Chương ' + (i + 1) + ': ' + b.textContent + '. ' + st.note);
      if (st.state === 'buy') stop.addEventListener('click', () => openBuy(i));
      else if (st.state !== 'locked') stop.addEventListener('click', () => play(i));
      path.appendChild(stop);
    });
    drawTrail(done);
  }

  // Đường chấm nối các chương; đoạn đã đi tô đậm.
  function drawTrail(done) {
    const path = $('path');
    const box = path.getBoundingClientRect();
    const pts = [...path.querySelectorAll('.node')].map((n) => {
      const r = n.getBoundingClientRect();
      return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
    });
    const curve = (list) => list.reduce((d, p, i) => {
      if (!i) return 'M' + p[0] + ' ' + p[1];
      const q = list[i - 1];
      const my = (p[1] - q[1]) / 2;
      return d + ' C' + q[0] + ' ' + (q[1] + my) + ' ' + p[0] + ' ' + (p[1] - my) + ' ' + p[0] + ' ' + p[1];
    }, '');
    $('trail-all').setAttribute('d', curve(pts));
    $('trail-done').setAttribute('d', curve(pts.slice(0, Math.min(pts.length, done + 1))));
  }

  // ================= Chơi một chương =================
  // log: các câu đã hiện, để bấm "Trước" xem lại; pos: câu đang xem trong log.
  const P = { ch: -1, queue: [], typing: null, full: '', waiting: null, log: [], pos: -1, sky: '', cast: null };
  const ALL_CAST = ['quang', 'thuy'];

  // Ai đang có mặt trong cảnh (chương mà Thủy chưa xuất hiện thì chỉ có bé tím).
  function setCast(list) {
    P.cast = list || ALL_CAST;
    const scene = $('scene');
    scene.classList.toggle('no-thuy', !P.cast.includes('thuy'));
    scene.classList.toggle('no-quang', !P.cast.includes('quang'));
  }

  function play(i) {
    const ch = CHAPTERS[i];
    P.ch = i;
    P.queue = ch.lines.slice();
    P.waiting = null;
    P.log = [];
    P.pos = -1;
    P.sky = ch.scene || liveSky;
    setSky(P.sky, false);
    setCast(ch.cast);
    $('play-title').textContent = 'Chương ' + (i + 1) + ' · ' + ch.title;
    $('map').hidden = true;
    $('play').hidden = false;
    $('end').hidden = true;
    if (!history.state || !history.state.play) history.pushState({ play: true }, '');
    next();
  }

  function next() {
    if (P.typing) { finishTyping(); return; }
    // Đang xem lại thì đi tới câu kế trong log trước.
    if (P.pos < P.log.length - 1) { show(P.pos + 1); return; }
    if (P.waiting) return;
    while (P.queue.length) {
      const item = P.queue.shift();
      if (item.ifWeather) { P.queue.unshift(...((liveSky === item.ifWeather ? item.then : item.else) || [])); continue; }
      if (item.if) { P.queue.unshift(...((save.flags[item.if] ? item.then : item.else) || [])); continue; }
      if (item.scene && !item.text) { P.sky = item.scene; setSky(P.sky, false); continue; }
      if (item.cast && !item.text) { setCast(item.cast); continue; }
      if (item.choice) { ask(item.choice); return; }
      // who "none": chỉ hiện chữ, không có nhãn người nói (tiếng động, tin nhắn…).
      P.log.push({ who: NAMES[item.who] || item.who === 'none' ? item.who : 'ke', text: String(item.text || ''), sky: P.sky, cast: P.cast });
      show(P.log.length - 1, true);
      return;
    }
    finish();
  }

  function prev() {
    if (P.typing) finishTyping();
    if (P.pos > 0) show(P.pos - 1);
  }

  // Hiện một câu trong log; câu mới thì gõ từng chữ, câu xem lại thì hiện ngay.
  function show(idx, typing) {
    P.pos = idx;
    const item = P.log[idx];
    const last = idx === P.log.length - 1;
    if (!typing) { setSky(item.sky, false); setCast(item.cast); }
    $('btn-prev').hidden = idx === 0;
    $('step').textContent = last ? '' : 'Xem lại ' + (idx + 1) + '/' + P.log.length;
    const who = item.who;
    const tag = $('who');
    tag.textContent = NAMES[who] || '';
    tag.className = 'who ' + who;
    tag.hidden = who === 'none';
    const line = $('line');
    line.className = 'line ' + (who === 'ke' || who === 'none' ? who : '');
    const waitChoice = last && P.waiting;
    $('choices').hidden = !waitChoice;
    $('btn-next').hidden = !!waitChoice;
    const scene = $('scene');
    scene.classList.remove('speak-quang', 'speak-thuy');
    void scene.offsetWidth;
    if (NAMES[who] && who !== 'ke') scene.classList.add('speak-' + who);
    P.full = item.text;
    if (!typing) { line.textContent = P.full; return; }
    const chars = [...P.full];
    let shown = 0;
    const t0 = performance.now();
    line.textContent = '';
    const tick = (now) => {
      const n = Math.min(chars.length, Math.floor(((now - t0) / 1000) * CPS));
      if (n !== shown) { shown = n; line.textContent = chars.slice(0, n).join(''); }
      if (n < chars.length) P.typing = requestAnimationFrame(tick);
      else P.typing = null;
    };
    P.typing = requestAnimationFrame(tick);
  }

  function finishTyping() {
    cancelAnimationFrame(P.typing);
    P.typing = null;
    $('line').textContent = P.full;
  }

  function ask(options) {
    P.waiting = options;
    $('btn-next').hidden = true;
    const box = $('choices');
    box.replaceChildren();
    for (const opt of options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = opt.text;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (opt.flag) { save.flags[opt.flag] = true; persist(); }
        P.waiting = null;
        box.hidden = true;
        P.queue.unshift({ who: 'thuy', text: opt.text }, ...(opt.reply || []));
        next();
      });
      box.appendChild(b);
    }
    box.hidden = false;
    box.querySelector('button').focus({ preventScroll: true });
  }

  function finish() {
    const ch = CHAPTERS[P.ch];
    save.done[ch.id] = true;
    persist();
    const nextI = P.ch + 1;
    const nb = $('btn-end-next');
    if (nextI >= CHAPTERS.length) {
      $('end-text').textContent = 'Em đã đi hết hành trình hiện tại. Anh sẽ viết thêm chương mới nha.';
      nb.hidden = true;
    } else if (isOpen(nextI)) {
      nb.hidden = false;
      nb.textContent = 'Chương tiếp theo';
      $('end-text').textContent = 'Chương tiếp theo: ' + CHAPTERS[nextI].title + '.';
    } else {
      nb.hidden = false;
      nb.textContent = 'Mở bằng ' + CHAPTERS[nextI].cost + ' đốt cây';
      $('end-text').textContent = 'Chương sau cần ' + CHAPTERS[nextI].cost + ' đốt cây. Em đang có ' + Wallet.get().dot + ' đốt.';
    }
    $('end').hidden = false;
    (nb.hidden ? $('btn-end-map') : nb).focus({ preventScroll: true });
  }

  function toMap() {
    if (P.typing) finishTyping();
    $('play').hidden = true;
    $('end').hidden = true;
    $('map').hidden = false;
    renderMap();
  }

  // ================= Sự kiện =================
  $('talk').addEventListener('click', () => next());
  $('btn-next').addEventListener('click', (e) => { e.stopPropagation(); next(); });
  $('btn-prev').addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  $('btn-skip').addEventListener('click', () => { if (P.typing) finishTyping(); });
  $('btn-back').addEventListener('click', () => history.back());
  $('btn-end-map').addEventListener('click', () => history.back());
  $('btn-end-next').addEventListener('click', () => {
    const i = P.ch + 1;
    if (isOpen(i)) { play(i); return; }
    $('end').hidden = true;
    openBuy(i);
  });
  $('btn-exchange').addEventListener('click', openExchange);
  $('shop-ok').addEventListener('click', () => { if (dialogOk) dialogOk(); });
  $('shop-cancel').addEventListener('click', () => {
    closeDialog();
    if (!$('play').hidden) history.back();
  });
  window.addEventListener('popstate', () => { if (!$('play').hidden) toMap(); });
  window.addEventListener('keydown', (e) => {
    if ($('play').hidden || !$('end').hidden) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  });
  window.addEventListener('resize', () => { if (!$('map').hidden) drawTrail(CHAPTERS.filter((c) => save.done[c.id]).length); });

  fetch('chapters.json')
    .then((r) => r.json())
    .then((d) => { CHAPTERS = d.chapters || []; renderMap(); })
    .catch(() => { $('map-sub').textContent = 'Chưa tải được cốt truyện, em thử lại sau nha.'; });
})();
