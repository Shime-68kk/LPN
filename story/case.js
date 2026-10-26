// Vụ án "Vạch Lá Tìm Sâu" (mở sau chương 13): bốn chặng suy luận nhẹ nhàng, không tính giờ, sai không bị phạt.
// 1 Hiện trường: vạch lá tìm 3 manh mối · 2 Nhân chứng: ai nói dối, Sâu Tím trốn ở đâu
// 3 Truy tìm: vạch lá sen bắt Sâu Tím (lá nào rung là có gì bên dưới) · 4 Hộp quà: khoá số là giờ em nhận lời.
// Tiến độ lưu chung với cốt truyện (lpn:story.flags: vlts1…vlts4, vltsGift, vltsDone) nên được sync.js sao lưu.
'use strict';
(() => {
  // Lượt điều tra: 'vlts' là bản đầu (không có tấm ảnh); 'vlts2' mở lại hồ sơ để em chơi bản mới.
  // Quà chỉ phát một lần cho cả hai lượt (xem grantReward).
  const ID = 'vlts2';
  const GIFT_FLAGS = ['vltsGift', 'vlts2Gift'];
  const CHAPTER = 'c13';
  const STEPS = 4;
  // Quà to khi mở được hộp: skin chỉ có ở vụ án này, đốt cây (đúng bằng 23:38) và hộp quà mở miễn phí.
  const REWARD = { skin: 'tham-tu', dot: 2338, boxes: 20 };
  const CODE = '2338';
  const TAU = Math.PI * 2;
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('vi-VN');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const rand = (a, b) => a + Math.random() * (b - a);

  // ================= Nội dung =================
  const GARDEN = [
    { id: 'thu1', kind: 'clue', ic: '📜', title: 'Mảnh thư rách số 1', quote: '“Mật mã hộp quà là giờ và phút…”',
      note: 'Nét chữ nghiêng nghiêng, đúng là chữ của anh.', clue: 'Mảnh thư 1: “Mật mã hộp quà là giờ và phút…”' },
    { id: 'thu2', kind: 'clue', ic: '📜', title: 'Mảnh thư rách số 2', quote: '“…em nhận lời yêu anh.”',
      note: 'Góc thư dính một vệt màu tím. Thủ phạm để lại dấu vết rồi.', clue: 'Mảnh thư 2: “…em nhận lời yêu anh.”' },
    { id: 'sen', kind: 'clue', ic: '🌸', title: 'Một cánh sen hồng', quote: '',
      note: 'Vườn Lá làm gì có sen. Cánh hoa còn tươi, chắc ai đó vừa mang tới đây.', clue: 'Một cánh sen hồng còn tươi, rơi ở hiện trường.' },
    { id: 'canh', kind: 'decoy', say: 'Cành cây khô thôi. Cong cong, nhìn thoáng qua cũng giống sâu thật.' },
    { id: 'soi', kind: 'decoy', say: 'Bạn Sâu Róm đang ngủ. Sâu Tím đâu có lông lá xù xì thế này.' },
    { id: 'nam', kind: 'decoy', say: 'Một cây nấm nhỏ. Không phải manh mối, nhưng xinh.' },
  ];
  const POND = [
    { id: 'worm', kind: 'worm' },
    { id: 'ech', kind: 'decoy', say: 'Ộp! Nhầm rồi, tớ là Ếch Xanh. Sâu Tím vừa bò qua đây đấy.' },
    { id: 'ca', kind: 'decoy', say: 'Bạn Cá Vàng: “Blub blub.” (Dịch ra là: không phải tớ.)' },
  ];
  const CAUGHT = [
    'Hí hí, bị thấy rồi! Nhưng chưa bắt được đâu nha!',
    'Ơ, nhanh thế! Lần này anh trốn kỹ hơn cơ…',
    'Thôi thôi, anh chịu thua. Thám tử Thủy giỏi quá đi mất!',
  ];
  const WITNESSES = [
    { id: 'bo-rua', av: '🐞', name: 'Bọ Rùa', say: 'Tớ thấy Sâu Tím bò về phía loài hoa mà cậu ấy từng chạy khắp Thái Nguyên để tìm.',
      fb: 'Nếu Bọ Rùa nói dối, thì Ốc Sên và Châu Chấu đều nói thật. Nhưng hai bạn ấy nói ngược nhau mà, đâu thể cùng đúng?' },
    { id: 'oc-sen', av: '🐌', name: 'Ốc Sên', say: 'Sâu Tím chui vào luống cải rồi. Tớ thấy tận mắt!', liar: true },
    { id: 'chau-chau', av: '🦗', name: 'Châu Chấu', say: 'Ốc Sên nói sai đấy. Sâu Tím không có ở luống cải đâu.',
      fb: 'Nếu Châu Chấu nói dối, thì Bọ Rùa và Ốc Sên đều nói thật. Nhưng một bạn chỉ về phía một loài hoa, một bạn chỉ luống cải. Sâu Tím đâu thể ở hai nơi cùng lúc?' },
  ];
  const LIAR_OK = 'Chuẩn! Ốc Sên và Châu Chấu nói ngược nhau, nên chắc chắn một trong hai bạn nói dối. Vậy Bọ Rùa nói thật, mà Bọ Rùa chỉ về phía một loài hoa chứ không phải luống cải. Ốc Sên lộ rồi nhé!';
  const CONFESS = 'Ốc Sên lí nhí: “Hì… Sâu Tím nhờ tớ nói thế. Cậu ấy bảo phải làm khó thám tử một chút.”';
  const PLACES = [
    { id: 'cai', ic: '🥬', name: 'Luống cải', fb: 'Ốc Sên nói dối mà, nhớ không? Luống cải chính là chỗ Sâu Tím không trốn.' },
    { id: 'hong', ic: '🌹', name: 'Giàn hoa hồng', fb: 'Hoa hồng thì ở đâu chẳng có, cần gì chạy khắp Thái Nguyên. Nhớ lại chương 8 xem, hôm 6/8 anh ôm về loài hoa gì?' },
    { id: 'sen', ic: '🪷', name: 'Bụi sen hồng', ok: true },
    { id: 'bang', ic: '🌳', name: 'Gốc cây bàng', fb: 'Bọ Rùa nói thật, và bạn ấy chỉ về phía một loài hoa. Cây bàng đâu phải hoa.' },
  ];
  const PLACE_OK = 'Đúng rồi! 15 bông sen hồng cuối cùng ở chợ Thái, gom từ 3 cửa hàng. Cánh sen rơi ở hiện trường cũng là manh mối đó. Sâu Tím đang trốn ở bụi sen hồng!';
  // Không bắt em phải nhớ: tấm ảnh đêm 6/8 có đồng hồ chỉ 11:38 và cửa sổ trời tối, tự suy ra 23:38.
  const LOCK_HINTS = [
    'Tấm ảnh anh đánh rơi chụp đúng lúc em nhận lời. Soi chiếc đồng hồ treo tường trong ảnh xem.',
    'Kim dài chỉ phút: nó nằm giữa số 7 và số 8. Số 7 là 35 phút, đếm thêm 3 vạch nhỏ nữa.',
    'Kim ngắn nằm giữa số 11 và 12, vậy là 11 giờ hơn. Nhưng nhìn ra cửa sổ: trời tối, có trăng. 11 giờ đêm thì ghi là mấy giờ?',
    'Thôi anh nói luôn: 23:38. Đúng 23 giờ 38 phút đêm 6/8, sinh nhật anh.',
  ];
  const LOCK_WRONG = ['Chưa đúng rồi. Soi lại tấm ảnh xem nào.', 'Khoá vẫn cứng ngắc. Đồng hồ trong ảnh chỉ mấy giờ nhỉ?', 'Gần lắm rồi đó, thám tử!'];
  // Nhập gần đúng thì nhắc đúng chỗ sai.
  const lockNear = (code) => {
    const hh = code.slice(0, 2), mm = code.slice(2);
    if (code === '1138') return 'Đọc đồng hồ chuẩn rồi đó! Nhưng ngoài cửa sổ trời đang tối om. 11 giờ đêm thì khoá này phải ghi là mấy giờ?';
    if (hh === '23') return 'Giờ đúng rồi! Giờ đếm lại kim dài xem: giữa số 7 và số 8, thêm mấy vạch?';
    if (mm === '38') return hh === '11' ? '' : 'Phút đúng rồi! Còn giờ thì xem kim ngắn, rồi nhìn ra cửa sổ: trời sáng hay tối?';
    if (hh === '11') return 'Kim ngắn đọc đúng rồi, nhưng trời bên ngoài đang tối. Với lại đếm lại kim dài nữa nha.';
    return '';
  };

  // Tấm ảnh đêm 6/8: phòng tối, cửa sổ có trăng, đồng hồ treo tường 11:38, bình sen hồng, bánh kem, hai bé.
  function photoSVG() {
    const cx = 80, cy = 80, rr = 54;
    const at = (deg, r) => [cx + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)];
    let ticks = '', nums = '';
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0;
      const [x1, y1] = at(i * 6, big ? rr - 11 : rr - 7), [x2, y2] = at(i * 6, rr - 3);
      ticks += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="#3A2614" stroke-width="' + (big ? 2.2 : 1) + '" />';
    }
    for (let n = 1; n <= 12; n++) {
      const [x, y] = at(n * 30, rr - 20);
      nums += '<text x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="middle">' + n + '</text>';
    }
    const [hx, hy] = at((11 + 38 / 60) * 30, 27), [mx, my] = at(38 * 6, 41);
    const star = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#FFF4D6" />';
    return '<svg viewBox="0 0 300 240" aria-hidden="true">'
      + '<defs><radialGradient id="pg-candle" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD66B" stop-opacity=".55" /><stop offset="1" stop-color="#FFD66B" stop-opacity="0" /></radialGradient>'
      + '<linearGradient id="pg-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14102E" /><stop offset="1" stop-color="#2C2463" /></linearGradient></defs>'
      + '<rect width="300" height="240" fill="#3A2F5E" />'
      + '<rect x="186" y="18" width="98" height="112" rx="6" fill="url(#pg-glass)" stroke="#8C7AB8" stroke-width="5" />'
      + '<path d="M235 18v112M186 74h98" stroke="#8C7AB8" stroke-width="4" />'
      + '<circle cx="260" cy="44" r="13" fill="#FFF1C9" /><circle cx="266" cy="39" r="11" fill="#17123A" />'
      + star(204, 34, 1.6) + star(220, 54, 1.2) + star(208, 100, 1.4) + star(258, 96, 1.6) + star(272, 112, 1.1) + star(246, 60, 1.1)
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rr + 4) + '" fill="#6E4426" />'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + rr + '" fill="#FFF8EF" />'
      + ticks
      + '<g font-family="Be Vietnam Pro, sans-serif" font-size="11" font-weight="700" fill="#3A2614">' + nums + '</g>'
      + '<path d="M' + cx + ' ' + cy + 'L' + hx.toFixed(1) + ' ' + hy.toFixed(1) + '" stroke="#2A1E3D" stroke-width="5" stroke-linecap="round" />'
      + '<path d="M' + cx + ' ' + cy + 'L' + mx.toFixed(1) + ' ' + my.toFixed(1) + '" stroke="#2A1E3D" stroke-width="3" stroke-linecap="round" />'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#B0412E" />'
      + '<rect y="186" width="300" height="54" fill="#6B4A32" /><rect y="186" width="300" height="5" fill="#8A6244" />'
      + '<circle cx="205" cy="150" r="46" fill="url(#pg-candle)" />'
      // bình sen hồng (đặt bên phải, không che mặt đồng hồ)
      + '<g transform="translate(216 0)">'
      + '<path d="M30 160h34l-4 28H34z" fill="#8EC5FF" /><path d="M34 166h26" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="2" />'
      + '<path d="M40 160C38 140 30 128 26 122M47 160c0-18 2-30 4-40M54 160c4-14 12-24 18-28" stroke="#3F8C5A" stroke-width="2.5" fill="none" />'
      + '<g fill="#FF9DB4"><ellipse cx="26" cy="118" rx="7" ry="11" transform="rotate(-20 26 118)" /><ellipse cx="51" cy="114" rx="7" ry="12" /><ellipse cx="73" cy="128" rx="7" ry="11" transform="rotate(25 73 128)" /></g>'
      + '<g fill="#FFC2D1"><ellipse cx="22" cy="120" rx="4" ry="8" transform="rotate(-30 22 120)" /><ellipse cx="46" cy="116" rx="4" ry="9" transform="rotate(-12 46 116)" /><ellipse cx="56" cy="116" rx="4" ry="9" transform="rotate(12 56 116)" /></g>'
      + '</g>'
      // hai bé và trái tim
      + '<rect x="102" y="146" width="24" height="40" rx="12" fill="#B79CF0" /><rect x="130" y="152" width="22" height="34" rx="11" fill="#FFB0C0" />'
      + '<g fill="#2A1E3D"><circle cx="110" cy="160" r="1.8" /><circle cx="118" cy="160" r="1.8" /><circle cx="137" cy="165" r="1.8" /><circle cx="145" cy="165" r="1.8" /></g>'
      + '<path d="M127 136c-2.5-3.5-8-2-6.5 2.2c1 2.6 6.5 6 6.5 6s5.5-3.4 6.5-6c1.5-4.2-4-5.7-6.5-2.2z" fill="#FF4F7B" />'
      // bánh kem có nến
      + '<rect x="180" y="160" width="52" height="26" rx="5" fill="#FFE0EA" /><rect x="180" y="160" width="52" height="8" rx="4" fill="#FF8FA3" />'
      + '<g fill="#FFFFFF"><circle cx="190" cy="172" r="2" /><circle cx="206" cy="175" r="2" /><circle cx="222" cy="172" r="2" /></g>'
      + '<rect x="204" y="144" width="4" height="16" rx="1.5" fill="#8EC5FF" /><path d="M206 132c4 5 3 10 0 11c-3-1-4-6 0-11z" fill="#FFB347" />'
      + '</svg><span class="polaroid-cap">6/8 · Thái Nguyên</span>';
  }
  function openPhoto() {
    SFX.click();
    $('photo-big').innerHTML = photoSVG();
    $('photo-view').hidden = false;
    $('photo-close').focus({ preventScroll: true });
  }
  $('photo-open').addEventListener('click', openPhoto);
  $('photo-close').addEventListener('click', () => { SFX.click(); $('photo-view').hidden = true; });
  $('photo-view').addEventListener('click', (e) => { if (e.target === e.currentTarget) $('photo-view').hidden = true; });
  const EPILOGUE = [
    { who: 'tim', text: 'Thám tử Thủy phá án nhanh thật đấy.' },
    { who: 'tim', text: 'Nhưng mà… còn một vụ nữa, anh chưa báo với ai.' },
    { who: 'tim', text: 'Từ một chiều mưa, sau bốn mươi tiếng chưa chợp mắt, anh bị mất một thứ. Đến giờ vẫn chưa lấy lại được.' },
    { who: 'tim', text: 'Thứ bị mất là trái tim anh. Vậy thủ phạm là ai?' },
    { choice: [
      { text: 'Bọ Rùa', wrong: 'Bọ Rùa là nhân chứng thật thà nhất vườn đấy. Oan cho bạn ấy quá.' },
      { text: 'Ốc Sên', wrong: 'Ốc Sên chỉ nói dối đúng một lần, mà còn là anh nhờ. Không phải đâu.' },
      { text: 'Là em đó' },
    ] },
    { who: 'tim', text: 'Chính xác. Thủ phạm là em.', heart: true },
    { who: 'tim', text: 'Án xử như sau: phạt em ở bên anh thật lâu. Không được kháng cáo.' },
    { who: 'ke', text: 'Hồ sơ vụ án Vạch Lá Tìm Sâu chính thức khép lại. Còn câu chuyện của hai đứa thì vẫn đang viết tiếp…' },
  ];

  // ================= Trời ngày / đêm =================
  const NIGHT = (() => {
    // Đã đoán sẵn trong <head> (cùng cách với mọi trang) thì dùng luôn.
    if (window.LPN_SKY) return !!window.LPN_NIGHT;
    try {
      const s = JSON.parse(localStorage.getItem('lpn:sky'));
      if (s && s.sky && Date.now() - s.at < 6 * 3600e3) return s.sky === 'dem';
    } catch (e) { /* bỏ qua */ }
    const h = new Date().getHours();
    return h >= 18 || h < 5;
  })();
  document.body.classList.toggle('night', NIGHT);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', NIGHT ? '#2A2118' : '#F3E3C3');

  // ================= Lưu tiến độ (chung với cốt truyện) =================
  const SAVE_KEY = 'lpn:story';
  const load = () => {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { /* bỏ qua */ }
    v = v && v.done && v.ver === 2 ? v : { done: {}, flags: {}, ver: 2 };
    v.flags = v.flags || {};
    v.open = v.open || {};
    return v;
  };
  let save = load();
  const flag = (k) => !!save.flags[ID + k];
  function setFlag(k) {
    save = load();
    save.flags[ID + k] = true;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ }
    if (window.Sync) window.Sync.dirty();
  }
  const stepDone = (n) => flag(String(n));
  const firstOpen = () => { for (let n = 1; n <= STEPS; n++) if (!stepDone(n)) return n; return STEPS + 1; };

  // Phát quà một lần (đánh dấu vltsGift; máy khác đồng bộ về cũng không phát lại).
  function grantReward() {
    save = load();
    if (GIFT_FLAGS.some((k) => save.flags[k])) return false;
    Wallet.update((w) => {
      const k = 'skin:' + REWARD.skin;
      if (!w.owned[k]) w.owned[k] = Date.now();
      w.dot += REWARD.dot;
      w.freeBoxes = (w.freeBoxes || 0) + REWARD.boxes;
    });
    save.flags[ID + 'Gift'] = true;
    save.flags[ID + '4'] = true;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ }
    if (window.Sync) window.Sync.dirty();
    return true;
  }

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
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    } catch (e) { /* không có âm thanh cũng không sao */ }
  }
  const SFX = {
    click() { tone(560, 0.06, 0.04); },
    find() { tone(784, 0.14, 0.07); tone(1175, 0.22, 0.07, 0.1); },
    meh() { tone(330, 0.16, 0.05, 0, 'triangle'); },
    no() { tone(220, 0.2, 0.07, 0, 'triangle'); tone(196, 0.24, 0.06, 0.12, 'triangle'); },
    ok() { [523, 659, 784].forEach((f, i) => tone(f, 0.18, 0.07, i * 0.09)); },
    tick() { tone(1400, 0.03, 0.03, 0, 'square'); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 0.07, i * 0.11)); },
  };
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* bỏ qua */ } };
  document.addEventListener('pointerdown', () => { if (actx && actx.state !== 'running') actx.resume(); }, { passive: true });

  // ================= Màn hình & các chặng =================
  const SCREENS = ['s-cover', 's-field', 's-witness', 's-lock', 's-finale'];
  let replay = false; // điều tra lại từ đầu sau khi đã phá án: không ghi tiến độ, không phát quà lại
  let current = 0;
  function show(id) {
    for (const s of SCREENS) $(s).hidden = s !== id;
    window.scrollTo(0, 0);
  }
  function renderTrack() {
    document.querySelectorAll('#track li').forEach((li) => {
      const n = +li.dataset.step;
      const done = replay ? n < current : stepDone(n);
      li.classList.toggle('done', done);
      li.classList.toggle('now', n === current);
    });
  }

  function renderCover() {
    current = 0;
    stopField();
    show('s-cover');
    renderTrack();
    const solved = flag('Done');
    const read = !!save.done[CHAPTER] || firstOpen() > 1 || solved;
    const stamp = $('cover-stamp');
    stamp.textContent = solved ? 'Đã phá án' : 'Tuyệt mật';
    stamp.classList.toggle('solved', solved);
    $('cover-read').hidden = read;
    $('cover-go').hidden = !read;
    $('cover-replay').hidden = !solved;
    const next = firstOpen();
    if (!read) {
      $('cover-note').textContent = 'Hồ sơ này mở ra ở cuối chương 11. Đọc chương trước để biết Sâu Tím trốn đi thế nào nha.';
    } else if (solved) {
      $('cover-note').textContent = 'Hồ sơ đã khép lại. Thủ phạm đã bị bắt, quà đã vào túi thám tử.';
      $('cover-go').textContent = 'Xem biên bản kết án';
    } else if (next > STEPS) {
      $('cover-note').textContent = 'Hộp quà đã mở. Còn một chút nữa thôi là khép hồ sơ.';
      $('cover-go').textContent = 'Xem kết án';
    } else if (next > 1) {
      $('cover-note').textContent = 'Đã qua ' + (next - 1) + '/' + STEPS + ' chặng. Manh mối cũ vẫn nằm trong sổ tay.';
      $('cover-go').textContent = 'Điều tra tiếp · Chặng ' + next;
    } else {
      $('cover-note').textContent = 'Bốn chặng, không tính giờ, sai cũng không bị phạt. Cứ bình tĩnh suy luận như một thám tử thật.';
      $('cover-go').textContent = 'Mở hồ sơ';
    }
  }

  function startStep(n) {
    current = n;
    renderTrack();
    if (n === 1) startField('garden');
    else if (n === 2) startWitness();
    else if (n === 3) startField('pond');
    else if (n === 4) startLock();
    else startFinale();
  }
  function completeStep(n) {
    if (!replay) setFlag(String(n));
    notesDirty();
    startStep(n + 1);
  }

  // ================= Thẻ manh mối =================
  let popThen = null;
  function pop(o) {
    $('pop-ic').textContent = o.ic || '🔍';
    $('pop-kicker').textContent = o.kicker || 'Manh mối mới';
    $('pop-title').textContent = o.title;
    $('pop-quote').textContent = o.quote || '';
    $('pop-note').textContent = o.note || '';
    $('pop-ok').textContent = o.ok || 'Ghi vào sổ';
    popThen = o.then || null;
    $('pop').hidden = false;
    $('pop-ok').focus({ preventScroll: true });
  }
  $('pop-ok').addEventListener('click', () => {
    SFX.click();
    $('pop').hidden = true;
    const f = popThen;
    popThen = null;
    if (f) f();
  });

  // ================= Sổ tay =================
  const sessionFound = {};
  function notesDirty() { $('notes-dot').hidden = false; }
  function renderNotes() {
    const list = $('clues');
    list.replaceChildren();
    const s1 = replay ? current > 1 : stepDone(1), s2 = replay ? current > 2 : stepDone(2);
    const s3 = replay ? current > 3 : stepDone(3), s4 = replay ? current > 4 : stepDone(4);
    const rows = [];
    for (const it of GARDEN) if (it.kind === 'clue' && (s1 || sessionFound[it.id])) rows.push([it.ic, it.clue]);
    if (s1) rows.push(['🧩', 'Ghép hai mảnh thư: “Mật mã hộp quà là giờ và phút em nhận lời yêu anh.”']);
    if (s2) rows.push(['🐌', 'Ốc Sên nói dối. Bọ Rùa và Châu Chấu nói thật. Sâu Tím trốn ở bụi sen hồng.']);
    if (s3) rows.push(['🐛', 'Đã bắt được Sâu Tím ở bụi sen. Cậu ấy ôm một hộp quà khoá bốn số.']);
    if (s3) rows.push(['📷', 'Tấm ảnh đêm 6/8 Sâu Tím đánh rơi: có đồng hồ treo tường, ngoài cửa sổ trời tối.']);
    if (s4) rows.push(['🔓', 'Mật mã hộp quà: 23:38. Đêm 6/8, em nhận lời.']);
    if (!rows.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Chưa có gì. Ra hiện trường vạch lá thôi!';
      list.appendChild(li);
    }
    for (const [ic, text] of rows) {
      const li = document.createElement('li');
      const a = document.createElement('span');
      a.textContent = ic;
      const b = document.createElement('span');
      b.textContent = text;
      li.append(a, b);
      list.appendChild(li);
    }
  }
  $('btn-notes').addEventListener('click', () => {
    SFX.click();
    renderNotes();
    $('notes-dot').hidden = true;
    $('notes').hidden = false;
  });
  const closeNotes = () => { $('notes').hidden = true; };
  $('notes-close').addEventListener('click', closeNotes);
  $('notes-back').addEventListener('click', closeNotes);

  // ================= Vẽ sâu (dùng chung hình của Tiệm Sâu) =================
  const TIM = Skins.get('skin', 'tim');
  const DETECTIVE = Skins.get('skin', REWARD.skin);
  // Như Skins.drawPreview nhưng chỉnh được nét mặt (vui, chớp mắt…).
  function drawWorm(x, item, size, t, face) {
    const S = size / 90;
    const r = 21 * S * 0.95, sr = 16.5 * S * 0.95;
    x.save();
    x.translate(-r * 0.15, r * 0.95);
    for (let k = 2; k >= 1; k--) {
      x.save();
      x.translate(k * sr * 0.95, k * sr * 0.7);
      Skins.drawSegment(x, sr, item, k === 2 ? 2 : 1, S);
      x.restore();
    }
    x.restore();
    x.save();
    x.translate(-r * 0.15, -r * 0.05);
    Skins.drawHead(x, r, item, Object.assign({ t, ant: Math.sin(t * 2) * 2 * S, bob: 0, happy: 0, blink: 0, sad: 0, chew: 0, mouthOpen: 0 }, face || {}), S);
    x.restore();
  }

  // ================= Vạch lá (chặng 1 và 3) =================
  const F = {
    on: false, kind: '', c: null, x: null, W: 0, H: 0, bg: null,
    leaves: [], items: [], parts: [],
    ptr: { x: 0, y: 0, down: false, id: null },
    t: 0, last: 0, R: 66, found: 0, need: 3, idle: 0, raf: 0,
    glow: null, rustle: { next: 2, until: 0, strong: false, set: [] }, busy: false, toastT: 0,
  };
  const GREENS = ['#2F7442', '#3A8550', '#46955C', '#4FA265', '#5BB070', '#69BD7B', '#78C887'];
  const PADS = ['#3F8A4E', '#4A9858', '#55A562', '#5FB06B'];

  function stopField() {
    F.on = false;
    cancelAnimationFrame(F.raf);
  }

  function sizeField() {
    const wrap = $('field-wrap');
    const W = Math.round(wrap.clientWidth);
    const H = Math.round(Math.max(320, Math.min(500, window.innerHeight - 330)));
    const c = $('field');
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
    c.style.height = H + 'px';
    return [W, H];
  }

  // Đặt đồ vật cách nhau, tránh mép và góc có số đếm.
  function placeItems(defs, W, H) {
    const out = [];
    for (const d of defs) {
      let best = null;
      for (let k = 0; k < 400; k++) {
        const p = { x: rand(40, W - 40), y: rand(48, H - 40) };
        if (p.x < 140 && p.y < 60) continue;
        const gap = Math.min(...out.map((o) => Math.hypot(o.x - p.x, o.y - p.y)), 999);
        if (!best || gap > best.gap) best = { x: p.x, y: p.y, gap };
        if (gap > 96) break;
      }
      out.push(Object.assign({ x: best.x, y: best.y, r: d.kind === 'worm' ? 26 : 22, dwell: 0, state: 'hidden', seen: false, gone: false, fly: 0, rot: rand(-0.4, 0.4) }, d));
    }
    return out;
  }

  function makeLeaves(kind, W, H, items) {
    const leaves = [];
    const pond = kind === 'pond';
    const step = pond ? 46 : 30;
    for (let y = -step / 2; y < H + step; y += step) {
      for (let x = -step / 2; x < W + step; x += step) {
        const hx = x + rand(-step * 0.45, step * 0.45), hy = y + rand(-step * 0.45, step * 0.45);
        leaves.push(newLeaf(kind, hx, hy));
      }
    }
    // xáo trộn để lá chồng lên nhau tự nhiên, lá dưới tối hơn
    for (let i = leaves.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [leaves[i], leaves[j]] = [leaves[j], leaves[i]]; }
    // mỗi món đồ có thêm vài lá phủ kín ngay trên đầu
    for (const it of items) for (let k = 0; k < 3; k++) {
      const l = newLeaf(kind, it.x + rand(-9, 9), it.y + rand(-9, 9));
      l.cover = it;
      leaves.push(l);
    }
    if (pond) {
      // vài bông sen hồng nổi trên lá
      for (let k = 0; k < 5; k++) {
        const l = newLeaf(kind, rand(30, W - 30), rand(40, H - 30));
        l.flower = true;
        l.rad = rand(17, 21);
        l.len = l.wid = l.rad * 2;
        leaves.push(l);
      }
    }
    const n = leaves.length;
    leaves.forEach((l, i) => {
      const pal = pond ? PADS : GREENS;
      const k = Math.min(pal.length - 1, Math.max(0, Math.round((i / n) * (pal.length - 1) + rand(-1, 1))));
      l.col = pal[k];
    });
    return leaves;
  }
  function newLeaf(kind, hx, hy) {
    const pond = kind === 'pond';
    const len = pond ? rand(62, 86) : rand(48, 70);
    return {
      hx, hy, x: hx, y: hy, vx: 0, vy: 0,
      ang: rand(0, TAU), spin: 0, len, wid: pond ? len : len * rand(0.5, 0.6), rad: len / 2,
      ph: rand(0, TAU), col: '#4FA265', pond, flower: false, cover: null, cs: 1, sn: 0,
    };
  }

  function startField(kind) {
    stopField();
    show('s-field');
    const garden = kind === 'garden';
    $('field-kicker').textContent = garden ? 'Chặng 1 · Hiện trường' : 'Chặng 3 · Truy tìm';
    $('field-brief').textContent = garden
      ? 'Vệt bò mất hút dưới đám lá này. Vuốt ngón tay để vạch lá ra, tìm 3 manh mối Sâu Tím để lại. Dưới lá còn mấy thứ chẳng liên quan đâu, đừng để bị lừa nha.'
      : 'Bụi sen hồng đây rồi. Sâu Tím đang nín thở dưới mấy tán lá sen. Mẹo của thám tử: lá nào khẽ rung rung là có gì đó ở bên dưới.';
    $('field-tip').classList.remove('off');
    $('field-toast').hidden = true;
    const [W, H] = sizeField();
    Object.assign(F, { on: true, kind, W, H, found: 0, need: 3, idle: 0, t: 0, last: performance.now(), glow: null, busy: false, parts: [] });
    F.c = $('field');
    F.x = F.c.getContext('2d');
    F.R = Math.max(58, Math.min(76, W * 0.18));
    F.items = placeItems(garden ? GARDEN : POND, W, H);
    F.leaves = makeLeaves(kind, W, H, F.items);
    F.rustle = { next: 1.6, until: 0, strong: false, set: [] };
    F.bg = paintGround(kind, W, H);
    updateCount();
    F.raf = requestAnimationFrame(fieldFrame);
  }

  function updateCount() {
    $('field-count').textContent = F.kind === 'garden' ? 'Manh mối ' + F.found + '/' + F.need : 'Bắt được ' + F.found + '/' + F.need;
  }

  let toastTimer = 0;
  function fieldToast(text, ms) {
    const el = $('field-toast');
    el.textContent = text;
    el.hidden = false;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms || 2800);
  }

  // Nền vẽ sẵn một lần: đất vườn có vệt bò, hoặc mặt hồ có gợn sóng.
  function paintGround(kind, W, H) {
    const c = document.createElement('canvas');
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
    const x = c.getContext('2d');
    x.scale(DPR, DPR);
    if (kind === 'garden') {
      const g = x.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, '#7A5636');
      g.addColorStop(1, '#4A301C');
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) {
        x.fillStyle = 'rgba(255,240,210,' + rand(0.05, 0.14) + ')';
        x.beginPath(); x.ellipse(rand(0, W), rand(0, H), rand(2, 6), rand(1.5, 4), rand(0, 3), 0, TAU); x.fill();
      }
      // vệt bò ngoằn ngoèo của Sâu Tím
      x.strokeStyle = 'rgba(205,184,240,0.35)';
      x.lineWidth = 7;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(-10, H * 0.85);
      for (let i = 1; i <= 8; i++) x.quadraticCurveTo(i * W * 0.11 - W * 0.05, H * (0.85 - i * 0.06) + (i % 2 ? -22 : 22), i * W * 0.11, H * (0.85 - i * 0.07));
      x.stroke();
    } else {
      const g = x.createRadialGradient(W * 0.4, H * 0.3, 20, W / 2, H / 2, Math.max(W, H) * 0.8);
      g.addColorStop(0, '#7CC3D4');
      g.addColorStop(1, '#2F7E98');
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(255,255,255,0.22)';
      x.lineWidth = 1.6;
      for (let i = 0; i < 26; i++) {
        const cx = rand(0, W), cy = rand(0, H), rr = rand(10, 30);
        x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.35, 0, 0.2, Math.PI - 0.2); x.stroke();
      }
    }
    return c;
  }

  function leafPath(x, L, Wd) {
    x.beginPath();
    x.moveTo(-L, 0);
    x.quadraticCurveTo(-L * 0.15, -Wd * 2, L, 0);
    x.quadraticCurveTo(-L * 0.15, Wd * 2, -L, 0);
    x.closePath();
  }
  function drawLeaf(x, l, a) {
    x.save();
    x.translate(l.x, l.y);
    x.rotate(a);
    if (l.flower) {
      const r = l.rad;
      for (let i = 0; i < 7; i++) {
        x.save();
        x.rotate((i / 7) * TAU);
        x.fillStyle = i % 2 ? '#FF9DB4' : '#FFB8C9';
        x.beginPath(); x.ellipse(0, -r * 0.55, r * 0.32, r * 0.6, 0, 0, TAU); x.fill();
        x.restore();
      }
      x.fillStyle = '#FFE27A';
      x.beginPath(); x.arc(0, 0, r * 0.3, 0, TAU); x.fill();
    } else if (l.pond) {
      const r = l.rad;
      x.fillStyle = 'rgba(10,40,50,0.25)';
      x.beginPath(); x.arc(3, 4, r, 0, TAU); x.fill();
      x.fillStyle = l.col;
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, r, 0.28, TAU - 0.06); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.16)';
      x.lineWidth = 1.4;
      x.beginPath();
      for (let k = 0; k < 9; k++) { const aa = 0.28 + (k / 9) * (TAU - 0.4); x.moveTo(0, 0); x.lineTo(Math.cos(aa) * r * 0.9, Math.sin(aa) * r * 0.9); }
      x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.18)';
      x.beginPath(); x.arc(0, 0, r * 0.12, 0, TAU); x.fill();
    } else {
      const L = l.len / 2, Wd = l.wid / 2;
      x.fillStyle = 'rgba(20,30,10,0.25)';
      x.translate(2.5, 3.5);
      leafPath(x, L, Wd); x.fill();
      x.translate(-2.5, -3.5);
      x.fillStyle = l.col;
      leafPath(x, L, Wd); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.26)';
      x.lineWidth = 1.3;
      x.beginPath();
      x.moveTo(-L * 0.85, 0); x.lineTo(L * 0.8, 0);
      for (const k of [-0.45, 0, 0.42]) {
        x.moveTo(k * L, 0); x.lineTo(k * L + L * 0.28, -Wd * 0.62);
        x.moveTo(k * L, 0); x.lineTo(k * L + L * 0.28, Wd * 0.62);
      }
      x.stroke();
    }
    x.restore();
  }

  // ----- Vẽ các món dưới lá -----
  function paperPath(x, w, h, side) {
    const L = -w / 2, R = w / 2, T = -h / 2, B = h / 2;
    x.beginPath();
    if (side === 1) {
      x.moveTo(L, T); x.lineTo(R - 3, T);
      for (let k = 1; k <= 6; k++) x.lineTo(R + (k % 2 ? 4 : -3), T + (k * h) / 6);
      x.lineTo(L, B);
    } else {
      x.moveTo(R, T); x.lineTo(R, B); x.lineTo(L + 3, B);
      for (let k = 5; k >= 0; k--) x.lineTo(L + (k % 2 ? -4 : 3), T + (k * h) / 6);
    }
    x.closePath();
  }
  function drawItem(x, it, t) {
    x.save();
    x.translate(it.x, it.y);
    if (it.id === 'thu1' || it.id === 'thu2') {
      const side = it.id === 'thu1' ? 1 : 2;
      x.rotate(it.rot * 0.5);
      x.fillStyle = 'rgba(0,0,0,0.25)';
      x.translate(2, 3); paperPath(x, 50, 38, side); x.fill(); x.translate(-2, -3);
      x.fillStyle = '#FFFBF2';
      paperPath(x, 50, 38, side); x.fill();
      x.strokeStyle = '#B39A7A';
      x.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) {
        x.beginPath(); x.moveTo(-18, -9 + i * 8); x.lineTo(i === 2 ? 4 : 16, -9 + i * 8); x.stroke();
      }
      if (side === 1) { x.fillStyle = '#E8455E'; Skins.heartPath(x, 14, 11, 4); x.fill(); }
      else { x.fillStyle = 'rgba(155,93,229,0.55)'; x.beginPath(); x.ellipse(-12, 11, 6, 3.5, 0.4, 0, TAU); x.fill(); }
    } else if (it.id === 'sen') {
      x.rotate(0.7 + it.rot);
      const g = x.createLinearGradient(0, -26, 0, 24);
      g.addColorStop(0, '#FFE0E8'); g.addColorStop(1, '#FF7F9E');
      x.fillStyle = g;
      x.beginPath(); x.moveTo(0, -26); x.bezierCurveTo(19, -14, 16, 16, 0, 24); x.bezierCurveTo(-16, 16, -19, -14, 0, -26); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.55)';
      x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(0, 22); x.lineTo(0, -18); x.moveTo(0, 18); x.quadraticCurveTo(-8, 0, -6, -14); x.moveTo(0, 18); x.quadraticCurveTo(8, 0, 6, -14); x.stroke();
    } else if (it.id === 'canh') {
      x.rotate(it.rot);
      x.strokeStyle = '#8A5E3A';
      x.lineCap = 'round';
      x.lineWidth = 6;
      x.beginPath(); x.moveTo(-28, 8); x.quadraticCurveTo(-2, -16, 28, 4); x.stroke();
      x.lineWidth = 3.5;
      x.beginPath(); x.moveTo(4, -5); x.lineTo(10, -18); x.moveTo(-12, -2); x.lineTo(-18, -14); x.stroke();
    } else if (it.id === 'soi') {
      x.rotate(it.rot);
      for (let i = 0; i < 5; i++) {
        const cx = -22 + i * 11, cy = Math.sin(i * 1.3) * 3;
        x.strokeStyle = '#2A1A10';
        x.lineWidth = 1.2;
        x.beginPath();
        for (let k = 0; k < 8; k++) { const a = -Math.PI + (k / 7) * Math.PI; x.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); x.lineTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11); }
        x.stroke();
        x.fillStyle = i % 2 ? '#C7651F' : '#E08A34';
        x.beginPath(); x.arc(cx, cy, 7.5, 0, TAU); x.fill();
      }
      x.fillStyle = '#5A3518';
      x.beginPath(); x.arc(24, 0, 7, 0, TAU); x.fill();
      x.strokeStyle = '#FFF4D6';
      x.lineWidth = 1.4;
      x.beginPath(); x.moveTo(21, -1); x.lineTo(23.5, -1); x.moveTo(25.5, -1); x.lineTo(28, -1); x.stroke(); // ngủ say
    } else if (it.id === 'nam') {
      x.fillStyle = '#FFF1D6';
      x.beginPath(); x.moveTo(-7, 0); x.lineTo(7, 0); x.lineTo(6, 18); x.quadraticCurveTo(0, 21, -6, 18); x.closePath(); x.fill();
      x.fillStyle = '#E8455E';
      x.beginPath(); x.ellipse(0, 0, 23, 17, 0, Math.PI, TAU); x.closePath(); x.fill();
      x.fillStyle = '#FFFFFF';
      for (const [dx, dy, rr] of [[-11, -6, 3.5], [3, -11, 3], [12, -4, 2.6], [-2, -4, 2.2]]) { x.beginPath(); x.arc(dx, dy, rr, 0, TAU); x.fill(); }
    } else if (it.id === 'ech') {
      x.fillStyle = '#5DAE4E';
      x.beginPath(); x.ellipse(0, 4, 24, 17, 0, 0, TAU); x.fill();
      x.fillStyle = '#C7EBA8';
      x.beginPath(); x.ellipse(0, 9, 14, 9, 0, 0, TAU); x.fill();
      for (const s of [-1, 1]) {
        x.fillStyle = '#5DAE4E'; x.beginPath(); x.arc(s * 11, -10, 8, 0, TAU); x.fill();
        x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(s * 11, -10, 5.5, 0, TAU); x.fill();
        x.fillStyle = '#1E2A14'; x.beginPath(); x.arc(s * 11 + 1, -10, 3, 0, TAU); x.fill();
        x.fillStyle = 'rgba(255,111,142,0.5)'; x.beginPath(); x.ellipse(s * 15, 3, 3.5, 2.2, 0, 0, TAU); x.fill();
      }
      x.strokeStyle = '#1E2A14'; x.lineWidth = 1.8; x.lineCap = 'round';
      x.beginPath(); x.moveTo(-7, 1); x.quadraticCurveTo(0, 6, 7, 1); x.stroke();
    } else if (it.id === 'ca') {
      x.rotate(it.rot);
      x.fillStyle = '#FF9A3C';
      x.beginPath(); x.moveTo(16, 0); x.lineTo(30, -11); x.lineTo(28, 0); x.lineTo(30, 11); x.closePath(); x.fill();
      x.beginPath(); x.ellipse(0, 0, 20, 12, 0, 0, TAU); x.fill();
      x.fillStyle = '#FFC07A';
      x.beginPath(); x.ellipse(-4, 3, 10, 5, 0, 0, TAU); x.fill();
      x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(-11, -3, 4, 0, TAU); x.fill();
      x.fillStyle = '#1E1430'; x.beginPath(); x.arc(-12, -3, 2.2, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 1.4;
      x.beginPath(); x.arc(-26, -14, 3, 0, TAU); x.moveTo(-30, -24); x.arc(-32, -24, 2, 0, TAU); x.stroke();
    } else if (it.kind === 'worm') {
      const happy = it.state === 'giggle' || it.state === 'caught';
      x.scale(-1, 1); // quay mặt sang trái cho khác sâu thám tử
      drawWorm(x, TIM, 74, t, { happy: happy ? 1 : 0, blink: !happy && Math.sin(t * 1.7) > 0.96 ? 1 : 0 });
    }
    x.restore();
  }

  // ----- Kiểm tra đồ vật đã lộ ra chưa -----
  function inLeaf(l, px, py) {
    const dx = px - l.x, dy = py - l.y;
    const rr = l.rad;
    if (dx * dx + dy * dy > rr * rr) return false;
    if (l.pond || l.flower) return true;
    const u = dx * l.cs + dy * l.sn, v = -dx * l.sn + dy * l.cs;
    const a = l.len / 2, b = (l.wid / 2) * 0.85;
    return (u * u) / (a * a) + (v * v) / (b * b) <= 1;
  }
  function coverCount(it) {
    const k = it.r * 0.55;
    const pts = [[0, 0], [k, 0], [-k, 0], [0, k], [0, -k]];
    let n = 0;
    for (const [ox, oy] of pts) {
      const px = it.x + ox, py = it.y + oy;
      for (const l of F.leaves) if (inLeaf(l, px, py)) { n++; break; }
    }
    return n;
  }

  function stepLeaves(dt) {
    const { ptr, R } = F;
    const K = 5, PUSH = 300, damp = Math.exp(-9 * dt);
    const rust = F.t < F.rustle.until;
    for (const l of F.leaves) {
      let ax = (l.hx - l.x) * K, ay = (l.hy - l.y) * K;
      if (ptr.down) {
        const dx = l.x - ptr.x, dy = l.y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const f = (R - d) * PUSH;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
          l.spin += ((dx * ay - dy * ax) / (d * 9000)) * dt;
        }
      }
      l.vx = (l.vx + ax * dt) * damp;
      l.vy = (l.vy + ay * dt) * damp;
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.spin *= Math.exp(-3 * dt);
      let a = l.ang + l.spin + Math.sin(F.t * 1.3 + l.ph) * 0.035;
      if (rust && l.rust) {
        const s = F.rustle.strong ? 1.8 : 1;
        a += Math.sin(F.t * 38 + l.ph) * 0.1 * s;
        l.x += Math.sin(F.t * 47 + l.ph) * 0.6 * s;
      }
      l.a = a;
      l.cs = Math.cos(a);
      l.sn = Math.sin(a);
    }
  }

  // Lá phía trên Sâu Tím khẽ rung theo nhịp, gợi ý cho thám tử tinh mắt.
  function stepRustle() {
    if (F.kind !== 'pond') return;
    const w = F.items.find((i) => i.kind === 'worm');
    const rs = F.rustle;
    if (!w || w.state !== 'hidden') { rs.until = 0; return; }
    if (F.t >= rs.next) {
      rs.until = F.t + (rs.strong ? 1.1 : 0.7);
      rs.next = F.t + (rs.strong ? 1.8 : 2.8);
      for (const l of F.leaves) l.rust = Math.hypot(l.x - w.x, l.y - w.y) < l.rad + 6;
    }
  }

  function checkItems(dt) {
    if (F.busy || !$('pop').hidden) return;
    for (const it of F.items) {
      if (it.gone || it.state !== 'hidden' || (it.kind === 'decoy' && it.seen)) continue;
      const vis = coverCount(it) <= 1;
      it.dwell = vis ? it.dwell + dt : 0;
      if (it.dwell >= 0.22) { it.dwell = 0; onFound(it); break; }
    }
  }

  function sparkle(x0, y0, n, colors) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(60, 200);
      F.parts.push({ x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rand(0.5, 0.9), max: 0.9, s: rand(3, 6), c: colors[i % colors.length] });
    }
  }

  function onFound(it) {
    F.idle = 0;
    F.glow = null;
    if (it.kind === 'decoy') {
      it.seen = true;
      SFX.meh();
      fieldToast(it.say);
      return;
    }
    if (it.kind === 'clue') {
      it.state = 'fly';
      it.fly = 0;
      F.found++;
      sessionFound[it.id] = true;
      notesDirty();
      updateCount();
      SFX.find();
      buzz(25);
      sparkle(it.x, it.y, 18, ['#FFD66B', '#FFFFFF', '#FF8FA3']);
      F.ptr.down = false;
      const last = F.found >= F.need;
      setTimeout(() => pop({
        ic: it.ic, title: it.title, quote: it.quote, note: it.note,
        then: last ? sceneDone : null,
      }), 420);
      return;
    }
    // Sâu Tím: bị thấy thì cười khúc khích rồi chuồn sang chỗ khác, lần thứ ba thì chịu thua.
    F.found++;
    updateCount();
    SFX.find();
    buzz(30);
    sparkle(it.x, it.y - 10, 14, ['#B79CF0', '#FFFFFF', '#FF8FA3']);
    F.ptr.down = false;
    F.rustle.strong = false;
    fieldToast('Sâu Tím: “' + CAUGHT[F.found - 1] + '”', 2400);
    if (F.found >= F.need) {
      it.state = 'caught';
      F.busy = true;
      setTimeout(() => { SFX.ok(); sceneDone(); }, 1900);
      return;
    }
    it.state = 'giggle';
    setTimeout(() => {
      if (!F.on) return;
      it.state = 'away';
      setTimeout(() => {
        if (!F.on) return;
        moveWorm(it);
        it.state = 'hidden';
        F.rustle.next = F.t + 1.2;
      }, 450);
    }, 1500);
  }

  // Chuyển Sâu Tím sang chỗ trốn mới: xa chỗ cũ, xa ngón tay, xa các bạn khác; mấy lá phủ đi theo.
  function moveWorm(w) {
    let best = null;
    for (let k = 0; k < 300; k++) {
      const p = { x: rand(40, F.W - 40), y: rand(52, F.H - 40) };
      if (p.x < 140 && p.y < 60) continue;
      const score = Math.min(Math.hypot(p.x - w.x, p.y - w.y) * 0.8, Math.hypot(p.x - F.ptr.x, p.y - F.ptr.y),
        ...F.items.filter((i) => i !== w).map((i) => Math.hypot(p.x - i.x, p.y - i.y) * 1.4));
      if (!best || score > best.score) best = { x: p.x, y: p.y, score };
    }
    w.x = best.x;
    w.y = best.y;
    for (const l of F.leaves) if (l.cover === w) {
      l.hx = w.x + rand(-9, 9);
      l.hy = w.y + rand(-9, 9);
      l.x = l.hx; l.y = l.hy; l.vx = 0; l.vy = 0;
    }
  }

  function sceneDone() {
    F.busy = true;
    if (F.kind === 'garden') {
      pop({
        ic: '🧩', kicker: 'Đủ 3 manh mối', title: 'Ghép hai mảnh thư lại',
        quote: '“Mật mã hộp quà là giờ và phút em nhận lời yêu anh.”',
        note: 'Còn cánh sen hồng thì sao? Cứ ghi vào sổ đã, lát nữa sẽ cần. Giờ đi hỏi xem sáng nay có ai thấy Sâu Tím không.',
        ok: 'Đi hỏi nhân chứng',
        then: () => { stopField(); completeStep(1); },
      });
    } else {
      pop({
        ic: '🐛', kicker: 'Bắt được rồi!', title: 'Sâu Tím đã sa lưới',
        note: 'Bị bắt rồi mà Sâu Tím vẫn ôm khư khư một hộp quà khoá bốn số. Lúc giãy giụa, cậu ấy còn đánh rơi một tấm ảnh chụp đêm 6/8. Nhặt lấy, chắc chắn có ích.',
        ok: 'Mở hộp quà',
        then: () => { stopField(); completeStep(3); },
      });
    }
  }

  function drawField() {
    const x = F.x, t = F.t;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.drawImage(F.bg, 0, 0);
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    // đồ dưới lá
    for (const it of F.items) {
      if (it.gone || it.state === 'away' || it.state === 'fly' || it.state === 'giggle' || it.state === 'caught') continue;
      x.globalAlpha = it.kind === 'decoy' && it.seen ? 0.75 : 1;
      drawItem(x, it, t);
      x.globalAlpha = 1;
    }
    for (const l of F.leaves) drawLeaf(x, l, l.a || l.ang);
    // Sâu Tím vừa bị thấy: hiện hẳn lên trên lá
    for (const it of F.items) {
      if (it.state === 'giggle' || it.state === 'caught') {
        x.save();
        const bounce = Math.abs(Math.sin(t * 9)) * 4;
        x.translate(0, -bounce);
        drawItem(x, it, t);
        x.fillStyle = '#FFFFFF';
        x.font = '700 22px "Be Vietnam Pro", sans-serif';
        x.textAlign = 'center';
        x.fillText(it.state === 'caught' ? '🎁' : '!', it.x + (it.state === 'caught' ? -34 : 30), it.y - 30);
        x.restore();
      }
      if (it.state === 'fly') {
        it.fly += 1 / 40;
        x.save();
        x.globalAlpha = Math.max(0, 1 - it.fly);
        x.translate(it.x, it.y - it.fly * 40);
        x.scale(1 + it.fly * 0.6, 1 + it.fly * 0.6);
        x.translate(-it.x, -it.y);
        drawItem(x, it, t);
        x.restore();
        if (it.fly >= 1) { it.state = 'done'; it.gone = true; }
      }
    }
    // gợi ý: vùng sáng nhẹ quanh chỗ nên vạch
    if (F.glow && t < F.glow.until) {
      const k = 0.5 + 0.5 * Math.sin(t * 5);
      const g = x.createRadialGradient(F.glow.x, F.glow.y, 0, F.glow.x, F.glow.y, 90);
      g.addColorStop(0, 'rgba(255,233,168,' + (0.35 + 0.2 * k) + ')');
      g.addColorStop(1, 'rgba(255,233,168,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(F.glow.x, F.glow.y, 90, 0, TAU); x.fill();
    }
    // kính lúp theo ngón tay
    if (F.ptr.down) {
      const r = F.R * 0.58, px = F.ptr.x, py = F.ptr.y;
      x.lineCap = 'round';
      x.strokeStyle = '#6E4426';
      x.lineWidth = 9;
      x.beginPath(); x.moveTo(px + r * 0.72, py + r * 0.72); x.lineTo(px + r * 1.5, py + r * 1.5); x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.08)';
      x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
      x.strokeStyle = '#E2A93B';
      x.lineWidth = 5;
      x.beginPath(); x.arc(px, py, r, 0, TAU); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.75)';
      x.lineWidth = 3;
      x.beginPath(); x.arc(px, py, r * 0.72, Math.PI * 1.05, Math.PI * 1.4); x.stroke();
    }
    // lấp lánh
    const dt = 1 / 60;
    F.parts = F.parts.filter((p) => (p.life -= dt) > 0);
    for (const p of F.parts) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt;
      x.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      x.fillStyle = p.c;
      x.beginPath(); x.arc(p.x, p.y, p.s * (p.life / p.max), 0, TAU); x.fill();
    }
    x.globalAlpha = 1;
  }

  function fieldFrame(now) {
    if (!F.on) return;
    const dt = Math.min(0.05, (now - F.last) / 1000 || 0.016);
    F.last = now;
    F.t += dt;
    if (!F.ptr.down && $('pop').hidden) F.idle += dt;
    // Loay hoay lâu quá thì anh nhắc nhẹ.
    if (F.idle > 25 && !F.glow && !F.busy) { F.idle = 0; hintField(true); }
    stepRustle();
    stepLeaves(dt);
    checkItems(dt);
    drawField();
    F.raf = requestAnimationFrame(fieldFrame);
  }

  const where = (p) => {
    const row = p.y < F.H / 3 ? 'phía trên' : p.y > (F.H * 2) / 3 ? 'phía dưới' : 'khoảng giữa';
    const col = p.x < F.W / 3 ? 'bên trái' : p.x > (F.W * 2) / 3 ? 'bên phải' : 'chính giữa';
    return row + ', ' + col;
  };
  function hintField(auto) {
    if (!F.on || F.busy) return;
    if (F.kind === 'garden') {
      const left = F.items.filter((i) => i.kind === 'clue' && !i.gone && i.state === 'hidden');
      if (!left.length) return;
      const p = left[Math.floor(Math.random() * left.length)];
      F.glow = { x: p.x + rand(-26, 26), y: p.y + rand(-26, 26), until: F.t + 3.2 };
      fieldToast('Anh nhắn: “Hình như anh đánh rơi một mảnh ở ' + where(p) + '.”', 3400);
    } else {
      const w = F.items.find((i) => i.kind === 'worm');
      if (!w || w.state !== 'hidden') return;
      F.rustle.strong = true;
      F.rustle.next = F.t + 0.2;
      if (!auto) F.glow = { x: w.x + rand(-34, 34), y: w.y + rand(-34, 34), until: F.t + 3 };
      fieldToast('Anh nhắn: “Nhìn kỹ nha, lá nào đang khẽ rung là anh nấp dưới đó.”', 3400);
    }
  }
  $('field-hint').addEventListener('click', () => { SFX.click(); hintField(false); });

  const fieldPos = (e) => {
    const r = F.c.getBoundingClientRect();
    F.ptr.x = e.clientX - r.left;
    F.ptr.y = e.clientY - r.top;
  };
  $('field').addEventListener('pointerdown', (e) => {
    if (!F.on || F.busy) return;
    e.preventDefault();
    try { F.c.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
    F.ptr.id = e.pointerId;
    F.ptr.down = true;
    F.idle = 0;
    fieldPos(e);
    $('field-tip').classList.add('off');
  });
  $('field').addEventListener('pointermove', (e) => { if (F.ptr.down && e.pointerId === F.ptr.id) fieldPos(e); });
  const lift = (e) => { if (e.pointerId === F.ptr.id) F.ptr.down = false; };
  $('field').addEventListener('pointerup', lift);
  $('field').addEventListener('pointercancel', lift);

  // ================= Chặng 2: nhân chứng =================
  const W2 = { phase: 'liar' };
  function startWitness() {
    show('s-witness');
    W2.phase = 'liar';
    const box = $('witnesses');
    box.replaceChildren();
    for (const w of WITNESSES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wit pickable';
      b.dataset.id = w.id;
      b.innerHTML = '<span class="wit-av" aria-hidden="true"></span><span class="wit-body"><span class="wit-name"></span><span class="wit-say"></span></span>';
      b.querySelector('.wit-av').textContent = w.av;
      b.querySelector('.wit-name').textContent = w.name;
      b.querySelector('.wit-say').textContent = '“' + w.say + '”';
      b.addEventListener('click', () => pickLiar(w, b));
      box.appendChild(b);
    }
    $('ask-q').textContent = 'Ai đang nói dối?';
    $('places').hidden = true;
    $('ask-fb').hidden = true;
    $('ask-next').hidden = true;
  }
  function feedback(text, ok) {
    const fb = $('ask-fb');
    fb.textContent = text;
    fb.classList.toggle('ok', !!ok);
    fb.hidden = false;
  }
  function pickLiar(w, b) {
    if (W2.phase !== 'liar') return;
    if (!w.liar) {
      SFX.no();
      b.classList.remove('wrong');
      void b.offsetWidth;
      b.classList.add('wrong');
      feedback('Thử giả sử xem: ' + w.fb);
      return;
    }
    W2.phase = 'place';
    SFX.ok();
    document.querySelectorAll('.wit').forEach((el) => {
      el.classList.remove('pickable', 'wrong');
      el.disabled = true;
      el.classList.add(el === b ? 'liar' : 'honest');
    });
    feedback(LIAR_OK + ' ' + CONFESS, true);
    notesDirty();
    const nx = $('ask-next');
    nx.textContent = 'Vậy Sâu Tím trốn ở đâu?';
    nx.hidden = false;
    nx.onclick = askPlace;
  }
  function askPlace() {
    SFX.click();
    $('ask-next').hidden = true;
    $('ask-fb').hidden = true;
    $('ask-q').textContent = 'Sâu Tím đang trốn ở đâu?';
    const box = $('places');
    box.replaceChildren();
    for (const p of PLACES) {
      const b = document.createElement('button');
      b.type = 'button';
      const ic = document.createElement('span');
      ic.textContent = p.ic;
      b.append(ic, p.name);
      b.addEventListener('click', () => pickPlace(p, b));
      box.appendChild(b);
    }
    box.hidden = false;
    $('ask-q').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function pickPlace(p, b) {
    if (W2.phase !== 'place') return;
    if (!p.ok) {
      SFX.no();
      b.classList.add('wrong');
      feedback(p.fb);
      return;
    }
    W2.phase = 'done';
    SFX.ok();
    b.classList.add('right');
    document.querySelectorAll('#places button').forEach((el) => { el.disabled = true; });
    feedback(PLACE_OK, true);
    const nx = $('ask-next');
    nx.textContent = 'Đến bụi sen hồng';
    nx.hidden = false;
    nx.onclick = () => { SFX.click(); completeStep(2); };
    nx.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ================= Chặng 4: hộp quà khoá số =================
  const L4 = { dials: [0, 0, 0, 0], tries: 0, hint: 0, raf: 0, open: false };
  const UP = 'M6 15l6-6 6 6', DOWN = 'M6 9l6 6 6-6';
  function startLock() {
    show('s-lock');
    Object.assign(L4, { dials: [0, 0, 0, 0], tries: 0, hint: 0, open: false });
    $('giftlock').classList.remove('open', 'shake');
    $('lock-fb').textContent = '';
    $('lock-fb').classList.remove('bad');
    $('lock-bubble').textContent = 'Mở được thì quà là của em hết.';
    $('lock-try').disabled = false;
    $('photo-open').innerHTML = photoSVG();
    const box = $('dials');
    box.replaceChildren();
    L4.dials.forEach((v, i) => {
      if (i === 2) {
        const c = document.createElement('span');
        c.className = 'dial-colon';
        c.textContent = ':';
        box.appendChild(c);
      }
      const d = document.createElement('div');
      d.className = 'dial';
      const up = document.createElement('button');
      up.type = 'button';
      up.setAttribute('aria-label', 'Tăng số thứ ' + (i + 1));
      up.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + UP + '" /></svg>';
      const num = document.createElement('span');
      num.className = 'dial-num';
      num.textContent = '0';
      num.setAttribute('aria-label', 'Số thứ ' + (i + 1));
      const down = document.createElement('button');
      down.type = 'button';
      down.setAttribute('aria-label', 'Giảm số thứ ' + (i + 1));
      down.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + DOWN + '" /></svg>';
      up.addEventListener('click', () => turn(i, 1));
      down.addEventListener('click', () => turn(i, -1));
      // vuốt lên / xuống trên số cũng xoay được
      let y0 = null;
      num.addEventListener('pointerdown', (e) => { y0 = e.clientY; try { num.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ } });
      num.addEventListener('pointermove', (e) => {
        if (y0 === null) return;
        const dy = e.clientY - y0;
        if (Math.abs(dy) > 22) { turn(i, dy < 0 ? 1 : -1); y0 = e.clientY; }
      });
      num.addEventListener('pointerup', () => { y0 = null; });
      num.addEventListener('pointercancel', () => { y0 = null; });
      d.append(up, num, down);
      box.appendChild(d);
    });
    cancelAnimationFrame(L4.raf);
    L4.raf = requestAnimationFrame(lockFrame);
  }
  function turn(i, dir) {
    if (L4.open) return;
    L4.dials[i] = (L4.dials[i] + dir + 10) % 10;
    const num = document.querySelectorAll('.dial-num')[i];
    num.textContent = String(L4.dials[i]);
    num.style.setProperty('--from', dir > 0 ? '12px' : '-12px');
    num.classList.remove('roll');
    void num.offsetWidth;
    num.classList.add('roll');
    SFX.tick();
  }
  function tryLock() {
    if (L4.open) return;
    const code = L4.dials.join('');
    const fb = $('lock-fb');
    if (code === CODE) {
      L4.open = true;
      $('lock-try').disabled = true;
      $('giftlock').classList.add('open');
      fb.classList.remove('bad');
      fb.textContent = 'Cạch! Khoá bật ra rồi!';
      $('lock-bubble').textContent = 'Đúng là em nhớ mà 🥹';
      SFX.win();
      buzz([30, 60, 30]);
      if (!replay) setFlag('4');
      const fresh = replay ? false : grantReward();
      setTimeout(() => { cancelAnimationFrame(L4.raf); startFinale(fresh); }, 1500);
      return;
    }
    L4.tries++;
    SFX.no();
    const g = $('giftlock');
    g.classList.remove('shake');
    void g.offsetWidth;
    g.classList.add('shake');
    fb.classList.add('bad');
    fb.textContent = lockNear(code) || LOCK_WRONG[(L4.tries - 1) % LOCK_WRONG.length] + (L4.tries >= 2 && !L4.hint ? ' Cần thì bấm “Lời nhắn của anh” nha.' : '');
  }
  $('lock-try').addEventListener('click', tryLock);
  $('lock-hint').addEventListener('click', () => {
    SFX.click();
    const h = LOCK_HINTS[Math.min(L4.hint, LOCK_HINTS.length - 1)];
    L4.hint++;
    $('lock-bubble').textContent = h;
    $('lock-fb').classList.remove('bad');
    $('lock-fb').textContent = 'Lời nhắn ' + Math.min(L4.hint, LOCK_HINTS.length) + '/' + LOCK_HINTS.length;
  });
  function lockFrame(now) {
    if ($('s-lock').hidden) return;
    const c = $('lock-worm');
    const x = c.getContext('2d');
    const t = now / 1000;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, c.width, c.height);
    x.setTransform(c.width / 120, 0, 0, c.height / 120, 0, 0);
    x.translate(60, 62 + Math.sin(t * 3) * 1.5);
    x.scale(-1, 1);
    drawWorm(x, TIM, 96, t, { happy: L4.open ? 1 : 0, blink: Math.sin(t * 1.3) > 0.97 ? 1 : 0 });
    L4.raf = requestAnimationFrame(lockFrame);
  }

  // ================= Kết án =================
  const FIN = { raf: 0, i: 0, heart: 0, waiting: false };
  function startFinale(fresh) {
    current = 5;
    renderTrack();
    show('s-finale');
    const gifted = GIFT_FLAGS.some((k) => save.flags[k]);
    $('win').hidden = false;
    $('epi').hidden = true;
    $('closed').hidden = true;
    $('rw-dot').textContent = '+' + fmt(REWARD.dot) + ' đốt cây';
    $('rw-box').textContent = REWARD.boxes + ' hộp quà tặng';
    document.querySelector('.win-sub').textContent = fresh || !gifted
      ? 'Quà to của Sâu Tím đã vào túi em:'
      : 'Quà to em đã nhận từ lần phá án đầu tiên:';
    $('win-stamp').style.animation = 'none';
    void $('win-stamp').offsetWidth;
    $('win-stamp').style.animation = '';
    cancelAnimationFrame(FIN.raf);
    FIN.raf = requestAnimationFrame(finFrame);
    // Đã khép hồ sơ thì vào thẳng biên bản (trừ khi vừa điều tra lại).
    if (flag('Done') && !replay && !fresh) showClosed();
  }
  function finFrame(now) {
    if ($('s-finale').hidden) return;
    const t = now / 1000;
    if (!$('win').hidden) {
      const c = $('rw-skin');
      const x = c.getContext('2d');
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, c.width, c.height);
      x.setTransform(c.width / 96, 0, 0, c.height / 96, 0, 0);
      x.translate(48, 44);
      x.scale(0.84, 0.84);
      x.translate(-48, -48);
      Skins.drawPreview(x, DETECTIVE, 96, 96, t);
    }
    if (!$('epi').hidden) drawEpilogue(t);
    FIN.raf = requestAnimationFrame(finFrame);
  }

  // Cảnh cuối: đêm trong vườn, Sâu Thám Tử (em) và Sâu Tím (anh) đứng cạnh nhau.
  function drawEpilogue(t) {
    const c = $('epi-art');
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * DPR)) { c.width = Math.round(w * DPR); c.height = Math.round(h * DPR); }
    const x = c.getContext('2d');
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#221B45'); g.addColorStop(1, '#3D2F6E');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      x.fillStyle = 'rgba(255,244,214,' + (0.4 + 0.4 * Math.sin(t * 2 + i * 1.7)) + ')';
      x.beginPath(); x.arc((i * 73.3) % w, (i * 41.7) % (h * 0.55), 1.2 + (i % 3) * 0.4, 0, TAU); x.fill();
    }
    x.fillStyle = '#FFF1C9';
    x.beginPath(); x.arc(w * 0.82, h * 0.2, 16, 0, TAU); x.fill();
    x.fillStyle = '#2D2655';
    x.beginPath(); x.moveTo(0, h * 0.78); x.quadraticCurveTo(w * 0.5, h * 0.62, w, h * 0.76); x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill();
    const k = FIN.heart;
    const gap = 70 - k * 22;
    x.save();
    x.translate(w / 2 - gap, h * 0.62);
    drawWorm(x, DETECTIVE, 104, t, { happy: k > 0 ? 1 : 0 });
    x.restore();
    x.save();
    x.translate(w / 2 + gap, h * 0.62 + 2);
    x.scale(-1, 1);
    drawWorm(x, TIM, 98, t + 1, { happy: k > 0 ? 1 : 0, blink: Math.sin(t * 1.4) > 0.97 ? 1 : 0 });
    x.restore();
    if (k > 0) {
      const s = 10 + Math.sin(t * 5) * 1.5;
      x.fillStyle = '#FF2D55';
      Skins.heartPath(x, w / 2, h * 0.3, s);
      x.fill();
    }
  }

  function startEpilogue() {
    SFX.click();
    $('win').hidden = true;
    $('epi').hidden = false;
    FIN.i = 0;
    FIN.heart = 0;
    FIN.waiting = false;
    window.scrollTo(0, 0);
    nextLine();
  }
  function sayLine(who, text) {
    const tag = $('epi-who');
    tag.textContent = who === 'ke' ? 'Lời kể' : 'Sâu Tím';
    tag.className = 'epi-who' + (who === 'ke' ? ' ke' : '');
    $('epi-line').textContent = text;
  }
  function nextLine() {
    if (FIN.waiting) return;
    const item = EPILOGUE[FIN.i];
    if (!item) { finishCase(); return; }
    FIN.i++;
    if (item.choice) { ask(item.choice); return; }
    if (item.heart) { FIN.heart = 1; SFX.win(); buzz([20, 40, 20]); }
    sayLine(item.who, item.text);
    // Câu hỏi thì hiện lựa chọn luôn, không bắt chạm thêm.
    const nx = EPILOGUE[FIN.i];
    if (nx && nx.choice) { FIN.i++; ask(nx.choice); }
  }
  function ask(options) {
    FIN.waiting = true;
    $('epi-tap').hidden = true;
    const box = $('epi-choices');
    box.replaceChildren();
    for (const o of options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.text;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (o.wrong) {
          SFX.meh();
          b.classList.add('wrong');
          b.disabled = true;
          sayLine('tim', o.wrong);
          return;
        }
        SFX.ok();
        box.hidden = true;
        $('epi-tap').hidden = false;
        FIN.waiting = false;
        nextLine();
      });
      box.appendChild(b);
    }
    box.hidden = false;
  }
  $('epi-talk').addEventListener('click', () => { if (!FIN.waiting) { SFX.click(); nextLine(); } });
  $('win-next').addEventListener('click', startEpilogue);

  function finishCase() {
    if (!replay) setFlag('Done');
    showClosed();
  }
  function showClosed() {
    $('win').hidden = true;
    $('epi').hidden = true;
    $('closed').hidden = false;
    $('closed-date').textContent = 'Khép hồ sơ ngày ' + new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const w = Wallet.get();
    const on = w.equip.skin === REWARD.skin;
    $('go-equip').textContent = on ? 'Đang mặc Sâu Thám Tử ✓' : 'Mặc skin Sâu Thám Tử';
    $('go-equip').disabled = on || !Wallet.owns('skin', REWARD.skin, w);
    const boxes = $('go-boxes');
    if (w.freeBoxes > 0) {
      boxes.textContent = 'Mở ' + Math.min(20, w.freeBoxes) + ' hộp quà';
      boxes.href = '../shop/?free=1';
    } else {
      boxes.textContent = 'Ghé Tiệm Sâu';
      boxes.href = '../shop/#skin';
    }
    window.scrollTo(0, 0);
  }
  $('go-equip').addEventListener('click', () => {
    if (Wallet.equip('skin', REWARD.skin)) {
      SFX.ok();
      $('go-equip').textContent = 'Đang mặc Sâu Thám Tử ✓';
      $('go-equip').disabled = true;
    }
  });

  // ================= Khởi động =================
  $('cover-go').addEventListener('click', () => {
    SFX.click();
    replay = false;
    if (flag('Done')) { startFinale(false); return; }
    startStep(firstOpen());
  });
  $('cover-replay').addEventListener('click', () => {
    SFX.click();
    replay = true;
    startStep(1);
  });
  // Bản sao lưu từ máy khác về giữa chừng: chỉ đọc lại tiến độ, không tải lại trang đang chơi.
  window.LPN_onSync = () => {
    save = load();
    if (!$('s-cover').hidden) renderCover();
    else renderTrack();
  };
  window.addEventListener('resize', () => {
    if (!F.on) return;
    const [W, H] = sizeField();
    const kx = W / F.W, ky = H / F.H;
    if (Math.abs(kx - 1) < 0.01 && Math.abs(ky - 1) < 0.01) return;
    for (const l of F.leaves) { l.hx *= kx; l.hy *= ky; l.x *= kx; l.y *= ky; }
    for (const it of F.items) { it.x *= kx; it.y *= ky; }
    F.W = W; F.H = H;
    F.bg = paintGround(F.kind, W, H);
  });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!$('notes').hidden) closeNotes(); else if (!$('photo-view').hidden) $('photo-view').hidden = true; }
    else if ((e.key === ' ' || e.key === 'Enter') && !$('epi').hidden && !FIN.waiting && document.activeElement === document.body) { e.preventDefault(); nextLine(); }
  });

  renderCover();
})();
