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
  let portraitOk = false, started = false, entered = false;
  function layout() {
    if (LOCKED) { $('locked').hidden = false; $('rotate').hidden = true; $('room').hidden = true; return; }
    // Chỉ nhắc xoay ngang lúc mới vào. Đã vào phòng rồi thì xoay dọc / ngang giữa chừng vẫn xem tiếp:
    // khung cảnh tự co theo bề ngang màn hình (thấy trọn khung, trên dưới là viền đen).
    const needRotate = touch && innerHeight > innerWidth && !portraitOk && !started && !entered;
    if (!needRotate) entered = true;
    $('rotate').hidden = !needRotate;
    $('room').hidden = needRotate;
  }
  addEventListener('resize', () => { layout(); if (zoomed) zoom(true); });
  $('btn-portrait').addEventListener('click', () => { portraitOk = true; layout(); });

  // ===== Âm thanh tự tạo: tiếng công tắc, tiếng ù và rè của TV cũ =====
  // iPhone gạt im lặng thì Safari tắt tiếng Web Audio (nhạc nền vẫn chạy): khai báo đây là âm thanh phát lại để vẫn kêu.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* máy không hỗ trợ */ }
  let ac = null, out = null, wet = null;
  // Tạo (hoặc đánh thức) bộ âm thanh ngay trong lúc chạm; mọi tiếng đi qua một bộ nén cho to mà không vỡ.
  function audioOn() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
      out = ac.createGain();
      out.gain.value = 1.9;
      out.connect(comp).connect(ac.destination);
      // Độ vang (tắt sẵn): trailer bật lên để tiếng đồ vật vang như trong phòng lớn, hoà vào nhạc nền thay vì nghe khô, tách rời.
      const len = Math.floor(ac.sampleRate * 1.8), ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      const verb = ac.createConvolver();
      verb.buffer = ir;
      wet = ac.createGain();
      wet.gain.value = 0;
      out.connect(verb).connect(wet).connect(comp);
    }
    if (ac.state !== 'running') ac.resume().catch(() => {});
  }
  // Nhạc nền đi qua Web Audio để tăng giảm được (Safari trên iPhone không cho đổi audio.volume).
  // Đi thẳng ra loa, không qua bộ nén, để giữ nguyên độ dội của bản nhạc.
  function music(el, v) {
    let g = null;
    if (ac) { try { g = ac.createGain(); g.gain.value = v; ac.createMediaElementSource(el).connect(g).connect(ac.destination); } catch (e) { g = null; } }
    if (!g) el.volume = v;
    return {
      to(v2, sec) {
        if (g) { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setTargetAtTime(v2, ac.currentTime, sec / 3); return; }
        const from = el.volume, t0 = performance.now();
        const step = () => { const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); el.volume = from + (v2 - from) * k; if (k < 1) requestAnimationFrame(step); };
        step();
      },
    };
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
    // Biển hiệu neon cũ: "tít" mỗi lần đèn chập lên; neon(true/false) bật / tắt tiếng rè rè nền.
    // "Tít" rõ, có tiếng vọng nhỏ phía sau như vang trong căn phòng lặng.
    tick() {
      if (!ac) return;
      const t = ac.currentTime;
      tone(t, 0.07, 2300, 2150, 0.5); tone(t, 0.05, 4600, 4300, 0.12); noise(t, 0.03, 'bandpass', 4000, 1, 0.4);
      tone(t + 0.14, 0.07, 2300, 2150, 0.16); tone(t + 0.29, 0.07, 2300, 2150, 0.06);
    },
    neon(on) {
      if (!ac) return;
      if (!on) { if (sfx.hum) { sfx.hum.g.gain.setTargetAtTime(0, ac.currentTime, 0.1); sfx.hum.o.stop(ac.currentTime + 0.5); sfx.hum = null; } return; }
      if (sfx.hum) return;
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = 100; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.06, ac.currentTime, 0.2);
      o.connect(f).connect(g).connect(out); o.start();
      sfx.hum = { o, g };
    },
    neonLevel(k) { if (sfx.hum && ac) sfx.hum.g.gain.setTargetAtTime(0.06 * k, ac.currentTime, 0.01); },
    // Chập điện: tiếng rè lách tách dồn dập trước khi nổ
    arc() {
      if (!ac) return;
      const t = ac.currentTime;
      tone(t, 0.38, 100, 96, 0.12, 'sawtooth'); tone(t, 0.38, 150, 146, 0.06, 'square');
      for (let i = 0; i < 16; i++) noise(t + i * 0.022 + Math.random() * 0.01, 0.008 + Math.random() * 0.012, 'highpass', 3000 + Math.random() * 4000, 0.7, 0.25 + i * 0.02);
    },
    // TV nổ bóng rồi bén lửa: "bụp" tròn và trầm (không chát), kính rạn lanh canh, lửa bùng "phừng", lách tách cháy rồi lắng dần
    pop() {
      if (!ac) return;
      const t = ac.currentTime, rnd = (a, z) => a + Math.random() * (z - a);
      tone(t, 0.6, 140, 42, 0.75); tone(t, 0.25, 320, 90, 0.2, 'triangle');
      noise(t, 0.3, 'lowpass', 1200, 0.7, 0.6);
      noise(t + 0.01, 0.08, 'bandpass', 2000, 1, 0.45);
      for (let i = 0; i < 6; i++) noise(t + 0.03 + i * 0.03 + Math.random() * 0.03, 0.03, 'bandpass', 5000 + Math.random() * 3000, 6, 0.22);
      sweep(t + 0.05, 0.7, 'lowpass', 200, 1100, 0.35);
      noise(t + 0.1, 2.4, 'lowpass', 450, 0.6, 0.14);
      for (let i = 0; i < 8; i++) { const f = rnd(3500, 7000), at = t + 0.25 + Math.random() * 0.7; tone(at, 0.12, f, f * 0.98, 0.05); } // mảnh kính rơi lanh canh
      for (let i = 0; i < 40; i++) { const k = Math.random(); noise(t + 0.15 + k * k * 2.4, 0.005 + Math.random() * 0.02, 'bandpass', 1500 + Math.random() * 3500, 1.2, 0.35 * (1 - k * 0.7)); }
    },

    // ===== Tiếng đồ vật: mỗi món một kiểu, cùng chất đồ cũ trong phòng =====
    // Chạm nút, biểu tượng: tiếng gõ mềm
    ui() { if (!ac) return; const t = ac.currentTime; noise(t, 0.025, 'bandpass', 2200, 1.2, 0.35); tone(t, 0.03, 900, 700, 0.08); },
    // Công tắc đèn bàn: "tách" kim loại, bóng đèn "tinh" khẽ rồi ù ấm
    lamp() { if (!ac) return; const t = ac.currentTime; noise(t, 0.015, 'highpass', 5000, 0.7, 0.9); noise(t + 0.012, 0.03, 'bandpass', 3200, 2, 0.6); tone(t + 0.03, 0.5, 2960, 2940, 0.04); tone(t + 0.05, 0.9, 120, 118, 0.06); },
    // Nhét băng: nhựa trượt vào khe, "cạch" cơ khí nặng, mô-tơ quay
    tapeIn() { if (!ac) return; const t = ac.currentTime; sweep(t, 0.22, 'bandpass', 900, 2200, 0.35); noise(t + 0.22, 0.05, 'bandpass', 1500, 1, 0.8); tone(t + 0.22, 0.25, 110, 55, 0.6); tone(t + 0.36, 0.7, 140, 152, 0.05, 'sawtooth'); },
    // Nhả băng: mô-tơ, rồi lò xo bật cuộn băng ra
    tapeOut() { if (!ac) return; const t = ac.currentTime; tone(t, 0.35, 152, 130, 0.05, 'sawtooth'); noise(t + 0.3, 0.04, 'bandpass', 1800, 1, 0.8); tone(t + 0.3, 0.18, 300, 600, 0.1, 'triangle'); },
    // Túi vải: sột soạt; mở túi thì thêm tiếng khoá kéo
    bag(open) {
      if (!ac) return;
      const t = ac.currentTime;
      for (let i = 0; i < 6; i++) noise(t + i * 0.035 + Math.random() * 0.01, 0.05, 'bandpass', 2500 + Math.random() * 2500, 0.8, 0.18);
      if (open) for (let i = 0; i < 14; i++) noise(t + 0.1 + i * 0.018, 0.008, 'bandpass', 4000, 3, 0.3);
    },
    // Gối, chăn: sột soạt vải dày, chậm hơn túi
    cloth() { if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 5; i++) noise(t + i * 0.07 + Math.random() * 0.03, 0.12, 'bandpass', 1200 + Math.random() * 1200, 0.6, 0.22); },
    // Tìm thấy đồ: hai nốt chuông nhỏ trong trẻo
    find() { if (!ac) return; const t = ac.currentTime; tone(t, 0.5, 1318.5, 1318.5, 0.12); tone(t + 0.11, 0.7, 1975.5, 1975.5, 0.1); },
    // Lật ảnh, giở giấy: tiếng giấy phẩy
    paper() { if (!ac) return; const t = ac.currentTime; sweep(t, 0.16, 'highpass', 1800, 5200, 0.3); noise(t + 0.1, 0.04, 'bandpass', 3000, 0.8, 0.2); },
    // Con lăn khoá vali: ba nấc kim loại nhỏ
    roller() { if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 3; i++) noise(t + i * 0.035, 0.012, 'bandpass', 4200 - i * 300, 4, 0.7 - i * 0.15); tone(t, 0.05, 2600, 2400, 0.05); },
    // Chốt vali bật: "tách" mạnh, nắp bật lên
    latch() { if (!ac) return; const t = ac.currentTime; noise(t, 0.02, 'highpass', 3000, 0.7, 1); tone(t, 0.12, 900, 300, 0.25, 'triangle'); noise(t + 0.08, 0.25, 'lowpass', 500, 0.7, 0.5); tone(t + 0.08, 0.3, 90, 60, 0.4); },
    // Ngăn kéo gỗ: trượt ra rồi chạm "cộp"
    drawer() { if (!ac) return; const t = ac.currentTime; sweep(t, 0.32, 'lowpass', 300, 1200, 0.45); noise(t + 0.3, 0.05, 'lowpass', 400, 0.7, 0.6); tone(t + 0.3, 0.12, 120, 70, 0.35); },
    // Mảnh ghép: bìa cứng chạm nhau
    piece() { if (!ac) return; const t = ac.currentTime; noise(t, 0.03, 'lowpass', 900, 0.7, 0.7); tone(t, 0.04, 320, 220, 0.12); },
    // Đĩa xoay chữ: một nấc gỗ
    notch() { if (!ac) return; const t = ac.currentTime; noise(t, 0.015, 'bandpass', 1600, 3, 0.7); tone(t, 0.03, 700, 600, 0.08, 'triangle'); },
    // Rút sách: bìa cọ vào nhau rồi "bịch" nhẹ
    book() { if (!ac) return; const t = ac.currentTime; sweep(t, 0.25, 'bandpass', 600, 1400, 0.3); noise(t + 0.25, 0.06, 'lowpass', 500, 0.7, 0.6); tone(t + 0.25, 0.1, 140, 90, 0.25); },
    // Thẻ chữ (radio): thẻ gỗ "cốc"
    tile() { if (!ac) return; const t = ac.currentTime; tone(t, 0.08, 620, 560, 0.25, 'triangle'); noise(t, 0.02, 'bandpass', 1800, 2, 0.3); },
    // Phím số máy tính: bíp điện tử ngắn
    beep() { if (!ac) return; tone(ac.currentTime, 0.05, 1046, 1046, 0.07, 'square'); },
    // Bàn phím chữ: phím nhựa gõ "lạch"
    key() { if (!ac) return; const t = ac.currentTime; noise(t, 0.02, 'bandpass', 2400 + Math.random() * 400, 1.5, 0.55); tone(t, 0.03, 260, 180, 0.12); },
    // Điện thoại bàn: tiếng bấm số thật (DTMF), mỗi phím một âm
    dial(k) {
      if (!ac) return;
      const t = ac.currentTime;
      const at = '123456789*0#'.indexOf(k);
      if (at < 0) { tone(t, 0.06, 480, 480, 0.08, 'square'); return; }
      const lo = [697, 770, 852, 941][Math.floor(at / 3)], hi = [1209, 1336, 1477][at % 3];
      tone(t, 0.13, lo, lo, 0.11);
      tone(t, 0.13, hi, hi, 0.11);
    },
    // Mở khoá máy / điện thoại: hai nốt điện tử đi lên
    unlock() { if (!ac) return; const t = ac.currentTime; tone(t, 0.09, 880, 880, 0.07, 'square'); tone(t + 0.1, 0.16, 1320, 1320, 0.07, 'square'); },
    // Chip cắm vào ổ: "cạch" nhỏ và bíp; rút ra thì bíp đi xuống
    chip() { if (!ac) return; const t = ac.currentTime; noise(t, 0.015, 'highpass', 3500, 0.7, 0.7); tone(t + 0.03, 0.07, 2000, 2000, 0.06, 'square'); },
    chipOut() { if (!ac) return; const t = ac.currentTime; noise(t, 0.015, 'highpass', 3000, 0.7, 0.5); tone(t, 0.08, 1500, 900, 0.05, 'square'); },
    // Robot tỉnh dậy: mô-tơ rè rè rồi bíp bíp
    robot() { if (!ac) return; const t = ac.currentTime; tone(t, 0.35, 180, 360, 0.07, 'sawtooth'); tone(t + 0.4, 0.08, 1400, 1400, 0.08, 'square'); tone(t + 0.52, 0.08, 1900, 1900, 0.08, 'square'); },
    // Cửa gỗ: bản lề kẽo kẹt, rồi một bước chân
    door() { if (!ac) return; const t = ac.currentTime; creak(t, 0.38, 230, 170, 0.22); noise(t + 0.42, 0.06, 'lowpass', 380, 0.7, 0.5); },
    // Cổng đình: then sắt kéo, bản lề nặng rít dài
    gate() { if (!ac) return; const t = ac.currentTime; sweep(t, 0.2, 'bandpass', 700, 1400, 0.35); noise(t + 0.2, 0.04, 'bandpass', 2200, 2, 0.6); creak(t + 0.25, 0.9, 140, 95, 0.22); },
    // Cuộn băng rơi xuống mặt bàn (trailer): vỏ nhựa "cạch"
    clack() { if (!ac) return; const t = ac.currentTime; tone(t, 0.06, 520, 300, 0.2, 'triangle'); noise(t, 0.03, 'bandpass', 1400, 1.5, 0.6); },

    // ===== Trailer: đồng hồ điểm giờ, tua ngược =====
    // Kim giây (khi không có nhạc nền, nhạc tự có tiếng tích‑tắc)
    tock() { if (!ac) return; const t = ac.currentTime; noise(t, 0.02, 'bandpass', 3200, 4, 0.5); tone(t, 0.025, 1800, 1700, 0.06); },
    // Chuông điểm giờ: một tiếng ngân như đồng hồ quả lắc
    chime() { if (!ac) return; const t = ac.currentTime; for (const [k, g, d] of [[1, 0.2, 2.6], [2, 0.08, 1.6], [2.76, 0.05, 1.1], [5.4, 0.03, 0.6]]) tone(t, d, 880 * k, 880 * k * 0.998, g); },
    // Tua băng ngược: tiếng rít đầu từ, cao dần, có rung lắc của băng
    rewind(d) {
      if (!ac) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(1900, t + d * 0.7); o.frequency.exponentialRampToValueAtTime(1200, t + d);
      f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
      lfo.frequency.value = 11; lg.gain.value = 60;
      lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.15); g.gain.setValueAtTime(0.09, t + d - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(f).connect(g).connect(out);
      o.start(t); lfo.start(t); o.stop(t + d); lfo.stop(t + d);
      sweep(t, d, 'bandpass', 1200, 6500, 0.16, true);
      for (let i = 0; i < d / 0.07; i++) noise(t + i * 0.07 + Math.random() * 0.02, 0.01, 'highpass', 3000, 0.7, 0.12);
    },
    // Trailer: bật độ vang (0 → 1) và chỉnh độ to chung của tiếng hiệu ứng cho vừa với nhạc nền.
    space(k) { if (wet) wet.gain.setTargetAtTime(k, ac.currentTime, 0.1); },
    level(k) { if (out) out.gain.setTargetAtTime(1.9 * k, ac.currentTime, 0.1); },
    // Chuyển cảnh kiểu phim: gió trầm cuộn lên như tiếng va chạm phát ngược (to dần rồi dứt), đúng lúc sang cảnh thì chạm
    // một nhịp trầm êm (thud). Cú cắt nhanh thì dùng tiếng màn trập máy quay phim (shutter).
    swell(d) {
      if (!ac) return;
      const t = ac.currentTime;
      sweep(t, d, 'lowpass', 180, 1400, 0.3, true);
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(45, t); o.frequency.exponentialRampToValueAtTime(85, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + d); g.gain.linearRampToValueAtTime(0, t + d + 0.03);
      o.connect(g).connect(out);
      o.start(t); o.stop(t + d + 0.05);
    },
    thud() { if (!ac) return; const t = ac.currentTime; tone(t, 0.9, 68, 34, 0.5); noise(t, 0.25, 'lowpass', 220, 0.7, 0.35); },
    shutter() { if (!ac) return; const t = ac.currentTime; noise(t, 0.012, 'bandpass', 2600, 2, 0.45); noise(t + 0.035, 0.012, 'bandpass', 1900, 2, 0.35); tone(t, 0.18, 90, 45, 0.3); },
    // Biển neon chập: vài tiếng xèn xẹt rất ngắn và tiếng rè điện
    crackle() { if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 5; i++) noise(t + i * 0.025 + Math.random() * 0.02, 0.015, 'bandpass', 2500 + Math.random() * 2500, 1.2, 0.18); tone(t, 0.12, 120, 118, 0.05, 'sawtooth'); },
    // Còi báo quá tải: hai nốt luân phiên, ba lượt
    alarm() { if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 3; i++) { tone(t + i * 0.3, 0.14, 1320, 1320, 0.06, 'square'); tone(t + i * 0.3 + 0.15, 0.14, 990, 990, 0.06, 'square'); } },
    // Đếm ngược: bíp và nhịp trầm; số cuối bíp cao, kéo dài
    count(last) { if (!ac) return; const t = ac.currentTime, f = last ? 2093 : 1568; tone(t, last ? 0.5 : 0.16, f, f, 0.09, 'square'); noise(t, 0.02, 'highpass', 3000, 0.7, 0.3); tone(t, 0.22, 90, 50, 0.35); },
    // Băng dừng khựng lại
    thunk() { if (!ac) return; const t = ac.currentTime; tone(t, 0.35, 85, 40, 0.7); noise(t, 0.08, 'lowpass', 700, 0.7, 0.6); noise(t, 0.02, 'bandpass', 2500, 1, 0.5); },
  };
  // Gỗ hoặc sắt rít: tiếng cưa lọc hẹp, biên độ giật từng nấc (dính rồi trượt) như bản lề khô dầu.
  function creak(t, dur, f0, f1, gain) {
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur);
    f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 4;
    lfo.type = 'square'; lfo.frequency.value = 32; lg.gain.value = gain * 0.5;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain * 0.5, t + 0.05); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    lfo.connect(lg).connect(g.gain);
    o.connect(f).connect(g).connect(out);
    o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
  }
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
  // Trailer: TV chập điện, bật lên nhiễu; trên màn hình lần lượt hiện các dòng chữ méo giật rồi bẹp lại,
  // dòng cuối là lời hẹn; rồi TV tắt. onAir: gọi khi màn hình vừa lên (để máy quay zoom dần vào).
  async function tease(msgs, onAir, stay) {
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
    $('osd-date').textContent = '--.--.2026'; // chưa chốt ngày ra mắt
    $('osd-tc').textContent = '00:00:00';
    if (onAir) onAir();
    if (!msgs) await sleep(2000);
    for (const [i, m] of (msgs || []).entries()) {
      const last = i === msgs.length - 1;
      const el = document.createElement('div');
      el.className = 'tmsg' + (last ? ' last' : '');
      el.textContent = m;
      content.appendChild(el);
      sfx.glitch();
      $('static').classList.replace('soft', 'on');
      await sleep(170);
      $('static').classList.replace('on', 'soft');
      await sleep(last ? 2600 : 1400);
      el.classList.add('out');
      sfx.glitch();
      await sleep(300);
      el.remove();
    }
    if (stay) return; // trailer: TV còn sáng cho cảnh báo tự huỷ
    sfx.off();
    $('osd').hidden = true;
    $('static').classList.remove('soft', 'on');
    $('crt-line').classList.remove('on');
    void $('crt-line').offsetWidth;
    $('crt-line').classList.add('off');
    await sleep(800);
    tv.classList.remove('on');
  }
  // Trailer: TV vừa tắt thì chập điện, nổ bóng rồi bén lửa nhỏ: tia lửa điện ở hộc loa, loé sáng, kính màn hình rạn,
  // lửa liếm trên nóc, tàn lửa bay vồng lên rồi rơi, khói cuộn, ánh lửa hắt ra căn phòng. Hoành tráng mà ấm, không giật mình.
  // Trailer: tín hiệu quá tải, băng tự huỷ. Cảnh báo đỏ, rồi đếm 3, 2, 1 đúng các mốc của nhạc (giây trong trailer,
  // chờ bằng hàm at của trailer); mỗi số một tiếng bíp, nhiễu dày dần, TV rung mạnh dần.
  async function selfDestruct(at, warnAt, nums, onNum) {
    const body = tv.querySelector('.tv-body');
    const jolt = () => { body.classList.remove('shake2'); void body.offsetWidth; body.classList.add('shake2'); };
    await at(warnAt);
    const box = document.createElement('div');
    box.className = 'tcount';
    box.innerHTML = '<div class="warn">⚠ TÍN HIỆU QUÁ TẢI</div><div class="sub">Băng sẽ tự huỷ sau</div><div class="num"></div>';
    content.appendChild(box);
    sfx.alarm(); sfx.glitch(); jolt();
    $('static').style.opacity = '.14';
    for (const [i, t] of nums.entries()) {
      await at(t);
      const n = box.querySelector('.num');
      n.textContent = nums.length - i;
      n.classList.remove('go'); void n.offsetWidth; n.classList.add('go');
      sfx.count(i === nums.length - 1);
      $('static').style.opacity = String(0.18 + i * 0.07); // nhiễu dày dần nhưng vẫn đọc rõ số
      jolt();
      if (onNum) onNum(i);
    }
  }
  async function burn() {
    audioOn();
    // Đang chiếu thì cắt phụt: màn hình tắt ngay trước khi chập điện
    if (tv.classList.contains('on')) {
      content.replaceChildren();
      $('osd').hidden = true;
      $('static').classList.remove('soft', 'on');
      $('static').style.opacity = '';
      $('crt-line').classList.remove('on');
      tv.classList.remove('on');
    }
    const rnd = (a, z) => a + Math.random() * (z - a);
    const path = (x, y, n, step) => { let d = 'M' + x + ' ' + y; for (let i = 0; i < n; i++) { const [dx, dy] = step(); x += dx; y += dy; d += ' L' + x.toFixed(1) + ' ' + y.toFixed(1); } return '<path d="' + d + '"/>'; };
    // Toạ độ trong khung 100 × 60 phủ lên TV: màn hình giữa ở (43, 30), hộc loa bên phải ở x 86–94.
    const bolts = [0, 1, 2].map(() => path(rnd(86, 94), rnd(8, 16), 6, () => [rnd(-4, 4), rnd(3, 6)])).join('');
    const cracks = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * Math.PI * 2 + rnd(-0.3, 0.3); return path(43, 30, 4, () => [Math.cos(a + rnd(-0.4, 0.4)) * rnd(3, 7), Math.sin(a + rnd(-0.4, 0.4)) * rnd(2, 5)]); }).join('');
    // Mảnh kính văng ra từ màn hình lúc nổ, xoay và rơi
    const shards = Array.from({ length: 8 }, () => '<i class="shard" style="--x:' + rnd(-14, 14).toFixed(1) + 'cqw;--y:' + rnd(10, 26).toFixed(1) + 'cqw;--r:' + rnd(-540, 540).toFixed(0) + 'deg;--d:' + rnd(0.7, 1.1).toFixed(2) + 's"></i>').join('');
    const b = document.createElement('div');
    b.className = 'tv-burn';
    b.innerHTML = '<i class="glow"></i><svg class="arcs" viewBox="0 0 100 60" preserveAspectRatio="none">' + bolts + '</svg>'
      + '<svg class="cracks" viewBox="0 0 100 60" preserveAspectRatio="none">' + cracks + '</svg><i class="fl"></i><i class="char"></i><i class="base"></i>' + shards;
    tv.appendChild(b);
    sfx.arc();
    await sleep(350);
    b.classList.add('pop');
    fire(b);
    sfx.pop();
    tv.querySelector('.tv-body').classList.add('shake2', 'burnt');
    await sleep(2200);
  }
  // Lửa thật hơn: hệ hạt trên canvas. Lửa là hàng trăm hạt sáng cộng dồn ánh sáng (lõi trắng vàng, bay cao thì sang cam,
  // đỏ rồi tàn), bị gió xoáy nên lưỡi lửa uốn lượn; khói xám bốc từ đỉnh lửa, nở to và trôi; tàn lửa bắn lên rồi rơi.
  // Canvas phủ từ nóc TV lên cao; mọi kích thước tính theo u = 1% bề ngang canvas.
  function fire(box) {
    const cv = document.createElement('canvas');
    cv.className = 'firecv';
    box.prepend(cv);
    const k = Math.min(3, (window.devicePixelRatio || 1) * 1.5); // nét khi máy quay zoom vào
    const W = cv.width = Math.round(cv.offsetWidth * k), H = cv.height = Math.round(cv.offsetHeight * k);
    const g = cv.getContext('2d');
    if (!g || !W || !H) return;
    const sprite = (r, gr, b) => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const x = c.getContext('2d'), rg = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, 'rgba(' + r + ',' + gr + ',' + b + ',1)');
      rg.addColorStop(0.4, 'rgba(' + r + ',' + gr + ',' + b + ',.5)');
      rg.addColorStop(1, 'rgba(' + r + ',' + gr + ',' + b + ',0)');
      x.fillStyle = rg;
      x.fillRect(0, 0, 64, 64);
      return c;
    };
    const HOT = [sprite(255, 246, 214), sprite(255, 192, 84), sprite(250, 112, 36), sprite(196, 48, 18)], SMOKE = sprite(46, 42, 40);
    const u = W / 100, y0 = H * 0.965, rnd = (a, z) => a + Math.random() * (z - a);
    const mid = () => 0.5 + (Math.random() + Math.random() - 1) * 0.13; // dồn về giữa nóc TV
    const ps = [];
    const t0 = performance.now();
    let last = t0, debt = { f: 0, s: 0, e: 0 };
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000), age = (now - t0) / 1000;
      last = now;
      if (age > 5 || !cv.isConnected) return;
      const on = Math.min(1, age / 0.3); // lửa bùng lên trong 0,3 giây
      debt.f += 300 * on * dt; debt.s += (age > 0.25 ? 20 : 0) * dt; debt.e += 14 * on * dt;
      for (; debt.f >= 1; debt.f--) { const x = mid(), c = 1 - Math.abs(x - 0.5) * 5; ps.push({ k: 'f', x: W * x, y: y0 - rnd(0, 1.5) * u, vx: rnd(-1.5, 1.5) * u, vy: -rnd(12, 20) * u * (0.55 + 0.6 * c), r: rnd(2, 3.8) * u * (0.7 + 0.4 * c), life: rnd(0.45, 1), t: 0, seed: Math.random() * 9 }); }
      for (; debt.s >= 1; debt.s--) ps.push({ k: 's', x: W * mid(), y: y0 - rnd(8, 13) * u, vx: rnd(-1, 2) * u, vy: -rnd(5, 8) * u, r: rnd(3, 5) * u, life: rnd(2, 2.8), t: 0, seed: Math.random() * 9 });
      for (; debt.e >= 1; debt.e--) ps.push({ k: 'e', x: W * mid(), y: y0 - rnd(2, 8) * u, vx: rnd(-9, 9) * u, vy: -rnd(14, 26) * u, r: rnd(0.3, 0.55) * u, life: rnd(0.9, 1.5), t: 0, seed: Math.random() * 9 });
      g.clearRect(0, 0, W, H);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.t += dt;
        const f = p.t / p.life;
        if (f >= 1) { ps.splice(i, 1); continue; }
        p.vx += Math.sin(now / 130 + p.seed) * u * dt * (p.k === 's' ? 4 : 9); // gió xoáy
        if (p.k === 'f') p.vy -= 11 * u * dt; // khí nóng bốc nhanh dần
        if (p.k === 'e') p.vy += 22 * u * dt; // tàn lửa rơi
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      g.globalCompositeOperation = 'source-over';
      for (const p of ps) {
        if (p.k !== 's') continue;
        const f = p.t / p.life, r = p.r * (1 + f * 2.2);
        g.globalAlpha = Math.min(1, f * 4) * (1 - f) * 0.42;
        g.drawImage(SMOKE, p.x - r, p.y - r, r * 2, r * 2);
      }
      g.globalCompositeOperation = 'lighter';
      for (const p of ps) {
        const f = p.t / p.life;
        if (p.k === 'f') {
          const r = p.r * (1 - f * 0.7);
          g.globalAlpha = Math.min(1, f * 7) * Math.pow(1 - f, 0.7) * 0.5; // hiện dần: chân lửa không thành vạch sáng
          g.drawImage(HOT[f < 0.15 ? 0 : f < 0.4 ? 1 : f < 0.7 ? 2 : 3], p.x - r, p.y - r, r * 2, r * 2);
        } else if (p.k === 'e') {
          g.globalAlpha = (1 - f) * (0.6 + 0.4 * Math.sin(now / 40 + p.seed));
          g.drawImage(HOT[0], p.x - p.r * 2, p.y - p.r * 2, p.r * 4, p.r * 4);
        }
      }
      g.globalAlpha = 1;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  // Phần căn phòng gọi vào đây (hoi-uc-room.js).
  window.HoiUc = {
    trailer: TRAILER, tease, burn, selfDestruct,
    sfx, audioOn, music, playFake,
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
