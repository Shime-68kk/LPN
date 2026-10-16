// Cốt truyện: bản đồ chương mở theo số ngày bên nhau + cảnh hội thoại có lựa chọn.
'use strict';
(() => {
  const ANNIVERSARY = '2026-08-06T23:38:58';
  const NAMES = { quang: 'Quang', thuy: 'Thủy', ke: 'Lời kể' };
  const SAVE_KEY = 'lpn:story';
  const SPACING = 128;
  const CPS = 42; // số chữ hiện mỗi giây
  const SKY_COLOR = { nang: '#BFE4FF', may: '#D5DBE9', mua: '#8D9AB5', hoanghon: '#FFB996', dem: '#29224E' };
  const ICON = {
    done: 'M5 12.5l4.5 4.5L19 7.5',
    play: 'M8 5v14l11-7z',
    lock: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3',
  };

  const $ = (id) => document.getElementById(id);
  const daysTogether = () => Math.floor((Date.now() - new Date(ANNIVERSARY)) / 864e5) + 1;
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
    return v && v.done ? v : { done: {}, flags: {} };
  })();
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ } };

  // Trời thật do trang chủ lưu (Open-Meteo); không có thì đoán theo giờ.
  const liveSky = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('lpn:sky'));
      if (s && SKY_COLOR[s.sky] && Date.now() - s.at < 6 * 3600e3) return s.sky;
    } catch (e) { /* bỏ qua */ }
    const h = new Date().getHours();
    return h >= 18 || h < 6 ? 'dem' : h >= 17 ? 'hoanghon' : 'nang';
  })();
  function setSky(sky, page) {
    document.body.dataset.weather = sky;
    document.body.classList.toggle('night', sky === 'dem');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', page ? (sky === 'dem' ? '#1D1832' : '#FFF8EF') : SKY_COLOR[sky]);
  }

  let CHAPTERS = [];

  // ================= Bản đồ =================
  function status(i) {
    const ch = CHAPTERS[i];
    if (save.done[ch.id]) return { state: 'done', note: 'Đã xong' };
    const left = ch.unlockDay - daysTogether();
    if (left > 0) return { state: 'locked', note: 'Mở sau ' + left + ' ngày' };
    if (i > 0 && !save.done[CHAPTERS[i - 1].id]) return { state: 'locked', note: 'Chờ chương trước' };
    return { state: 'current', note: 'Đang chờ em' };
  }

  function renderMap() {
    setSky(liveSky, true);
    const path = $('path');
    path.querySelectorAll('.stop').forEach((n) => n.remove());
    path.style.height = CHAPTERS.length * SPACING + 'px';
    const done = CHAPTERS.filter((c) => save.done[c.id]).length;
    $('map-count').textContent = done + '/' + CHAPTERS.length + ' chương';
    $('map-sub').textContent = 'Hôm nay là ngày thứ ' + daysTogether() + ' bên nhau. Mỗi chương mở theo số ngày.';

    CHAPTERS.forEach((ch, i) => {
      const st = status(i);
      const stop = document.createElement('button');
      stop.type = 'button';
      stop.className = 'stop ' + st.state + (i % 2 ? ' right' : '');
      stop.style.top = i * SPACING + 'px';
      stop.disabled = st.state === 'locked';
      const node = document.createElement('span');
      node.className = 'node';
      node.appendChild(svg(st.state === 'done' ? ICON.done : st.state === 'current' ? ICON.play : ICON.lock));
      const label = document.createElement('span');
      label.className = 'label';
      const small = document.createElement('small');
      small.textContent = 'Chương ' + (i + 1) + ' · ' + st.note;
      const b = document.createElement('b');
      b.textContent = st.state === 'locked' && ch.unlockDay - daysTogether() > 0 && i === CHAPTERS.length - 1 ? 'Bí mật' : ch.title;
      label.append(small, b);
      stop.append(node, label);
      stop.setAttribute('aria-label', 'Chương ' + (i + 1) + ': ' + b.textContent + '. ' + st.note);
      if (st.state !== 'locked') stop.addEventListener('click', () => play(i));
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
  const P = { ch: -1, queue: [], typing: null, full: '', waiting: false };

  function play(i) {
    P.ch = i;
    P.queue = CHAPTERS[i].lines.slice();
    P.waiting = false;
    setSky(CHAPTERS[i].scene || liveSky, false);
    $('play-title').textContent = 'Chương ' + (i + 1) + ' · ' + CHAPTERS[i].title;
    $('map').hidden = true;
    $('play').hidden = false;
    $('end').hidden = true;
    if (!history.state || !history.state.play) history.pushState({ play: true }, '');
    next();
  }

  function next() {
    if (P.typing) { finishTyping(); return; }
    if (P.waiting) return;
    while (P.queue.length) {
      const item = P.queue.shift();
      if (item.ifWeather) { P.queue.unshift(...((liveSky === item.ifWeather ? item.then : item.else) || [])); continue; }
      if (item.if) { P.queue.unshift(...((save.flags[item.if] ? item.then : item.else) || [])); continue; }
      if (item.scene && !item.text) { setSky(item.scene, false); continue; }
      if (item.choice) { ask(item.choice); return; }
      say(item);
      return;
    }
    finish();
  }

  function say(item) {
    const who = NAMES[item.who] ? item.who : 'ke';
    const tag = $('who');
    tag.textContent = NAMES[who];
    tag.className = 'who ' + who;
    const line = $('line');
    line.className = 'line ' + (who === 'ke' ? 'ke' : '');
    $('choices').hidden = true;
    $('btn-next').hidden = false;
    const scene = $('scene');
    scene.classList.remove('speak-quang', 'speak-thuy');
    void scene.offsetWidth;
    if (who !== 'ke') scene.classList.add('speak-' + who);
    P.full = String(item.text || '');
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
    P.waiting = true;
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
        P.waiting = false;
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
    } else {
      const left = CHAPTERS[nextI].unlockDay - daysTogether();
      nb.hidden = left > 0;
      $('end-text').textContent = left > 0
        ? 'Chương sau sẽ mở sau ' + left + ' ngày nữa. Đợi anh nha.'
        : 'Chương tiếp theo: ' + CHAPTERS[nextI].title + '.';
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
  $('btn-skip').addEventListener('click', () => { if (P.typing) finishTyping(); });
  $('btn-back').addEventListener('click', () => history.back());
  $('btn-end-map').addEventListener('click', () => history.back());
  $('btn-end-next').addEventListener('click', () => play(P.ch + 1));
  window.addEventListener('popstate', () => { if (!$('play').hidden) toMap(); });
  window.addEventListener('keydown', (e) => {
    if ($('play').hidden || !$('end').hidden) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
  });
  window.addEventListener('resize', () => { if (!$('map').hidden) drawTrail(CHAPTERS.filter((c) => save.done[c.id]).length); });

  fetch('chapters.json')
    .then((r) => r.json())
    .then((d) => { CHAPTERS = d.chapters || []; renderMap(); })
    .catch(() => { $('map-sub').textContent = 'Chưa tải được cốt truyện, em thử lại sau nha.'; });
})();
