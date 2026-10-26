// Hồi ức (bản xem thử của chương 17): mở đầu bằng vài dòng chữ, rồi một cuốn sổ ảnh lật từng trang
// như xem lại ảnh trên máy ảnh cũ (hạt phim, vệt sáng hở phim, khung ngắm, dấu ngày cam). Hết sổ thì đưa về web cũ.
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const ANNIVERSARY = '2026-08-06T23:38:58';
  // Ảnh trong album (assets/img) và một dòng viết tay cho mỗi trang. Sau này thêm ảnh, video thì chỉ cần thêm vào đây.
  const PAGES = [
    { n: 1, note: 'Cô giáo Văn tương lai.', tilt: -1.5 },
    { n: 2, note: 'Nắng chiều đẹp. Người đứng trong nắng còn đẹp hơn.', tilt: 1.2 },
    { n: 5, note: 'Giữa một trời xanh, anh chỉ nhìn thấy em.', tilt: -1 },
    { n: 4, note: 'Ăn gì cũng phải chụp cho anh xem.', tilt: 1.6 },
    { n: 3, note: 'Biển chiều, em chạy theo con sóng.', tilt: -1.8 },
    { n: 15, note: 'Em chào biển. Biển chào em.', tilt: 1 },
    { n: 10, note: 'Gương mặt này, anh thuộc lòng.', tilt: -1.2 },
    { n: 11, note: 'Một góc bếp, một người con gái.', tilt: 1.4 },
    { n: 13, note: 'Gió hồ thổi, tóc em bay.', tilt: -1.6 },
    { n: 14, note: 'Trời mưa thì có ô. Có ô thì có em.', tilt: 1.1 },
    { n: 8, note: 'Có những ánh mắt, nhìn một lần là nhớ mãi.', tilt: -1 },
    { n: 12, note: 'Váy trắng, đêm xanh.', tilt: 1.5 },
    { n: 16, note: 'Đèn vàng, váy trắng. Tim anh lạc mất một nhịp.', tilt: -1.4 },
    { n: 17, note: 'Ba khung hình, ba lần anh thương.', tilt: 1.2 },
  ];
  const SONG = { src: '../assets/sound/In Love x Có Đôi Điều.mp3', start: 55.3, vol: 0.75 };
  const PAGE_MS = 5200;
  const src = (p) => '../assets/img/Anh (' + p.n + ').jpg';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const now = new Date();
  const days = Math.floor((now - new Date(ANNIVERSARY)) / 864e5) + 1;
  const pad = (x) => String(x).padStart(2, '0');
  const stamp = pad(now.getDate()) + ' ' + pad(now.getMonth() + 1) + " '" + String(now.getFullYear()).slice(2);

  // ===== Hạt phim: nhiễu nhỏ vẽ lại liên tục, phóng to ra cả màn hình =====
  const grain = $('grain');
  const gx = grain.getContext('2d');
  // Nửa độ phân giải màn hình: hạt mịn, không vỡ ô; vẽ lại vài lần mỗi giây cho hạt "lăn tăn".
  grain.width = Math.ceil(innerWidth / 2); grain.height = Math.ceil(innerHeight / 2);
  const noise = gx.createImageData(grain.width, grain.height);
  setInterval(() => {
    const d = noise.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    gx.putImageData(noise, 0, 0);
  }, 90);

  // ===== Lấy sẵn ảnh trước khi bắt đầu =====
  const ready = Promise.all(PAGES.map((p) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = res; im.src = src(p); })));
  ready.then(() => { $('start-hint').textContent = 'Chạm để xem lại'; $('btn-start').disabled = false; });
  $('btn-start').disabled = true;

  // ===== Nhạc: vào nhỏ rồi to dần, cuối thì nhỏ dần =====
  const audio = new Audio(SONG.src);
  audio.preload = 'auto';
  function fade(to, ms) {
    const from = audio.volume, t0 = performance.now();
    return new Promise((res) => {
      const step = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
        if (k < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  // ===== Tiếng máy ảnh và tiếng giật trang (tự tạo bằng Web Audio, không cần file) =====
  let ac = null;
  function noiseBurst(t, dur, freq, q, gain) {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
    s.connect(f).connect(g).connect(ac.destination);
    s.start(t);
  }
  const shutterSound = () => { if (!ac) return; const t = ac.currentTime; noiseBurst(t, 0.05, 3200, 0.8, 0.6); noiseBurst(t + 0.09, 0.07, 1800, 0.9, 0.5); };
  const pageSound = () => { if (!ac) return; const t = ac.currentTime; noiseBurst(t, 0.32, 1400, 0.5, 0.12); noiseBurst(t + 0.18, 0.2, 2600, 0.6, 0.06); };

  // ===== Dựng cuốn sổ =====
  const book = $('book');
  const HEART = '<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.4-9.3C1.2 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.8 3.7 4.4 7.2C19.5 16.4 12 21 12 21z"/></svg>';
  const leaves = [];
  function leaf(cls, front) {
    const el = document.createElement('div');
    el.className = 'page ' + cls;
    el.innerHTML = '<div class="face front">' + front + '</div><div class="face back"></div>';
    book.appendChild(el);
    leaves.push(el);
    return el;
  }
  leaf('cover', '<h1>Hồi ức</h1>' + HEART + '<span class="who">Quang · Thủy</span><span class="since">từ 06 · 08 · 2026</span>');
  PAGES.forEach((p, i) => leaf('sheet',
    '<div class="snap" style="--tilt:' + p.tilt + 'deg"><i class="tape a"></i><i class="tape b"></i>'
    + '<div class="ph"><img alt="" src="' + src(p) + '" /><span class="stamp">' + stamp + '</span></div></div>'
    + '<p class="note">' + p.note + '</p><span class="pno">' + pad(i + 1) + ' / ' + pad(PAGES.length) + '</span>'));
  leaf('last', '<p>Và còn nhiều trang nữa, mình viết tiếp nhé.</p>');
  // Trang đầu nằm trên cùng.
  leaves.forEach((el, i) => { el.style.zIndex = String(leaves.length - i); });

  let at = 0, timer = 0, busy = false, done = false;
  function show(i) {
    leaves.forEach((el, k) => el.classList.toggle('live', k === i));
    const photo = i >= 1 && i <= PAGES.length;
    $('hud-count').textContent = photo ? pad(i).padStart(3, '0') + '/' + String(PAGES.length).padStart(3, '0') : '---/' + String(PAGES.length).padStart(3, '0');
  }
  function turn() {
    if (busy || done) return;
    clearTimeout(timer);
    if (at >= leaves.length - 1) { finish(); return; }
    busy = true;
    const el = leaves[at];
    el.classList.add('turning', 'turned');
    pageSound();
    at++;
    show(at);
    setTimeout(() => { el.classList.remove('turning'); busy = false; }, 1350);
    timer = setTimeout(turn, at === leaves.length - 1 ? 3600 : PAGE_MS);
  }
  book.addEventListener('click', turn);

  // Loé sáng như đèn flash (chạy lại được nhiều lần).
  function flash() {
    const f = $('flash');
    f.classList.remove('on');
    void f.offsetWidth;
    f.classList.add('on');
  }

  async function finish() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    book.classList.add('closing');
    $('hud').hidden = true;
    fade(0.25, 2500);
    await sleep(1500);
    flash();
    await sleep(400);
    $('stage').hidden = true;
    $('end').hidden = false;
    $('end-1').textContent = 'Ngày thứ ' + days + ' bên nhau.';
    for (const id of ['end-1', 'end-2', 'end-go', 'end-again']) { await sleep(1300); $(id).classList.add('on'); }
  }

  // ===== Bắt đầu =====
  async function start() {
    document.body.classList.add('playing');
    audio.currentTime = SONG.start;
    audio.volume = 0;
    audio.play().then(() => fade(SONG.vol, 4000)).catch(() => {});
    $('start').classList.add('out');
    await sleep(900);
    $('start').hidden = true;
    const lines = $('lines');
    lines.hidden = false;
    const text = [
      ['Ngày 6 tháng 8, em nhận lời.', ''],
      ['Hôm nay là ngày thứ ' + days + '.', ''],
      ['Mình xem lại một chút nhé.', 'soft'],
    ];
    for (const [t, cls] of text) {
      const p = document.createElement('p');
      p.textContent = t;
      if (cls) p.className = cls;
      lines.appendChild(p);
      await sleep(80);
      p.classList.add('on');
      await sleep(2200);
    }
    await sleep(900);
    lines.classList.add('out');
    await sleep(900);
    lines.hidden = true;
    $('hud-date').textContent = stamp;
    $('hud').hidden = false;
    $('stage').hidden = false;
    show(0);
    timer = setTimeout(turn, 3200);
  }
  $('btn-start').addEventListener('click', () => {
    $('btn-start').disabled = true;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
    shutterSound();
    flash();
    ready.then(start);
  });

  $('end-again').addEventListener('click', () => location.reload());
  $('end-go').addEventListener('click', (e) => {
    e.preventDefault();
    fade(0, 1200);
    flash();
    setTimeout(() => { location.href = $('end-go').href; }, 900);
  });
})();
