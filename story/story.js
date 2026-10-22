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
    // ver 2: truyện thật thay cho chương mẫu, nên tiến độ đọc cũ (của chương mẫu) bỏ đi một lần.
    v = v && v.done && v.ver === 2 ? v : { done: {}, flags: {}, ver: 2 };
    v.open = v.open || {};
    return v;
  })();
  const persist = () => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ }
    if (window.Sync) window.Sync.dirty();
  };

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
  // Chương có releaseAt thì ẩn hẳn tới giờ đó; early cho máy của một người thấy sớm hơn (máy chọn ở Tiệm Sâu).
  const WHO = (() => { try { return localStorage.getItem('lpn:who'); } catch (e) { return null; } })();
  const released = (ch) => {
    if (!ch.releaseAt) return true;
    let at = Date.parse(ch.releaseAt);
    if (ch.early && ch.early[WHO]) at = Math.min(at, Date.parse(ch.early[WHO]));
    return Date.now() >= at;
  };
  // Tiến độ vụ án: số chặng đã qua (flags id1…idN) và đã phá án chưa (idDone).
  const caseProgress = (c) => {
    let n = 0;
    for (let k = 1; k <= c.steps; k++) if (save.flags[c.id + k]) n = k;
    return { n, done: !!save.flags[c.id + 'Done'] };
  };

  // ================= Bản đồ =================
  // TẠM THỜI mở hết chương để đọc thử. Nhớ đổi lại false trước khi đưa lên GitHub.
  const OPEN_ALL = false;
  const isOpen = (i) => OPEN_ALL || !CHAPTERS[i].cost || !!save.open[CHAPTERS[i].id];
  // Chương mở lần lượt: xong chương trước mới được dùng đốt cây mở chương sau.
  function status(i) {
    const ch = CHAPTERS[i];
    if (save.done[ch.id]) return { state: 'done', note: 'Đã xong' };
    if (OPEN_ALL) return { state: 'current', note: 'Đọc thử' };
    // anyOrder: chương đặc biệt (vd. chương hôm nay) đọc được không cần xong chương trước.
    const ready = i === 0 || ch.anyOrder || save.done[CHAPTERS[i - 1].id];
    if (!isOpen(i)) return { state: ready ? 'buy' : 'locked', note: 'Cần ' + ch.cost + ' đốt cây' };
    if (!ready) return { state: 'locked', note: 'Chờ chương trước' };
    // Chương có giờ mở: bấm vào lần đầu mới biết là đang đếm ngược.
    if (waitLeft(i) > 0 && save.peek && save.peek[ch.id]) return { state: 'current', note: 'Mở sau ' + clock(waitLeft(i)), wait: true };
    return { state: 'current', note: 'Đang chờ em' };
  }

  const chNo = (i) => CHAPTERS[i].no || i + 1;
  // Số giây còn lại tới giờ mở chương (openAt), 0 nếu đã mở.
  const waitLeft = (i) => {
    if (OPEN_ALL) return 0;
    const at = CHAPTERS[i] && CHAPTERS[i].openAt ? Date.parse(CHAPTERS[i].openAt) : 0;
    return at ? Math.max(0, Math.ceil((at - Date.now()) / 1000)) : 0;
  };
  const clock = (sec) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  };
  const openTime = (i) => new Date(CHAPTERS[i].openAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  let waitTimer = 0;
  function openWait(i) {
    save.peek = save.peek || {};
    save.peek[CHAPTERS[i].id] = true;
    persist();
    const tick = () => {
      const left = waitLeft(i);
      if (!left) { clearInterval(waitTimer); closeDialog(); renderMap(); return; }
      $('shop-text').textContent = 'Chương này mở lúc ' + openTime(i) + ' tối nay. Còn ' + clock(left) + ' nữa thôi, chờ anh chút nhé.';
    };
    dialog('Chờ chút…', '', 'Em đợi được', () => {
      clearInterval(waitTimer);
      closeDialog();
      renderMap();
      if (!$('play').hidden) history.back();
    }, true);
    tick();
    clearInterval(waitTimer);
    waitTimer = setInterval(tick, 1000);
  }

  // ================= Ví đốt cây =================
  const fmt = (n) => n.toLocaleString('vi-VN');
  function renderWallet() {
    const w = Wallet.get();
    $('w-dot').textContent = fmt(w.dot);
    $('w-points').textContent = fmt(w.points) + ' điểm';
  }

  // Một hộp thoại dùng chung: đổi điểm, mở chương, thiếu đốt.
  let dialogOk = null;
  function dialog(title, text, okLabel, onOk, noCancel) {
    $('shop-cancel').hidden = !!noCancel;
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

  // Điểm Sâu Tím tự đổi ra đốt cây sau mỗi ván, nên đây chỉ là chỗ xem cách kiếm.
  function openExchange() {
    const w = Wallet.get();
    dialog('Kiếm thêm đốt cây', 'Chơi Sâu Tím, cứ ' + rateText + '. Điểm tự đổi ra đốt sau mỗi ván'
      + (w.points ? ', đang dư ' + fmt(w.points) + ' điểm để dành ván sau.' : '.'), 'Chơi Sâu Tím', goPlay);
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
    const title = 'Mở chương ' + chNo(i) + '?';
    if (w.dot >= ch.cost) {
      dialog(title, 'Dùng ' + ch.cost + ' đốt cây để mở chương này. Em đang có ' + w.dot + ' đốt.',
        'Mở bằng ' + ch.cost + ' đốt', () => { if (Wallet.spend(ch.cost)) unlock(i); });
      return;
    }
    const short = ch.cost - w.dot;
    const packs = Math.ceil(short / Wallet.PACK_DOT);
    const morePts = packs * Wallet.PACK_POINTS - w.points;
    dialog('Chưa đủ đốt cây', 'Chương này cần ' + ch.cost + ' đốt, em có ' + w.dot + '. Chơi Sâu Tím thêm khoảng '
      + fmt(morePts) + ' điểm nữa là đủ nha (' + rateText + ').', 'Chơi Sâu Tím', goPlay);
  }

  // Đồng hồ đếm ngược trên bản đồ cho chương có giờ mở.
  let ticking = [];
  setInterval(() => {
    if ($('map').hidden || !ticking.length) return;
    for (const t of ticking) {
      if (!waitLeft(t.i)) { renderMap(); return; }
      const st = status(t.i);
      t.small.textContent = 'Chương ' + chNo(t.i) + ' · ' + st.note;
    }
  }, 1000);

  function renderMap() {
    setSky(liveSky, true);
    const path = $('path');
    path.querySelectorAll('.stop').forEach((n) => n.remove());
    path.style.height = CHAPTERS.length * SPACING + 'px';
    const done = CHAPTERS.filter((c) => save.done[c.id]).length;
    $('map-count').textContent = done + '/' + CHAPTERS.length + ' chương';
    renderWallet();
    ticking = [];

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
      small.textContent = 'Chương ' + chNo(i) + ' · ' + st.note;
      if (waitLeft(i) > 0) ticking.push({ i, small });
      const b = document.createElement('b');
      // Chưa mở thì giấu tên chương, mở rồi mới biết.
      b.textContent = isOpen(i) ? ch.title : 'Bí mật';
      label.append(small, b);
      stop.append(node, label);
      stop.setAttribute('aria-label', 'Chương ' + chNo(i) + ': ' + b.textContent + '. ' + st.note);
      if (st.state === 'buy') stop.addEventListener('click', () => openBuy(i));
      else if (st.state !== 'locked') stop.addEventListener('click', () => play(i));
      path.appendChild(stop);
    });
    drawTrail(done);
    renderCase();
  }

  // Thẻ hồ sơ vụ án trên bản đồ: hiện khi đã đọc xong chương mở vụ án.
  function renderCase() {
    const card = $('case-card');
    const ch = CHAPTERS.find((c) => c.case && save.done[c.id]);
    card.hidden = !ch;
    if (!ch) return;
    const c = ch.case, pr = caseProgress(c);
    card.href = c.page;
    card.classList.toggle('solved', pr.done);
    $('case-title').textContent = 'Vụ án ' + c.title;
    $('case-note').textContent = pr.done ? 'Đã phá án · Xem lại hồ sơ' : pr.n ? 'Đang điều tra · Chặng ' + Math.min(c.steps, pr.n + 1) + '/' + c.steps : 'Chưa điều tra · ' + c.steps + ' chặng';
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
  const P = { ch: -1, queue: [], typing: null, full: '', waiting: null, log: [], pos: -1, sky: '', cast: null,
    near: 1, heart: true, range: null, talkN: 0, talkK: 0, nearLock: false };
  const ALL_CAST = ['quang', 'thuy'];

  // Ai đang có mặt trong cảnh (chương mà Thủy chưa xuất hiện thì chỉ có bé tím).
  function setCast(list) {
    P.cast = list || ALL_CAST;
    const scene = $('scene');
    scene.classList.toggle('no-thuy', !P.cast.includes('thuy'));
    scene.classList.toggle('no-quang', !P.cast.includes('quang'));
  }

  // near: 0 = mỗi bé một mép màn hình, 1 = đứng sát nhau. Chương có "near": [đầu, cuối]
  // thì hai bé nhích lại gần theo từng câu thoại của Quang và Thủy.
  // Tim chỉ hiện khi đã sát nhau (near = 1) và chưa bị tắt bằng heart: false.
  function setNear(v, heart) {
    P.near = Math.max(0, Math.min(1, v));
    if (heart !== undefined) P.heart = heart;
    const scene = $('scene');
    scene.classList.toggle('apart', P.near < 1);
    scene.classList.toggle('no-heart', !(P.heart && P.near >= 1));
    placeBeans();
  }

  // Cảnh SVG bị cắt hai bên tuỳ màn hình, nên tính mép thấy được rồi đặt bé sát mép,
  // chân bé chạm đúng mặt đồi phía trước.
  function groundY(path, x) {
    const len = path.getTotalLength();
    let best = null;
    for (let i = 0; i <= 160; i++) {
      const p = path.getPointAtLength((len * i) / 160);
      if (p.y >= 340) continue;
      if (!best || Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
    }
    return best ? best.y : 282;
  }
  function placeBeans() {
    const a = document.querySelector('.pos-a');
    const b = document.querySelector('.pos-b');
    if (P.near >= 1) { a.style.transform = ''; b.style.transform = ''; return; }
    const svgEl = $('scene').querySelector('svg');
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const box = svgEl.getBoundingClientRect();
    const inv = ctm.inverse();
    const toSvg = (x) => { const pt = svgEl.createSVGPoint(); pt.x = x; pt.y = box.top; return pt.matrixTransform(inv).x; };
    const left = Math.max(0, toSvg(Math.max(box.left, 0))) + 10;
    const right = Math.min(390, toSvg(Math.min(box.right, window.innerWidth))) - 10;
    const hill = $('scene').querySelector('.near');
    // Bé tím rộng 26 (x 194–220), bé hồng rộng 24 (x 226–250), đáy đều ở y 290.
    // Đứng sát nhau là vị trí gốc (dịch 0); xa nhau thì nội suy dần ra hai mép.
    const k = 1 - P.near;
    const ax = (left - 194) * k, bx = (right - 250) * k;
    const ay = (groundY(hill, 207 + ax) + 8 - 290) * k;
    const by = (groundY(hill, 238 + bx) + 8 - 290) * k;
    a.style.transform = 'translate(' + ax + 'px,' + ay + 'px)';
    b.style.transform = 'translate(' + bx + 'px,' + by + 'px)';
  }

  // Tìm dòng mở khoá bài hát, kể cả nằm trong lựa chọn hay nhánh if.
  function findSong(lines) {
    for (const l of lines || []) {
      if (l.song) return l;
      const inner = findSong(l.then) || findSong(l.else) || (l.choice || []).reduce((f, o) => f || findSong(o.reply), null);
      if (inner) return inner;
    }
    return null;
  }

  const isTalk = (item) => item && !!item.text && (item.who === 'quang' || item.who === 'thuy');

  function play(i) {
    if (waitLeft(i) > 0) { openWait(i); return; }
    const ch = CHAPTERS[i];
    const song = findSong(ch.lines);
    if (song) Music.prepare(song);
    P.ch = i;
    P.queue = ch.lines.slice();
    P.waiting = null;
    P.log = [];
    P.pos = -1;
    P.sky = ch.scene || liveSky;
    setSky(P.sky, false);
    setCast(ch.cast);
    P.range = ch.near || (ch.apart ? [0, 0] : null);
    P.talkN = ch.lines.filter(isTalk).length;
    P.talkK = 0;
    P.nearLock = false;
    // Chương còn xa nhau thì mặc định chưa có tim.
    setNear(P.range ? P.range[0] : 1, ch.heart !== undefined ? ch.heart !== false : !P.range);
    $('play-title').textContent = 'Chương ' + chNo(i) + ' · ' + ch.title;
    $('map').hidden = true;
    $('play').hidden = false;
    $('end').hidden = true;
    placeBeans();
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
      // Dòng điều khiển: { "cast": [...] }, { "near": 1, "heart": true }…
      if (!item.text && !item.choice && (item.cast || item.near !== undefined || item.heart !== undefined)) {
        if (item.cast) setCast(item.cast);
        if (item.near !== undefined) P.nearLock = true;
        setNear(item.near !== undefined ? item.near : P.near, item.heart !== undefined ? item.heart !== false : undefined);
        continue;
      }
      if (item.choice) { ask(item.choice); return; }
      if (item.song) { Music.unlock(item); continue; }
      if (isTalk(item) && P.range && !P.nearLock) {
        P.talkK++;
        const [a, b] = P.range;
        setNear(a + (b - a) * Math.min(1, P.talkK / Math.max(1, P.talkN)));
      }
      // who "none": chỉ hiện chữ, không có nhãn người nói (tiếng động, tin nhắn…).
      P.log.push({ who: NAMES[item.who] || item.who === 'none' ? item.who : 'ke', text: String(item.text || ''), sky: P.sky,
        cast: P.cast, near: P.near, heart: P.heart, emote: item.emote || '', emoteWho: item.emoteWho || item.who });
      show(P.log.length - 1, true);
      return;
    }
    finish();
  }

  // Biểu cảm nhỏ trên đầu bé (💦, 💡, 🍜…), hiện trong lúc câu đó còn trên màn hình.
  function showEmote(emoji, who) {
    const a = $('emote-a'), b = $('emote-b');
    for (const el of [a, b]) { el.classList.remove('on'); el.textContent = ''; }
    if (!emoji) return;
    const el = who === 'thuy' ? b : a;
    el.textContent = emoji;
    void el.getBBox();
    el.classList.add('on');
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
    if (!typing) { setSky(item.sky, false); setCast(item.cast); setNear(item.near, item.heart); }
    showEmote(item.emote, item.emoteWho);
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
        // echo: false = nút làm theo hướng dẫn, không nhắc lại thành lời Thủy.
        // again: đáp án chưa đúng, nghe lời đáp xong thì chọn lại trong các lựa chọn còn lại.
        const retry = opt.again ? [{ choice: options.filter((o) => o !== opt) }] : [];
        P.queue.unshift(...(opt.echo === false ? [] : [{ who: 'thuy', text: opt.text }]), ...(opt.reply || []), ...retry);
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
    nb.dataset.case = '';
    if (ch.case && !caseProgress(ch.case).done) {
      $('end-title').textContent = 'Hồ sơ đã mở';
      $('end-text').textContent = 'Vụ án ' + ch.case.title + ' đang chờ thám tử Thủy. Có ' + ch.case.steps + ' chặng, không tính giờ, cứ từ từ suy luận nha.';
      nb.hidden = false;
      nb.textContent = caseProgress(ch.case).n ? 'Điều tra tiếp' : 'Bắt đầu điều tra';
      nb.dataset.case = ch.case.page;
      $('end').hidden = false;
      nb.focus({ preventScroll: true });
      return;
    }
    $('end-title').textContent = 'Hết chương';
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
    Music.stop();
    $('play').hidden = true;
    $('end').hidden = true;
    $('map').hidden = false;
    renderMap();
  }

  // ================= Bài hát mở khoá trong truyện =================
  // Dòng { "song": "cho-chut", "start": 40, "dur": 20 }: mở bài trong Sâu Tím và phát một đoạn.
  // Âm thanh tải sẵn lúc vào chương (lúc đó có cú chạm nên iOS cho phép phát).
  const Music = {
    ctx: null, buf: null, info: null, src: null, el: null, timer: 0, loading: null,
    prepare(item) {
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state !== 'running') this.ctx.resume();
      } catch (e) { this.ctx = null; }
      if (this.loading) return;
      this.loading = fetch('../game/beatmaps/index.json')
        .then((r) => r.json())
        .then((d) => {
          this.info = d.songs.find((s) => s.id === item.song);
          if (!this.info || !this.ctx) return;
          return fetch(this.info.src).then((r) => r.arrayBuffer())
            .then((ab) => new Promise((ok, bad) => this.ctx.decodeAudioData(ab, ok, bad)))
            .then((buf) => { this.buf = buf; });
        })
        .catch(() => {});
    },
    unlock(item) {
      let opened = {};
      try { opened = JSON.parse(localStorage.getItem('lpn:songs')) || {}; } catch (e) { /* bỏ qua */ }
      opened[item.song] = true;
      try { localStorage.setItem('lpn:songs', JSON.stringify(opened)); } catch (e) { /* bỏ qua */ }
      if (window.Sync) window.Sync.dirty();
      const start = item.start || 0, dur = item.dur || 20;
      const card = $('song-card');
      if (this.info) {
        $('song-cover').src = this.info.cover;
        $('song-title').textContent = this.info.title;
      }
      card.style.setProperty('--dur', dur + 's');
      card.hidden = false;
      card.classList.remove('on');
      void card.offsetWidth;
      card.classList.add('on');
      this.stop(true);
      if (this.ctx && this.buf) {
        const ctx = this.ctx, t = ctx.currentTime;
        if (ctx.state !== 'running') ctx.resume();
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(1, t + 1.2);
        g.gain.setValueAtTime(1, t + dur - 2.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        g.connect(ctx.destination);
        const s = ctx.createBufferSource();
        s.buffer = this.buf;
        s.connect(g);
        s.start(t, start, dur + 0.05);
        this.src = { s, g };
      } else if (this.info) {
        // Chưa giải mã kịp thì phát bằng thẻ audio (không có nhỏ dần trên iOS).
        const el = new Audio(this.info.src + '#t=' + start);
        el.play().catch(() => {});
        this.el = el;
      }
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.stop(); card.hidden = true; }, dur * 1000);
    },
    stop(keepCard) {
      clearTimeout(this.timer);
      if (this.src) {
        const { s, g } = this.src;
        try { g.gain.cancelScheduledValues(0); g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15); } catch (e) { /* bỏ qua */ }
        setTimeout(() => { try { s.stop(); } catch (e) { /* đã dừng */ } g.disconnect(); }, 600);
        this.src = null;
      }
      if (this.el) { this.el.pause(); this.el = null; }
      if (!keepCard) $('song-card').hidden = true;
    },
  };

  // Bản sao lưu khác máy (vd. mới đổi điện thoại): đang ở bản đồ thì tải lại để thấy tiến độ cũ.
  window.LPN_onSync = () => { if ($('play').hidden) location.reload(); };

  // ================= Sự kiện =================
  // Bấm "tiếp" liên tục trên điện thoại không bị hiểu là chạm đúp để phóng to.
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  $('talk').addEventListener('click', () => next());
  $('btn-next').addEventListener('click', (e) => { e.stopPropagation(); next(); });
  $('btn-prev').addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  $('btn-skip').addEventListener('click', () => { if (P.typing) finishTyping(); });
  $('btn-back').addEventListener('click', () => history.back());
  $('btn-end-map').addEventListener('click', () => history.back());
  $('btn-end-next').addEventListener('click', (e) => {
    if (e.currentTarget.dataset.case) { location.href = e.currentTarget.dataset.case; return; }
    const i = P.ch + 1;
    if (isOpen(i) && waitLeft(i) > 0) { $('end').hidden = true; openWait(i); return; }
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
  window.addEventListener('resize', () => {
    if (!$('map').hidden) drawTrail(CHAPTERS.filter((c) => save.done[c.id]).length);
    else placeBeans();
  });

  fetch('chapters.json')
    .then((r) => r.json())
    .then((d) => {
      CHAPTERS = (d.chapters || []).filter(released);
      renderMap();
      // Từ thông báo ở trang chủ: mở thẳng chương được nhắc tới (nếu đọc được).
      const want = new URLSearchParams(location.search).get('play');
      const wi = CHAPTERS.findIndex((c) => c.id === want);
      if (wi >= 0) {
        try { history.replaceState(null, '', location.pathname); } catch (e) { /* bỏ qua */ }
        const st = status(wi);
        if (st.state === 'current' || st.state === 'done') play(wi);
        else if (st.state === 'buy') openBuy(wi);
      }
      // Quà tặng một lần: báo cho em biết vừa có thêm đốt cây.
      const gift = Wallet.takeGiftNotice();
      if (gift) dialog('Quà của anh 🎁', 'Anh tặng em ' + fmt(gift) + ' đốt cây để mở cốt truyện nè. Đọc từ từ thôi nha.', 'Cảm ơn anh!', closeDialog, true);
    })
    .catch(() => { $('map-sub').textContent = 'Chưa tải được cốt truyện, em thử lại sau nha.'; });
})();
