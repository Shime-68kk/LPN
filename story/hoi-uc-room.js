// Băng số 1: trước khi xem phải tìm đúng cuộn băng, qua ba căn phòng (phòng khách có TV, phòng ngủ, sân đình).
// Năm cuộn băng, một cuộn thật. Cuộn nào cũng xem theo đúng ba bước: chọn trong túi đồ → chạm đầu băng → bấm
// nút nguồn TV (cuộn đầu có hướng dẫn sáng từng bước, để tới cuộn thật thì đã quen tay).
// Chuỗi câu đố: mọi con số đều tìm hoặc giải ra ngay trong game, không bắt nhớ mốc trong truyện.
//   đèn → Băng 01 (ảnh vỡ) → ghép tranh 3×3 → ngăn kéo: Băng 02 (mật thư) + đĩa xoay chữ
//   → "Từ điển tiếng em" trên giá sách: trang ghi A → D → xoay đĩa 3 nấc: NHIN DUOI GOI
//   → dưới gối: Băng 03 + nửa mẩu giấy → lật 4 tấm polaroid trên bảng ghim (số + hình) → khoá hình vali theo số
//   → chìa khoá + nửa giấy → cổng đình → ghép giấy "tám mươi, chín mươi… ở giữa" → dò sóng 85.0
//   → xếp câu "Tàn rồi, thì mình lại hẹn nhau một cuộc vui khác." → đèn lồng → Băng 04 (trống, chỉ sang con robot)
//   → máy tính phòng ngủ (mật khẩu máy anh Quang, chỉ lưu mã băm) → file sơ đồ chip → kéo 4 chip vào robot
//   → robot đọc mã 4719 → điện thoại → sau khung ảnh: băng thật + lá thư (radio ngoài sân to lên) → đầu băng → nút nguồn.
// Đồ tìm thấy không tự vào túi: chỗ có đồ sáng nhẹ, mở ra thấy đồ phát sáng, chạm từng món để cầm lên (bay vào túi).
// Chìa khoá cổng cũng phải cầm từ túi rồi chạm vào ổ khoá cổng đình. Đồ dùng xong tự biến khỏi túi; "Sổ ghi chép" giữ lại manh mối, cái nào giải xong có dấu ✓.
// Tiến độ lưu trên máy (lpn:bang1). Chơi lại từ đầu: thêm ?moi=1 vào địa chỉ. Xem thử: ?thu=vali, bang, maytinh, dinh, thu, bangthat.
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = 'lpn:bang1';
  const TV = window.HoiUc;
  if (!TV) return;
  const TRAILER = !!TV.trailer; // đoạn phim giới thiệu: không đọc / ghi tiến độ thật
  // Xem thử một đoạn không cần chơi tới: ?thu=vali (khoá vali), ?thu=bang (bảng ghim), ?thu=maytinh (máy tính đã đăng nhập),
  // ?thu=dinh (trước cổng đình, đã có chìa), ?thu=thu (vừa mở khoá điện thoại: lấy băng thật và lá thư sau tấm ảnh),
  // ?thu=bangthat (băng thật đã trong đầu băng: bấm nguồn 3 lần). Không lưu gì.
  const TRY = (location.search.match(/[?&]thu=(vali|bang|maytinh|dinh|thu|bangthat)\b/) || [])[1];
  const DRY = TRAILER || !!TRY;
  const ALL_DONE = { jig: true, book: true, cipher: true, pillow: true, board: true, case: true, gate: true, radio: true, words: true, pc: true, dir: true, robot: true, phone: true };
  const TRY_STATE = {
    maytinh: { room: 'r2', lamp: true, tut: true, items: { A: true, B: true, C: true, D: true, wheel: true, note1: true, note2: true, key: true }, seen: { A: true, B: true, C: true, D: true }, done: { jig: true, book: true, cipher: true, pillow: true, pc: true } },
    dinh: { room: 'r3', lamp: true, tut: true, items: { A: true, B: true, C: true, wheel: true, key: true, note1: true, note2: true }, seen: { A: true, B: true, C: true }, done: { jig: true, book: true, cipher: true, pillow: true, board: true, case: true } },
    thu: { room: 'r1', lamp: true, tut: true, items: { A: true, B: true, C: true, D: true, wheel: true, note1: true, note2: true, key: true }, seen: { A: true, B: true, C: true, D: true }, done: ALL_DONE },
    bangthat: { room: 'r1', lamp: true, tut: true, items: { A: true, B: true, C: true, D: true, E: true, letter: true, wheel: true, note1: true, note2: true, key: true }, seen: { A: true, B: true, C: true, D: true }, done: ALL_DONE, inVcr: 'E' },
  }[TRY] || { room: 'r2', lamp: true, tut: true, items: { A: true, B: true, C: true, wheel: true, note1: true }, seen: { A: true, B: true, C: true }, done: { jig: true, book: true, cipher: true, pillow: true } };
  try { if (/[?&]moi=1\b/.test(location.search)) localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
  const load = () => { if (TRY) return TRY_STATE; if (TRAILER) return {}; try { const v = JSON.parse(localStorage.getItem(KEY)); return v && v.v === 2 ? v : {}; } catch (e) { return {}; } };
  const S = Object.assign({ v: 2, room: 'r1', lamp: false, tut: false, items: {}, seen: {}, done: {}, inVcr: null }, load());
  // Thoát giữa lúc chiếu băng giả: băng về lại túi, không kẹt trong máy.
  if (S.inVcr && S.inVcr !== 'E') S.inVcr = null;
  let sel = null; // món đang cầm trên tay (chọn từ túi)
  const save = () => { if (DRY) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ } };

  // ===== Đồ vật trong túi =====
  const TAPES = {
    A: { label: 'Băng 01', ch: 'CH 01', date: '05.2026', lines: ['Mưa gõ trên mái tôn.', 'Có một bức ảnh vỡ trên tường.', 'Ghép lại đi.'] },
    B: { label: 'Băng 02', ch: 'CH 02', date: '07.2026', lines: ['Mật thư:', 'QKLQ GXRL JRL', 'Số nấc xoay nằm trong cuốn từ điển không hiệu sách nào bán.'] },
    C: { label: 'Băng 03', ch: 'CH 03', date: '10.2026', lines: ['Bốn tấm ảnh trên tường phòng ngủ.', 'Lật mặt sau.', '…', 'Khoá vali đọc theo số.'] },
    D: { label: 'Băng số 1', ch: 'CH 06', date: '--.--.2026', lines: ['Băng số 1.', '…', 'Ơ. Băng trống.', 'Cuộn thật ở chỗ chiếc điện thoại chỉ.', 'Mật mã điện thoại? Hỏi con robot trong phòng ngủ.'] },
    E: { label: 'Băng số 1 ♥', real: true },
  };
  const OTHER = { wheel: 'Đĩa xoay chữ', note1: 'Nửa mẩu giấy', note2: 'Nửa mẩu giấy', note: 'Mẩu giấy', key: 'Chìa khoá cổng', log: 'Sổ ghi chép', letter: 'Thư của anh' };
  const PC_HASH = 'c1b7476d'; // mật khẩu máy tính anh Quang (Thủy biết), chỉ giữ mã băm
  const fnv = (str) => { let h = 0x811c9dc5; for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); };
  const ICON = {
    tape: '<svg viewBox="0 0 40 24" aria-hidden="true"><rect class="tape-b" x="1" y="1" width="38" height="22" rx="3" /><rect class="tape-l" x="5" y="4" width="30" height="6" rx="1" /><circle class="tape-r" cx="13" cy="16" r="3.5" /><circle class="tape-r" cx="27" cy="16" r="3.5" /></svg>',
    key: '<svg viewBox="0 0 40 24" aria-hidden="true"><circle cx="11" cy="12" r="6" fill="none" stroke="#E9C77B" stroke-width="3" /><path d="M17 12h19M30 12v5M35 12v4" stroke="#E9C77B" stroke-width="3" fill="none" /></svg>',
    wheel: '<svg viewBox="0 0 40 24" aria-hidden="true"><circle cx="20" cy="12" r="10" fill="#E4D6BE" /><circle cx="20" cy="12" r="5" fill="#B5462F" /></svg>',
    note: '<svg viewBox="0 0 40 24" aria-hidden="true"><path d="M8 3l24-1 1 19-25 1z" fill="#F3E9D6" /><path d="M12 8h14M12 12h11M12 16h8" stroke="#6E5A44" stroke-width="1.5" /></svg>',
    log: '<svg viewBox="0 0 40 24" aria-hidden="true"><rect x="9" y="1" width="22" height="22" rx="2" fill="#8C3B3B" /><rect x="12" y="4" width="16" height="16" rx="1" fill="#F3E9D6" /><path d="M15 9h10M15 13h8" stroke="#6E5A44" stroke-width="1.5" /></svg>',
    letter: '<svg viewBox="0 0 40 24" aria-hidden="true"><rect x="6" y="3" width="28" height="18" rx="2" fill="#F3E9D6" stroke="#B9A07E" stroke-width=".8" /><path d="M6.5 4l13.5 10L33.5 4" fill="none" stroke="#B9A07E" stroke-width="1.2" /><path d="M20 11.6c-1.6-1.6-3.6-.2-2.6 1.4l2.6 2.6 2.6-2.6c1-1.6-1-3-2.6-1.4z" fill="#C0392B" /></svg>',
  };
  // Biểu tượng và tên của một món (băng hay đồ khác)
  const iconOf = (id) => (TAPES[id] ? ICON.tape : ICON[id === 'note1' || id === 'note2' ? 'note' : id]);
  const nameOf = (id) => (TAPES[id] ? TAPES[id].label : OTHER[id]);

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
    if (!it.A) return { room: 'r1', t: '[data-obj="lamp"]', hint: 'Dưới chân đèn có một cuộn băng. Chạm để cầm lên.' };
    if (!S.seen.A) return tapeStep('A', 'Mở túi đồ, chọn Băng 01.');
    if (!d.jig) return { room: 'r1', t: '[data-obj="frame"]', hint: 'Ghép lại bức ảnh vỡ.' };
    if (!it.B || !it.wheel) return { room: 'r1', t: '[data-obj="drawer"]', hint: 'Ngăn kéo kệ TV vừa bật ra.' };
    if (!S.seen.B) return tapeStep('B');
    if (!d.book) return { room: 'r1', t: '[data-obj="shelf"]', hint: 'Cuốn từ điển không hiệu sách nào bán.' };
    if (!d.cipher) return { t: '#bag-btn', id: 'wheel', hint: 'Dùng đĩa xoay chữ trong túi.' };
    if (!d.pillow) return { room: 'r2', t: '[data-obj="pillow"]', hint: 'Nhìn dưới gối.' };
    if (!it.C || !it.note1) return { room: 'r2', t: '[data-obj="pillow"]', hint: 'Dưới gối có đồ. Cầm lên.' };
    if (!S.seen.C) return tapeStep('C');
    if (!d.board) return { room: 'r2', t: '[data-obj="board"]', hint: 'Bốn tấm ảnh trên bảng ghim. Lật mặt sau.' };
    if (!d.case) return { room: 'r2', t: '[data-obj="case"]', hint: 'Khoá vali đọc theo số sau ảnh.' };
    if (!it.key || !it.note2) return { room: 'r2', t: '[data-obj="case"]', hint: 'Trong vali còn đồ. Cầm lên.' };
    // Cổng đình: lần đầu dùng đồ không phải băng, nên sáng từng bước ngay (cầm chìa trong túi → chạm ổ khoá)
    if (!d.gate) {
      if (sel === 'key') return { room: 'r3', t: '[data-obj="gate"]', hint: 'Tra chìa vào ổ khoá trên cổng đình.', now: true };
      if (S.room !== 'r3') return { room: 'r3', hint: 'Chìa khoá này mở cổng nào?' };
      return { t: '#bag-btn', id: 'key', hint: 'Cổng khoá. Mở túi đồ, cầm Chìa khoá cổng lên.', now: true };
    }
    if (!d.radio) return { room: 'r3', t: '[data-obj="radio"]', hint: 'Đọc mẩu giấy ghép, rồi dò sóng.' };
    if (!d.words) return { room: 'r3', t: '[data-obj="radio"]', hint: 'Xếp lại câu radio vừa đọc.' };
    if (!it.D) return { room: 'r3', t: '[data-obj="bench"]', hint: 'Đèn lồng soi xuống bậc thềm.' };
    if (!S.seen.D) return tapeStep('D');
    if (!d.pc) return { room: 'r2', t: '[data-obj="pc"]', hint: 'Máy tính của anh. Em biết mật khẩu mà.' };
    if (!d.dir) return { room: 'r2', t: '[data-obj="pc"]', hint: 'Thư mục Đồ án khoá. Lục trong máy xem.' };
    if (!d.robot) return { room: 'r2', t: '[data-obj="robot"]', hint: 'Con robot còn thiếu chip.' };
    if (!d.phone) return { room: 'r1', t: '[data-obj="phone"]', hint: 'Mật mã con robot vừa đọc.' };
    if (!it.E) return { room: 'r1', t: '[data-obj="frame"]', hint: 'Sau tấm ảnh em vừa ghép.' };
    if (!it.letter && S.inVcr !== 'E') return { room: 'r1', t: '[data-obj="frame"]', hint: 'Sau tấm ảnh còn kẹp một lá thư.' };
    if (S.inVcr !== 'E') return tapeStep('E', 'Cuộn thật đây rồi. Cho vào máy.');
    return { room: 'r1', t: '#power', hint: 'Bấm nút nguồn.' };
  }

  // Cuộn đầu tiên: từng bước sáng lên luôn (học cách xem băng). Sau đó: đứng yên 40 giây mới sáng, 90 giây hiện gợi ý.
  let idle = 0;
  function guide() {
    for (const n of document.querySelectorAll('.glow')) n.classList.remove('glow');
    if (TRAILER) return;
    const st = step();
    if (S.tut && idle < 40 && !st.now) return;
    if (st.room && st.room !== S.room) { const door = document.querySelector('.view:not([hidden]) .door[data-go="' + st.room + '"]') || document.querySelector('.view:not([hidden]) .door'); if (door) door.classList.add('glow'); return; }
    const t = document.querySelector('#bag:not([hidden]) .bag-items button[data-id="' + (st.id || '') + '"]') || document.querySelector(st.t);
    if (t) t.classList.add('glow');
  }
  setInterval(() => {
    if (TRAILER || TV.busy() || !$('look').hidden || $('room').hidden) return;
    idle++;
    if (idle === 40) guide();
    if (idle === 90) say('Gợi ý: ' + step().hint, 9000);
  }, 1000);
  addEventListener('pointerdown', () => { idle = 0; });

  // ===== Vẽ lại theo tiến độ =====
  function render() {
    const room = $('room');
    room.classList.toggle('lit', !!S.lamp);
    room.classList.toggle('warm', !!S.items.E); // tìm thấy cuộn băng thật: căn nhà ấm lên
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
    q('radio').classList.toggle('on', !!S.done.words);
    const v3 = document.querySelector('.v3');
    v3.classList.toggle('gate-open', !!S.done.gate);
    v3.classList.toggle('lit2', !!S.done.words);
    v3.classList.toggle('warm', !!S.items.E);
    q('pc').classList.toggle('on', !!S.done.pc);
    q('robot').classList.toggle('alive', !!S.done.robot);
    document.querySelector('.v2').classList.toggle('robot-done', !!S.done.robot);
    // Chỗ còn đồ chưa cầm lên thì sáng nhẹ, như gợi ý: có gì đó ở đây
    const wait = { lamp: S.lamp && !S.items.A, drawer: S.done.jig && !(S.items.B && S.items.wheel), pillow: S.done.pillow && !(S.items.C && S.items.note1), case: S.done.case && !(S.items.key && S.items.note2), bench: S.done.words && !S.items.D, frame: S.done.phone && !(S.items.E && S.items.letter) };
    for (const o in wait) q(o).classList.toggle('waiting', !TRAILER && !!wait[o]);
    q('bench').innerHTML = S.done.words && !S.items.D ? '<span style="left:44%;top:-60%;width:12%;height:120%">' + ICON.tape + '</span>' : '<span></span>';
    $('vcr-label').textContent = S.inVcr ? TAPES[S.inVcr].label : '';
    $('vcr-led').classList.toggle('on', !!S.inVcr);
    TV.armReal(S.inVcr === 'E');
    // Âm thanh nền theo phòng; tìm thấy cuộn băng thật thì căn nhà ấm lại (radio ngoài sân bật từ lúc xếp xong câu)
    TV.amb.set(S.room, S.items.E ? 'warm' : 'lonely', !!S.done.words);
    renderBag();
    if (!TV.busy()) $('hint').textContent = step().hint;
    guide();
  }

  // Đồ đã dùng xong thì biến khỏi túi (băng giả đã xem, đĩa đã giải, giấy đã dò sóng, chìa đã mở cổng): túi gọn, đỡ bấm nhầm.
  function bagList() {
    const list = [];
    for (const id of ['A', 'B', 'C', 'D', 'E']) if (S.items[id] && S.inVcr !== id && !S.seen[id]) list.push({ id, label: TAPES[id].label, icon: ICON.tape, tape: true, fresh: !TAPES[id].real });
    if (S.items.wheel && !S.done.cipher) list.push({ id: 'wheel', label: OTHER.wheel, icon: ICON.wheel, fresh: S.done.book });
    if (!S.done.radio) {
      if (S.items.note1 && S.items.note2) list.push({ id: 'note', label: OTHER.note, icon: ICON.note, fresh: true });
      else if (S.items.note1 || S.items.note2) list.push({ id: 'note1', label: OTHER.note1, icon: ICON.note });
    }
    if (S.items.key && !S.done.gate) list.push({ id: 'key', label: OTHER.key, icon: ICON.key, fresh: true });
    if (S.items.letter) list.push({ id: 'letter', label: OTHER.letter, icon: ICON.letter });
    if (S.seen.A) list.push({ id: 'log', label: OTHER.log, icon: ICON.log });
    return list;
  }
  function renderBag() {
    const list = bagList();
    if (list.length > (renderBag.n || 0)) { const b = $('bag-btn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    renderBag.n = list.length;
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
    if (held) { if (sel) held.textContent = 'Đang cầm: ' + nameOf(sel); else held.remove(); }
  }
  $('bag-btn').addEventListener('click', () => { $('bag').hidden = !$('bag').hidden; TV.sfx.bag(!$('bag').hidden); renderBag(); guide(); });

  function useItem(it) {
    TV.sfx.ui();
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
    if (it.id === 'key') {
      sel = sel === 'key' ? null : 'key';
      render();
      if (sel) say(S.room === 'r3' ? 'Chạm chìa vào ổ khoá trên cổng đình.' : 'Chìa khoá to, cũ. Của một cái cổng ngoài sân.', 4000);
      return;
    }
    if (it.id === 'letter') return letter();
    if (it.id === 'log') return journal();
  }

  // ===== Đầu băng và nút nguồn =====
  function vcr() {
    if (TV.busy()) return;
    if (sel && TAPES[sel]) {
      if (S.inVcr) { S.items[S.inVcr] = true; }
      S.inVcr = sel;
      sel = null;
      TV.audioOn();
      TV.sfx.tapeIn();
      save();
      render();
      say(TAPES[S.inVcr].real ? 'Cạch. Bấm nút nguồn đi.' : 'Cạch. Giờ bấm nút nguồn trên TV.', 3500);
      return;
    }
    if (S.inVcr && S.inVcr !== 'E') { TV.sfx.tapeOut(); S.inVcr = null; save(); render(); say('Nhả băng ra.'); return; }
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
  let onClose = null; // việc cần làm khi đóng khung nhìn gần (vd. radio nhỏ lại sau khi đọc thư)
  function look(title, html, setup) {
    if (onClose) { const f = onClose; onClose = null; f(); }
    $('look-title').textContent = title;
    $('look-body').innerHTML = html;
    $('look').hidden = false;
    if (setup) setup($('look-body'));
  }
  function closeLook() {
    $('look').hidden = true;
    render();
    if (onClose) { const f = onClose; onClose = null; f(); }
  }
  $('look-close').addEventListener('click', closeLook);
  $('look').addEventListener('click', (e) => { if (e.target === $('look')) closeLook(); });
  const msg = (body, text) => {
    let p = body.querySelector('.msg');
    if (!p) { p = document.createElement('p'); p.className = 'msg say'; body.appendChild(p); }
    p.textContent = text;
  };
  const wrong = (el) => { el.classList.remove('shake-x'); void el.offsetWidth; el.classList.add('shake-x'); };
  // Giải được / tìm thấy đồ: lưu, hiện kết quả. Tiếng theo đồ vật (mặc định hai nốt chuông "tìm thấy").
  const win = (fn, snd) => { TV.sfx[snd || 'find'](); save(); fn(); render(); };

  // Tìm thấy đồ: đồ nằm đó phát sáng nhẹ, chạm từng món để cầm lên; món đó bay xuống túi đồ.
  // Đóng giữa chừng thì món chưa cầm vẫn nằm lại chỗ cũ (chỗ đó sáng nhẹ), chạm lại để lấy tiếp.
  function fly(from) {
    const a = from.getBoundingClientRect(), b = $('bag-btn').getBoundingClientRect();
    const g = from.cloneNode(true);
    g.className = 'fly';
    g.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px';
    document.body.appendChild(g);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const an = g.animate([
      { transform: 'none', opacity: 1 },
      { transform: 'translate(' + dx * 0.35 + 'px,' + (dy * 0.35 - 40) + 'px) scale(.8)', opacity: 1, offset: 0.4 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.25)', opacity: 0.2 },
    ], { duration: 650, easing: 'cubic-bezier(.5, 0, .7, 1)' });
    an.onfinish = () => { g.remove(); const bb = $('bag-btn'); bb.classList.remove('bump'); void bb.offsetWidth; bb.classList.add('bump'); };
  }
  function pickup(title, text, ids, snd, after) {
    look(title, '<p class="find-txt"></p><div class="finds"></div><p class="say find-tip">Chạm để cầm lên.</p>', (body) => {
      body.querySelector('.find-txt').textContent = text;
      const box = body.querySelector('.finds');
      for (const id of ids) {
        if (S.items[id]) continue;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'find' + (TAPES[id] ? ' is-tape' : '') + (TAPES[id] && TAPES[id].real ? ' is-real' : '');
        b.innerHTML = '<span class="find-ic">' + iconOf(id) + '</span><span class="find-l"></span>';
        b.querySelector('.find-l').textContent = nameOf(id);
        b.addEventListener('click', () => {
          if (S.items[id]) return;
          S.items[id] = true;
          TV.sfx[snd || 'find']();
          fly(b.querySelector('.find-ic'));
          b.classList.add('taken');
          save();
          render();
          if ([...box.children].some((x) => !x.classList.contains('taken'))) return;
          body.querySelector('.find-tip').textContent = 'Đã cất vào túi đồ.';
          if (after) setTimeout(() => after(body), 700);
          else setTimeout(closeLook, 1100);
        });
        box.appendChild(b);
      }
    });
  }

  // Lá thư kẹp sau tấm ảnh, cùng cuộn băng thật. Lúc đọc, chiếc radio ngoài sân đình to dần lên.
  // Lời thư: bản nháp Claude viết theo ý anh Quang (cuộn thật vẫn nằm ở câu đố đầu tiên; tình cảm anh cũng vậy). Anh sửa thoải mái.
  const LETTER = [
    'Gửi người con gái anh yêu,',
    'Em có biết không, cuộn băng thật chưa từng đi đâu cả.',
    'Nó nằm ở đây ngay từ lúc em bật đèn, sau bức ảnh đầu tiên em ghép lại. Câu đố đầu tiên của em cũng chính là chỗ nó nằm chờ em.',
    'Em đi qua ba căn phòng, mở vali, dò sóng radio, lục cả máy tính của anh. Còn nó thì vẫn ở yên chỗ cũ, ngay trước mắt em, lặng lẽ đợi em quay về.',
    'Tình cảm của anh cũng vậy đó.',
    'Em không cần tìm đâu xa. Những hôm em mệt, em buồn, thấy mọi thứ rối như một câu đố chưa giải được, thì em cứ quay về chỗ ban đầu. Anh vẫn ở đó, như từ lúc em mới bật đèn.',
    'Hà Nội với Thái Nguyên cách nhau tám mươi, chín mươi cây số. Nhưng anh chưa bao giờ ở xa em.',
    'Giờ cho cuộn băng vào máy đi em.\nAnh đợi em ở trong đó.',
  ];
  function letter() {
    const first = !S.items.letter;
    S.items.letter = true;
    save();
    look('Thư của anh', '<p class="radio-note">♪ Ngoài sân đình, chiếc radio vừa to lên một chút…</p><div class="letter"></div>', (body) => {
      const paper = body.querySelector('.letter');
      for (const t of LETTER) { const p = document.createElement('p'); p.textContent = t; paper.appendChild(p); }
      paper.insertAdjacentHTML('beforeend', '<p class="sign">Mãi yêu em ❤️<br />Anh, Quang</p>');
      TV.sfx.paper();
      TV.amb.lift(true);
      onClose = () => { TV.amb.lift(false); if (first) say('Radio nhỏ dần. Cuộn thật đây rồi. Cho vào máy.', 5000); };
    });
  }
  function envelope(body) {
    body.innerHTML = '<p>Lần này là thật.</p><p>Kẹp phía sau cuộn băng còn một lá thư gấp tư.</p><div class="finds"><button type="button" class="find is-letter"><span class="find-ic">' + ICON.letter + '</span><span class="find-l">Thư của anh</span></button></div><p class="say">Chạm để mở thư.</p>';
    body.querySelector('.find').addEventListener('click', letter);
  }

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
            TV.sfx.piece();
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
    // Số nấc là trang "A → D" trong Từ điển tiếng em (lùi 3).
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
      l.addEventListener('click', () => { k = (k + 25) % 26; TV.sfx.notch(); show(); });
      r.addEventListener('click', () => { k = (k + 1) % 26; TV.sfx.notch(); show(); });
      show();
    });
  }

  // Ký hiệu vẽ tay (nét mực, mép hơi run nhờ bộ lọc #ink trong hoi-uc.html): dùng cho khoá vali và mặt sau polaroid.
  const GLYPH = {
    rain: '<path d="M5 17 Q16 4 27 17"/><path d="M5 17 q2.75 -2.2 5.5 0 q2.75 -2.2 5.5 0 q2.75 -2.2 5.5 0 q2.75 -2.2 5.5 0"/><path d="M16 17 v8 q0 3 -2.6 3 q-2 0 -2 -2"/><path d="M6 6.5 l-1 2.6 M11 3.5 l-.9 2.3 M25 5.5 l-1 2.6 M21 2.8 l-.8 2.1"/>',
    flower: [0, 72, 144, 216, 288].map((r) => '<ellipse cx="16" cy="9.6" rx="3.7" ry="5.6" transform="rotate(' + r + ' 16 16.5)"/>').join('') + '<circle cx="16" cy="16.5" r="2" class="dot"/>',
    cake: '<path d="M6.5 18.5 h19 v9 h-19 z"/><path d="M6.5 22.5 q3.2 2.2 6.3 0 q3.2 2.2 6.4 0 q3.1 2.2 6.3 0"/><path d="M16 18.5 v-6"/><path d="M16 10 q-2.2 -2.4 0 -5.6 q2.2 3.2 0 5.6 z"/>',
    cloud: '<path d="M8.5 24 h15.5 a5 5 0 0 0 .4 -10 a7.2 7.2 0 0 0 -13.6 -1.4 a5.6 5.6 0 0 0 -2.3 11.4 z"/>',
    case: '<rect x="5.5" y="12" width="21" height="14" rx="2.5"/><path d="M12 12 v-3.2 q0 -1.3 1.3 -1.3 h5.4 q1.3 0 1.3 1.3 v3.2"/><path d="M11 12 v14 M21 12 v14"/>',
    shuttle: '<circle cx="16" cy="25.5" r="3"/><path d="M13.6 23.6 L9 8 M16 22.5 V6.5 M18.4 23.6 L23 8"/><path d="M9 8 Q16 4.6 23 8"/><path d="M11.2 15.4 Q16 13.6 20.8 15.4"/>',
  };
  const glyph = (k) => '<svg class="gl" viewBox="0 0 32 32" aria-hidden="true"><g filter="url(#ink)">' + GLYPH[k] + '</g></svg>';

  // Khoá vali: bốn con lăn đồng khắc hình, chạm để cuộn sang hình khác. Xếp bốn kỷ niệm theo thời gian.
  function symbolLock() {
    const SYM = ['rain', 'flower', 'cake', 'cloud', 'case', 'shuttle'];
    const ANS = ['rain', 'flower', 'cloud', 'shuttle'];
    const cur = [0, 0, 0, 0];
    look('Chiếc vali', '<p>Khoá bốn con lăn, đánh số 1 2 3 4. Chạm để cuộn.</p><div class="symlock"></div><div class="lk-btns"><button type="button" class="primary">Thử mở</button></div>', (body) => {
      const row = body.querySelector('.symlock');
      cur.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Con lăn ' + (i + 1));
        b.innerHTML = '<span class="roll">' + glyph(SYM[cur[i]]) + '</span><small>' + (i + 1) + '</small>';
        b.addEventListener('click', () => {
          cur[i] = (cur[i] + 1) % SYM.length;
          const r = b.querySelector('.roll');
          r.innerHTML = glyph(SYM[cur[i]]);
          r.classList.remove('go'); void r.offsetWidth; r.classList.add('go');
          TV.sfx.roller();
        });
        row.appendChild(b);
      });
      body.querySelector('.primary').addEventListener('click', () => {
        if (cur.every((v, i) => SYM[v] === ANS[i])) {
          S.done.case = true;
          win(() => { body.innerHTML = '<p>Tách. Nắp vali bật lên.</p>'; }, 'latch');
          setTimeout(openCase, 800);
          return;
        }
        wrong(row);
        msg(body, cur.some((v) => SYM[v] === 'cake' || SYM[v] === 'case') ? 'Có một hình không có trên ảnh nào.' : 'Vẫn khoá.');
      });
    });
  }

  const openCase = () => pickup('Chiếc vali', 'Trong vali: một chiếc chìa khoá cũ, và nửa mẩu giấy.', ['key', 'note2']);

  // Radio: dò sóng, vạch sóng càng cao càng gần. Bắt được sóng thì nghe đọc một câu, xếp lại câu ấy.
  function radio() {
    if (S.done.radio && !S.done.words) { words(); return; }
    if (S.done.words) { say('Radio đang phát nhạc rất khẽ.'); return; }
    let f = 92;
    // Một mặt dò sóng duy nhất: kéo kim đỏ dọc thang tần số. Vạch sóng bên cạnh chỉ để báo gần hay xa.
    look('Radio cũ', '<div class="radio-ui"><div class="dialrow"><div class="freq"></div><div class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div><div class="dial"><div class="scale" aria-hidden="true"><span>80</span><span>85</span><span>90</span><span>95</span><span>100</span></div><input type="range" min="80" max="100" step="0.5" aria-label="Kéo kim để dò sóng" /></div><p class="say">Kéo kim đỏ để dò sóng.</p></div>', (body) => {
      const input = body.querySelector('input'), bars = body.querySelectorAll('.bars i');
      input.value = f;
      const show = () => {
        f = +input.value;
        body.querySelector('.freq').textContent = f.toFixed(1);
        const n = Math.max(0, 5 - Math.floor(Math.abs(f - 85) / 1.5));
        bars.forEach((b, i) => { b.style.height = 6 + i * 5 + 'px'; b.classList.toggle('on', i < n); });
        body.querySelector('.say').textContent = n >= 5 ? 'Rõ rồi!' : n >= 3 ? 'Có tiếng người, còn rè…' : 'Rè rè…';
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
            TV.sfx.tile();
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
          TV.sfx.dial(k);
          if (k === '⌫') { code = code.slice(0, -1); draw(); return; }
          code += k;
          draw();
          if (code.length < 4) return;
          if (code === '4719') {
            S.done.phone = true;
            win(() => { body.innerHTML = '<p>Mở khoá.</p><p class="hand">Sau tấm ảnh em vừa ghép.</p>'; }, 'unlock');
            return;
          }
          wrong(pin);
          msg(body, S.done.robot ? 'Sai mật mã. Con robot đọc số nào nhỉ?' : 'Sai mật mã.');
          code = '';
          setTimeout(draw, 400);
        });
        keys.appendChild(b);
      }
    });
  }

  // Giá sách: sáu cuốn, cuốn cần tìm là "Từ điển tiếng em". Trong đó có trang ghi khoá xoay chữ.
  function bookshelf() {
    if (S.done.book) { look('Từ điển tiếng em', '<p class="hand">A → D</p><p class="say">Từ lúc này, xin được nói trong nhật kí là Anh Yêu Em.</p>'); return; }
    const books = [
      ['Nhật ký thay đổi bản thân', '#5E4B3C', 'Sổ tay thường. Hiệu sách nào cũng có.'],
      ['Kỹ thuật Viễn thông', '#3E5C76', 'Giáo trình. Khô khan lắm.'],
      ['Từ điển Anh – Việt', '#4F6B4A', 'Từ điển này ngoài hiệu sách đầy.'],
      ['Sóng · Xuân Quỳnh', '#8C3B3B', 'Thơ hay. Nhưng không phải từ điển.'],
      ['Từ điển tiếng em', '#B5462F', null],
      ['Truyện Kiều', '#6A4428', 'Dày quá. Không phải từ điển.'],
    ];
    look('Giá sách', '<p>Chạm vào gáy để rút ra.</p><div class="books"></div>', (body) => {
      const row = body.querySelector('.books');
      for (const [name, color, no] of books) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = name;
        b.style.background = color;
        b.addEventListener('click', () => {
          TV.sfx.book();
          if (no) { msg(body, no); return; }
          S.done.book = true;
          win(() => {
            $('look-title').textContent = 'Từ điển tiếng em';
            body.innerHTML = '<p>Một trang được gấp góc:</p><p class="hand" style="font-size:30px">A → D</p><p class="say">Từ lúc này, xin được nói trong nhật kí là Anh Yêu Em.</p>';
          });
        });
        row.appendChild(b);
      }
    });
  }

  // Bảng ghim: bốn tấm polaroid, lật mặt sau thấy số và hình (khoá vali xếp theo số).
  function board() {
    if (!S.seen.C) { say('Bốn tấm ảnh ghim trên bảng.'); return; }
    const POLS = [['anh-3', '3', 'cloud'], ['anh-10', '1', 'rain'], ['anh-14', '4', 'shuttle'], ['anh-5', '2', 'flower']];
    look('Bảng ghim', '<p>Chạm để lật.</p><div class="polgrid"></div>', (body) => {
      const grid = body.querySelector('.polgrid');
      const flipped = new Set();
      for (const [img, n, sym] of POLS) {
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'polcard';
        c.innerHTML = '<span class="f"><img alt="" src="../assets/thumbs/' + img + '.webp" /></span><span class="b"><span>' + n + '</span>' + glyph(sym) + '</span>';
        c.addEventListener('click', () => {
          TV.sfx.paper();
          c.classList.toggle('flip');
          flipped.add(n);
          if (flipped.size === 4 && !S.done.board) { S.done.board = true; save(); }
        });
        grid.appendChild(c);
      }
    });
  }

  // Máy tính: đăng nhập bằng mật khẩu máy anh, rồi mở thư mục tìm sơ đồ chip cho con robot.
  function pc() {
    if (!S.seen.D) { say('Màn hình sáng. Máy khoá.'); return; }
    if (!S.done.pc) { pcLogin(); return; }
    pcDesk();
  }
  function pcLogin() {
    let code = '', miss = 0;
    look('Máy tính', '<div class="desktop"><div class="who">Quang</div><div class="pw"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="keys"></div></div>', (body) => {
      const pw = body.querySelector('.pw'), keys = body.querySelector('.keys');
      const draw = () => pw.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i < code.length));
      for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = k;
        if (!k) b.style.visibility = 'hidden';
        b.addEventListener('click', () => {
          TV.sfx.beep();
          if (k === '⌫') { code = code.slice(0, -1); draw(); return; }
          code += k;
          draw();
          if (code.length < 6) return;
          if (fnv(code) === PC_HASH) { S.done.pc = true; save(); render(); pcDesk(); return; }
          miss++;
          wrong(pw);
          msg(body, miss >= 2 ? 'Mật khẩu máy tính của anh. Em biết mà.' : 'Sai mật khẩu.');
          code = '';
          setTimeout(draw, 400);
        });
        keys.appendChild(b);
      }
    });
  }
  // Màn hình máy tính: thư gửi em, ảnh, nhạc, thùng rác để lục; thư mục Đồ án bị khoá, mật khẩu nằm trong thùng rác.
  function pcDesk() {
    const ICONS = [
      ['letter', 'Thư gửi em', 'txt'], ['photos', 'Ảnh', ''], ['music', 'Nhạc', ''], ['project', 'Đồ án', 'lock'], ['bin', 'Thùng rác', 'bin'],
    ];
    look('Máy tính', '<div class="desktop"><div class="icons"></div><div class="win" hidden></div></div>', (body) => {
      const icons = body.querySelector('.icons'), win2 = body.querySelector('.win');
      const open = (path, build) => { win2.hidden = false; win2.replaceChildren(); const p = document.createElement('div'); p.className = 'path'; p.textContent = path; win2.appendChild(p); build(win2); };
      const text = (box, t) => box.appendChild(document.createTextNode(t));
      const file = (box, name, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'file'; b.textContent = name; b.addEventListener('click', () => { TV.sfx.ui(); fn(); }); box.appendChild(b); };
      const SHOW = {
        letter: () => open('C:/Thư gửi em.txt', (box) => {
          text(box, 'Đang mở…');
          fetch('../assets/letter.txt').then((r) => r.text()).then((t) => { box.lastChild.remove(); text(box, t.trim()); }).catch(() => { box.lastChild.textContent = 'Không mở được thư.'; });
        }),
        photos: () => open('C:/Ảnh', (box) => { box.insertAdjacentHTML('beforeend', '<div class="thumbs">' + [3, 5, 10, 14, 2, 12, 8, 17].map((n) => '<img alt="" src="../assets/thumbs/anh-' + n + '.webp" />').join('') + '</div>'); }),
        music: () => open('C:/Nhạc', (box) => {
          text(box, 'Đang tải…');
          fetch('../game/beatmaps/index.json').then((r) => r.json()).then((d) => { box.lastChild.remove(); text(box, d.songs.map((x) => '♪ ' + x.title).join('\n')); }).catch(() => { box.lastChild.textContent = '♪'; });
        }),
        bin: () => open('Thùng rác', (box) => {
          file(box, 'loi-to-tinh-nhap.txt', () => open('Thùng rác/loi-to-tinh-nhap.txt', (b2) => text(b2, '“Anh chào Lệ Thuỷ nhé, anh là người đã theo dõi em từ lâu rồi, quan tâm em và thêm nữa anh đã yêu em một cách chân thành…”\n\n(Sến quá. Xoá.)')));
          file(box, 'anh-chup-vo.jpg', () => open('Thùng rác/anh-chup-vo.jpg', (b2) => text(b2, '(Ảnh nhoè, chỉ thấy một ngón tay to đùng che ống kính.)')));
          file(box, 'mat-khau-do-an.txt', () => open('Thùng rác/mat-khau-do-an.txt', (b2) => text(b2, 'Mật khẩu thư mục Đồ án:\nVĂN + SÓNG\n\nGõ: viết thường, không dấu, viết liền nhau.\n(vd. “Hà Nội” thì gõ hanoi)')));
        }),
        project: () => {
          if (S.done.dir) { open('C:/Đồ án/robot_v2/so-do-chip.txt', (box) => text(box, 'Robot chưa chạy: thiếu 4 chip.\nỔ 1: tam giác đỏ\nỔ 2: tròn xanh dương\nỔ 3: vuông vàng\nỔ 4: ngôi sao xanh lá\nLắp đủ, robot sẽ đọc mật mã.')); return; }
          // Bàn phím chữ ngay trong game, không dùng ô nhập của hệ thống: bộ gõ tiếng Việt (Telex) không biến "vansong" thành "vánong",
          // điện thoại không bật bàn phím riêng. Máy tính gõ phím thật vẫn được: đọc phím vật lý (e.code), không đọc chữ bộ gõ tạo ra.
          open('C:/Đồ án 🔒', (box) => {
            box.insertAdjacentHTML('beforeend', '<div class="pwrow"><div class="pwfield"></div><button type="button" class="go">Mở</button></div><div class="pwkb"></div>');
            const field = box.querySelector('.pwfield'), kb = box.querySelector('.pwkb');
            let typed = '';
            const draw = (ph) => { field.textContent = typed; field.dataset.ph = ph || 'gõ không dấu'; };
            const key = (k) => { if (k === '⌫') typed = typed.slice(0, -1); else if (typed.length < 12) typed += k; draw(); };
            const onKey = (e) => {
              if (!box.isConnected) { document.removeEventListener('keydown', onKey); return; }
              const m = /^Key([A-Z])$/.exec(e.code);
              if (m) key(m[1].toLowerCase());
              else if (e.code === 'Backspace') key('⌫');
              else if (e.code === 'Enter' || e.code === 'NumpadEnter') tryOpen();
              else return;
              e.preventDefault();
            };
            const tryOpen = () => {
              if (typed === 'vansong') {
                document.removeEventListener('keydown', onKey);
                S.done.dir = true;
                save();
                render();
                TV.sfx.unlock();
                SHOW.project();
                for (const x of icons.children) if (x.dataset.id === 'project') x.querySelector('i').className = '';
                return;
              }
              wrong(field);
              typed = '';
              draw('Sai mật khẩu');
            };
            for (const row of ['qwertyuiop', 'asdfghjkl', 'zxcvbnm⌫']) {
              const r = document.createElement('div');
              for (const k of row) {
                const b = document.createElement('button');
                b.type = 'button';
                b.textContent = k;
                if (k === '⌫') b.className = 'del';
                b.addEventListener('click', () => { TV.sfx.key(); key(k); });
                r.appendChild(b);
              }
              kb.appendChild(r);
            }
            box.querySelector('.go').addEventListener('click', tryOpen);
            document.addEventListener('keydown', onKey);
            draw();
            // Màn hình thấp (điện thoại xoay ngang): cuộn cho ô mật khẩu và bàn phím vào tầm nhìn
            requestAnimationFrame(() => box.querySelector('.pwrow').scrollIntoView({ block: 'start', behavior: 'smooth' }));
          });
        },
      };
      for (const [id, name, cls] of ICONS) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.id = id;
        b.innerHTML = '<i class="' + (id === 'project' && S.done.dir ? '' : cls) + '"></i>';
        b.appendChild(document.createTextNode(name));
        b.addEventListener('click', () => { TV.sfx.ui(); for (const x of icons.children) x.classList.toggle('on', x === b); SHOW[id](); });
        icons.appendChild(b);
      }
    });
  }

  // Con robot: kéo (hoặc chạm chọn rồi chạm ổ) 4 chip vào 4 ổ đánh số. Đúng hết thì robot đọc mật mã.
  function robot() {
    if (S.done.robot) { look('Con robot', '<div class="chipzone"><div class="botbody" data-screen="4719"></div></div><p class="say">Bíp. Bốn, bảy, một, chín.</p>'); return; }
    if (!S.seen.D) { say('Con robot đang lắp dở. Thiếu chip.'); return; }
    const ANS = ['s1', 's2', 's3', 's4'];
    const slot = [null, null, null, null];
    let held = null;
    look('Con robot', '<p>Kéo chip vào ổ. Chạm chip trong ổ để rút ra.</p><div class="chipzone"><div class="botbody" data-screen="----"></div><div class="chips"></div></div>', (body) => {
      const bot = body.querySelector('.botbody'), tray = body.querySelector('.chips');
      const chipEl = (sh) => { const c = document.createElement('button'); c.type = 'button'; c.className = 'chip'; c.dataset.sh = sh; c.innerHTML = '<i class="' + sh + '"></i>'; return c; };
      const place = (i, sh) => {
        const old = slot.indexOf(sh);
        if (old >= 0) slot[old] = null;
        slot[i] = sh;
        held = null;
        TV.sfx.chip();
        draw();
        if (slot.every(Boolean)) {
          if (slot.every((v, k) => v === ANS[k])) {
            bot.dataset.screen = '4719';
            S.done.robot = true;
            win(() => msg(body, 'Bíp bíp. Mắt robot sáng lên: 4 7 1 9.'), 'robot');
          } else {
            bot.dataset.screen = 'ERR';
            wrong(bot);
            msg(body, 'Bíp… sai ổ. Xem lại sơ đồ.');
            setTimeout(() => { slot.fill(null); bot.dataset.screen = '----'; draw(); }, 900);
          }
        }
      };
      const draw = () => {
        bot.replaceChildren();
        tray.replaceChildren();
        slot.forEach((sh, i) => {
          const s2 = document.createElement('div');
          s2.className = 'sock' + (held && !sh ? ' pick' : '');
          s2.dataset.i = i;
          s2.innerHTML = '<span>' + (i + 1) + '</span>';
          if (sh) { const c = chipEl(sh); c.addEventListener('click', () => { slot[i] = null; TV.sfx.chipOut(); draw(); }); s2.appendChild(c); }
          s2.addEventListener('click', () => { if (held && !slot[i]) place(i, held); });
          bot.appendChild(s2);
        });
        for (const sh of ['s3', 's1', 's4', 's2']) {
          if (slot.includes(sh)) continue;
          const c = chipEl(sh);
          if (held === sh) c.classList.add('sel');
          c.addEventListener('click', () => { held = held === sh ? null : sh; TV.sfx.ui(); draw(); });
          // Kéo thả: thả lên ổ nào thì cắm vào ổ đó.
          c.addEventListener('pointerdown', (e) => {
            const ghost = c.cloneNode(true);
            ghost.style.cssText = 'position:fixed;z-index:60;pointer-events:none;opacity:.9;left:' + (e.clientX - 27) + 'px;top:' + (e.clientY - 27) + 'px';
            let moved = false;
            const mv = (ev) => { moved = true; document.body.appendChild(ghost); ghost.style.left = ev.clientX - 27 + 'px'; ghost.style.top = ev.clientY - 27 + 'px'; };
            const up = (ev) => {
              removeEventListener('pointermove', mv);
              removeEventListener('pointerup', up);
              removeEventListener('pointercancel', up);
              ghost.remove();
              if (!moved || ev.type === 'pointercancel') return;
              const t = document.elementFromPoint(ev.clientX, ev.clientY);
              const sock = t && t.closest('.sock');
              if (sock && !slot[+sock.dataset.i]) place(+sock.dataset.i, sh);
            };
            addEventListener('pointermove', mv);
            addEventListener('pointerup', up);
            addEventListener('pointercancel', up); // thao tác bị huỷ (cuộn, cuộc gọi đến): bỏ chip đang kéo, không kẹt bóng chip
          });
          tray.appendChild(c);
        }
      };
      draw();
    });
  }

  // Sổ ghi chép: manh mối đã có, cái nào giải xong thì đánh dấu ✓.
  function journal() {
    const d = S.done;
    const rows = [
      [S.seen.A, 'Băng 01: ghép lại bức ảnh vỡ.', d.jig],
      [S.seen.B, 'Băng 02: mật thư QKLQ GXRL JRL. Số nấc ở cuốn từ điển không hiệu sách nào bán.', d.cipher],
      [d.book, 'Từ điển tiếng em: A → D.', d.cipher],
      [d.cipher, 'Giải ra: NHÌN DƯỚI GỐI.', d.pillow],
      [S.seen.C, 'Băng 03: lật bốn tấm ảnh, khoá vali đọc theo số.', d.case],
      [S.items.note1 && S.items.note2, 'Mẩu giấy: tám mươi, chín mươi cây số. Sóng ở giữa.', d.radio],
      [d.radio, 'Radio đọc một câu lộn xộn. Xếp lại.', d.words],
      [S.seen.D, 'Băng 04: mật mã điện thoại ở con robot.', d.robot],
      [d.pc, 'Máy tính: thư mục Đồ án bị khoá.', d.dir],
      [d.dir, 'Đồ án: sơ đồ lắp chip cho robot.', d.robot],
      [d.robot, 'Robot đọc: 4 7 1 9.', d.phone],
      [d.phone, 'Điện thoại: sau tấm ảnh em vừa ghép.', S.items.E],
    ].filter((r) => r[0]);
    look('Sổ ghi chép', '<ul class="journal">' + rows.map((r) => '<li class="' + (r[2] ? 'ok' : '') + '"><b>' + (r[2] ? '✓' : '•') + '</b><span></span></li>').join('') + '</ul>', (body) => {
      body.querySelectorAll('.journal span').forEach((sp, i) => { sp.textContent = rows[i][1]; });
    });
  }

  // ===== Đồ vật trong các phòng =====
  const lampTape = () => pickup('Dưới chân đèn', 'Đèn vừa sáng lên. Dưới chân đèn có một cuộn băng cũ.', ['A']);
  const OBJ = {
    lamp() {
      if (S.lamp && !S.items.A) { lampTape(); return; }
      if (S.lamp) { say('Để đèn sáng thôi. Tối em sợ.'); return; }
      S.lamp = true;
      TV.audioOn();
      win(() => say('Sáng rồi.', 2500), 'lamp');
      setTimeout(lampTape, 900);
    },
    frame() {
      if (!S.seen.A) { say('Bức ảnh vỡ mất rồi.'); return; }
      if (!S.done.jig) { jigsaw(); return; }
      if (!S.done.phone) { say('Ảnh liền rồi. Nắng chiều đẹp.'); return; }
      if (!S.items.E) { pickup('Sau tấm ảnh', 'Một cuộn băng, nhãn vẽ trái tim nhỏ.', ['E'], 'heart', envelope); return; }
      if (!S.items.letter) { look('Sau tấm ảnh', ''); envelope($('look-body')); return; }
      say('Khoảng trống sau tấm ảnh. Thư anh để trong túi đồ.');
    },
    drawer() {
      if (!S.done.jig) { say('Ngăn kéo kẹt cứng.'); return; }
      if (!S.items.B || !S.items.wheel) { if (!OBJ.drawer.opened) { OBJ.drawer.opened = true; TV.sfx.drawer(); } pickup('Ngăn kéo', 'Một cuộn băng, và một chiếc đĩa có hai vòng chữ cái.', ['B', 'wheel']); return; }
      say('Ngăn kéo trống.');
    },
    vcr,
    phone,
    shelf() {
      if (!S.seen.B) { say('Toàn sách là sách.'); return; }
      bookshelf();
    },
    cal() { say('Tháng 8. Một ngày khoanh đỏ.'); },
    vase() { say('Mấy bông sen hồng.'); },
    board,
    pc,
    robot,
    pillow() {
      if (!S.done.cipher) { say('Gối êm lắm. Chưa phải lúc.'); return; }
      if (!S.done.pillow) { S.done.pillow = true; win(() => {}, 'cloth'); setTimeout(() => OBJ.pillow(), 700); return; }
      if (!S.items.C || !S.items.note1) { pickup('Dưới gối', 'Một cuộn băng, và nửa mẩu giấy. Gối vẫn còn mùi tóc em.', ['C', 'note1']); return; }
      say('Gối vẫn còn mùi tóc em.');
    },
    case() {
      if (!S.done.case) { symbolLock(); return; }
      if (!S.items.key || !S.items.note2) { openCase(); return; }
      say('Vali trống, nhẹ tênh.');
    },
    // Cổng đình: phải cầm chìa khoá từ túi rồi chạm vào ổ khoá. Chìa xoay "cạch", ổ khoá rơi, rồi cổng mới mở.
    gate() {
      if (!S.items.key) { say('Cổng đình khoá. Ổ khoá to, cũ.'); return; }
      if (sel !== 'key') { say('Cổng khoá. Mở túi đồ, cầm Chìa khoá cổng lên rồi chạm vào ổ khoá.', 5000); guide(); return; }
      if (OBJ.gate.turning) return;
      OBJ.gate.turning = true;
      sel = null;
      renderBag();
      const lock = document.querySelector('.gate-lock');
      lock.classList.add('turn');
      TV.sfx.unlock();
      setTimeout(() => {
        lock.classList.remove('turn');
        OBJ.gate.turning = false;
        S.done.gate = true;
        win(() => say('Cạch. Chìa xoay được… Kẹt… cổng mở.', 3500), 'gate');
      }, 900);
    },
    radio,
    lantern() { say(S.done.words ? 'Đèn lồng soi xuống bậc thềm.' : 'Đèn lồng chưa thắp.'); },
    bench() {
      if (S.done.words && !S.items.D) { pickup('Bậc thềm', 'Trên bậc thềm cũ, một cuộn băng nhãn viết tay: “Băng số 1”.', ['D']); return; }
      say('Bậc thềm cũ. Gió mát.');
    },
  };
  // Chạm lần đầu ở bất kỳ đâu: bật âm thanh, căn nhà bắt đầu "thở" (tiếng nền theo phòng)
  if (!TRAILER) addEventListener('pointerdown', () => { TV.audioOn(); TV.amb.start(); TV.amb.set(S.room, S.items.E ? 'warm' : 'lonely', !!S.done.words); }, { once: true });
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
      TV.sfx.door();
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
  // ===== Trailer: phim giới thiệu tự chạy bằng chính căn phòng (không lộ đáp án) =====
  // Nhạc assets/sound/trailer.mp3 cắt từ Interstellar (Hans Zimmer) bằng tools/trailer-music/build.mjs. Mọi mốc dưới đây
  // là giây trong bản nhạc đó, đo bằng tools/trailer-music/analyze.mjs: tiếng tích‑tắc của Mountains (1,2535 giây một tiếng),
  // phách 1 giây của No Time for Caution. Hình chạy theo đồng hồ của bản nhạc nên cú đánh rơi đúng phách.
  // Không có nhạc thì chạy theo giờ máy, kèm tiếng tim đập và tiếng rít tự tạo.
  async function runTrailer() {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const room = $('room'), scene = $('scene');
    room.classList.add('trailer');
    const ov = document.createElement('div');
    ov.className = 'tr-ov';
    ov.innerHTML = '<div class="tr-bloom" id="tr-bloom"></div><div class="tr-vig"></div><div class="tr-grain"></div><div class="tr-black" id="tr-black"></div><div class="tr-dip" id="tr-dip"></div><div class="tr-crt"></div><div class="tr-glitch" id="tr-glitch"><i></i><i></i><i></i></div><div class="tr-bar t"></div><div class="tr-bar b"></div><div class="tr-card" id="tr-card"><h1></h1><p></p></div><div class="tr-flash" id="tr-flash"></div><button class="tr-start" id="tr-start" type="button"><b>▶</b>Xem trailer</button><div class="tr-end" id="tr-end" hidden><button type="button" id="tr-again">Xem lại</button><a href="../home/">Về nhà</a></div>';
    room.appendChild(ov);
    const music = new Audio('../assets/sound/trailer.mp3');
    music.preload = 'auto'; // tải sẵn trong lúc chờ bấm, để nhạc vào ngay
    await new Promise((res) => $('tr-start').addEventListener('click', res, { once: true }));
    $('tr-start').remove();
    TV.audioOn();
    const mix = TV.music(music, 0.85);
    music.play().catch(() => {});
    const fx = TV.sfx;
    // Có nhạc nền thì bỏ tiếng tim đập và tiếng rít dồn lên (nhạc tự có nhịp và cao trào), chỉ giữ tiếng va chạm, nhiễu, vút.
    // Tiếng hiệu ứng có độ vang như trong phòng lớn và nhỏ hơn một chút khi có nhạc, để hoà vào nhạc nền.
    let withMusic = false;
    fx.space(0.35);
    music.addEventListener('playing', () => { withMusic = true; fx.level(0.8); });
    const tock = () => { if (!withMusic) fx.tock(); };
    const beat = () => { if (!withMusic) fx.beat(); };
    const riser = (d) => { if (!withMusic) fx.riser(d); };
    const t0 = performance.now();
    const clock = () => (withMusic && !music.paused ? music.currentTime : (performance.now() - t0) / 1000);
    const at = (t) => new Promise((res) => { const f = () => (clock() >= t ? res() : requestAnimationFrame(f)); f(); });
    const black = (on) => $('tr-black').classList.toggle('on', on);
    const replay = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    const shake = (big) => replay(room, big ? 'tr-shake2' : 'tr-shake');
    const flick = () => { replay($('tr-glitch'), 'go'); replay(room, 'tr-flicker'); fx.glitch(); };
    const hit = (big) => { fx.boom(); shake(big); replay($('tr-flash'), 'go'); };
    // Chữ hiện từ giây "from" đến giây "to" (không có "to" thì giữ nguyên).
    const card = async (h, p, from, to, opt) => {
      const o = opt || {};
      const c = $('tr-card');
      await at(from);
      c.classList.toggle('big', !!o.big);
      c.querySelector('h1').textContent = h || '';
      c.querySelector('p').textContent = p || '';
      if (o.hit) hit(o.hit === 'big');
      if (o.beat) beat();
      replay(c, 'on');
      room.classList.add('dof'); // xoá phông: cảnh sau lưng chữ mờ và tối đi
      if (to === undefined) return;
      await at(to);
      c.classList.remove('on');
      room.classList.remove('dof');
    };
    const cam = (t, ms) => { scene.style.transition = 'transform ' + ms + 'ms cubic-bezier(.45, 0, .25, 1), filter .6s'; scene.style.transform = t; };
    // Chuyển cảnh kiểu phim: chớp qua màn đen rất nhanh, cảnh mới hiện ra từ nhoè chuyển động như máy quay vừa lia.
    // Tiếng: gió trầm cuộn lên rồi chạm nhịp trầm; cú cắt nhanh (quick) chỉ là tiếng màn trập.
    const whip = () => replay(scene, 'whip');
    const cut = async (t, fn, quick) => {
      if (!quick) { await at(t - 0.35); fx.swell(0.35); }
      await at(t - 0.08);
      replay($('tr-dip'), 'go');
      if (quick) fx.shutter();
      await at(t);
      fn(); render(); whip();
      if (!quick) fx.thud();
    };
    const go = (r) => { S.room = r; };
    // Kết trailer: biển neon cũ trong sương, tối và huyền bí. Từ giây t0 nháy chập chờn lúc bật, rồi hỏng tạm thời
    // (chữ Ố chập chờn kèm tiếng xèn xẹt, chữ G tắt một lúc, chữ Ă yếu, cả biển sụt áp), chớp lần cuối và sáng trọn vẹn
    // đúng giây tFull (cú bùng của nhạc): mọi chữ sáng đều, viền bóng đèn bừng lên lần lượt.
    const brokenSign = async (t0, tFull) => {
      const rnd = (a, z) => a + Math.random() * (z - a);
      const edge = (k) => (k < 0.3 ? [k / 0.3 * 100, 0] : k < 0.5 ? [100, (k - 0.3) / 0.2 * 100] : k < 0.8 ? [100 - (k - 0.5) / 0.3 * 100, 100] : [0, 100 - (k - 0.8) / 0.2 * 100]);
      const bulbs = Array.from({ length: 40 }, (_, i) => { const [x, y] = edge(i / 40); return '<i class="' + (i % 3 === 1 ? 'alive' : '') + '" style="left:' + x.toFixed(2) + '%;top:' + y.toFixed(2) + '%;--t:' + rnd(2.2, 5.5).toFixed(1) + 's;--d:' + (-rnd(0, 5)).toFixed(1) + 's;--w:' + (i * 0.03).toFixed(2) + 's"></i>'; }).join('');
      const dust = Array.from({ length: 14 }, () => '<i style="left:' + rnd(38, 62).toFixed(1) + '%;top:' + rnd(30, 80).toFixed(1) + '%;--t:' + rnd(5, 9).toFixed(1) + 's;--d:' + (-rnd(0, 9)).toFixed(1) + 's;--x:' + rnd(-4, 4).toFixed(1) + 'cqw"></i>').join('');
      const box = document.createElement('div');
      box.className = 'tr-sign';
      box.innerHTML = '<div class="beam"></div><div class="dust">' + dust + '</div><div class="fog"></div><div class="board"><div class="bulbs">' + bulbs + '</div></div><div class="fog f2"></div>'
        + '<h1>' + [...'BĂNG SỐ 1'].map((c) => '<b>' + c + '</b>').join('') + '</h1><p>Hồi ức · Sắp ra mắt</p>';
      ov.insertBefore(box, $('tr-card'));
      requestAnimationFrame(() => box.classList.add('on'));
      const h = box.querySelector('h1'), L = h.querySelectorAll('b'); // B Ă N G _ S Ố _ 1
      const all = (off) => L.forEach((b) => b.classList.toggle('off', off));
      await at(t0);
      fx.neon(true);
      for (const [on, ms] of NEON) { h.classList.toggle('lit', !!on); fx.neonLevel(on ? 1 : 0.15); if (on) fx.tick(); await sleep(ms); }
      h.classList.add('lit'); fx.tick();
      L[1].classList.add('dim');
      // Hỏng tạm thời: Ố chập chờn, G tắt, Ố, sụt áp... cho tới sát lúc sáng trọn vẹn
      for (let k = 0; clock() < tFull - 0.75; k++) {
        const r = [0, 1, 0, 2][k % 4];
        if (r === 0) {
          for (let i = 0; i < 3; i++) { L[6].classList.add('off'); fx.crackle(); fx.neonLevel(0.6); await sleep(rnd(40, 100)); L[6].classList.remove('off'); fx.neonLevel(1); await sleep(rnd(50, 120)); }
        } else if (r === 1) {
          L[3].classList.add('off'); fx.crackle(); await sleep(560); L[3].classList.remove('off'); fx.tick();
        } else {
          box.classList.add('sag'); fx.neonLevel(0.3); await sleep(150); box.classList.remove('sag'); fx.neonLevel(1);
        }
        await sleep(rnd(180, 360));
      }
      // Chớp lần cuối rồi sáng trọn vẹn
      await at(tFull - 0.32);
      all(true); fx.neonLevel(0.15); await sleep(140);
      all(false); fx.tick(); fx.neonLevel(1); await sleep(90);
      all(true); fx.neonLevel(0.15);
      await at(tFull);
      all(false); L[1].classList.remove('dim');
      box.classList.add('full');
      fx.thud(); fx.neonLevel(1);
      setTimeout(() => fx.neon(false), 1400);
    };

    // Mở: khung phim kéo vào, đồng hồ trong bóng tối, kim giây nhảy theo tiếng tích của nhạc. Điểm 20:00 (giờ hẹn),
    // rồi băng tua ngược: kim quay ngược về 23:38 đêm ấy, nhạc phát lại từ đoạn vừa bị tua.
    black(true);
    requestAnimationFrame(() => ov.classList.add('cine'));
    const clk = document.createElement('div');
    clk.className = 'tr-clock';
    clk.innerHTML = clockFace() + '<div class="tr-clock-t"></div>';
    ov.insertBefore(clk, $('tr-card'));
    const osd = document.createElement('div');
    osd.className = 'tr-osd';
    osd.textContent = '◀◀ TUA LẠI';
    ov.appendChild(osd);
    const [hh, mh, sh] = ['.hh', '.mh', '.sh'].map((q) => clk.querySelector(q));
    const label = clk.querySelector('.tr-clock-t');
    let now = 0; // giây tính từ nửa đêm, âm khi tua về hôm trước
    const setClock = (t) => {
      now = t;
      hh.style.transform = 'rotate(' + t / 120 + 'deg)';
      mh.style.transform = 'rotate(' + t / 10 + 'deg)';
      sh.style.transform = 'rotate(' + Math.floor(t) * 6 + 'deg)';
    };
    const hm = (t) => { const d = ((Math.floor(t / 60) % 1440) + 1440) % 1440; return String(Math.floor(d / 60)).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0'); };
    setClock(19 * 3600 + 59 * 60 + 56);
    await at(0.1);
    clk.classList.add('on');
    for (const t of [0.37, 1.63, 2.88]) { await at(t); setClock(now + 1); tock(); }
    await at(4.13);
    setClock(now + 1); tock(); fx.chime();
    label.textContent = hm(now);
    clk.classList.add('strike');
    // Tua ngược 20 giờ 22 phút: từ 20:00 về 23:38 đêm hôm trước
    await at(4.75);
    const from = now, to = from - (20 * 3600 + 22 * 60);
    clk.classList.add('rew');
    osd.classList.add('on');
    fx.rewind(2.25);
    const jitter = setInterval(flick, 420);
    await new Promise((res) => {
      const f = () => {
        const k = Math.min(1, (clock() - 4.75) / 2.25), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        setClock(from + (to - from) * e);
        label.textContent = hm(now);
        if (k < 1) requestAnimationFrame(f); else res();
      };
      f();
    });
    clearInterval(jitter);
    clk.classList.remove('rew', 'strike');
    osd.classList.remove('on');
    fx.thunk(); shake(); replay($('tr-flash'), 'go');
    label.textContent = '23:38';
    clk.classList.add('lit');
    for (const t of [7.89, 9.15]) { await at(t); setClock(now + 1); tock(); }
    await at(9.7);
    clk.classList.add('out');
    await card('Có một cuộn băng', '', 10.4, 12.3, { beat: true });
    await card('đang chờ em.', '', 12.89, 13.9, { hit: true });
    // Phòng khách tối hiện ra; đèn bật đúng lúc organ vào
    await at(13.79);
    fx.swell(0.35);
    await at(14.14);
    go('r1'); S.lamp = false; render();
    cam('scale(1.32) translate(6%, 4%)', 0);
    await sleep(40);
    fx.thud(); whip(); black(false);
    cam('scale(1.1) translate(2%, 1%)', 3400);
    await at(15.41);
    fx.lamp(); S.lamp = true; render(); replay($('tr-bloom'), 'go');
    riser(9.5);
    await card('Năm cuộn băng.', '', 17.92, 18.91, { beat: true });
    // Năm cuộn rơi xuống theo nửa nhịp tích‑tắc thành một hàng ngang (xem dọc vẫn vừa màn hình); cuộn thứ năm là dấu hỏi chớp nhiễu
    const row = document.createElement('div');
    row.className = 'tr-tapes';
    row.innerHTML = TR_TAPES.map(([c, t], i) => '<div class="tr-tape' + (i === 4 ? ' q' : '') + '" style="--c:' + c + '">' + cassette(t) + '</div>').join('');
    ov.insertBefore(row, $('tr-card'));
    const tapes = row.children;
    for (const [i, t] of [19.17, 19.8, 20.42, 21.05].entries()) { await at(t); tapes[i].classList.add('in'); fx.clack(); }
    await at(22.3);
    tapes[4].classList.add('in'); fx.glitch(); beat();
    // Cú đánh lớn, nhạc chuyển sang No Time for Caution
    await at(24.18);
    row.classList.add('judge');
    await card('Chỉ một cuộn là thật.', '', 24.18, 25.81, { hit: 'big' });
    row.classList.add('out');
    // Phòng ngủ đêm
    await cut(26.18, () => { go('r2'); cam('scale(1.28) translate(-6%, 2%)', 0); });
    await sleep(50);
    cam('scale(1.28) translate(-18%, 2%)', 2800);
    await at(28.18);
    fx.robot(); S.done.robot = true; render();
    // Sân đình
    await cut(29.18, () => { go('r3'); cam('scale(1.05)', 0); });
    await at(30.18);
    S.items.key = true; S.done.gate = true; render(); fx.gate(); shake();
    cam('scale(1.32) translate(0, 6%)', 2300);
    await at(31.18);
    S.done.words = true; render(); beat();
    // Cắt nhanh theo nửa phách
    await cut(32.18, () => { go('r1'); cam('scale(1.65) translate(14%, -8%)', 0); S.done.jig = true; }, true);
    await cut(32.68, () => { go('r2'); cam('scale(1.6) translate(6%, -10%)', 0); S.done.case = true; S.done.pillow = true; }, true);
    await cut(33.18, () => { go('r3'); cam('scale(1.9) translate(0, 14%)', 0); }, true);
    // Cao trào: ba chữ trên ba phách, "Một bí mật." đúng cú vỡ oà của bản nhạc
    await at(33.68);
    black(true);
    riser(2.4);
    await card('Ba căn phòng.', '', 34.18, 34.96, { hit: true });
    await card('Năm cuộn băng.', '', 35.18, 35.96, { hit: true });
    await card('Một bí mật.', '', 36.18, 37.31, { hit: 'big' });
    // Sóng organ thứ hai: lướt nhanh qua ba phòng, rồi dội lại đúng lúc máy quay lao vào chiếc TV
    await cut(37.68, () => { black(false); go('r2'); cam('scale(1.45) translate(-10%, 4%)', 0); }, true);
    cam('scale(1.6) translate(-14%, 4%)', 500);
    await cut(38.18, () => { go('r3'); cam('scale(1.4) translate(0, 8%)', 0); }, true);
    cam('scale(1.55) translate(0, 10%)', 500);
    await cut(38.68, () => { go('r1'); S.done.jig = true; cam('scale(1.1) translate(0, 4%)', 0); }, true);
    await at(39.17);
    hit(true); whip();
    cam('scale(1.5) translate(0, 8%)', 1300);
    // Nhạc tụt về tiếng tích‑tắc: về lại chiếc TV, máy quay zoom dần vào màn hình, chữ méo giật, lời hẹn, rồi TV tắt và cháy nổ nhẹ
    await at(40.68);
    replay($('tr-dip'), 'go'); shake(true);
    await TV.tease(['Tín hiệu yếu…', 'Đang tua lại…', 'Hẹn em ở cuộn băng thật.'], () => cam('scale(2.45) translate(0, 21%)', 6200), true);
    // Tín hiệu quá tải: băng tự huỷ, đếm 3, 2, 1 đúng ba tiếng tích‑tắc, mỗi số máy quay giật sát vào thêm
    await TV.selfDestruct(at, 49.44, [50.69, 51.92, 53.18], (i) => { cam('scale(' + (2.62 + i * 0.17) + ') translate(0, 21%)', 140); shake(i === 2); });
    // Hết số: chập điện, rồi nổ đúng tiếng tích kế tiếp (54.43)
    await at(54.08);
    cam('scale(1.4) translate(0, 27%)', 1900); // máy quay lùi ra, hạ khung xuống: thấy trọn lửa trên nóc TV và cột khói
    setTimeout(() => shake(true), 350); // rung đúng lúc nổ bóng
    await TV.burn();
    black(true);
    // Im lặng, rồi BĂNG SỐ 1. Neon chập chờn: nhạc lùi xuống thật nhỏ cho tiếng "tít" vang trong khoảng lặng;
    // đèn sáng hẳn đúng tiếng bùng của Mountains thì nhạc dâng lên, ngân dài rồi tự tắt dần.
    await at(57.53);
    mix.to(0.15, 0.3);
    hit(true);
    await brokenSign(57.7, 62);
    mix.to(0.85, 0.4); // đoạn kết đã nhỏ hơn 5 dB trong file nhạc, không làm giật mình người đeo tai nghe
    await at(64.2);
    $('tr-end').hidden = false;
    $('tr-again').addEventListener('click', () => location.reload());
  }

  // Mặt đồng hồ quả lắc cũ cho đoạn mở màn trailer: vành đồng, mặt ngà, kim đen, kim giây đỏ.
  function clockFace() {
    const marks = Array.from({ length: 60 }, (_, i) => '<line class="' + (i % 5 ? 'mn' : 'hr') + '" x1="100" y1="' + (i % 5 ? 21 : 19) + '" x2="100" y2="' + (i % 5 ? 26 : 32) + '" transform="rotate(' + i * 6 + ' 100 100)"/>').join('');
    return '<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="rim" cx="100" cy="100" r="96"/><circle class="face" cx="100" cy="100" r="86"/>' + marks
      + '<path class="hh" d="M96 106 L98.6 56 Q100 50 101.4 56 L104 106 Z"/><path class="mh" d="M97.6 108 L99.3 30 Q100 25 100.7 30 L102.4 108 Z"/>'
      + '<g class="sh"><line x1="100" y1="120" x2="100" y2="24"/><circle cx="100" cy="100" r="4.5"/></g><circle class="pin" cx="100" cy="100" r="2"/></svg>';
  }

  // Năm cuộn băng trong trailer: mỗi cuộn một màu nhãn, cuộn cuối không nhãn, chỉ có dấu hỏi.
  const TR_TAPES = [['#E9C77B', '01'], ['#8FB8DE', '02'], ['#9CCB98', '03'], ['#E88A7A', 'Số 1'], ['none', '?']];
  function cassette(t) {
    return '<svg viewBox="0 0 100 64" aria-hidden="true"><rect class="sh" x="2" y="2" width="96" height="60" rx="6"/>'
      + '<rect class="lb" x="10" y="7" width="80" height="27" rx="3"/><text x="50" y="27">' + t + '</text>'
      + '<rect class="wn" x="24" y="38" width="52" height="17" rx="8.5"/><circle class="rl" cx="37" cy="46.5" r="5"/><circle class="rl" cx="63" cy="46.5" r="5"/></svg>';
  }

  // Nhịp nháy của biển neon lúc bật (bật / tắt, mili giây), cả đoạn khoảng 1,6 giây.
  const NEON = [[1, 140], [0, 80], [1, 60], [0, 110], [1, 50], [0, 260], [1, 90], [0, 60], [1, 40], [0, 70], [1, 70], [0, 180]].map(([on, ms]) => [on, ms * 1.35]);


  const fx = TV.sfx;

  window.HoiUcRoom = { say, power };
  render();
  if (TRAILER) runTrailer();
  const tryOpen = TRY && ({ vali: symbolLock, bang: board, maytinh: pc })[TRY];
  if (tryOpen) tryOpen();
})();
