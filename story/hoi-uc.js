// Hồi ức (bản xem thử của chương 17): chiếc TV cổ trong phòng tối. Bấm công tắc thì nghe tiếng "tách tích",
// TV bật lên kiểu đời cũ (vạch sáng, nhiễu hạt), máy quay tiến sát vào màn hình và chiếu một đoạn clip dựng
// từ ảnh. Hết băng thì TV tắt, đưa về web cũ (legacy/), nơi mọi thứ bắt đầu.
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const ANNIVERSARY = '2026-08-06T23:38:58';
  // Nhạc chỉ để làm nền (sau này còn ghép video có tiếng), nên để nhỏ.
  const SONG = { src: '../assets/sound/In Love x Có Đôi Điều.mp3', start: 55.3, vol: 0.2 };
  const DUR = 4600;
  // Kịch bản clip. t: title | kb (ảnh trôi chậm) | duo | trio | pola; fx: cách chuyển vào cảnh (fade, flash, burn, glitch).
  // Sau này thêm video: { t: 'video', src, from, to, cap } (chừa sẵn trong build()).
  const SHOTS = [
    { t: 'title', h: 'Hồi ức', p: 'Quang · Thủy · từ 06.08.2026', dur: 3800, fx: 'fade' },
    { t: 'kb', n: [1], cap: 'Cô giáo Văn tương lai.', fx: 'fade' },
    { t: 'kb', n: [2], cap: 'Nắng chiều đẹp. Người đứng trong nắng còn đẹp hơn.', fx: 'burn', alt: true },
    { t: 'duo', n: [5, 4], cap: 'Đi đâu, ăn gì, cũng phải chụp cho nhau xem.', fx: 'flash' },
    { t: 'pola', n: [3], note: 'biển chiều', cap: 'Biển chiều, em chạy theo con sóng.', fx: 'fade' },
    { t: 'kb', n: [15], cap: 'Em chào biển. Biển chào em.', fx: 'glitch', alt: true },
    { t: 'kb', n: [10], cap: 'Gương mặt này, anh thuộc lòng.', fx: 'fade' },
    { t: 'duo', n: [11, 13], cap: 'Một góc bếp. Một làn gió. Một người con gái.', fx: 'burn' },
    { t: 'kb', n: [14], cap: 'Trời mưa thì có ô. Có ô thì có em.', fx: 'flash', alt: true },
    { t: 'pola', n: [8], note: 'ánh mắt', cap: 'Có những ánh mắt, nhìn một lần là nhớ mãi.', fx: 'glitch' },
    { t: 'trio', n: [12, 16, 18], cap: 'Đèn vàng, váy trắng. Tim anh lạc mất một nhịp.', fx: 'fade' },
    { t: 'kb', n: [17], cap: 'Ba khung hình, ba lần anh thương.', fx: 'burn' },
    { t: 'kb', n: [9], cap: 'Ngày nào cũng muốn được nhìn em thêm một chút.', fx: 'flash', alt: true },
    { t: 'title', h: 'Còn nhiều cuốn băng nữa', p: 'mình quay tiếp nhé', dur: 4400, fx: 'glitch' },
  ];
  const img = (n) => '../assets/img/Anh (' + n + ').jpg';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad = (x) => String(x).padStart(2, '0');
  const now = new Date();
  const days = Math.floor((now - new Date(ANNIVERSARY)) / 864e5) + 1;

  // ===== Hạt phim trên cả trang, nhiễu trên màn TV =====
  // Nhiễu TV chỉ vẽ khi đang hiện (when), hạt phim vẽ ở độ phân giải thấp: máy yếu vẫn chạy mượt.
  function noiseCanvas(cv, w, h, every, when) {
    const x = cv.getContext('2d');
    cv.width = w; cv.height = h;
    const data = x.createImageData(w, h);
    return setInterval(() => {
      if (when && !when()) return;
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      x.putImageData(data, 0, 0);
    }, every);
  }
  noiseCanvas($('grain'), Math.ceil(innerWidth / 3), Math.ceil(innerHeight / 3), 120);
  noiseCanvas($('static'), 200, 140, 60, () => $('static').classList.contains('on') || $('static').classList.contains('soft'));

  // ===== Lấy sẵn ảnh =====
  const all = [...new Set(SHOTS.flatMap((s) => s.n || []))];
  const ready = Promise.all(all.map((n) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = res; im.src = img(n); })));

  // ===== Ai được xem =====
  // Trên trang thật, trước ngày mở băng chỉ máy anh Quang xem thử được; máy khác chỉ thấy cuộn băng khoá.
  // Server ở nhà (không phải workers.dev) thì ai cũng xem được để thử.
  // Mở bằng ?xem=anh một lần thì máy đó xem thử được luôn (máy anh Quang đang để tài khoản khác cũng vào được).
  try { if (/[?&]xem=anh\b/.test(location.search)) localStorage.setItem('lpn:tapePreview', '1'); } catch (e) { /* bỏ qua */ }
  // Trailer (?trailer=1): đoạn phim tự chạy, ai cũng xem được, không chơi được và không lộ đáp án.
  const TRAILER = /[?&]trailer=1\b/.test(location.search);
  const LOCKED = !TRAILER && location.hostname.endsWith('workers.dev') && (() => {
    try { return localStorage.getItem('lpn:who') !== 'quang' && localStorage.getItem('lpn:tapePreview') !== '1'; } catch (e) { return true; }
  })();

  // ===== Xoay ngang (điện thoại); máy tính hay đã xoay thì vào phòng luôn =====
  const touch = matchMedia('(pointer: coarse)').matches;
  let portraitOk = false, started = false;
  function layout() {
    if (LOCKED) { $('locked').hidden = false; $('rotate').hidden = true; $('room').hidden = true; return; }
    const needRotate = touch && innerHeight > innerWidth && !portraitOk && !started;
    $('rotate').hidden = !needRotate;
    $('room').hidden = needRotate;
  }
  addEventListener('resize', () => { layout(); if (zoomed) zoom(true); });
  $('btn-portrait').addEventListener('click', () => { portraitOk = true; layout(); });

  // ===== Âm thanh tự tạo: tiếng công tắc, tiếng ù và rè của TV cũ =====
  // iPhone gạt im lặng thì Safari tắt tiếng Web Audio (nhạc nền vẫn chạy): khai báo đây là âm thanh phát lại để vẫn kêu.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* máy không hỗ trợ */ }
  let ac = null, out = null;
  // Tạo (hoặc đánh thức) bộ âm thanh ngay trong lúc chạm; mọi tiếng đi qua một bộ nén cho to mà không vỡ.
  function audioOn() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
      out = ac.createGain();
      out.gain.value = 1.9;
      out.connect(comp).connect(ac.destination);
    }
    if (ac.state !== 'running') ac.resume().catch(() => {});
  }
  function noise(t, dur, type, freq, q, gain) {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(out);
    s.start(t);
  }
  function tone(t, dur, f0, f1, gain, type) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + dur);
  }
  const sfx = {
    click() { if (!ac) return; const t = ac.currentTime; noise(t, 0.04, 'bandpass', 2600, 1, 0.9); noise(t + 0.13, 0.05, 'bandpass', 1700, 1, 0.7); },
    on() { if (!ac) return; const t = ac.currentTime; tone(t, 0.6, 70, 40, 0.5); tone(t, 1.6, 7600, 7400, 0.015); noise(t + 0.05, 1.1, 'highpass', 1500, 0.4, 0.4); },
    glitch() { if (!ac) return; noise(ac.currentTime, 0.32, 'highpass', 900, 0.5, 0.12); },
    off() { if (!ac) return; const t = ac.currentTime; tone(t, 0.6, 520, 60, 0.18, 'triangle'); noise(t + 0.55, 0.05, 'bandpass', 2000, 1, 0.6); },
    // Chập điện: tiếng rè rẹt của TV cũ không chịu lên
    zap(k) { if (!ac) return; const t = ac.currentTime; tone(t, 0.25 + 0.15 * k, 110, 90, 0.2 + 0.08 * k, 'sawtooth'); noise(t, 0.3 + 0.2 * k, 'bandpass', 3200, 0.7, 0.5); noise(t + 0.18, 0.12, 'bandpass', 900, 1, 0.55); },
    // Âm thanh trailer: "bùm" trầm, tiếng vút chuyển cảnh, tiếng rít dồn lên, tim đập.
    boom() { if (!ac) return; const t = ac.currentTime; tone(t, 1.4, 95, 30, 0.95); tone(t, 0.5, 190, 60, 0.25, 'triangle'); noise(t, 0.6, 'lowpass', 260, 0.7, 0.7); },
    whoosh() { if (!ac) return; sweep(ac.currentTime, 0.55, 'bandpass', 350, 3800, 0.45); },
    riser(d) { if (!ac) return; sweep(ac.currentTime, d, 'highpass', 300, 7000, 0.28, true); },
    beat() { if (!ac) return; const t = ac.currentTime; tone(t, 0.14, 62, 38, 0.9); tone(t + 0.2, 0.14, 56, 36, 0.65); },
  };
  // Tiếng ồn quét tần số (vút qua hoặc rít dồn lên).
  function sweep(t, dur, type, f0, f1, gain, swell) {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = type; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (swell) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.95); g.gain.linearRampToValueAtTime(0, t + dur); }
    else { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    src.connect(f).connect(g).connect(out);
    src.start(t);
  }

  // ===== Nhạc nền =====
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

  // ===== Tiến sát vào màn hình TV (phóng to để màn hình gần kín màn) =====
  const tv = $('tv'), screen = $('screen');
  let zoomed = false;
  function zoom(on) {
    zoomed = on;
    if (!on) { tv.style.transform = ''; return; }
    tv.style.transition = 'none';
    tv.style.transform = '';
    const t = tv.getBoundingClientRect(), s = screen.getBoundingClientRect();
    void tv.offsetWidth;
    tv.style.transition = '';
    const k = Math.min(innerWidth / s.width, innerHeight / s.height) * 0.96;
    const cx = s.left + s.width / 2 - t.left, cy = s.top + s.height / 2 - t.top;
    const tx = innerWidth / 2 - t.left - cx * k, ty = innerHeight / 2 - t.top - cy * k;
    tv.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + k + ')';
  }

  // Hiệu ứng chạy xong thì gỡ luôn class: phòng khách bị ẩn rồi hiện lại (chuyển phòng) thì trình duyệt chạy lại
  // mọi animation còn gắn trên TV, TV sẽ giật một cái và loé vạch sáng như ma.
  tv.querySelector('.tv-body').addEventListener('animationend', (e) => e.currentTarget.classList.remove('shake', 'shake2'));
  $('crt-line').addEventListener('animationend', (e) => { if (e.animationName === 'line-off') e.currentTarget.classList.remove('off'); });
  $('content').addEventListener('animationend', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('glitch'); });

  // ===== Dựng từng cảnh =====
  const content = $('content');
  function build(s) {
    const el = document.createElement('div');
    el.className = 'shot ' + s.t + (s.alt ? ' alt' : '');
    el.style.setProperty('--dur', (s.dur || DUR) + 900 + 'ms');
    const bg = s.n ? '<img class="bg" alt="" src="' + img(s.n[0]) + '" />' : '';
    if (s.t === 'title') el.innerHTML = '<h2>' + s.h + '</h2><p>' + s.p + '</p>';
    else if (s.t === 'kb') el.innerHTML = bg + '<img class="fg" alt="" src="' + img(s.n[0]) + '" />';
    else if (s.t === 'duo' || s.t === 'trio') el.innerHTML = bg + s.n.map((n) => '<div class="card"><img alt="" src="' + img(n) + '" /></div>').join('');
    else if (s.t === 'pola') el.innerHTML = bg + '<div class="card"><img alt="" src="' + img(s.n[0]) + '" /><b>' + (s.note || '') + '</b></div>';
    return el;
  }
  async function caption(el, text) {
    if (!text) return;
    const c = document.createElement('div');
    c.className = 'cap';
    el.appendChild(c);
    await sleep(700);
    for (const ch of text) { c.textContent += ch; await sleep(38); }
  }
  function transition(fx, el) {
    if (fx === 'flash' || fx === 'burn') {
      const o = document.createElement('div');
      o.className = 'fx ' + fx;
      content.appendChild(o);
      setTimeout(() => o.remove(), 1200);
    } else if (fx === 'glitch') {
      sfx.glitch();
      content.classList.remove('glitch');
      void content.offsetWidth;
      content.classList.add('glitch');
      $('static').classList.add('on');
      setTimeout(() => $('static').classList.replace('on', 'soft'), 260);
    } else el.classList.add('enter-fade');
  }
  async function play() {
    let prev = null;
    for (const s of SHOTS) {
      const el = build(s);
      content.appendChild(el);
      transition(s.fx, el);
      caption(el, s.cap);
      if (prev) { const p = prev; setTimeout(() => p.remove(), 1000); }
      prev = el;
      await sleep(s.dur || DUR);
    }
  }

  // ===== Bật TV, chiếu, tắt TV =====
  let tcTimer = 0;
  async function powerOn() {
    if (started) return;
    started = true;
    audioOn();
    sfx.click();
    $('hint').classList.add('out');
    await sleep(260);
    tv.classList.add('on');
    $('room').classList.add('watching');
    zoom(true);
    sfx.on();
    $('crt-line').classList.add('on');
    $('static').classList.add('on');
    audio.currentTime = SONG.start;
    audio.volume = 0;
    audio.play().then(() => fade(SONG.vol, 5000)).catch(() => {});
    await sleep(1500);
    $('static').classList.replace('on', 'soft');
    $('osd').hidden = false;
    $('osd-date').textContent = pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear();
    const t0 = performance.now();
    tcTimer = setInterval(() => {
      const sec = Math.floor((performance.now() - t0) / 1000);
      $('osd-tc').textContent = '00:' + pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
    }, 250);
    await play();
    await powerOff();
  }

  async function powerOff() {
    clearInterval(tcTimer);
    fade(0, 2600);
    sfx.off();
    $('osd').hidden = true;
    content.classList.add('squash');
    $('static').classList.remove('soft', 'on');
    $('crt-line').classList.remove('on');
    void $('crt-line').offsetWidth;
    $('crt-line').classList.add('off');
    await sleep(900);
    tv.classList.remove('on');
    content.innerHTML = '';
    zoom(false);
    await sleep(1600);
    $('room').style.transition = 'opacity 1.2s';
    $('room').style.opacity = '.18';
    $('end').hidden = false;
    $('end-1').textContent = 'Ngày thứ ' + days + ' bên nhau.';
    for (const id of ['end-1', 'end-2', 'end-go', 'end-again']) { await sleep(1300); $(id).classList.add('on'); }
  }

  // ===== Băng giả (hoi-uc-room.js): TV bật nhanh, tiến sát màn hình, gõ từng câu manh mối rồi tắt, nhả băng =====
  let busy = false, realIn = false;
  async function playFake(tape) {
    if (busy || started) return;
    busy = true;
    audioOn();
    sfx.click();
    $('hint').classList.add('out');
    await sleep(220);
    tv.classList.add('on');
    $('room').classList.add('watching');
    zoom(true);
    sfx.on();
    $('crt-line').classList.remove('off');
    $('crt-line').classList.add('on');
    $('static').classList.add('on');
    await sleep(1700);
    $('static').classList.replace('on', 'soft');
    $('osd').hidden = false;
    $('osd').querySelector('.osd-ch').textContent = tape.ch;
    $('osd-date').textContent = tape.date || '';
    $('osd-tc').textContent = '00:00:00';
    const box = document.createElement('div');
    box.className = 'fake';
    content.appendChild(box);
    for (const line of tape.lines) {
      for (const p of box.querySelectorAll('p')) p.classList.add('old');
      const el = document.createElement('p');
      box.appendChild(el);
      if (line === '…') { sfx.glitch(); $('static').classList.replace('soft', 'on'); await sleep(500); $('static').classList.replace('on', 'soft'); el.remove(); continue; }
      for (const ch of line) { el.textContent += ch; await sleep(34); }
      await sleep(1500 + line.length * 22);
    }
    await sleep(1200);
    sfx.off();
    $('osd').hidden = true;
    content.classList.add('squash');
    $('static').classList.remove('soft', 'on');
    $('crt-line').classList.remove('on');
    void $('crt-line').offsetWidth;
    $('crt-line').classList.add('off');
    await sleep(800);
    tv.classList.remove('on');
    content.classList.remove('squash');
    content.innerHTML = '';
    zoom(false);
    await sleep(1500);
    $('room').classList.remove('watching');
    $('hint').classList.remove('out');
    busy = false;
  }
  // Trailer: TV chập điện, bật lên nhiễu và chữ PLAY một thoáng rồi tắt.
  async function tease() {
    audioOn();
    sfx.click();
    sfx.zap(2);
    const body = tv.querySelector('.tv-body');
    body.classList.add('shake2');
    $('static').classList.add('on');
    await sleep(420);
    $('static').classList.remove('on');
    await sleep(600);
    sfx.click();
    tv.classList.add('on');
    sfx.on();
    $('crt-line').classList.remove('off');
    $('crt-line').classList.add('on');
    $('static').classList.add('on');
    await sleep(900);
    $('static').classList.replace('on', 'soft');
    $('osd').hidden = false;
    $('osd').querySelector('.osd-ch').textContent = 'CH 06';
    $('osd-date').textContent = '13.11.2026';
    $('osd-tc').textContent = '00:00:00';
    await sleep(2000);
    sfx.off();
    $('osd').hidden = true;
    $('static').classList.remove('soft', 'on');
    $('crt-line').classList.remove('on');
    void $('crt-line').offsetWidth;
    $('crt-line').classList.add('off');
    await sleep(800);
    tv.classList.remove('on');
  }
  // Phần căn phòng gọi vào đây (hoi-uc-room.js).
  window.HoiUc = {
    trailer: TRAILER, tease,
    sfx, audioOn, playFake,
    busy: () => busy || started,
    armReal(on) { realIn = on; if (on) $('hint').textContent = HINTS[presses] || HINTS[0]; },
  };

  // TV cũ "dở chứng": hai lần đầu bấm chỉ rung, chập chờn rồi tắt; lần thứ ba mới chịu lên.
  let presses = 0, failing = false;
  const HINTS = ['Bấm công tắc để bật', 'Ơ… chưa lên. Bấm lại thử?', 'Sắp được rồi, bấm thêm lần nữa!'];
  async function sputter(k) {
    failing = true;
    audioOn();
    sfx.click();
    sfx.zap(k);
    const body = tv.querySelector('.tv-body');
    body.classList.remove('shake', 'shake2');
    void body.offsetWidth;
    body.classList.add(k > 1 ? 'shake2' : 'shake');
    $('led').classList.add('blink');
    $('static').classList.add('on');
    if (k > 1) $('crt-line').classList.add('on');
    await sleep(k > 1 ? 420 : 140);
    $('static').classList.remove('on');
    if (k > 1) {
      $('crt-line').classList.remove('on');
      void $('crt-line').offsetWidth;
      $('crt-line').classList.add('off');
      await sleep(700);
      $('crt-line').classList.remove('off');
    }
    await sleep(300);
    $('led').classList.remove('blink');
    $('hint').textContent = HINTS[k];
    failing = false;
  }
  $('power').addEventListener('click', () => {
    if (started || failing || busy) return;
    if (!realIn) {
      // Chưa có băng thật: phòng tự lo (đang có băng giả thì chiếu, trống thì nhắc).
      audioOn();
      if (window.HoiUcRoom) window.HoiUcRoom.power(); else sfx.click();
      return;
    }
    presses++;
    if (presses < 3) { sputter(presses); return; }
    const body = tv.querySelector('.tv-body');
    body.classList.remove('shake', 'shake2');
    void body.offsetWidth;
    body.classList.add('shake');
    audioOn(); // ngay lúc chạm, kẻo iPhone không cho bật tiếng sau khi chờ ảnh
    ready.then(powerOn);
  });
  $('end-again').addEventListener('click', () => location.reload());
  $('end-go').addEventListener('click', (e) => {
    e.preventDefault();
    document.body.style.transition = 'opacity 1s';
    document.body.style.opacity = '0';
    setTimeout(() => { location.href = $('end-go').href; }, 1000);
  });
  layout();
})();
