// Hồi ức (bản xem thử của chương 17): chiếc TV cổ trong phòng tối. Bấm công tắc thì nghe tiếng "tách tích",
// TV bật lên kiểu đời cũ (vạch sáng, nhiễu hạt), máy quay tiến sát vào màn hình và chiếu một đoạn clip dựng
// từ ảnh. Hết băng thì TV tắt, đưa về web cũ (legacy/), nơi mọi thứ bắt đầu.
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  // Cuộn băng thật: ảnh, chú thích, bài hát, danh đề ở story/bang1.js (anh Quang sửa ở đó).
  const B = window.BANG1 || { shots: [], credits: [] };
  // Xem thử bản dựng phim: ?phim=nhap-1 thì TV chiếu /_phim/nhap-1.mp4 (máy chủ thử tools/bang1-dung/may-chu.mjs)
  const PHIM = (location.search.match(/[?&]phim=([\w-]+)/) || [])[1];
  if (PHIM) B.video = '/_phim/' + PHIM + '.mp4';
  // Xem thử đoạn cuối phim (?thu=cuoiphim): băng thật đã trong đầu, bấm nguồn là chiếu từ giây 105: vài cảnh cuối, thẻ kết,
  // danh đề rồi tới đoạn ghi thêm
  const SEEK = /[?&]thu=cuoiphim\b/.test(location.search) ? 105 : 0;
  const SONG = Object.assign({ src: '../assets/sound/bang1.mp3', from: 0, bpm: 62, bar0: 0, vol: 0.85 }, B.song || {});
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad = (x) => String(x).padStart(2, '0');
  const now = new Date();
  const days = Math.floor((now - new Date(B.since || '2026-08-06T23:38:58')) / 864e5) + 1;
  const src = (f) => (/^(\.\.\/|https?:|\/)/.test(f) ? f : (B.dir || '../assets/bang1/') + f);

  // Kịch bản phim dựng theo các đoạn của bài hát (song.parts trong bang1.js), mỗi đoạn một nhịp chuyển ảnh: dạo nhạc
  // chậm, lời 1 vừa, điệp khúc nhanh. Ảnh nhiều hay ít thì nhịp tự giãn, nén cho phim luôn khớp bài: cảnh đầu mỗi đoạn
  // vào đúng mốc của đoạn (đoạn có fx 'flash' thì chớp sáng ấm), ảnh cuối hết đúng song.end, rồi thẻ "Ngày thứ … bên nhau".
  // Ảnh dư (hay thiếu) so với nhịp chuẩn dồn về đoạn có `more` lớn (điệp khúc), đoạn lời giữ nhịp chậm để kịp đọc chữ.
  // Trong một đoạn, các lần chuyển cảnh rơi trên lưới nửa ô nhịp (tính từ song.bar0), ưu tiên đầu ô nhịp.
  // t (giây trong bài) là lúc cảnh vào; kiểu cảnh: title | kb (ảnh trôi chậm) | duo | trio | pola | video.
  // Phim dựng sẵn thành một video (B.video, tools/bang1-dung/dung.mjs): video chứa cả bài nhạc đã duyệt và chiếu hình
  // tới B.videoEnd; phần sau giữ y như phim dựng từ ảnh: thẻ "Ngày thứ … bên nhau", tắt TV, danh đề theo nhịp nhạc.
  function plan() {
    const beat = 60 / SONG.bpm, minD = beat * 1.5;
    if (B.video) {
      const vend = B.videoEnd || SONG.end;
      return { shots: [{ t: vend, kind: 'title', h: 'Ngày thứ ' + days, p: 'bên nhau', fx: 'fade', end: true }], end: SONG.credits ? Math.max(vend + 4, SONG.credits - 3.2) : vend + beat * 10 };
    }
    // Các vạch lưới (bước u phách) cách hai đầu [a, b] ít nhất 1,5 phách
    const lines = (a, b, u) => {
      const out = [];
      for (let i = Math.ceil((a + minD - SONG.bar0) / (u * beat) - 1e-6); SONG.bar0 + i * u * beat <= b - minD + 1e-6; i++) out.push(SONG.bar0 + i * u * beat);
      return out;
    };
    const W8 = { duo: 1.6, trio: 2, pola: 1.25, video: 1.5 }; // ảnh ghép, polaroid, video cần lâu hơn một chút
    const shots = (B.shots || []).map((it) => {
      const n = it.imgs || (it.img ? [it.img] : []);
      const kind = it.video ? 'video' : n.length === 3 ? 'trio' : n.length === 2 ? 'duo' : it.pola ? 'pola' : 'kb';
      return { kind, n, video: it.video, cap: it.cap || '', note: it.pola || '', w: W8[kind] || 1 };
    });
    const parts = SONG.parts && SONG.parts.length ? SONG.parts : [{ at: SONG.from + beat * 6, beats: 4 }];
    const P = parts.length, N = shots.length, W = shots.reduce((a, s) => a + s.w, 0);
    const end = SONG.end || parts[P - 1].at + W * 4 * beat;
    const len = parts.map((p, k) => (k + 1 < P ? parts[k + 1].at : end) - p.at);

    // 1. Chia ảnh cho các đoạn theo sức chứa (độ dài chia nhịp chuẩn), nghiêng theo `more`; mỗi đoạn không nhận quá số
    //    chỗ trên lưới của nó (dạo nhạc: 1 ô nhịp mỗi ảnh, đoạn khác: nửa ô), phần tràn chia cho đoạn còn chỗ.
    const cap0 = parts.map((p, k) => len[k] / (p.beats * beat));
    const C0 = cap0.reduce((a, b) => a + b, 0), r = W / C0 - 1;
    const tilt = parts.map((p) => (r > 0 ? p.more || 1 : 1 / (p.more || 1)));
    const mean = cap0.reduce((a, c, k) => a + c * tilt[k], 0) / C0;
    let cap = cap0.map((c, k) => c * Math.max(0.15, 1 + r * tilt[k] / mean));
    const room = parts.map((p, k) => (lines(p.at, p.at + len[k], p.beats >= 8 ? 4 : 2).length + 1) * (N ? W / N : 1)); // theo trọng số
    for (let it = 0; it < 8; it++) {
      const s = cap.reduce((a, b) => a + b, 0);
      cap = cap.map((c) => c * W / s);
      const over = cap.reduce((a, c, k) => a + Math.max(0, c - room[k]), 0);
      const free = cap.reduce((a, c, k) => a + (c < room[k] ? c : 0), 0);
      if (over < 1e-6 || !free) break;
      cap = cap.map((c, k) => (c >= room[k] ? room[k] : c + over * c / free));
    }
    const C = cap.reduce((a, b) => a + b, 0);
    const first = [0]; // chỉ số ảnh đầu tiên của mỗi đoạn (theo thứ tự ảnh, cắt ở giữa trọng số)
    for (let k = 1, F = 0; k < P; k++) {
      F += cap[k - 1] / C;
      let i = 0, acc = 0;
      while (i < N && (acc + shots[i].w / 2) / W < F) acc += shots[i++].w;
      first.push(i);
    }
    first.push(N);
    if (N >= P) {
      for (let k = 1; k < P; k++) first[k] = Math.max(first[k], first[k - 1] + 1);
      for (let k = P - 1; k > 0; k--) first[k] = Math.min(first[k], first[k + 1] - 1);
    }

    // 2. Trong một đoạn: chọn vạch chuyển cảnh trên lưới nửa ô nhịp sao cho mỗi ảnh gần nhất độ dài lý tưởng của nó
    //    (theo trọng số, đầu đoạn thong thả hơn, cuối đoạn dồn nhanh dần), chuyển giữa ô nhịp thì bị trừ điểm nhẹ.
    function cuts(a, b, list) {
      const g = [a, ...lines(a, b, 2), b], m = g.length - 1, n = list.length;
      if (n === 1) return [a];
      if (n > m) return list.map((_, i) => a + (b - a) * i / n); // dày quá lưới: chia đều
      const pw = list.reduce((s, x) => s + x.w, 0);
      const raw = list.map((s, i) => s.w / pw * (1.12 - 0.24 * i / (n - 1)));
      const rs = raw.reduce((x, y) => x + y, 0), want = raw.map((x) => (b - a) * x / rs);
      const midBar = (x) => Math.abs((x - SONG.bar0) / (beat * 4) - Math.round((x - SONG.bar0) / (beat * 4))) > 0.01;
      const cost = (i, j0, j1) => ((g[j1] - g[j0] - want[i]) / want[i]) ** 2 * 4 + (j1 < m && midBar(g[j1]) ? 0.12 : 0);
      const best = [], from = [];
      for (let i = 0; i < n; i++) { best.push(new Array(m + 1).fill(Infinity)); from.push(new Array(m + 1).fill(-1)); }
      for (let j = 1; j <= m - n + 1; j++) best[0][j] = cost(0, 0, j);
      for (let i = 1; i < n; i++) {
        for (let j = i + 1; j <= m - n + 1 + i; j++) {
          for (let jp = i; jp < j; jp++) {
            const c = best[i - 1][jp] + cost(i, jp, j);
            if (c < best[i][j]) { best[i][j] = c; from[i][j] = jp; }
          }
        }
      }
      const ts = [a];
      for (let i = n - 1, j = m; i > 0; i--) { j = from[i][j]; ts[i] = g[j]; }
      return ts;
    }

    const out = [{ t: SONG.from, kind: 'title', h: B.title || 'Hồi ức', p: B.subtitle || '', fx: 'fade' }];
    let alt = false;
    for (let k = 0; k < P; k++) {
      const list = shots.slice(first[k], first[k + 1]);
      if (!list.length) continue; // ít ảnh hơn số đoạn: đoạn trống nhường thời gian cho đoạn trước
      let k2 = k + 1;
      while (k2 < P && first[k2] === first[k2 + 1]) k2++;
      const ts = cuts(parts[k].at, k2 < P ? parts[k2].at : end, list);
      list.forEach((s, j) => {
        // Chớp sáng chỉ một lần lúc nhạc bùng; còn lại mờ chồng, thỉnh thoảng một vệt sáng ấm kiểu phim cháy
        const fx = !j ? parts[k].fx || 'fade' : parts[k].beats < 8 && j % 3 === 2 ? 'burn' : 'fade';
        out.push({ t: ts[j], kind: s.kind, n: s.n, video: s.video, cap: s.cap, note: s.note, fx, alt: (alt = !alt) });
      });
    }
    out.push({ t: end, kind: 'title', h: 'Ngày thứ ' + days, p: 'bên nhau', fx: 'fade', end: true });
    // TV tắt trước lúc danh đề cuộn lên (song.credits) đúng bằng thời gian tắt TV, tối phòng
    return { shots: out, end: SONG.credits ? Math.max(end + 4, SONG.credits - 3.2) : end + beat * 10 };
  }
  const PLAN = plan();

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
  noiseCanvas($('static'), 200, 140, 60, () => ['on', 'soft', 'faint'].some((c) => $('static').classList.contains(c)));

  // ===== Lấy sẵn ảnh, nhạc: chỉ khi cuộn băng thật đã nằm trong đầu băng (trang trailer, người chưa tìm ra băng không phải tải) =====
  let ready = null;
  function preload() {
    if (ready) return ready;
    loadFilm();
    const files = [...new Set(PLAN.shots.flatMap((s) => s.n || []))];
    ready = Promise.all(files.map((f) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = res; im.src = src(f); })));
    return ready;
  }

  // ===== Ai được xem =====
  // Mở cho mọi máy từ 20:00 ngày 1/11/2026 (cùng lúc Chương 17 · Cuộn băng số 1). Trước giờ đó trên trang thật máy nào
  // cũng chỉ thấy cuộn băng khoá; anh Quang xem thử bằng link ?mo=q0608 (chỉ mở trong tab đó, đóng tab là khoá lại).
  const OPEN_AT = Date.parse('2026-11-01T20:00:00+07:00');
  // Server ở nhà (không phải workers.dev) thì ai cũng xem được để thử.
  try {
    localStorage.removeItem('lpn:tapePreview'); // khoá cũ (?xem=anh) từng lưu hẳn trên máy
    if (/[?&]mo=q0608\b/.test(location.search)) sessionStorage.setItem('lpn:tapePreview', '1');
  } catch (e) { /* bỏ qua */ }
  // Trailer (?trailer=1): đoạn phim tự chạy, ai cũng xem được, không chơi được và không lộ đáp án.
  const TRAILER = /[?&]trailer=1\b/.test(location.search);
  // TẠM ĐÓNG (1/11/2026 20:00, anh Quang dặn): game chưa hoàn thiện, giữ khoá với máy Thủy dù đã qua giờ mở.
  // Mở lại: đổi HOLD thành false (và HOLD trong home/home.js).
  const HOLD = false;
  const LOCKED = !TRAILER && location.hostname.endsWith('workers.dev') && (HOLD || Date.now() < OPEN_AT) && (() => {
    // Máy anh Quang mở sớm để thử trước giờ ra mắt
    try { return sessionStorage.getItem('lpn:tapePreview') !== '1' && localStorage.getItem('lpn:who') !== 'quang'; } catch (e) { return true; }
  })();

  // ===== Xoay ngang (điện thoại); máy tính hay đã xoay thì vào phòng luôn =====
  const touch = matchMedia('(pointer: coarse)').matches;
  let portraitOk = false, started = false, entered = false;
  function layout() {
    if (LOCKED) { $('locked').hidden = false; $('rotate').hidden = true; $('room').hidden = true; return; }
    // Xem thử đoạn ghi thêm (?thu=tamsu): không vào phòng, không nhắc xoay ngang (clip quay dọc, cầm dọc mà xem)
    if (/[?&]thu=tamsu\b/.test(location.search)) { $('rotate').hidden = true; $('room').hidden = true; return; }
    // Chỉ nhắc xoay ngang lúc mới vào. Đã vào phòng rồi thì xoay dọc / ngang giữa chừng vẫn xem tiếp:
    // khung cảnh tự co theo bề ngang màn hình (thấy trọn khung, trên dưới là viền đen).
    const needRotate = touch && portrait() && !portraitOk && !started && !entered;
    if (!needRotate) entered = true;
    $('rotate').hidden = !needRotate;
    $('room').hidden = needRotate;
  }
  // Đang dọc hay ngang: hỏi nhiều nguồn, chỉ coi là dọc khi mọi nguồn đều nói dọc. iPhone (nhất là mở từ màn hình chính)
  // báo sự kiện xoay trước khi cập nhật kích thước cửa sổ: đọc innerWidth/innerHeight lúc đó vẫn ra số cũ, trang kẹt ở màn
  // "Xoay ngang" dù máy đã nằm ngang. Nên sau mỗi lần xoay còn kiểm tra lại vài lần nữa, và chạm vào màn nhắc cũng kiểm tra lại.
  function portrait() {
    const so = window.screen.orientation, o = so && so.type; // window.screen: trong file đã có biến screen (màn hình TV)
    if (o && o.startsWith('landscape')) return false;
    if (typeof window.orientation === 'number' && Math.abs(window.orientation) === 90) return false;
    if (matchMedia('(orientation: landscape)').matches) return false;
    const vv = window.visualViewport;
    return innerHeight > innerWidth && (!vv || vv.height > vv.width);
  }
  let relayT = [];
  function relayout() {
    layout();
    if (zoomed) zoom(true, true);
    relayT.forEach(clearTimeout);
    relayT = [80, 250, 600, 1200].map((ms) => setTimeout(() => { layout(); if (zoomed) zoom(true, true); }, ms));
  }
  addEventListener('resize', relayout);
  addEventListener('orientationchange', relayout);
  if (window.screen.orientation) window.screen.orientation.addEventListener('change', relayout);
  if (window.visualViewport) visualViewport.addEventListener('resize', relayout);
  matchMedia('(orientation: landscape)').addEventListener('change', relayout);
  $('rotate').addEventListener('click', relayout);
  $('btn-portrait').addEventListener('click', (e) => { e.stopPropagation(); portraitOk = true; layout(); });

  // Chặn phóng to ngoài ý muốn trên điện thoại: chụm hai ngón (iPhone bỏ qua user-scalable=no nên chặn bằng tay).
  // Chạm đôi thì CSS touch-action: manipulation lo, không chặn touchend (chặn sẽ nuốt mất lần bấm thứ hai khi gõ mật mã nhanh).
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  // ===== Âm thanh tự tạo: tiếng công tắc, tiếng ù và rè của TV cũ =====
  // iPhone gạt im lặng thì Safari tắt tiếng Web Audio (nhạc nền vẫn chạy): khai báo đây là âm thanh phát lại để vẫn kêu.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* máy không hỗ trợ */ }
  let ac = null, out = null, wet = null, verb = null, comp = null;
  // Tạo (hoặc đánh thức) bộ âm thanh ngay trong lúc chạm; mọi tiếng đi qua một bộ nén cho to mà không vỡ.
  function audioOn() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
      comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
      out = ac.createGain();
      out.gain.value = 1.9;
      out.connect(comp).connect(ac.destination);
      // Độ vang (tắt sẵn): trailer bật lên để tiếng đồ vật vang như trong phòng lớn, hoà vào nhạc nền thay vì nghe khô, tách rời.
      const len = Math.floor(ac.sampleRate * 1.8), ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      verb = ac.createConvolver();
      verb.buffer = ir;
      wet = ac.createGain();
      wet.gain.value = 0;
      out.connect(verb).connect(wet).connect(comp);
      // Cuộc gọi đến (iPhone để bộ âm thanh ở trạng thái "interrupted"): hết gián đoạn thì tự đánh thức lại
      ac.addEventListener('statechange', () => { if (ac.state !== 'running') setTimeout(wake, 400); });
    }
    if (ac.state !== 'running' && !document.hidden) ac.resume().catch(() => {});
  }
  // Nhạc nền đi qua Web Audio để tăng giảm được (Safari trên iPhone không cho đổi audio.volume).
  // Đi thẳng ra loa, không qua bộ nén, để giữ nguyên độ dội của bản nhạc.
  function music(el, v) {
    let g = null;
    // Phim dựng sẵn (video, phát chia đoạn HLS) phát thẳng, không qua bộ trộn: Safari nối video HLS vào Web Audio thì câm
    if (ac && el.tagName !== 'VIDEO') { try { g = ac.createGain(); g.gain.value = v; ac.createMediaElementSource(el).connect(g).connect(ac.destination); } catch (e) { g = null; } }
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
  let tint = 'dark'; // 'dark' trước khi đọc lá thư (rợn, bí ẩn), 'bright' sau đó (trong trẻo); đặt theo tâm trạng căn nhà
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
    // Tìm thấy đồ, giải xong câu đố. Hai thái cực: nhà còn vắng (chưa đọc thư) thì là một nhịp trầm và hai nốt lệch nhau
    // gợn gợn, ngân trong phòng trống, kèm hơi gió; nhà đã ấm (đọc thư rồi) thì chuông trong trẻo.
    find() {
      if (!ac) return;
      const t = ac.currentTime;
      if (tint === 'dark') {
        noise(t, 0.5, 'lowpass', 160, 0.7, 0.35); tone(t, 0.9, 98, 70, 0.22);
        tone(t + 0.05, 2.2, 293.66, 293.66, 0.05, 'triangle'); tone(t + 0.05, 2.2, 311.13, 311.13, 0.045, 'triangle');
        tone(t + 0.25, 2.6, 1174.7, 1140, 0.012);
        sweep(t + 0.1, 1.6, 'bandpass', 500, 1500, 0.06, true);
        return;
      }
      tone(t, 0.6, 1318.5, 1318.5, 0.1); tone(t + 0.09, 0.8, 1975.5, 1975.5, 0.08); tone(t + 0.18, 1.1, 2637, 2637, 0.035);
    },
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
    // Mở khoá: nhà vắng thì tiếng then kim loại nặng, ngân lạnh; nhà ấm thì hai tiếng bíp nhỏ
    unlock() {
      if (!ac) return;
      const t = ac.currentTime;
      if (tint === 'dark') { noise(t, 0.03, 'highpass', 2500, 0.7, 0.8); tone(t, 0.18, 420, 160, 0.18, 'triangle'); noise(t + 0.12, 0.3, 'lowpass', 300, 0.7, 0.4); tone(t + 0.14, 1.4, 1046.5, 1010, 0.015); return; }
      tone(t, 0.09, 880, 880, 0.07, 'square'); tone(t + 0.1, 0.16, 1320, 1320, 0.07, 'square');
    },
    // Chip cắm vào ổ: "cạch" nhỏ và bíp; rút ra thì bíp đi xuống
    chip() { if (!ac) return; const t = ac.currentTime; noise(t, 0.015, 'highpass', 3500, 0.7, 0.7); tone(t + 0.03, 0.07, 2000, 2000, 0.06, 'square'); },
    chipOut() { if (!ac) return; const t = ac.currentTime; noise(t, 0.015, 'highpass', 3000, 0.7, 0.5); tone(t, 0.08, 1500, 900, 0.05, 'square'); },
    // Robot tỉnh dậy: mô-tơ rè rè rồi bíp bíp
    robot() { if (!ac) return; const t = ac.currentTime; tone(t, 0.35, 180, 360, 0.07, 'sawtooth'); tone(t + 0.4, 0.08, 1400, 1400, 0.08, 'square'); tone(t + 0.52, 0.08, 1900, 1900, 0.08, 'square'); },
    // Cửa gỗ: bản lề kẽo kẹt, rồi một bước chân
    // Sang phòng: then cửa gỗ khẽ "cạch" rồi hai bước chân êm (không rít, không vút)
    door() { if (!ac) return; const t = ac.currentTime; noise(t, 0.05, 'lowpass', 700, 0.7, 0.22); tone(t, 0.1, 150, 110, 0.1, 'triangle'); tone(t + 0.22, 0.09, 105, 80, 0.07); noise(t + 0.22, 0.05, 'lowpass', 300, 0.7, 0.12); tone(t + 0.48, 0.09, 100, 78, 0.05); noise(t + 0.48, 0.05, 'lowpass', 280, 0.7, 0.08); },
    // Cổng đình: then sắt kéo, bản lề nặng rít dài
    gate() {
      if (!ac) return;
      const t = ac.currentTime;
      sweep(t, 0.2, 'bandpass', 700, 1400, 0.35); noise(t + 0.2, 0.04, 'bandpass', 2200, 2, 0.6); tone(t + 0.22, 0.25, 150, 70, 0.3); // then sắt kéo, ổ khoá bật
      creak(t + 0.4, 1.6, 152, 92, 0.2); creak(t + 0.58, 1.5, 128, 84, 0.15); // hai cánh gỗ nặng kẽo kẹt lệch nhau
      noise(t + 2.1, 0.3, 'lowpass', 300, 0.7, 0.3); tone(t + 2.1, 0.4, 90, 50, 0.25); // cánh cửa chạm tường
      sweep(t + 1.1, 1.6, 'lowpass', 160, 900, 0.16, true); // máy quay đi qua cổng
    },
    // Cuộn băng rơi xuống mặt bàn (trailer): vỏ nhựa "cạch"
    clack() { if (!ac) return; const t = ac.currentTime; tone(t, 0.06, 520, 300, 0.2, 'triangle'); noise(t, 0.03, 'bandpass', 1400, 1.5, 0.6); },

    // ===== Trailer: đồng hồ điểm giờ, tua ngược =====
    // Kim giây (khi không có nhạc nền, nhạc tự có tiếng tích‑tắc)
    // Mở màn hồi ức: chuông đồng hồ quả lắc (trầm, ngân dài: tiếng gõ búa, âm gốc, các họa âm lệch như chuông đồng thật).
    // deep: tiếng chuông lúc về tới 23:38 đêm 6/8, thấp hơn một quãng năm, ngân lâu hơn.
    bell(deep) {
      if (!ac) return;
      const t = ac.currentTime, f = deep ? 392 : 523.25, L = deep ? 1.5 : 1;
      noise(t, 0.04, 'bandpass', 3200, 1.5, 0.35);
      for (const [k, g, d] of [[0.5, 0.1, 4.5], [1, 0.22, 3.8], [1.19, 0.06, 2.2], [1.5, 0.05, 2.6], [2, 0.08, 2.0], [2.74, 0.04, 1.2], [3.76, 0.02, 0.8]]) {
        tone(t, d * L, f * k, f * k * 0.999, g); tone(t + 0.002, d * L * 0.9, f * k * 1.003, f * k * 1.002, g * 0.5);
      }
    },
    // Cuộn băng thật vào đầu băng: căn phòng bừng sáng, một hợp âm ấm ngân lên rồi lắng (bốn cuộn giả không có)
    bloom() {
      if (!ac) return;
      const t = ac.currentTime, f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(2400, t + 2.2);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 1.4); g.gain.linearRampToValueAtTime(0.0001, t + 5.5);
      for (const fr of [130.81, 196, 261.63, 329.63, 392, 523.25]) { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = fr; o.detune.value = Math.random() * 8 - 4; const og = ac.createGain(); og.gain.value = 0.18; o.connect(og).connect(f); o.start(t); o.stop(t + 5.6); }
      f.connect(g).connect(out);
      tone(t + 0.9, 3, 1046.5, 1046.5, 0.025); tone(t + 1.2, 3, 1318.5, 1318.5, 0.018);
    },
    // Mở màn hồi ức, lúc quay ngược: một nốt nền trầm ấm trôi xuống chậm (thời gian chùng lại), không rít, không vút
    drift(d) {
      if (!ac) return;
      const t = ac.currentTime, f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 1.2); g.gain.setValueAtTime(0.05, t + d - 1); g.gain.linearRampToValueAtTime(0.0001, t + d);
      for (const [f0, k] of [[196, 1], [293.66, 0.5], [98, 0.7]]) {
        const o = ac.createOscillator(), og = ac.createGain(), v = ac.createOscillator(), vg = ac.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + d);
        v.frequency.value = 4.5; vg.gain.value = f0 * 0.006; v.connect(vg).connect(o.frequency);
        og.gain.value = k; o.connect(og).connect(f); o.start(t); v.start(t); o.stop(t + d + 0.05); v.stop(t + d + 0.05);
      }
      f.connect(g).connect(out);
    },
    // Một tờ lịch về chỗ: "tạch" giấy khẽ
    page() { if (!ac) return; const t = ac.currentTime; noise(t, 0.025, 'bandpass', 2000, 1.5, 0.07); noise(t, 0.04, 'lowpass', 320, 0.7, 0.06); },
    // Mở màn hồi ức: tiếng gõ cửa gỗ (cốc), tiếng lật một tờ lịch bóc
    knock() { if (!ac) return; const t = ac.currentTime; noise(t, 0.09, 'lowpass', 900, 1.2, 0.9); tone(t, 0.12, 190, 110, 0.35, 'triangle'); noise(t + 0.004, 0.03, 'bandpass', 2200, 2, 0.25); },
    flick() { if (!ac) return; const t = ac.currentTime; noise(t, 0.06, 'highpass', 2600, 0.8, 0.22); noise(t + 0.03, 0.05, 'bandpass', 1400, 1, 0.12); },
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
    // Tìm thấy cuộn băng thật: vài nốt hộp nhạc ngân, rồi một luồng ấm dâng lên
    heart() {
      if (!ac) return;
      const t = ac.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 987.77, 783.99].forEach((f, i) => { const at = t + i * 0.24; tone(at, 1.6, f, f, 0.12); tone(at, 0.9, f * 2, f * 2, 0.03); tone(at, 0.5, f * 3.01, f * 3.01, 0.012); });
      sweep(t + 0.6, 2.4, 'lowpass', 200, 1200, 0.12, true);
    },
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

  // ===== Âm thanh nền của căn nhà =====
  // Hai tâm trạng. "Vắng" (chưa tìm thấy cuộn băng thật): nhà không người, mọi tiếng vang dài; đồng hồ tích tắc giữa
  // phòng trống, giọt nước, sàn gỗ cót két, tắc kè. "Ấm" (đã tìm thấy): tiếng vang ngắn lại như nhà có người, đâu đó
  // radio phát khẽ bài hát của hai đứa (ngoài sân nghe như từ chiếc radio, trong nhà vọng qua tường), nền nhạc ấm rất khẽ.
  // Mỗi phòng một lớp: phòng khách đồng hồ, phòng ngủ quạt máy tính và gió lùa cửa sổ, sân đình dế và gió lá.
  // Mọi tiếng tự tạo, lên lịch trước vài trăm mili giây theo đồng hồ âm thanh nên không lệch nhịp khi máy bận.
  const amb = (() => {
    const MIX = {
      lonely: { verb: 0.34, tone: 0.05, clock: { r1: 0.07, r2: 0.016, r3: 0 }, fan: { r1: 0.025, r2: 0.05, r3: 0 }, wind: { r1: 0.012, r2: 0.022, r3: 0.08 }, crick: { r1: 0.012, r2: 0.016, r3: 0.11 }, pad: 0, song: { r1: 0.006, r2: 0.014, r3: 0.035 }, drone: { r1: 0.05, r2: 0.045, r3: 0.03 } },
      // Vừa nhặt cuộn băng thật (chưa mở thư): tiếng rợn dừng, ù trầm lắng xuống, căn nhà như nín thở chờ lá thư
      hush: { verb: 0.22, tone: 0.05, clock: { r1: 0.07, r2: 0.016, r3: 0 }, fan: { r1: 0.025, r2: 0.05, r3: 0 }, wind: { r1: 0.012, r2: 0.022, r3: 0.08 }, crick: { r1: 0.012, r2: 0.016, r3: 0.11 }, pad: 0, song: { r1: 0.006, r2: 0.014, r3: 0.035 }, drone: { r1: 0.018, r2: 0.016, r3: 0.012 } },
      warm: { verb: 0.1, tone: 0.03, clock: { r1: 0.035, r2: 0.008, r3: 0 }, fan: { r1: 0.018, r2: 0.03, r3: 0 }, wind: { r1: 0, r2: 0.008, r3: 0.04 }, crick: { r1: 0.008, r2: 0.01, r3: 0.07 }, pad: 0.022, song: { r1: 0.03, r2: 0.06, r3: 0.12 }, drone: { r1: 0, r2: 0, r3: 0 } },
      // Cuộn băng thật đã vào đầu băng: căn nhà nhẹ bẫng và sáng lên. Tiếng đồng hồ, quạt lùi xa, radio hát khắp nhà.
      // (Từng có lớp ngân cao và chuông nhỏ lấp lánh rải hai tai: anh Quang nghe chói, đau đầu, đã bỏ.)
      glow: { verb: 0.16, tone: 0.02, clock: { r1: 0.022, r2: 0.005, r3: 0 }, fan: { r1: 0.01, r2: 0.018, r3: 0 }, wind: { r1: 0, r2: 0.005, r3: 0.028 }, crick: { r1: 0.005, r2: 0.007, r3: 0.045 }, pad: 0.026, song: { r1: 0.03, r2: 0.06, r3: 0.12 }, drone: { r1: 0, r2: 0, r3: 0 } },
    };
    let on = false, bus = null, room = 'r1', mood = 'lonely', radio = false, duck = 1, lift = false, lifted = false, timer = 0, L = null;
    let nextTick = 0, tickN = 0, chirp = [0, 0, 0];
    const next = {};
    const rnd = (a, z) => a + Math.random() * (z - a);
    let nb = null;
    const noiseBuf = () => {
      if (nb) return nb;
      nb = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
      const d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return nb;
    };
    const gainNode = (v) => { const g = ac.createGain(); g.gain.value = v; return g; };
    const set = (node, v, sec) => { if (node) { node.gain.cancelScheduledValues(ac.currentTime); node.gain.setTargetAtTime(v, ac.currentTime, sec || 0.8); } };
    const loop = (type, f, q, to) => { const s2 = ac.createBufferSource(); s2.buffer = noiseBuf(); s2.loop = true; s2.loopStart = Math.random(); const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s2.connect(fl).connect(to); s2.start(); return { s2, fl }; };
    // Một tiếng ngắn đi qua bus nền (không qua bộ nén của tiếng đồ vật)
    const blip = (t, dur, f0, f1, g, type, to) => { const o = ac.createOscillator(), gn = ac.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + Math.min(0.01, dur / 4)); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(gn).connect(to || bus); o.start(t); o.stop(t + dur + 0.02); };
    const hiss = (t, dur, type, f, q, g, to) => { const s2 = ac.createBufferSource(), fl = ac.createBiquadFilter(), gn = ac.createGain(); s2.buffer = noiseBuf(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); s2.connect(fl).connect(gn).connect(to || bus); s2.start(t, Math.random() * 2, dur + 0.05); };
    function build() {
      bus = gainNode(0);
      bus.connect(ac.destination);
      const send = gainNode(0.8);
      bus.connect(send).connect(verb); // tiếng nền cũng vang theo căn nhà (độ vang do tâm trạng quyết định)
      L = {};
      L.tone = gainNode(0); loop('lowpass', 170, 0.7, L.tone); L.tone.connect(bus); // tiếng ù của căn phòng im lặng
      L.fan = gainNode(0); loop('bandpass', 260, 0.9, L.fan); L.fan.connect(bus);
      const hum = ac.createOscillator(); hum.frequency.value = 118; const hg = gainNode(0.12); hum.connect(hg).connect(L.fan); hum.start();
      // Gió: dải tần và độ lớn trôi chậm theo hai dao động rất chậm
      L.wind = gainNode(0); const wAm = gainNode(0.7); const w = loop('bandpass', 520, 0.8, wAm); wAm.connect(L.wind); L.wind.connect(bus);
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.07; const lg = gainNode(260); lfo.connect(lg).connect(w.fl.frequency); lfo.start();
      const lfo2 = ac.createOscillator(); lfo2.frequency.value = 0.045; const lg2 = gainNode(0.4); lfo2.connect(lg2).connect(wAm.gain); lfo2.start();
      // Dế: tiếng ngoài sân; trong nhà nghe nghẹt qua tường
      L.crick = gainNode(0); L.crickF = ac.createBiquadFilter(); L.crickF.type = 'lowpass'; L.crickF.frequency.value = 9000; L.crickF.connect(L.crick); L.crick.connect(bus);
      L.clock = gainNode(0); L.clock.connect(bus);
      L.ev = gainNode(1); L.ev.connect(bus); // tiếng lẻ: giọt nước, cót két, tắc kè, rung cửa sổ, ổ cứng
      // Ù trầm rợn người (chỉ lúc nhà vắng): La trầm lệch nhau 0,6 Hz rung chậm, thêm một nốt cách quãng ba cung,
      // lọc trầm mở ra khép vào rất chậm như căn nhà đang thở
      L.drone = gainNode(0); const dl = ac.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 320; dl.connect(L.drone); L.drone.connect(bus);
      for (const [fr, g] of [[55, 0.5], [55.6, 0.5], [82.4, 0.28], [116.5, 0.12]]) { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = fr; const og = gainNode(g); o.connect(og).connect(dl); o.start(); }
      const dlfo = ac.createOscillator(); dlfo.frequency.value = 0.05; const dlg = gainNode(140); dlfo.connect(dlg).connect(dl.frequency); dlfo.start();
      // Nền nhạc ấm: hợp âm Đô trưởng bảy rất khẽ, phồng xẹp chậm
      L.pad = gainNode(0); const pf = ac.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = 900; const pAm = gainNode(0.8);
      for (const fr of [130.81, 196, 246.94, 329.63]) { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = fr; o.detune.value = rnd(-6, 6); const g = gainNode(0.22); o.connect(g).connect(pf); o.start(); }
      const plfo = ac.createOscillator(); plfo.frequency.value = 0.06; const plg = gainNode(0.25); plfo.connect(plg).connect(pAm.gain); plfo.start();
      pf.connect(pAm).connect(L.pad); L.pad.connect(bus);
      // Bài hát trên radio: ngoài sân nghe qua loa radio (cắt trầm, cắt cao), trong nhà vọng qua tường (chỉ còn trầm)
      L.song = gainNode(0); L.songHp = ac.createBiquadFilter(); L.songHp.type = 'highpass'; L.songLp = ac.createBiquadFilter(); L.songLp.type = 'lowpass';
      L.songDip = gainNode(1); // hạ nhỏ một chút lúc radio quay lại đầu đoạn dạo, nghe như chỉnh sóng chứ không giật
      L.songHp.connect(L.songLp).connect(L.songDip).connect(L.song); L.song.connect(bus);
    }
    let el = null, elSrc = null, wantPlay = false, startAt = null; // startAt: chỗ bắt đầu khi radio mới bật (null: ngẫu nhiên)
    const RADIO_END = 32.6; // hết đoạn dạo không lời (ban nhạc ngắt ở 32.9, lời 1 vào ở 35.77)
    function song(play) {
      if (play && !el) {
        el = new Audio(SONG.src);
        el.loop = true; el.preload = 'auto';
        try { elSrc = ac.createMediaElementSource(el); elSrc.connect(L.songHp); } catch (e) { el = null; return; }
        // Radio chỉ phát đoạn dạo đầu không lời của bài (trước lời 1): không lộ lời bài hát của cuộn băng thật.
        // Gần hết đoạn dạo thì nhỏ dần, quay lại đầu, to dần.
        el.addEventListener('loadedmetadata', () => { try { el.currentTime = startAt !== null ? startAt : Math.random() * (RADIO_END - 8); } catch (e) { /* bỏ qua */ } }, { once: true });
        let wrapping = false;
        el.addEventListener('timeupdate', () => {
          if (wrapping || el.currentTime < RADIO_END - 1.2) return;
          wrapping = true;
          L.songDip.gain.setTargetAtTime(0, ac.currentTime, 0.25);
          setTimeout(() => {
            try { el.currentTime = 0; } catch (e) { /* bỏ qua */ }
            L.songDip.gain.setTargetAtTime(1, ac.currentTime + 0.1, 0.6);
            wrapping = false;
          }, 1000);
        });
      }
      if (!el) return;
      wantPlay = play;
      if (play) el.play().catch(() => {}); // bị chặn (chưa chạm) thì lần chạm sau thử lại
      else el.pause();
    }
    addEventListener('pointerdown', () => { if (on && wantPlay && el && el.paused) el.play().catch(() => {}); });
    function mix(sec) {
      const m = MIX[mood];
      if (wet) set(wet, m.verb, sec);
      set(L.tone, m.tone * duck, sec);
      set(L.fan, m.fan[room] * duck, sec);
      set(L.wind, m.wind[room] * duck, sec);
      set(L.crick, m.crick[room] * duck, sec);
      L.crickF.frequency.setTargetAtTime(room === 'r3' ? 9000 : 2200, ac.currentTime, 0.3);
      set(L.clock, m.clock[room] * duck, sec);
      set(L.pad, m.pad * duck, sec);
      set(L.drone, m.drone[room] * duck, mood === 'warm' || mood === 'glow' ? 4 : sec);
      // Đọc lá thư sau tấm ảnh: radio ngoài sân vặn to, trong nhà nghe rõ cả lời (bớt nghẹt qua tường), tiếng nền lùi lại
      // Radio đặt ngoài sân đình: càng lại gần càng to và rõ. Phòng khách xa nhất (nhỏ, nghẹt như vọng qua hai bức
      // tường), phòng ngủ gần hơn (to hơn, bớt nghẹt), ra sân là đứng cạnh radio. Đi qua cửa thì to nhỏ, trong đục chuyển dần.
      const radioOn = radio || mood === 'warm' || mood === 'glow';
      const sv = (lift ? 0.1 : radioOn ? m.song[room] : 0) * duck;
      set(L.song, sv, lift ? 1.4 : Math.max(1.2, sec));
      if (lift) for (const n of [L.tone, L.fan, L.wind, L.clock, L.pad, L.drone]) set(n, 0, 1.5);
      const lp = lift ? 2600 : { r1: 480, r2: 1100, r3: 3600 }[room], hp = lift ? 200 : { r1: 40, r2: 90, r3: 200 }[room];
      L.songHp.frequency.setTargetAtTime(hp, ac.currentTime, lift ? 1 : 0.9);
      L.songLp.frequency.setTargetAtTime(lp, ac.currentTime, lift ? 1 : 0.9);
      song(sv > 0);
    }
    // Lên lịch tiếng trong khoảng 0,5 giây tới
    function sched() {
      if (!on || ac.state !== 'running') return;
      const t = ac.currentTime, ahead = t + 0.5;
      // Đồng hồ: tích, tắc, mỗi giây một tiếng
      if (nextTick < t) nextTick = Math.ceil(t);
      while (nextTick < ahead) {
        const tock = tickN++ % 2;
        hiss(nextTick, 0.025, 'bandpass', tock ? 2400 : 3200, 6, 0.9, L.clock);
        blip(nextTick, 0.03, tock ? 1500 : 1900, tock ? 1400 : 1800, 0.25, 'sine', L.clock);
        nextTick += 1;
      }
      // Dế: ba con, mỗi con một nhịp riêng; mỗi tiếng gáy là vài nhịp rung rất nhanh
      for (let i = 0; i < 3; i++) {
        if (chirp[i] < t) chirp[i] = t + rnd(0, 1);
        while (chirp[i] < ahead) {
          const f = [4300, 4650, 3950][i], n = 3 + (i % 2);
          for (let k = 0; k < n; k++) blip(chirp[i] + k * 0.045, 0.03, f, f * 0.995, [0.6, 0.45, 0.35][i], 'sine', L.crickF);
          chirp[i] += [0.95, 1.25, 1.6][i] + rnd(-0.08, 0.08) + (Math.random() < 0.12 ? rnd(1.5, 4) : 0);
        }
      }
      const due = (k, a, z) => { if (!next[k]) next[k] = t + rnd(a, z); if (next[k] < ahead) { const at = next[k]; next[k] = at + rnd(a, z); return at; } return 0; };
      let at;
      if (mood === 'lonely') {
        // Giọt nước rơi trong căn nhà trống (phòng khách)
        if ((at = due('drip', 7, 15)) && room === 'r1') { blip(at, 0.09, 1900, 900, 0.05 * duck, 'sine', L.ev); hiss(at, 0.02, 'bandpass', 2500, 3, 0.03 * duck, L.ev); }
        // Tắc kè: ngoài sân rõ, trong nhà nghe xa
        if ((at = due('gecko', 35, 70))) {
          const g = (room === 'r3' ? 0.09 : 0.025) * duck;
          for (let k = 0; k < 6; k++) { const tk = at + k * 0.85; hiss(tk, 0.03, 'bandpass', 1800, 2, g * 1.2, L.ev); blip(tk + 0.09, 0.14, 980, 620, g * (1 - k * 0.1), 'triangle', L.ev); }
        }
        // Gió giật làm rung cửa sổ phòng ngủ
        if ((at = due('rattle', 25, 50)) && room === 'r2') for (let k = 0; k < 7; k++) hiss(at + k * rnd(0.05, 0.12), 0.012, 'bandpass', 2000, 3, 0.05 * duck, L.ev);
      }
      // Sàn gỗ cót két (nhà vắng thì hay nghe hơn)
      if ((at = due('creak', mood === 'lonely' ? 18 : 40, mood === 'lonely' ? 40 : 90)) && room !== 'r3') {
        const o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(rnd(150, 210), at); o.frequency.linearRampToValueAtTime(rnd(110, 140), at + 0.6);
        fl.type = 'bandpass'; fl.frequency.value = 900; fl.Q.value = 5;
        g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.03 * duck, at + 0.12); g.gain.linearRampToValueAtTime(0.0001, at + 0.6);
        o.connect(fl).connect(g).connect(L.ev); o.start(at); o.stop(at + 0.65);
      }
      if (mood === 'lonely') {
        // Tiếng thì thào xa xa: gió lọc hẹp trôi lên, lệch hẳn về một bên tai
        if ((at = due('whisper', 26, 55))) {
          const s2 = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(), pn = ac.createStereoPanner ? ac.createStereoPanner() : null;
          s2.buffer = noiseBuf(); fl.type = 'bandpass'; fl.Q.value = 5;
          fl.frequency.setValueAtTime(rnd(600, 900), at); fl.frequency.linearRampToValueAtTime(rnd(1200, 1800), at + 2.6);
          g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.045 * duck * (room === 'r3' ? 0.6 : 1), at + 1.3); g.gain.linearRampToValueAtTime(0.0001, at + 3);
          let node = s2.connect(fl).connect(g);
          if (pn) { pn.pan.value = Math.random() < 0.5 ? -0.8 : 0.8; node = node.connect(pn); }
          node.connect(L.ev); s2.start(at, rnd(0, 2), 3.1);
        }
        // Một nốt cao mảnh như ai miết vành ly, chùng xuống rồi tắt
        if ((at = due('glass', 40, 80))) {
          const o = ac.createOscillator(), g = ac.createGain(), f = [1568, 1661.2, 1760][Math.floor(rnd(0, 3))];
          o.frequency.setValueAtTime(f, at); o.frequency.linearRampToValueAtTime(f * 0.985, at + 4);
          g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.012 * duck, at + 1.6); g.gain.linearRampToValueAtTime(0.0001, at + 4);
          o.connect(g).connect(L.ev); o.start(at); o.stop(at + 4.1);
        }
        // Tiếng gõ trầm ở phòng bên cạnh: hai, ba tiếng rồi im
        if ((at = due('knock', 50, 110)) && room !== 'r3') {
          const n = 2 + (Math.random() < 0.4 ? 1 : 0);
          for (let k = 0; k < n; k++) { hiss(at + k * 0.38, 0.12, 'lowpass', 160, 0.8, 0.07 * duck, L.ev); blip(at + k * 0.38, 0.14, 90, 60, 0.05 * duck, 'sine', L.ev); }
        }
      }
      // Ổ cứng máy tính lạch cạch rất khẽ
      if ((at = due('hdd', 4, 12)) && room === 'r2') for (let k = 0; k < 3; k++) hiss(at + k * 0.06, 0.008, 'highpass', 3000, 0.7, 0.025 * duck, L.ev);
    }
    return {
      start() {
        if (on || !ac || TRAILER) return;
        if (!L) build();
        on = true;
        set(bus, 2.6, 1.5); // nền khẽ hơn tiếng đồ vật nhưng vẫn nghe rõ trên loa điện thoại
        mix(1.5);
        clearInterval(timer);
        timer = setInterval(sched, 200);
      },
      // Phòng đang đứng, tâm trạng, radio ngoài sân đã bật chưa
      set(r, md, rd) {
        const moodChanged = md && md !== mood;
        room = r || room; mood = md || mood; radio = !!rd;
        tint = mood === 'lonely' ? 'dark' : 'bright';
        if (on) mix(moodChanged ? 6 : 1.2);
      },
      duck(k) { duck = k; if (on) mix(0.6); },
      // Radio to lên (lúc đọc thư) rồi nhỏ lại. Lần đầu vặn to thì phát từ tiếng piano đầu bài (đoạn dạo không lời), có tiếng rè lúc vặn.
      lift(up) {
        if (!on || lift === !!up) return;
        lift = !!up;
        if (lift) {
          sfx.glitch();
          // Lần đầu: từ tiếng piano đầu bài (radio chưa bật thì bật lên từ đầu; đang phát khẽ ngoài sân thì tua về đầu)
          // Radio đang phát (vọng từ sân vào) thì giữ nguyên chỗ, chỉ to dần lên: không nghe như phát lại từ đầu
          if (!lifted) { lifted = true; if (!el) startAt = 0; else if (el.paused) { try { el.currentTime = 0; } catch (e) { /* bỏ qua */ } } }
        }
        mix(lift ? 1.4 : 2.5);
      },
      stop() { if (!on) return; on = false; clearInterval(timer); set(bus, 0, 0.8); song(false); },
    };
  })();

  // ===== Nhạc của cuộn băng thật: chỉ tải khi cuộn thật đã vào đầu băng; đi qua bộ trộn để tăng giảm được cả trên iPhone =====
  // Phim dựng sẵn: chính video là "bản nhạc" của phim (đồng hồ, độ to, ngắt quãng đều dùng chung), nằm dưới lớp cảnh
  // trên màn TV; hết hình (B.videoEnd) thì ẩn đi nhưng vẫn phát tiếp tiếng nhạc cho thẻ kết và danh đề.
  const audio = B.video ? Object.assign(document.createElement('video'), { className: 'tape-video', playsInline: true }) : new Audio();
  audio.preload = 'none';
  let mix = null, wallT0 = 0, useWall = false;
  // ===== Bị gián đoạn: cuộc gọi đến, chuyển ứng dụng, khoá máy =====
  // Trang bị ẩn: tắt tiếng, dừng nhạc phim và danh đề (không kêu ngầm, phim không chạy mất đoạn). Quay lại thì chạy tiếp đúng chỗ.
  // Hệ thống tự dừng nhạc phim (cuộc gọi hiện đè lên trang): danh đề dừng theo. Ảnh trong phim chạy theo giây của bản nhạc nên tự đứng chờ.
  // Đánh thức lại khi trang hiện lại, khi bộ âm thanh đổi trạng thái và ở mỗi lần chạm (iPhone chỉ cho phát lại trong lúc chạm).
  let filmOn = false, rollAnim = null;
  function wake() {
    if (document.hidden) return;
    if (ac && ac.state !== 'running') ac.resume().catch(() => {});
    if (filmOn && audio.paused) audio.play().catch(() => {});
    else if (rollAnim && rollAnim.playState === 'paused') rollAnim.play();
  }
  // Quay lại sau khi chuyển ứng dụng (nhắn tin, cuộc gọi): iPhone hay không cho phát tiếp khi chưa chạm, hình video còn
  // có khi đen tới lúc tua. Nên khi trang hiện lại mà phim (hay đoạn ghi thêm) vẫn đứng: hiện nút "Xem tiếp" giữa màn
  // hình, chạm là phát (lần chạm cho phép phát tiếng) và nhích nhẹ vị trí để máy vẽ lại khung hình.
  const redraw = (v) => { try { v.currentTime = Math.max(0, v.currentTime - 0.05); } catch (e) { /* bỏ qua */ } };
  function resumeAsk(v) {
    let b = $('resume');
    if (!b) {
      b = document.createElement('button');
      b.id = 'resume';
      b.type = 'button';
      b.className = 'end-btn resume-btn';
      b.textContent = '▶ Xem tiếp';
      document.body.appendChild(b);
    }
    b.hidden = false;
    b.onclick = () => { b.hidden = true; redraw(v); v.play().catch(() => {}); };
    const gone = () => { b.hidden = true; v.removeEventListener('playing', gone); };
    v.addEventListener('playing', gone);
  }
  function checkResume() {
    if (document.hidden) return;
    const tv2 = $('ts-vid'), tsOpen = !$('ts-player').hidden;
    for (const [v, on] of [[audio, filmOn], [tv2, tsOpen]]) {
      if (!on || v.ended) continue;
      if (v.paused) resumeAsk(v);
      else if (v.style.visibility !== 'hidden') redraw(v); // đoạn chỉ còn nhạc (danh đề): khỏi nhích, tiếng khỏi khựng
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { wake(); setTimeout(checkResume, 1200); return; }
    if (!$('ts-player').hidden) $('ts-vid').pause();
    if (ac) ac.suspend().catch(() => {});
    if (filmOn) audio.pause();
    if (rollAnim) rollAnim.pause();
  });
  addEventListener('pointerdown', wake, true);
  audio.addEventListener('pause', () => { if (filmOn && rollAnim) rollAnim.pause(); });
  audio.addEventListener('playing', () => { if (filmOn && rollAnim && rollAnim.playState === 'paused') rollAnim.play(); });
  // ===== Đồng hồ của phim (nhạc và ảnh của cuộn băng thật đã duyệt 31/10/2026: chỉ làm cho khớp hơn, không đổi mốc) =====
  // Là vị trí bản nhạc ĐANG NGHE, không phải vị trí trình duyệt đang đọc:
  // - trừ độ trễ ra loa / tai nghe (AirPods, loa Bluetooth trễ 0,15–0,3 giây: không trừ thì ảnh chuyển trước phách);
  // - nội suy giữa hai lần trình duyệt cập nhật currentTime (có máy chỉ cập nhật vài lần mỗi giây);
  // - nhạc khựng lại để tải (mạng chậm) thì đồng hồ đứng, ảnh đứng chờ, chuyển động trên TV cũng dừng theo.
  // Nhạc không phát được thì theo giờ máy.
  let ctLast = -1, ctAt = 0;
  function clock() {
    if (useWall) return SONG.from + SEEK + (performance.now() - wallT0) / 1000;
    const ct = audio.currentTime, ms = performance.now();
    if (ct !== ctLast) { ctLast = ct; ctAt = ms; }
    const moving = !audio.paused && !stalled;
    const est = moving ? ct + Math.min(0.25, (ms - ctAt) / 1000) * (audio.playbackRate || 1) : ct;
    const lat = ac ? Math.min(0.5, (ac.outputLatency || 0) + (ac.baseLatency || 0)) : 0;
    return est - lat;
  }
  const at = (t) => new Promise((res) => { const f = () => (clock() >= t ? res() : requestAnimationFrame(f)); f(); });
  let stalled = false;
  const stall = (on) => { stalled = on; const c = $('content'); if (c) c.classList.toggle('stall', on && filmOn); };
  audio.addEventListener('waiting', () => stall(true));
  audio.addEventListener('stalled', () => { if (audio.readyState < 3) stall(true); });
  audio.addEventListener('playing', () => stall(false));
  audio.addEventListener('canplay', () => { if (!audio.paused) stall(false); });

  // ===== Tiến sát vào màn hình TV (phóng to để màn hình gần kín màn) =====
  const tv = $('tv'), screen = $('screen');
  let zoomed = false;
  // now: tính lại cho khớp màn hình mới (xoay máy) mà không chạy lại hiệu ứng phóng to. Trước đây mỗi lần xoay tính lại
  // vài lần, lần nào TV cũng thu về rồi phóng to lại 1,8 giây: khung hình phồng ra từng nấc.
  function zoom(on, now) {
    zoomed = on;
    if (!on) { tv.style.transform = ''; return; }
    tv.style.transition = 'none';
    tv.style.transform = '';
    const t = tv.getBoundingClientRect(), s = screen.getBoundingClientRect();
    const k = Math.min(innerWidth / s.width, innerHeight / s.height) * 0.96;
    const cx = s.left + s.width / 2 - t.left, cy = s.top + s.height / 2 - t.top;
    const tx = innerWidth / 2 - t.left - cx * k, ty = innerHeight / 2 - t.top - cy * k;
    const to = 'translate(' + tx + 'px,' + ty + 'px) scale(' + k + ')';
    if (now) { tv.style.transform = to; void tv.offsetWidth; tv.style.transition = ''; return; }
    void tv.offsetWidth;
    tv.style.transition = '';
    tv.style.transform = to;
  }

  // Hiệu ứng chạy xong thì gỡ luôn class: phòng khách bị ẩn rồi hiện lại (chuyển phòng) thì trình duyệt chạy lại
  // mọi animation còn gắn trên TV, TV sẽ giật một cái và loé vạch sáng như ma.
  tv.querySelector('.tv-body').addEventListener('animationend', (e) => e.currentTarget.classList.remove('shake', 'shake2'));
  $('crt-line').addEventListener('animationend', (e) => { if (e.animationName === 'line-off') e.currentTarget.classList.remove('off'); });
  $('content').addEventListener('animationend', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('glitch'); });

  // ===== Dựng từng cảnh =====
  const content = $('content');
  function build(s, dur) {
    const el = document.createElement('div');
    el.className = 'shot ' + s.kind + (s.alt ? ' alt' : '') + (s.end ? ' fin' : '');
    el.style.setProperty('--dur', dur + 900 + 'ms');
    const first = s.n && s.n[0] ? src(s.n[0]) : '';
    const bg = first ? '<img class="bg" alt="" src="' + first + '" />' : '';
    if (s.kind === 'title') el.innerHTML = '<h2></h2><p></p>';
    else if (s.kind === 'kb') el.innerHTML = bg + '<img class="fg" alt="" src="' + first + '" />';
    else if (s.kind === 'duo' || s.kind === 'trio') el.innerHTML = bg + s.n.map((f) => '<div class="card"><img alt="" src="' + src(f) + '" /></div>').join('');
    else if (s.kind === 'pola') el.innerHTML = bg + '<div class="card"><img alt="" src="' + first + '" /><b></b></div>';
    else if (s.kind === 'video') el.innerHTML = '<video class="vid" muted playsinline autoplay preload="auto"></video>';
    // Chữ đưa vào bằng textContent: chú thích có ký tự lạ cũng không vỡ trang
    if (s.kind === 'title') { el.querySelector('h2').textContent = s.h; el.querySelector('p').textContent = s.p; }
    if (s.kind === 'pola') el.querySelector('b').textContent = s.note;
    if (s.kind === 'video') { const v = el.querySelector('video'); v.src = src(s.video); v.play().catch(() => {}); }
    return el;
  }
  // Phụ đề: cảnh dài thì gõ từng chữ (xong trước nửa cảnh), cảnh ngắn ở điệp khúc thì hiện cả câu cho kịp đọc
  async function caption(el, text, dur) {
    if (!text) return;
    const c = document.createElement('div');
    c.className = 'cap';
    el.appendChild(c);
    if (dur < 3600) { c.textContent = text; c.classList.add('now'); return; }
    await sleep(700);
    const per = Math.min(38, (dur * 0.5 - 700) / text.length);
    for (const ch of text) { if (!el.isConnected) return; c.textContent += ch; await sleep(per); }
  }
  // Thẻ "Ngày thứ … bên nhau": con số chạy từ ngày đầu tiên lên tới hôm nay
  function countUp(h) {
    const t0 = performance.now(), d = 2600;
    const f = (now) => {
      const k = Math.min(1, (now - t0) / d);
      h.textContent = 'Ngày thứ ' + Math.max(1, Math.round(days * (1 - Math.pow(1 - k, 3))));
      if (k < 1 && h.isConnected) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
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
  // Phim dựng từ ảnh: mỗi cảnh vào đúng giây đã tính trong PLAN (bám theo nhạc)
  async function play() {
    let prev = null;
    const list = PLAN.shots;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      await at(s.t);
      const dur = ((list[i + 1] ? list[i + 1].t : PLAN.end) - s.t) * 1000;
      const el = build(s, dur);
      content.appendChild(el);
      transition(s.fx, el);
      caption(el, s.cap, dur);
      if (s.end) countUp(el.querySelector('h2'));
      // Cảnh cũ còn mờ dần thêm 1 giây dưới cảnh mới: tắt phụ đề của nó ngay để hai câu không chồng lên nhau
      if (prev) { const p = prev, c = p.querySelector('.cap'); if (c) c.classList.add('gone'); setTimeout(() => p.remove(), 1000); }
      prev = el;
    }
    await at(PLAN.end);
  }
  // Nạp nhạc phim (hoặc phim dựng sẵn). Phim chia đoạn (.m3u8): trình duyệt tự phát được HLS (Safari, iPhone, Android)
  // thì dùng luôn; còn lại (Chrome máy tính, Firefox) dùng hls.js trong story/vendor, chỉ tải khi cần
  let filmLoad = null, wantFilm = false, hlsLib = null;
  function attach(el, url, viaHls) {
    el.preload = 'auto';
    if (!/\.m3u8$/.test(url) || (!viaHls && el.canPlayType('application/vnd.apple.mpegurl'))) { el.src = url; el.load(); return Promise.resolve(); }
    hlsLib = hlsLib || new Promise((res) => {
      const s = document.createElement('script');
      s.src = 'vendor/hls.light.min.js';
      s.onload = s.onerror = () => res(window.Hls && Hls.isSupported() ? Hls : null);
      document.head.appendChild(s);
    });
    return hlsLib.then((H) => {
      // iPhone (iOS 17.1+) chạy hls.js bằng ManagedMediaSource: phải tắt phát qua AirPlay thì mới mở được
      if (H) { if (window.ManagedMediaSource) el.disableRemotePlayback = true; const h = new H({ maxBufferLength: 40 }); h.loadSource(url); h.attachMedia(el); } else if (!viaHls) el.src = url;
    });
  }
  function loadFilm() {
    if (!filmLoad) filmLoad = attach(audio, B.video || SONG.src);
    return filmLoad;
  }
  // iPhone chỉ cho video có tiếng phát khi đang chạm: "mồi" video ngay lúc bấm nút nguồn, lát sau mới chiếu
  let primed = false;
  function primeVideo() {
    if (!B.video || primed) return;
    primed = true;
    preload();
    audio.play().then(() => { if (!wantFilm) audio.pause(); }).catch(() => {});
  }

  // ===== Bật TV, chiếu, tắt TV, danh đề =====
  let tcTimer = 0;
  async function powerOn() {
    if (started) return;
    started = true;
    audioOn();
    amb.stop();
    sfx.click();
    $('hint').classList.add('out');
    await sleep(260);
    tv.classList.add('on');
    $('room').classList.add('watching');
    zoom(true);
    sfx.on();
    $('crt-line').classList.add('on');
    $('static').classList.add('on');
    if (!mix) mix = music(audio, 0);
    await sleep(1500);
    // Phim thật: hết nhiễu lúc bật máy thì chỉ còn một lớp nhiễu rất mờ, vạch quét mảnh, không nhấp nháy: vẫn thấy hoài
    // cổ như băng cũ mà hình vẫn nét (nhiễu phủ trong game, không in vào video nên file nhẹ, ảnh gốc không bị nhoè)
    $('static').classList.replace('on', 'faint');
    tv.classList.add('real');
    document.body.classList.add('film-real');
    $('osd').hidden = false;
    $('osd-date').textContent = pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear();
    // Đồng hồ góc TV đếm theo phim (phim dừng thì đứng), không theo giờ máy: phim kẹt mà số vẫn chạy thì nhìn như treo
    tcTimer = setInterval(() => {
      const sec = Math.max(0, Math.floor(clock() - SEEK));
      $('osd-tc').textContent = '00:' + pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
    }, 250);
    {
      if (B.video) { audio.style.visibility = ''; $('screen').insertBefore(audio, content); await loadFilm(); }
      // Trong lúc màn hình còn nhiễu: chờ nhạc đủ để phát liền và ảnh tải xong (tối đa 3 giây), rồi mới bắt đầu
      if (audio.readyState < 1) await new Promise((res) => { audio.addEventListener('loadedmetadata', res, { once: true }); setTimeout(res, 4000); });
      const enough = audio.readyState >= 3 ? null : new Promise((res) => { audio.addEventListener('canplay', res, { once: true }); });
      await Promise.race([Promise.all([enough, ready]), sleep(3000)]);
      try { audio.currentTime = SONG.from + SEEK; } catch (e) { /* bỏ qua */ }
      wallT0 = performance.now();
      useWall = false;
      wantFilm = true;
      // Phim dựng sẵn mà máy không cho phát (iPhone chặn vì không đúng lúc chạm): không chạy mù theo giờ máy trên màn đen,
      // mà đứng chờ và hiện nút "Xem tiếp" (chạm là phát). Chỉ bản nhạc + ảnh mới chạy theo giờ máy được.
      let played = true;
      await audio.play().catch(() => { played = false; });
      if (!played && !B.video) useWall = true;
      filmOn = !useWall;
      if (!played && B.video) resumeAsk(audio);
      mix.to(SONG.vol, 1.2);
      await play();
    }
    await powerOff();
    // Danh đề cuộn lên đúng lúc ban nhạc vào lại ở điệp khúc cuối
    if (SONG.credits) await Promise.race([at(SONG.credits), sleep(9000)]);
    await credits();
    await bonus();
    await finale();
  }

  // ===== Đoạn ghi thêm ở cuối băng: lời tâm sự anh Quang quay (B.tamSu, chia đoạn HLS) =====
  // Hết danh đề: màn tối, góc màn hình nháy "● REC", một dòng chữ và nút Xem (em tự chạm thì mới phát: iPhone chỉ cho
  // phát tiếng khi chạm, và lời tâm sự thì để em chủ động mở). Xem xong (hoặc Để sau) mới tới màn kết; ở màn kết còn
  // nút "Xem lại lời anh". Video chỉ bắt đầu tải lúc danh đề đang chạy.
  let tsLoad = null;
  const tsPrep = () => { if (B.tamSu && !tsLoad) tsLoad = attach($('ts-vid'), B.tamSu); return tsLoad; };
  function tamSu() {
    return new Promise((res) => {
      const pl = $('ts-player'), v = $('ts-vid');
      tsPrep();
      pl.hidden = false;
      void pl.offsetWidth;
      pl.classList.add('on');
      // Gọi play() ngay trong lần chạm (hàm này chạy đồng bộ từ onclick): iPhone chỉ cho phát tiếng khi đang chạm
      if (v.currentTime > 0.5) { try { v.currentTime = 0; } catch (e) { /* bỏ qua */ } }
      v.play().catch(() => {});
      setTimeout(() => $('ts-close').classList.add('on'), 2500);
      // Phòng khi máy không chịu phát (iPhone từng kẹt ở đoạn đầu): 7 giây chưa chạy thì đổi sang hls.js (nếu đang để
      // trình duyệt tự phát) và hiện nút "Chạm để xem" (lần chạm mới cho phép phát tiếng); chạm rồi vẫn không chạy thì sang màn kết
      const tap = $('ts-tap');
      let dog = 0, tries = 0;
      const check = () => {
        if (v.currentTime > 0.3 || v.ended) return;
        if (document.hidden) { dog = setTimeout(check, 3000); return; }
        if (tries++) { done(); return; }
        if (v.src && /\.m3u8/.test(v.src)) { v.removeAttribute('src'); v.load(); tsLoad = attach(v, B.tamSu, true); }
        tap.hidden = false;
        dog = setTimeout(check, 20000);
      };
      dog = setTimeout(check, 7000);
      tap.onclick = () => { tap.hidden = true; v.play().catch(() => {}); clearTimeout(dog); dog = setTimeout(check, 10000); };
      const done = () => {
        clearTimeout(dog);
        tap.hidden = true;
        tap.onclick = null;
        v.removeEventListener('ended', done);
        $('ts-close').onclick = null;
        v.pause();
        pl.classList.remove('on');
        $('ts-close').classList.remove('on');
        setTimeout(() => { pl.hidden = true; res(); }, 900);
      };
      v.addEventListener('ended', done);
      $('ts-close').onclick = done;
    });
  }
  // Xem thử riêng đoạn này (không phải chơi hết game, xem hết phim): ?thu=tamsu
  if (/[?&]thu=tamsu\b/.test(location.search)) addEventListener('load', () => setTimeout(async () => { $('room').style.opacity = '0'; await bonus(); await finale(); }, 600));
  async function bonus() {
    if (!B.tamSu) return;
    const box = $('bonus');
    box.hidden = false;
    void box.offsetWidth;
    box.classList.add('on');
    tsPrep();
    for (const id of ['ts-line', 'ts-go', 'ts-skip']) { await sleep(1100); $(id).classList.add('on'); }
    await new Promise((res) => {
      $('ts-go').onclick = () => { $('ts-go').onclick = $('ts-skip').onclick = null; tamSu().then(res); };
      $('ts-skip').onclick = () => { $('ts-go').onclick = $('ts-skip').onclick = null; res(); };
    });
    box.classList.remove('on');
    await sleep(800);
    box.hidden = true;
  }

  // Tắt TV; nhạc vẫn chạy nhỏ dần cho danh đề
  async function powerOff() {
    clearInterval(tcTimer);
    if (B.video) audio.style.visibility = 'hidden'; // hình đã hết (thẻ kết đang che); tiếng nhạc vẫn phát tiếp
    tv.classList.remove('real');
    document.body.classList.remove('film-real');
    if (mix) mix.to(SONG.vol * 0.8, 2);
    sfx.off();
    $('osd').hidden = true;
    content.classList.add('squash');
    $('static').classList.remove('soft', 'on', 'faint');
    $('crt-line').classList.remove('on');
    void $('crt-line').offsetWidth;
    $('crt-line').classList.add('off');
    await sleep(900);
    tv.classList.remove('on');
    content.classList.remove('squash');
    content.innerHTML = '';
    zoom(false);
    await sleep(1200);
    $('room').style.transition = 'opacity 1.6s';
    $('room').style.opacity = '0';
    await sleep(1000);
  }

  // Danh đề cuối phim: cuộn từ dưới lên như cuối một bộ phim, chậm dần rồi dừng ở dòng "Hết cuộn băng số 1" giữa màn
  // hình đúng lúc nhạc hết; có nút "Bỏ qua". (Thẻ "Ngày thứ … bên nhau" vừa hiện trên TV nên danh đề không nhắc lại.)
  async function credits() {
    tsPrep();
    const box = $('credits'), roll = $('roll');
    roll.replaceChildren();
    const add = (cls, text) => { const d = document.createElement('div'); d.className = cls; d.textContent = text || ''; roll.appendChild(d); return d; };
    const row = (role, name) => { const d = add('c-row'); const r = document.createElement('small'); r.textContent = role; const n = document.createElement('b'); n.textContent = name; d.append(r, n); };
    add('c-title', 'Băng số 1');
    add('c-sub', 'Hồi ức');
    for (const c of B.credits || []) {
      if (c.gap) add('c-gap');
      else if (c.line) add('c-line', c.line);
      else if (c.music) { if (SONG.title) row('Âm nhạc', SONG.title + (SONG.artist ? '\n' + SONG.artist : '')); }
      else if (c.love) { if (B.love) { add('c-gap'); add('c-love-h', 'Lời yêu thương'); add('c-love', B.love); } }
      else if (c.role) row(c.role, c.name || '');
    }
    const endEl = add('c-end', 'Hết cuộn băng số 1');
    box.hidden = false;
    void box.offsetWidth;
    box.classList.add('on');
    const vh = box.clientHeight, stopY = vh / 2 - (endEl.offsetTop + endEl.offsetHeight / 2), dist = vh - stopY;
    // Thời gian cuộn: vừa khít phần nhạc còn lại (bài của cuộn băng thật), không thì khoảng 40 px mỗi giây
    let sec = Math.max(28, dist / 40);
    if (SONG.credits && isFinite(audio.duration) && !useWall) sec = Math.max(28, audio.duration - audio.currentTime - 2.5);
    // Cuộn đều, 3 giây cuối chậm dần rồi dừng (vận tốc khớp nhau ở chỗ nối)
    const tail = Math.min(3, sec * 0.2), v = dist / (sec - tail + tail / 1.72), d1 = dist - v * tail / 1.72;
    const anim = roll.animate([
      { transform: 'translateY(' + vh + 'px)', easing: 'linear' },
      { transform: 'translateY(' + (vh - d1) + 'px)', offset: (sec - tail) / sec, easing: 'cubic-bezier(0, 0, .58, 1)' },
      { transform: 'translateY(' + stopY + 'px)' },
    ], { duration: sec * 1000, fill: 'forwards' });
    // Danh đề bám theo đồng hồ của nhạc từng khung hình (nhạc khựng thì danh đề đứng, nhạc hết đúng lúc dòng cuối dừng
    // giữa màn). Không có nhạc thì tự cuộn theo giờ máy, dừng / chạy theo lúc ẩn hiện trang.
    let driving = SONG.credits && !useWall;
    if (driving) {
      anim.pause();
      const a0 = clock();
      const drive = () => {
        if (!driving) return;
        const t = (clock() - a0) * 1000;
        if (t >= sec * 1000) { driving = false; anim.finish(); return; }
        anim.currentTime = Math.max(0, t);
        requestAnimationFrame(drive);
      };
      requestAnimationFrame(drive);
    } else rollAnim = anim;
    const skip = $('skip');
    skip.onclick = () => { driving = false; anim.finish(); };
    setTimeout(() => box.classList.add('skippable'), 4000);
    await anim.finished.catch(() => {});
    rollAnim = null;
    box.classList.remove('skippable');
    await sleep(1600);
    filmOn = false;
    if (mix) mix.to(0, 2.4);
    setTimeout(() => audio.pause(), 3500);
    box.classList.remove('on');
    await sleep(1400);
    box.hidden = true;
  }

  // Kết: "Đây là nơi mọi thứ bắt đầu." và hai nút
  async function finale() {
    $('end').hidden = false;
    $('end-1').textContent = '';
    const ids = ['end-2', 'end-go', 'end-again'];
    if (B.tamSu) { $('end-ts').hidden = false; $('end-ts').onclick = () => tamSu(); ids.push('end-ts'); }
    for (const id of ids) { await sleep(1100); $(id).classList.add('on'); }
  }

  // ===== Băng giả (hoi-uc-room.js): TV bật nhanh, tiến sát màn hình, gõ từng câu manh mối rồi tắt, nhả băng =====
  let busy = false, realIn = false;
  async function playFake(tape) {
    if (busy || started) return;
    busy = true;
    audioOn();
    amb.duck(0.3);
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
    $('static').classList.remove('soft', 'on', 'faint');
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
    amb.duck(1);
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
    $('static').classList.remove('soft', 'on', 'faint');
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
      $('static').classList.remove('soft', 'on', 'faint');
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
    sfx, audioOn, music, playFake, amb,
    busy: () => busy || started,
    armReal(on) { realIn = on; if (on) { $('hint').textContent = HINTS[presses] || HINTS[0]; preload(); } },
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
    primeVideo();
    preload().then(powerOn);
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
