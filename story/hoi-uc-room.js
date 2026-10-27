// Băng số 1: trước khi xem phải tìm đúng cuộn băng, qua ba căn phòng (phòng khách có TV, phòng ngủ, sân đình).
// Năm cuộn băng, một cuộn thật. Cuộn nào cũng xem theo đúng ba bước: chọn trong túi đồ → chạm đầu băng → bấm
// nút nguồn TV (cuộn đầu có hướng dẫn sáng từng bước, để tới cuộn thật thì đã quen tay).
// Chuỗi câu đố (đáp án lấy từ các chương đã viết):
//   đèn → Băng 01 (ảnh vỡ) → ghép tranh 3×3 → ngăn kéo: Băng 02 + đĩa xoay chữ → giải mật thư (dịch 3, "chuỗi 3")
//   → dưới gối: Băng 03 + nửa mẩu giấy → khoá biểu tượng vali theo thời gian (☔ 🌸 ☁️ 🏸): chìa khoá + nửa giấy
//   → cổng đình → dò sóng 85.0 → xếp câu "Tàn rồi, thì mình lại hẹn nhau một cuộc vui khác." → Băng 04 (trống)
//   → mật mã điện thoại 1005 (Locket 10/5) → sau khung ảnh: băng thật → đầu băng → nút nguồn.
// Tiến độ lưu trên máy (lpn:bang1). Chơi lại từ đầu: thêm ?moi=1 vào địa chỉ.
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = 'lpn:bang1';
  const TV = window.HoiUc;
  if (!TV) return;
  try { if (/[?&]moi=1\b/.test(location.search)) localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && v.v === 2 ? v : {}; } catch (e) { return {}; } };
  const S = Object.assign({ v: 2, room: 'r1', lamp: false, tut: false, items: {}, seen: {}, done: {}, inVcr: null }, load());
  // Thoát giữa lúc chiếu băng giả: băng về lại túi, không kẹt trong máy.
  if (S.inVcr && S.inVcr !== 'E') S.inVcr = null;
  let sel = null; // món đang cầm trên tay (chọn từ túi)
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ } };

  // ===== Đồ vật trong túi =====
  const TAPES = {
    A: { label: 'Băng 01', ch: 'CH 01', date: '05.2026', lines: ['Mưa gõ trên mái tôn.', 'Có một bức ảnh vỡ trên tường.', 'Ghép lại đi.'] },
    B: { label: 'Băng 02', ch: 'CH 02', date: '13.07.2026', lines: ['Mật thư:', 'QKLQ GXRL JRL', 'Lùi lại bằng chuỗi đầu tiên của tụi mình.'] },
    C: { label: 'Băng 03', ch: 'CH 03', date: '??.??.2026', lines: ['Vợt và quả cầu.', 'Mây chạm mặt đất.', 'Mưa trên mái tôn.', 'Mười lăm bông sen.', '…', 'Chiếc vali nhớ thứ tự thời gian.'] },
    D: { label: 'Băng số 1 · 100 ngày', ch: 'CH 06', date: '13.11.2026', lines: ['Băng số 1.', '…', 'Ơ. Băng trống.', 'Cuộn thật ở nơi mọi thứ bắt đầu.', 'Hỏi chiếc điện thoại: ngày em bấm đồng ý.'] },
    E: { label: 'Băng số 1 ♥', real: true },
  };
  const OTHER = { wheel: 'Đĩa xoay chữ', note1: 'Nửa mẩu giấy', note2: 'Nửa mẩu giấy', note: 'Mẩu giấy', key: 'Chìa khoá cổng' };
  const ICON = {
    tape: '<svg viewBox="0 0 40 24" aria-hidden="true"><rect class="tape-b" x="1" y="1" width="38" height="22" rx="3" /><rect class="tape-l" x="5" y="4" width="30" height="6" rx="1" /><circle class="tape-r" cx="13" cy="16" r="3.5" /><circle class="tape-r" cx="27" cy="16" r="3.5" /></svg>',
    key: '<svg viewBox="0 0 40 24" aria-hidden="true"><circle cx="11" cy="12" r="6" fill="none" stroke="#E9C77B" stroke-width="3" /><path d="M17 12h19M30 12v5M35 12v4" stroke="#E9C77B" stroke-width="3" fill="none" /></svg>',
    wheel: '<svg viewBox="0 0 40 24" aria-hidden="true"><circle cx="20" cy="12" r="10" fill="#E4D6BE" /><circle cx="20" cy="12" r="5" fill="#B5462F" /></svg>',
    note: '<svg viewBox="0 0 40 24" aria-hidden="true"><path d="M8 3l24-1 1 19-25 1z" fill="#F3E9D6" /><path d="M12 8h14M12 12h11M12 16h8" stroke="#6E5A44" stroke-width="1.5" /></svg>',
  };

  // ===== Lời nhắc ở dưới =====
  let sayTimer = 0;
  function say(text, ms) {
    const h = $('hint');
    h.textContent = text;
    h.classList.remove('out');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { h.textContent = step().hint; }, ms || 4000);
  }

  // ===== Bước hiện tại: chỗ cần tới, thứ cần chạm, câu gợi ý =====
  const tapeStep = (id, hint) => {
    if (S.inVcr === id) return { room: 'r1', t: '#power', hint: 'Bấm nút nguồn trên TV.' };
    if (sel === id) return { room: 'r1', t: '[data-obj="vcr"]', hint: 'Chạm vào đầu băng dưới TV.' };
    return { t: '#bag-btn', id, hint: hint || 'Mở túi đồ, chọn ' + TAPES[id].label + '.' };
  };
  function step() {
    const d = S.done, it = S.items;
    if (!S.lamp) return { room: 'r1', t: '[data-obj="lamp"]', hint: 'Tối quá… tìm cái đèn.' };
    if (!S.seen.A) return tapeStep('A', 'Mở túi đồ, chọn Băng 01.');
    if (!d.jig) return { room: 'r1', t: '[data-obj="frame"]', hint: 'Ghép lại bức ảnh vỡ.' };
    if (!it.B) return { room: 'r1', t: '[data-obj="drawer"]', hint: 'Ngăn kéo kệ TV vừa bật ra.' };
    if (!S.seen.B) return tapeStep('B');
    if (!d.cipher) return { t: '#bag-btn', id: 'wheel', hint: 'Dùng đĩa xoay chữ trong túi.' };
    if (!d.pillow) return { room: 'r2', t: '[data-obj="pillow"]', hint: 'Nhìn dưới gối.' };
    if (!S.seen.C) return tapeStep('C');
    if (!d.case) return { room: 'r2', t: '[data-obj="case"]', hint: 'Chiếc vali nhớ thứ tự thời gian.' };
    if (!d.gate) return { room: 'r3', t: '[data-obj="gate"]', hint: 'Chìa khoá này mở cổng nào?' };
    if (!d.radio) return { room: 'r3', t: '[data-obj="radio"]', hint: 'Đọc mẩu giấy ghép, rồi dò sóng.' };
    if (!d.words) return { room: 'r3', t: '[data-obj="radio"]', hint: 'Xếp lại câu radio vừa đọc.' };
    if (!it.D) return { room: 'r3', t: '[data-obj="bench"]', hint: 'Đèn lồng soi xuống bậc thềm.' };
    if (!S.seen.D) return tapeStep('D');
    if (!d.phone) return { room: 'r1', t: '[data-obj="phone"]', hint: 'Ngày em bấm đồng ý.' };
    if (!it.E) return { room: 'r1', t: '[data-obj="frame"]', hint: 'Sau tấm ảnh em vừa ghép.' };
    if (S.inVcr !== 'E') return tapeStep('E', 'Cuộn thật đây rồi. Cho vào máy.');
    return { room: 'r1', t: '#power', hint: 'Bấm nút nguồn.' };
  }

  // Cuộn đầu tiên: từng bước sáng lên luôn (học cách xem băng). Sau đó: đứng yên 40 giây mới sáng, 90 giây hiện gợi ý.
  let idle = 0;
  function guide() {
    for (const n of document.querySelectorAll('.glow')) n.classList.remove('glow');
    if (S.tut && idle < 40) return;
    const st = step();
    if (st.room && st.room !== S.room) { const door = document.querySelector('.view:not([hidden]) .door[data-go="' + st.room + '"]') || document.querySelector('.view:not([hidden]) .door'); if (door) door.classList.add('glow'); return; }
    const t = document.querySelector('#bag:not([hidden]) .bag-items button[data-id="' + (st.id || '') + '"]') || document.querySelector(st.t);
    if (t) t.classList.add('glow');
  }
  setInterval(() => {
    if (TV.busy() || !$('look').hidden || $('room').hidden) return;
    idle++;
    if (idle === 40) guide();
    if (idle === 90) say('Gợi ý: ' + step().hint, 9000);
  }, 1000);
  addEventListener('pointerdown', () => { idle = 0; });

  // ===== Vẽ lại theo tiến độ =====
  function render() {
    const room = $('room');
    room.classList.toggle('lit', !!S.lamp);
    for (const v of document.querySelectorAll('.view')) v.hidden = v.dataset.room !== S.room;
    $('bag-btn').hidden = !S.lamp;
    const q = (o) => document.querySelector('[data-obj="' + o + '"]');
    q('drawer').classList.toggle('open', !!S.done.jig);
    q('frame').classList.toggle('fixed', !!S.done.jig);
    q('frame').classList.toggle('open', !!S.done.phone);
    q('frame').classList.toggle('has-tape', !!S.done.phone && !S.items.E);
    q('pillow').classList.toggle('lifted', !!S.done.pillow);
    q('case').classList.toggle('open', !!S.done.case);
    q('gate').classList.toggle('open', !!S.done.gate);
    q('lantern').classList.toggle('lit', !!S.done.words);
    q('bench').innerHTML = S.done.words && !S.items.D ? '<span style="left:44%;top:-60%;width:12%;height:120%">' + ICON.tape + '</span>' : '<span></span>';
    $('vcr-label').textContent = S.inVcr ? TAPES[S.inVcr].label : '';
    $('vcr-led').classList.toggle('on', !!S.inVcr);
    TV.armReal(S.inVcr === 'E');
    renderBag();
    if (!TV.busy()) $('hint').textContent = step().hint;
    guide();
  }

  function bagList() {
    const list = [];
    for (const id of ['A', 'B', 'C', 'D', 'E']) if (S.items[id] && S.inVcr !== id) list.push({ id, label: TAPES[id].label, icon: ICON.tape, tape: true, fresh: !S.seen[id] && !TAPES[id].real });
    if (S.items.wheel) list.push({ id: 'wheel', label: OTHER.wheel, icon: ICON.wheel, fresh: S.seen.B && !S.done.cipher });
    if (S.items.note1 && S.items.note2) list.push({ id: 'note', label: OTHER.note, icon: ICON.note, fresh: !S.done.radio });
    else if (S.items.note1 || S.items.note2) list.push({ id: 'note1', label: OTHER.note1, icon: ICON.note });
    if (S.items.key && !S.done.gate) list.push({ id: 'key', label: OTHER.key, icon: ICON.key });
    return list;
  }
  function renderBag() {
    const list = bagList();
    $('bag-count').textContent = list.length || '';
    const box = $('bag-items');
    box.replaceChildren();
    if (!list.length) { const p = document.createElement('span'); p.className = 'bag-empty'; p.textContent = 'Túi trống.'; box.appendChild(p); }
    for (const it of list) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = it.id;
      b.innerHTML = it.icon + '<span></span>';
      b.querySelector('span').textContent = it.label;
      if (sel === it.id) b.classList.add('sel');
      if (it.fresh) b.classList.add('new');
      b.addEventListener('click', () => useItem(it));
      box.appendChild(b);
    }
    let held = document.querySelector('.held');
    if (sel && !held) { held = document.createElement('div'); held.className = 'held'; $('room').appendChild(held); }
    if (held) { if (sel) held.textContent = 'Đang cầm: ' + (TAPES[sel] ? TAPES[sel].label : OTHER[sel]); else held.remove(); }
  }
  $('bag-btn').addEventListener('click', () => { TV.sfx.click(); $('bag').hidden = !$('bag').hidden; renderBag(); guide(); });

  function useItem(it) {
    TV.sfx.click();
    if (it.tape) {
      sel = sel === it.id ? null : it.id;
      $('bag').hidden = true;
      render();
      if (sel) say(S.room === 'r1' ? 'Chạm vào đầu băng dưới TV.' : 'Đầu băng ở phòng khách.', 3500);
      return;
    }
    $('bag').hidden = true;
    if (it.id === 'wheel') return cipherTool();
    if (it.id === 'note') return look('Mẩu giấy', '<p class="hand">Hà Nội – Thái Nguyên:\ntám mươi, chín mươi cây số.\nSóng nằm ở giữa.</p>');
    if (it.id === 'note1') return look('Nửa mẩu giấy', '<p class="hand">Hà Nội – Thái Nguyên:\ntám mươi…</p><p class="say">Còn nửa kia ở đâu đó.</p>');
    if (it.id === 'key') return say('Chìa khoá to, cũ. Của một cái cổng.');
  }

  // ===== Đầu băng và nút nguồn =====
  function vcr() {
    if (TV.busy()) return;
    if (sel && TAPES[sel]) {
      if (S.inVcr) { S.items[S.inVcr] = true; }
      S.inVcr = sel;
      sel = null;
      TV.audioOn();
      TV.sfx.click();
      save();
      render();
      say(TAPES[S.inVcr].real ? 'Cạch. Bấm nút nguồn đi.' : 'Cạch. Giờ bấm nút nguồn trên TV.', 3500);
      return;
    }
    if (S.inVcr && S.inVcr !== 'E') { TV.sfx.click(); S.inVcr = null; save(); render(); say('Nhả băng ra.'); return; }
    say(S.inVcr === 'E' ? 'Băng thật đang trong máy. Bấm nút nguồn.' : 'Đầu băng trống. Chọn một cuộn trong túi trước.');
  }
  async function power() {
    if (!S.inVcr) { TV.sfx.click(); say('Máy chưa có băng.'); return; }
    const id = S.inVcr;
    $('bag').hidden = true;
    await TV.playFake(TAPES[id]);
    S.seen[id] = true;
    S.tut = true;
    S.inVcr = null; // chiếu xong thì nhả băng về túi
    save();
    render();
  }

  // ===== Nhìn gần =====
  function look(title, html, setup) {
    $('look-title').textContent = title;
    $('look-body').innerHTML = html;
    $('look').hidden = false;
    if (setup) setup($('look-body'));
  }
  function closeLook() { $('look').hidden = true; render(); }
  $('look-close').addEventListener('click', closeLook);
  $('look').addEventListener('click', (e) => { if (e.target === $('look')) closeLook(); });
  const msg = (body, text) => {
    let p = body.querySelector('.msg');
    if (!p) { p = document.createElement('p'); p.className = 'msg say'; body.appendChild(p); }
    p.textContent = text;
  };
  const wrong = (el) => { el.classList.remove('shake-x'); void el.offsetWidth; el.classList.add('shake-x'); };
  const win = (fn) => { TV.sfx.click(); save(); fn(); render(); };

  // Ghép tranh 3×3: chạm hai mảnh để đổi chỗ.
  const PHOTO = '../assets/img/Anh (2).jpg';
  let photoSq = null;
  function squarePhoto() {
    if (photoSq) return Promise.resolve(photoSq);
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = 600;
        const k = Math.min(im.width, im.height);
        c.getContext('2d').drawImage(im, (im.width - k) / 2, (im.height - k) / 2, k, k, 0, 0, 600, 600);
        try { photoSq = c.toDataURL('image/jpeg', 0.85); } catch (e) { photoSq = PHOTO; }
        res(photoSq);
      };
      im.onerror = () => res(PHOTO);
      im.src = PHOTO;
    });
  }
  function jigsaw() {
    look('Bức ảnh vỡ', '<p>Chạm hai mảnh để đổi chỗ.</p><div class="jig"></div>', async (body) => {
      const src = await squarePhoto();
      const grid = body.querySelector('.jig');
      const order = [7, 2, 5, 0, 8, 3, 1, 6, 4];
      let pick = -1;
      const draw = () => {
        grid.replaceChildren();
        order.forEach((p, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Mảnh ' + (i + 1));
          b.style.backgroundImage = 'url("' + src + '")';
          b.style.backgroundPosition = (p % 3) * 50 + '% ' + Math.floor(p / 3) * 50 + '%';
          if (i === pick) b.classList.add('pick');
          b.addEventListener('click', () => {
            TV.sfx.click();
            if (pick < 0) { pick = i; draw(); return; }
            [order[pick], order[i]] = [order[i], order[pick]];
            pick = -1;
            draw();
            if (order.every((v, k) => v === k)) {
              grid.classList.add('done');
              S.done.jig = true;
              win(() => msg(body, 'Liền rồi. Có tiếng “tách” dưới kệ TV.'));
              setTimeout(closeLook, 1800);
            }
          });
          grid.appendChild(b);
        });
      };
      draw();
    });
  }

  // Đĩa xoay chữ: xoay vòng trong, chữ trong mật thư lùi theo số bước.
  function cipherTool() {
    if (!S.seen.B) { look('Đĩa xoay chữ', '<p>Hai vòng chữ cái lồng nhau. Chưa có mật thư nào để giải.</p>'); return; }
    const CT = 'QKLQ GXRL JRL';
    let k = 0;
    look('Đĩa xoay chữ', '<div class="cipher"><div class="ct">' + CT + '</div><div class="pt"></div><div class="rings"><button type="button" aria-label="Xoay trái">◀</button><div class="disc"></div><button type="button" aria-label="Xoay phải">▶</button></div></div>', (body) => {
      const pt = body.querySelector('.pt'), disc = body.querySelector('.disc');
      const show = () => {
        disc.textContent = k;
        disc.style.transform = 'rotate(' + k * -13.85 + 'deg)';
        pt.textContent = CT.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 - k + 26) % 26) + 65));
        if (k === 3 && !S.done.cipher) { S.done.cipher = true; win(() => msg(body, 'Nhìn dưới gối.')); }
      };
      const [l, , r] = body.querySelector('.rings').children;
      l.addEventListener('click', () => { k = (k + 25) % 26; TV.sfx.click(); show(); });
      r.addEventListener('click', () => { k = (k + 1) % 26; TV.sfx.click(); show(); });
      show();
    });
  }

  // Khoá vali: bốn ô biểu tượng, chạm để đổi. Xếp bốn kỷ niệm theo thời gian.
  function symbolLock() {
    const SYM = ['☔', '🌸', '🎂', '☁️', '🧳', '🏸'];
    const ANS = ['☔', '🌸', '☁️', '🏸'];
    const cur = [0, 0, 0, 0];
    look('Chiếc vali', '<p>Khoá bốn ô hình. Chạm để đổi.</p><div class="symlock"></div><div class="lk-btns"><button type="button" class="primary">Thử mở</button></div>', (body) => {
      const row = body.querySelector('.symlock');
      cur.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = SYM[cur[i]];
        b.addEventListener('click', () => { cur[i] = (cur[i] + 1) % SYM.length; b.textContent = SYM[cur[i]]; TV.sfx.click(); });
        row.appendChild(b);
      });
      body.querySelector('.primary').addEventListener('click', () => {
        if (cur.every((v, i) => SYM[v] === ANS[i])) {
          S.done.case = true;
          S.items.key = true;
          S.items.note2 = true;
          win(() => { body.innerHTML = '<p>Tách. Nắp vali bật lên.</p><p>Một chiếc chìa khoá cũ, và nửa mẩu giấy.</p>'; });
          return;
        }
        wrong(row);
        msg(body, cur.some((v) => SYM[v] === '🎂' || SYM[v] === '🧳') ? 'Có một hình không thuộc về đây.' : 'Vẫn khoá.');
      });
    });
  }

  // Radio: dò sóng, vạch sóng càng cao càng gần. Bắt được sóng thì nghe đọc một câu, xếp lại câu ấy.
  function radio() {
    if (S.done.radio && !S.done.words) { words(); return; }
    if (S.done.words) { say('Radio đang phát nhạc rất khẽ.'); return; }
    let f = 92;
    look('Radio cũ', '<div class="radio-ui"><div class="freq"></div><div class="bars"><i></i><i></i><i></i><i></i><i></i></div><input type="range" min="80" max="100" step="0.5" aria-label="Dò sóng" /></div><p class="say">Rè rè…</p>', (body) => {
      const input = body.querySelector('input'), bars = body.querySelectorAll('.bars i');
      input.value = f;
      const show = () => {
        f = +input.value;
        body.querySelector('.freq').textContent = f.toFixed(1);
        const n = Math.max(0, 5 - Math.floor(Math.abs(f - 85) / 1.5));
        bars.forEach((b, i) => { b.style.height = 6 + i * 5 + 'px'; b.classList.toggle('on', i < n); });
        if (Math.random() < 0.5) TV.sfx.glitch();
        if (f === 85 && !S.done.radio) {
          S.done.radio = true;
          save();
          setTimeout(words, 900);
          msg(body, 'Bắt được sóng rồi…');
        }
      };
      input.addEventListener('input', show);
      show();
    });
  }
  function words() {
    const ANS = ['Tàn rồi,', 'thì mình', 'lại hẹn nhau', 'một cuộc vui', 'khác.'];
    const TILES = ['một cuộc vui', 'Tàn rồi,', 'nào rồi cũng tàn', 'khác.', 'lại hẹn nhau', 'thì mình'];
    let got = [];
    look('Radio đang đọc…', '<p class="say">Giọng đọc bị nhiễu, các chữ lộn xộn. Xếp lại.</p><div class="sentence"></div><div class="tiles"></div><div class="lk-btns"><button type="button" class="redo">Xếp lại từ đầu</button></div>', (body) => {
      const out = body.querySelector('.sentence'), box = body.querySelector('.tiles');
      const draw = () => {
        out.textContent = got.join(' ');
        box.replaceChildren();
        for (const t of TILES) {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = t;
          if (got.includes(t)) b.classList.add('used');
          b.addEventListener('click', () => {
            TV.sfx.click();
            got.push(t);
            if (ANS[got.length - 1] !== t) { draw(); wrong(out); setTimeout(() => { got = []; draw(); }, 500); return; }
            draw();
            if (got.length === ANS.length) {
              S.done.words = true;
              win(() => msg(body, 'Ngoài sân, chiếc đèn lồng sáng lên.'));
            }
          });
          box.appendChild(b);
        }
      };
      body.querySelector('.redo').addEventListener('click', () => { got = []; draw(); });
      draw();
    });
  }

  // Điện thoại: mật mã 4 số.
  function phone() {
    if (S.done.phone) { look('Điện thoại', '<p class="hand">Sau tấm ảnh em vừa ghép.</p>'); return; }
    let code = '';
    look('Điện thoại', '<div class="pin"><i></i><i></i><i></i><i></i></div><div class="keys"></div>', (body) => {
      const pin = body.querySelector('.pin'), keys = body.querySelector('.keys');
      const draw = () => pin.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i < code.length));
      for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = k;
        if (!k) { b.style.visibility = 'hidden'; }
        b.addEventListener('click', () => {
          TV.sfx.click();
          if (k === '⌫') { code = code.slice(0, -1); draw(); return; }
          code += k;
          draw();
          if (code.length < 4) return;
          if (code === '1005') {
            S.done.phone = true;
            win(() => { body.innerHTML = '<p>Mở khoá.</p><p class="hand">Sau tấm ảnh em vừa ghép.</p>'; });
            return;
          }
          wrong(pin);
          msg(body, code === '0608' ? 'Ngày anh tỏ tình. Còn sớm hơn nữa.' : 'Sai mật mã.');
          code = '';
          setTimeout(draw, 400);
        });
        keys.appendChild(b);
      }
    });
  }

  // ===== Đồ vật trong các phòng =====
  const OBJ = {
    lamp() {
      if (S.lamp) { say('Để đèn sáng thôi. Tối em sợ.'); return; }
      S.lamp = true;
      S.items.A = true;
      TV.audioOn();
      win(() => say('Sáng rồi. Trong túi có sẵn một cuộn băng.', 5000));
    },
    frame() {
      if (!S.seen.A) { say('Bức ảnh vỡ mất rồi.'); return; }
      if (!S.done.jig) { jigsaw(); return; }
      if (!S.done.phone) { say('Ảnh liền rồi. Nắng chiều đẹp.'); return; }
      if (!S.items.E) { S.items.E = true; win(() => look('Sau tấm ảnh', '<p>Một cuộn băng, nhãn vẽ trái tim nhỏ.</p><p class="say">Lần này là thật.</p>')); return; }
      say('Khoảng trống sau tấm ảnh.');
    },
    drawer() {
      if (!S.done.jig) { say('Ngăn kéo kẹt cứng.'); return; }
      if (!S.items.B) { S.items.B = true; S.items.wheel = true; win(() => look('Ngăn kéo', '<p>Một cuộn băng, và một chiếc đĩa có hai vòng chữ cái.</p>')); return; }
      say('Ngăn kéo trống.');
    },
    vcr,
    phone,
    shelf() { say('Toàn sách là sách.'); },
    cal() { say('Tháng 8. Một ngày khoanh đỏ.'); },
    vase() { say('Mười bốn bông sen. Hôm ấy là mười lăm.'); },
    laptop() { say('Căn phòng chưa bao giờ tắt đèn.'); },
    wardrobe() { say('Một nửa cái tủ trống trơn.'); },
    pillow() {
      if (!S.done.cipher) { say('Gối êm lắm. Chưa phải lúc.'); return; }
      if (!S.done.pillow) { S.done.pillow = true; S.items.C = true; S.items.note1 = true; win(() => look('Dưới gối', '<p>Một cuộn băng, và nửa mẩu giấy.</p><p class="say">Gối vẫn còn mùi tóc em.</p>')); return; }
      say('Gối vẫn còn mùi tóc em.');
    },
    case() { if (S.done.case) { say('Vali trống, nhẹ tênh.'); return; } symbolLock(); },
    gate() {
      if (!S.items.key) { say('Cổng đình khoá.'); return; }
      S.done.gate = true;
      win(() => say('Kẹt… cổng mở.', 3500));
    },
    radio,
    lantern() { say(S.done.words ? 'Đèn lồng soi xuống bậc thềm.' : 'Đèn lồng chưa thắp.'); },
    bench() {
      if (S.done.words && !S.items.D) { S.items.D = true; win(() => look('Bậc thềm', '<p>Trên bậc thềm cũ: “Băng số 1 · 100 ngày”.</p>')); return; }
      say('Bậc thềm cũ. Gió mát.');
    },
  };
  for (const b of document.querySelectorAll('#scene [data-obj]')) {
    b.addEventListener('click', () => {
      if (TV.busy()) return;
      if (!S.lamp && b.dataset.obj !== 'lamp') { say('Tối quá. Tìm cái đèn trước.'); return; }
      $('bag').hidden = true;
      OBJ[b.dataset.obj]();
    });
  }
  for (const d of document.querySelectorAll('#scene .door')) {
    d.addEventListener('click', () => {
      if (TV.busy()) return;
      TV.sfx.click();
      const to = d.dataset.go;
      const v = document.querySelector('.view[data-room="' + to + '"]');
      v.style.setProperty('--from', d.classList.contains('d-right') ? '24px' : '-24px');
      S.room = to;
      $('bag').hidden = true;
      save();
      render();
    });
  }

  document.querySelector('[data-obj="frame"] .frame-img').style.backgroundImage = 'url("' + PHOTO + '")';
  window.HoiUcRoom = { say, power };
  render();
})();
